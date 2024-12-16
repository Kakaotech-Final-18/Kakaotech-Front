import { Page } from '@playwright/test';

export async function googleLogin(page: Page) {
  await page.waitForURL('https://accounts.google.com/');

  // 이메일 입력
  await page.fill('input[type="email"]', 'parrotalk1001@gmail.com');
  await page.click('button:has-text("다음")');

  // 비밀번호 입력
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  await page.fill('input[type="password"]', 'sofiajimmy1001');
  await page.click('button:has-text("다음")');

  try {
    // 추가 보안 확인이 있을 경우 대비
    await page.waitForSelector('text=계정 보호', { timeout: 3000 });
    await page.click('text=건너뛰기');
  } catch (e) {
    console.log('No additional security check required');
  }

  // 로그인 완료 후 리다이렉션 대기
  await page.waitForURL('/call/home', { timeout: 30000 });
}
