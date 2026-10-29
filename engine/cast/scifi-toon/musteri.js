// Cast · MÜŞTERİ — ordinary neighbourhood men: barber customers, passers-by, a crowd. v = 0..5 gives six variants
// (build, skin, hair, mustache, glasses, clothes). Plain clothes, nothing absurd: they fill a room so the leads stand out.
// P: {x, y, s, face, t, v, lean, headTilt, lid, look, o, mw, sm, brow, blink, jit, sq, handR, handL, legs (false: no legs,
//     for a seat under a cape), paper (0..1 a newspaper up in both hands), bob (0..1 a quick nod),
//     shaved (0..1 a clipper lane over the top of the head, front to back), shine (0..1 the bare lane gleams)}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, mustache, leg, arm, shade, jit } from '../../styles/scifi-toon/chars.js';

export const MUSTERI = { label: 'MÜŞTERİ', color: '#6b7a8f' };
// v: w (body width), h (height), skin, top/topS (shirt or jacket), pants, hair ('short' | 'bald' | 'curly' | 'side' | 'cap'),
//    hairC, must (mustache width, 0 = none), glasses, belly
const V = [
  { w: 1.0, h: 1.0, skin: '#e2b08a', skinS: '#c08c66', top: '#5f8a4a', topS: '#486d37', pants: '#3d4a6b', hair: 'short', hairC: '#2a1d18', must: 54, glasses: false, belly: 0 },
  { w: 1.25, h: .92, skin: '#d99a6c', skinS: '#b67a4f', top: '#e9c46a', topS: '#c9a24a', pants: '#4a3b2e', hair: 'bald', hairC: '#3a2a22', must: 70, glasses: false, belly: 1 },
  { w: .9, h: 1.06, skin: '#c48a5c', skinS: '#9e6a40', top: '#3d6fa8', topS: '#2a5280', pants: '#2e2a36', hair: 'curly', hairC: '#1b1422', must: 0, glasses: true, belly: 0 },
  { w: 1.05, h: .98, skin: '#f0c4a0', skinS: '#d29e7a', top: '#8a5a3c', topS: '#6b432b', pants: '#3a3340', hair: 'side', hairC: '#6b4a2e', must: 48, glasses: false, belly: .5 },
  { w: .95, h: 1.0, skin: '#e9b892', skinS: '#c8906a', top: '#a23a4a', topS: '#7a2434', pants: '#3d4a6b', hair: 'cap', hairC: '#2a1d18', must: 0, glasses: false, belly: 0 },
  { w: 1.1, h: .95, skin: '#d9a072', skinS: '#b47c52', top: '#6b7a8f', topS: '#525f72', pants: '#2e2a36', hair: 'short', hairC: '#9a9a9a', must: 60, glasses: true, belly: .6 },
];

