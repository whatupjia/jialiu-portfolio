# jialiu-portfolio

A pre-rendered static site (plain HTML/CSS/JS, no build step). Pages are
exported from a Claude Design canvas ("DC") and dropped into this repo as
complete HTML files plus `site-behaviors.js` and `assets/`.

## Deploy workflow

The user's normal flow: Claude Design export lands in a local folder (e.g.
`~/Downloads/deploy N`), gets dragged into a Claude Code session, reviewed,
committed, and pushed. `git pull` first — origin is the source of truth,
since fixes can land there directly (PRs, web edits) without ever touching
the Design canvas.

## IMPORTANT: known code-only fixes to re-check after every fresh export

The Design canvas is a separate source of truth from this repo's HTML. Any
fix applied by editing the exported HTML/JS directly (not in the Design
canvas itself) is invisible to Claude Design and **will silently regress**
the next time that page or `site-behaviors.js` is re-exported — the export
just overwrites the fix with the canvas's stale version. This has already
happened three times. Before treating a fresh export as done, diff the
incoming files against these known fixes and reapply any that got clobbered:

1. **Homepage hover captions** (`index.html`): `.scp0:hover, .scp0:focus-visible
   { --deepen: 1; }` must exist in the `<style>` block, AND no `.scp0` anchor
   may carry an inline `--deepen: 0` in its `style` attribute (inline styles
   beat the stylesheet rule outright, regardless of selector specificity —
   removing the inline override, not just re-adding the rule, is what fixes
   it). Affects the three work cards and three side-project tiles.

2. **Margin notes / sidenotes** (`benchling-bioanalytical.html` or any page
   using the `MarginNote` component): the export bakes in only whichever
   viewport branch (desktop sidenote vs. mobile trigger) was active in the
   editor canvas at capture time, never both. Check that every
   `.sc-host[data-sc-name="MarginNote"]` contains both the `.margin-note`
   aside and the `.margin-note-trigger` button, and that `site-behaviors.js`
   still has `initMarginNotes()` wired up for the mobile modal.

3. **Blob-hydrated video** (`index.html`, the RB Tagger side-project tile):
   the deploy host ignores Range headers, so a non-faststart `.mp4` (moov atom
   after mdat) can't be parsed from a plain `<video src>` — `site-behaviors.js`
   has a `data-blob-src` fetch-and-hydrate workaround for exactly this file
   (see the comment above `hydrateBlob` in `initVideoAutoplay`). The export
   bakes the video tag back to a plain `src="assets/video/rb-tagger-4-3.mp4"
   autoplay`, dropping `data-blob-src` and disabling the workaround. Check
   `grep -n 'rb-tagger-4-3.mp4' index.html` — the tag must read
   `<video data-blob-src="assets/video/rb-tagger-4-3.mp4" playsinline=""
   loop="" style="...">` with no `src` or `autoplay` attribute. If a future
   export ships this file already faststart-encoded (moov before mdat — check
   with `python3 -c "import struct; ..."` reading the top-level box order),
   the plain `src` may be safe again, but until the host's Range-header
   behavior is confirmed, keep reapplying `data-blob-src`.

4. **Three-tier diagram tablet spacing** (`benchling-bioanalytical.html`):
   the `#three-tier-foundation-fullbleed` block carries an inline
   `margin-top: -1.5rem` — a deliberate "tuck" that only works in the desktop
   two-column `#approach` grid. At ≤1100px `#approach` stacks to one column,
   and that negative margin then overlaps (cuts off) the paragraph above it
   ("I'll focus on two key areas…"). The neutralizing rule must span the whole
   stacked range: `@media (max-width: 1100px) { #three-tier-foundation-fullbleed
   { margin-top: 2rem !important; } }`. The export ships this override scoped to
   `max-width: 600px` only, leaving the 601–1100px tablet range broken —
   widen it back to `1100px`. Check: `grep -n 'three-tier-foundation-fullbleed'
   benchling-bioanalytical.html` — the `@media` guarding the `margin-top: 2rem`
   rule must read `max-width: 1100px`, not `600px`.

