# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Architecture

- Static site, no framework/build step for the pages themselves. Shared design tokens live in `styles.css`; pages also carry page-local `<style>` blocks and inline styles.
- The investor hub (`investors.html`) decrypts `docs.enc.js` client-side (AES-GCM, passphrase-derived key) and renders markdown docs via `marked.min.js` into an iframe. `build.js` holds the doc TREE and regenerates `docs.enc.js` from git-ignored `*.src.*` plaintext files — without the passphrase and those files, `docs.enc.js` cannot be rebuilt and must not be touched.
- Styling for rendered docs lives in the `DOC_CSS` template string inside `investors.html` (injected into the iframe via `srcdoc`) — the site's `styles.css` does NOT apply inside the doc iframe; any doc typography/overflow fix goes in `DOC_CSS`.

## Working on the hub without the passphrase

- To exercise the gated viewer locally, stub the decryptor in the browser console (never commit a stub): reassign `window.decrypt = async id => …`, returning a JSON nav tree for `id === 'nav'` and markdown for doc ids, then submit `#gateform` with any value. Mirror the TREE shape in `build.js` (`{id, title, doc, fmt, children}`).

## Product landing pages (jobs.html pattern)

- Product working names are swappable: define the name once as `window.__PRODUCT_NAME` in the page `<head>`; a script at the bottom stamps it into `[data-pname]` spans, the document title, and the waitlist form's `data-subject` + hidden `product` field. Never hardcode the name in body copy, and never use internal codenames on public pages.
- Space pages are named after the space (`jobs.html`), not the product, so a product rename never breaks URLs or links.
- Waitlist/contact forms all go through `forms.js` (`data-contact` + `data-subject`); it posts to the shared Formspree endpoint and auto-tags `source` with the page filename.

## Mobile layout conventions

- Nav links that should disappear on small screens carry `nav-secondary` (hidden ≤640px). Nav CTA buttons use `.btn-nav` instead of inline padding/font styles so media queries can shrink them.
- Multi-column forms use `.formgrid-row` (1fr 1fr auto) / `.formgrid-2col` (1fr 1fr), which stack to one column ≤640px. Don't put `grid-template-columns` in inline styles — media queries can't override them.
- `.field` is 1rem (16px) on purpose: <16px inputs make iOS Safari zoom the page on focus.
- The hub sidebar collapses to a `#navtoggle`-driven drawer ≤720px and auto-closes when a doc is selected; `#hubview` uses `100dvh` (with `100vh` fallback) for iOS.
