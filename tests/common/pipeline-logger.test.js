'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createPipelineLogger } = require('../../src/common/pipeline-logger');

describe('pipeline-logger', () => {
  let tmpFile;
  let logger;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `runs-${Date.now()}.json`);
    logger = createPipelineLogger(tmpFile);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  test('파일이 없을 때 새로 생성하고 첫 run 기록', () => {
    const run = { topic: 'AI 마케팅', instagram: 'IG 텍스트', threads: 'TH 텍스트', imagePath: null };
    logger.save(run);
    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    expect(data.runs).toHaveLength(1);
    expect(data.runs[0].topic).toBe('AI 마케팅');
    expect(data.runs[0].timestamp).toBeDefined();
  });

  test('기존 파일에 append (누적)', () => {
    logger.save({ topic: '첫 번째' });
    logger.save({ topic: '두 번째' });
    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    expect(data.runs).toHaveLength(2);
    expect(data.runs[1].topic).toBe('두 번째');
  });

  test('load()는 runs 배열을 반환', () => {
    logger.save({ topic: '테스트' });
    const runs = logger.load();
    expect(Array.isArray(runs)).toBe(true);
    expect(runs[0].topic).toBe('테스트');
  });

  test('파일이 없으면 load()는 빈 배열 반환', () => {
    const runs = logger.load();
    expect(runs).toEqual([]);
  });
});
