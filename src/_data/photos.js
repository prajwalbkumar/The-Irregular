const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Contact-strip manifest, real `src/*` if provided, else a picsum placeholder
// seeded from `s` — real photos.yml entries win as soon as a src lands.
module.exports = () => {
  const raw = fs.readFileSync(path.join(__dirname, '../content/photos.yml'), 'utf8');
  const photos = yaml.load(raw) || [];
  return photos.map(p => ({
    s: p.s,
    src: p.src || `https://picsum.photos/seed/${p.s}/520/390`,
    city: p.city || null,
    cap: p.cap
  }));
};
