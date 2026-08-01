/*
 * site-behaviors.js — vanilla replacements for the interactive behavior that
 * the DC runtime provides in the authoring environment. The deployed pages are
 * pre-rendered static HTML, so nothing here is responsible for CONTENT: every
 * word is already in the markup. This only re-attaches interaction.
 *
 * Binds by data-behavior attributes declared in the .dc.html sources, so the
 * pre-render carries the hooks through untouched. If this file fails to load,
 * pages stay fully readable — the header just stops hiding on scroll and the
 * contact popover stops opening.
 *
 * Covered here: site header (hide on scroll, mobile nav, contact popover, copy
 * email, smooth in-page scroll), section nav scrollspy, tabbed image
 * carousels, and the expandable-image lightbox (zoom, pan, keyboard).
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var by = function (name, root) { return $('[data-behavior="' + name + '"]', root); };
  var byAll = function (name, root) { return $$('[data-behavior="' + name + '"]', root); };

  var EMAIL = 'jia.eq.liu@gmail.com';
  var HAMBURGER = 'M4 7h16M4 12h16M4 17h16';
  var CLOSE_X = 'M18 6L6 18M6 6l12 12';

  function initHeader() {
    var header = by('site-header');
    if (!header) return;

    var spacer = $('.header-spacer-default');
    var navToggle = by('nav-toggle');
    var navIcon = by('nav-toggle-icon');
    var navPanel = by('mobile-nav-panel');
    var contactWrap = by('contact-wrap');
    var shape = by('contact-shape');
    var contactBtn = by('contact-button');
    var contactCard = by('contact-card');
    var mContactToggle = by('mobile-contact-toggle');
    var mContactPanel = by('mobile-contact-panel');
    var mContactChevron = by('mobile-contact-chevron');

    var navOpen = false, contactOpen = false, mContactOpen = false;

    // ---- header hide on scroll down, show on scroll up -------------------
    var lastY = window.scrollY || 0;
    // The pre-render bakes whatever transform the header had at capture time
    // (e.g. mid-scroll, hidden) as a literal inline style. hidden must reflect
    // that actual state on load, not assume visible, or a page captured
    // scrolled-down loads with a permanently missing header until a scroll
    // event happens to cross the hide/show threshold twice.
    var hidden = header.style.transform === 'translateY(-100%)';

    function syncSpacer() {
      if (spacer) spacer.style.height = header.offsetHeight + 'px';
    }
    syncSpacer();
    window.addEventListener('resize', syncSpacer);

    function syncHeader(y) {
      var h = header.offsetHeight;
      var next = hidden;
      if (y <= h) next = false;
      else if (y > lastY) next = true;
      else if (y < lastY) next = false;
      if (next !== hidden) {
        hidden = next;
        header.style.transform = hidden ? 'translateY(-100%)' : 'translateY(0)';
      }
      lastY = y;
    }
    syncHeader(window.scrollY || window.pageYOffset);
    window.addEventListener('scroll', function () {
      syncHeader(window.scrollY || window.pageYOffset);
    }, { passive: true });

    // ---- mobile nav ------------------------------------------------------
    function setNav(open) {
      navOpen = open;
      if (!open) setMobileContact(false);
      if (navPanel) navPanel.style.maxHeight = open ? (mContactOpen ? '480px' : '220px') : '0px';
      if (navIcon) navIcon.setAttribute('d', open ? CLOSE_X : HAMBURGER);
      if (navToggle) navToggle.setAttribute('aria-expanded', String(open));
    }
    if (navToggle) {
      navToggle.addEventListener('click', function () { setNav(!navOpen); });
    }

    function setMobileContact(open) {
      mContactOpen = open;
      if (mContactPanel) mContactPanel.style.maxHeight = open ? '160px' : '0px';
      if (mContactChevron) mContactChevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
      if (mContactToggle) mContactToggle.setAttribute('aria-expanded', String(open));
      if (navPanel && navOpen) navPanel.style.maxHeight = open ? '480px' : '220px';
    }
    if (mContactToggle) {
      mContactToggle.addEventListener('click', function () { setMobileContact(!mContactOpen); });
    }

    // Mobile nav links close the sheet after navigating.
    byAll('mobile-nav-panel').forEach(function (panel) {
      $$('a', panel).forEach(function (a) {
        a.addEventListener('click', function () { setNav(false); });
      });
    });

    // ---- desktop contact popover ----------------------------------------
    function setContact(open) {
      contactOpen = open;
      if (shape) {
        shape.style.width = open ? '280px' : '128px';
        shape.style.height = open ? '216px' : '42px';
        shape.style.borderRadius = open ? '20px' : '999px';
        shape.style.boxShadow = open ? '0 24px 48px rgba(20,19,15,0.28)' : 'none';
      }
      if (contactBtn) {
        contactBtn.style.opacity = open ? '0' : '1';
        contactBtn.style.pointerEvents = open ? 'none' : 'auto';
        contactBtn.style.transitionDelay = open ? '0s' : '0.25s';
      }
      if (contactCard) {
        contactCard.style.opacity = open ? '1' : '0';
        contactCard.style.pointerEvents = open ? 'auto' : 'none';
        contactCard.style.transitionDelay = open ? '0.2s' : '0s';
      }
    }
    if (contactBtn) contactBtn.addEventListener('click', function () { setContact(true); });
    var contactClose = by('contact-close');
    if (contactClose) contactClose.addEventListener('click', function () { setContact(false); });

    // ---- dismissal -------------------------------------------------------
    function onDocPointer(e) {
      if (contactOpen && contactWrap && !contactWrap.contains(e.target)) setContact(false);
      if (navOpen && !header.contains(e.target)) setNav(false);
    }
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('touchstart', onDocPointer, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (contactOpen) setContact(false);
      if (mContactOpen) setMobileContact(false);
      else if (navOpen) setNav(false);
    });

    // ---- copy email ------------------------------------------------------
    var CHECK = '<path d="M20 6L9 17l-5-5"></path>';
    byAll('copy-email').forEach(function (btn) {
      var svg = $('svg', btn);
      if (!svg) return;
      var original = svg.innerHTML;
      btn.addEventListener('click', function () {
        var flash = function () {
          svg.innerHTML = CHECK;
          setTimeout(function () { svg.innerHTML = original; }, 1800);
        };
        var fallback = function () {
          try {
            var ta = document.createElement('textarea');
            ta.value = EMAIL;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, EMAIL.length);
            document.execCommand('copy');
            document.body.removeChild(ta);
            flash();
          } catch (err) {}
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(EMAIL).then(flash).catch(fallback);
        } else {
          fallback();
        }
      });
    });

    // ---- smooth in-page scroll for nav links ----------------------------
    $$('a[data-section-id]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var el = document.getElementById(a.getAttribute('data-section-id'));
        if (!el) return;
        e.preventDefault();
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - 88,
          behavior: 'smooth'
        });
      });
    });
  }

  // ── section nav (case study pages) ───────────────────────────────────────
  // Two variants, told apart by what the pre-render left behind: the tabs
  // variant ships a button[data-id] per section, the ticks variant ships one
  // full-height rail button with a track span and a fill span. Both get the
  // ambient fade (recede when idle, hide behind full-bleed imagery); the ticks
  // variant additionally needs its fill, counter and click math rebuilt here,
  // since in the DC source all three come from React state and the snapshot
  // freezes them at whatever the capture scroll position happened to be.
  function initSectionNav() {
    var nav = by('section-nav');
    if (!nav) return;
    var REF_LINE = 160, SCROLL_OFFSET = 96, IDLE_MS = 1400;

    var hovering = false, idleFaded = false, breakoutFaded = false, idleTimer = null;
    function applyFade() {
      var off = idleFaded || breakoutFaded;
      nav.style.opacity = off ? '0' : '1';
      nav.style.pointerEvents = off ? 'none' : 'auto';
    }
    function resetIdle() {
      clearTimeout(idleTimer);
      if (idleFaded) { idleFaded = false; applyFade(); }
      if (hovering) return;
      idleTimer = setTimeout(function () { idleFaded = true; applyFade(); }, IDLE_MS);
    }
    nav.addEventListener('mouseenter', function () { hovering = true; clearTimeout(idleTimer); });
    nav.addEventListener('mouseleave', function () { hovering = false; resetIdle(); });

    // Wide breakout images reach the nav's column, so it steps out of their way.
    // Re-scanned on DOM changes because a lightbox clone or late image can add
    // targets after this runs.
    var FADE_SEL = '[data-nav-fade], [data-breakout="10"], [data-breakout="11"], [data-breakout="12"]';
    if ('IntersectionObserver' in window) {
      var intersecting = [], observed = [];
      var fadeObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var at = intersecting.indexOf(e.target);
          if (e.isIntersecting && at === -1) intersecting.push(e.target);
          else if (!e.isIntersecting && at !== -1) intersecting.splice(at, 1);
        });
        breakoutFaded = intersecting.length > 0;
        applyFade();
      }, { threshold: 0 });
      var rescan = function () {
        $$(FADE_SEL).forEach(function (t) {
          if (observed.indexOf(t) !== -1) return;
          observed.push(t);
          fadeObs.observe(t);
        });
        for (var i = observed.length - 1; i >= 0; i--) {
          if (observed[i].isConnected) continue;
          fadeObs.unobserve(observed[i]);
          var gone = intersecting.indexOf(observed[i]);
          if (gone !== -1) intersecting.splice(gone, 1);
          observed.splice(i, 1);
        }
        breakoutFaded = intersecting.length > 0;
        applyFade();
      };
      rescan();
      if (window.MutationObserver) {
        new MutationObserver(rescan).observe(document.body, { childList: true, subtree: true });
      }
    }
    applyFade();

    var btns = $$('button[data-id]', nav);
    if (btns.length) {
      var ACTIVE = '#14130f', IDLE = '#6b6863', NUM_ACTIVE = '#14130f', NUM_IDLE = '#9a968f';

      function paint(activeId) {
        btns.forEach(function (b) {
          var on = b.getAttribute('data-id') === activeId;
          b.style.color = on ? ACTIVE : IDLE;
          b.style.fontWeight = on ? '600' : '400';
          var num = $('span', b);
          if (num) num.style.color = on ? NUM_ACTIVE : NUM_IDLE;
        });
      }

      function current() {
        var activeId = btns[0].getAttribute('data-id');
        btns.forEach(function (b) {
          var el = document.getElementById(b.getAttribute('data-id'));
          if (!el) return;
          var r = el.getBoundingClientRect();
          if (r.height === 0) return;
          if (r.top <= REF_LINE) activeId = b.getAttribute('data-id');
        });
        return activeId;
      }
      var last = null;
      function sync() {
        resetIdle();
        var id = current();
        if (id !== last) { last = id; paint(id); }
      }
      btns.forEach(function (b, i) {
        b.addEventListener('click', function (e) {
          e.preventDefault();
          var id = b.getAttribute('data-id');
          if (i === 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
          var el = document.getElementById(id);
          if (!el) return;
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET, behavior: 'smooth' });
        });
      });
      window.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      requestAnimationFrame(sync);
      return;
    }

    var rail = $('button', nav);
    if (!rail) return;
    var track = $$('span', rail);
    var fill = track[1];
    var wrap = rail.parentNode;
    var counter = $('div', wrap);
    if (!fill) return;

    // Every h3 outside the nav is a section. Position is the heading's share of
    // total document height, the same space the fill is drawn in, so the line
    // glides past each heading instead of snapping between them.
    var headings = [];
    function scanHeadings() {
      var docHeight = document.documentElement.scrollHeight || 1;
      headings = $$('h3').filter(function (el) {
        return !el.closest('[data-behavior="section-nav"]');
      }).map(function (el) {
        var absTop = el.getBoundingClientRect().top + window.scrollY;
        return { el: el, frac: Math.max(0, Math.min(1, absTop / docHeight)) };
      });
    }

    var lastFill = -1, lastLabel = null;
    function sync() {
      resetIdle();
      var railHeight = wrap.clientHeight || rail.offsetHeight || 260;
      var docHeight = document.documentElement.scrollHeight || 1;
      var frac = Math.max(0, Math.min(1, (window.scrollY + REF_LINE) / docHeight));
      var px = Math.round(frac * railHeight);
      if (px !== lastFill) {
        lastFill = px;
        fill.style.height = px + 'px';
        if (counter) counter.style.top = px + 'px';
      }
      if (counter && headings.length) {
        var activeIndex = 0;
        for (var i = 0; i < headings.length; i++) {
          if (headings[i].el.getBoundingClientRect().top <= REF_LINE) activeIndex = i;
        }
        var label = (activeIndex + 1) + ' / ' + headings.length;
        if (label !== lastLabel) { lastLabel = label; counter.textContent = label; }
      }
    }

    // The bare line is the control: click anywhere along it and land on whichever
    // heading sits nearest that point.
    rail.addEventListener('click', function (e) {
      if (!headings.length) return;
      var rect = rail.getBoundingClientRect();
      var clickFrac = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      var nearest = 0, best = Infinity;
      for (var i = 0; i < headings.length; i++) {
        var d = Math.abs(headings[i].frac - clickFrac);
        if (d < best) { best = d; nearest = i; }
      }
      var el = headings[nearest].el;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET, behavior: 'smooth' });
    });

    scanHeadings();
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', function () { scanHeadings(); sync(); });
    // Heading positions move once webfonts swap in, so the first measurement is
    // provisional.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { scanHeadings(); sync(); });
    }
    requestAnimationFrame(sync);
  }

  // ── tabbed image carousels ───────────────────────────────────────────────
  // Only the active tab's image is in the markup, so the tab list travels as
  // JSON on data-tabs and this swaps the source in place.
  function initCarousels() {
    byAll('carousel').forEach(function (root) {
      var tabs;
      try { tabs = JSON.parse(root.getAttribute('data-tabs') || '[]'); } catch (e) { return; }
      if (!tabs.length) return;
      var btns = $$('button[data-index]', root);
      var img = $('img', root);
      if (!img || !btns.length) return;

      function select(i) {
        var t = tabs[i];
        if (!t) return;
        img.setAttribute('src', t.src);
        img.setAttribute('alt', t.alt || '');
        btns.forEach(function (b, j) {
          var on = j === i;
          b.style.color = on ? '#14130f' : '#6b6863';
          b.style.borderBottomColor = on ? '#0688f0' : 'transparent';
          b.style.fontWeight = on ? '600' : '500';
          b.setAttribute('data-active', String(on));
        });
        current = i;
      }
      var current = 0;
      btns.forEach(function (b, i) { b.addEventListener('click', function () { select(i); }); });

      // swipe
      var startX = 0;
      root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      root.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) < 40) return;
        select(dx < 0 ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length);
      });
    });
  }

  // ── expandable image lightbox ────────────────────────────────────────────
  function initLightbox() {
    var wraps = byAll('expandable');
    if (!wraps.length) return;
    var overlay = null, zoom = 1, media = null, dragging = false, moved = false, start = null;

    function close() {
      if (!overlay) return;
      overlay.remove();
      overlay = null; media = null; zoom = 1;
      document.body.style.overflow = '';
    }

    function applyZoom() {
      if (media) {
        media.style.width = Math.round(90 * zoom) + 'vw';
        media.style.cursor = zoom > 1 ? 'grab' : 'zoom-in';
      }
    }

    function open(sourceEl) {
      close();
      overlay = document.createElement('div');
      overlay.setAttribute('style', 'position: fixed; inset: 0; background: rgba(20,19,15,0.85); z-index: 100; overflow: auto; padding: 3rem; box-sizing: border-box;');

      var closeBtn = document.createElement('button');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.setAttribute('style', 'position: fixed; top: 24px; right: 24px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #ffffff; font-size: 1.2rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 101;');
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', close);

      var stage = document.createElement('div');
      stage.setAttribute('style', 'min-height: 100%; min-width: 100%; display: flex;');

      media = sourceEl.cloneNode(true);
      media.removeAttribute('data-behavior');
      var MEDIA_STYLE = 'max-width: none; height: auto; margin: auto; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); user-select: none; background: #ffffff;';
      media.setAttribute('style', MEDIA_STYLE);
      if (media.tagName === 'VIDEO') { media.muted = true; media.loop = true; media.autoplay = true; }

      var hint = document.createElement('div');
      hint.setAttribute('style', 'position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.12); color: #ffffff; font-size: 0.75rem; padding: 6px 12px; border-radius: 6px; white-space: nowrap;');
      hint.textContent = 'Scroll to pan · Ctrl/Cmd + scroll to zoom · click to zoom out / close';

      stage.appendChild(media);
      overlay.appendChild(closeBtn);
      overlay.appendChild(stage);
      overlay.appendChild(hint);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      zoom = window.matchMedia('(max-width: 768px)').matches ? 2 : 1;
      applyZoom();
      if (media.tagName === 'VIDEO' && media.play) media.play().catch(function () {});

      overlay.addEventListener('click', function (e) { if (e.target !== media) close(); });
      media.addEventListener('click', function (e) {
        e.stopPropagation();
        if (moved) { moved = false; return; }
        if (zoom > 1) { zoom = 1; applyZoom(); } else close();
      });
      overlay.addEventListener('wheel', function (e) {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        zoom = Math.max(1, Math.min(4, zoom - e.deltaY * 0.01));
        applyZoom();
      }, { passive: false });
      media.addEventListener('mousedown', function (e) {
        if (zoom <= 1) return;
        dragging = true; moved = false;
        start = { x: e.clientX, y: e.clientY, l: overlay.scrollLeft, t: overlay.scrollTop };
      });
    }

    window.addEventListener('mousemove', function (e) {
      if (!dragging || !overlay) return;
      moved = true;
      overlay.scrollLeft = start.l - (e.clientX - start.x);
      overlay.scrollTop = start.t - (e.clientY - start.y);
    });
    window.addEventListener('mouseup', function () { dragging = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    wraps.forEach(function (wrap) {
      var src = $('img', wrap) || $('video', wrap);
      if (!src) return;
      src.style.cursor = 'zoom-in';
      src.addEventListener('click', function () { open(src); });
      $$('button', wrap).forEach(function (b) {
        b.style.pointerEvents = 'auto';
        b.style.cursor = 'zoom-in';
        b.addEventListener('click', function (e) { e.stopPropagation(); open(src); });
      });
    });
  }


  // ── autoplaying loops ────────────────────────────────────────────────────
  // The DC pages drive playback from an IntersectionObserver in their logic
  // class, and no <video> carries an autoplay attribute — so without this the
  // pre-rendered pages show every clip frozen on frame one.
  function initVideos() {
    var vids = $$('video');
    if (!vids.length) return;
    vids.forEach(function (v) {
      v.muted = true;
      v.loop = true;
      v.setAttribute('playsinline', '');
    });
    if (!('IntersectionObserver' in window)) {
      vids.forEach(function (v) { v.play().catch(function () {}); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.play().catch(function () {});
        else entry.target.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });
  }

  // ── hero dot grid (home page intro) ──────────────────────────────────────
  // Draws the same converging dot grid as the authoring-time canvas: dots
  // start scattered, ease into a regular grid, then the .hero-dots CSS fades
  // the whole canvas to opacity 0 — so this only needs to run once per load.
  function initHeroDots() {
    var canvas = $('.hero-dots');
    if (!canvas || canvas.tagName !== 'CANVAS') return;
    var ctx = canvas.getContext('2d');
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var SPACING = 32, BASE_RADIUS = 1.7, EASE = 0.2;
    var BASE_COLOR = [20, 19, 15];
    var dots = [];
    var width = 0, height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = false;
    var rafId = null;
    var introStart = performance.now();
    var introEase = 0.035;

    function buildGrid() {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cols = Math.ceil(width / SPACING) + 1;
      var rows = Math.ceil(height / SPACING) + 1;
      var offsetX = (width - (cols - 1) * SPACING) / 2;
      var offsetY = (height - (rows - 1) * SPACING) / 2;
      var existing = dots;
      dots = [];
      var idx = 0;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var bx = offsetX + c * SPACING, by2 = offsetY + r * SPACING;
          var prev = existing[idx];
          var startX = bx, startY = by2;
          if (!prefersReducedMotion && !prev) {
            startX = bx + (Math.random() - 0.5) * 170;
            startY = by2 + (Math.random() - 0.5) * 170;
          }
          dots.push({ bx: bx, by: by2, x: prev ? prev.x : startX, y: prev ? prev.y : startY });
          idx++;
        }
      }
    }

    function draw() {
      var elapsed = performance.now() - introStart;
      var introT = Math.min(elapsed / 1600, 1);
      var rampT = introT * introT * introT * introT * introT;
      introEase = introT < 1 ? (0.006 + 0.5 * rampT) : EASE;
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += (d.bx - d.x) * introEase;
        d.y += (d.by - d.y) * introEase;
        ctx.beginPath();
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = 'rgb(' + BASE_COLOR[0] + ',' + BASE_COLOR[1] + ',' + BASE_COLOR[2] + ')';
        ctx.arc(d.x, d.y, BASE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop() { draw(); rafId = requestAnimationFrame(loop); }
    function start() {
      if (running || prefersReducedMotion) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    buildGrid();
    draw();
    if (prefersReducedMotion) return;

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { buildGrid(); draw(); }, 150);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) start(); else stop(); });
      }, { threshold: 0.05 }).observe(canvas);
    } else {
      start();
    }
  }

  // Margin notes ship both branches: a floated .margin-note sidenote (desktop)
  // and a .margin-note-trigger button (mobile), with CSS choosing per breakpoint.
  // The mobile modal is built here by cloning the sidenote's own content, so the
  // copy exists once in the markup and the two can never drift.
  function initMarginNotes() {
    var triggers = byAll('margin-note-trigger');
    if (!triggers.length) return;
    var overlay = null;

    function close() {
      if (!overlay) return;
      overlay.remove();
      overlay = null;
      document.body.style.overflow = '';
    }

    function open(note) {
      close();
      overlay = document.createElement('div');
      overlay.className = 'margin-note-modal-backdrop';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      var sheet = document.createElement('div');
      sheet.className = 'margin-note-modal';

      var label = $('.margin-note-label', note);
      var head = document.createElement('div');
      head.setAttribute('style', 'display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.85rem;');
      var title = document.createElement('span');
      title.setAttribute('style', "font-family: 'Mori', -apple-system, system-ui, sans-serif; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #9a968f;");
      title.textContent = label ? label.textContent : '';
      if (title.textContent) overlay.setAttribute('aria-label', title.textContent);
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.setAttribute('style', 'background: none; border: 0; padding: 0; margin: 0; color: #9a968f; cursor: pointer; font-size: 1.1rem; line-height: 1; flex-shrink: 0;');
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', close);
      head.appendChild(title);
      head.appendChild(closeBtn);
      sheet.appendChild(head);

      var body = $('.margin-note-body', note);
      if (body) {
        var p = document.createElement('p');
        p.setAttribute('style', "margin: 0; font-family: 'Neue Montreal', -apple-system, system-ui, sans-serif; font-size: 1rem; line-height: 1.55; color: #3a3833;");
        p.textContent = body.textContent;
        sheet.appendChild(p);
      }

      $$('img, video', note).forEach(function (el) {
        var media = el.cloneNode(true);
        media.setAttribute('style', 'width: 100%; height: auto; display: block; margin-top: 1rem; border: 1px solid #e4e0d8; border-radius: 8px; background: #ffffff;');
        if (media.tagName === 'VIDEO') { media.muted = true; media.loop = true; media.autoplay = true; }
        sheet.appendChild(media);
        if (media.tagName === 'VIDEO' && media.play) media.play().catch(function () {});
      });

      overlay.appendChild(sheet);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
    }

    triggers.forEach(function (trigger) {
      var scope = trigger.closest('.note-scope') || trigger.parentNode;
      trigger.addEventListener('click', function () {
        var note = $('.margin-note', scope);
        if (note) open(note);
      });
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // The 12-col grid publishes its own width so breakout images can size off it
  // in pure CSS. In the DC source a ResizeObserver in the page's logic class does
  // this; deployed, the capture leaves behind whatever pixel value the editor
  // canvas measured, so without this every visitor at a different width sizes
  // breakouts against a stale number.
  function initGridWidth() {
    var shell = $('.bio-shell');
    if (!shell) return;
    function publish() {
      var w = shell.clientWidth;
      if (w > 0) shell.style.setProperty('--bio-grid-w', w + 'px');
    }
    publish();
    if (window.ResizeObserver) new ResizeObserver(publish).observe(shell);
    window.addEventListener('resize', publish);
    requestAnimationFrame(publish);
  }

  function initAll() {
    initHeader();
    initGridWidth();
    initHeroDots();
    initVideos();
    initSectionNav();
    initCarousels();
    initLightbox();
    initMarginNotes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
