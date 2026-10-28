// Cast · YENİÇERİ — two huge, silent guards from the old days. Tall white börk (felt hat folding back),
// a thick curled mustache, red kaftan with a navy sash, arms crossed. v = 0 or 1 gives two variants.
// P: {x, y, s, face, t, v, look, lid, brow, sq, blink}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, mustache, leg, arm, shade } from '../../styles/scifi-toon/chars.js';

export const YENICERI = { label: 'YENİÇERİ', color: '#c0392b', skin: ['#d9a072', '#c48a5c'], skinS: ['#b47c52', '#9e6a40'],
  kaftan: ['#c0392b', '#b5432a'], kaftanS: ['#8e2420', '#86301c'], sash: '#24305e', hat: '#f4f1ea', hatS: '#d6cfc0', gold: '#e9c46a', boot: '#e0a93b', hair: '#2a1c1c' };
const C = YENICERI;

export function yeniceri(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, v = 0, sq = 0 } = P;
  push(); translate(x, y); scale(s * face * (1 + sq * .4), s * (1 - sq));
  const hipY = -250, shY = -560;
  leg([-50, hipY], [-56, -16], 72, '#f0e6d0', C.boot, 1); leg([46, hipY], [52, -14], 72, '#f0e6d0', C.boot, 1);
  // kaftan: long coat to the knees, wide shoulders
  shape(spline([[-130, hipY + 120], [-150, hipY - 80], [-150, shY + 30], [-90, shY - 10], [90, shY - 10], [150, shY + 30], [150, hipY - 80], [130, hipY + 120], [0, hipY + 130]]), { fill: C.kaftan[v], shade: () => {
    shade([[60, shY - 40], [170, shY - 40], [170, hipY + 140], [80, hipY + 140]], C.kaftanS[v]);
    fillOnly(rect(-160, hipY - 70, 320, 52), C.sash, { boil: .3 });
  } });
  stroke([[-150, hipY - 70], [150, hipY - 70]], 5); stroke([[-150, hipY - 18], [150, hipY - 18]], 5);
  stroke([[0, shY], [0, hipY - 70]], 5);
  for (let k = 0; k < 4; k++) dot(14, shY + 50 + k * 50, 6, C.gold);
  const ay = shY + 150, cross = P.cross ?? 1;
  if (cross >= 1) {   // crossed arms: two thick bars across the chest
    shape(noodle([-150, shY + 60], [110, ay + 10], 30, 70, 64), { fill: C.kaftan[v], lw: 7 });
    shape(noodle([150, shY + 60], [-110, ay - 12], -30, 70, 64), { fill: C.kaftanS[v], lw: 7 });
    hand(116, ay + 8, -.2, 26, C.skin[v], { fist: true }); hand(-116, ay - 14, 3.3, 26, C.skin[v], { fist: true });
  } else {            // flailing: arms up, waving on twos
    const f = Math.floor(t * 12) % 2 ? 1 : -1;
    for (const sd of [-1, 1]) { const h = [sd * (230 + f * sd * 30), shY - 220 - f * 40]; shape(noodle([sd * 140, shY + 60], h, sd * 40, 70, 60), { fill: sd < 0 ? C.kaftanS[v] : C.kaftan[v], lw: 7 }); hand(h[0], h[1], sd * -.6 - 1.6, 28, C.skin[v]); }
  }
  // head
  push(); translate(0, shY - 8);
  const hc = [6, -96];
  shape(spline([[hc[0] - 16, 10], [hc[0] - 22, -30], [hc[0] + 26, -30], [hc[0] + 22, 10]]), { fill: C.skin[v], lw: 6 });   // neck
  shape(ell(hc[0], hc[1], 92, 96, 48), { fill: C.skin[v], shade: () => shade(ell(hc[0] - 80, hc[1] + 10, 40, 100, 20), C.skinS[v]) });
  // börk: tall white felt hat, top folding back behind the head, gold plate at the front
  // the fold: hangs from the crown down the back of the head to the shoulder (back side only)
  shape(spline([[hc[0] - 40, hc[1] - 300], [hc[0] - 120, hc[1] - 270], [hc[0] - 170, hc[1] - 120], [hc[0] - 160, hc[1] + 60], [hc[0] - 116, hc[1] + 70], [hc[0] - 112, hc[1] - 110], [hc[0] - 60, hc[1] - 230]]), { fill: C.hatS, lw: 7 });
  // the crown: a tall felt cylinder, slightly tapered
  shape(spline([[hc[0] - 78, hc[1] - 40], [hc[0] - 72, hc[1] - 200], [hc[0] - 40, hc[1] - 304], [hc[0] + 30, hc[1] - 300], [hc[0] + 70, hc[1] - 200], [hc[0] + 80, hc[1] - 40], [hc[0], hc[1] - 52]]), { fill: C.hat, shade: () => shade([[hc[0] + 36, hc[1] - 320], [hc[0] + 110, hc[1] - 320], [hc[0] + 110, hc[1]], [hc[0] + 46, hc[1]]], C.hatS) });
  shape(rr(hc[0] - 74, hc[1] - 62, 156, 34, 10), { fill: C.gold, lw: 6 });
  shape(spline([[hc[0] - 6, hc[1] - 70], [hc[0] + 10, hc[1] - 150], [hc[0] + 24, hc[1] - 70]]), { fill: C.gold, lw: 6 });   // spoon holder
  const lk = P.look || [0, 0];
  if (P.blink) { stroke([[hc[0] - 30, hc[1] - 4], [hc[0] - 4, hc[1] - 4]], 6); stroke([[hc[0] + 18, hc[1] - 6], [hc[0] + 44, hc[1] - 6]], 6); }
  else { eye(hc[0] - 16, hc[1] - 4, 17, 20, { lid: P.lid ?? .3, look: lk, skin: C.skin[v] }); eye(hc[0] + 32, hc[1] - 6, 16, 19, { lid: P.lid ?? .3, look: lk, skin: C.skin[v] }); }
  const b = P.brow ?? -.6;
  brow(hc[0] - 16, hc[1] - 34, 44, b, { lw: 13, col: C.hair }); brow(hc[0] + 34, hc[1] - 36, 40, -b, { lw: 13, col: C.hair });
  nose(hc[0] + 18, hc[1] + 32, 1.15, { fill: C.skin[v] });
  mouth(hc[0] + 12, hc[1] + 72, 40, { o: P.o || 0, sm: P.sm ?? -.6 });
  mustache(hc[0] + 14, hc[1] + 54, v ? 80 : 96, { col: C.hair, curl: (v ? .9 : .35) + (P.twirl || 0), wob: P.wob || 0, lw: 6 });
  if (!v) for (let k = 0; k < 14; k++) dot(hc[0] - 40 + (k % 7) * 18, hc[1] + 80 + Math.floor(k / 7) * 14, 2.6, '#7a5038');   // beard shadow
  pop();
  pop();
}
