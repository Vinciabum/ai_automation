# SNS Automation Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP pipeline that takes a topic, generates Instagram & Threads content via Gemini 2.5 Pro, sends it to Slack for human approval, then publishes via Meta Graph API.

**Architecture:** Standalone Node.js modules (callable from n8n Code nodes or CLI). Common layer wraps Gemini and Slack. Stage 2 handles OSMU content generation. Stage 3 handles Meta API publishing. Each module is tested independently with mocked external calls.

**Tech Stack:** Node.js (CJS), `@google/genai`, `@slack/webhook`, `node-fetch`, `jest`, `dotenv`

---

## Scope Note

This plan covers **Phase 1 MVP only**:
- Stage 2: OSMU content engine (Instagram + Threads text + image prompt)
- Stage 3 (partial): Meta Graph API publisher for Instagram + Threads

The following are **out of scope** for this plan and should use separate plans:
- Stage 1 (YouTube/RSS trend scanning) → `2026-03-16-stage1-market-analysis.md`
- Playwright-based Naver/Tistory publishing → `2026-03-16-stage3-playwright-publisher.md`
- n8n workflow JSON export → `2026-03-16-n8n-workflows.md`

---

## File Map

```
ai_automation/
├── src/
│   ├── common/
│   │   ├── gemini-client.js       # Wraps @google/genai: text + image generation
│   │   └── slack-notifier.js      # Sends Slack webhook with approval payload
│   ├── stage2/
│   │   ├── osmu-engine.js         # Generates platform-specific copy from topic
│   │   └── image-generator.js     # Generates image prompt → calls Gemini image API
│   └── stage3/
│       └── meta-publisher.js      # Instagram Graph API + Threads API publisher
├── tests/
│   ├── common/
│   │   ├── gemini-client.test.js
│   │   └── slack-notifier.test.js
│   ├── stage2/
│   │   ├── osmu-engine.test.js
│   │   └── image-generator.test.js
│   └── stage3/
│       └── meta-publisher.test.js
├── scripts/
│   └── run-pipeline.js            # CLI entry: topic → generate → slack → publish
├── .env.example
├── package.json
└── jest.config.js
```

**Responsibility boundaries:**
- `gemini-client.js` — only knows about Gemini API, exposes `generateText(prompt)` and `generateImage(prompt)`
- `slack-notifier.js` — only knows about Slack webhooks, exposes `sendApprovalRequest(content)`
- `osmu-engine.js` — only knows about content structure, calls `gemini-client` for text
- `image-generator.js` — only knows about image workflow, calls `gemini-client` for image
- `meta-publisher.js` — only knows about Meta Graph API endpoints, exposes `publishInstagram(text, imageUrl)` and `publishThreads(text)`

---

## Chunk 1: Project Bootstrap

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `jest.config.js`
- Create: `.env.example`

- [ ] **Step 1: Initialize package.json**

```bash
cd c:/Users/user/Desktop/test_sian/ai_automation
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @google/genai @slack/webhook node-fetch dotenv
npm install --save-dev jest
```

- [ ] **Step 3: Update package.json scripts**

Edit `package.json` to add:
```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "pipeline": "node scripts/run-pipeline.js"
  }
}
```

- [ ] **Step 4: Create jest.config.js**

```js
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
};
```

- [ ] **Step 5: Create .env.example**

```bash
# .env.example
GEMINI_API_KEY=your_gemini_api_key_here

# Meta Graph API (Instagram + Threads)
META_ACCESS_TOKEN=your_meta_access_token
INSTAGRAM_USER_ID=your_ig_user_id
THREADS_USER_ID=your_threads_user_id

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

- [ ] **Step 6: Create directory structure**

```bash
mkdir -p src/common src/stage2 src/stage3 tests/common tests/stage2 tests/stage3 scripts
```

- [ ] **Step 7: Verify setup**

```bash
npm test
```
Expected: `No tests found` (not a failure, just no test files yet)

- [ ] **Step 8: Commit**

```bash
git init
git add package.json jest.config.js .env.example
git commit -m "chore: initialize project structure"
```

---

## Chunk 2: Common Layer

### Task 2: Gemini Client

**Files:**
- Create: `src/common/gemini-client.js`
- Create: `tests/common/gemini-client.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/common/gemini-client.test.js
'use strict';

