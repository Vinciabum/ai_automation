'use strict';

const GRAPH_API = 'https://graph.facebook.com/v19.0';
const THREADS_API = 'https://graph.threads.net/v1.0';

function createMetaPublisher({ accessToken, instagramUserId, threadsUserId }) {
  if (!accessToken) throw new Error('META_ACCESS_TOKEN is required');

  async function apiPost(url, body) {
    const params = new URLSearchParams({ ...body, access_token: accessToken });
    const res = await fetch(`${url}?${params}`, { method: 'POST' });
    const json = await res.json();
    if (json.error) throw new Error(`Instagram API error: ${json.error.message}`);
    return json;
  }

  async function publishInstagram(caption, imageUrl) {
    const container = await apiPost(`${GRAPH_API}/${instagramUserId}/media`, {
      caption,
      image_url: imageUrl,
      media_type: 'IMAGE',
    });

    const post = await apiPost(`${GRAPH_API}/${instagramUserId}/media_publish`, {
      creation_id: container.id,
    });

    return post.id;
  }

  async function publishThreads(text) {
    const container = await apiPost(`${THREADS_API}/${threadsUserId}/threads`, {
      media_type: 'TEXT',
      text,
    });

    const post = await apiPost(`${THREADS_API}/${threadsUserId}/threads_publish`, {
      creation_id: container.id,
    });

    return post.id;
  }

  return { publishInstagram, publishThreads };
}

module.exports = { createMetaPublisher };
