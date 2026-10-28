// scifi-toon · portal.js — the travel device's glow: the only thing in a film that glows.
// JeuAnima portal colour: orange → pink with a pale core (never acid green). Opens with a gentle overshoot.
import { clamp, lerp, hash, TAU, back } from '/core/lib.js';
import { g, W, H, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, dot, screenRect } from './toon.js';
import { registerSeam } from '../../core/js/film.js';

export const PORTAL = { rim: '#ff3d8b', arm: '#ff7a3d', arm2: '#ffb347', core: '#ffe3b0', wash: '#6b3fa0' };

export function portal(cx, cy, r, t, { open = 1, sx = .78, spin = 1 } = {}) {
  if (open <= 0) return;
  const o = back(clamp(open), .3), R = r * o;
  push(); translate(cx, cy); scale(sx, 1);
  for (const [k, a] of [[1.35, .14], [1.18, .2]]) fillOnly(ell(0, 0, R * k, R * k, 40), `rgba(255,122,61,${a})`, { boil: 0 });
  const rim = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, w = 1 + .07 * Math.sin(a * 5 + t * 3) + .04 * Math.sin(a * 9 - t * 4); rim.push([Math.cos(a) * R * w, Math.sin(a) * R * w]); }
  shape(spline(rim), { fill: PORTAL.rim, shade: () => {
    for (let k = 0; k < 4; k++) {
      const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30, a = u * 4.2 + k * TAU / 4 + t * 2.6 * spin; pts.push([Math.cos(a) * R * (1 - u * .85), Math.sin(a) * R * (1 - u * .85)]); }
      stroke(pts, 26 * o, { line: k % 2 ? PORTAL.arm : PORTAL.arm2, boil: .4 });
    }
    fillOnly(ell(0, 0, R * .32, R * .32, 30), PORTAL.core, { boil: .5 });
  } });
  for (let k = 0; k < 6; k++) { const a = t * 1.7 + k * TAU / 6, rr_ = R * (1.2 + .1 * Math.sin(t * 5 + k)); dot(Math.cos(a) * rr_, Math.sin(a) * rr_, 7 * o, k % 2 ? '#fff' : PORTAL.core); }
  pop();
}
// full-screen swirl wipe: k -1 → 0 (covered) → 1
export function portalWipe(k, t) {
  const c = 1 - Math.abs(k), R = Math.hypot(W, H) * .62 * c;
  g.setTransform(1, 0, 0, 1, 0, 0);
  portal(W / 2, H / 2, R, t * 3, { open: 1, sx: 1, spin: 3 });
  if (c > .85) screenRect(PORTAL.core, (c - .85) / .15);
}
registerSeam('portal', portalWipe);
