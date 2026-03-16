'use strict';

const { IncomingWebhook } = require('@slack/webhook');

function createSlackNotifier(webhookUrl) {
  if (!webhookUrl) throw new Error('SLACK_WEBHOOK_URL is required');

  const webhook = new IncomingWebhook(webhookUrl);

  async function sendApprovalRequest(content) {
    const { topic, instagram, threads, imagePrompt } = content;

    return webhook.send({
      text: `[검수 요청] 소재: *${topic}*`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📋 콘텐츠 검수 요청: ${topic}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Instagram*\n${instagram}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Threads*\n${threads}` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*이미지 프롬프트*\n${imagePrompt}` },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '✅ 승인' },
              style: 'primary',
              value: JSON.stringify({ action: 'approve', topic }),
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '❌ 거절' },
              style: 'danger',
              value: JSON.stringify({ action: 'reject', topic }),
            },
          ],
        },
      ],
    });
  }

  return { sendApprovalRequest };
}

module.exports = { createSlackNotifier };
