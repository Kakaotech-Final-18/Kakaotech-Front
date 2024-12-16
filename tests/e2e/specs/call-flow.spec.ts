import { test, expect, BrowserContextOptions } from '@playwright/test';
import { Socket } from 'socket.io-client';
import path from 'path';
import fs from 'fs/promises';
import { googleLogin } from '../helpers/auth';
import {
  sendAudioFile,
  getRoomUrl,
  waitForModal,
  delay,
  verifyChatMessageSent,
} from '../helpers/utils';

test.describe('Voice and Chat Call Flow', () => {
  let roomUrl: string;

  test.beforeAll(async () => {
    // 오디오 파일 존재 확인
    const audioFiles = ['greeting.wav', 'suggest.wav', 'agree.wav'];
    for (const file of audioFiles) {
      const filePath = path.join(__dirname, '../../fixtures/audio', file);
      try {
        await fs.access(filePath);
      } catch (error) {
        console.error(`Missing audio file: ${file}`);
        throw error;
      }
    }
  });

  test('Complete call flow test', async ({ browser }) => {
    // contextOptions 수정: permissions를 string[]로 변경
    const contextOptions: BrowserContextOptions = {
      permissions: ['microphone'],
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    const user1Context = await browser.newContext(contextOptions);
    const user2Context = await browser.newContext(contextOptions);
    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    // 1단계: 사용자 1 구글 로그인
    await test.step('User 1: Google Login', async () => {
      await user1Page.goto('/');
      await expect(user1Page.locator('.google-login')).toBeVisible();
      await user1Page.click('.google-login');
      await googleLogin(user1Page);
    });

    // 2단계: 사용자 1 방 생성 및 공유
    await test.step('User 1: Create and share room', async () => {
      await expect(user1Page.locator('.create-room-button')).toBeVisible();
      await user1Page.click('.create-room-button');
      await user1Page.waitForSelector('.room-link-container');
      await user1Page.click('.share-button');

      roomUrl = await getRoomUrl(user1Page);
      expect(roomUrl).toBeTruthy();
    });

    // 3단계: 사용자 1 음성 통화 선택 및 입장
    await test.step('User 1: Join voice call', async () => {
      // 소켓 초기화 확인
      await user1Page.evaluate(() => {
        const socket = window.socket as Socket;
        window.roomName = window.location.pathname.split('/').pop() || '';
      });

      await user1Page.click('.join-room-button');
      await expect(user1Page.locator('.call-option')).toBeVisible();
      await user1Page.click('.call-option:has-text("음성 통화")');
      await user1Page.click('.confirm-button');
      await expect(user1Page.locator('.call-voice-screen')).toBeVisible();
    });

    // 4단계: 사용자 2 링크로 접속
    await test.step('User 2: Access shared link', async () => {
      await user2Page.goto(`http://localhost:3000${roomUrl}`);
      await expect(
        user2Page.locator('.call-setting-outer-container')
      ).toBeVisible();
    });

    // 5단계: 사용자 2 채팅 통화 선택 및 입장
    await test.step('User 2: Join chat call', async () => {
      // 소켓 초기화 확인
      await user2Page.evaluate(() => {
        const socket = window.socket as Socket;
        window.roomName = window.location.pathname.split('/').pop() || '';
      });

      await user2Page.click('.call-option:has-text("채팅 통화")');
      await user2Page.click('.confirm-button');
      await expect(user2Page.locator('.chat-box')).toBeVisible();
    });

    // 6단계: 사용자 1 입장 모달 확인
    await test.step('User 1: Handle welcome modal', async () => {
      await waitForModal(user1Page);
      await user1Page.click('.modal-close-button');
    });

    // 7-11단계: 대화 진행
    await test.step('Conversation flow', async () => {
      await delay(1000);

      // 사용자 1: "안녕하세요. 사용자 2"
      await sendAudioFile(user1Page, 'greeting.wav');
      await delay(2000);

      // 사용자 2: "안녕하세요"
      await user2Page.fill('.chat-input', '안녕하세요.');
      await user2Page.click('.send-button');
      await verifyChatMessageSent(user2Page, '안녕하세요.');
      await delay(1000);

      // 사용자 1: "오늘 판교역 6시에 만날까요?"
      await sendAudioFile(user1Page, 'suggest.wav');
      await delay(2000);

      // 사용자 2: "아니요. 판교역 7시에 만나요."
      await user2Page.fill('.chat-input', '아니요. 판교역 7시에 만나요.');
      await user2Page.click('.send-button');
      await verifyChatMessageSent(user2Page, '아니요. 판교역 7시에 만나요.');
      await delay(1000);

      // 사용자 1: "알겠습니다. 끊을게요."
      await sendAudioFile(user1Page, 'agree.wav');
      await delay(2000);
    });

    // 12-13단계: 통화 종료
    await test.step('End call process', async () => {
      await user2Page.click('.call-control-end-button');
      await waitForModal(user1Page);
      await user1Page.click('.modal-close-button');
    });

    // 14단계: 통화 요약 확인
    await test.step('Verify call summary', async () => {
      await user1Page.waitForSelector('.summary-todo');
      await user2Page.waitForSelector('.summary-todo');

      const user1Summary = await user1Page.textContent('.summary-todo');
      const user2Summary = await user2Page.textContent('.summary-todo');

      expect(user1Summary).toContain('판교역');
      expect(user1Summary).toContain('7시');
      expect(user2Summary).toContain('판교역');
      expect(user2Summary).toContain('7시');
    });

    // 15단계: 사용자 1 todo 체크 및 저장
    await test.step('User 1: Handle todos', async () => {
      await user1Page.evaluate(() => {
        const checkboxes = document.querySelectorAll<HTMLInputElement>(
          '.summary-todo input[type="checkbox"]'
        );
        checkboxes.forEach(checkbox => {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });

      await user1Page.click('.select-button');
    });

    // 16-17단계: 사용자 1 마이페이지 확인
    await test.step('User 1: Verify mypage', async () => {
      await user1Page.click('.header-button');
      await user1Page.waitForSelector('.mypage-container');

      const myPageContent = await user1Page.textContent('.chat-card');
      expect(myPageContent).toContain('판교역');
      expect(myPageContent).toContain('7시');

      const isChecked = await user1Page.evaluate(() => {
        const checkbox = document.querySelector<HTMLInputElement>(
          '.task-item input[type="checkbox"]'
        );
        return checkbox?.checked ?? false;
      });
      expect(isChecked).toBe(true);
    });

    await user1Context.close();
    await user2Context.close();
  });
});
