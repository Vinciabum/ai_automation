'use strict';

require('dotenv').config();

const { createGeminiClient } = require('../src/common/gemini-client');
const { createSlackNotifier } = require('../src/common/slack-notifier');
const { createOsmuEngine } = require('../src/stage2/osmu-engine');
const { createImageGenerator } = require('../src/stage2/image-generator');
const { createTrendScanner } = require('../src/stage1/trend-scanner');
const { createContentAnalyzer } = require('../src/stage1/content-analyzer');
const { createPipelineLogger } = require('../src/common/pipeline-logger');

async function autoSelectTopic(gemini) {
  console.log('[Stage 1] Google Trends KR 수집 중...');
  const scanner = createTrendScanner();
  const analyzer = createContentAnalyzer(gemini);

  const trends = await scanner.getTopN(10);
  console.log(`  → ${trends.length}개 트렌드 수집 완료`);
  trends.forEach((t, i) => console.log(`     ${i + 1}. ${t.title} (${t.searchVolume.toLocaleString()}회)`));

  console.log('[Stage 1] Gemini Lite로 바이럴 점수 분석 중...');
  const analyzed = await analyzer.analyze(trends);
  const best = analyzed[0];
  console.log(`  → 최고 소재: "${best.title}" (바이럴 점수: ${best.viralScore}/10)`);
  console.log(`  → Hook: ${best.hook}`);
  console.log(`  → 방향: ${best.contentAngle}`);

  return best.contentAngle || best.title;
}

async function run(topicArg, isAuto) {
  const gemini = createGeminiClient(process.env.GEMINI_API_KEY);
  const slack = createSlackNotifier(process.env.SLACK_WEBHOOK_URL);
  const osmu = createOsmuEngine(gemini);
  const imageGen = createImageGenerator(gemini);

  let topic = topicArg;

  // Stage 1: 자동 트렌드 수집
  if (isAuto) {
    topic = await autoSelectTopic(gemini);
  } else if (!topic) {
    console.error('사용법:');
    console.error('  수동: node scripts/run-pipeline.js "주제를 입력하세요"');
    console.error('  자동: node scripts/run-pipeline.js --auto');
    process.exit(1);
  }

  // Stage 2: 콘텐츠 생성
  console.log(`\n[Stage 2] "${topic}" 주제로 OSMU 콘텐츠 생성 중...`);
  const content = await osmu.generate(topic);
  console.log('  ✅ 콘텐츠 생성 완료');
  console.log('     Instagram:', content.instagram.slice(0, 50) + '...');
  console.log('     Threads  :', content.threads.slice(0, 50) + '...');
  console.log('     Twitter  :', content.twitter.slice(0, 50) + '...');
  console.log('     Image    :', content.imagePrompt);

  // Stage 2: 이미지 생성
  console.log('\n[Stage 2] 이미지 생성 중...');
  let imagePath = null;
  try {
    imagePath = await imageGen.generate(content.imagePrompt);
    console.log(`  ✅ 이미지 저장됨: ${imagePath}`);
  } catch (err) {
    console.warn(`  ⚠️  이미지 생성 실패 (건너뜀): ${err.message.slice(0, 80)}...`);
  }

  // Stage 3: Slack 검수 요청
  console.log('\n[Stage 3] Slack 검수 요청 발송 중...');
  await slack.sendApprovalRequest({ topic, ...content });
  console.log('  ✅ Slack 전송 완료. 검수 후 승인하세요.');

  // 실행 이력 기록
  const logger = createPipelineLogger();
  logger.save({ topic, ...content, imagePath });
  console.log('  ✅ 실행 이력 저장됨 (data/runs.json)\n');

  return { topic, content, imagePath };
}

const args = process.argv.slice(2);
const isAuto = args.includes('--auto');
const topicArg = args.find((a) => !a.startsWith('--'));

run(topicArg, isAuto).catch((err) => {
  console.error('\n❌ Pipeline error:', err.message);
  process.exit(1);
});
