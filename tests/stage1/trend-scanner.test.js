'use strict';

jest.mock('node-fetch');

const fetch = require('node-fetch');
const { createTrendScanner } = require('../../src/stage1/trend-scanner');

const MOCK_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google Trends - 대한민국</title>
    <item>
      <title>AI 마케팅 자동화</title>
      <link>https://trends.google.com/trends/explore?q=AI+마케팅</link>
      <description><![CDATA[Approximately <b>100,000</b> searches]]></description>
      <pubDate>Mon, 16 Mar 2026 00:00:00 +0000</pubDate>
    </item>
    <item>
      <title>챗GPT 활용법</title>
      <link>https://trends.google.com/trends/explore?q=챗GPT</link>
      <description><![CDATA[Approximately <b>50,000</b> searches]]></description>
      <pubDate>Mon, 16 Mar 2026 00:00:00 +0000</pubDate>
    </item>
    <item>
      <title>유튜브 쇼츠 알고리즘</title>
      <link>https://trends.google.com/trends/explore?q=쇼츠</link>
      <description><![CDATA[Approximately <b>30,000</b> searches]]></description>
      <pubDate>Mon, 16 Mar 2026 00:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

describe('trend-scanner', () => {
  let scanner;

  beforeEach(() => {
    fetch.mockResolvedValue({
      ok: true,
      text: async () => MOCK_RSS,
    });
    scanner = createTrendScanner();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTrends', () => {
    it('returns array of trending items', async () => {
      const trends = await scanner.fetchTrends();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('each item has title, link, searchVolume, source', async () => {
      const trends = await scanner.fetchTrends();
      const item = trends[0];
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('link');
      expect(item).toHaveProperty('searchVolume');
      expect(item).toHaveProperty('source');
    });

    it('searchVolume is a number', async () => {
      const trends = await scanner.fetchTrends();
      expect(typeof trends[0].searchVolume).toBe('number');
      expect(trends[0].searchVolume).toBeGreaterThan(0);
    });

    it('sorts by searchVolume descending', async () => {
      const trends = await scanner.fetchTrends();
      for (let i = 0; i < trends.length - 1; i++) {
        expect(trends[i].searchVolume).toBeGreaterThanOrEqual(trends[i + 1].searchVolume);
      }
    });

    it('throws when fetch fails', async () => {
      fetch.mockResolvedValue({ ok: false, status: 403 });
      await expect(scanner.fetchTrends()).rejects.toThrow('RSS fetch failed');
    });
  });

  describe('getTopN', () => {
    it('returns top N items by searchVolume', async () => {
      const top2 = await scanner.getTopN(2);
      expect(top2).toHaveLength(2);
      expect(top2[0].title).toBe('AI 마케팅 자동화');
    });

    it('returns all items when N exceeds available', async () => {
      const top10 = await scanner.getTopN(10);
      expect(top10.length).toBeLessThanOrEqual(10);
    });
  });
});
