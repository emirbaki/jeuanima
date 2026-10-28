// Cast · NAİL — the deadpan one. Tall and thin, long egg face, heavy lids, stubble, one hair tuft,
// a mustard puffer jacket with far too many pockets (his absurd costume idea: anything can come out of a pocket).
// P: {x, y, s, face, t, sit, lean, headTilt, lid, look, o, mw, sm, brow, blink, jit, sq, handR, handL, holdR, holdL, pocketOut}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, leg, arm, shade, jit } from '../../styles/scifi-toon/chars.js';

export const NAIL = { label: 'ADAM', color: '#d99a2b', skin: '#e8b48a', skinS: '#c98f66', jacket: '#e0a93b', jacketS: '#b37f22',
  pants: '#4a4f5c', pantsS: '#353945', shoe: '#2b2230', hair: '#3b2a22', stub: '#b98a68', pocket: '#e0a93b' };
const C = NAIL;

export function nail(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, sit = 0, lean = 0, sq = 0 } = P;
  const [jx, jy] = P.jit ? jit(t, P.jit, 3) : [0, 0];
  push(); translate(x + jx, y + jy); scale(s * face * (1 + sq * .5), s * (1 - sq));
  const hipY = sit ? -205 : -235, shY = hipY - 200;
  // legs
  if (sit) {
    leg([-30, hipY], [-10 + 40, -20], 54, C.pants, C.shoe, 1); leg([25, hipY], [70, -14], 54, C.pants, C.shoe, 1);
  } else {
    leg([-35, hipY], [-40, -16], 54, C.pants, C.shoe, 1); leg([30, hipY], [36, -14], 54, C.pants, C.shoe, 1);
  }
  push(); translate(0, hipY); rotate(lean * .15); translate(0, -hipY);
  const shB = [-62, shY + 18], shF = [56, shY + 18];
  const hR = P.handR || [78, hipY - 20], hL = P.handL || [-80, hipY - 18];
  // back arm (puffy sleeve)
  arm(shB, hL, -14, 52, C.jacketS); hand(hL[0], hL[1], 1.4, 22, C.skin);
  if (P.holdL) P.holdL(hL);
  // puffer torso
  const body = spline([[-88, hipY + 6], [-98, hipY - 90], [-78, shY + 4], [-20, shY - 14], [48, shY - 10], [86, shY + 22], [94, hipY - 80], [82, hipY + 8], [0, hipY + 18]]);
  shape(body, { fill: C.jacket, shade: () => {
    shade([[30, shY - 40], [120, shY - 40], [120, hipY + 40], [40, hipY + 40]], C.jacketS);
    for (let k = 1; k < 5; k++) stroke(quad([-96, shY + k * 40], [0, shY + k * 40 + 12], [96, shY + k * 40], 10), 4);
  } });
  stroke([[4, shY - 8], [8, hipY + 14]], 5);                                        // zip
  for (const [px, py] of [[-62, hipY - 64], [26, hipY - 62], [-58, shY + 52], [32, shY + 54]]) {   // pockets
    const out = P.pocketOut && Math.abs(px - P.pocketOut[0]) < 1 && Math.abs(py - P.pocketOut[1]) < 1;
    shape(rr(px, py, 40, out ? 46 : 32, 6), { fill: out ? '#f3e6c8' : C.pocket, lw: 5 });
    stroke([[px + 2, py + 9], [px + 38, py + 9]], 4);
  }
  shape(spline([[-34, shY - 4], [0, shY - 30], [36, shY - 6], [0, shY + 12]]), { fill: C.jacketS, lw: 6 });   // collar
  // head
  push(); translate(8, shY - 18); rotate(P.headTilt || 0);
  shape(noodle([0, 6], [2, -40], 0, 34, 34), { fill: C.skin, lw: 6 });                 // neck
  const hc = [6, -125];
  shape(ell(hc[0] - 56, hc[1] + 4, 16, 24, 18), { fill: C.skin, lw: 6 });             // ear
  const head = spline([[hc[0] - 50, hc[1] - 70], [hc[0] + 20, hc[1] - 98], [hc[0] + 62, hc[1] - 40], [hc[0] + 64, hc[1] + 50], [hc[0] + 30, hc[1] + 96], [hc[0] - 30, hc[1] + 90], [hc[0] - 60, hc[1] + 20]]);
  shape(head, { fill: C.skin, shade: () => {
    shade(spline([[hc[0] - 70, hc[1] - 60], [hc[0] - 34, hc[1] - 70], [hc[0] - 40, hc[1] + 70], [hc[0] - 70, hc[1] + 90]]), C.skinS);
    for (let k = 0; k < 18; k++) dot(hc[0] - 20 + hash2(k) * 80, hc[1] + 44 + hash2(k + 40) * 44, 2.4, C.stub);   // stubble
  } });
  stroke(spline([[hc[0] - 10, hc[1] - 92], [hc[0] - 4, hc[1] - 118], [hc[0] + 12, hc[1] - 126]], false), 6);   // tuft
  stroke(spline([[hc[0] + 2, hc[1] - 94], [hc[0] + 14, hc[1] - 114], [hc[0] + 28, hc[1] - 116]], false), 5);
  const lid = P.blink ? 1 : (P.lid ?? .55), lk = P.look || [0, 0];
  if (P.blink) { stroke([[hc[0] - 8, hc[1] - 18], [hc[0] + 24, hc[1] - 18]], 6); stroke([[hc[0] + 30, hc[1] - 20], [hc[0] + 60, hc[1] - 20]], 6); }
  else { eye(hc[0] + 8, hc[1] - 18, 22, 26, { lid, look: lk, skin: C.skin, lower: .12 }); eye(hc[0] + 46, hc[1] - 20, 20, 25, { lid, look: lk, skin: C.skin, lower: .12 }); }
  stroke(arc(hc[0] + 8, hc[1] + 12, 16, 6, .2, 2.9, 8), 3.5); stroke(arc(hc[0] + 46, hc[1] + 10, 14, 6, .2, 2.9, 8), 3.5);   // eye bags
  const b = P.brow ?? 0;
  brow(hc[0] + 6, hc[1] - 56 - b * 8, 40, b * .4); brow(hc[0] + 48, hc[1] - 58 - b * 10, 36, -b * .4);
  nose(hc[0] + 42, hc[1] + 26, 1.0, { fill: C.skin });
  mouth(hc[0] + 30, hc[1] + 54, 46, { o: P.o || 0, w: .85 + (P.mw ?? .5) * .3, sm: P.sm ?? -.3, skew: .25 });
  pop();
  // front arm
  arm(shF, hR, 12, 52, C.jacket); hand(hR[0], hR[1], -.3, 22, C.skin);
  if (P.holdR) P.holdR(hR);
  pop(); pop();
}
const hash2 = k => { const n = Math.sin(k * 91.7 + 13.1) * 43758.5; return n - Math.floor(n); };
