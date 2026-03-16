# AI SNS 자동화 파이프라인

Google Trends KR 트렌드를 자동 수집하여 Instagram, Threads, Twitter, Naver Blog 콘텐츠를 생성하고 Slack 검수 후 자동 발행하는 시스템.

---

## 빠른 시작

```bash
# 1. 의존성 설치 (최초 1회)
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 3. 실행
node scripts/run-pipeline.js --auto          # 자동 (트렌드 수집 → 콘텐츠 생성 → Slack)
node scripts/run-pipeline.js "AI와 마케팅"  # 수동 주제 지정

# 4. 대시보드 (실행 이력 시각화)
npm run dashboard                            # output/dashboard.html 생성 후 브라우저로 열기

# 5. 다중 계정 실행
cp accounts.json.example accounts.json      # 계정 설정 파일 생성 후 키 입력
node scripts/run-pipeline.js --auto --account brandA
node scripts/run-pipeline.js "AI 마케팅" --account brandB
```

---

## 환경변수 (.env)

```env
# Gemini API
GEMINI_API_KEY=your_key_here
GEMINI_TEXT_MODEL=gemini-2.5-flash            # SNS 콘텐츠 생성 (속도+품질 밸런스)
GEMINI_LITE_MODEL=gemini-3.1-flash-lite-preview  # 트렌드 분류 (가성비 최우선)
GEMINI_IMAGE_MODEL=nano-banana-pro-preview    # 이미지 생성 (Nano Banana 2)

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Meta (Instagram + Threads) - 추후 추가
META_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
THREADS_USER_ID=
```

---

## 파이프라인 구조

```
Stage 1: 트렌드 수집
  ├── trend-scanner.js    → Google News KR RSS 수집 (상위 10개)
  └── content-analyzer.js → Gemini Lite로 바이럴 점수 분석

Stage 2: 콘텐츠 생성
  ├── osmu-engine.js      → 1소스 → Instagram/Threads/Twitter/Blog 4채널 변환
  └── image-generator.js  → Nano Banana 2로 SNS용 이미지 생성 → output/ 저장

Stage 3: 발행
  ├── slack-notifier.js   → Slack 검수 요청 발송
  ├── meta-publisher.js   → Instagram/Threads Graph API 발행
  └── playwright-publisher.js → Naver Blog 브라우저 자동화 발행
```

---

## 프로젝트 구조

```
ai_automation/
├── scripts/
│   └── run-pipeline.js          # CLI 진입점
├── src/
│   ├── common/
│   │   ├── gemini-client.js     # Gemini API 클라이언트 (text/lite/image)
│   │   └── slack-notifier.js    # Slack Webhook 노티파이어
│   ├── stage1/
│   │   ├── trend-scanner.js     # Google News RSS 트렌드 수집
│   │   └── content-analyzer.js  # Gemini Lite 바이럴 점수 분석
│   ├── stage2/
│   │   ├── osmu-engine.js       # OSMU 콘텐츠 생성 엔진
│   │   └── image-generator.js   # 이미지 생성 및 저장
│   └── stage3/
│       ├── meta-publisher.js    # Meta Graph API 발행
│       └── playwright-publisher.js # Naver Blog 자동화
├── tests/                       # Jest 테스트 (38/38 PASS)
├── output/                      # 생성된 이미지 저장 (gitignore)
├── .env.example                 # 환경변수 템플릿
└── package.json
```

---

## Gemini 모델 구성

| 역할 | 모델 | 특징 |
|------|------|------|
| SNS 텍스트 생성 | `gemini-2.5-flash` | 속도+지능 밸런스, 범용 표준 |
| 트렌드 분류/분석 | `gemini-3.1-flash-lite-preview` | 가성비 최우선, 단순 분류 특화 |
| 이미지 생성 | `nano-banana-pro-preview` | Nano Banana 2, 텍스트→이미지 특화 |

---

## 다중 계정 설정

`accounts.json.example`을 복사해 `accounts.json` 생성 후 계정별 API 키를 입력합니다.
(`accounts.json`은 .gitignore 처리 — 키가 GitHub에 업로드되지 않음)

```json
{
  "accounts": {
    "brandA": { "GEMINI_API_KEY": "...", "SLACK_WEBHOOK_URL": "...", ... },
    "brandB": { "GEMINI_API_KEY": "...", "SLACK_WEBHOOK_URL": "...", ... }
  }
}
```

## 테스트

```bash
npm test                          # 전체 테스트
npm test tests/common/            # 특정 모듈만
```

현재 **51/51 테스트 통과**.

---

## 로드맵

- [x] Phase 1: Gemini 콘텐츠 생성 + Slack 검수 MVP
- [ ] Phase 2: Instagram/Threads Meta API 자동 발행
- [ ] Phase 3: Naver Blog Playwright 자동화
- [x] Phase 4: 트렌드 분석 대시보드 + 다중 계정 관리
