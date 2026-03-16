'use strict';

const path = require('path');
const fs = require('fs');
const { createPipelineLogger } = require('../src/common/pipeline-logger');
const { generateDashboardHtml } = require('../src/common/dashboard-generator');

const logger = createPipelineLogger();
const runs = logger.load();
const html = generateDashboardHtml(runs);

const outDir = path.resolve(__dirname, '../output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, 'dashboard.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`✅ 대시보드 생성됨: ${outPath}`);
console.log(`   총 실행 횟수: ${runs.length}건`);
