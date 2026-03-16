'use strict';

jest.mock('@slack/webhook');

const { IncomingWebhook } = require('@slack/webhook');
const { createSlackNotifier } = require('../../src/common/slack-notifier');

describe('slack-notifier', () => {
  let mockSend;
  let notifier;

  beforeEach(() => {
    mockSend = jest.fn().mockResolvedValue({ text: 'ok' });
    IncomingWebhook.mockImplementation(() => ({ send: mockSend }));
    notifier = createSlackNotifier('https://hooks.slack.com/test');
  });

  it('throws when webhook URL is missing', () => {
    expect(() => createSlackNotifier(null)).toThrow('SLACK_WEBHOOK_URL is required');
  });

  it('throws when webhook URL is empty string', () => {
    expect(() => createSlackNotifier('')).toThrow('SLACK_WEBHOOK_URL is required');
  });

  it('sends approval request containing topic in header', async () => {
    const content = {
      topic: 'AI 트렌드',
      instagram: '인스타 문구입니다 #AI',
      threads: '쓰레드 문구입니다',
      imagePrompt: 'A futuristic robot',
    };

    await notifier.sendApprovalRequest(content);

    expect(mockSend).toHaveBeenCalledOnce;
    const payload = mockSend.mock.calls[0][0];
    expect(payload.text).toContain('AI 트렌드');
    expect(payload.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'header' }),
      expect.objectContaining({ type: 'section' }),
      expect.objectContaining({ type: 'actions' }),
    ]));
  });

  it('includes instagram and threads content in blocks', async () => {
    await notifier.sendApprovalRequest({
      topic: '테스트',
      instagram: '인스타 내용',
      threads: '쓰레드 내용',
      imagePrompt: 'test image',
    });

    const payload = mockSend.mock.calls[0][0];
    const blockTexts = payload.blocks
      .filter((b) => b.type === 'section')
      .map((b) => b.text.text)
      .join(' ');

    expect(blockTexts).toContain('인스타 내용');
    expect(blockTexts).toContain('쓰레드 내용');
  });
});
