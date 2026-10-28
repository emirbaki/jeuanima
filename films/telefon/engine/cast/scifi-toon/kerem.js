// Cast · KEREM — a groom: stern but clumsy. Medium build, slicked-back hair with one stubborn tuft, a square chin,
// tuxedo jacket over a white shirt, a loosened red bow tie, a huge flower on the lapel.
// P: {x, y, s, face, t, lean, headTilt, lid, look, o, mw, sm, brow, blink, jit, sq, handR, handL, crouch, flat}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, leg, arm, shade, jit, sweat } from '../../styles/scifi-toon/chars.js';
import { lerp } from '/core/lib.js';

export const KEREM = { label: 'KOCA', color: '#2c3550', skin: '#e9b892', skinS: '#c8906a', jacket: '#262a3a', jacketS: '#161924',
  shirt: '#f6f3ec', shirtS: '#d8d2c4', pants: '#262a3a', shoe: '#141218', hair: '#2a1d18', tie: '#d9443b', flower: '#f6f3ec', leaf: '#5f8a4a' };
const C = KEREM;

export function kerem(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, lean = 0, sq = 0, crouch = 0, flat = 0 } = P;
  const [jx, jy] = P.jit ? jit(t, P.jit, 11) : [0, 0];
  push(); translate(x + jx, y + jy); scale(s * face * (1 + sq * .5 + flat * .9), s * (1 - sq - flat * .62));
  const hipY = lerp(-240, -150, crouch), shY = hipY - 200;
  const knee = crouch * 70;
  leg([-34, hipY], [-44 - knee, -16], 54, C.pants, C.shoe, 1); leg([32, hipY], [44 + knee, -14], 54, C.pants, C.shoe, 1);
  push(); translate(0, hipY); rotate(lean * .18); translate(0, -hipY);
  const shB = [-70, shY + 22], shF = [64, shY + 22];
  const hR = P.handR || [80, hipY - 10], hL = P.handL || [-84, hipY - 8];
  arm(shB, hL, -12, 46, C.jacketS); hand(hL[0], hL[1], 1.4, 22, C.skin);
  if (P.holdL) P.holdL(hL);
  const body = spline([[-80, hipY + 14], [-88, hipY - 80], [-78, shY + 10], [-30, shY - 10], [36, shY - 10], [80, shY + 14], [86, hipY - 80], [76, hipY + 14], [0, hipY + 22]]);
  shape(body, { fill: C.jacket, shade: () => {
    fillOnly([[-26, shY - 12], [26, shY - 12], [8, hipY - 30], [-8, hipY - 30]], C.shirt, { boil: .4 });
    shade([[40, shY - 30], [110, shY - 30], [110, hipY + 30], [52, hipY + 30]], C.jacketS);
  } });
  stroke([[-26, shY - 8], [-6, hipY - 34]], 5); stroke([[26, shY - 8], [6, hipY - 34]], 5);   // lapels
  dot(2, hipY - 70, 6, C.shirtS); dot(2, hipY - 110, 6, C.shirtS);
  // loosened bow tie (hangs to one side)
  push(); translate(4, shY + 8); rotate(.35);
  shape(spline([[0, 0], [-30, -14], [-30, 16]]), { fill: C.tie, lw: 5 }); shape(spline([[0, 0], [30, -14], [30, 16]]), { fill: C.tie, lw: 5 });
  shape(ell(0, 0, 9, 10, 10), { fill: C.tie, lw: 5 }); pop();
  // lapel flower
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + t * .3; shape(ell(-46 + Math.cos(a) * 14, shY + 46 + Math.sin(a) * 14, 13, 13, 12), { fill: C.flower, lw: 4 }); }
  shape(ell(-46, shY + 46, 8, 8, 10), { fill: '#e9c46a', lw: 4 });
  // head
  push(); translate(4, shY - 12); rotate(P.headTilt || 0);
  shape(noodle([0, 8], [2, -34], 0, 34, 34), { fill: C.skin, lw: 6 });
  const hc = [6, -108];
  shape(ell(hc[0] - 58, hc[1] + 8, 14, 22, 16), { fill: C.skin, lw: 6 });
  const head = spline([[hc[0] - 54, hc[1] - 50], [hc[0] + 10, hc[1] - 80], [hc[0] + 60, hc[1] - 40], [hc[0] + 66, hc[1] + 40], [hc[0] + 46, hc[1] + 86], [hc[0] - 24, hc[1] + 88], [hc[0] - 60, hc[1] + 30]]);
  shape(head, { fill: C.skin, shade: () => shade(spline([[hc[0] - 74, hc[1] - 40], [hc[0] - 36, hc[1] - 50], [hc[0] - 44, hc[1] + 70], [hc[0] - 74, hc[1] + 90]]), C.skinS) });
  // slicked hair + tuft
  shape(spline([[hc[0] - 58, hc[1] - 10], [hc[0] - 56, hc[1] - 66], [hc[0] + 4, hc[1] - 90], [hc[0] + 62, hc[1] - 50], [hc[0] + 40, hc[1] - 48], [hc[0] - 20, hc[1] - 50], [hc[0] - 40, hc[1] - 14]]), { fill: C.hair, lw: 6 });
  stroke(spline([[hc[0] + 10, hc[1] - 86], [hc[0] + 26, hc[1] - 116], [hc[0] + 6, hc[1] - 126]], false), 6);
  const lk = P.look || [0, 0], lid = P.lid ?? .15;
  if (P.blink) { stroke([[hc[0] - 6, hc[1] - 10], [hc[0] + 24, hc[1] - 10]], 6); stroke([[hc[0] + 32, hc[1] - 12], [hc[0] + 58, hc[1] - 12]], 6); }
  else { eye(hc[0] + 8, hc[1] - 10, 21, 25, { lid, look: lk, skin: C.skin }); eye(hc[0] + 44, hc[1] - 12, 19, 24, { lid, look: lk, skin: C.skin }); }
  const b = P.brow ?? 0;
  brow(hc[0] + 6, hc[1] - 46 - b * 8, 40, b * .5, { lw: 11 }); brow(hc[0] + 46, hc[1] - 48 - b * 8, 36, -b * .5, { lw: 11 });
  nose(hc[0] + 32, hc[1] + 22, .95, { fill: C.skin });
  mouth(hc[0] + 26, hc[1] + 58, 50, { o: P.o || 0, w: .85 + (P.mw ?? .5) * .3, sm: P.sm ?? -.2 });
  stroke(arc(hc[0] + 26, hc[1] + 82, 16, 5, .3, 2.8, 8), 4);   // chin dimple
  if (P.sweat) sweat(hc[0] - 40, hc[1] - 30 + (t * 40 % 30), 1);
  pop();
  arm(shF, hR, 12, 46, C.jacket); hand(hR[0], hR[1], -.3, 22, C.skin);
  if (P.holdR) P.holdR(hR);
  pop(); pop();
}
