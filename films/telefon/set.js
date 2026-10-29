// Telefon — a tiny phone repair shop, the old man's phone on a stand, a paper-plane-sized airplane. Film-only props.
import { clamp, lerp, hash, TAU, ss } from '/core/lib.js';
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, quad, dot, text, bands } from './engine/styles/scifi-toon/toon.js';
import { shade } from './engine/styles/scifi-toon/chars.js';

export const SHOP = { wall: '#d98a4a', wallS: '#c27838', board: '#e8d3a8', boardS: '#cdb588', wood: '#5a3b5e', woodS: '#432a46', top: '#7a5480',
  floor: '#3a3340', sign: '#fff3d6', phoneA: '#3d6fa8', phoneB: '#e86a8a', phoneC: '#5f8a4a' };

export function shop(t, { sad = 0 } = {}) {
  const P = SHOP;
  bands([P.wallS, P.wall, P.wall], -500, 1400, -1200, 2400);
  // pegboard with broken phones
  shape(rect(80, 380, 920, 560), { fill: P.board, lw: 7, shade: () => { for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) dot(120 + i * 100, 420 + j * 90, 4, P.boardS); } });
  for (let k = 0; k < 7; k++) {
    const x = 150 + k * 125, y = 470 + (k % 2) * 180, c = [P.phoneA, P.phoneB, P.phoneC][k % 3];
    push(); translate(x, y); rotate((hash(k) - .5) * .3);
    shape(rr(-34, -60, 68, 120, 12), { fill: '#1b1422', lw: 6, shade: () => fillOnly(rr(-28, -52, 56, 104, 8), c, { boil: .3 }) });
    stroke([[-20, -40], [4, -6], [-10, 10], [16, 40]], 4, { line: '#fff3d6' });   // crack
    pop();
  }
  // painted sign
  push(); translate(540, 250); rotate(-.03);
  shape(rr(-230, -66, 460, 124, 18), { fill: P.sign, lw: 7 });
  text('TAMİR', 0, 2, { font: '800 96px "Baloo 2"', fill: '#a23a4a' });
  pop();
  shape(rect(-1200, 1560, 3600, 700), { fill: P.floor, lw: 7 });
  if (sad > 0) fillOnly(rect(-1200, -600, 3600, 3000), '#2a2f55', { boil: 0, alpha: sad * .45 });   // the sad-edit mood
}
export function counter(t) {
  const P = SHOP;
  shape(rect(-600, 1250, 2400, 44), { fill: P.top, lw: 7 });
  shape(rect(-600, 1294, 2400, 900), { fill: P.wood, lw: 7, shade: () => { for (let k = 0; k < 14; k++) stroke([[-560 + k * 170, 1320], [-560 + k * 170, 2100]], 5); } });
}

