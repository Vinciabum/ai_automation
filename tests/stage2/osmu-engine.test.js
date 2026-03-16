'use strict';

const { createOsmuEngine } = require('../../src/stage2/osmu-engine');

describe('osmu-engine', () => {
  let mockGeminiClient;
  let engine;

  beforeEach(() => {
    mockGeminiClient = { generateText: jest.fn() };
    engine = createOsmuEngine(mockGeminiClient);
  });

  it('generates all 5 fields from topic', async () => {
    const mockResponse = JSON.stringify({
      instagram: '✨ AI가 바꾸는 마케팅 #AI #마케팅',
      threads: 'AI 마케팅, 함께 알아봐요.',
      twitter: 'AI marketing is transforming the industry.',
      blog: '# AI 마케팅\n\n인공지능은...',
      imagePrompt: 'A robot typing on a laptop, digital art',
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

  it('strips markdown code fences before parsing JSON', async () => {
    const mockResponse = '```json\n{"instagram":"test","threads":"t","twitter":"t","blog":"b","imagePrompt":"p"}\n```';
    mockGeminiClient.generateText.mockResolvedValue(mockResponse);

    const result = await engine.generate('topic');
    expect(result.instagram).toBe('test');
  });

  it('throws descriptive error when Gemini returns invalid JSON', async () => {
    mockGeminiClient.generateText.mockResolvedValue('완전히 잘못된 응답입니다');

    await expect(engine.generate('topic')).rejects.toThrow('Failed to parse Gemini OSMU response');
  });

  it('includes topic in the prompt sent to Gemini', async () => {
    mockGeminiClient.generateText.mockResolvedValue(
      JSON.stringify({ instagram: 'i', threads: 't', twitter: 'tw', blog: 'b', imagePrompt: 'p' })
    );

    await engine.generate('커피 레시피');

    const prompt = mockGeminiClient.generateText.mock.calls[0][0];
    expect(prompt).toContain('커피 레시피');
  });
});
