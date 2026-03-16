# SNS Automation System Architecture

이 문서는 n8n과 Gemini 2.5 Pro를 기반으로 구축된 SNS 및 블로그 자동화 시스템의 전체 구조를 Mermaid 다이어그램으로 시각화한 것입니다.

## 1. 전체 데이터 파이프라인 (Flowchart)

```mermaid
graph TD
    %% Stage 1: Market Analysis
    subgraph Stage_1_Planning [Stage 1: 기획 자동화]
        A[Trigger: n8n Cron/Webhook] --> B{Data Source}
        B -->|YouTube API| C[영상 트렌드 수집]
        B -->|RSS/News| D[뉴스/블로그 수집]
        C & D --> E[Gemini 2.5 Pro: 바이럴 소재 분석]
        E --> F[(Notion DB: 기획안 저장)]
    end

    %% Stage 2: Content Production
    subgraph Stage_2_Production [Stage 2: 제작 자동화]
        F --> G[Gemini 2.5 Pro: OSMU 콘텐츠 변환]
        G --> H{Content Types}
        H -->|Blog| I[Long-form Text]
        H -->|SNS| J[Short-form / Threads]
        H -->|Image| K[Gemini Image API: 비주얼 생성]
        I & J & K --> L[Slack: 최종 검수 승인 요청]
    end

    %% Stage 3: Distribution
    subgraph Stage_3_Distribution [Stage 3: 배포 및 운영]
        L -->|승인 시| M{Platform Router}
        M -->|API 지원| N[Instagram / Threads / X / WP]
        M -->|API 미지원| O[Playwright: Naver/Tistory]
        N & O --> P[Post Published]
        P --> Q[Gemini 2.5 Pro: 댓글/DM 자동 응대]
    end

    %% Styling
    style Stage_1_Planning fill:#f9f,stroke:#333,stroke-width:2px
    style Stage_2_Production fill:#ccf,stroke:#333,stroke-width:2px
    style Stage_3_Distribution fill:#cfc,stroke:#333,stroke-width:2px
```

## 2. 콘텐츠 리퍼퍼징 시퀀스 (Sequence Diagram)

```mermaid
sequenceDiagram
    participant n8n as n8n Workflow
    participant Gemini as Gemini 2.5 Pro
    participant ImageGen as Gemini Image API
    participant DB as Notion/Airtable

    n8n->>DB: 기획 소재(Raw Data) 호출
    DB-->>n8n: 소재 데이터 반환
    n8n->>Gemini: 콘텐츠 변환 요청 (OSMU Prompt)
    Gemini-->>n8n: [블로그 원고, SNS 문구, 이미지 프롬프트] 반환
    n8n->>ImageGen: 이미지 생성 요청 (Prompt 전달)
    ImageGen-->>n8n: 이미지 URL/파일 반환
    n8n->>n8n: 패키징 (Text + Image)
    n8n->>DB: 제작 완료 상태 업데이트
```

## 3. 하이브리드 배포 엔진 로직 (Decision Logic)

```mermaid
graph LR
    A[Start Distribution] --> B{Is API Available?}
    B -- Yes --> C[HTTP Request Node]
    C --> D[Official Meta/X/WP API]
    B -- No --> E[Execute Script Node]
    E --> F[Playwright / Puppeteer]
    F --> G[Browser Login & Post]
    D & G --> H[Success Notification]
    H --> I[Engagement Monitor Start]
```

## 4. 핵심 기술 스택 요약
*   **Orchestration**: n8n
*   **AI Engine**: `@google/genai` (Gemini 2.5 Pro & Flash Image)
*   **Infrastructure**: Docker, Node.js, Playwright
*   **Auth**: `GEMINI_API_KEY` 환경변수 일원화 관리
