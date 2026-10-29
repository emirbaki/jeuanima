// Cast · LEYLA — a bride: practical and decided. Hair in a high bun, a bell-shaped wedding dress,
// and a veil so long it always trails on the floor behind her (her absurd costume idea).
// P: {x, y, s, face, t, lean, headTilt, lid, look, o, mw, sm, brow, blink, sq, handR, handL, veil (trail length), jump}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, arm, shade, jit } from '../../styles/scifi-toon/chars.js';

export const LEYLA = { label: 'KADIN', color: '#e86a8a', skin: '#f0c4a0', skinS: '#d29e7a', dress: '#fbf7f0', dressS: '#ddd5c6',
  hair: '#5a2e22', veil: 'rgba(255,255,255,.72)', lips: '#d9443b', shoe: '#e86a8a' };
const C = LEYLA;

export function leyla(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, lean = 0, sq = 0 } = P;
  const [jx, jy] = P.jit ? jit(t, P.jit, 5) : [0, 0];
  push(); translate(x + jx, y + jy); scale(s * face * (1 + sq * .5), s * (1 - sq));
  const waist = -250, shY = -360;
  // veil trailing behind (drawn first: it is behind her)
  const vl = P.veil ?? 260, sway = Math.sin(t * 1.7) * 10;
  shape(spline([[-20, shY - 140], [-70, shY - 40], [-120 - vl * .3, -80 + sway], [-90 - vl, -4], [-40 - vl * .6, 4], [-30, -120]]), { fill: C.veil, lw: 5 });
  shape(rr(-34, -20, 26, 18, 8), { fill: C.shoe, lw: 5 }); shape(rr(10, -20, 30, 18, 8), { fill: C.shoe, lw: 5 });
  push(); translate(0, waist); rotate(lean * .15); translate(0, -waist);
  const hR = P.handR || [64, waist + 30], hL = P.handL || [-66, waist + 30];
  // far arm (+x side, behind the body): the character faces +x in three-quarter view
  arm([46, shY + 18], hR, 10, 30, C.skinS); hand(hR[0], hR[1], -.3, 18, C.skin);
  // bell skirt
  shape(spline([[-40, waist], [-130, -40], [-150, -10], [0, 6], [150, -10], [130, -40], [40, waist]]), { fill: C.dress, shade: () => {
    shade([[40, waist], [170, waist], [170, 20], [70, 20]], C.dressS);
    for (let k = 0; k < 3; k++) stroke(quad([-120 + k * 6, -60 - k * 50], [0, -40 - k * 50], [120 - k * 6, -60 - k * 50], 10), 3.5);
  } });
  // bodice
  shape(spline([[-44, waist + 6], [-56, shY + 30], [-30, shY], [30, shY], [56, shY + 30], [44, waist + 6]]), { fill: C.dress, shade: () => shade([[20, shY - 20], [80, shY - 20], [80, waist + 20], [30, waist + 20]], C.dressS) });
  stroke(quad([-44, waist + 4], [0, waist + 18], [44, waist + 4], 10), 5);
  // head
  push(); translate(4, shY - 6); rotate(P.headTilt || 0);
  shape(noodle([0, 8], [2, -30], 0, 26, 26), { fill: C.skin, lw: 6 });
  const hc = [6, -94];
  // bun + hair
  shape(ell(hc[0] - 10, hc[1] - 92, 40, 34, 24), { fill: C.hair, lw: 6 });
  shape(ell(hc[0], hc[1], 62, 70, 40), { fill: C.skin, shade: () => shade(ell(hc[0] - 56, hc[1] + 10, 30, 80, 20), C.skinS) });
  shape(spline([[hc[0] - 64, hc[1] + 10], [hc[0] - 60, hc[1] - 50], [hc[0], hc[1] - 74], [hc[0] + 62, hc[1] - 40], [hc[0] + 30, hc[1] - 48], [hc[0] - 20, hc[1] - 40], [hc[0] - 42, hc[1] + 10]]), { fill: C.hair, lw: 6 });
  // tiara
  for (let k = -2; k <= 2; k++) dot(hc[0] + k * 16, hc[1] - 66 - (2 - Math.abs(k)) * 5, 6, '#e9c46a');
  const lk = P.look || [0, 0], lid = P.lid ?? .1;
  if (P.blink) { stroke([[hc[0] - 14, hc[1] - 6], [hc[0] + 12, hc[1] - 6]], 6); stroke([[hc[0] + 20, hc[1] - 8], [hc[0] + 46, hc[1] - 8]], 6); }
  else { eye(hc[0] - 2, hc[1] - 6, 18, 22, { lid, look: lk, skin: C.skin }); eye(hc[0] + 32, hc[1] - 8, 17, 21, { lid, look: lk, skin: C.skin }); }
  for (const [ex, sd] of [[-2, -1], [32, 1]]) stroke([[hc[0] + ex + sd * 14, hc[1] - 24], [hc[0] + ex + sd * 22, hc[1] - 34]], 4);   // lashes
  const b = P.brow ?? .1;
  brow(hc[0] - 2, hc[1] - 38 - b * 8, 30, b * .5, { lw: 7 }); brow(hc[0] + 34, hc[1] - 40 - b * 8, 28, -b * .5, { lw: 7 });
  nose(hc[0] + 24, hc[1] + 20, .7, { fill: C.skin });
  mouth(hc[0] + 18, hc[1] + 46, 34, { o: P.o || 0, w: .85 + (P.mw ?? .5) * .3, sm: P.sm ?? .2, teeth: true });
  stroke(quad([hc[0] + 4, hc[1] + 44], [hc[0] + 18, hc[1] + 40], [hc[0] + 32, hc[1] + 44], 6), 4, { line: C.lips });
  pop();
  // near arm (-x side, in front of the body)
  arm([-50, shY + 18], hL, 10, 30, C.skin); hand(hL[0], hL[1], 1.4, 18, C.skin);
  if (P.holdR) P.holdR(hR);
  pop(); pop();
}
