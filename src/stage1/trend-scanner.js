'use strict';

const fetch = require('node-fetch');
const { XMLParser } = require('fast-xml-parser');

// 한국 Google 뉴스 RSS (API 키 불필요, 안정적)
const GOOGLE_TRENDS_KR_RSS = 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko';

const parser = new XMLParser({ ignoreAttributes: false });

function parseSearchVolume(description) {
  if (!description) return 0;
  const match = String(description).replace(/,/g, '').match(/[\d]+/);
  return match ? parseInt(match[0], 10) : 0;
}

function createTrendScanner(rssUrl = GOOGLE_TRENDS_KR_RSS) {
  async function fetchTrends() {
    const res = await fetch(rssUrl);
    if (!res.ok) throw new Error(`RSS fetch failed: HTTP ${res.status}`);

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    const raw = Array.isArray(items) ? items : [items].filter(Boolean);

    // Google News RSS: 순서가 곧 중요도 (인기순 정렬)
    const trends = raw.map((item, idx) => ({
      title: item.title || '',
      link: item.link || '',
      searchVolume: raw.length - idx, // 앞 순서일수록 높은 점수
      source: 'google-news-kr',
    }));

    return trends;
  }

  async function getTopN(n = 5) {
    const all = await fetchTrends();
    return all.slice(0, n);
  }

  return { fetchTrends, getTopN };
}

module.exports = { createTrendScanner };
