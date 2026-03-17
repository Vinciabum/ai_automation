# Phase 4: 트렌드 분석 대시보드 + 다중 계정 관리 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 파이프라인 실행 이력을 JSON으로 누적 기록하고 정적 HTML 대시보드로 시각화하며, accounts.json 기반으로 여러 SNS 계정을 독립 운영한다.

**Architecture:** `pipeline-logger.js`가 매 실행마다 `data/runs.json`에 결과를 append한다. `scripts/dashboard.js`는 runs.json을 읽어 차트가 포함된 단일 HTML 파일을 생성한다 (서버 불필요, 브라우저에서 바로 열기). 다중 계정은 `accounts.json`에 계정별 API 키를 정의하고, `run-pipeline.js`에서 `--account <name>` 플래그로 계정을 선택한다.

**Tech Stack:** Node.js, fs/path (내장), Chart.js (CDN), Jest

---

## 사전 확인: Phase 순서 및 GitHub 설정

### 0-A: Phase 순서

Phase 4는 Phase 2/3와 **독립적**으로 개발 가능하다.
- 대시보드: 기존 Stage 1~2 실행 데이터만 있으면 동작
- 다중 계정: Meta 키 없이도 구조 구현 + 모의 테스트 가능
→ **지금 바로 시작 가능**

### 0-B: GitHub remote 연결

```bash
cd c:/Users/user/Desktop/test_sian/ai_automation
git remote add origin https://github.com/Vinciabum/ai_automation.git
git branch -M main
git push -u origin main
```

이후 각 Task 커밋은 `git push` 한 줄로 GitHub에 자동 반영된다.

---

## Chunk 1: Pipeline Logger

### 파일 구조

| 파일 | 역할 |
|------|------|
| `src/common/pipeline-logger.js` | runs.json에 실행 결과 append (신규) |
| `tests/common/pipeline-logger.test.js` | 단위 테스트 (신규) |
| `data/runs.json` | 실행 이력 누적 파일 — gitignore 추가 |
| `scripts/run-pipeline.js` | logger 호출 추가 (수정) |

---

### Task 1: pipeline-logger.js (TDD)

**Files:**
- Create: `src/common/pipeline-logger.js`
- Create: `tests/common/pipeline-logger.test.js`

---

- [ ] **Step 1: 테스트 작성**

`tests/common/pipeline-logger.test.js`

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test tests/common/pipeline-logger.test.js
```
Expected: `Cannot find module '../../src/common/pipeline-logger'`

- [ ] **Step 3: 구현**

`src/common/pipeline-logger.js`

```js
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.resolve(__dirname, '../../data/runs.json');

function createPipelineLogger(filePath = DEFAULT_PATH) {
  function load() {
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')).runs || [];
    } catch {
      return [];
    }
  }

  function save(run) {
    const runs = load();
    runs.push({ ...run, timestamp: new Date().toISOString() });
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ runs }, null, 2), 'utf8');
  }

  return { save, load };
}

module.exports = { createPipelineLogger };
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test tests/common/pipeline-logger.test.js
```
Expected: `4 passed`

- [ ] **Step 5: .gitignore에 data/ 추가**

`c:/Users/user/Desktop/test_sian/ai_automation/.gitignore`에 `data/` 추가.

- [ ] **Step 6: run-pipeline.js에 logger 연결**

`scripts/run-pipeline.js`에서 파이프라인 완료 후 결과 저장:

```js
// 파일 상단 require에 추가
const { createPipelineLogger } = require('../src/common/pipeline-logger');

