// Cast · CEMİL — the nervous one. Short and round, bald top with side hair, huge black mustache,
// red bow tie, burgundy waistcoat, a bar towel over one shoulder. Sweats easily.
// P: {x, y, s, face, t, lean, headTilt, lid, look, o, mw, sm, brow, blink, jit, sq, handR, handL, holdR, holdL, sweat, towel, jaw, curl}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, mustache, leg, arm, shade, jit, sweat } from '../../styles/scifi-toon/chars.js';

export const CEMIL = { label: 'BARMEN', color: '#a23a4a', skin: '#d99a6c', skinS: '#b67a4f', vest: '#8e2f3e', vestS: '#6a1f2c',
  shirt: '#f4f1ea', shirtS: '#d3cdc0', pants: '#2e2a36', shoe: '#1f1a24', hair: '#2a1c1c', tie: '#e8433b', towel: '#f3e6c8', towelS: '#cdbf9e' };
const C = CEMIL;

export function cemil(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, lean = 0, sq = 0 } = P;
  const [jx, jy] = P.jit ? jit(t, P.jit, 7) : [0, 0];
  push(); translate(x + jx, y + jy); scale(s * face * (1 + sq * .5), s * (1 - sq));
  const hipY = -150, shY = -330;
  leg([-34, hipY], [-38, -14], 50, C.pants, C.shoe, 1); leg([30, hipY], [34, -12], 50, C.pants, C.shoe, 1);
  push(); translate(0, hipY); rotate(lean * .15); translate(0, -hipY);
  const shB = [-92, shY + 40], shF = [86, shY + 40];
  const hR = P.handR || [112, hipY - 30], hL = P.handL || [-110, hipY - 30];
  arm(shB, hL, -16, 40, C.shirtS); hand(hL[0], hL[1], 1.5, 22, C.skin);
  if (P.holdL) P.holdL(hL);
  // round body: shirt, then waistcoat over it
  const body = spline([[-104, hipY + 10], [-124, hipY - 90], [-92, shY + 10], [0, shY - 14], [92, shY + 10], [124, hipY - 90], [104, hipY + 10], [0, hipY + 22]]);
  shape(body, { fill: C.vest, shade: () => {
    shade([[50, shY - 40], [140, shY - 40], [140, hipY + 40], [64, hipY + 40]], C.vestS);
    fillOnly([[-30, shY - 20], [30, shY - 20], [10, hipY - 40], [-10, hipY - 40]], C.shirt, { boil: .4 });
  } });
  for (let k = 0; k < 3; k++) dot(16, shY + 70 + k * 38, 6, '#e9c46a');                     // buttons
  // bow tie
  shape(spline([[-2, shY - 2], [-40, shY - 22], [-44, shY + 18]]), { fill: C.tie, lw: 6 });
  shape(spline([[2, shY - 2], [40, shY - 22], [44, shY + 18]]), { fill: C.tie, lw: 6 });
  shape(ell(0, shY - 2, 11, 12, 12), { fill: C.tie, lw: 6 });
  // towel over the back shoulder
  if (P.towel !== false) shape(spline([[-104, shY + 10], [-60, shY - 6], [-58, shY + 30], [-86, shY + 130], [-118, shY + 126], [-112, shY + 40]]), { fill: C.towel, lw: 6, shade: () => shade([[-130, shY + 60], [-60, shY + 60], [-60, shY + 140], [-130, shY + 140]], C.towelS) });
  // head
  push(); translate(6, shY - 8); rotate(P.headTilt || 0);
  const hc = [4, -78];
  for (const sd of [-1, 1]) shape(ell(hc[0] + sd * 80, hc[1] + 6, 15, 22, 16), { fill: C.skin, lw: 6 });   // ears
  const head = ell(hc[0], hc[1], 82, 78, 48);
  shape(head, { fill: C.skin, shade: () => shade(spline([[hc[0] - 100, hc[1] - 60], [hc[0] - 52, hc[1] - 70], [hc[0] - 60, hc[1] + 60], [hc[0] - 100, hc[1] + 80]]), C.skinS) });
  for (const sd of [-1, 1]) shape(spline([[hc[0] + sd * 82, hc[1] - 6], [hc[0] + sd * 70, hc[1] - 44], [hc[0] + sd * 56, hc[1] - 30], [hc[0] + sd * 64, hc[1] + 10]]), { fill: C.hair, lw: 5 });
  stroke(arc(hc[0] + 10, hc[1] - 48, 40, 10, Math.PI * 1.15, Math.PI * 1.85, 10), 4);      // forehead wrinkle
  const lk = P.look || [0, 0], lid = P.lid ?? .05;
  if (P.blink) { stroke([[hc[0] - 34, hc[1] - 10], [hc[0] - 2, hc[1] - 10]], 6); stroke([[hc[0] + 8, hc[1] - 12], [hc[0] + 40, hc[1] - 12]], 6); }
  else { eye(hc[0] - 16, hc[1] - 12, 22, 28, { lid, look: lk, skin: C.skin, jitter: P.jit ? (Math.floor(t * 12) % 2 ? 2 : -2) : 0 }); eye(hc[0] + 26, hc[1] - 14, 21, 27, { lid, look: lk, skin: C.skin, jitter: P.jit ? (Math.floor(t * 12) % 2 ? -2 : 2) : 0 }); }
  const b = P.brow ?? .4;
  brow(hc[0] - 18, hc[1] - 54 - b * 10, 38, b * .5, { lw: 11 }); brow(hc[0] + 28, hc[1] - 56 - b * 10, 36, -b * .5, { lw: 11 });
  nose(hc[0] + 16, hc[1] + 24, .95, { fill: C.skin });
  const jaw = P.jaw || 0;
  mouth(hc[0] + 8, hc[1] + 52 + jaw * 20, 44, { o: Math.max(P.o || 0, jaw), w: .8 + (P.mw ?? .5) * .4, sm: P.sm ?? -.5 });
  mustache(hc[0] + 10, hc[1] + 42, 62, { col: C.hair, curl: P.curl ?? .25, wob: Math.sin(t * 9) * (P.jit ? 4 : 0) });
  if (P.sweat) for (let k = 0; k < P.sweat; k++) { const ph = (t * .9 + k * .37) % 1; sweat(hc[0] - 60 + k * 52, hc[1] - 40 + ph * 50, .9); }
  pop();
  arm(shF, hR, 14, 40, C.shirt); hand(hR[0], hR[1], -.3, 22, C.skin);
  if (P.holdR) P.holdR(hR);
  pop(); pop();
}
