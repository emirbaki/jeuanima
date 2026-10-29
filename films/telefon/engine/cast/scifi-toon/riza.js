// Cast · RIZA AMCA — a grumpy old man who misses his kids. Short and bent, a flat cap (kasket), thick round glasses,
// a huge white mustache, a brown cardigan with leather elbow patches, a wooden cane he bangs when angry.
// P: {x, y, s, face, t, lean, headTilt, lid, look, o, mw, sm, brow, blink, jit, sq, handR (cane hand), handL, bang (0..1 cane lift), tear}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, mustache, leg, arm, shade, jit, sweat } from '../../styles/scifi-toon/chars.js';
import { lerp } from '/core/lib.js';

export const RIZA = { label: 'AMCA', color: '#8a5a3c', skin: '#e2b08a', skinS: '#c08c66', cardigan: '#8a5a3c', cardiganS: '#6b432b',
  shirt: '#e8e0c8', pants: '#5a5560', shoe: '#2b2230', cap: '#5a5a4e', capS: '#43433a', hair: '#f4f1ea', cane: '#7a4a2e' };
const C = RIZA;

export function riza(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, lean = 0, sq = 0 } = P;
  const [jx, jy] = P.jit ? jit(t, P.jit, 23) : [0, 0];
  push(); translate(x + jx, y + jy); scale(s * face * (1 + sq * .5), s * (1 - sq));
  const hipY = -200, shY = -370;
  leg([-28, hipY], [-34, -14], 46, C.pants, C.shoe, 1); leg([26, hipY], [34, -12], 46, C.pants, C.shoe, 1);
  const bang = P.bang || 0;
  const hR = P.handR || [100, hipY + 20 - bang * 60];
  const stoop = .12 + lean * .15;
  push(); translate(0, hipY); rotate(stoop); translate(0, -hipY);   // a slight stoop
  const hL = P.handL || [-80, hipY + 10];
  // far arm (+x side, behind the body): the character faces +x in three-quarter view
  arm([60, shY + 26], hR, 14, 40, C.cardiganS);
  shape(spline([[-74, hipY + 20], [-84, hipY - 70], [-70, shY + 14], [0, shY - 8], [70, shY + 14], [82, hipY - 70], [72, hipY + 20], [0, hipY + 28]]), { fill: C.cardigan, shade: () => {
    fillOnly([[-18, shY - 8], [18, shY - 8], [6, hipY - 40], [-6, hipY - 40]], C.shirt, { boil: .4 });
    shade([[36, shY - 20], [100, shY - 20], [100, hipY + 30], [46, hipY + 30]], C.cardiganS);
  } });
  for (let k = 0; k < 4; k++) dot(10, shY + 40 + k * 34, 6, '#e9c46a');
  // the cane, in front of him: a thick wooden shaft to the floor, a crook handle under the front hand (lifted by bang)
  const fl = [hR[0] + 18, -4 - bang * 60], c = Math.cos(-stoop), sn = Math.sin(-stoop);
  const flG = [c * fl[0] - sn * (fl[1] - hipY), sn * fl[0] + c * (fl[1] - hipY) + hipY];   // the floor point in the stooped frame
  shape(noodle([hR[0] + 2, hR[1] + 6], flG, 0, 16, 13), { fill: C.cane, lw: 6, shade: () => shade(rect(hR[0] + 6, hR[1], 20, 400), '#5a331c') });
  shape(noodle([hR[0] - 4, hR[1] + 4], [hR[0] + 10, hR[1] - 30], 8, 16, 16), { fill: C.cane, lw: 6 });
  shape(noodle([hR[0] + 10, hR[1] - 30], [hR[0] + 38, hR[1] - 10], -14, 16, 13), { fill: C.cane, lw: 6 });
  shape(rr(flG[0] - 9, flG[1] - 14, 18, 16, 5), { fill: '#2b2230', lw: 5 });   // rubber foot
  hand(hR[0], hR[1], -.2, 21, C.skin, { fist: true });   // the far hand grips the cane in front of him
  // near arm (-x side, in front of the body)
  arm([-62, shY + 26], hL, 12, 40, C.cardigan); hand(hL[0], hL[1], 1.4, 20, C.skin);
  // head
  push(); translate(10, shY - 6); rotate(P.headTilt || 0);
  const hc = [6, -86];
  shape(ell(hc[0] - 58, hc[1] + 10, 15, 24, 16), { fill: C.skin, lw: 6 });
  shape(ell(hc[0], hc[1], 62, 70, 40), { fill: C.skin, shade: () => shade(ell(hc[0] - 54, hc[1] + 10, 30, 80, 20), C.skinS) });
  for (const sd of [-1, 1]) shape(spline([[hc[0] + sd * 60, hc[1] - 4], [hc[0] + sd * 66, hc[1] + 30], [hc[0] + sd * 48, hc[1] + 24]]), { fill: C.hair, lw: 5 });
  for (let k = 0; k < 3; k++) stroke(arc(hc[0] + 8, hc[1] - 34 + k * 8, 26 - k * 3, 5, Math.PI * 1.15, Math.PI * 1.85, 8), 3.5);   // forehead lines
  // flat cap
  shape(spline([[hc[0] - 66, hc[1] - 34], [hc[0] - 50, hc[1] - 82], [hc[0] + 20, hc[1] - 92], [hc[0] + 70, hc[1] - 60], [hc[0] + 96, hc[1] - 36], [hc[0] + 40, hc[1] - 30]]), { fill: C.cap, shade: () => shade(rect(hc[0] + 30, hc[1] - 100, 80, 70), C.capS) });
  // round glasses: the eyes, then a light blue lens tint, then thin dark frames, a bridge over the nose, an arm to the ear
  const lk = P.look || [0, 0], lid = P.lid ?? .35, LX = [hc[0] - 4, hc[0] + 36], LY = hc[1] - 6, LR = 19;
  for (const ex of LX) { if (P.blink) stroke([[ex - 11, LY], [ex + 11, LY]], 6); else eye(ex, LY, 13, 15, { lid, look: lk, skin: C.skin, pupil: 4.5 }); }
  for (const ex of LX) { fillOnly(ell(ex, LY, LR, LR, 24), 'rgba(190,226,242,.38)', { boil: .2 }); fillOnly(ell(ex - 7, LY - 8, 4, 7, 10), 'rgba(255,255,255,.75)', { boil: 0 }); }
  for (const ex of LX) shape(ell(ex, LY, LR, LR, 26), { closed: true, lw: 5, line: '#3a2a20' });
  stroke(quad([LX[0] + LR, LY - 4], [(LX[0] + LX[1]) / 2, LY - 12], [LX[1] - LR, LY - 4], 6), 5, { line: '#3a2a20' });
  stroke([[LX[0] - LR, LY - 2], [hc[0] - 56, hc[1] + 2]], 4, { line: '#3a2a20' });
  const b = P.brow ?? 0;
  brow(hc[0] - 2, hc[1] - 40 - b * 8, 34, b * .5, { lw: 9, col: C.hair }); brow(hc[0] + 38, hc[1] - 42 - b * 8, 32, -b * .5, { lw: 9, col: C.hair });
  nose(hc[0] + 22, hc[1] + 26, 1.0, { fill: C.skin });
  mouth(hc[0] + 18, hc[1] + 56, 38, { o: P.o || 0, w: .85 + (P.mw ?? .5) * .3, sm: P.sm ?? -.5, teeth: false });
  mustache(hc[0] + 20, hc[1] + 44, 72, { col: C.hair, curl: .1, wob: P.o ? Math.sin(t * 30) * 3 : 0, lw: 5 });
  if (P.tear) { const ph = (t * .8) % 1; shape(spline([[hc[0] - 12, hc[1] + 20 + ph * 50], [hc[0] - 4, hc[1] + 36 + ph * 50], [hc[0] - 12, hc[1] + 44 + ph * 50], [hc[0] - 20, hc[1] + 36 + ph * 50]]), { fill: '#bfe9ff', lw: 4 }); }
  pop();
  pop(); pop();
}