jest.mock('@google/genai');

const { GoogleGenAI } = require('@google/genai');
const { createGeminiClient } = require('../../src/common/gemini-client');

describe('gemini-client', () => {
  let mockGenerateContent;
  let client;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    GoogleGenAI.mockImplementation(() => ({
      models: { generateContent: mockGenerateContent },
    }));
    client = createGeminiClient('test-api-key');
  });

  describe('generateText', () => {
    it('calls Gemini with gemini-2.5-pro model and returns text', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Hello from Gemini',
      });

      const result = await client.generateText('Write a post about coffee');

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-pro',
        contents: 'Write a post about coffee',
      });
      expect(result).toBe('Hello from Gemini');
    });

    it('throws when API key is missing', () => {
      expect(() => createGeminiClient(null)).toThrow('GEMINI_API_KEY is required');
    });
  });

  describe('generateImage', () => {
    it('calls Gemini image model and returns base64 data', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: 'base64encodedimage', mimeType: 'image/png' } }],
            },
          },
        ],
      });

      const result = await client.generateImage('A cup of coffee on a wooden table');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.0-flash-preview-image-generation',
        })
      );
      expect(result).toEqual({ data: 'base64encodedimage', mimeType: 'image/png' });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/common/gemini-client.test.js
```
Expected: FAIL — `Cannot find module '../../src/common/gemini-client'`

- [ ] **Step 3: Implement gemini-client.js**

```js
// src/common/gemini-client.js
'use strict';

const { GoogleGenAI } = require('@google/genai');

const TEXT_MODEL = 'gemini-2.5-pro';
const IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation';

function createGeminiClient(apiKey) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is required');

  const ai = new GoogleGenAI({ apiKey });

  async function generateText(prompt) {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    return response.text;
  }

  async function generateImage(prompt) {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: { responseModalities: ['IMAGE'] },
    });
    const part = response.candidates[0].content.parts.find((p) => p.inlineData);
    return part.inlineData;
  }

  return { generateText, generateImage };
}

module.exports = { createGeminiClient };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/common/gemini-client.test.js
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/common/gemini-client.js tests/common/gemini-client.test.js
git commit -m "feat: add Gemini client wrapper for text and image generation"
```

---

### Task 3: Slack Notifier

**Files:**
- Create: `src/common/slack-notifier.js`
- Create: `tests/common/slack-notifier.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/common/slack-notifier.test.js
'use strict';

jest.mock('@slack/webhook');

const { IncomingWebhook } = require('@slack/webhook');
const { createSlackNotifier } = require('../../src/common/slack-notifier');

