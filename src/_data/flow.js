const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// The ordered dispatch column — resolved against POSTS/BRIEFS/QUOTES/PANELS
// by 10-render.js at runtime; here it's passed through as authored.
module.exports = () => {
  const raw = fs.readFileSync(path.join(__dirname, '../content/flow.yml'), 'utf8');
  return yaml.load(raw) || [];
};
