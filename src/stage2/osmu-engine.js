'use strict';

const OSMU_PROMPT = (topic) => `
당신은 한국의 프로 SNS 마케터입니다. 아래 주제로 4개 플랫폼용 콘텐츠를 동시에 작성하세요.

주제: "${topic}"

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "instagram": "이모지와 해시태그가 포함된 감성적인 인스타그램 문구 (최대 150자)",
  "threads": "질문 또는 공감 유도형 쓰레드 문구 (최대 200자)",
  "twitter": "팩트 중심의 트위터 문구 (최대 140자)",
  "blog": "소제목이 포함된 SEO 최적화 블로그 원고 (600자 이상)",
  "imagePrompt": "Stable Diffusion 스타일의 영문 이미지 생성 프롬프트 (50자 이내)"
}
`;

function parseOsmuResponse(raw) {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Gemini OSMU response: ${raw.slice(0, 100)}`);
  }
}

function createOsmuEngine(geminiClient) {
  async function generate(topic) {
    const prompt = OSMU_PROMPT(topic);
    const raw = await geminiClient.generateText(prompt);
    return parseOsmuResponse(raw);
  }

  return { generate };
}

module.exports = { createOsmuEngine };
