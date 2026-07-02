#!/usr/bin/env node
/*
 * build.js — encrypt the gated investor hub (nav tree + documents).
 *
 * Usage:  node build.js            (reads passphrase from .env)
 *   (or)  node build.js "passphrase"
 *
 * Walks TREE, encrypts each node's `src` (plaintext *.src.html, NOT committed)
 * plus the nav tree itself, into a single committed `docs.enc.js`:
 *     window.__ENC = { nav:{…}, n3:{…}, … }   // AES-256-GCM payloads, opaque keys
 *
 * The nav (titles + structure) is encrypted too, so the internal system names
 * never appear in the public source. investors.html decrypts `nav` on unlock,
 * renders the sidebar, and decrypts a node's doc when it's opened. Node ids are
 * opaque (n0, n1, …); titles live only inside the encrypted nav.
 */
const fs = require('fs');
const crypto = require('crypto');

// The gated hub. `src` = a plaintext HTML file to encrypt (git-ignored). Nodes
// without a `src` render as "draft in progress" placeholders until one is added.
const TREE = [
  { title: 'Business plan', src: 'plan.src.html' },
  { title: 'How it works', children: [
    { title: 'ailexandria — knowledge & memory vault', src: 'resource-ailexandria.src.html' },
    { title: 'polis — the planning engine', src: 'resource-polis.src.html', children: [
      { title: 'Platform architecture', children: [
        { title: 'Platform API', src: 'resource-platform-api.src.html' },
        { title: 'Worker', src: 'resource-worker.src.html' },
        { title: 'Temporal — durable orchestration', src: 'resource-temporal.src.html' },
        { title: 'Generic resource abstraction', src: 'resource-resource-abstraction.src.html' },
        { title: 'UI kits / design system', src: 'resource-ui-kits.src.html' },
      ]},
      { title: 'Config versioning / control plane', src: 'resource-control-plane.src.md' },
    ]},
    { title: 'Planning spaces', src: 'resource-planning-spaces.src.html', children: [
      { title: 'artemis — first space (job hunt)', src: 'resource-artemis.src.html' },
      { title: 'acme — testing / reference app', src: 'resource-acme.src.html' },
    ]},
  ]},
];

// Load a local .env (git-ignored) so the passphrase is never typed or printed.
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
const ITER = 150000;
const pass = process.argv[2] || process.env.METROPOLIS_PASSPHRASE;
if (!pass) { console.error('Provide a passphrase: node build.js "<passphrase>"  (or set it in .env)'); process.exit(1); }

function encrypt(buf) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(pass, salt, ITER, 32, 'sha256');
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(buf), c.final()]);
  const payload = Buffer.concat([ct, c.getAuthTag()]); // WebCrypto wants the tag appended
  return { iter: ITER, salt: salt.toString('base64'), iv: iv.toString('base64'), ct: payload.toString('base64') };
}

const ENC = {};
let counter = 0;
function walk(nodes) {
  return nodes.map(n => {
    const id = 'n' + (counter++);
    const out = { id, title: n.title };
    if (n.src) {
      if (fs.existsSync(n.src)) { ENC[id] = encrypt(fs.readFileSync(n.src)); out.doc = true; out.fmt = n.src.endsWith('.src.md') ? 'md' : 'html'; console.log(`  encrypted ${n.src} -> ${id} (${out.fmt})`); }
      else console.error(`  MISSING ${n.src} — "${n.title}" will render as a placeholder`);
    }
    if (n.children) out.children = walk(n.children);
    return out;
  });
}

const nav = walk(TREE);
ENC['nav'] = encrypt(Buffer.from(JSON.stringify(nav), 'utf8'));
fs.writeFileSync('docs.enc.js', 'window.__ENC=' + JSON.stringify(ENC) + ';\n');
console.log(`Wrote docs.enc.js (${Object.keys(ENC).length} encrypted blobs). Commit docs.enc.js; keep *.src.html local.`);
