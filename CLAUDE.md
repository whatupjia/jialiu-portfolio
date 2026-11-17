# jialiu-portfolio

Jia's design portfolio (jialiudesign.com): plain static HTML, CSS and JS, no build step.
This folder is the one working copy; all portfolio work happens here. Work on `main`;
pushing `main` deploys the live site.
Past versions are git tags, not folders (`v2-claude-design`, `v3-redesign`; tag the next
major redesign `v4-...`). `archive/*` tags hold old unpushed work. The HTML
in this repo is the source of truth. Pages are edited here directly with
Claude Code (Claude Design and its canvas export are no longer part of the
workflow), so there is no export to reconcile and no "code-only fix" list.

## Pages

- `index.html` (home), `benchling-bioanalytical.html`, `linkedin-recruiter-inbox.html`,
  `linkedin-quick-reply.html`, `404.html`.
- The old export's inline styles now live in `legacy-inline.css` as numbered classes
  (`.i1`, `.i2`, ...), written as `:where(.iN) { ... !important }` so any page stylesheet
  can override them. Don't add new `iN` classes; when you polish an area, replace its
  `iN` classes with named ones in `case.css` or the page file. The page stylesheets still
  use `!important` because of this layer.
- Bioanalysis has no numbered classes left. Its named vocabulary sits at the top of
  `site.css` (`page`, `page-container`, `site-footer*`, `text-link`), `case.css`
  (`case-section`, `case-column`, `case-p`, `case-h1`/`case-h3`, `intro`, `outcomes-card`,
  `stat-row`, `stat`, `stat-caption`, `hero-media`, `span-full`, ...) and
  `case-bioanalysis.css`. Use these names when converting the LinkedIn pages and the
  homepage.
