'use strict';

const { createMetaPublisher } = require('../../src/stage3/meta-publisher');

// Node.js 22 native fetch mock
global.fetch = jest.fn();

const config = {
  accessToken: 'test-token',
  instagramUserId: 'ig-123',
  threadsUserId: 'th-456',
};

function mockFetchResponse(body, status = 200) {
  return Promise.resolve({
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
  });
}

describe('meta-publisher', () => {
  let publisher;

  beforeEach(() => {
    publisher = createMetaPublisher(config);
    fetch.mockReset();
  });

  it('throws when accessToken is missing', () => {
    expect(() => createMetaPublisher({ ...config, accessToken: null })).toThrow('META_ACCESS_TOKEN is required');
  });

  describe('publishInstagram', () => {
    it('creates media container then publishes, returns post id', async () => {
      fetch
        .mockResolvedValueOnce(mockFetchResponse({ id: 'container-id' }))
        .mockResolvedValueOnce(mockFetchResponse({ id: 'post-id-123' }));

      const result = await publisher.publishInstagram('Test caption #AI', 'https://example.com/image.png');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('post-id-123');
    });

    it('throws Instagram API error with message', async () => {
      fetch.mockResolvedValueOnce(
        mockFetchResponse({ error: { message: 'Invalid token' } }, 400)
      );

      await expect(
        publisher.publishInstagram('caption', 'https://example.com/img.png')
      ).rejects.toThrow('Instagram API error: Invalid token');
    });
  });

  describe('publishThreads', () => {
    it('creates thread container then publishes, returns post id', async () => {
      fetch
        .mockResolvedValueOnce(mockFetchResponse({ id: 'thread-container' }))
        .mockResolvedValueOnce(mockFetchResponse({ id: 'thread-post-id' }));

      const result = await publisher.publishThreads('쓰레드 내용입니다');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('thread-post-id');
    });
  });
});
