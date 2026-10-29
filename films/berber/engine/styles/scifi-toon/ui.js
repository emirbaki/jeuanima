// scifi-toon · ui.js — screen-space pieces in the style: the subtitle speaker pill (boiling outline).
import { push, pop, setM, shape, rr, g, W, H } from './toon.js';
import { registerSeam } from '../../core/js/film.js';
import { hash } from '/core/lib.js';
export function pill(x, y, w, h, col) { push(); setM([1, 0, 0, 1, 0, 0]); shape(rr(x, y, w, h, h / 2), { fill: col, lw: 6 }); pop(); }

// whip: a fast horizontal smear across the cut (speed streaks, hard-edged, flat colour)
export function whipWipe(k, t) {
  const a = 1 - Math.abs(k), dir = k < 0 ? 1 : -1;
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 26; i++) {
    const y = hash(i * 3.1) * H, h = 20 + hash(i * 7.7) * 90, len = W * (.6 + hash(i * 1.9)) * a;
    const x = (hash(i * 5.3) * W + dir * k * W * 1.5) % W;
    g.globalAlpha = .85 * a; g.fillStyle = ['#fff3d6', '#1b1422', '#e0b24a', '#2f5d62'][i % 4];
    g.fillRect(x - len / 2, y, len, h);
  }
  g.globalAlpha = 1;
}
registerSeam('whip', whipWipe);