- Inline `style` attributes remain only where scripts restyle elements at runtime: the
  header and header spacer, the section nav, `[data-behavior]` widgets, the homepage hero,
  expandable images, and `.bio-shell`. Leave those inline (a class with `!important`
  would beat the script's inline writes).

## Styles and scripts (load order matters: later files win)

| File | Loaded on | Purpose |
|---|---|---|
| `legacy-inline.css` | every page (first) | Former inline styles; see above. |
| `site.css` | every page | Site-wide look: paper/ink tokens, header and nav, homepage hero, work cards, About, footer. |
| `case.css` | every case study | Shared case study foundations: spacing scale tokens, section headings, rules/links/image corners, and the intro (role stack + Outcomes label). |
| `case-bioanalysis.css` | Bioanalysis | Its layouts: feature scroll, mapping and tests bands, plate/data diagrams, Problem band, decision cards. Bioanalysis is the reference design for all case studies. |
| `case-linkedin.css` | Recruiter Inbox, Quick Reply | Type scale and rhythm hooks for their markup, the muted Problem band, the intro grid. |
| `case-recruiter.css` | Recruiter Inbox | Wide figures, side-by-side text and figure, banded figure, quote weight. |
| `site.js` | every page | Homepage copy (hero, About), work card facts. |
| `case.js` | every case study | Title eyebrow, hidden section labels, Outcomes label, feature-scroll driver, spacing class hooks (`v-sub`, `v-figwrap`, ...). |
| `case-recruiter.js` | Recruiter Inbox | Groups paragraphs with figures for the split layouts; size modifiers. |
| `hero-select.js` | Home | Hero animation on `.hero-canvas`: a design-tool cursor selects, resizes and drags lab-app panels (heatmap, molecule, table, point cloud, sample board, dither image). Hidden below 900px. Its exploration pages live in `tools/scratch/`. |
| `theme.css` / `theme.js` | Home, case studies (last, in `<head>`; the script is not deferred so there's no light flash) | Dark mode: follows the system until the visitor uses the header toggle (choice saved in localStorage). Sets `html[data-theme]`; swaps the Quick Reply cover for its `-dark` copy; themes the diagram iframes with `assets/anim/_dark.css`. Screenshots stay light (dimmed). New hard-coded colors need a dark rule here. |
| `site-behaviors.js` | every page | Interaction: header hide/show, contact popover, section nav, lightbox, video play-on-view, hero dots. |

Each `<link>`/`<script>` carries a `?v=N` cache-buster; bump it whenever you edit the file.

Diagrams and product animations are standalone pages in `assets/anim/` (shared helpers:
`_base.css`, `_base.js`, `bioa-map.css`, `bioa-map.js`), embedded with iframes.

## Design system (case studies)

- Type scale: title 64 · h2 38 · h3 28 · card titles 22 · body 17 · labels 14 (px, max).
- Spacing: 12 heading→text · 16 paragraph · 40 text↔figure · 72 repeated block ·
  96 subsection · 144 section · bands 96 outside, 80 inside. Tokens `--r-*` and
  `--band-*` live in `case.css`.
- Headlines: no trailing periods; avoid "What <verb>" constructions.
- White page; warm muted (`--muted`) and slate bands for emphasis. No eyebrow labels,
  hairline rules or monospace labels.

## Things that must stay true

1. **Section nav marks = headings.** On each case study, the count of
   `button[data-index]` in the section nav must equal the number of `h1, h2, h3`
   headings, in the same order (`aria-label` = heading text). When adding or removing
   a heading, add/remove its mark and renumber `data-index` from 0.
2. **Lightbox hook.** `site-behaviors.js` sets `data-lightbox-overlay` on the overlay;
   the smoke test matches on it.
3. **Homepage title** reads `Jia Liu - Product Design Portfolio` in both `<title>` and
   `og:title` (search ranking).
4. **Videos are faststart** (index before data), so `preload="metadata"` is cheap. If a
   new clip isn't, run `ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4`. The host
   ignores Range headers; `site-behaviors.js` still supports `data-blob-src` as a fallback
   for a clip that can't be re-muxed.
5. **Images** use WebP where it is smaller, with `width`/`height`, `loading="lazy"` and
   `decoding="async"` on every `<img>`.
6. **`noindex`** is only on `404.html`. Don't add it to real pages.

## Verifying changes

- Static server: `.claude/launch.json` (`python3 -m http.server 8123`).
- Load changed pages at desktop and phone widths; check for horizontal overflow,
  console errors and broken media.
- `npm install && npm run smoke-test` (Playwright) checks every page's JS errors, assets,
  hooks, nav and lightbox.
- For refactors, compare element positions and computed styles before and after on each
  page; layout should not move unless that is the intent.

## Adding a case study

1. Copy `benchling-bioanalytical.html` to `<slug>.html` (Bioanalysis is the reference
   design). Keep its stylesheet and script tags; create `case-<slug>.css` only for layouts
   unique to the new page. Use the named classes, not `iN` ones.
2. Intro: title, intro paragraphs, role stack on the right (Role, Team, Timeline), metrics
   under an "Outcomes" label. Then the usual sections (Background, Problem, Approach,
   Solution, Outcomes, Lessons learned), following the type, spacing and headline rules above.
3. Section nav: one `button[data-index]` per `h1, h2, h3`, `aria-label` = heading text,
   numbered from 0 (rule 1 below).
4. Media: WebP with `width`/`height`, `loading="lazy"`, `decoding="async"`; faststart video.
   Product animations go in `assets/anim/` as standalone pages on the shared `_base.*`.
5. Homepage: add a card in `#work` in `index.html` (eyebrow facts in `site.js`). Card panels are
   all light gray (`--card-panel` in `site.css`) with a faint pattern borrowed from the hero's
   panel views (dot grid, row rules, card outlines); give it a cover (animation iframe, video or
   image). A video cover needs the panel gray baked into its background.
6. Bump `?v=N` on every file you changed, check desktop and phone widths, then push.

## Local editing tools (not deployed)

`tools/` is gitignored. `python3 tools/edit/serve.py` serves the site at http://127.0.0.1:8124 and
injects two dev-only helpers into every page:
- **E**: edit text in place; Cmd+Enter (or Cmd+S) writes the exact changed text back to the page's
  HTML, or to `site.js` for homepage copy set by script.
- **N**: click any element and leave a note for Claude; notes are saved to `tools/edit/notes.md`
  with the page, section, element and a selector. When Jia says "do my notes", work through the
  `[open]` entries there and mark each `[done]`.

`tools/scratch/` holds design explorations kept for reference (hero concepts, panel views, sphere tiles,
card background comparison, the dither homepage variant). Open them through the edit server, e.g.
http://127.0.0.1:8124/tools/scratch/hero-explore.html. They're gitignored with the rest of `tools/`, so
they never deploy; put new scratch pages there too.
