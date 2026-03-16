# SNS & Blog Automation System PRD (Updated)

## 1. 프로젝트 개요
*   **목적**: n8n과 AI를 활용한 "One-Source Multi-Channel" 자동화 시스템 구축.
*   **핵심 지표**: 주간 콘텐츠 발행량 21건 이상(일 3건), 수동 작업 시간 90% 감소.
*   **대상 플랫폼**: 인스타그램, 쓰레드, 트위터, 네이버 블로그, 워드프레스.

## 2. 기능 요구사항 (Features)

### F1. 데이터 수집 엔진 (Market Reading)
*   구독한 유튜브 채널, 뉴스 웹사이트의 신규 포스트 자동 감지.
*   감지된 데이터에서 핵심 키워드 및 인사이트를 추출하여 데이터베이스화.

### F2. AI 리퍼퍼징 시스템 (Repurposing)
*   하나의 소스 데이터(영상 스크립트, 뉴스 기사)를 다음 포맷으로 변환:
    *   **Instagram**: 카드뉴스용 요약 문구 + 이미지 프롬프트.
    *   **Threads/Twitter**: 스레드형(타래) 텍스트 포스트.
    *   **Blog**: SEO 최적화된 롱폼 아티클.

### F3. 자동 발행 및 스케줄링 (Distribution)
*   n8n 워크플로우를 통한 시간차 자동 발행.
*   플랫폼별 공식 API 및 브라우저 자동화(Playwright) 하이브리드 엔진 운영.
*   발행 실패 시 재시도 로직 및 관리자 알림.

### F4. 리드 웜업 및 대응 (Engagement)
*   댓글 자동 감지 및 AI 기반 자동 응답(선택적).
*   관심 고객(Lead)의 메시지/댓글 발생 시 알림 시스템.

## 3. 기술적 요구사항 (Technical)
*   **Automation**: n8n (Self-hosted 또는 Cloud).
*   **AI Models**: Gemini 2.5 Pro (핵심 로직 및 데이터 요약, `gemini-2.5-pro`), Gemini 2.5 Flash Image (이미지 생성, `gemini-2.5-flash-image`).
*   **AI Library**: `@google/genai` (인증: `GEMINI_API_KEY` 환경변수)
*   **Tools**: Playwright (UI 자동화용), Notion (데이터베이스).

## 4. 로드맵 (Roadmap)
1.  **Phase 1**: n8n과 AI를 연동한 인스타그램/쓰레드 자동 발행 MVP 구축.
2.  **Phase 2**: 네이버 블로그 및 워드프레스 포스팅 엔진 결합.
3.  **Phase 3**: 트렌드 분석 대시보드 연동을 통한 기획 자동화.
4.  **Phase 4**: 다중 계정 관리 및 분석 기능 고도화.
