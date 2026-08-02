#!/usr/bin/env node
// npx create-field-broadsheet <directory> — scaffolds a copy of this template
// into a new project directory so someone can start writing their own
// dispatches immediately.
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: npx create-field-broadsheet <directory>');
  process.exit(1);
}

const dest = path.resolve(process.cwd(), target);
if (fs.existsSync(dest) && fs.readdirSync(dest).length) {
  console.error(`"${target}" already exists and is not empty.`);
  process.exit(1);
}

const root = __dirname;
const SKIP = new Set(['node_modules', 'dist', '.git', 'cli.js', 'package-lock.json', 'CLAUDE.md']);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const s = path.join(src, entry.name), d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(root, dest);

// Stamp the new project's own name into its package.json and drop the
// npx-initializer bits — the scaffolded project isn't itself publishable.
const pkgPath = path.join(dest, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = path.basename(dest).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
pkg.private = true;
delete pkg.bin;
delete pkg.description;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`\nCreated ${target}.\n`);
console.log('Next steps:');
console.log(`  cd ${target}`);
console.log('  npm install');
console.log('  npm run dev\n');
console.log('Then edit field.config.js and content/*.md — see README.md.\n');
