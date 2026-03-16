# AI SNS & 블로그 자동화 조사 보고서 (Updated)

본 보고서는 Playwright로 추출한 FastCampus 'AI SNS 자동화' 강의 데이터와 2025년 최신 플랫폼 트렌드를 기반으로 작성되었습니다.

## 1. 강의 핵심 자동화 전략 (n8n + AI 중심)
*   **n8n 워크플로우**: 단순한 스크립트 실행이 아닌, API와 Webhook을 결합한 유기적인 자동화 엔진 구축.
*   **마켓 리딩 대시보드**: 유튜브, 인스타그램, 뉴스레터 등 다양한 소스에서 데이터를 긁어와(Scraping) '바이럴 가능성'이 높은 콘텐츠를 선별.
*   **Gemini 2.5 Pro 활용**: 자동화 로직 구현 시 AI가 코드를 직접 짜거나 보완하여 비전공자도 시스템 구축 가능 (@google/genai 라이브러리 및 GEMINI_API_KEY 활용).
*   **OSMU(One Source Multi Use)**: 하나의 메인 콘텐츠(예: 블로그/유튜브)를 쇼츠, 카드뉴스, 트윗, 블로그 포스팅으로 자동 변환.

## 2. 플랫폼별 2025년 자동화 제약 및 기회
*   **Threads & Instagram (Meta)**: API 공식 지원이 강력해졌으나, 스팸 필터가 고도화됨. n8n을 통한 공식 Graph API 활용이 가장 안전.
*   **Twitter (X)**: 유료 API 비용이 높으나, 텍스트 기반 콘텐츠의 전파력이 가장 빠름. 타래(Thread) 자동 생성 기능이 핵심.
*   **블로그 (Naver, WordPress)**: 
    *   **Naver**: API 제한이 심해 Playwright를 통한 정밀한 UI 자동화가 필요함. 
    *   **WordPress**: REST API를 통해 n8n과 연동하기 가장 수월함.
*   **LinkedIn**: 전문 지식 기반의 자동화가 핵심이며, 리드 웜업(Lead Warmup) 시스템을 통해 잠재 고객을 발굴.

## 3. 기술적 핵심: 리퍼퍼징(Repurposing) 시스템
*   단순 복사 붙여넣기가 아닌, AI가 플랫폼별 '말투(Tone & Manner)'와 '규격(Resolution/Length)'을 자동 조정.
*   이미지 콘텐츠는 Canva/Adobe Express API 또는 Gemini Image API (gemini-2.5-flash-image)를 통해 자동 생성.
