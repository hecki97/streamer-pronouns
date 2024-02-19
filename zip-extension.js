const zipdir = require('zip-dir');
const fs = require('fs');

const outputDir = './bin';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

zipdir('./dist', {
  saveTo: `${outputDir}/streamer-pronouns.zip`,
  each: console.log,
});
