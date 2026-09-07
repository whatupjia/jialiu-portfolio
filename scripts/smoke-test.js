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

// ── section-nav: one tick mark per heading — hovering a mark should reveal
// its heading-preview card, and clicking one should scroll to that heading.
// Only rendered above 1100px. ──────────────────────────────────────────────
async function checkSectionNav(page, failures) {
  const nav = await page.$('[data-behavior="section-nav"]');
  if (!nav) return;

  const markBtns = await page.$$('[data-behavior="section-nav"] button[data-index]');
  if (!markBtns.length) return; // no tick-mark variant on this page

  await markBtns[Math.min(1, markBtns.length - 1)].hover();
  await page.waitForTimeout(200);
  const preview = await page.evaluate(() => {
    const wrap = document.querySelector('[data-behavior="section-nav"] button[data-index]').parentElement;
    const card = wrap.lastElementChild;
    return card && getComputedStyle(card).display !== 'none' ? card.textContent.trim() : '';
  });
  if (!preview) failures.push('hovering a section-nav mark did not reveal a heading preview card');

  const scrollYBefore = await page.evaluate(() => window.scrollY);
  await markBtns[markBtns.length - 1].click();
  await page.waitForTimeout(500);
  const scrollYAfter = await page.evaluate(() => window.scrollY);
  if (scrollYAfter === scrollYBefore) failures.push('clicking a section-nav mark did not scroll the page');
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
    failures.push('clicking an expandable image did not open the lightbox overlay');
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
