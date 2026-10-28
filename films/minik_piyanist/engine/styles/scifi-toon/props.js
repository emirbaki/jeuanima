// scifi-toon · props.js — sets and props: flat colour bands, hard-edged shadows, boiling outlines.
import { clamp, lerp, hash, TAU, back, ss } from '/core/lib.js';
import { INK, g, W, H, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, bands, S, tx } from './toon.js';
import { shade } from './chars.js';

// —— generic ——
export function titleCard(str, t0, t, { y = 620, size = 120, col = '#fff3d6', shadow = '#ff3d8b', sub = '' } = {}) {
  const lt = t - t0; if (lt < 0) return;
  const k = Math.floor(lt * 12);                         // pops on 12 fps steps
  const sc = k < 1 ? .4 : k < 2 ? 1.18 : k < 3 ? .94 : 1;
  push(); translate(W / 2, y); scale(sc); rotate(-.04);
  for (const [dx, dy, c, w] of [[10, 12, shadow, 26], [0, 0, col, 26]]) {
    text(str, dx, dy, { font: `800 ${size}px "Baloo 2"`, fill: c, outlineW: w, outlineCol: INK });
    if (dx === 0) text(str, 0, 0, { font: `800 ${size}px "Baloo 2"`, fill: c });
  }
  if (sub) text(sub, 0, size * .8, { font: `800 ${size * .32}px "Baloo 2"`, fill: '#ffe3b0', outlineW: 10, outlineCol: INK });
  pop();
}
// retro-terminal tag, typed in at 24 chars/s (TEXTS gets the full text from the first frame)
export function screenTag(lines, x, y, t0, t, { col = '#ff7a3d', bg = '#1b1422' } = {}) {
  const lt = t - t0; if (lt < 0) return null;
  const n = Math.floor(lt * 24), wd = 470, ht = 44 + lines.length * 46;
  push(); translate(x, y);
  shape(rr(0, 0, wd, ht, 14), { fill: bg, lw: 6 });
  let used = 0;
  lines.forEach((ln, k) => { const show = ln.slice(0, Math.max(0, n - used)); used += ln.length; text(show + (show.length < ln.length && Math.floor(t * 6) % 2 ? '▌' : ''), 24, 44 + k * 46, { font: '700 34px Consolas, "Courier New", monospace', fill: col, align: 'left' }); });
  pop();
  return [x, y, x + wd, y + ht];
}