describe('slack-notifier', () => {
  let mockSend;
  let notifier;

  beforeEach(() => {
    mockSend = jest.fn().mockResolvedValue({ text: 'ok' });
    IncomingWebhook.mockImplementation(() => ({ send: mockSend }));
    notifier = createSlackNotifier('https://hooks.slack.com/test');
  });

  it('throws when webhook URL is missing', () => {
    expect(() => createSlackNotifier(null)).toThrow('SLACK_WEBHOOK_URL is required');
  });

  it('sends approval request with instagram and threads content', async () => {
    const content = {
      topic: 'AI 트렌드',
      instagram: '인스타 문구입니다 #AI',
      threads: '쓰레드 문구입니다',
      imagePrompt: 'A futuristic robot',
    };

    await notifier.sendApprovalRequest(content);

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('AI 트렌드'),
        blocks: expect.arrayContaining([
          expect.objectContaining({ type: 'section' }),
        ]),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/common/slack-notifier.test.js
```
Expected: FAIL — `Cannot find module '../../src/common/slack-notifier'`

- [ ] **Step 3: Implement slack-notifier.js**

```js
// src/common/slack-notifier.js
'use strict';

const { IncomingWebhook } = require('@slack/webhook');

function createSlackNotifier(webhookUrl) {
  if (!webhookUrl) throw new Error('SLACK_WEBHOOK_URL is required');

  const webhook = new IncomingWebhook(webhookUrl);

  async function sendApprovalRequest(content) {
    const { topic, instagram, threads, imagePrompt } = content;

    return webhook.send({
      text: `[검수 요청] 소재: *${topic}*`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📋 콘텐츠 검수 요청: ${topic}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Instagram*\n${instagram}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Threads*\n${threads}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*이미지 프롬프트*\n${imagePrompt}` },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '✅ 승인' },
              style: 'primary',
              value: JSON.stringify({ action: 'approve', topic }),
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '❌ 거절' },
              style: 'danger',
              value: JSON.stringify({ action: 'reject', topic }),
            },
          ],
        },
      ],
    });
  }

  return { sendApprovalRequest };
}

module.exports = { createSlackNotifier };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/common/slack-notifier.test.js
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/common/slack-notifier.js tests/common/slack-notifier.test.js
git commit -m "feat: add Slack notifier for content approval workflow"
```

---

## Chunk 3: Stage 2 — Content Generation

### Task 4: OSMU Engine

**Files:**
- Create: `src/stage2/osmu-engine.js`
- Create: `tests/stage2/osmu-engine.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/stage2/osmu-engine.test.js
'use strict';

const { createOsmuEngine } = require('../../src/stage2/osmu-engine');

describe('osmu-engine', () => {
  let mockGeminiClient;
  let engine;

  beforeEach(() => {
    mockGeminiClient = {
      generateText: jest.fn(),
    };
    engine = createOsmuEngine(mockGeminiClient);
  });

  it('generates instagram, threads, twitter, and blog content from topic', async () => {
    const mockResponse = JSON.stringify({
      instagram: '✨ AI가 바꾸는 마케팅의 미래 #AI #마케팅',
      threads: 'AI 마케팅, 어디까지 왔을까요? 함께 알아봐요.',
      twitter: 'AI marketing is transforming the industry. Here is what you need to know:',
      blog: '# AI 마케팅의 미래\n\n인공지능은...',
      imagePrompt: 'A robot typing on a laptop surrounded by social media icons, digital art',
    });
    mockGeminiClient.generateText.mockResolvedValue(mockResponse);

    const result = await engine.generate('AI 마케팅 트렌드');

    expect(mockGeminiClient.generateText).toHaveBeenCalledWith(
      expect.stringContaining('AI 마케팅 트렌드')
    );
    expect(result).toHaveProperty('instagram');
    expect(result).toHaveProperty('threads');
    expect(result).toHaveProperty('twitter');
    expect(result).toHaveProperty('blog');
    expect(result).toHaveProperty('imagePrompt');
  });

  it('throws descriptive error when Gemini returns invalid JSON', async () => {
    mockGeminiClient.generateText.mockResolvedValue('not valid json ```json{}```');

    await expect(engine.generate('topic')).rejects.toThrow('Failed to parse Gemini OSMU response');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/stage2/osmu-engine.test.js
```
Expected: FAIL — `Cannot find module '../../src/stage2/osmu-engine'`

- [ ] **Step 3: Implement osmu-engine.js**

```js
// src/stage2/osmu-engine.js
'use strict';

const OSMU_PROMPT_TEMPLATE = (topic) => `
당신은 한국의 프로 SNS 마케터입니다. 아래 주제로 4개 플랫폼용 콘텐츠를 동시에 작성하세요.

주제: "${topic}"

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "instagram": "이모지와 해시태그가 포함된 감성적인 인스타그램 문구 (최대 150자)",
  "threads": "질문 또는 공감 유도형 쓰레드 문구 (최대 200자)",
  "twitter": "팩트 중심의 영문 또는 국문 트위터 문구 (최대 140자)",
  "blog": "소제목이 포함된 SEO 최적화 블로그 원고 (600자 이상)",
  "imagePrompt": "Stable Diffusion 스타일의 영문 이미지 생성 프롬프트 (50자 이내)"
}
`;

function parseOsmuResponse(raw) {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Gemini OSMU response: ${raw.slice(0, 100)}`);
  }
}

function createOsmuEngine(geminiClient) {
  async function generate(topic) {
    const prompt = OSMU_PROMPT_TEMPLATE(topic);
    const raw = await geminiClient.generateText(prompt);
    return parseOsmuResponse(raw);
  }

  return { generate };
}

module.exports = { createOsmuEngine };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/stage2/osmu-engine.test.js
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/stage2/osmu-engine.js tests/stage2/osmu-engine.test.js
git commit -m "feat: add OSMU content engine for 4-platform content generation"
```

---

### Task 5: Image Generator

**Files:**
- Create: `src/stage2/image-generator.js`
- Create: `tests/stage2/image-generator.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/stage2/image-generator.test.js
'use strict';

const fs = require('fs');
const path = require('path');
const { createImageGenerator } = require('../../src/stage2/image-generator');

describe('image-generator', () => {
  let mockGeminiClient;
  let generator;

  beforeEach(() => {
    mockGeminiClient = { generateImage: jest.fn() };
    generator = createImageGenerator(mockGeminiClient, '/tmp/test-images');
  });

  it('generates image and saves to disk, returns file path', async () => {
    const fakeBase64 = Buffer.from('fake-image-data').toString('base64');
    mockGeminiClient.generateImage.mockResolvedValue({
      data: fakeBase64,
      mimeType: 'image/png',
    });

    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

    const result = await generator.generate('A coffee cup');

    expect(mockGeminiClient.generateImage).toHaveBeenCalledWith('A coffee cup');
    expect(writeSpy).toHaveBeenCalled();
    expect(result).toMatch(/\.png$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/stage2/image-generator.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement image-generator.js**

```js
// src/stage2/image-generator.js
'use strict';

const fs = require('fs');
const path = require('path');

function createImageGenerator(geminiClient, outputDir = './output/images') {
  async function generate(imagePrompt) {
    const { data, mimeType } = await geminiClient.generateImage(imagePrompt);

    fs.mkdirSync(outputDir, { recursive: true });

    const ext = mimeType.split('/')[1] || 'png';
    const filename = `img_${Date.now()}.${ext}`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    return filepath;
  }

  return { generate };
}

module.exports = { createImageGenerator };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/stage2/image-generator.test.js
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stage2/image-generator.js tests/stage2/image-generator.test.js
git commit -m "feat: add image generator that saves Gemini image output to disk"
```

---

## Chunk 4: Stage 3 — Meta API Publisher

### Task 6: Meta Publisher (Instagram + Threads)

**Files:**
- Create: `src/stage3/meta-publisher.js`
- Create: `tests/stage3/meta-publisher.test.js`

**Note:** Instagram Graph API requires a publicly accessible image URL, not a local file. For the MVP, images must be hosted (e.g., upload to S3/Cloudinary first). This task uses `imageUrl` parameter.

- [ ] **Step 1: Write failing tests**

```js
// tests/stage3/meta-publisher.test.js
'use strict';

jest.mock('node-fetch');

const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
const { createMetaPublisher } = require('../../src/stage3/meta-publisher');

const config = {
  accessToken: 'test-token',
  instagramUserId: 'ig-123',
  threadsUserId: 'th-456',
};

describe('meta-publisher', () => {
  let publisher;

  beforeEach(() => {
    publisher = createMetaPublisher(config);
  });

  describe('publishInstagram', () => {
    it('creates media container then publishes, returns post id', async () => {
      fetch
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'container-id' }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'post-id-123' }), { status: 200 }));

      const result = await publisher.publishInstagram('Test caption #AI', 'https://example.com/image.png');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('post-id-123');
    });

    it('throws when API returns error', async () => {
      fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Invalid token' } }), { status: 400 })
      );

      await expect(
        publisher.publishInstagram('caption', 'https://example.com/img.png')
      ).rejects.toThrow('Instagram API error');
    });
  });

  describe('publishThreads', () => {
    it('creates thread container then publishes, returns post id', async () => {
      fetch
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'container-id' }), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'thread-post-id' }), { status: 200 }));

      const result = await publisher.publishThreads('쓰레드 내용입니다');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('thread-post-id');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/stage3/meta-publisher.test.js
```
Expected: FAIL

- [ ] **Step 3: Implement meta-publisher.js**

```js
// src/stage3/meta-publisher.js
'use strict';

const fetch = require('node-fetch');

const GRAPH_API = 'https://graph.facebook.com/v19.0';
const THREADS_API = 'https://graph.threads.net/v1.0';

function createMetaPublisher({ accessToken, instagramUserId, threadsUserId }) {
  if (!accessToken) throw new Error('META_ACCESS_TOKEN is required');

  async function apiPost(url, body) {
    const params = new URLSearchParams({ ...body, access_token: accessToken });
    const res = await fetch(`${url}?${params}`, { method: 'POST' });
    const json = await res.json();
    if (json.error) throw new Error(`Instagram API error: ${json.error.message}`);
    return json;
  }

  async function publishInstagram(caption, imageUrl) {
    // Step 1: Create media container
    const container = await apiPost(`${GRAPH_API}/${instagramUserId}/media`, {
      caption,
      image_url: imageUrl,
      media_type: 'IMAGE',
    });

    // Step 2: Publish container
    const post = await apiPost(`${GRAPH_API}/${instagramUserId}/media_publish`, {
      creation_id: container.id,
    });

    return post.id;
  }

  async function publishThreads(text) {
    // Step 1: Create thread container
    const container = await apiPost(`${THREADS_API}/${threadsUserId}/threads`, {
      media_type: 'TEXT',
      text,
    });

    // Step 2: Publish thread
    const post = await apiPost(`${THREADS_API}/${threadsUserId}/threads_publish`, {
      creation_id: container.id,
    });

    return post.id;
  }

  return { publishInstagram, publishThreads };
}

module.exports = { createMetaPublisher };
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
npm test
```
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/stage3/meta-publisher.js tests/stage3/meta-publisher.test.js
git commit -m "feat: add Meta Graph API publisher for Instagram and Threads"
```

---

## Chunk 5: CLI Pipeline & Integration

### Task 7: CLI Pipeline Runner

**Files:**
- Create: `scripts/run-pipeline.js`

This script wires all modules together for manual testing and n8n Code node usage.

- [ ] **Step 1: Create the pipeline runner**

```js
// scripts/run-pipeline.js
'use strict';

require('dotenv').config();

const { createGeminiClient } = require('../src/common/gemini-client');
const { createSlackNotifier } = require('../src/common/slack-notifier');
const { createOsmuEngine } = require('../src/stage2/osmu-engine');
const { createImageGenerator } = require('../src/stage2/image-generator');

async function run(topic) {
  if (!topic) {
    console.error('Usage: node scripts/run-pipeline.js "주제를 입력하세요"');
    process.exit(1);
  }

  const gemini = createGeminiClient(process.env.GEMINI_API_KEY);
  const slack = createSlackNotifier(process.env.SLACK_WEBHOOK_URL);
  const osmu = createOsmuEngine(gemini);
  const imageGen = createImageGenerator(gemini);

  console.log(`[1/3] "${topic}" 주제로 콘텐츠 생성 중...`);
  const content = await osmu.generate(topic);
  console.log('✅ 콘텐츠 생성 완료:', Object.keys(content).join(', '));

  console.log('[2/3] 이미지 생성 중...');
  const imagePath = await imageGen.generate(content.imagePrompt);
  console.log(`✅ 이미지 저장됨: ${imagePath}`);

  console.log('[3/3] Slack 검수 요청 발송 중...');
  await slack.sendApprovalRequest({ topic, ...content });
  console.log('✅ Slack 메시지 발송 완료. 검수 후 발행하세요.');

  return { content, imagePath };
}

const topic = process.argv[2];
run(topic).catch((err) => {
  console.error('Pipeline error:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Copy .env.example and fill in real values**

```bash
cp .env.example .env
# .env 파일을 열어 실제 API 키 입력
```

Required keys to fill:
- `GEMINI_API_KEY`: Google AI Studio에서 발급
- `SLACK_WEBHOOK_URL`: Slack → Apps → Incoming Webhooks에서 발급
- `META_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `THREADS_USER_ID`: Meta Developer Console에서 발급

- [ ] **Step 3: Run smoke test (real API)**

```bash
node scripts/run-pipeline.js "AI가 바꾸는 마케팅의 미래"
```

Expected output:
```
[1/3] "AI가 바꾸는 마케팅의 미래" 주제로 콘텐츠 생성 중...
✅ 콘텐츠 생성 완료: instagram, threads, twitter, blog, imagePrompt
[2/3] 이미지 생성 중...
✅ 이미지 저장됨: ./output/images/img_xxxxxxxxx.png
[3/3] Slack 검수 요청 발송 중...
✅ Slack 메시지 발송 완료. 검수 후 발행하세요.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/run-pipeline.js
git commit -m "feat: add CLI pipeline runner for end-to-end content generation"
```

---

## Chunk 6: Publishing Step (Post-Approval)

### Task 8: Manual Publish Script

**Files:**
- Create: `scripts/publish.js`

Used after Slack approval to actually post to Instagram and Threads.

- [ ] **Step 1: Create publish script**

```js
// scripts/publish.js
'use strict';

require('dotenv').config();

const { createMetaPublisher } = require('../src/stage3/meta-publisher');

// In production, this would receive data from Slack webhook callback.
// For MVP, pass topic content via CLI args or environment.
async function publish({ instagramCaption, threadsText, imageUrl }) {
  const meta = createMetaPublisher({
    accessToken: process.env.META_ACCESS_TOKEN,
    instagramUserId: process.env.INSTAGRAM_USER_ID,
    threadsUserId: process.env.THREADS_USER_ID,
  });

  console.log('[1/2] Instagram 발행 중...');
  const igPostId = await meta.publishInstagram(instagramCaption, imageUrl);
  console.log(`✅ Instagram 발행 완료: post ID ${igPostId}`);

  console.log('[2/2] Threads 발행 중...');
  const thPostId = await meta.publishThreads(threadsText);
  console.log(`✅ Threads 발행 완료: post ID ${thPostId}`);
}

// Example usage — replace with real content
const sampleContent = {
  instagramCaption: process.env.IG_CAPTION || '테스트 포스트 #AI',
  threadsText: process.env.TH_TEXT || '테스트 쓰레드입니다',
  imageUrl: process.env.IMAGE_URL || 'https://via.placeholder.com/1080',
};

publish(sampleContent).catch((err) => {
  console.error('Publish error:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run final test suite**

```bash
npm test
```
Expected: All tests PASS

- [ ] **Step 3: Final commit**

```bash
git add scripts/publish.js
git commit -m "feat: add manual publish script for post-approval Instagram and Threads posting"
```

---

## Next Steps (Separate Plans)

After Phase 1 MVP is verified:

| Plan | Description |
|------|------------|
| `2026-03-16-stage1-market-analysis.md` | YouTube Data API + RSS 트렌드 수집 → Notion DB |
| `2026-03-16-stage3-playwright-publisher.md` | Naver Blog Playwright 자동 발행 |
| `2026-03-16-n8n-workflows.md` | 위 모듈들을 n8n 워크플로우 JSON으로 연결 |

## Environment Setup Checklist

Before running the pipeline, verify these API accesses are ready:

- [ ] **Gemini API Key**: [Google AI Studio](https://aistudio.google.com) → `Get API Key`
- [ ] **Slack Webhook**: Slack → Apps → Incoming Webhooks → `Add to Slack`
- [ ] **Meta Developer App**: [developers.facebook.com](https://developers.facebook.com) → Create App → Instagram Basic Display / Threads API
- [ ] **Instagram User ID**: Graph API Explorer → `GET /me?fields=id` with instagram scope
- [ ] **Threads User ID**: Threads API → `GET /me` with threads scope
