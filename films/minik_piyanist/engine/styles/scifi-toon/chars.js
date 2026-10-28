// scifi-toon · chars.js — face and body parts shared by every cast member.
// eye, mouth, hand, sweat: adapted from Lemo-Opuscar styles/scifi-toon/demo/chars.js (MIT, LemoLab).
// Convention: local coordinates, origin at the feet, y down, face = 1 looks right (3/4 view), -1 mirrors.
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, S, tx, zoom } from './toon.js';

export const PAL = { white: '#ffffff', mouthIn: '#4a1a2a', tongue: '#e8637a', sweat: '#bfe9ff', skinV: '#f2c9a0' };

// —— face parts ——
// Eyes: big white eye + small pupil; lid = fraction covered by the upper eyelid; closed = contented closed eye (arc)
export function eye(cx, cy, rx, ry, { lid = 0, look = [0, 0], pupil = 4.5, skin = PAL.skinV, closed = false, lw = 6, jitter = 0, lower = 0 } = {}) {
  if (closed) { stroke(arc(cx, cy + ry * .15, rx * .8, ry * .45, Math.PI * .1, Math.PI * .9, 14), lw); return; }
  const E = ell(cx, cy, rx, ry, 36);
  shape(E, {
    fill: PAL.white, lw, shade: () => {
      // the pupil stays inside the white: below the upper lid and above the lower lid, so it never vanishes
      const top = cy - ry + Math.max(0, lid) * 2 * ry + pupil * 1.6 + 2, bot = cy + ry - Math.max(0, lower) * 2 * ry - pupil * 1.6 - 2;
      const px = cx + clamp(look[0] * rx * .55 + jitter, -rx * .62, rx * .62), py = top < bot ? clamp(cy + look[1] * ry * .5, top, bot) : (top + bot) / 2;
      dot(px, py, pupil);
      if (lid > 0) {   // upper eyelid
        const yl = cy - ry + lid * 2 * ry;
        fillOnly([[cx - rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, yl], [cx - rx * 1.3, yl + ry * .08]], skin, { boil: .5 });
        stroke([[cx - rx * 1.2, yl + ry * .08], [cx + rx * 1.2, yl]], lw);
      }
      if (lower > 0) { const yb = cy + ry - lower * 2 * ry; fillOnly([[cx - rx * 1.3, yb], [cx + rx * 1.3, yb], [cx + rx * 1.3, cy + ry * 1.4], [cx - rx * 1.3, cy + ry * 1.4]], skin, { boil: .5 }); stroke([[cx - rx * 1.2, yb], [cx + rx * 1.2, yb]], lw * .8); }
    }
  });
}
// Mouth: o open 0..1, w width multiplier, sm mouth corners (+ smile, − frown), skew lopsided mouth
export function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, skew = 0, lw = 6, teeth = true, tongue = true } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k + skew * k], rc = [cx + hw, cy - sm * k - skew * k];
  if (o < .07) {
    stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw);
    stroke([[lc[0] - 4, lc[1] - 5 * Math.sign(sm || 1)], [lc[0] + 3, lc[1] + 3]], lw * .7);
    return;
  }
  const h = o * mw * .62;
  const up = quad(lc, [cx, cy - h * .25 + sm * k * .4], rc, 12), dn = quad(rc, [cx, cy + h + sm * k * .6], lc, 14);
  const P = [...up, ...dn];
  shape(P, {
    fill: PAL.mouthIn, lw, shade: () => {
      if (teeth && o > .22) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .32 + (cy - Math.min(lc[1], rc[1])) * .2 + 6), PAL.white, { boil: .3 });
      if (tongue) fillOnly(ell(cx + hw * .15, cy + h * .95, hw * .6, h * .45, 20), PAL.tongue, { boil: .3 });
    }
  });
}
export function hand(x, y, ang, r = 21, col = PAL.skinV, { fist = false, lw = 6 } = {}) {
  push(); translate(x, y); rotate(ang);
  const pts = fist ? spline([[-r * .6, -r * .8], [r * .7, -r * .9], [r * 1.1, -r * .1], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]])
    : spline([[-r * .5, -r * .85], [r * .5, -r * 1.05], [r * 1.35, -r * .75], [r * 1.05, -r * .3], [r * 1.5, -r * .1], [r * 1.1, r * .3], [r * 1.35, r * .7], [r * .6, r * .95], [-r * .6, r * .8], [-r * .95, 0]]);
  shape(pts, { fill: col, lw });
  stroke([[r * .2, -r * .15], [r * .75, -r * .45]], lw * .6);   // thumb crease
  pop();
}
export const sweat = (x, y, s = 1) => shape(spline([[x, y - 16 * s], [x + 9 * s, y + 4 * s], [x, y + 12 * s], [x - 9 * s, y + 4 * s]]), { fill: PAL.sweat, lw: 5 });

// —— extra parts ——
// brow: a thick tapered stroke; ang > 0 raises the inner end (worry), < 0 lowers it (anger)
export function brow(cx, cy, len, ang = 0, { lw = 9, col = INK } = {}) {
  const a = [cx - len / 2, cy + ang * len * .35], b = [cx + len / 2, cy - ang * len * .35];
  shape(noodle(a, b, -len * .08, lw * 1.2, lw * .7), { fill: col, lw: 3 });
}
// nose: a round bulb whose centre (x, y) sits below the eyes, tip toward the facing side (3/4 view);
// the short bridge line runs up toward the eyes, so the nose reads as part of the face, not stuck on it
export function nose(x, y, s = 1, { fill, lw = 6 } = {}) {
  shape(spline([[x - 10 * s, y - 16 * s], [x + 8 * s, y - 18 * s], [x + 20 * s, y - 4 * s], [x + 16 * s, y + 12 * s], [x - 2 * s, y + 16 * s], [x - 16 * s, y + 6 * s]]), { fill, lw });
  stroke([[x - 4 * s, y - 16 * s], [x - 3 * s, y - 24 * s]], lw * .6);
}
// mustache: two droopy wings meeting under the nose; curl 0..1 lifts the ends
export function mustache(x, y, w, { col = '#2a1c1c', curl = 0, wob = 0, lw = 5 } = {}) {
  for (const sd of [-1, 1]) {
    const tip = [x + sd * w, y + 10 - curl * 26 + wob * sd];
    shape(spline([[x, y - 8], [x + sd * w * .5, y - 12], tip, [x + sd * w * .55, y + 14], [x + sd * 4, y + 12]]), { fill: col, lw });
  }
}
// leg on twos: simple tube with a shoe
export function leg(a, b, w, col, shoe, face = 1, { lw = 7 } = {}) {
  shape(noodle(a, b, 4 * face, w, w * .9), { fill: col, lw });
  shape(spline([[b[0] - 14 * face, b[1] - 10], [b[0] + 30 * face, b[1] - 14], [b[0] + 40 * face, b[1] + 4], [b[0] - 16 * face, b[1] + 6]]), { fill: shoe, lw });
}
export function arm(a, b, bend, w, col, { lw = 7 } = {}) { shape(noodle(a, b, bend, w, w * .8), { fill: col, lw }); }
// shade: a hard-edged darker shape on the side away from the light (light comes from the upper left)
export const shade = (pts, col) => fillOnly(pts, col, { boil: .3 });
// a 12 fps nervous jitter offset
export const jit = (t, amp, seed = 0) => { const k = Math.floor(t * 12); return [(hash(k * 1.7 + seed) - .5) * 2 * amp, (hash(k * 2.3 + seed + 9) - .5) * 2 * amp]; };
