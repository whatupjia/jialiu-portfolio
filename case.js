// Variant: case study pages.
(function () {
  function run() {
    // Title: company in the eyebrow, product in the title (matches the homepage)
    var block = document.querySelector('.bio-title-block, .cs-title-block');
    var h1 = block && block.querySelector('h1');
    var eyebrow = block && block.firstElementChild;
    if (h1 && eyebrow && eyebrow !== h1) {
      var m = h1.textContent.trim().match(/^(Benchling|LinkedIn)\s+(.+)$/);
      if (m) {
        eyebrow.textContent = m[1];
        h1.textContent = m[2];
      }
      eyebrow.classList.add('v-case-eyebrow');
    }

    // Outcomes card
    document.querySelectorAll('div').forEach(function (el) {
      if (el.childElementCount === 0 && /^outcomes$/i.test(el.textContent.trim())) {
        el.textContent = 'Outcomes';
        el.classList.add('v-label');
        var card = el.parentElement;
        if (card) card.classList.add('v-outcomes');
      }
    });

    // Solution features: the panel crossing the middle of the viewport drives the sticky text
    var scrolly = document.querySelector('.v-scrolly');
    if (scrolly && 'IntersectionObserver' in window) {
      var panels = scrolly.querySelectorAll('.v-scrolly-panel');
      var steps = scrolly.querySelectorAll('.v-scrolly-steps li');
      var dots = scrolly.querySelectorAll('.v-scrolly-dots span');
      var setStep = function (n) {
        steps.forEach(function (li, i) {
          li.classList.toggle('is-active', i === n);
          li.classList.toggle('is-past', i < n);
        });
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === n); });
        panels.forEach(function (p, i) {
          p.classList.toggle('is-active', i === n);
          var v = p.querySelector('video');
          if (v) { if (i === n) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }
        });
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setStep(Array.prototype.indexOf.call(panels, e.target));
        });
      }, { rootMargin: '-50% 0px -50% 0px' });
      panels.forEach(function (p) { io.observe(p); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// Spacing hooks: class markers for the rhythm rules (the exported wrappers carry fixed inline margins).
(function () {
  function run() {
    document.querySelectorAll('section div').forEach(function (d) {
      var f = d.firstElementChild;
      var prev = d.previousElementSibling;
      if (!f || !prev) return;
      if (f.tagName === 'H3') d.classList.add('v-sub');
      else if (f.tagName === 'H4') {
        // the block's own top margin tells the two wrapper kinds apart: 3.5rem (56px) blocks vs 2rem (32px) items
        var mt = parseFloat(getComputedStyle(d).marginTop);
        if (mt === 56) d.classList.add('v-blk');
        else if (mt === 32) d.classList.add('v-fig-after');
      }
    });
    document.querySelectorAll('section').forEach(function (sec) {
      var ps = sec.querySelectorAll('p'); if (ps.length) ps[ps.length - 1].classList.add('v-last');
    });
    document.querySelectorAll('.sc-host[data-sc-name="ExpandableImage"]').forEach(function (h) {
      var w = h.parentElement;
      while (w && w.tagName === 'DIV' && w.children.length === 1 && !w.matches('section, .cs-shell')) { w.classList.add('v-figwrap'); w = w.parentElement; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