// run() 함수 마지막, return 직전에 추가
const logger = createPipelineLogger();
logger.save({ topic, ...content, imagePath });
console.log('  ✅ 실행 이력 저장됨 (data/runs.json)');
```

- [ ] **Step 7: 전체 테스트 통과 확인**

```bash
npm test
```
Expected: 전체 PASS (42+ tests)

- [ ] **Step 8: 커밋 및 push**

```bash
git add src/common/pipeline-logger.js tests/common/pipeline-logger.test.js scripts/run-pipeline.js .gitignore
git commit -m "feat: pipeline-logger — 실행 이력 data/runs.json 누적 기록"
git push
```

---

## Chunk 2: 정적 HTML 대시보드 생성기

### 파일 구조

| 파일 | 역할 |
|------|------|
| `src/common/dashboard-generator.js` | runs.json → HTML 생성 로직 (신규) |
| `tests/common/dashboard-generator.test.js` | 단위 테스트 (신규) |
| `scripts/dashboard.js` | CLI: `node scripts/dashboard.js` 실행 진입점 (신규) |
| `output/dashboard.html` | 생성 결과물 — gitignore에 이미 포함 |

---

### Task 2: dashboard-generator.js (TDD)

**Files:**
- Create: `src/common/dashboard-generator.js`
- Create: `tests/common/dashboard-generator.test.js`

---

- [ ] **Step 1: 테스트 작성**

`tests/common/dashboard-generator.test.js`

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test tests/common/dashboard-generator.test.js
```
Expected: `Cannot find module '../../src/common/dashboard-generator'`

- [ ] **Step 3: 구현**

`src/common/dashboard-generator.js`

