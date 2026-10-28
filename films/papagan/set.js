// Papağan — the honeymoon hotel room (night and morning palettes) and the overstuffed suitcase. Film-only props.
import { clamp, lerp, hash, TAU, ss } from '/core/lib.js';
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, quad, dot, text, bands } from './engine/styles/scifi-toon/toon.js';
import { shade } from './engine/styles/scifi-toon/chars.js';

export const NIGHT = { wall: '#8e4a63', wallS: '#743c51', stripe: '#9d5670', trim: '#e9c46a', floor: '#4a2e3c', floorS: '#3a2330',
  wood: '#6b3f2a', woodS: '#52301f', bed: '#7a2235', bedS: '#5c1828', sheet: '#f3e6c8', sky: '#1f1b33', curtain: '#c0394f', curtainS: '#962c3e' };
export const MORNING = { wall: '#bfe0cf', wallS: '#a6cdb9', stripe: '#cfe9dc', trim: '#e9c46a', floor: '#c9a27a', floorS: '#b08a63',
  wood: '#a8714a', woodS: '#8a5a3c', bed: '#e86a8a', bedS: '#c95273', sheet: '#fffaf0', sky: '#ffe3b0', curtain: '#f2c94c', curtainS: '#d9ad2f' };

export function room(t, P, { dark = 0, messy = 0 } = {}) {
  bands([P.wallS, P.wall, P.wall], -500, 1520, -1200, 2400);
  for (let k = 0; k < 14; k++) fillOnly(rect(-300 + k * 110, -500, 26, 2020), P.stripe, { boil: 0 });      // wallpaper stripes
  fillOnly(rect(-1200, 1160, 3600, 18), P.trim, { boil: 0 });                                              // chair rail
  shape(rect(-1200, 1500, 3600, 700), { fill: P.floor, lw: 7, shade: () => { for (let k = 0; k < 12; k++) stroke([[-400 + k * 160, 1500], [-560 + k * 200, 2200]], 4); } });
  // window with curtains (moon at night, sun in the morning)
  push(); translate(890, 640);
  shape(rr(-150, -230, 300, 440, 12), { fill: P.sky, lw: 7 });
  if (P === NIGHT) { shape(ell(50, -120, 46, 46, 30), { fill: '#fff3d6', lw: 6, shade: () => fillOnly(ell(70, -132, 40, 44, 24), P.sky, { boil: 0 }) }); for (let k = 0; k < 5; k++) dot(-100 + hash(k) * 200, -200 + hash(k + 4) * 300, 4, '#fff3d6'); }
  else { shape(ell(-30, -100, 60, 60, 30), { fill: '#fff3d6', lw: 6 }); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * .2; stroke([[-30 + Math.cos(a) * 76, -100 + Math.sin(a) * 76], [-30 + Math.cos(a) * 100, -100 + Math.sin(a) * 100]], 6); } }
  stroke([[0, -230], [0, 210]], 7); stroke([[-150, -10], [150, -10]], 7);
  for (const sd of [-1, 1]) shape(spline([[sd * 160, -250], [sd * 110, -250], [sd * 126, 0], [sd * 100, 230], [sd * 170, 236]]), { fill: P.curtain, lw: 6, shade: () => shade(rect(sd > 0 ? 130 : -180, -260, 50, 500), P.curtainS) });
  shape(rr(-190, -268, 380, 26, 10), { fill: P.trim, lw: 6 });
  pop();
  // wall clock
  push(); translate(560, 360); shape(ell(0, 0, 54, 54, 32), { fill: '#fff3d6', lw: 7 });
  const hm = P === NIGHT ? 23.5 : 8.1, ma = (hm % 1) * TAU - Math.PI / 2 + t * .05, ha = (hm % 12) / 12 * TAU - Math.PI / 2;
  stroke([[0, 0], [Math.cos(ha) * 26, Math.sin(ha) * 26]], 6); stroke([[0, 0], [Math.cos(ma) * 40, Math.sin(ma) * 40]], 5); dot(0, 0, 6); pop();
  // wardrobe (left): top at y 640
  shape(rect(40, 640, 280, 860), { fill: P.wood, lw: 8, shade: () => { shade(rect(240, 620, 100, 900), P.woodS); stroke([[180, 680], [180, 1460]], 6); } });
  shape(rr(26, 620, 308, 34, 8), { fill: P.woodS, lw: 7 });
  for (const kx of [160, 200]) shape(ell(kx, 1060, 9, 12, 10), { fill: P.trim, lw: 5 });
  // bed (centre): headboard, mattress, a heart pillow at night
  shape(rr(360, 1000, 420, 330, 40), { fill: P.wood, lw: 8, shade: () => shade(rect(700, 990, 100, 360), P.woodS) });
  shape(rr(340, 1280, 470, 120, 26), { fill: P.bed, lw: 8, shade: () => { fillOnly(rect(340, 1280, 470, 34), P.sheet, { boil: .3 }); shade(rect(720, 1270, 100, 140), P.bedS); } });
  if (P === NIGHT) shape(spline([[700, 1300], [660, 1250], [680, 1220], [700, 1236], [720, 1220], [740, 1250]]), { fill: '#e8433b', lw: 6 });
  else { shape(spline([[430, 1290], [520, 1260], [600, 1286], [560, 1300]]), { fill: P.sheet, lw: 5 }); stroke(spline([[460, 1300], [520, 1316], [600, 1300]], false), 4); }
  if (messy) { dot(300, 1530, 0); for (const [x, y, c] of [[420, 1540, '#3d6fa8'], [700, 1560, '#e9c46a']]) shape(rr(x - 30, y - 10, 60, 22, 8), { fill: c, lw: 5 }); }
}

