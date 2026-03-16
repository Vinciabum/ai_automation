'use strict';

jest.mock('playwright');

const { chromium } = require('playwright');
const { createPlaywrightPublisher } = require('../../src/stage3/playwright-publisher');

const MOCK_POST = {
  title: 'AI가 바꾸는 마케팅의 미래',
  body: '## AI 마케팅이란?\n\nAI를 활용한 마케팅 자동화는 이제 선택이 아닌 필수입니다...',
  tags: ['AI', '마케팅', '자동화'],
};

describe('playwright-publisher', () => {
  let mockPage;
  let mockBrowser;
  let mockContext;
  let publisher;

  beforeEach(() => {
    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      fill: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      waitForNavigation: jest.fn().mockResolvedValue(undefined),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
      url: jest.fn().mockReturnValue('https://blog.naver.com/myid/12345'),
      close: jest.fn().mockResolvedValue(undefined),
      $: jest.fn().mockResolvedValue({ contentFrame: jest.fn().mockResolvedValue(null) }),
    };
    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn().mockResolvedValue(undefined),
    };
    chromium.launch = jest.fn().mockResolvedValue(mockBrowser);

    publisher = createPlaywrightPublisher({
      naverId: 'test_id',
      naverPassword: 'test_pw',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishToBlog', () => {
    it('launches chromium browser', async () => {
      await publisher.publishToBlog(MOCK_POST);
      expect(chromium.launch).toHaveBeenCalledWith(expect.objectContaining({
        headless: expect.any(Boolean),
      }));
    });

    it('navigates to Naver login page', async () => {
      await publisher.publishToBlog(MOCK_POST);
      expect(mockPage.goto).toHaveBeenCalledWith(
        expect.stringContaining('naver.com'),
        expect.any(Object)
      );
    });

    it('fills login credentials', async () => {
      await publisher.publishToBlog(MOCK_POST);
      expect(mockPage.fill).toHaveBeenCalledWith(expect.stringContaining('id'), 'test_id');
      expect(mockPage.fill).toHaveBeenCalledWith(expect.stringContaining('pw'), 'test_pw');
    });

    it('returns published post URL', async () => {
      const result = await publisher.publishToBlog(MOCK_POST);
      expect(result).toHaveProperty('url');
      expect(typeof result.url).toBe('string');
    });

    it('closes browser after publishing', async () => {
      await publisher.publishToBlog(MOCK_POST);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('throws when credentials are missing', () => {
      expect(() => createPlaywrightPublisher({ naverId: '', naverPassword: '' }))
        .toThrow('Naver credentials are required');
    });
  });
});
