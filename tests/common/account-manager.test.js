'use strict';

const path = require('path');
const { createAccountManager } = require('../../src/common/account-manager');

const FIXTURE_PATH = path.resolve(__dirname, '../fixtures/accounts-test.json');

describe('account-manager', () => {
  test('이름으로 계정 env를 반환한다', () => {
    const mgr = createAccountManager(FIXTURE_PATH);
    const env = mgr.getEnv('brandA');
    expect(env.GEMINI_API_KEY).toBe('key-brandA');
    expect(env.SLACK_WEBHOOK_URL).toBe('https://hooks.slack.com/brandA');
  });

  test('존재하지 않는 계정은 에러를 던진다', () => {
    const mgr = createAccountManager(FIXTURE_PATH);
    expect(() => mgr.getEnv('unknown')).toThrow('계정을 찾을 수 없습니다: unknown');
  });

  test('계정 목록을 반환한다', () => {
    const mgr = createAccountManager(FIXTURE_PATH);
    const names = mgr.list();
    expect(names).toContain('brandA');
    expect(names).toContain('brandB');
  });

  test('accounts.json 파일이 없으면 에러를 던진다', () => {
    const mgr = createAccountManager('/tmp/nonexistent-accounts.json');
    expect(() => mgr.list()).toThrow('accounts.json 파일이 없습니다');
  });
});
