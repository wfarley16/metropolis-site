# metropolis-site

The company-level marketing site for **metropolis** — a house of AI planning-space
verticals. Its job is narrow: pitch **investors** on the platform thesis (and host the
business plan), and help **source expert operators** and attract employees. It is *not*
any single city's product site.

Deployed as a static site on **GitHub Pages**.

## Pages

| File | Access | Purpose |
| --- | --- | --- |
| `index.html` | public | Landing — thesis, the loop, the portfolio, CTAs |
| `experts.html` | public | The operator role; how experts join and run a city |
| `investors.html` | **gated** | Passphrase gate → decrypts and shows the full business plan |

## The gated plan

GitHub Pages serves everything publicly, so the plan is **encrypted client-side**. The
plan itself is a standalone copy of the metropolis pitch (with the Lavish-only review
controls stripped).

- `plan.src.html` — the plaintext plan. **Git-ignored; never committed.** Regenerated
  from the metropolis pitch.
- `plan.enc.js` — AES-256-GCM ciphertext + PBKDF2 salt/iv. This is what ships.
- `investors.html` derives a key from the passphrase (PBKDF2-SHA256, 150k iters) and
  decrypts in the browser (Web Crypto), rendering the plan in a sandboxed iframe.

Client-side gating is *soft* (it obscures, it isn't Fort Knox) — fine for an MVP.

### The passphrase lives in `.env`

The access passphrase is stored in a git-ignored `.env` file:

```
METROPOLIS_PASSPHRASE=…
```

`build.js` reads it automatically, so you never type or print it. To see it (e.g. to
share with an investor): `cat .env`. To rotate it, edit `.env` (or delete it and
re-run the generator) and rebuild.

### Updating the plan or passphrase

```bash
# 1. regenerate plan.src.html from the metropolis pitch (see below), then:
node build.js            # reads the passphrase from .env
# 2. commit the new plan.enc.js (plan.src.html and .env stay local / ignored)
git add plan.enc.js && git commit -m "Update plan"
```

Regenerate `plan.src.html` from the metropolis pitch (`.lavish/pitch.html`) by stripping
the Decide/Lavish section — see the one-liner in the project notes.

> Share the passphrase with investors out-of-band. Rotate it by re-running `build.js`.

## Local preview

Web Crypto needs a secure context, so use `localhost` (not `file://`):

```bash
python3 -m http.server 8791
# open http://localhost:8791/
```
