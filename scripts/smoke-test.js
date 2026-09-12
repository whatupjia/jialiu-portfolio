#!/usr/bin/env node
/*
 * smoke-test.js — loads every pre-rendered page headlessly, at both a mobile
 * and a desktop viewport, and fails the build if any page throws a JS error,
 * fails to load a same-origin asset, or if the interactive hooks
 * site-behaviors.js depends on (data-behavior attributes, section IDs, the
 * lightbox, nav toggle, section-nav track) are missing or don't actually work.
 *
 * This exists because a static-export bug once silently stripped a
 * data-id attribute from every case study page, which crashed
 * site-behaviors.js's unguarded init sequence and killed the image
 * lightbox everywhere — with no visible error unless you opened devtools.
 * Run with: npm run smoke-test
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8934;
const BASE_URL = 'http://127.0.0.1:' + PORT;

// .section-nav hides at <=1100px; .nav-mobile-toggle only shows at <=768px —
// pick viewports safely on either side of both breakpoints.
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1400, height: 900 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.otf': 'font/otf',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT, reqPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

function discoverPages() {
  return fs.readdirSync(ROOT)
    .filter((f) => f.endsWith('.html') && !f.endsWith('.dc.html'))
    .sort();
}

async function loadPage(browser, file, viewport) {
  const failures = [];
  const page = await browser.newPage({ viewport });

  page.on('pageerror', (err) => {
    failures.push('uncaught JS error: ' + err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (msg.text().includes('Failed to load resource')) return; // handled via response listener below, with origin info
    failures.push('console.error: ' + msg.text());
  });
  page.on('requestfailed', (req) => {
    if (!req.url().startsWith(BASE_URL)) return; // ignore third-party (fonts, embeds) — not a code bug
    const errorText = req.failure() && req.failure().errorText;
    if (errorText === 'net::ERR_ABORTED') return; // page/context closed mid-download (e.g. large preloading video) — not a broken asset
    failures.push('same-origin request failed: ' + req.url() + ' (' + errorText + ')');
  });
  page.on('response', (res) => {
    if (!res.url().startsWith(BASE_URL)) return;
    if (res.status() >= 400) failures.push('same-origin request returned ' + res.status() + ': ' + res.url());
  });

  await page.goto(BASE_URL + '/' + file, { waitUntil: 'load' });
  await page.waitForTimeout(500); // let deferred site-behaviors.js finish initAll()

  const title = await page.title();
  if (!title || !title.trim()) failures.push('page has no <title>');

  return { page, failures };
}

// ── header / mobile nav-toggle wiring — only rendered below 768px ─────────
async function checkNavToggle(page, failures) {
  const navToggle = await page.$('[data-behavior="nav-toggle"]');
  if (!navToggle) return;
  const before = await navToggle.getAttribute('aria-expanded');
  await navToggle.click();
  await page.waitForTimeout(150);
  const after = await navToggle.getAttribute('aria-expanded');
  if (before === after) failures.push('nav-toggle click did not change aria-expanded (was "' + before + '")');
  await navToggle.click(); // close it back up
  await page.waitForTimeout(150);
}

// ── section-nav: a stack of tick marks down the left margin, one per section
// heading, inking as you scroll past it and scrolling to it on click.
// Only rendered above 1100px.
//
// The marks ship baked into the export; the headings they point at are scanned
// at runtime and paired by index. So when an export drops a heading level, the
// tail marks pair with nothing and go quietly dead — no preview on hover, no
// scroll on click — which is why the counts are checked here and not just the
// behavior. ────────────────────────────────────────────────────────────────
async function checkSectionNav(page, failures) {
  const sectionNav = await page.$('[data-behavior="section-nav"]');
  if (!sectionNav) return;

  const marks = await sectionNav.$$('button[data-index]');
  if (!marks.length) {
    failures.push('section-nav present but has no button[data-index] tick marks');
    return;
  }

  // Same collection site-behaviors.js does, so a mismatch here is a real one.
  const headingCount = await page.evaluate(() =>
    Array.from(document.querySelectorAll('h1, h2, h3'))
      .filter((el) => !el.closest('[data-behavior="section-nav"]')).length);
  if (headingCount < marks.length) {
    failures.push(marks.length + ' tick marks but only ' + headingCount + ' headings to pair with — the last ' +
      (marks.length - headingCount) + ' mark(s) will not preview or scroll');
  }

  // The active mark is the inked one (#0d0c09); the rest sit at #d5d0c8.
  const inkedIndex = () => page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-behavior="section-nav"] button[data-index]'))
      .findIndex((b) => {
        const span = b.querySelector('span');
        return span && getComputedStyle(span).backgroundColor === 'rgb(13, 12, 9)';
      }));

  const inkedAtTop = await inkedIndex();
  if (inkedAtTop === -1) failures.push('no tick mark is inked as active at the top of the page');

  // Click the LAST mark specifically: when the runtime heading scan drops a
  // level, it's the tail of the stack that pairs with nothing, so a middle
  // mark can still scroll while the bottom third is dead. Clicking a mark is
  // also a way to land on a known heading rather than a blind midpoint, which
  // may sit under a full-bleed image where the nav is *supposed* to fade.
  const target = marks.length - 1;
  const scrollYBefore = await page.evaluate(() => window.scrollY);
  await marks[target].click();

  // Smooth scrolling, so settle rather than guess at a duration.
  let scrollYAfter = scrollYBefore;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(100);
    const y = await page.evaluate(() => window.scrollY);
    if (y === scrollYAfter && y !== scrollYBefore) break;
    scrollYAfter = y;
  }
  if (scrollYAfter === scrollYBefore) {
    failures.push('clicking the last tick mark (index ' + target + ') did not scroll the page — it likely pairs with no heading');
    return;
  }

  const opacity = await sectionNav.evaluate((el) => getComputedStyle(el).opacity);
  const overBreakout = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-breakout="12"], [data-nav-fade="full"]'))
      .some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      }));
  if (opacity === '0' && !overBreakout) {
    failures.push('section-nav faded out after scrolling with no full-bleed content in view');
  }

  const inkedAfterScroll = await inkedIndex();
  if (inkedAfterScroll === inkedAtTop) {
    failures.push('active tick mark (index ' + inkedAtTop + ') did not move after scrolling to section ' + target);
  }
}

// ── expandable image lightbox — the bug that started this whole thing ─────
async function checkLightbox(page, failures) {
  const expandable = await page.$('[data-behavior="expandable"]');
  if (!expandable) return;

  const media = await expandable.$('img, video');
  if (!media) {
    failures.push('expandable wrap has no img/video to click');
    return;
  }
  await media.click();
  await page.waitForTimeout(300);
  const overlay = await page.$('[data-lightbox-overlay]');
  if (!overlay) {
    failures.push('clicking an expandable image did not open the lightbox overlay — no [data-lightbox-overlay]. Check whether the overlay is opening without its hook attribute (a re-export drops it) before assuming the lightbox itself broke');
    return;
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const stillOpen = await page.$('[data-lightbox-overlay]');
  if (stillOpen) failures.push('lightbox overlay did not close on Escape');
}

async function checkPage(browser, file) {
  const results = [];

  const mobile = await loadPage(browser, file, MOBILE_VIEWPORT);
  await checkNavToggle(mobile.page, mobile.failures);
  await checkLightbox(mobile.page, mobile.failures);
  await mobile.page.close();
  results.push({ viewport: 'mobile', failures: mobile.failures });

  const desktop = await loadPage(browser, file, DESKTOP_VIEWPORT);
  await checkSectionNav(desktop.page, desktop.failures);
  await checkLightbox(desktop.page, desktop.failures);
  await desktop.page.close();
  results.push({ viewport: 'desktop', failures: desktop.failures });

  return results;
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const pages = discoverPages();
  let hadFailure = false;

  for (const file of pages) {
    const results = await checkPage(browser, file);
    const allFailures = results.flatMap((r) => r.failures.map((f) => '[' + r.viewport + '] ' + f));
    if (allFailures.length) {
      hadFailure = true;
      console.log('\x1b[31mFAIL\x1b[0m ' + file);
      allFailures.forEach((f) => console.log('  - ' + f));
    } else {
      console.log('\x1b[32mPASS\x1b[0m ' + file);
    }
  }

  await browser.close();
  server.close();

  if (hadFailure) {
    console.log('\nsmoke test failed.');
    process.exit(1);
  }
  console.log('\nsmoke test passed — ' + pages.length + ' page(s) checked at mobile + desktop viewports.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