// suitcase: origin bottom centre. lid 0 open .. 1 shut, bulge pushes the lid up, stuff 0..1 clothes hanging out
export function suitcase(x, y, s, t, { lid = .8, bulge = 0, stuff = 1, squash = 0 } = {}) {
  push(); translate(x, y); scale(s * (1 + squash * .3), s * (1 - squash * .35));
  shape(rr(-170, -150, 340, 150, 18), { fill: '#7a4a2e', lw: 8, shade: () => { shade(rect(100, -160, 90, 170), '#5c3620'); fillOnly(rect(-170, -96, 340, 14), '#e9c46a', { boil: 0 }); } });
  // clothes squeezing out between body and lid
  if (stuff > 0) for (let k = 0; k < 5; k++) {
    const cx = -130 + k * 64, c = ['#3d6fa8', '#e86a8a', '#f2c94c', '#5f8a4a', '#fffaf0'][k], h = (22 + 18 * hash(k)) * stuff + bulge * 20;
    shape(spline([[cx - 26, -150], [cx - 22, -150 - h], [cx, -150 - h * 1.2], [cx + 24, -150 - h], [cx + 26, -150]]), { fill: c, lw: 5 });
  }
  const open = (1 - lid) * 1.2 + bulge * .12;
  push(); translate(-170, -150 - bulge * 30); rotate(-open);
  shape(rr(0, -40, 340, 44, 16), { fill: '#8f5a38', lw: 8, shade: () => shade(rect(260, -50, 90, 60), '#6b3f2a') });
  shape(rr(140, -66, 60, 26, 10), { fill: '#3a2330', lw: 6 });
  pop();
  pop();
}

// a sock / shoe / rubber duck flying out of the suitcase
export function flyer(kind, x0, y0, t0, t, { vx = 300, vy = -900 } = {}) {
  const lt = t - t0; if (lt < 0 || lt > 1.6) return;
  const x = x0 + vx * lt, y = y0 + vy * lt + 1400 * lt * lt;
  push(); translate(x, y); rotate(lt * 9 * Math.sign(vx));
  if (kind === 'sock') shape(spline([[-10, -40], [12, -40], [12, 10], [34, 20], [30, 36], [-6, 30]]), { fill: '#e86a8a', lw: 5 });
  else if (kind === 'shoe') shape(spline([[-34, 0], [-30, -24], [6, -26], [34, -6], [34, 8], [-34, 8]]), { fill: '#3a2330', lw: 5 });
  else { shape(ell(0, 0, 30, 24, 20), { fill: '#f2c94c', lw: 5 }); shape(ell(18, -22, 16, 16, 14), { fill: '#f2c94c', lw: 5 }); shape(spline([[30, -24], [46, -20], [30, -16]]), { fill: '#ff7a3d', lw: 4 }); dot(20, -26, 3); }
  pop();
}

// small floating hearts (night, lights off)
export function hearts(x, y, t, n = 3) {
  for (let k = 0; k < n; k++) {
    const ph = (t * .45 + k / n) % 1, hx = x + Math.sin(ph * 7 + k * 2) * 40 + (k - 1) * 50, hy = y - ph * 260;
    push(); translate(hx, hy); scale(.8 + ph * .5);
    shape(spline([[0, 16], [-22, -4], [-14, -18], [0, -10], [14, -18], [22, -4]]), { fill: '#ff3d8b', lw: 4, alpha: 1 - ph });
    pop();
  }
}
