'use strict';

const fs = require('fs');
const path = require('path');

function createImageGenerator(geminiClient, outputDir = './output/images') {
  async function generate(imagePrompt) {
    const { data, mimeType } = await geminiClient.generateImage(imagePrompt);

    fs.mkdirSync(outputDir, { recursive: true });

    const ext = mimeType.split('/')[1] || 'png';
    const filename = `img_${Date.now()}.${ext}`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    return filepath;
  }

  return { generate };
}

module.exports = { createImageGenerator };
