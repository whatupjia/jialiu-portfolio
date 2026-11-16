// Recruiter Inbox variant: group a few paragraphs with their figure for side-by-side layouts, and band the final screen.
(function () {
  function figFor(prefix) {
    var imgs = document.querySelectorAll('.expandable-image-wrap img');
    for (var i = 0; i < imgs.length; i++) {
      if ((imgs[i].alt || '').indexOf(prefix) === 0) {
        var f = imgs[i].closest('.expandable-image-wrap');
        while (f.parentElement && f.parentElement.children.length === 1) f = f.parentElement;
        return f;
      }
    }
    return null;
  }
  function split(prefix, nParas, rev) {
    var fig = figFor(prefix);
    if (!fig) return;
    var paras = [], p = fig.previousElementSibling;
    while (p && p.tagName === 'P' && paras.length < nParas) { paras.unshift(p); p = p.previousElementSibling; }
    if (!paras.length) return;
    var wrap = document.createElement('div'); wrap.className = 'v-split' + (rev ? ' rev' : '');
    var text = document.createElement('div'); text.className = 'v-split-text';
    fig.parentNode.insertBefore(wrap, paras[0]);
    paras.forEach(function (x) { text.appendChild(x); });
    wrap.appendChild(text); wrap.appendChild(fig);
  }
  // Near-square or tall screenshots would run very tall at full width, so they stay in the text column
  function markTall() {
    document.querySelectorAll('.expandable-image-wrap img').forEach(function (img) {
      // width/height attributes are known before the (lazy) image loads, so the layout never jumps
      var w = +img.getAttribute('width') || img.naturalWidth, h = +img.getAttribute('height') || img.naturalHeight;
      if (w && h / w >= 0.95) img.closest('.expandable-image-wrap').classList.add('v-narrow');
    });
  }
  function run() {
    markTall();
    var old = figFor('Screenshot of LinkedIn Recruiter');
    if (old) { var ow = old.classList.contains('expandable-image-wrap') ? old : old.querySelector('.expandable-image-wrap'); if (ow) ow.classList.add('v-small'); }
    var keys = figFor('Keyboard navigation spec');
    if (keys) { var kw = keys.classList.contains('expandable-image-wrap') ? keys : keys.querySelector('.expandable-image-wrap'); if (kw) kw.classList.add('v-mid'); }
    // A few figures read better a little narrower than full width
    var mid = figFor('Comparison of enterprise and small business');
    if (mid) { var w = mid.classList.contains('expandable-image-wrap') ? mid : mid.querySelector('.expandable-image-wrap'); if (w) w.classList.add('v-mid'); }
    split('Three iterations of the profile card', 2, false);
    split('Before and after: the original note-adding flow', 1, true);
    var fin = figFor('The final shipped Recruiter inbox');
    if (fin) fin.classList.add('v-figband');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
