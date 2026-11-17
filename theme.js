/* Dark mode: follows the system setting until the visitor picks one with the header
   toggle; the pick is remembered. Load in <head> (not deferred) so the page never flashes light. */
(function () {
  var root = document.documentElement, KEY = 'theme', mq = matchMedia('(prefers-color-scheme: dark)');
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply() { var s = saved(); root.setAttribute('data-theme', s || (mq.matches ? 'dark' : 'light')); swapMedia(); }
  apply();
  if (mq.addEventListener) mq.addEventListener('change', function () { if (!saved()) apply(); });

  // Quick Reply's cover video has the panel color baked in, so dark mode uses a dark copy
  function swapMedia() {
    var dark = root.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('video[src*="quick-reply-flow-panel"]').forEach(function (v) {
      var want = dark ? 'quick-reply-flow-panel-dark.mp4' : 'quick-reply-flow-panel.mp4';
      if (v.src.indexOf(want) < 0) {
        v.src = v.getAttribute('src').replace(/quick-reply-flow-panel(-dark)?\.mp4/, want);
        if (v.poster) v.poster = v.getAttribute('poster').replace(/linkedin-quick-reply-panel(-dark)?\.webp/, dark ? 'linkedin-quick-reply-panel-dark.webp' : 'linkedin-quick-reply-panel.webp');
        v.play && v.play().catch(function () {});
      }
    });
  }

  // Diagram iframes (same origin) pick up the theme and the dark diagram tokens
  var DIAGRAMS = /assets\/anim\/(bioa-plates-map|bioa-test-model)\.html/;
  function themeFrame(f) {
    try {
      var d = f.contentDocument; if (!d || !d.body || !DIAGRAMS.test(d.URL)) return; // skip the about:blank placeholder before load
      if (!d.getElementById('dg-dark')) { var l = d.createElement('link'); l.id = 'dg-dark'; l.rel = 'stylesheet'; l.href = new URL('_dark.css?v=1', d.URL).href; d.head.appendChild(l); d.body.classList.add('dg'); }
      d.documentElement.setAttribute('data-theme', root.getAttribute('data-theme'));
    } catch (e) {}
  }
  function themeFrames() { document.querySelectorAll('iframe').forEach(function (f) { if (DIAGRAMS.test(f.src)) themeFrame(f); }); }
  new MutationObserver(themeFrames).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  document.addEventListener('DOMContentLoaded', function () {
    swapMedia();
    var pl = document.createElement('link'); pl.rel = 'stylesheet'; pl.href = 'assets/anim/_dark.css?v=1'; document.head.appendChild(pl);
    document.querySelectorAll('iframe').forEach(function (f) { if (DIAGRAMS.test(f.src)) { f.addEventListener('load', function () { themeFrame(f); }); themeFrame(f); } });
    var anchor = document.querySelector('.nav-mobile-toggle') || document.querySelector('.contact-desktop-wrap'); // before the menu button, so it sits left of it on phones
    if (!anchor) return;
    var b = document.createElement('button');
    b.className = 'theme-toggle'; b.type = 'button';
    b.innerHTML = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>' +
      '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>';
    function label() { var d = root.getAttribute('data-theme') === 'dark'; b.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode'); b.title = b.getAttribute('aria-label'); }
    label();
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next === (mq.matches ? 'dark' : 'light') ? '' : next); if (!localStorage.getItem(KEY)) localStorage.removeItem(KEY); } catch (e) {}
      root.setAttribute('data-theme', next); swapMedia(); label();
    });
    anchor.parentNode.insertBefore(b, anchor);
  });
})();
