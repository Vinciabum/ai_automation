'use strict';

const fs = require('fs');
const { createImageGenerator } = require('../../src/stage2/image-generator');

describe('image-generator', () => {
  let mockGeminiClient;
  let generator;

  beforeEach(() => {
    mockGeminiClient = { generateImage: jest.fn() };
    generator = createImageGenerator(mockGeminiClient, '/tmp/test-images');
  });

  it('calls generateImage with the prompt', async () => {
    const fakeBase64 = Buffer.from('fake-image-data').toString('base64');
    mockGeminiClient.generateImage.mockResolvedValue({ data: fakeBase64, mimeType: 'image/png' });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    await generator.generate('A coffee cup');

    expect(mockGeminiClient.generateImage).toHaveBeenCalledWith('A coffee cup');
  });

  it('saves file to outputDir and returns file path ending with .png', async () => {
    const fakeBase64 = Buffer.from('fake-image-data').toString('base64');
    mockGeminiClient.generateImage.mockResolvedValue({ data: fakeBase64, mimeType: 'image/png' });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const result = await generator.generate('A coffee cup');

    expect(writeSpy).toHaveBeenCalled();
    expect(result).toMatch(/img_\d+\.png$/);
    expect(result).toContain('test-images');
  });

  it('uses mimeType extension for filename', async () => {
    const fakeBase64 = Buffer.from('fake-jpeg-data').toString('base64');
    mockGeminiClient.generateImage.mockResolvedValue({ data: fakeBase64, mimeType: 'image/jpeg' });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const result = await generator.generate('portrait photo');

    expect(result).toMatch(/\.jpeg$/);
  });
});