```js
'use strict';

function generateDashboardHtml(runs) {
  const total = runs.length;
  const imageCount = runs.filter((r) => r.imagePath).length;
  const labels = runs.map((r) => r.timestamp.slice(0, 10));
  const labelsJson = JSON.stringify(labels);

  // 일별 발행 수 집계
  const byDate = {};
  runs.forEach((r) => {
    const d = r.timestamp.slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
  });
  const dateLabels = JSON.stringify(Object.keys(byDate));
  const dateCounts = JSON.stringify(Object.values(byDate));

  const rows = runs
    .slice()
    .reverse()
    .map(
      (r) => `
      <tr>
        <td>${r.timestamp.slice(0, 19).replace('T', ' ')}</td>
        <td>${r.topic || '-'}</td>
        <td>${(r.instagram || '').slice(0, 40)}…</td>
        <td>${r.imagePath ? '✅' : '—'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI SNS 자동화 대시보드</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; background: #f5f5f5; color: #222; }
  header { background: #1a1a2e; color: #fff; padding: 20px 40px; }
  h1 { margin: 0; font-size: 1.4rem; }
  .stats { display: flex; gap: 20px; padding: 24px 40px; }
  .card { background: #fff; border-radius: 8px; padding: 20px 28px; flex: 1; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  .card .num { font-size: 2.4rem; font-weight: 700; color: #1a1a2e; }
  .card .label { font-size: 0.85rem; color: #888; margin-top: 4px; }
  .chart-wrap { background: #fff; margin: 0 40px 24px; border-radius: 8px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.08); max-height: 280px; }
  table { width: calc(100% - 80px); margin: 0 40px 40px; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  th, td { padding: 12px 16px; text-align: left; font-size: 0.9rem; border-bottom: 1px solid #f0f0f0; }
  th { background: #1a1a2e; color: #fff; font-weight: 500; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
</style>
</head>
<body>
<header><h1>AI SNS 자동화 대시보드</h1></header>
<div class="stats">
  <div class="card"><div class="num">${total}</div><div class="label">총 실행 횟수</div></div>
  <div class="card"><div class="num">${imageCount}</div><div class="label">이미지 생성 성공</div></div>
  <div class="card"><div class="num">${total - imageCount}</div><div class="label">이미지 생성 실패</div></div>
</div>
<div class="chart-wrap">
  <canvas id="chart"></canvas>
</div>
<table>
  <thead><tr><th>시각</th><th>주제</th><th>Instagram 미리보기</th><th>이미지</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#aaa;">실행 이력 없음</td></tr>'}</tbody>
</table>
<script>
new Chart(document.getElementById('chart'), {
  type: 'bar',
  data: {
    labels: ${dateLabels},
    datasets: [{ label: '일별 발행 수', data: ${dateCounts}, backgroundColor: '#4f46e5' }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
});
</script>
</body>
</html>`;
}

module.exports = { generateDashboardHtml };
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test tests/common/dashboard-generator.test.js
```
Expected: `5 passed`

- [ ] **Step 5: dashboard.js CLI 스크립트 작성**

`scripts/dashboard.js`

```js
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
```

- [ ] **Step 6: 전체 테스트 통과 확인**

```bash
npm test
```
Expected: 전체 PASS

- [ ] **Step 7: package.json scripts에 dashboard 명령 추가**

`package.json`의 `"scripts"` 블록에 추가:

```json
"dashboard": "node scripts/dashboard.js"
```

실행: `npm run dashboard` → `output/dashboard.html` 생성 → 브라우저에서 열기

- [ ] **Step 8: 커밋 및 push**

```bash
git add src/common/dashboard-generator.js tests/common/dashboard-generator.test.js scripts/dashboard.js package.json
git commit -m "feat: dashboard — runs.json → 정적 HTML 대시보드 생성"
git push
```

---

## Chunk 3: 다중 계정 관리 (Multi-Account Manager)

### 파일 구조

| 파일 | 역할 |
|------|------|
| `src/common/account-manager.js` | accounts.json 로드 및 계정별 env 반환 (신규) |
| `tests/common/account-manager.test.js` | 단위 테스트 (신규) |
| `accounts.json.example` | 계정 설정 예시 파일 (신규, git 추적) |
| `scripts/run-pipeline.js` | `--account <name>` 플래그 처리 (수정) |

`accounts.json` (실제 키 포함)은 `.gitignore`에 추가한다.

---

### Task 3: account-manager.js (TDD)

**Files:**
- Create: `src/common/account-manager.js`
- Create: `tests/common/account-manager.test.js`

---

- [ ] **Step 1: 테스트 작성**

`tests/common/account-manager.test.js`

```js
'use strict';

const path = require('path');
const { createAccountManager } = require('../../src/common/account-manager');

const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/accounts-test.json');

// fixture 파일은 테스트 폴더에 직접 작성 (아래 Step에서)
describe('account-manager', () => {
  test('이름으로 계정 env를 반환한다', () => {
    const mgr = createAccountManager(FIXTURE_PATH);
    const env = mgr.getEnv('brandA');
    expect(env.GEMINI_API_KEY).toBe('key-brandA');
    expect(env.SLACK_WEBHOOK_URL).toBe('https://hooks.slack.com/brandA');
  });

  test('존재하지 않는 계정은 에러를 던진다', () => {
    const mgr = createAccountManager(FIXTURE_PATH);
    expect(() => mgr.getEnv('unknown')).toThrow('계정을 찾을 수 없습니다: unknown');
  });

  test('계정 목록을 반환한다', () => {
    const mgr = createAccountManager(FIXTURE_PATH);
    const names = mgr.list();
    expect(names).toContain('brandA');
    expect(names).toContain('brandB');
  });

  test('accounts.json 파일이 없으면 에러를 던진다', () => {
    const mgr = createAccountManager('/tmp/nonexistent-accounts.json');
    expect(() => mgr.list()).toThrow('accounts.json 파일이 없습니다');
  });
});
```

- [ ] **Step 2: fixture 파일 생성**

`tests/fixtures/accounts-test.json`

```json
{
  "accounts": {
    "brandA": {
      "GEMINI_API_KEY": "key-brandA",
      "SLACK_WEBHOOK_URL": "https://hooks.slack.com/brandA",
      "META_ACCESS_TOKEN": "",
      "INSTAGRAM_USER_ID": "ig-brandA",
      "THREADS_USER_ID": "th-brandA"
    },
    "brandB": {
      "GEMINI_API_KEY": "key-brandB",
      "SLACK_WEBHOOK_URL": "https://hooks.slack.com/brandB",
      "META_ACCESS_TOKEN": "",
      "INSTAGRAM_USER_ID": "ig-brandB",
      "THREADS_USER_ID": "th-brandB"
    }
  }
}
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
npm test tests/common/account-manager.test.js
```
Expected: `Cannot find module '../../src/common/account-manager'`

- [ ] **Step 4: 구현**

`src/common/account-manager.js`

```js
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.resolve(__dirname, '../../accounts.json');

function createAccountManager(filePath = DEFAULT_PATH) {
  function _load() {
    if (!fs.existsSync(filePath)) {
      throw new Error(`accounts.json 파일이 없습니다: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  function list() {
    return Object.keys(_load().accounts || {});
  }

  function getEnv(name) {
    const data = _load();
    const account = (data.accounts || {})[name];
    if (!account) throw new Error(`계정을 찾을 수 없습니다: ${name}`);
    return account;
  }

  return { list, getEnv };
}

module.exports = { createAccountManager };
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npm test tests/common/account-manager.test.js
```
Expected: `4 passed`

- [ ] **Step 6: accounts.json.example 생성**

```json
{
  "accounts": {
    "brandA": {
      "GEMINI_API_KEY": "your_gemini_api_key",
      "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/...",
      "META_ACCESS_TOKEN": "",
      "INSTAGRAM_USER_ID": "",
      "THREADS_USER_ID": "",
      "NAVER_ID": "",
      "NAVER_PW": ""
    },
    "brandB": {
      "GEMINI_API_KEY": "another_gemini_api_key",
      "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/...",
      "META_ACCESS_TOKEN": "",
      "INSTAGRAM_USER_ID": "",
      "THREADS_USER_ID": "",
      "NAVER_ID": "",
      "NAVER_PW": ""
    }
  }
}
```

- [ ] **Step 7: .gitignore에 accounts.json 추가**

`.gitignore`에 추가:
```
accounts.json
```

- [ ] **Step 8: run-pipeline.js에 --account 플래그 연결**

`scripts/run-pipeline.js` 상단 require에 추가:

```js
const { createAccountManager } = require('../src/common/account-manager');
const path = require('path');
```

`run()` 함수 상단에서 계정 env override:

```js
async function run(topicArg, isAuto, accountName) {
  // 계정 지정 시 해당 계정 env로 override
  if (accountName) {
    const mgr = createAccountManager(path.resolve(__dirname, '../accounts.json'));
    const accountEnv = mgr.getEnv(accountName);
    Object.assign(process.env, accountEnv);
    console.log(`[계정] "${accountName}" 계정으로 실행 중`);
  }
  // ... 기존 코드 동일
```

`args` 파싱 부분 수정:

```js
const args = process.argv.slice(2);
const isAuto = args.includes('--auto');
const accountIdx = args.indexOf('--account');
const accountName = accountIdx !== -1 ? args[accountIdx + 1] : null;
const topicArg = args.find((a) => !a.startsWith('--') && a !== accountName);
```

- [ ] **Step 9: 전체 테스트 통과 확인**

```bash
npm test
```
Expected: 전체 PASS

- [ ] **Step 10: 커밋 및 push**

```bash
git add src/common/account-manager.js tests/common/account-manager.test.js tests/fixtures/accounts-test.json accounts.json.example scripts/run-pipeline.js .gitignore
git commit -m "feat: account-manager — accounts.json 기반 다중 계정 독립 파이프라인"
git push
```

---

## 실행 명령 최종 요약

```bash
# 단일 계정 (기존 방식)
node scripts/run-pipeline.js --auto
node scripts/run-pipeline.js "AI 마케팅"

# 다중 계정
node scripts/run-pipeline.js --auto --account brandA
node scripts/run-pipeline.js "AI 마케팅" --account brandB

# 대시보드 생성 (브라우저로 output/dashboard.html 열기)
npm run dashboard
```

---

## README 업데이트 체크리스트

- [ ] 빠른 시작에 `npm run dashboard` 추가
- [ ] 다중 계정 섹션 추가 (`accounts.json.example` 안내)
- [ ] 로드맵 Phase 4 체크 표시
- [ ] 커밋 및 push

---

## 전체 완료 기준

- [ ] `npm test` → 전체 PASS (50+ tests)
- [ ] `node scripts/run-pipeline.js --auto` → `data/runs.json` 기록됨
- [ ] `npm run dashboard` → `output/dashboard.html` 생성, 브라우저에서 차트 확인
- [ ] `node scripts/run-pipeline.js --auto --account brandA` → 계정 전환 동작 확인
- [ ] GitHub에 모든 커밋 push 완료
