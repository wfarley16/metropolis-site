#!/usr/bin/env node
/*
 * sync-doc.js — copy a vault markdown node into the marketing site as a gated doc.
 *
 * Usage:  node sync-doc.js <path-to-vault-node.md> [--slug SLUG]
 *
 * Copies the node's BODY (strips YAML frontmatter, trailing Source/Mentions
 * sections, and flattens [[wikilinks]]) into `resource-<slug>.src.md`. That file
 * is git-ignored plaintext; `build.js` encrypts it into the gated hub, where it
 * renders read-only via the markdown viewer. Edit in the vault, re-sync, rebuild.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const src = args[0];
if (!src || !fs.existsSync(src)) {
  console.error('Usage: node sync-doc.js <path-to-vault-node.md> [--slug SLUG]');
  process.exit(1);
}
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };

let raw = fs.readFileSync(src, 'utf8');

// Strip YAML frontmatter, capturing a couple of fields.
const fm = {};
const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (m) {
  m[1].split('\n').forEach(l => { const mm = l.match(/^([a-zA-Z_]+):\s*(.*)$/); if (mm) fm[mm[1]] = mm[2].replace(/^['"]|['"]$/g, ''); });
  raw = raw.slice(m[0].length);
}
// Drop ailexandria's auto-appended provenance sections.
raw = raw.replace(/\n#{1,6}\s+(Source|Mentions)\b[\s\S]*$/, '\n');
// Flatten wikilinks: [[a|b]] -> b ; [[a-b]] -> "a b".
raw = raw.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, (_, x) => x.replace(/-/g, ' '));
raw = raw.trim() + '\n';

const slug = opt('slug') || fm.id || path.basename(src).replace(/\.md$/, '');
const outName = 'resource-' + slug + '.src.md';
fs.writeFileSync(path.join(__dirname, outName), raw);           // always write into the site repo
console.log(`Wrote ${outName} (${raw.length} bytes) into ${__dirname}`);
console.log(`Next: ensure a TREE node in build.js uses  src: '${outName}'  then run  node build.js`);
