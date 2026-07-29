# AGENTS.md — jialiu-portfolio

Read this before changing anything. This repo has three failure modes that
are invisible in local preview and only show up on the live site.

## What this repo is

Jia Liu's portfolio: a **static site with no build step**. Plain HTML with
inline styles, a small client runtime (`support.js`, `image-slot.js`), and
assets. Cloudflare Pages serves these files byte-for-byte from the repo root.

- **No build command. No framework. Do not port this to React/Next/Vite.**
  A rewrite is never the answer to a bug here.
- No package.json, no node_modules, no bundler. Edits are made directly to
  the HTML files.
- The `.dc.html` files are runtime components fetched by `support.js` at page
  load, resolved by exact filename.

## Hard rules

### 1. Every HTML file needs the `window.__resources` guard

`support.js`'s `boot()` re-fetches the page's own URL and swaps in the parsed
template whenever `window.__resources` is undefined. On a real host that fires
on every load, and a mismatch during that resync stitches duplicate or wrong
content into the page.

Every file that loads `support.js` must have this immediately before it:

```html
<script>window.__resources = {};</script>
<script src="./support.js"></script>
```

This applies to **new pages and new components alike**. If you create a
`.dc.html` component, it needs the guard too.

### 2. A missing component silently renders the homepage inside a slot

Components are resolved by `<dc-import name="X">` → `X.dc.html`. If that file
is absent, it 404s — and Cloudflare Pages' static-asset fallback serves
`index.html` with a 200. The runtime treats that as valid component content
and renders **the entire homepage inside whatever slot made the request**.

This has already caused a production incident. Never hand-maintain a component
list; always derive it (see the check script below).

Current components — all 7 must exist at the repo root:
`Blockquote` · `Chip` · `ExpandableImage` · `Footer` · `NextCaseStudy` ·
`SectionNav` · `SiteHeader`

### 3. The site header is inlined into five pages

The header markup and its scroll-hide logic are **copied into each page** so
they paint with the page instead of loading as a component. There is no single
source of truth at runtime.

Changing the header means editing all six of these:

| File | How it carries the header |
|---|---|
| `index.html` | inlined |
| `benchling-bioanalytical.html` | inlined |
| `linkedin-quick-reply.html` | inlined |
| `linkedin-recruiter-inbox.html` | inlined |
| `style-guide.html` | inlined |
| `SiteHeader.dc.html` | canonical reference copy — keep in sync |

`bioanalytical-archived.html` is the exception: it has no logic class and uses
`<dc-import name="SiteHeader">`, so it picks up `SiteHeader.dc.html` directly.

In each inlined page, look for three places:
- the `// --- SiteHeader (inlined ...) ---` block in the logic class
  (`style-guide.html` has the logic but not the comment marker)
- the `<header ref="{{ siteHeaderRef }}">` markup
- the header CSS rules in `<helmet>`

> Note: an older `DEPLOY.md` in the handoff folder lists "Case Study Template"
> here and omits `style-guide.html`. That is wrong for this repo — the template
> is not deployed, and the style guide is. Trust the table above.

## Pages

`index.html` (home) · `benchling-bioanalytical.html` ·
`bioanalytical-archived.html` · `linkedin-recruiter-inbox.html` ·
`linkedin-quick-reply.html` · `style-guide.html`

Internal links use the flat `name.html` form. Components keep their
`.dc.html` extension — `dc-import` resolves by that exact filename, so never
rename or "normalize" a `.dc.html` file.

## Pre-push checks

Run all four from the repo root before pushing. All must pass.

```bash
# 1. Guard script present in every file that loads support.js
for f in *.html *.dc.html; do
  grep -q 'support.js' "$f" || continue
  grep -q '__resources' "$f" || echo "FAIL missing guard: $f"
done

# 2. Every referenced component exists (derived, never hand-listed)
for c in $(grep -oh 'dc-import name="[A-Za-z0-9_-]*"' *.html *.dc.html \
           | sed 's/.*name="//;s/"//' | sort -u); do
  [ -f "$c.dc.html" ] || echo "FAIL missing component: $c.dc.html"
done

# 3. No scratch/exploration files shipped
grep -l 'deploy: exclude' *.html *.dc.html 2>/dev/null \
  && echo "FAIL excluded file present"

# 4. Every asset reference resolves
grep -ohE 'assets/[^"'"'"')? ]+' *.html *.dc.html support.js image-slot.js \
  | sort -u | while read -r p; do
  [ -e "$p" ] || echo "FAIL missing asset: $p"
done
```

Silence means all four passed.

Also open `index.html` and one case study in a browser afterward. The
homepage-in-a-slot bug is obvious visually and invisible to the checks above
once a component file exists but returns wrong content.

## Deploy

Cloudflare Pages, from this repo:

- Build command: **none**
- Output directory: **`/`** (page files live at the repo root)
- Push to `main` → auto-deploy

Live URLs are flat: `/`, `/benchling-bioanalytical.html`,
`/bioanalytical-archived.html`, `/linkedin-recruiter-inbox.html`,
`/linkedin-quick-reply.html`, `/style-guide.html`

## Scope

This is a design portfolio — visual details are the product. Do not
restyle, "clean up", refactor, or reformat markup you were not asked to
change. Fix what was asked, leave the rest byte-identical.
