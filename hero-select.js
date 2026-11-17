/* Homepage hero: a design-tool selection over a lab app. A cursor ("Jia") selects, resizes and
   drags three panels between layouts; each dropped panel turns into another scientific view.
   Mounts on .hero-canvas inside .hero-section. Canvas only; pauses offscreen and for reduced motion. */
(function () {
  var canvas = document.querySelector('.hero-canvas'), section = canvas && canvas.closest('.hero-section');
  if (!canvas || !section) return;
  var MONO = '11px ui-monospace, SFMono-Regular, Menlo, monospace';

  // ---------- panel views (drawn without labels) ----------
  var TEAL = '#17403e', BLUE = '#0d99ff', INK = '#171713', RULE = 'rgba(13,12,9,0.12)', SOFT = 'rgba(13,12,9,0.45)', ctx;
  function seeded(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var q = Math.imul(a ^ a >>> 15, 1 | a); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() + r() - 2) / 2; }
  function rr(x, y, w, h, rad) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, rad) : ctx.rect(x, y, w, h); }
  function bar(x, y, w, a) { ctx.fillStyle = 'rgba(13,12,9,' + (a || 0.18) + ')'; ctx.fillRect(x, y - 2, w, 4); }
  function panel(R, n) {
    rr(R[0], R[1], R[2], R[3], 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = RULE; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(13,12,9,0.14)'; ctx.fillRect(R[0] + 8, R[1] + 9, Math.min(R[2] - 16, n * 4), 4);
    return [R[0] + 8, R[1] + 22, R[2] - 16, R[3] - 30];
  }
  function clip(B) { ctx.save(); ctx.beginPath(); ctx.rect(B[0], B[1], B[2], B[3]); ctx.clip(); }

  var rnd = seeded(13);
  var WELLS = []; for (var w = 0; w < 96; w++) { var c = w % 12, v = c < 2 ? 0.08 + c * 0.04 : Math.min(1, Math.max(0, (c - 1) / 10 + (rnd() - 0.5) * 0.25)); WELLS.push(rnd() < 0.05 ? 1.2 : v); }
  var ROWS = []; for (var r = 0; r < 14; r++) ROWS.push([0, (0.5 * Math.pow(2, r % 7)).toFixed(1), (0.12 + rnd() * 0.85)]);
  function table(R, t) {
    var B = panel(R, 7); if (B[2] < 40 || B[3] < 16) return;
    var rh = 15, n = Math.floor(B[3] / rh), wide = B[2] > 150;
    for (var i = 0; i < n; i++) {
      var y = B[1] + i * rh + rh / 2, row = ROWS[(i - 1 + ROWS.length) % ROWS.length];
      bar(B[0], y, i ? 22 : 14, i ? 0.55 : 0.18);
      if (wide) { var cw = i ? 8 + row[1].length * 3 : 12; bar(B[0] + B[2] * 0.42 - cw, y, cw, i ? 0.3 : 0.18); }
      var bx = B[0] + B[2] * (wide ? 0.5 : 0.38), bw = B[2] * (wide ? 0.5 : 0.62);
      if (i) { ctx.fillStyle = 'rgba(13,12,9,0.08)'; ctx.fillRect(bx, y - 2.5, bw, 5); ctx.fillStyle = row[2] > 0.8 ? TEAL : 'rgba(13,12,9,0.5)'; ctx.fillRect(bx, y - 2.5, bw * row[2], 5); ctx.strokeStyle = 'rgba(13,12,9,0.06)'; ctx.beginPath(); ctx.moveTo(B[0], y + rh / 2); ctx.lineTo(B[0] + B[2], y + rh / 2); ctx.stroke(); }
      else bar(bx, y, 24);
    }
  }
  var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function image(R, t) {
    var B = panel(R, 12); if (B[2] < 30 || B[3] < 30) return;
    var IH = B[3];
    ctx.save(); rr(B[0], B[1], B[2], IH, 2); ctx.clip(); ctx.fillStyle = '#ecebe7'; ctx.fillRect(B[0], B[1], B[2], IH);
    var cs = 4, cols = Math.ceil(B[2] / cs), rows = Math.ceil(IH / cs);
    var ax = 0.3 + 0.15 * Math.sin(t * 0.21), ay = 0.4 + 0.2 * Math.cos(t * 0.17), bx = 0.75 + 0.1 * Math.cos(t * 0.13), by = 0.6 + 0.2 * Math.sin(t * 0.19);
    // all dots go into one path and one fill, instead of thousands of fillRect calls
    ctx.fillStyle = 'rgba(23,23,19,0.78)'; ctx.beginPath();
    var tw = t * 0.8;
    for (var gy = 0; gy < rows; gy++) {
      var v = gy / rows, dyA = v - ay, dyB = v - by, base = 0.3 - 0.12 * v, brow = (gy & 3) * 4;
      for (var gx = 0; gx < cols; gx++) {
        var u = gx / cols, xa = (u - ax) * 1.6, xb = (u - bx) * 1.6, d1 = Math.sqrt(xa * xa + dyA * dyA), d2s = xb * xb + dyB * dyB;
        var val = base + 0.32 * Math.sin(d1 * 11 - tw) * Math.exp(-d1 * 1.6) + 0.4 * Math.exp(-d2s * 10);
        if (val > (BAY[brow + (gx & 3)] + 0.5) / 16) ctx.rect(B[0] + gx * cs, B[1] + gy * cs, cs - 1, cs - 1);
      }
    }
    ctx.fill();
    ctx.restore();
  }

  // 2. heatmap with a dendrogram; rows re-sort between two orders
  var HM = (function () { var r = seeded(7), m = []; for (var i = 0; i < 12; i++) { var row = [], g = i % 3; for (var j = 0; j < 16; j++) row.push(Math.max(0, Math.min(1, 0.5 + (g === 0 ? 0.4 : g === 1 ? -0.3 : 0.1) * Math.sin(j * 0.5 + g) + gauss(r) * 0.18))); m.push(row); } return m; })();
  var ORD_A = [0, 3, 6, 9, 1, 4, 7, 10, 2, 5, 8, 11], ORD_B = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  function heatmap(R, t) {
    var B = panel(R, 9); if (B[2] < 50 || B[3] < 40) return;
    var dw = Math.min(40, B[2] * 0.2), cw = (B[2] - dw - 4) / 16, ch = B[3] / 12, x0 = B[0] + dw + 4;
    var ph = (t % 8) / 8, k = ph < 0.4 ? 0 : ph < 0.5 ? (ph - 0.4) / 0.1 : ph < 0.9 ? 1 : 1 - (ph - 0.9) / 0.1; k = k * k * (3 - 2 * k);
    for (var i = 0; i < 12; i++) {
      var pa = ORD_A.indexOf(i), pb = ORD_B.indexOf(i), y = B[1] + (pb + (pa - pb) * k) * ch;
      for (var j = 0; j < 16; j++) { var v = HM[i][j], g = Math.round(244 - v * 190); ctx.fillStyle = v > 0.85 ? TEAL : 'rgb(' + g + ',' + g + ',' + (g - 2) + ')'; ctx.fillRect(x0 + j * cw, y, cw - 1, ch - 1); }
    }
    // dendrogram fades in once rows are clustered
    ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = SOFT; ctx.beginPath();
    function yc(p) { return B[1] + (p + 0.5) * ch; }
    var L1 = [], L2 = [];
    for (var p = 0; p < 12; p += 2) { var xa = x0 - 4, xb = x0 - dw * 0.35; ctx.moveTo(xa, yc(p)); ctx.lineTo(xb, yc(p)); ctx.lineTo(xb, yc(p + 1)); ctx.lineTo(xa, yc(p + 1)); L1.push((yc(p) + yc(p + 1)) / 2); }
    for (p = 0; p < 6; p += 2) { xb = x0 - dw * 0.7; ctx.moveTo(x0 - dw * 0.35, L1[p]); ctx.lineTo(xb, L1[p]); ctx.lineTo(xb, L1[p + 1]); ctx.lineTo(x0 - dw * 0.35, L1[p + 1]); L2.push((L1[p] + L1[p + 1]) / 2); }
    xb = x0 - dw; ctx.moveTo(x0 - dw * 0.7, L2[0]); ctx.lineTo(xb, L2[0]); ctx.lineTo(xb, L2[2]); ctx.lineTo(x0 - dw * 0.7, L2[2]); ctx.moveTo(x0 - dw * 0.7, L2[1]); ctx.lineTo(xb, L2[1]);
    ctx.stroke(); ctx.restore();
  }
  // 4. ball-and-stick molecule turning in 3D
  var MOL = (function () {
    var A = [], Bd = [];
    for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; A.push([Math.cos(a), Math.sin(a), 0, 0]); Bd.push([i, (i + 1) % 6]); }
    [[0, 1], [2, 2], [3, 1], [5, 3]].forEach(function (s) { var p = A[s[0]], n = A.length; A.push([p[0] * 1.9, p[1] * 1.9, s[1] === 2 ? 0.4 : 0, s[1]]); Bd.push([s[0], n]); if (s[1] === 1) { A.push([p[0] * 2.6, p[1] * 2.6 + 0.5, 0.6, 2]); Bd.push([n, n + 1]); A.push([p[0] * 2.6, p[1] * 2.6 - 0.5, -0.6, 2]); Bd.push([n, n + 2]); } });
    [1, 4].forEach(function (i) { var p = A[i], n = A.length; A.push([p[0] * 1.75, p[1] * 1.75, 0, 2]); Bd.push([i, n]); });
    return { A: A, B: Bd };
  })();
  function molecule(R, t) {
    var B = panel(R, 8); if (B[2] < 40 || B[3] < 40) return;
    var cx = B[0] + B[2] / 2, cy = B[1] + B[3] / 2, sc = Math.min(B[2], B[3]) / 8, ay = t * 0.5, ax = 0.5 + 0.25 * Math.sin(t * 0.3);
    var P = MOL.A.map(function (p) { var x = p[0] * Math.cos(ay) + p[2] * Math.sin(ay), z = -p[0] * Math.sin(ay) + p[2] * Math.cos(ay), y = p[1] * Math.cos(ax) - z * Math.sin(ax); z = p[1] * Math.sin(ax) + z * Math.cos(ax); var f = 12 / (12 + z); return [cx + x * sc * f, cy + y * sc * f, z, f, p[3]]; });
    clip(B);
    ctx.strokeStyle = 'rgba(23,23,19,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); MOL.B.forEach(function (b) { ctx.moveTo(P[b[0]][0], P[b[0]][1]); ctx.lineTo(P[b[1]][0], P[b[1]][1]); }); ctx.stroke(); ctx.lineWidth = 1;
    P.map(function (p, i) { return [p, i]; }).sort(function (a, b) { return b[0][2] - a[0][2]; }).forEach(function (e) {
      var p = e[0], kind = p[4], rad = (kind === 2 ? 0.22 : kind === 3 ? 0.36 : 0.32) * sc * p[3];
      var g = ctx.createRadialGradient(p[0] - rad * 0.35, p[1] - rad * 0.35, rad * 0.1, p[0], p[1], rad);
      var c = kind === 1 ? ['#5d8a86', TEAL] : kind === 2 ? ['#ffffff', '#c9c8c3'] : kind === 3 ? ['#bdbcb6', '#6d6c66'] : ['#6b6b66', '#1d1d1a'];
      g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(13,12,9,0.25)'; ctx.stroke();
    });
    ctx.restore();
  }
  // 10. sample board: cards hop from column to column
  var KB = (function () { var r = seeded(3), c = []; for (var i = 0; i < 11; i++) c.push({ col: i % 4, w: 0.4 + r() * 0.5, tag: r() < 0.3, x: null, y: null }); return c; })(), kbStep = -1;
  function kanban(R, t) {
    var B = panel(R, 12); if (B[2] < 60 || B[3] < 40) return;
    var step = Math.floor(t / 1.3);
    if (kbStep < 0) kbStep = step;
    while (kbStep < step) { kbStep++; var c = KB[(kbStep * 7) % KB.length]; c.col = (c.col + 1) % 4; KB.splice(KB.indexOf(c), 1); KB.push(c); }
    var cw = B[2] / 4, ch = Math.min(22, B[3] / 4.4);
    for (var k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(13,12,9,0.035)'; rr(B[0] + k * cw + 2, B[1], cw - 4, B[3], 4); ctx.fill(); bar(B[0] + k * cw + 8, B[1] + 8, cw * 0.3); }
    var count = [0, 0, 0, 0];
    KB.forEach(function (c) {
      var tx = B[0] + c.col * cw + 6, ty = B[1] + 16 + count[c.col]++ * (ch + 5);
      if (c.x == null) { c.x = tx; c.y = ty; }
      c.x += (tx - c.x) * 0.12; c.y += (ty - c.y) * 0.12;
      if (c.y + ch > B[1] + B[3]) return;
      var moving = Math.abs(tx - c.x) > 2;
      ctx.save(); if (moving) { ctx.shadowColor = 'rgba(13,12,9,0.18)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2; }
      rr(c.x, c.y, cw - 12, ch, 3); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
      ctx.strokeStyle = moving ? BLUE : RULE; ctx.stroke();
      bar(c.x + 6, c.y + ch / 2, (cw - 30) * c.w, 0.3);
      if (c.tag) { ctx.fillStyle = TEAL; ctx.beginPath(); ctx.arc(c.x + cw - 20, c.y + ch / 2, 2.5, 0, 7); ctx.fill(); }
    });
  }

  // 16. image viewer over a point cloud: start zoomed out, zoom into a cluster, pan across, zoom back out.
  // Points live in pixel space around the panel's center, so resizing the panel only crops the field;
  // dots keep a fixed size and the field is large enough to fill any panel when zoomed out.
  var PC = (function () {
    var r = seeded(58), p = [], WX = 900, WY = 700;
    for (var i = 0; i < 8000; i++) p.push([(r() * 2 - 1) * WX, (r() * 2 - 1) * WY, 0]);
    [[70, -40, 46, 1], [-110, 60, 70, 0], [180, 120, 55, 0], [-220, -130, 80, 0], [10, 200, 60, 0], [300, -170, 50, 0], [-380, 150, 65, 0], [420, 60, 70, 0]].forEach(function (c) {
      for (var i = 0; i < 520; i++) p.push([c[0] + gauss(r) * c[2] * 1.4, c[1] + gauss(r) * c[2] * 1.2, c[3]]);
    });
    return p;
  })();
  function cloud(R, t) {
    var B = panel(R, 12); if (B[2] < 40 || B[3] < 40) return;
    var p = (t % 11) / 11, e = function (a, b) { var k = Math.max(0, Math.min(1, (p - a) / (b - a))); return 0.5 - 0.5 * Math.cos(Math.PI * k); };
    var zin = e(0.12, 0.3), pan = e(0.36, 0.66), zout = e(0.72, 0.9), k = zin * (1 - zout), z = 0.6 + 1.6 * k;
    var c1 = [70, -40], c2 = [-110, 60], cx = (c1[0] + (c2[0] - c1[0]) * pan) * k, cy = (c1[1] + (c2[1] - c1[1]) * pan) * k;
    var ox = B[0] + B[2] / 2, oy = B[1] + B[3] / 2, d = 1.6;
    ctx.save(); rr(B[0], B[1], B[2], B[3], 2); ctx.clip(); ctx.fillStyle = '#ecebe7'; ctx.fillRect(B[0], B[1], B[2], B[3]);
    // grid in field space: it zooms and pans with the dots and always spans the whole viewer
    var G = 40 * z, gx0 = ox - cx * z, gy0 = oy - cy * z;
    ctx.strokeStyle = 'rgba(13,12,9,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
    for (var gx = gx0 + Math.ceil((B[0] - gx0) / G) * G; gx < B[0] + B[2]; gx += G) { ctx.moveTo(Math.round(gx) + 0.5, B[1]); ctx.lineTo(Math.round(gx) + 0.5, B[1] + B[3]); }
    for (var gy = gy0 + Math.ceil((B[1] - gy0) / G) * G; gy < B[1] + B[3]; gy += G) { ctx.moveTo(B[0], Math.round(gy) + 0.5); ctx.lineTo(B[0] + B[2], Math.round(gy) + 0.5); }
    ctx.stroke();
    // cull to the viewer in field space first, then draw each color as a single path
    var x0 = (B[0] - 2 - ox) / z + cx, x1 = (B[0] + B[2] + 2 - ox) / z + cx, y0 = (B[1] - 2 - oy) / z + cy, y1 = (B[1] + B[3] + 2 - oy) / z + cy, h = d / 2;
    [0, 1].forEach(function (c) {
      ctx.beginPath();
      for (var i = 0; i < PC.length; i++) { var q = PC[i]; if (q[2] !== c || q[0] < x0 || q[0] > x1 || q[1] < y0 || q[1] > y1) continue; ctx.rect(ox + (q[0] - cx) * z - h, oy + (q[1] - cy) * z - h, d, d); }
      ctx.fillStyle = c ? TEAL : 'rgba(23,23,19,0.38)'; ctx.fill();
    });
    ctx.restore();
  }

  var VIEWS = { table: table, image: image, heatmap: heatmap, molecule: molecule, kanban: kanban, cloud: cloud };
  var HeroViews = { draw: function (k, c, R, t) { ctx = c; VIEWS[k](R, t); } };

  // ---------- layout: the window sits right of the headline, centered on it ----------
  // The window starts GAP px right of the headline's last letter and is at most 660px wide.
  var GAP = 48;
  function chartRect(W, H, title) {
    var cell = 11, x0 = Math.round(title.right + GAP);
    var x1 = x0 + Math.floor((Math.min(W - 44, x0 + 660) - x0) / 55) * 55;
    var hh = Math.floor(H * 0.68 / 55) * 55;
    var y0 = Math.round((title.cy - hh / 2) / cell) * cell;
    return { x0: x0, y0: y0, x1: x1, y1: y0 + hh, cell: cell };
  }


  // ---------- the selection animation ----------
  function selection() {
    var BLUE = '#0d99ff', INK = '#171713', RULE = 'rgba(13,12,9,0.12)', ctx, W, H, F;
    // panel rects in frame units [x, y, w, h]
    var LAY3 = {
      A: [[0.05, 0.13, 0.5, 0.4], [0.59, 0.13, 0.36, 0.4], [0.05, 0.58, 0.9, 0.37]],
      A2: [[0.05, 0.13, 0.4, 0.4], [0.49, 0.13, 0.46, 0.4], [0.05, 0.58, 0.9, 0.37]],
      B: [[0.55, 0.13, 0.4, 0.36], [0.05, 0.13, 0.46, 0.82], [0.55, 0.53, 0.4, 0.42]],
      B2: [[0.55, 0.13, 0.4, 0.48], [0.05, 0.13, 0.46, 0.82], [0.55, 0.65, 0.4, 0.3]],
      C: [[0.39, 0.13, 0.56, 0.46], [0.39, 0.64, 0.56, 0.31], [0.05, 0.13, 0.3, 0.82]],
      C2: [[0.39, 0.13, 0.56, 0.36], [0.39, 0.54, 0.56, 0.41], [0.05, 0.13, 0.3, 0.82]]
    };
    // [layout after this step, element, grab]: 'tl'/'br' resize from that corner, 'c' drag the panel to a new spot
    var STEPS3 = [['A2', 1, 'tl'], ['B', 0, 'c'], ['B2', 0, 'br'], ['C', 2, 'c'], ['C2', 0, 'br'], ['A', 2, 'c']];
    // phones: two full-width panels; resize the divider, then drag one panel above the other
    var LAY2 = {
      P: [[0.05, 0.13, 0.9, 0.4], [0.05, 0.57, 0.9, 0.38]],
      P2: [[0.05, 0.13, 0.9, 0.52], [0.05, 0.69, 0.9, 0.26]],
      P3: [[0.05, 0.47, 0.9, 0.48], [0.05, 0.13, 0.9, 0.3]],
      P4: [[0.05, 0.59, 0.9, 0.36], [0.05, 0.13, 0.9, 0.42]]
    };
    var STEPS2 = [['P2', 0, 'br'], ['P3', 1, 'c'], ['P4', 1, 'br'], ['P', 0, 'c']];
    var LAY = LAY3, STEPS = STEPS3;
    // each step: the gesture takes ACT seconds, then the layout rests until STEP
    var STEP = 3.8, ACT = 2.6;
    function ease(k) { return 0.5 - 0.5 * Math.cos(Math.PI * k); }
    function easeOut(k) { return 1 - Math.pow(1 - k, 3); }
    function lerp(a, b, k) { return a + (b - a) * k; }
    function abs(r) { return [F.x + r[0] * F.w, F.y + r[1] * F.h, r[2] * F.w, r[3] * F.h]; }
    function rr(x, y, w, h, rad) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, rad) : ctx.rect(x, y, w, h); }
    // panel views live in hero-views.js; these are Jia's picks
    var ORDERV = ['heatmap', 'molecule', 'table', 'cloud', 'kanban', 'image'], DRAW = {};
    ORDERV.forEach(function (k) { DRAW[k] = function (R, t) { HeroViews.draw(k, ctx, R, t); }; });
    var kind = ['heatmap', 'molecule', 'table'], prevKind = kind.slice(), kindAt = [0, 0, 0], prevAt = [0, 0, 0], lastStep = -1, swaps = 0;
    function view(j, R, t) {
      // each view runs on its own clock from when it appeared, so it always starts at the top of its loop
      var k = Math.max(0, Math.min(1, (t - kindAt[j]) / 0.25)), lt = Math.max(0, t - kindAt[j]);
      if (k < 1 && prevKind[j] !== kind[j]) { ctx.save(); ctx.globalAlpha = 1 - k; DRAW[prevKind[j]](R, t - prevAt[j]); ctx.globalAlpha = k; DRAW[kind[j]](R, lt); ctx.restore(); }
      else DRAW[kind[j]](R, lt);
    }
    return {
      // mode: 'side' (right of the headline), 'stack' (under it, three panels) or 'phone' (under it, two panels)
      size: function (c, w, h, title, dpr, mode) {
        ctx = c.getContext('2d'); W = w; H = h; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var two = mode === 'phone';
        if (two !== (LAY === LAY2)) { LAY = two ? LAY2 : LAY3; STEPS = two ? STEPS2 : STEPS3; lastStep = -1; }
        // stacked: the window fills the canvas, leaving 24px right and below for the cursor tag and size pill
        if (mode === 'side') { var R = chartRect(W, H, title); F = { x: R.x0, y: R.y0 + 10, w: R.x1 - R.x0, h: R.y1 - R.y0 - 10 }; }
        else F = { x: 0.5, y: 0.5, w: W - 25, h: H - 25 };
      },
      frame: function (t) {
        t = Math.max(0, t); // the first rAF timestamp can precede start
        var stepN = Math.floor(t / STEP), i = stepN % STEPS.length, st = STEPS[i], pv = STEPS[(i + STEPS.length - 1) % STEPS.length], u = Math.min(1, (t % STEP) / ACT);
        var FROM = LAY[pv[0]], TO = LAY[st[0]], j = st[1], resize = st[2] !== 'c';
        // after a move, the dropped panel turns into another view
        if (stepN !== lastStep) { lastStep = stepN; if (stepN > 0 && !resize) { var freeK = ORDERV.filter(function (v) { return kind.indexOf(v) < 0; }), nextK = freeK[swaps++ % freeK.length]; prevKind[j] = kind[j]; prevAt[j] = kindAt[j]; kind[j] = nextK; kindAt[j] = t + ACT * (0.76 - u); } }
        function ph(a, b, f) { return (f || ease)(Math.max(0, Math.min(1, (u - a) / (b - a)))); }
        // one continuous gesture: the drag eases in and out, the drop settles out of it without a pause
        var drag = ph(0.32, 0.76), reflow = resize ? drag : ph(0.4, 0.78), drop = ph(0.68, 0.86, easeOut);
        var lift = Math.min(ph(0.29, 0.36), 1 - ph(0.7, 0.86, easeOut));
        var E = FROM.map(function (r, q) { return abs(r.map(function (v, z) { return lerp(v, TO[q][z], reflow); })); });
        var a0 = abs(FROM[j]), a1 = abs(TO[j]), S;
        if (resize) S = a0.map(function (v, z) { return lerp(v, a1[z], drag); });
        else {
          var w = lerp(a0[2], a1[2], drop), h = lerp(a0[3], a1[3], drop);
          var cx = lerp(a0[0] + a0[2] / 2, a1[0] + a1[2] / 2, drag), cy = lerp(a0[1] + a0[3] / 2, a1[1] + a1[3] / 2, drag);
          S = [cx - w / 2, cy - h / 2, w, h];
        }
        if (u > 0.28) E[j] = S;
        // cursor: travel from where the last drag ended to this grab point, then stay on the handle or the panel
        function grab(R, mode) { return mode === 'br' ? [R[0] + R[2], R[1] + R[3]] : mode === 'tl' ? [R[0], R[1]] : [R[0] + R[2] * 0.55, R[1] + R[3] * 0.5]; }
        var pe = grab(abs(FROM[pv[1]]), pv[2]), g0 = grab(a0, st[2]), X, Y;
        if (u < 0.28) { var k = ph(0.02, 0.26), bend = Math.sin(k * Math.PI) * 0.12; X = lerp(pe[0], g0[0], k) - (g0[1] - pe[1]) * bend; Y = lerp(pe[1], g0[1], k) + (g0[0] - pe[0]) * bend; }
        else { var gp = grab(S, st[2]); X = gp[0]; Y = gp[1]; }
        ctx.clearRect(0, 0, W, H);
        // app window: background and title bar
        ctx.fillStyle = '#f7f6f2'; ctx.fillRect(F.x, F.y, F.w, F.h); ctx.strokeStyle = 'rgba(13,12,9,0.14)'; ctx.lineWidth = 1; ctx.strokeRect(F.x + 0.5, F.y + 0.5, F.w, F.h);
        ctx.fillStyle = '#fff'; ctx.fillRect(F.x + 1, F.y + 1, F.w - 1, F.h * 0.08); ctx.strokeStyle = RULE; ctx.beginPath(); ctx.moveTo(F.x, F.y + F.h * 0.08 + 0.5); ctx.lineTo(F.x + F.w, F.y + F.h * 0.08 + 0.5); ctx.stroke();
        // window dots
        ctx.fillStyle = 'rgba(13,12,9,0.16)'; for (var wd = 0; wd < 3; wd++) { ctx.beginPath(); ctx.arc(F.x + F.w * 0.05 + 4 + wd * 13, F.y + F.h * 0.04, 4, 0, 7); ctx.fill(); }
        // panels underneath, then the drop placeholder, then the panel being dragged
        function draw(q) { view(q, E[q], t); }
        E.forEach(function (_, q) { if (q !== j || u <= 0.28 || resize) draw(q); });
        if (!resize) {
          var pa = Math.min(ph(0.36, 0.44), 1 - ph(0.72, 0.84));
          if (pa > 0) { ctx.save(); ctx.globalAlpha = pa; rr(a1[0], a1[1], a1[2], a1[3], 5); ctx.fillStyle = 'rgba(13,153,255,0.07)'; ctx.fill(); ctx.setLineDash([5, 4]); ctx.strokeStyle = BLUE; ctx.lineWidth = 1.25; ctx.stroke(); ctx.restore(); }
          if (u > 0.28) {
            if (lift > 0) { ctx.save(); ctx.shadowColor = 'rgba(13,12,9,' + 0.22 * lift + ')'; ctx.shadowBlur = 24 * lift; ctx.shadowOffsetY = 10 * lift; rr(S[0], S[1], S[2], S[3], 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); }
            var sc = 1 + 0.02 * lift; ctx.save(); ctx.translate(S[0] + S[2] / 2, S[1] + S[3] / 2); ctx.scale(sc, sc); ctx.rotate(-0.008 * lift); ctx.translate(-(S[0] + S[2] / 2), -(S[1] + S[3] / 2)); draw(j); ctx.restore();
          }
        }
        // hover outline as the cursor arrives, then the selection after the click
        var selR = u < 0.28 ? abs(FROM[pv[1]]) : S;
        if (u > 0.18 && u < 0.28) { ctx.strokeStyle = 'rgba(13,153,255,0.55)'; ctx.lineWidth = 1; ctx.strokeRect(a0[0] - 0.5, a0[1] - 0.5, a0[2] + 1, a0[3] + 1); }
        var Sb = selR; if (!resize && u > 0.28) { var e2 = 1 + 0.02 * lift; Sb = [S[0] - S[2] * (e2 - 1) / 2, S[1] - S[3] * (e2 - 1) / 2, S[2] * e2, S[3] * e2]; }
        ctx.strokeStyle = BLUE; ctx.lineWidth = 1.25; ctx.strokeRect(Sb[0] - 0.5, Sb[1] - 0.5, Sb[2] + 1, Sb[3] + 1);
        [[Sb[0], Sb[1]], [Sb[0] + Sb[2], Sb[1]], [Sb[0], Sb[1] + Sb[3]], [Sb[0] + Sb[2], Sb[1] + Sb[3]]].forEach(function (p) { ctx.fillStyle = '#fff'; ctx.fillRect(p[0] - 3.5, p[1] - 3.5, 7, 7); ctx.strokeRect(p[0] - 3.5, p[1] - 3.5, 7, 7); });
        var sz = Math.round(Sb[2] / F.w * 1200) + ' × ' + Math.round(Sb[3] / F.w * 1200);
        ctx.font = MONO; var tw = ctx.measureText(sz).width; ctx.fillStyle = BLUE;
        rr(Sb[0] + Sb[2] / 2 - tw / 2 - 6, Sb[1] + Sb[3] + 8, tw + 12, 18, 3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sz, Sb[0] + Sb[2] / 2, Sb[1] + Sb[3] + 17.5);
        // cursor: a diagonal resize arrow while on a corner handle, otherwise the pointer; name tag either way
        var press = u > 0.28 && u < 0.78;
        ctx.save(); ctx.translate(X, Y);
        if (resize && u > 0.24 && u < 0.8) {
          ctx.rotate(Math.PI / 4); ctx.beginPath();
          ctx.moveTo(0, -11); ctx.lineTo(5, -5); ctx.lineTo(1.8, -5); ctx.lineTo(1.8, 5); ctx.lineTo(5, 5); ctx.lineTo(0, 11); ctx.lineTo(-5, 5); ctx.lineTo(-1.8, 5); ctx.lineTo(-1.8, -5); ctx.lineTo(-5, -5); ctx.closePath();
          ctx.fillStyle = INK; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.rotate(-Math.PI / 4);
        } else {
          if (press) ctx.scale(0.92, 0.92);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.lineTo(4.5, 12); ctx.lineTo(8, 19); ctx.lineTo(10.5, 18); ctx.lineTo(7.5, 11); ctx.lineTo(13, 11); ctx.closePath();
          ctx.fillStyle = INK; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
          if (press) ctx.scale(1 / 0.92, 1 / 0.92);
        }
        ctx.font = MONO; ctx.fillStyle = TEAL; rr(14, 18, 30, 18, 9); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Jia', 29, 27.5); ctx.restore();
      },
      still: function () { this.frame(0); }
    };
  }

  // ---------- mount ----------
  var fx = selection(), mode = 'side', last = 0, visible = true, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, start = performance.now();
  function size() {
    var r = canvas.getBoundingClientRect(); if (!r.width) return;
    var tr = section.querySelector('.hero-title').getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    // right edge of the text as set (the title box itself is wider than its lines)
    var right = 0;
    section.querySelectorAll('.hero-line-sans, .hero-sub').forEach(function (el) { var rg = document.createRange(); rg.selectNodeContents(el); Array.prototype.forEach.call(rg.getClientRects(), function (q) { if (q.width) right = Math.max(right, q.right); }); });
    mode = innerWidth < 600 ? 'phone' : innerWidth < 900 ? 'stack' : 'side';
    fx.size(canvas, r.width, r.height, { cy: (tr.top + tr.bottom) / 2 - r.top, right: right - r.left }, dpr, mode);
    fx.frame(reduced ? 0 : (performance.now() - start) / 1000);
  }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(section);
  if (window.ResizeObserver) new ResizeObserver(size).observe(section); else addEventListener('resize', size);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
  size();
  if (reduced) return;
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible || !canvas.offsetWidth) return;
    if (mode === 'phone' && now - last < 32) return; // 30fps on phones
    last = now; fx.frame((now - start) / 1000);
  })(start);
})();
