'use strict';

const { generateDashboardHtml } = require('../../src/common/dashboard-generator');

const SAMPLE_RUNS = [
  {
    timestamp: '2026-03-16T10:00:00.000Z',
    topic: 'AI 마케팅',
    instagram: 'IG 텍스트',
    threads: 'TH 텍스트',
    twitter: 'TW 텍스트',
    imagePath: 'output/img1.png',
  },
  {
    timestamp: '2026-03-16T12:00:00.000Z',
    topic: '챗GPT 활용법',
    instagram: 'IG 텍스트 2',
    threads: 'TH 텍스트 2',
    twitter: 'TW 텍스트 2',
    imagePath: null,
  },
];

describe('dashboard-generator', () => {
  test('HTML 문자열을 반환한다', () => {
    const html = generateDashboardHtml(SAMPLE_RUNS);
    expect(typeof html).toBe('string');
    expect(html).toContain('<!DOCTYPE html>');
  });

  test('총 실행 횟수가 HTML에 포함된다', () => {
    const html = generateDashboardHtml(SAMPLE_RUNS);
    expect(html).toContain('2');
  });

  test('각 run의 topic이 HTML에 포함된다', () => {
    const html = generateDashboardHtml(SAMPLE_RUNS);
    expect(html).toContain('AI 마케팅');
    expect(html).toContain('챗GPT 활용법');
  });

  test('runs가 비어있을 때도 HTML을 반환한다', () => {
    const html = generateDashboardHtml([]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('0');
  });

  test('Chart.js CDN이 포함된다', () => {
    const html = generateDashboardHtml(SAMPLE_RUNS);
    expect(html).toContain('chart.js');
  });
});