// the phone on its stand (origin: bottom of the stand). screen: 'home' | 'music' | 'plane' | 'calls' | 'off'; buzz 0..1; calls: badge number
export function phone(x, y, s, t, { screen = 'off', buzz = 0, calls = 0, tap = 0 } = {}) {
  const k = Math.floor(t * 24), bx = buzz ? (hash(k * 1.7) - .5) * 14 * buzz : 0, by = buzz ? (hash(k * 2.9) - .5) * 8 * buzz : 0;
  push(); translate(x + bx, y + by); scale(s); rotate(buzz ? (hash(k) - .5) * .12 * buzz : 0);
  shape(spline([[-50, 0], [50, 0], [26, -40], [-26, -40]]), { fill: '#5a5560', lw: 6 });                  // stand
  shape(rr(-62, -250, 124, 230, 18), { fill: '#1b1422', lw: 7 });
  const sc = screen === 'calls' ? '#5f8a4a' : screen === 'off' ? '#2a2633' : '#3d6fa8';   // 'home' uses the blue too
  fillOnly(rr(-52, -238, 104, 196, 10), sc, { boil: .3 });
  if (screen === 'music') for (let i = 0; i < 3; i++) { const ph = (t * .9 + i / 3) % 1; push(); translate(-24 + i * 24, -110 - ph * 60); scale(.8);
    shape(ell(0, 0, 12, 9, 12), { fill: '#fff3d6', lw: 4 }); stroke([[10, 0], [10, -36]], 5, { line: '#fff3d6' }); pop(); }
  if (screen === 'home') for (let i = 0; i < 9; i++) shape(rr(-40 + (i % 3) * 30, -220 + Math.floor(i / 3) * 34, 22, 22, 6), { fill: ['#e9c46a', '#e86a8a', '#5f8a4a', '#fff3d6'][i % 4], lw: 3 });   // app icons: it works
  if (screen === 'plane') { push(); translate(0, -140); rotate(-.6); planeShape(1.1, '#fff3d6'); pop();
    shape(rr(-34, -76, 68, 30, 15), { fill: '#e9c46a', lw: 5 }); dot(tap > .5 ? 18 : -18, -61, 10, '#fff3d6'); }   // the switch
  if (screen === 'calls') { shape(spline([[-26, -150], [-12, -164], [-4, -150], [-14, -138], [4, -116], [18, -126], [30, -116], [16, -102], [-20, -128]]), { fill: '#fff3d6', lw: 5 });
    if (calls > 0) { shape(ell(36, -214, 26, 26, 20), { fill: '#e8433b', lw: 5 }); text(String(calls), 36, -212, { font: '800 30px "Baloo 2"', fill: '#fff' }); } }
  if (buzz) for (const sd of [-1, 1]) { stroke(arc(sd * 92, -140, 20, 40, sd > 0 ? -.8 : Math.PI - .8, sd > 0 ? .8 : Math.PI + .8, 8), 5); stroke(arc(sd * 112, -140, 26, 54, sd > 0 ? -.8 : Math.PI - .8, sd > 0 ? .8 : Math.PI + .8, 8), 5); }
  pop();
}
function planeShape(s, col) {
  push(); scale(s);
  shape(spline([[-40, 0], [30, -6], [44, 0], [30, 6]]), { fill: col, lw: 4 });
  shape(spline([[0, -2], [-14, -34], [-4, -34], [16, -2]]), { fill: col, lw: 4 });
  shape(spline([[0, 2], [-14, 34], [-4, 34], [16, 2]]), { fill: col, lw: 4 });
  shape(spline([[-34, -2], [-44, -16], [-38, -16], [-26, -2]]), { fill: col, lw: 4 });
  pop();
}
// the airplane leaving the phone: grows, banks, flies off to the upper right with a dotted trail
export function plane(x0, y0, t0, t) {
  const lt = t - t0; if (lt < 0 || lt > 1.6) return;
  const k = ss(clamp(lt / 1.4)), x = lerp(x0, x0 + 900, k), y = lerp(y0, y0 - 900, k * k) - Math.sin(k * Math.PI) * 120;
  for (let i = 1; i < 8; i++) { const kk = Math.max(0, k - i * .04); dot(lerp(x0, x0 + 900, kk), lerp(y0, y0 - 900, kk * kk) - Math.sin(kk * Math.PI) * 120, 5, '#fff3d6'); }
  push(); translate(x, y); rotate(-.6 + Math.sin(lt * 6) * .15); planeShape(lerp(.6, 2.2, k), '#f4f1ea'); pop();
}
// sad-edit rain over one spot (stepped on twos)
export function rain(x, y, w, h, t) {
  const tq = Math.floor(t * 12) / 12;
  for (let i = 0; i < 24; i++) { const px = x + hash(i * 3.3) * w, py = y + ((hash(i * 7.1) + tq * 1.6) % 1) * h; stroke([[px, py], [px - 6, py + 34]], 4, { line: '#9fc4e8' }); }
}

// the apprentice's bluetooth speaker: pulses on the beat while on, notes rise from it
export function speaker(x, y, s, t, { on = true } = {}) {
  const beat = on ? Math.abs(Math.sin(t * Math.PI * 1.3)) : 0;
  push(); translate(x, y); scale(s * (1 + beat * .06), s * (1 - beat * .04));
  shape(rr(-80, -110, 160, 110, 30), { fill: '#3a3340', lw: 7, shade: () => shade(rect(40, -120, 60, 130), '#2a2430') });
  for (const sx of [-40, 40]) { shape(ell(sx, -55, 28, 28, 24), { fill: '#1b1422', lw: 5 }); shape(ell(sx, -55, 12 + beat * 5, 12 + beat * 5, 16), { fill: '#5a5560', lw: 4 }); }
  dot(0, -96, 6, on ? '#5f8a4a' : '#5a2a2a');
  pop();
  if (on) for (let k = 0; k < 3; k++) {
    const ph = (t * .5 + k / 3) % 1, nx = x - 20 + Math.sin(ph * 8 + k) * 40 - ph * 120, ny = y - 140 - ph * 380;
    push(); translate(nx, ny); rotate(Math.sin(ph * 6) * .3);
    shape(ell(0, 0, 16, 12, 14), { fill: '#1b1422', lw: 4, alpha: Math.min(1, ph * 4) * (1 - ph) });
    stroke([[14, 0], [14, -46], [32, -34]], 6, { alpha: Math.min(1, ph * 4) * (1 - ph) });
    pop();
  }
}