export function musteri(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, lean = 0, sq = 0 } = P;
  const C = V[(P.v || 0) % V.length];
  const [jx, jy] = P.jit ? jit(t, P.jit, 13 + (P.v || 0)) : [0, 0];
  push(); translate(x + jx, y + jy); scale(s * face * (1 + sq * .5), s * C.h * (1 - sq));
  const hipY = -220, shY = -400, bw = 66 * C.w, bel = C.belly * 22;
  if (P.legs !== false) { leg([-24 * C.w, hipY], [-30 * C.w, -14], 40, C.pants, '#1f1a24', 1); leg([22 * C.w, hipY], [28 * C.w, -12], 40, C.pants, '#1f1a24', 1); }
  push(); translate(0, hipY); rotate(lean * .15); translate(0, -hipY);
  const pap = P.paper || 0;
  const hR = P.handR || (pap ? [60, shY + 30] : [bw + 20, hipY - 20]), hL = P.handL || (pap ? [-40, shY + 30] : [-bw - 20, hipY - 20]);
  // far arm (+x side, behind the body): the character faces +x in three-quarter view
  arm([bw - 8, shY + 24], hR, 10, 34, C.topS); hand(hR[0], hR[1], -.4, 18, C.skin);
  shape(spline([[-bw, hipY + 16], [-bw - bel, hipY - 80], [-bw + 4, shY + 10], [0, shY - 10], [bw - 4, shY + 10], [bw + bel, hipY - 80], [bw, hipY + 16], [0, hipY + 24]]),
    { fill: C.top, shade: () => shade([[bw * .45, shY - 20], [bw + 60, shY - 20], [bw + 60, hipY + 40], [bw * .6, hipY + 40]], C.topS) });
  stroke([[0, shY + 10], [0, hipY + 10]], 4);                                         // shirt opening
  shape(spline([[-26, shY - 2], [0, shY + 30], [26, shY - 2], [0, shY + 8]]), { fill: C.topS, lw: 5 });   // collar
  // head
  push(); translate(4, shY - 6 + (P.bob || 0) * 10); rotate((P.headTilt || 0) + (P.bob || 0) * .12);
  shape(noodle([0, 8], [2, -24], 0, 24, 24), { fill: C.skin, lw: 6 });
  const hc = [4, -86], rx = 54 + C.w * 6, ry = 62;
  for (const sd of [-1, 1]) shape(ell(hc[0] + sd * rx, hc[1] + 6, 13, 19, 14), { fill: C.skin, lw: 6 });
  if (C.hair === 'curly') for (let i = 0; i < 7; i++) shape(ell(hc[0] - 50 + i * 17, hc[1] - 52 + Math.abs(i - 3) * 6, 20, 20, 12), { fill: C.hairC, lw: 5 });
  shape(ell(hc[0], hc[1], rx, ry, 40), { fill: C.skin, shade: () => shade(ell(hc[0] - rx, hc[1] + 10, 26, ry + 10, 20), C.skinS) });
  if (C.hair === 'short') shape(spline([[hc[0] - rx, hc[1] - 6], [hc[0] - rx + 6, hc[1] - 50], [hc[0], hc[1] - ry - 8], [hc[0] + rx - 6, hc[1] - 50], [hc[0] + rx, hc[1] - 6], [hc[0] + 20, hc[1] - 42], [hc[0] - 20, hc[1] - 40]]), { fill: C.hairC, lw: 5 });
  if (C.hair === 'side') shape(spline([[hc[0] - rx, hc[1]], [hc[0] - rx + 4, hc[1] - 52], [hc[0] + 10, hc[1] - ry - 10], [hc[0] + rx + 4, hc[1] - 36], [hc[0] + rx - 10, hc[1] - 22], [hc[0] - 10, hc[1] - 44], [hc[0] - rx + 18, hc[1] - 16]]), { fill: C.hairC, lw: 5 });
  if (C.hair === 'bald') for (const sd of [-1, 1]) shape(spline([[hc[0] + sd * rx, hc[1] - 4], [hc[0] + sd * (rx - 10), hc[1] - 36], [hc[0] + sd * (rx - 22), hc[1] - 24], [hc[0] + sd * (rx - 14), hc[1] + 10]]), { fill: C.hairC, lw: 5 });
  if (C.hair === 'cap') {
    shape(spline([[hc[0] - rx - 2, hc[1] - 18], [hc[0] - rx + 8, hc[1] - 60], [hc[0], hc[1] - ry - 14], [hc[0] + rx - 6, hc[1] - 56], [hc[0] + rx + 2, hc[1] - 18]]), { fill: '#3a3340', lw: 6 });
    shape(spline([[hc[0] + 10, hc[1] - 26], [hc[0] + rx + 50, hc[1] - 22], [hc[0] + rx + 44, hc[1] - 8], [hc[0] + 10, hc[1] - 12]]), { fill: '#2a2430', lw: 5 });   // peak
  }
  if (P.shaved > 0) {   // the bare lane follows the top of the skull, from the forehead (+x) to the back
    const a0 = -Math.PI / 2 + .95, a1 = a0 - P.shaved * 2.0, n = 14, out = [], inn = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([hc[0] + Math.cos(a) * (rx + 3), hc[1] + Math.sin(a) * (ry + 3)]); inn.push([hc[0] + Math.cos(a) * (rx - 20), hc[1] + Math.sin(a) * (ry - 20)]); }
    shape([...out, ...inn.reverse()], { fill: C.skin, lw: 5 });
    if (P.shine > 0) {
      const sh = P.shine, sx = hc[0] + 6, sy = hc[1] - ry - 2, r = 10 + 22 * Math.sin(sh * Math.PI);
      stroke([[sx - 30, sy + 8], [sx + 10, sy - 2]], 7, { line: '#fff3d6' });
      stroke([[sx + 26, sy - 30 - r], [sx + 26, sy - 30 + r]], 5, { line: '#fff3d6', alpha: Math.sin(sh * Math.PI) }); stroke([[sx + 26 - r, sy - 30], [sx + 26 + r, sy - 30]], 5, { line: '#fff3d6', alpha: Math.sin(sh * Math.PI) });
    }
  }
  const lk = P.look || [0, 0], lid = P.lid ?? .2;
  if (P.blink) { stroke([[hc[0] - 22, hc[1] - 4], [hc[0] - 2, hc[1] - 4]], 6); stroke([[hc[0] + 14, hc[1] - 6], [hc[0] + 34, hc[1] - 6]], 6); }
  else { eye(hc[0] - 10, hc[1] - 4, 16, 20, { lid, look: lk, skin: C.skin }); eye(hc[0] + 24, hc[1] - 6, 15, 19, { lid, look: lk, skin: C.skin }); }
  if (C.glasses) { for (const [gx, gy] of [[hc[0] - 10, hc[1] - 4], [hc[0] + 24, hc[1] - 6]]) stroke(ell(gx, gy, 22, 22, 18), 5); stroke([[hc[0] + 6, hc[1] - 6], [hc[0] + 8, hc[1] - 6]], 5); }
  const b = P.brow ?? 0;
  brow(hc[0] - 12, hc[1] - 34 - b * 8, 26, b * .5, { lw: 8, col: C.hairC === '#9a9a9a' ? '#6a6a6a' : C.hairC });
  brow(hc[0] + 26, hc[1] - 36 - b * 8, 24, -b * .5, { lw: 8, col: C.hairC === '#9a9a9a' ? '#6a6a6a' : C.hairC });
  nose(hc[0] + 12, hc[1] + 20, .8, { fill: C.skin });
  mouth(hc[0] + 8, hc[1] + 44, 34, { o: P.o || 0, w: .8 + (P.mw ?? .5) * .4, sm: P.sm ?? 0 });
  if (C.must) mustache(hc[0] + 10, hc[1] + 36, C.must, { col: C.hairC === '#9a9a9a' ? '#c8c8c8' : C.hairC });
  pop();
  // near arm (-x side, in front of the body)
  arm([-bw + 8, shY + 24], hL, 10, 34, C.top); hand(hL[0], hL[1], 1.4, 18, C.skin);
  if (pap) {   // a newspaper held open in front of the chest
    push(); translate((hR[0] + hL[0]) / 2, (hR[1] + hL[1]) / 2 - 20);
    shape(rect(-90, -70, 180, 130), { fill: '#f4f1ea', lw: 5, shade: () => { for (let i = 0; i < 5; i++) stroke([[-74, -44 + i * 22], [-8, -44 + i * 22]], 4, { line: '#a8a29a' }); fillOnly(rect(8, -50, 66, 50), '#a8a29a', { boil: .3 }); } });
    stroke([[0, -70], [0, 60]], 3); pop();
  }
  pop(); pop();
}
