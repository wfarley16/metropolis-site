#!/usr/bin/env node
/*
 * build.js — encrypt the plan for the investor gate.
 *
 * Usage:  node build.js "your passphrase"
 *   (or)  METROPOLIS_PASSPHRASE="…" node build.js
 *
 * Reads  plan.src.html   (the cleaned, standalone plan — NOT committed)
 * Writes plan.enc.js      (AES-256-GCM ciphertext + PBKDF2 salt/iv — committed)
 *
 * Browser side (investors.html) derives the same key via PBKDF2-SHA256
 * (150k iterations) and decrypts with AES-GCM. Keep these params in sync.
 */
const fs = require('fs');
const crypto = require('crypto');

// Load a local .env (git-ignored) so the passphrase never needs to be typed or printed.
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const ITER = 150000, KEYLEN = 32, DIGEST = 'sha256';
const pass = process.argv[2] || process.env.METROPOLIS_PASSPHRASE;
if (!pass) { console.error('Provide a passphrase: node build.js "<passphrase>"'); process.exit(1); }
if (!fs.existsSync('plan.src.html')) {
  console.error('plan.src.html not found. Regenerate it from the metropolis pitch first.');
  process.exit(1);
}

const plaintext = fs.readFileSync('plan.src.html');
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(pass, salt, ITER, KEYLEN, DIGEST);

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();
// WebCrypto expects ciphertext with the auth tag appended.
const payload = Buffer.concat([ct, tag]);

const out = 'window.__PLAN_ENC=' + JSON.stringify({
  v: 1, iter: ITER,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: payload.toString('base64')
}) + ';\n';

fs.writeFileSync('plan.enc.js', out);
console.log('Wrote plan.enc.js (' + payload.length + ' bytes ciphertext). Passphrase set. Commit plan.enc.js; keep plan.src.html local.');
