import { Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * 음성 파일을 socket으로 전송
 */
export async function sendAudioFile(page: Page, filename: string) {
  try {
    const audioPath = path.join(__dirname, '../../fixtures/audio', filename);
    const audioData = await fs.readFile(audioPath);

    await page.evaluate(data => {
      if (window.socket && typeof window.socket.emit === 'function') {
        window.socket.emit('audio_chunk', data, window.roomName);
      } else {
        throw new Error('Socket not initialized');
      }
    }, audioData);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error sending audio file: ${error.message}`);
    } else {
      console.error('Unknown error occurred while sending audio file');
    }
    throw error;
  }
}

/**
 * 생성된 방의 URL을 가져옴
 */
export async function getRoomUrl(page: Page): Promise<string> {
  try {
    const roomCode = await page.evaluate(() => {
      const element = document.querySelector('.room-code');
      return element ? element.textContent : null;
    });

    if (!roomCode) {
      throw new Error('Room code not found');
    }

    return `http://localhost:3000/call/${roomCode}`;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error getting room URL: ${error.message}`);
    } else {
      console.error('Unknown error occurred while getting room URL');
    }
    throw error;
  }
}

/**
 * 모달이 나타날 때까지 대기
 */
export async function waitForModal(page: Page): Promise<void> {
  try {
    await page.waitForSelector('.modal-content', { timeout: 10000 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Modal not found: ${error.message}`);
    } else {
      console.error('Unknown error occurred while waiting for modal');
    }
    throw error;
  }
}

/**
 * 지정된 시간만큼 대기
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 방 참여 상태 확인
 */
export async function checkRoomJoined(page: Page): Promise<boolean> {
  try {
    await Promise.race([
      page.waitForSelector('.call-voice-screen'),
      page.waitForSelector('.chat-box'),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * 채팅 메시지가 성공적으로 전송되었는지 확인
 */
export async function verifyChatMessageSent(
  page: Page,
  message: string
): Promise<boolean> {
  try {
    await page.waitForSelector(`.chat-message:has-text("${message}")`);
    return true;
  } catch {
    return false;
  }
}