5. **Hero availability-chip popover stacking** (`index.html`): the hero
   content grid (the `data-dc-tpl="57"` div — the one with
   `display: grid; grid-template-columns: repeat(12, 1fr)`) must carry
   `z-index: 2`, not `z-index: 1`. That grid is a stacking context, and it
   traps the avail-chip popover (`data-behavior="avail-card"`, `z-index: 30`
   internally) inside itself. The next sibling after the hero `<section>` is
   `.work-reveal` (`position: relative; z-index: 1`), which holds the work
   cards / case-study images. At `z-index: 1` the hero grid ties with
   `.work-reveal` and, being earlier in the DOM, loses — so the open popover
   paints *under* the first case-study image (most visible on mobile, where
   the hero's bottom padding shrinks and the card reaches down into the work
   section). Bumping the grid to `z-index: 2` lifts the whole hero subtree —
   popover included — above `.work-reveal`, while staying below the sticky
   header (`z-index: 5`). The export ships this grid back at `z-index: 1`.
   Check: `grep -n 'repeat(12, 1fr)' index.html` — the hero grid's inline
   style must read `z-index: 2`.

If a new export reintroduces one of these issues, or you find another
instance of this pattern (a code-only fix silently reverted by re-export),
fix it the same way — diff against the last-known-good version of the file
to see exactly what the export changed — and add it to this list.

### Resolved durably in the canvas (verify, don't reapply)

- **Case-study section-nav left offset.** The tick-mark nav on the case
  study pages (`benchling-bioanalytical.html`, `linkedin-quick-reply.html`,
  `linkedin-recruiter-inbox.html`) must sit in the left margin, clear of the
  reading column. In the editor this is a `left-offset` React prop (case
  studies use `-104`) consumed by `navLeft()` at render; a plain capture
  dropped it, so `placeNav()` fell back to the shell's left edge and the
  marks overlapped the body. Fixed at the source: the canvas now serializes
  the offset and target onto the nav element as `data-left-offset="-104"`
  and `data-align-to=".bio-shell, .cs-shell"` — that HTML serialization has
  proven durable. But the *consuming* half — `placeNav()` in
  `site-behaviors.js` reading both (`Math.max(12, shellLeft + offset)`, whose
  clamp keeps marks on-screen just above the 1100px breakpoint) — is code-only
  and has already been silently reverted by a later export back to a bare
  `$('.bio-shell, .cs-shell')` / `left = shellLeft` with no offset. So this is
  really half-durable: after every export confirm BOTH sides — `grep -o
  'data-left-offset="[^"]*" data-align-to="[^"]*"'` on each case study page
  returns the pair (HTML side), AND `placeNav()` still reads them with the
  clamp (JS side, reapply from the last-known-good `site-behaviors.js` if the
  export flattened it). Expected geometry at ≥1168px: marks ~48px clear of the
  reading column.

- **Hero availability chip.** The "Available for consulting…" chip in the
  hero (`index.html`) opens a "Get in touch" popover; in the editor that's a
  React `onClick`, dropped by the static capture, so early exports shipped a
  dead chip. Fixed at the source: the canvas now serializes
  `data-behavior="avail-wrap"` / `avail-toggle` / `avail-card` /
  `avail-chevron` / `avail-close` onto the block and `data-behavior="copy-email"`
  onto the popover's copy button, and `initAvailChip()` in `site-behaviors.js`
  binds off those (copy reuses the shared `copy-email` handler). Durable so
  far, but both halves are needed, so confirm after an export: `index.html`
  contains `data-behavior="avail-toggle"` and `site-behaviors.js` contains
  `initAvailChip` (registered in `initAll`).

## Verifying changes

There's a static file server preconfigured in `.claude/launch.json`
(`python3 -m http.server` on port 8123) — use the Browser pane's
`preview_start` with `{name: "static-site"}` rather than starting a server
manually. After copying in new export files, actually load the changed
pages (desktop and mobile widths) and check for the two issues above plus
the general basics: broken images/videos, horizontal overflow, console
errors — before committing.

## Scope discipline

When the user says "update X" for specific pages, only touch those pages'
HTML files plus any assets they actually reference (check with `grep -o
'(src|href)="assets/[^"]+"' <file>` and diff against what's already in
`assets/`). `site-behaviors.js` is shared across all pages — check its diff
for backward compatibility with pages you're not updating before assuming
it's safe to bring over wholesale.
