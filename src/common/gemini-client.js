'use strict';

const { GoogleGenAI } = require('@google/genai');

// SNS 콘텐츠 생성: 속도+품질 최적 밸런스
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
// 단순 분류/분석 (Stage 1 트렌드 수집): 압도적 가성비 최신 (Gemini 3.1 Flash Lite)
const LITE_MODEL = process.env.GEMINI_LITE_MODEL || 'gemini-3.1-flash-lite-preview';
// 이미지 생성: Nano Banana 2 (텍스트→이미지 특화 최첨단 모델)
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'nano-banana-pro-preview';

function createGeminiClient(apiKey) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is required');

  const ai = new GoogleGenAI({ apiKey });

  async function generateText(prompt, { lite = false } = {}) {
    const response = await ai.models.generateContent({
      model: lite ? LITE_MODEL : TEXT_MODEL,
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
