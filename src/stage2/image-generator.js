'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PYTHON_SCRIPT = path.resolve(__dirname, '../../scripts/generate-image.py');

function createImageGenerator(geminiClient, outputDir = './output/images') {
  async function generate(imagePrompt) {
    fs.mkdirSync(outputDir, { recursive: true });
    const filepath = path.join(outputDir, `img_${Date.now()}.png`);

    return new Promise((resolve, reject) => {
      execFile('python', [PYTHON_SCRIPT, imagePrompt, filepath], {
        env: { ...process.env }
      }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout.trim());
      });
    });
  }

  return { generate };
}

module.exports = { createImageGenerator };
