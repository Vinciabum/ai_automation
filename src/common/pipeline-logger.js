'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.resolve(__dirname, '../../data/runs.json');

function createPipelineLogger(filePath = DEFAULT_PATH) {
  function load() {
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')).runs || [];
    } catch {
      return [];
    }
  }

  function save(run) {
    const runs = load();
    runs.push({ ...run, timestamp: new Date().toISOString() });
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ runs }, null, 2), 'utf8');
  }

  return { save, load };
}

module.exports = { createPipelineLogger };
