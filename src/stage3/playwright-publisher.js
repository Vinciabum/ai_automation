'use strict';

const { chromium } = require('playwright');

const NAVER_LOGIN_URL = 'https://nid.naver.com/nidlogin.login';
const NAVER_BLOG_WRITE_URL = 'https://blog.naver.com/PostWriteForm.naver';

// 봇 감지 방지: 랜덤 지연 (ms)
function randomDelay(min = 500, max = 1500) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function createPlaywrightPublisher({ naverId, naverPassword, headless = true }) {
  if (!naverId || !naverPassword) throw new Error('Naver credentials are required');

  async function publishToBlog(post) {
    const { title, body, tags = [] } = post;

    const browser = await chromium.launch({ headless, slowMo: 50 });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
      // 1. 네이버 로그인
      await page.goto(NAVER_LOGIN_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(randomDelay());

      await page.fill('#id', naverId);
      await page.waitForTimeout(randomDelay(200, 500));
      await page.fill('#pw', naverPassword);
      await page.waitForTimeout(randomDelay(200, 500));
      await page.click('.btn_login');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

      // 2. 블로그 글쓰기 페이지
      await page.goto(NAVER_BLOG_WRITE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('iframe[id*="editor"]', { timeout: 10000 });

      // 3. 제목 입력
      await page.fill('.se-title-input', title);
      await page.waitForTimeout(randomDelay());

      // 4. 본문 입력 (Smart Editor iframe)
      const editorHandle = await page.$('iframe[id*="editor"]');
      if (editorHandle) {
        const frame = await editorHandle.contentFrame();
        if (frame) await frame.fill('.se-content', body);
      }

      // 5. 태그 입력
      for (const tag of tags) {
        await page.fill('.se-tag-input', tag);
        await page.waitForTimeout(randomDelay(200, 400));
        await page.click('.se-tag-add-button');
      }

      // 6. 발행
      await page.click('.publish_btn');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

      const publishedUrl = page.url();
      return { url: publishedUrl, title, publishedAt: new Date().toISOString() };
    } finally {
      await browser.close();
    }
  }

  return { publishToBlog };
}

module.exports = { createPlaywrightPublisher };
