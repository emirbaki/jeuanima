// Cast · CİN — very old, hard of hearing. Lilac skin, small turban, huge white brows and a long beard,
// a brass ear trumpet, and from the waist down a smoke tail that leads back to the lamp.
// P: {x, y, s, face, t, rise (0..1 out of the lamp), tail: [x, y] lamp spout in local units, look, lid, o, sm, brow,
//     trumpet (0..1 raised to the ear), nod (0..1), cough, snap (0..1 finger snap), lean}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, arm, shade, jit } from '../../styles/scifi-toon/chars.js';
import { ss, lerp } from '/core/lib.js';

export const CIN = { label: 'CİN', color: '#9d8ad6', skin: '#a996dc', skinS: '#8270bd', beard: '#f4f1ea', beardS: '#d8d2c6',
  vest: '#2f8f83', vestS: '#1f6a61', turban: '#f0d9a8', turbanS: '#cdb27c', gem: '#ff3d8b', smoke: '#c8bdea', smokeS: '#a597d4', brass: '#d9a640', brassS: '#a8781f' };
const C = CIN;

export function cin(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, rise = 1, lean = 0 } = P;
  const tail = P.tail || [-40, 260];
  push(); translate(x, y); scale(s * face * lerp(.2, 1, ss(rise)), s * lerp(.1, 1, ss(rise)));
  // smoke tail: a fat noodle from the waist curling down to the lamp spout
  const sway = Math.sin(t * 2.2) * 18;
  shape(noodle([0, -20], [tail[0], tail[1]], 60 + sway, 120, 18), { fill: C.smoke, lw: 6, shade: () => shade(ell(60, 120, 60, 160, 20), C.smokeS) });
  for (let k = 0; k < 3; k++) { const ph = (t * .7 + k / 3) % 1; stroke(arc(tail[0] * ph + 20, tail[1] * ph, 18, 10, 0, Math.PI * 1.6, 10), 4); }
  push(); rotate(lean * .1);
  const shY = -230;
  const nod = P.nod ? Math.sin(P.nod * Math.PI * 4) * .12 : 0;
  // back arm: holds the ear trumpet when raised
  const tr = P.trumpet || 0;
  const hL = [lerp(-110, -128, tr), lerp(-60, shY - 72, tr)];
  // far arm (+x side, behind the body): the character faces +x in three-quarter view
  const sn = P.snap || 0, hR = [lerp(100, 178, sn), lerp(-60, shY - 30, sn)];
  arm([60, shY + 20], hR, 10, 34, C.vestS); hand(hR[0], hR[1], -.6 - sn * .8, 20, C.skin, { fist: sn > .6 });
  // body + vest
  shape(spline([[-80, -10], [-90, shY + 30], [-50, shY - 6], [50, shY - 6], [90, shY + 30], [80, -10], [0, 10]]), { fill: C.skin, shade: () => {
    fillOnly([[-90, shY + 10], [-20, shY - 10], [-30, 0], [-90, 0]], C.vest, { boil: .4 });
    fillOnly([[90, shY + 10], [20, shY - 10], [30, 0], [90, 0]], C.vestS, { boil: .4 });
  } });
  stroke([[-30, shY + 6], [-24, -6]], 4, { line: '#e9c46a' }); stroke([[30, shY + 6], [24, -6]], 4, { line: '#e9c46a' });
  // head
  push(); translate(4, shY - 4); rotate(nod + (P.headTilt || 0));
  const hc = [0, -84];
  shape(ell(hc[0] - 64, hc[1] + 8, 18, 30, 16), { fill: C.skin, lw: 6 });                 // big ear
  shape(ell(hc[0], hc[1], 66, 72, 40), { fill: C.skin, shade: () => shade(ell(hc[0] - 56, hc[1] + 6, 30, 80, 20), C.skinS) });
  for (let k = 0; k < 3; k++) stroke(arc(hc[0] + 6, hc[1] - 36 + k * 9, 30 - k * 4, 6, Math.PI * 1.15, Math.PI * 1.85, 8), 3.5);   // wrinkles
  // turban
  shape(spline([[hc[0] - 66, hc[1] - 30], [hc[0] - 60, hc[1] - 90], [hc[0], hc[1] - 112], [hc[0] + 62, hc[1] - 86], [hc[0] + 66, hc[1] - 30], [hc[0], hc[1] - 50]]), { fill: C.turban, shade: () => {
    shade([[hc[0] + 20, hc[1] - 130], [hc[0] + 90, hc[1] - 130], [hc[0] + 90, hc[1] - 20], [hc[0] + 30, hc[1] - 20]], C.turbanS);
    for (let k = 0; k < 3; k++) stroke(quad([hc[0] - 64, hc[1] - 44 - k * 22], [hc[0], hc[1] - 70 - k * 24], [hc[0] + 64, hc[1] - 44 - k * 20], 10), 4);
  } });
  shape(ell(hc[0] + 6, hc[1] - 62, 11, 13, 14), { fill: C.gem, lw: 5 });
  // tiny eyes under huge brows
  const lk = P.look || [0, 0], lid = P.lid ?? .5;
  eye(hc[0] - 4, hc[1] - 6, 14, 16, { lid, look: lk, skin: C.skin, pupil: 3.5 }); eye(hc[0] + 26, hc[1] - 8, 13, 15, { lid, look: lk, skin: C.skin, pupil: 3.5 });
  const b = P.brow ?? 0;
  for (const [bx, sd] of [[-6, -1], [30, 1]]) shape(spline([[hc[0] + bx - 22, hc[1] - 22 - b * 6], [hc[0] + bx + 4, hc[1] - 34 - b * 8], [hc[0] + bx + 26 * sd + (sd < 0 ? 40 : 0), hc[1] - 18], [hc[0] + bx + 10, hc[1] - 18]]), { fill: C.beard, lw: 5 });
  nose(hc[0] + 20, hc[1] + 20, .85, { fill: C.skin });
  // beard (long, to the chest), mouth on it
  const bw = Math.sin(t * 1.6) * 6;
  shape(spline([[hc[0] - 52, hc[1] + 30], [hc[0] + 54, hc[1] + 28], [hc[0] + 40, hc[1] + 120], [hc[0] + 10 + bw, hc[1] + 220], [hc[0] - 20 + bw, hc[1] + 190], [hc[0] - 44, hc[1] + 110]]), { fill: C.beard, shade: () => shade([[hc[0] + 10, hc[1] + 40], [hc[0] + 80, hc[1] + 40], [hc[0] + 60, hc[1] + 240], [hc[0] + 20, hc[1] + 240]], C.beardS) });
  stroke(spline([[hc[0] - 10, hc[1] + 80], [hc[0] - 4 + bw, hc[1] + 140], [hc[0] + 4 + bw, hc[1] + 180]], false), 3.5);
  shape(spline([[hc[0] - 30, hc[1] + 40], [hc[0] + 16, hc[1] + 30], [hc[0] + 54, hc[1] + 44], [hc[0] + 14, hc[1] + 50]]), { fill: C.beard, lw: 5 });   // mustache
  mouth(hc[0] + 14, hc[1] + 62, 30, { o: P.o || 0, sm: P.sm ?? -.2, teeth: false });
  pop();
  // ear trumpet in the back hand: horn opening toward the speaker, narrow end at the ear
  if (tr > 0) {
    const ear = [-60 + 4, shY - 4 - 84 + 8];
    const bell = [lerp(-150, -150, tr), lerp(-40, shY - 40, tr)];
    push(); translate(0, 0);
    const a = ear, b = [-176, shY - 96];
    shape(noodle(a, b, -10, 10, 50), { fill: C.brass, lw: 6, shade: () => shade(ell(b[0], b[1] + 12, 40, 16, 16), C.brassS) });
    shape(ell(b[0] - 4, b[1], 12, 30, 20), { fill: '#3a2a14', lw: 6 });
    pop();
  }
  // near arm (-x side, in front of the body)
  arm([-60, shY + 20], hL, 10, 34, C.vest); hand(hL[0], hL[1], .6, 20, C.skin);
  // front arm: snap
  if (sn > .6) for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; stroke([[hR[0] + 30 + Math.cos(a) * 26, hR[1] - 20 + Math.sin(a) * 26], [hR[0] + 30 + Math.cos(a) * 44, hR[1] - 20 + Math.sin(a) * 44]], 5, { line: '#ffe3b0' }); }
  if (P.cough) for (let k = 0; k < 3; k++) { const ph = (t * 2 + k * .3) % 1; shape(ell(70 + ph * 60, shY - 40 - ph * 30, 10 + ph * 16, 8 + ph * 12, 12), { fill: '#b9ad8e', lw: 4, alpha: 1 - ph }); }
  pop(); pop();
}