// —— the bar ——
export const BAR = { wall: '#2f5d62', wallS: '#244a4e', band: '#e0b24a', wood: '#8a5a3c', woodS: '#6b432b', top: '#a8714a', floor: '#3a2e3c', cream: '#f3e6c8', shelf: '#6b432b' };
// world: the counter top runs along y = counterY; wide shot camera at z 1 shows x 0..1080
export function barBack(t, { counterY = 1180, wash = 0, light = 1 } = {}) {
  const P = BAR;
  bands([P.wallS, P.wall, P.wall], -400, 1400, -1200, 2400);
  fillOnly(rect(-1200, 300, 3600, 26), P.band, { boil: 0 });
  // shelves with bottles
  for (const sy of [520, 760]) {
    shape(rect(-300, sy, 1700, 26), { fill: P.shelf, lw: 6 });
    for (let k = 0; k < 14; k++) {
      const bx = -260 + k * 118 + (hash(k + sy) - .5) * 30, h = 120 + hash(k * 3 + sy) * 70, c = ['#d9a640', '#5d8a3a', '#a23a4a', '#3d6fa8', '#e8e0c8'][Math.floor(hash(k * 7 + sy) * 5)];
      shape(spline([[bx - 20, sy], [bx - 22, sy - h * .6], [bx - 8, sy - h * .75], [bx - 8, sy - h], [bx + 8, sy - h], [bx + 8, sy - h * .75], [bx + 22, sy - h * .6], [bx + 20, sy]]), { fill: c, lw: 5, shade: () => shade(rect(bx + 6, sy - h, 30, h), 'rgba(0,0,0,.18)') });
      fillOnly(rr(bx - 14, sy - h * .45, 28, 30, 4), P.cream, { boil: .3 });
    }
  }
  // the neon-free sign: painted board "BAR"
  push(); translate(540, 170);
  shape(rr(-170, -64, 340, 120, 20), { fill: P.cream, lw: 7 });
  text('BAR', 0, 0, { font: '800 92px "Baloo 2"', fill: '#a23a4a' });
  pop();
  // wall clock (1 a.m.)
  push(); translate(910, 400); shape(ell(0, 0, 58, 58, 36), { fill: P.cream, lw: 7 });
  stroke([[0, 0], [0, -40]], 6); stroke([[0, 0], [22, -10]], 6); dot(0, 0, 6); pop();
}
export function counter(t, { y = 1180, front = true } = {}) {
  const P = BAR;
  shape(rect(-600, y, 2400, 46), { fill: P.top, lw: 7, shade: () => fillOnly(rect(-600, y + 30, 2400, 20), P.woodS, { boil: 0 }) });
  if (front) shape(rect(-600, y + 46, 2400, 900), { fill: P.wood, lw: 7, shade: () => {
    for (let k = 0; k < 16; k++) stroke([[-560 + k * 160, y + 70], [-560 + k * 160, y + 900]], 5);
    fillOnly(rect(-600, y + 46, 2400, 30), P.woodS, { boil: 0 });
  } });
}
// bar stool: seat top at y, legs down to floor, a foot ring at rest (where the sitter's shoes go)
export function stool(x, y, { floor = y + 230, rest = null } = {}) {
  const L = floor - y, sp = k => 40 + 18 * k;
  stroke([[x - 40, y + 14], [x - 58, floor]], 9); stroke([[x + 40, y + 14], [x + 58, floor]], 9);
  if (rest != null) { const k = (rest - y) / L; shape(rr(x - sp(k) - 10, rest - 7, 2 * sp(k) + 20, 16, 8), { fill: '#c9c2b4', lw: 6 }); }
  shape(rr(x - 74, y - 6, 148, 34, 14), { fill: '#a23a4a', lw: 7 });
}
export function shotGlass(x, y, s = 1, { full = 1, tilt = 0 } = {}) {
  push(); translate(x, y); rotate(tilt); scale(s);
  shape([[-26, -70], [26, -70], [20, 0], [-20, 0]], { fill: '#e6f4f4', lw: 6, shade: () => {
    if (full > 0) fillOnly([[-30, -70 * full + 4], [30, -70 * full + 4], [30, 0], [-30, 0]], '#d99a2b', { boil: .3 });
    fillOnly(rect(8, -80, 8, 80), 'rgba(255,255,255,.7)', { boil: 0 });
  } });
  pop();
}
export function bill(x, y, s = 1, a = 0) {
  push(); translate(x, y); rotate(a); scale(s);
  shape(spline([[-60, -90], [60, -90], [62, 80], [40, 92], [20, 80], [0, 92], [-20, 80], [-40, 92], [-62, 80]], true, 2), { fill: '#fffaf0', lw: 6 });
  for (let k = 0; k < 4; k++) stroke([[-40, -60 + k * 26], [k === 3 ? 0 : 36, -60 + k * 26]], 4);
  text('3×', -20, 50, { font: '800 30px "Baloo 2"', fill: '#a23a4a' });
  text('₺₺₺', 30, 52, { font: '800 22px "Baloo 2"', fill: INK });
  pop();
}
export function moth(x, y, t) {
  const f = Math.floor(t * 24) % 2;
  push(); translate(x, y);
  for (const sd of [-1, 1]) shape(spline([[0, 0], [sd * 34, f ? -30 : -6], [sd * 40, 14], [sd * 10, 10]]), { fill: '#cdbf9e', lw: 5 });
  shape(ell(0, 4, 7, 14, 10), { fill: '#7a6a50', lw: 5 });
  pop();
}
// the 1000-year-old lamp (it is the travel device: only its spout and the portal glow)
export function lamp(x, y, s = 1, a = 0, { glow = 0, t = 0, rub = 0 } = {}) {
  push(); translate(x, y); rotate(a + Math.sin(t * 40) * .04 * rub); scale(s);
  shape(spline([[60, -40], [130, -70], [160, -86], [150, -66], [96, -30]]), { fill: '#9a7a4a', lw: 6 });   // spout
  shape(spline([[-80, -46], [-130, -60], [-136, -20], [-90, -12]], false), 7);                           // handle
  shape(spline([[-96, 0], [-100, -40], [-50, -70], [50, -70], [100, -40], [96, 0], [0, 10]]), { fill: '#9a7a4a', shade: () => {
    shade(spline([[20, -80], [120, -60], [110, 10], [30, 14]]), '#73582f');
    for (let k = 0; k < 7; k++) fillOnly(ell(-60 + hash(k) * 120, -50 + hash(k + 9) * 44, 8 + hash(k + 3) * 10, 6 + hash(k + 5) * 6, 10), '#b5552e', { boil: .5 });   // rust
  } });
  shape(rr(-30, -96, 60, 30, 10), { fill: '#9a7a4a', lw: 6 }); shape(ell(0, -100, 14, 10, 12), { fill: '#73582f', lw: 5 });
  shape(rr(-40, -2, 80, 16, 6), { fill: '#73582f', lw: 6 });
  // a tiny sci-fi panel: the only clue it is hardware
  shape(rr(-34, -46, 46, 26, 5), { fill: '#1b1422', lw: 5 }); dot(-20, -33, 5, glow > 0 ? '#ff7a3d' : '#5a3a2a'); dot(-2, -33, 5, '#5a3a2a');
  if (glow > 0) for (const r of [40, 70]) fillOnly(ell(156, -84, r * glow, r * glow * .8, 24), `rgba(255,122,61,${.28 / (r / 40)})`, { boil: 0 });
  pop();
}
// a paper luggage tag tied to the lamp handle, swinging on its string. (x, y): where the string is tied.
// Returns the tag's screen box (for TEXTS).
export function paperTag(x, y, s, t, str, { t0 = 0 } = {}) {
  const lt = t - t0, sw = Math.sin(lt * 5) * .35 * Math.exp(-lt * 1.2) + Math.sin(t * 1.3) * .05;
  push(); translate(x, y); rotate(sw); scale(s);
  stroke(spline([[0, 0], [-10, 40], [-4, 80]], false), 4);
  push(); translate(-4, 80); rotate(-.12);
  shape(spline([[-26, 0], [26, 0], [96, 18], [96, 74], [-96, 74], [-96, 18]], true, 2), { fill: '#efe0b8', lw: 6, shade: () => fillOnly(rect(40, 0, 70, 80), '#dccb9c', { boil: .3 }) });
  shape(ell(0, 14, 7, 7, 10), { fill: '#3a2e3c', lw: 4 });
  text(str, 0, 48, { font: '800 30px "Baloo 2"', fill: '#7a3b22' });
  const box = [tx(-96, 0), tx(96, 74)];
  pop(); pop();
  return [Math.min(box[0][0], box[1][0]), Math.min(box[0][1], box[1][1]), Math.max(box[0][0], box[1][0]), Math.max(box[0][1], box[1][1])];
}
// a puff of old dust: grey blobs that grow and fade over d seconds
export function dust(x, y, s, t0, t, d = 1.1) {
  const lt = t - t0; if (lt < 0 || lt > d) return;
  const k = lt / d;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1.05 + i * .18), r = (40 + 90 * k) * s;
    shape(ell(x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * .5 - 30 * k * s, (22 + 26 * k) * s, (16 + 18 * k) * s, 14), { fill: '#b9ad8e', lw: 4, alpha: 1 - k });
  }
}
// thought bubble with two healthy, sparkling livers ("iki yeni ciğer")
export function liverBubble(x, y, s, t, pop_ = 1) {
  if (pop_ <= 0) return;
  push(); translate(x, y); scale(s * back(pop_, 2));
  for (const [cx, cy, r] of [[-150, 210, 14], [-120, 170, 22]]) shape(ell(cx, cy, r, r, 16), { fill: '#fff', lw: 6 });
  shape(spline([[-200, 0], [-170, -110], [-40, -150], [120, -130], [210, -40], [180, 90], [40, 130], [-120, 110]]), { fill: '#fff', lw: 7 });
  // a pair of lungs (akciğer) with the windpipe: reads as "ciğer" at a glance
  shape(noodle([0, -120], [0, -40], 0, 22, 22), { fill: '#f2b8c0', lw: 6 });
  for (let k = 0; k < 4; k++) stroke([[-11, -110 + k * 18], [11, -110 + k * 18]], 3);
  for (const sd of [-1, 1]) {
    push(); scale(sd, 1);
    stroke(spline([[0, -40], [24, -24], [44, -6]], false), 9);
    shape(spline([[20, -70], [70, -96], [118, -50], [124, 40], [96, 96], [40, 96], [18, 50], [30, 0]]), { fill: '#e87a8a', lw: 7, shade: () => shade(ell(110, 40, 30, 80, 16), '#c45466') });
    for (const [x0, y0, x1, y1] of [[46, -6, 70, -36], [52, 20, 86, 26], [50, 44, 66, 74]]) stroke([[x0, y0], [x1, y1]], 4);
    pop();
  }
  for (let k = 0; k < 4; k++) { const a = t * 3 + k * 1.6, r = 1 + .3 * Math.sin(t * 8 + k); push(); translate(Math.cos(a) * 150, Math.sin(a) * 80 - 20); scale(r); shape([[0, -18], [5, -5], [18, 0], [5, 5], [0, 18], [-5, 5], [-18, 0], [-5, -5]], { fill: '#ffe3b0', lw: 4 }); pop(); }
  pop();
}
// flying music notes for the piano
export function notes(x, y, t, n = 5, s = 1) {
  for (let k = 0; k < n; k++) {
    const ph = (t * .6 + k / n) % 1, nx = x + Math.sin(ph * 6 + k) * 60 * s + k * 20 * s, ny = y - ph * 300 * s;
    push(); translate(nx, ny); scale(s * (1 - ph * .3));
    shape(ell(0, 0, 16, 12, 14), { fill: INK, lw: 4, alpha: 1 - ph * ph });
    stroke([[14, 0], [14, -50], [34, -38]], 6, { alpha: 1 - ph * ph });
    pop();
  }
}
