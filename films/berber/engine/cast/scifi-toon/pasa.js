// Cast · PAŞA — the parrot: scared, then far too curious. A round red body, blue wings, yellow cheeks,
// a cream hooked beak, a crest of three feathers. turn: 0 faces the camera, 1 shows its back (to the wall).
// The turn is drawn as a flip (x scale through 0), so it can spin fast on the punchline.
// P: {x, y, s, t, turn, look, lid, o (beak open), wings (0 folded .. 1 spread), flap, blown (feathers swept back), jit, sweat, bags, crest}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from '../../styles/scifi-toon/toon.js';
import { eye, shade, jit, sweat } from '../../styles/scifi-toon/chars.js';
import { lerp } from '/core/lib.js';

export const PASA = { label: 'PAPAĞAN', color: '#d9443b', body: '#d9443b', bodyS: '#a8302b', wing: '#3d6fa8', wingS: '#2a5280',
  cheek: '#f2c94c', beak: '#f3e6c8', beakS: '#c9b98f', foot: '#8a6a5a' };
const C = PASA;

export function pasa(P) {
  const { x = 0, y = 0, s = 1, t = 0, turn = 0 } = P;
  const [jx, jy] = P.jit ? jit(t, P.jit, 17) : [0, 0];
  const fx = Math.cos(turn * Math.PI), back = fx < 0;
  push(); translate(x + jx, y + jy); scale(s * Math.max(.08, Math.abs(fx)) * (back ? -1 : 1), s);
  const blown = P.blown || 0, wings = P.wings || 0, flap = P.flap ? Math.sin(t * 40) * .5 + .5 : 0;
  // feet on the perch
  for (const fx2 of [-22, 22]) stroke(spline([[fx2, -6], [fx2 - 10, 6], [fx2 + 10, 6]], false), 6, { line: C.foot });
  // tail (long, down behind)
  shape(spline([[-24, -60], [-40, 60], [-8, 90], [24, 60], [24, -60]]), { fill: C.wing, lw: 6, shade: () => shade(rect(0, -70, 40, 170), C.wingS) });
  // wings (spread on the punchline)
  for (const sd of [-1, 1]) {
    const a = -sd * (wings * 1.3 + flap * .4);
    push(); translate(sd * 50, -110); rotate(a);
    shape(spline([[0, -30], [sd * 30, -10], [sd * 40, 60], [sd * 10, 90], [-sd * 10, 40]]), { fill: C.wing, lw: 6, shade: () => shade(rect(sd > 0 ? 10 : -50, 30, 40, 70), C.wingS) });
    for (let k = 0; k < 3; k++) stroke([[sd * (8 + k * 9), 60 + k * 6], [sd * (14 + k * 9), 86 + k * 3]], 4);
    pop();
  }
  // round body
  shape(ell(0, -110, 62, 100, 40), { fill: C.body, shade: () => shade(ell(40, -100, 34, 110, 20), C.bodyS) });
  if (back) {
    // the back of the head: crest, no face; wing tips crossed on the back
    shape(ell(0, -228, 54, 56, 32), { fill: C.body, shade: () => shade(ell(30, -220, 30, 60, 20), C.bodyS) });
    shape(spline([[-30, -150], [0, -60], [30, -150], [0, -120]]), { fill: C.wing, lw: 6 });
  } else {
    // head front
    shape(ell(0, -228, 56, 58, 32), { fill: C.body, shade: () => shade(ell(36, -220, 28, 60, 20), C.bodyS) });
    for (const sd of [-1, 1]) shape(ell(sd * 34, -206, 20, 16, 16), { fill: C.cheek, lw: 5 });
    const lk = P.look || [0, 0], lid = P.lid ?? 0, big = P.bigEyes ? 1.35 : 1;
    eye(-20, -238, 18 * big, 21 * big, { lid, look: lk, skin: C.body, pupil: 4.5 });
    eye(20, -238, 18 * big, 21 * big, { lid, look: lk, skin: C.body, pupil: 4.5 });
    if (P.bags) for (const sd of [-1, 1]) stroke(arc(sd * 20, -214, 14, 6, .2, 2.9, 8), 3.5);
    // hooked beak: the lower jaw opens with o
    const o = P.o || 0;
    shape(spline([[-10, -200 + o * 22], [12, -200 + o * 22], [6, -176 + o * 26], [-6, -178 + o * 22]]), { fill: C.beakS, lw: 5 });
    shape(spline([[-22, -214], [22, -214], [18, -192], [0, -168], [-4, -186], [-18, -196]]), { fill: C.beak, lw: 6 });
  }
  // crest: three feathers; swept back by the shout
  for (let k = -1; k <= 1; k++) {
    const base = [k * 14, -280], tip = [k * 20 - blown * 70 - 6, -330 - (P.crest || 0) * 30 + Math.abs(k) * 12 + blown * 30];
    shape(noodle(base, tip, 10 * k - blown * 20, 18, 6), { fill: k ? C.body : C.cheek, lw: 5 });
  }
  if (P.sweat) sweat(46, -260 + (t * 50 % 30), .9);
  pop();
}

// a brass perch on a stand; origin at the floor, the bar is at y - 520
export function perch(x, y) {
  stroke([[x, y], [x, y - 520]], 12, { line: '#a8781f' }); stroke([[x, y], [x, y - 520]], 0);
  shape(rr(x - 70, y - 528, 140, 18, 9), { fill: '#d9a640', lw: 6 });
  shape(ell(x, y - 6, 70, 14, 20), { fill: '#d9a640', lw: 6 });
}
