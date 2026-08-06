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

If a new export reintroduces one of these issues, or you find another
instance of this pattern (a code-only fix silently reverted by re-export),
fix it the same way — diff against the last-known-good version of the file
to see exactly what the export changed — and add it to this list.

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
