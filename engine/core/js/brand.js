// JeuAnima · brand.js — channel logo and end card, drawn with the active style pack's toon engine.
// The logo: a little retro TV with a swirling portal on its screen and the name under it.
import { clamp, back, TAU } from '/core/lib.js';
import { W, H, INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, rr, rect, spline, text, dot, bands, frame, S } from '../../styles/scifi-toon/toon.js';
import { portal } from '../../styles/scifi-toon/portal.js';
import { shot, reportText, END_CARD, endStart } from './film.js';
import { TL } from './time.js';

export const BRAND = { name: 'JeuAnima', ink: INK, cream: '#fff3d6', pink: '#ff3d8b', violet: '#6b3fa0', violetD: '#4a2a78' };

export function logo(x, y, s, t) {
  push(); translate(x, y); scale(s);
  stroke([[-40, -230], [-90, -320]], 8); stroke([[40, -230], [96, -310]], 8);              // antennas
  dot(-90, -320, 12, BRAND.pink); dot(96, -310, 12, '#ffb347');
  shape(rr(-210, -240, 420, 300, 46), { fill: '#e0a93b', lw: 9, shade: () => fillOnly(rr(120, -260, 120, 340, 30), '#b37f22', { boil: .3 }) });
  shape(rr(-170, -205, 280, 225, 34), { fill: '#1b1422', lw: 8 });
  push(); translate(-30, -92); portal(0, 0, 92, t, { open: 1, sx: 1.2 }); pop();
  for (const [ky, c] of [[-170, '#a23a4a'], [-110, '#2f5d62']]) shape(ell(160, ky, 20, 20, 16), { fill: c, lw: 6 });
  for (const lx of [-150, 150]) stroke([[lx, 60], [lx * 1.15, 110]], 9);                   // legs
  for (const [dx, dy, c] of [[8, 10, BRAND.pink], [0, 0, BRAND.cream]]) text(BRAND.name, dx, 200 + dy, { font: '800 128px "Baloo 2"', fill: c, outlineW: 24, outlineCol: INK });
  text(BRAND.name, 0, 200, { font: '800 128px "Baloo 2"', fill: BRAND.cream });
  pop();
}

// registers the end card shot: from endStart() (voice end + HOLD) to DUR
export function endCard({ follow = 'end' } = {}) {
  const a = endStart(), b = a + END_CARD + 1;
  shot(a, b, (lt, t) => {
    frame(t);
    bands([BRAND.violetD, BRAND.violet], -100, H + 100, -100, W + 100);
    const k = Math.floor(lt * 12), sc = k < 1 ? .5 : k < 2 ? 1.12 : k < 3 ? .96 : 1;
    logo(W / 2, 880, 1.25 * sc, t);
    reportText('logo', BRAND.name, W / 2 - 330, 880 + 150, W / 2 + 330, 880 + 330);
    if (follow === 'end' && lt > .35) {
      const k2 = Math.floor((lt - .35) * 12), s2 = k2 < 1 ? .5 : k2 < 2 ? 1.15 : 1;
      push(); translate(W / 2, 1290); scale(s2); rotate(-.05);
      shape(rr(-230, -62, 460, 124, 30), { fill: BRAND.pink, lw: 8 });
      text('Takip et!', 0, 4, { font: '800 84px "Baloo 2"', fill: BRAND.cream, outlineW: 14, outlineCol: INK });
      text('Takip et!', 0, 4, { font: '800 84px "Baloo 2"', fill: BRAND.cream });
      pop();
      reportText('follow', 'Takip et!', W / 2 - 230, 1228, W / 2 + 230, 1352);
    }
  });
}
