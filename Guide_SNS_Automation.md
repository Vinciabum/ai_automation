# 실전 SNS & 블로그 자동화 가이드 (Updated)

이 가이드는 n8n과 AI를 활용하여 콘텐츠 기획부터 다채널 발행까지 시스템화하는 실무 매뉴얼입니다.

## 1. 시스템 아키텍처 (n8n 기반)
1.  **Input**: RSS 피드, 유튜브 구독 리스트, 트렌드 키워드 (Trigger).
2.  **Processing**: Gemini 2.5 Pro (`@google/genai` 라이브러리)를 통한 요약 및 플랫폼별 콘텐츠 변환.
3.  **Output**: 인스타그램, 쓰레드, 트위터, 블로그 자동 발행 (API/Webhook).

## 2. 단계별 구축 가이드

### 1단계: 마켓 리딩 대시보드 구축 (n8n)
*   **유튜브 데이터**: YouTube API를 통해 특정 채널의 조회수 급상승 영상 제목 및 스크립트 수집.
*   **뉴스레터/RSS**: 주요 산업 뉴스레터를 자동 수집하여 요약 후 데이터베이스(Notion/Airtable) 저장.

### 2단계: AI 콘텐츠 리퍼퍼징 엔진 설정
*   **Gemini API 활용**: n8n 내 'Code Node'에 `@google/genai` 모듈(`GEMINI_API_KEY` 환경변수)을 연동하여, 긴 글을 SNS용 숏폼 문구로 변환하는 프롬프트 최적화.
*   **이미지 자동화**: n8n과 Gemini Image API (`gemini-2.5-flash-image` 모델)를 연결하여 문구에 맞는 이미지/카드뉴스 배경 자동 생성.

### 3단계: 다채널 발행 시스템 연동
*   **Meta Graph API (Instagram/Threads)**: n8n의 HTTP Request 노드를 통해 공식 API로 이미지 및 텍스트 업로드.
*   **Twitter API**: 타래(Thread) 작성을 위한 시퀀셜 업로드 로직 구성.
*   **Blog API**: WordPress REST API 또는 Tistory API를 연동하여 포스팅 자동화.

## 3. 플랫폼별 최적화 팁 (2025)
*   **Threads**: 텍스트 중심의 소통이 중요하므로 AI가 질문을 던지는 형태의 문구 생성.
*   **X (Twitter)**: 실시간 트렌드 해시태그를 AI가 판단하여 본문에 포함.
*   **Naver Blog**: n8n에서 생성한 원고를 Playwright 스크립트로 전달하여 실제 브라우저에서 포스팅하는 하이브리드 방식 권장.

## 4. 운영 및 안전 수칙
*   **API Quota 관리**: 각 플랫폼의 호출 제한(Rate Limit)을 넘지 않도록 n8n 'Wait' 노드 활용.
*   **인간 검수 단계**: (선택 사항) 발행 전 슬랙(Slack) 메시지로 승인 버튼을 보내, 클릭 시에만 발행되도록 설정.
