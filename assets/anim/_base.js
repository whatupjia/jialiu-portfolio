// Shared helpers for the Bioanalytical feature animations.
(function () {
  var stage = document.querySelector('.stage');
  function fit() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
    stage.style.transform = 'scale(' + s + ')';
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(document.documentElement);

  var A = window.Anim = {};
  A.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  A.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // Cursor
  var cur = document.createElement('div');
  cur.className = 'cursor';
  cur.innerHTML = '<span class="ring"></span><svg viewBox="0 0 24 24"><path d="M4 2.5l15.5 9.3-7 1.4-3.6 6.6z" fill="#1b1b1f" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  stage.appendChild(cur);
  A.cursor = cur;
  A.move = function (x, y, ms) {
    cur.style.transitionDuration = (ms == null ? 700 : ms) + 'ms';
    cur.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    return A.sleep(ms == null ? 700 : ms);
  };
  A.click = function (el) {
    cur.classList.remove('click'); void cur.offsetWidth; cur.classList.add('click');
    if (el) { el.classList.add('pressed'); setTimeout(function () { el.classList.remove('pressed'); }, 160); }
    return A.sleep(260);
  };
  A.type = async function (el, text, ms) {
    el.textContent = '';
    for (var i = 0; i < text.length; i++) { el.textContent += text[i]; await A.sleep(ms || 45); }
  };
  // Loop a scene forever; reset() puts it back to the start, play() runs it.
  A.loop = async function (scene, reset, play, finalState) {
    if (A.reduced) { reset(); finalState(); return; }
    while (true) {
      reset();
      scene.classList.remove('fade');
      await play();
      await A.sleep(1800);
      scene.classList.add('fade');
      await A.sleep(550);
    }
  };
})();
