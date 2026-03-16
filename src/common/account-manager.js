'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.resolve(__dirname, '../../accounts.json');

function createAccountManager(filePath = DEFAULT_PATH) {
  function _load() {
    if (!fs.existsSync(filePath)) {
      throw new Error(`accounts.json 파일이 없습니다: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  function list() {
    return Object.keys(_load().accounts || {});
  }

  function getEnv(name) {
    const data = _load();
    const account = (data.accounts || {})[name];
    if (!account) throw new Error(`계정을 찾을 수 없습니다: ${name}`);
    return account;
  }

  return { list, getEnv };
}

module.exports = { createAccountManager };
