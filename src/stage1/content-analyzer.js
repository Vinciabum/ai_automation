'use strict';

const ANALYZE_PROMPT = (trends) => `
당신은 SNS 바이럴 콘텐츠 전문 분석가입니다.
아래 트렌드 항목들을 분석하여 SNS 콘텐츠 소재로서의 가치를 평가하세요.

트렌드 목록:
${trends.map((t, i) => `항목${i + 1}: ${t.title}`).join('\n')}

각 항목에 대해 다음 JSON 배열 형식으로만 응답하세요 (마크다운 없이, 순수 JSON만):
[
  {
    "title": "항목 제목 (특수문자 없이 핵심만)",
    "viralScore": 1~10 사이 정수,
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "hook": "SNS 도입부 한 문장 (따옴표 없이)",
    "contentAngle": "콘텐츠 방향 한 문장 (따옴표 없이)"
  }
]
`;

function parseAnalyzeResponse(raw) {
  // 코드블록 제거
  let cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  // JSON 배열 영역만 추출 (시작 [ 부터 마지막 ] 까지)
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    // 파싱 실패 시 각 객체를 개별 파싱하는 fallback
    const objects = cleaned.match(/\{[\s\S]*?\}/g) || [];
    const results = objects.map((obj) => {
      try { return JSON.parse(obj); } catch { return null; }
    }).filter(Boolean);
    if (results.length > 0) return results;
    throw new Error(`Failed to parse analyzer response: ${raw.slice(0, 100)}`);
  }
}

function createContentAnalyzer(geminiClient) {
  async function analyze(trends) {
    if (!trends || trends.length === 0) throw new Error('No trends to analyze');

    const prompt = ANALYZE_PROMPT(trends);
    const raw = await geminiClient.generateText(prompt, { lite: true });
    const results = parseAnalyzeResponse(raw);

    return results.sort((a, b) => b.viralScore - a.viralScore);
  }

  async function pickBest(trends) {
    const results = await analyze(trends);
    return results[0].title;
  }

  return { analyze, pickBest };
}

module.exports = { createContentAnalyzer };
