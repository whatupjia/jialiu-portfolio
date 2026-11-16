// Shared helpers for the mapping explorations: fit the stage, draw dashed links, reveal in order.
window.MapViz = function (W, H, links, order) {
  var stage = document.querySelector('.stage');
  stage.style.width = W + 'px'; stage.style.height = H + 'px';
  function fit() {
    var s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = ((innerWidth - W * s) / 2) + 'px';
    stage.style.top = ((innerHeight - H * s) / 2) + 'px';
  }
  fit(); addEventListener('resize', fit);
  // Positions in stage units, independent of the current scale
  function box(el) {
    var s = stage.getBoundingClientRect(), k = s.width / W, b = el.getBoundingClientRect();
    return { l: (b.left - s.left) / k, t: (b.top - s.top) / k, r: (b.right - s.left) / k, b: (b.bottom - s.top) / k };
  }
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'links'); svg.setAttribute('width', W); svg.setAttribute('height', H);
  stage.appendChild(svg);
  var paths = links.map(function (L) {
    var a = box(document.querySelector(L[0])), b = box(document.querySelector(L[1])), d;
    if (L[2] === 'down') {           // from the bottom of a to the top of b
      var x1 = (a.l + a.r) / 2, y1 = a.b, x2 = (b.l + b.r) / 2, y2 = b.t, my = y2 - 36; // turn just above the target
      d = 'M' + x1 + ' ' + y1 + ' V' + my + ' H' + x2 + ' V' + y2;
    } else {                          // from the right of a to the left of b
      var X1 = a.r, Y1 = (a.t + a.b) / 2, X2 = b.l, Y2 = (b.t + b.b) / 2, mx = X1 + (X2 - X1) * (L[3] || 0.5);
      d = 'M' + X1 + ' ' + Y1 + ' H' + mx + ' V' + Y2 + ' H' + X2;
    }
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); svg.appendChild(p); return p;
  });
  var reduced = true; // static image: everything shows at once
  // order: list of [selector-or-'link:N', delayMs]
  order.forEach(function (o) {
    var els = o[0].indexOf('link:') === 0 ? [paths[+o[0].slice(5)]] : document.querySelectorAll(o[0]);
    var go = function () { [].forEach.call(els, function (e) { e.classList.add('on'); }); };
    reduced ? go() : setTimeout(go, o[1]);
  });
};
