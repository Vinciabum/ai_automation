'use strict';

const { createContentAnalyzer } = require('../../src/stage1/content-analyzer');

const MOCK_TRENDS = [
  { title: 'AI 마케팅 자동화', link: 'https://trends.google.com/q=AI', searchVolume: 100000, source: 'google-trends-kr' },
  { title: '챗GPT 활용법', link: 'https://trends.google.com/q=chatgpt', searchVolume: 50000, source: 'google-trends-kr' },
  { title: '유튜브 쇼츠 알고리즘', link: 'https://trends.google.com/q=shorts', searchVolume: 30000, source: 'google-trends-kr' },
];

const MOCK_GEMINI_RESPONSE = JSON.stringify([
  { title: 'AI 마케팅 자동화', viralScore: 9, keywords: ['AI', '마케팅', '자동화'], hook: 'AI가 당신의 마케팅을 대신한다면?', contentAngle: 'AI 도구를 활용한 마케팅 비용 절감 사례' },
  { title: '챗GPT 활용법', viralScore: 7, keywords: ['챗GPT', 'AI', '업무효율'], hook: 'ChatGPT로 업무 시간을 반으로 줄이는 법', contentAngle: '실무에서 바로 쓰는 ChatGPT 프롬프트 10가지' },
  { title: '유튜브 쇼츠 알고리즘', viralScore: 6, keywords: ['쇼츠', '알고리즘', '유튜브'], hook: '쇼츠 조회수 100만 뚫는 공식', contentAngle: '쇼츠 알고리즘이 좋아하는 영상의 3가지 패턴' },
]);

describe('content-analyzer', () => {
  let mockGeminiClient;
  let analyzer;

  beforeEach(() => {
    mockGeminiClient = {
      generateText: jest.fn().mockResolvedValue(MOCK_GEMINI_RESPONSE),
    };
    analyzer = createContentAnalyzer(mockGeminiClient);
  });

  describe('analyze', () => {
    it('returns array with viralScore, keywords, hook, contentAngle for each item', async () => {
      const results = await analyzer.analyze(MOCK_TRENDS);
      expect(Array.isArray(results)).toBe(true);
      expect(results[0]).toHaveProperty('viralScore');
      expect(results[0]).toHaveProperty('keywords');
      expect(results[0]).toHaveProperty('hook');
      expect(results[0]).toHaveProperty('contentAngle');
      expect(results[0]).toHaveProperty('title');
    });

    it('uses lite model for cost efficiency', async () => {
      await analyzer.analyze(MOCK_TRENDS);
      expect(mockGeminiClient.generateText).toHaveBeenCalledWith(
        expect.any(String),
        { lite: true }
      );
    });

    it('returns sorted by viralScore descending', async () => {
      const results = await analyzer.analyze(MOCK_TRENDS);
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].viralScore).toBeGreaterThanOrEqual(results[i + 1].viralScore);
      }
    });

    it('throws on empty trends array', async () => {
      await expect(analyzer.analyze([])).rejects.toThrow('No trends to analyze');
    });
  });

  describe('pickBest', () => {
    it('returns single best topic string', async () => {
      const best = await analyzer.pickBest(MOCK_TRENDS);
      expect(typeof best).toBe('string');
      expect(best.length).toBeGreaterThan(0);
    });

    it('returns the topic with highest viralScore', async () => {
      const best = await analyzer.pickBest(MOCK_TRENDS);
      expect(best).toBe('AI 마케팅 자동화');
    });
  });
});
