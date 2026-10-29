// Cast · EMRE — the apprentice: a teenager who films everything. Skinny, a backwards cap, big headphones round his neck,
// a teal hoodie with the hood down, braces. Holds his phone up like a camera.
// P: {x, y, s, face, t, lean, headTilt, lid, look, o, sm, brow, blink, jit, sq, handR, handL, filming (0..1 phone raised), panic}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, leg, arm, shade, jit, sweat } from '../../styles/scifi-toon/chars.js';
import { lerp } from '/core/lib.js';

export const EMRE = { label: 'ÇIRAK', color: '#2a9d8f', skin: '#d9a072', skinS: '#b47c52', hoodie: '#2a9d8f', hoodieS: '#1f7a6f',
  pants: '#3d4a6b', shoe: '#f4f1ea', cap: '#e8433b', capS: '#b8322b', hair: '#2a1d18', phones: '#1b1422' };
const C = EMRE;

export function emre(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, lean = 0, sq = 0 } = P;
  const [jx, jy] = P.jit ? jit(t, P.jit, 31) : [0, 0];
  push(); translate(x + jx, y + jy); scale(s * face * (1 + sq * .5), s * (1 - sq));
  const hipY = -230, shY = -410;
  leg([-26, hipY], [-34, -14], 42, C.pants, C.shoe, 1); leg([24, hipY], [32, -12], 42, C.pants, C.shoe, 1);
  push(); translate(0, hipY); rotate(lean * .15); translate(0, -hipY);
  const f = P.filming ?? 0;
  const hR = P.handR || [lerp(70, 120, f), lerp(hipY - 10, shY - 40, f)], hL = P.handL || [lerp(-70, 40, f), lerp(hipY - 10, shY - 30, f)];
  // far arm (+x side, behind the body): the character faces +x in three-quarter view
  arm([56, shY + 20], hR, 10, 36, C.hoodieS); hand(hR[0], hR[1], -.4, 19, C.skin);
  // hoodie: baggy, pocket, strings
  shape(spline([[-70, hipY + 20], [-78, hipY - 80], [-64, shY + 10], [0, shY - 12], [64, shY + 10], [78, hipY - 80], [70, hipY + 20], [0, hipY + 28]]), { fill: C.hoodie, shade: () => {
    shade([[30, shY - 20], [100, shY - 20], [100, hipY + 40], [44, hipY + 40]], C.hoodieS);
    fillOnly(rr(-46, hipY - 70, 92, 54, 16), C.hoodieS, { boil: .4 });
  } });
  stroke([[-14, shY + 6], [-18, shY + 70]], 4); stroke([[14, shY + 6], [18, shY + 70]], 4);
  shape(spline([[-60, shY + 6], [0, shY - 26], [60, shY + 6], [0, shY + 18]]), { fill: C.hoodieS, lw: 6 });   // hood folded back
  // head
  push(); translate(4, shY - 10); rotate(P.headTilt || 0);
  shape(noodle([0, 8], [2, -30], 0, 26, 26), { fill: C.skin, lw: 6 });
  const hc = [4, -96];
  for (const sd of [-1, 1]) shape(ell(hc[0] + sd * 58, hc[1] + 4, 18, 26, 16), { fill: C.skin, lw: 6 });       // big ears
  shape(ell(hc[0], hc[1], 56, 66, 40), { fill: C.skin, shade: () => shade(ell(hc[0] - 50, hc[1] + 10, 28, 76, 20), C.skinS) });
  // headphones round the neck
  shape(spline([[hc[0] - 50, hc[1] + 70], [hc[0], hc[1] + 92], [hc[0] + 50, hc[1] + 70], [hc[0], hc[1] + 80]]), { fill: C.phones, lw: 5 });
  for (const sd of [-1, 1]) shape(ell(hc[0] + sd * 48, hc[1] + 74, 16, 20, 14), { fill: C.cap, lw: 5 });
  // backwards cap
  shape(spline([[hc[0] - 58, hc[1] - 20], [hc[0] - 50, hc[1] - 66], [hc[0] + 10, hc[1] - 80], [hc[0] + 58, hc[1] - 48], [hc[0] + 56, hc[1] - 22], [hc[0], hc[1] - 36]]), { fill: C.cap, shade: () => shade(rect(hc[0] + 20, hc[1] - 90, 60, 80), C.capS) });
  shape(spline([[hc[0] - 56, hc[1] - 30], [hc[0] - 96, hc[1] - 24], [hc[0] - 92, hc[1] - 10], [hc[0] - 52, hc[1] - 16]]), { fill: C.capS, lw: 5 });   // brim at the back
  const lk = P.look || [0, 0], lid = P.lid ?? .05;
  if (P.blink) { stroke([[hc[0] - 12, hc[1] - 4], [hc[0] + 12, hc[1] - 4]], 6); stroke([[hc[0] + 22, hc[1] - 6], [hc[0] + 46, hc[1] - 6]], 6); }
  else { eye(hc[0], hc[1] - 4, 18, 22, { lid, look: lk, skin: C.skin, jitter: P.panic ? (Math.floor(t * 12) % 2 ? 2 : -2) : 0 }); eye(hc[0] + 34, hc[1] - 6, 17, 21, { lid, look: lk, skin: C.skin }); }
  const b = P.brow ?? 0;
  brow(hc[0], hc[1] - 36 - b * 8, 28, b * .5, { lw: 8, col: C.hair }); brow(hc[0] + 36, hc[1] - 38 - b * 8, 26, -b * .5, { lw: 8, col: C.hair });
  nose(hc[0] + 22, hc[1] + 20, .75, { fill: C.skin });
  mouth(hc[0] + 18, hc[1] + 46, 32, { o: P.o || 0, sm: P.sm ?? .4 });
  if ((P.o || 0) > .2) stroke([[hc[0] + 6, hc[1] + 44], [hc[0] + 30, hc[1] + 44]], 3, { line: '#a8a8b8' });   // braces
  if (P.panic) sweat(hc[0] - 30, hc[1] - 30 + (t * 40 % 30), .9);
  pop();
  // near arm (-x side, in front of the body)
  arm([-56, shY + 20], hL, 10, 36, C.hoodie); hand(hL[0], hL[1], 1.3, 19, C.skin);
  if (f > .3) {   // his phone, held up like a camera, screen toward him, a red REC dot toward the scene
    push(); translate((hR[0] + hL[0]) / 2 + 14, (hR[1] + hL[1]) / 2 - 40);
    shape(rr(-30, -54, 60, 104, 10), { fill: '#1b1422', lw: 6 }); dot(16, -40, 6, Math.floor(t * 2) % 2 ? '#e8433b' : '#5a2a2a');
    pop();
  }
  if (P.holdR) P.holdR(hR);
  pop(); pop();
}
