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

  describe('createGeminiClient', () => {
    it('throws when API key is missing', () => {
      expect(() => createGeminiClient(null)).toThrow('GEMINI_API_KEY is required');
    });

    it('throws when API key is empty string', () => {
      expect(() => createGeminiClient('')).toThrow('GEMINI_API_KEY is required');
    });
  });

  describe('generateText', () => {
    it('calls Gemini with gemini-2.5-pro model and returns text', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Hello from Gemini' });

      const result = await client.generateText('Write a post about coffee');

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: expect.stringMatching(/^gemini-/),
        contents: 'Write a post about coffee',
      });
      expect(result).toBe('Hello from Gemini');
    });
  });

  describe('generateImage', () => {
    it('calls image model and returns base64 inlineData', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                { inlineData: { data: 'base64encodedimage', mimeType: 'image/png' } },
              ],
            },
          },
        ],
      });

      const result = await client.generateImage('A cup of coffee on a wooden table');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
        })
      );
      expect(result).toEqual({ data: 'base64encodedimage', mimeType: 'image/png' });
    });
  });
});
