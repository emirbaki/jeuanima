// Berber — a barber shop on three days, then the street. world(t) draws the set and every character from the timeline;
// shots only move the camera. Script lines 0..20 (see script.txt). Each day: the man comes in (line E), asks (A), the
// narrator (N) and the barber answer (R) while the barber counts the queue with his comb, the man leaves (X).
// The queue really holds 5, 6, 4 people (ordinary customers, musteri.js, and old Rıza). The framed photo of the barber's house (pink door)
// hangs by the mirror from the first frame. Line 16: the man goes through that pink door. Line 20: the camera drops onto
// the photo, the music stops, and in the hold the barber's clippers slip. Never hard-code seconds.
import { clamp, lerp, seg, ss, eo, back, hash } from '/core/lib.js';
import { init, frame, W, H, push, pop, translate, scale, rotate, setM, shape, stroke, rr, rect, ell, spline, dot, fillOnly } from './engine/styles/scifi-toon/toon.js';
import { titleCard, dust } from './engine/styles/scifi-toon/props.js';
import { nail, NAIL } from './engine/cast/scifi-toon/nail.js';
import { cemil, CEMIL } from './engine/cast/scifi-toon/cemil.js';
import { emre, EMRE } from './engine/cast/scifi-toon/emre.js';
import { riza } from './engine/cast/scifi-toon/riza.js';
import { musteri } from './engine/cast/scifi-toon/musteri.js';
import { TL, w, L, Lend, Ledge, wordOf, q, mouthOpen, mouthWide } from './engine/core/js/time.js';
import { shot, seam, ev, boot, reportText, setHold, endStart } from './engine/core/js/film.js';
import { drawSubs } from './engine/core/js/subs.js';
import { endCard } from './engine/core/js/brand.js';
import { pill } from './engine/styles/scifi-toon/ui.js';   // also registers the 'whip' seam
import { FLOOR, BACK, WALLF, shop, photo, calendar, chairBack, chairFront, cape, hairPile, street, phoneShow } from './set.js';

const g = init(document.getElementById('c'));
const CFG = await (await fetch('film.json')).json();
const NAMES = { BERBER: { label: 'BERBER', color: CEMIL.color }, ADAM: { label: 'ADAM', color: NAIL.color }, 'ÇIRAK': { label: 'ÇIRAK', color: EMRE.color } };
setHold(CFG.hold);

// —— key times ——
const E = [0, 5, 10], A = [1, 6, 11], N = [2, 7, 12], R = [3, 8, 13], X = [4, 9, 14];
const WALK = .8;
const T = {
  tin: [w(wordOf(0, 3)) - .3, w(wordOf(5, 3)), w(wordOf(10, 3))],          // the man comes in ("adam" / "tekrar")
  tout: [w(wordOf(4, 2)) - .1, w(wordOf(9, 1)) - .1, w(wordOf(14, 2)) - .1], // he leaves ("çıkar")
  tear: [L(5) + .2, L(10) + .2],                                             // the calendar page flies off
  cnt: [[L(2) + .1, Lend(3) - .05], [L(7) + .1, Lend(8) - .05], [L(12) + .1, w(wordOf(13, 3))]],
  sus: L(15), send: w(wordOf(15, 6)), run: w(wordOf(15, 9)),                 // suspicion / "Çırağını" / "yollar"
  st: L(16), inDoor: w(wordOf(16, 5)), back: w(wordOf(16, 6)),              // the street: the man at the pink door / "geri"
  burst: L(17) - .15, show: L(19) + .2, home: w(wordOf(20, 3)) - .08, eve: w(wordOf(20, 4)),
  slip: Lend(20) + .3,                                                      // the hold: the clippers make one pass on their own
};
const dayOf = t => t < T.tear[0] ? 0 : t < T.tear[1] ? 1 : 2;
const STAND = 330, DOOR = 135;
// the hold gag: the customer's head (musteri at x 1290, y 1428, s .9, face -1) and the clipper path over its top
const PASS = .6, HEAD = { x: 1290, y: 1428, s: .9 };
function lane(k) {   // world point on the top of the skull, k 0 = forehead .. 1 = back (same arc as musteri.js 'shaved')
  const a = -Math.PI / 2 + .95 - k * 2.0;
  return [HEAD.x - (8 + Math.cos(a) * 63) * HEAD.s, HEAD.y + (-492 + Math.sin(a) * 65) * HEAD.s];
}
const shaveK = t => seg(t, T.slip, T.slip + PASS);
const QUEUE = [['m1', 'riza', 'm2', 'm3', 'm5'], ['m1', 'riza', 'm2', 'm3', 'm5', 'm4'], ['m1', 'riza', 'm2', 'm3']];   // 5, 6, 4 people
const QSIZE = QUEUE.map(a => a.length);

// —— sound ——
const steps = (a, b, gap = .26, type = 'step', gain = .6) => { for (let t = a; t < b; t += gap) ev(t, type, { gain }); };
for (let d = 0; d < 3; d++) {
  const a = T.tin[d], c = T.tout[d];
  if (d === 1) { ev(a - .15, 'thump'); ev(a - .12, 'crash', { gain: .4 }); } else ev(a - .15, 'creak');
  ev(a - .1, 'ding', { gain: d === 1 ? .9 : .6 }); steps(a, a + WALK);
  steps(c, c + WALK); ev(c + WALK - .1, 'ding', { gain: .5 }); ev(c + WALK + .1, 'thump', { gain: .4 });
  const [cs, ce] = T.cnt[d], n = QSIZE[d];
  for (let k = 0; k < n; k++) ev(cs + (k + .5) * (ce - cs) / n, 'pop', { gain: .5 });
}
for (const t of T.tear) { ev(t, 'paper'); ev(t + .1, 'swish', { gain: .6 }); }
for (let t = 2.6; t < T.sus; t += 2.3) ev(t, 'snip', { gain: .45 });         // the barber keeps cutting
ev(T.sus + .3, 'squeak', { gain: .4 }); ev(T.sus + .9, 'boing', { gain: .3 });
ev(T.send, 'whistle_up', { gain: .4 }); ev(T.send + .5, 'blip'); ev(T.run, 'zip'); ev(T.run + .1, 'whoosh'); ev(T.run + .45, 'ding', { gain: .5 });
steps(T.st, T.inDoor, .3, 'step', .5); steps(T.st + .5, T.inDoor + .2, .3, 'plink', .25);
ev(T.inDoor - .1, 'creak'); ev(T.inDoor + .3, 'click', { gain: .7 }); ev(T.back, 'zip'); ev(T.back + .08, 'whoosh');
ev(T.burst, 'thump'); ev(T.burst + .02, 'ding', { gain: .9 }); ev(T.burst + .2, 'slide', { gain: .6 });
ev(T.show, 'blip'); ev(T.home, 'whoosh', { gain: .5 }); ev(T.eve + .05, 'thump', { gain: .5 });
ev(T.slip - .1, 'buzz', { d: PASS + .25 }); ev(T.slip + .15, 'whoosh', { gain: .3 }); ev(T.slip + .8, 'squeak');
ev(T.slip + .95, 'sparkle', { gain: .7 }); ev(T.slip + 1.15, 'whistle_down', { gain: .4 }); ev(endStart() + .1, 'pop');
ev(0, 'music', { cue: 'title' }); ev(2.2, 'music', { cue: 'theme' }); ev(T.sus, 'music', { cue: 'tension' });
ev(T.eve, 'music', { cue: 'silence' }); ev(endStart(), 'music', { cue: 'end' });

// —— the queue (left of the chair). Front of the queue = nearest the chair. ——
const SLOT = [1040, 915, 790, 665, 540, 430];   // the back row, against the wall
const MEMBERS = [
  { k: 'riza', f: (x, t, b) => riza({ x, y: BACK, s: .8, face: -1, t, look: [.8, 0], lid: .4, sm: -.4, sq: b * .08 }) },
  ...[1, 2, 3, 4, 5].map(v => ({ k: 'm' + v, f: (x, t, b) => musteri({ x, y: BACK, s: .84, face: -1, t, v, look: v === 3 ? [.3, .9] : [1, -.05], lid: .35,
    paper: v === 3 ? 1 : 0, bob: b, sq: Math.sin(t * 2 + v) * .01 }) })),
]
function bobOf(d, k, t) {   // 1 while the comb points at the k-th head of the queue
  const [cs, ce] = T.cnt[d], n = QSIZE[d], tk = cs + (k + .5) * (ce - cs) / n;
  return t > tk - .02 && t < tk + .2 ? Math.sin((t - tk + .02) / .22 * Math.PI) : 0;
}

// —— the man (Nail): walks in from the door, stands, walks out; gone between the days ——
function man(t) {
  for (let d = 0; d < 3; d++) {
    const a = T.tin[d], c = T.tout[d];
    if (t < a || t > c + WALK) continue;
    if (t < a + WALK) { const k = ss((t - a) / WALK); return { d, x: lerp(DOOR, STAND, k), face: 1, walk: 1, in: k }; }
    if (t < c) return { d, x: STAND, face: 1, walk: 0 };
    const k = ss((t - c) / WALK); return { d, x: lerp(STAND, DOOR, k), face: -1, walk: 1, out: k };
  }
  return null;
}
function doorOpen(t) {
  let o = 0;
  for (let d = 0; d < 3; d++) o = Math.max(o, seg(t, T.tin[d] - .2, T.tin[d]) * (1 - seg(t, T.tin[d] + WALK, T.tin[d] + WALK + .25)),
    seg(t, T.tout[d] + WALK - .4, T.tout[d] + WALK - .2) * (1 - seg(t, T.tout[d] + WALK, T.tout[d] + WALK + .2)));
  o = Math.max(o, seg(t, T.run, T.run + .15) * (1 - seg(t, T.run + .5, T.run + .7)), seg(t, T.burst - .1, T.burst) * (1 - seg(t, T.burst + .5, T.burst + .7)));
  return o;
}
const bob = (t, on) => on ? -Math.abs(Math.sin(t * Math.PI * 4)) * 14 : 0;

// —— props in hands (local coordinates of the holder) ——
function scissors(h, t, open = 0) {
  push(); translate(h[0] + 10, h[1] - 10); rotate(-.6);
  const a = .18 + open * .25;
  for (const sd of [-1, 1]) { push(); rotate(sd * a); shape(spline([[0, -6], [70, -3], [76, 0], [0, 6]]), { fill: '#c9ccd6', lw: 4 }); shape(ell(-22, sd * 12, 13, 10, 14), { fill: '#e8433b', lw: 4 }); pop(); }
  dot(0, 0, 4, '#1b1422'); pop();
}
function clippers(h, t, on = 0) {   // held upright: the body hangs below the hand, the blade 86 units down; it shakes while it runs
  const j = on ? (Math.floor(t * 24) % 2 ? 3 : -3) : 0;
  push(); translate(h[0] + j, h[1]);
  shape(rr(-18, -14, 36, 88, 14), { fill: '#3a3340', lw: 5 }); shape(rect(-22, 70, 44, 18), { fill: '#c9ccd6', lw: 4 });
  if (on) for (const sd of [-1, 1]) stroke([[sd * 30, 50], [sd * 42, 66]], 4);   // buzz lines
  pop();
}
function broom(h) { stroke([[h[0] - 10, h[1] - 120], [h[0] + 60, -40]], 9, { line: '#7a4a32' }); shape(spline([[h[0] + 20, -50], [h[0] + 100, -50], [h[0] + 120, 0], [h[0] + 0, 0]]), { fill: '#e9c46a', lw: 5 }); }

function shopWorld(t) {
  const tq = q(t), d = dayOf(t);
  shop(t, { doorOpen: doorOpen(t), bell: Math.max(...[...T.tin, ...T.tout.map(x => x + WALK), T.run + .3, T.burst].map(a => t > a - .2 && t < a + .8 ? 1 - (t - a + .2) : 0)) });
  photo(1640, 720, 1, { glint: t > T.home ? seg(t, T.home + .2, T.home + .4) * (1 - seg(t, T.home + .6, T.home + .9)) : 0 });
  calendar(600, 640, 12 + d, t, d > 0 ? T.tear[d - 1] : -1);
  hairPile(1300, 6 + d * 6 + (t > T.sus ? 4 : 0));
  // the queue: back to front
  QUEUE[d].map((k, i) => [k, i]).reverse().forEach(([k, i]) => MEMBERS.find(m => m.k === k).f(SLOT[i], tq, bobOf(d, i, t)));
  // the customer in the chair: enjoys the buzz, then feels the draft on his head and rolls his eyes up to it
  const pass = t > T.slip - .05 && t < T.slip + PASS, shock = t > T.slip + .75;
  chairBack(1300);
  musteri({ x: HEAD.x, y: HEAD.y, s: HEAD.s, face: -1, t: tq, v: 0, legs: false,
    look: shock ? [.15, -1] : t > T.home ? [-.6, -.2] : [.5, -.1], lid: shock ? 0 : pass ? .75 : .5, brow: shock ? 1 : pass ? -.2 : 0,
    sm: shock ? -.7 : pass ? .6 : 0, o: shock ? .55 : 0, shaved: shaveK(t), shine: seg(t, T.slip + .95, T.slip + 1.45),
    jit: t > T.slip + .75 && t < T.slip + .95 ? 3 : 0, sq: shock && t < T.slip + .95 ? .05 : Math.sin(tq * 2.1) * .01 });
  cape(1290, 1095, {});
  chairFront(1300);
  tufts(t);
  // the barber on his crate (he is short)
  shape(rr(1430, FLOOR - 170, 190, 170, 8), { fill: '#a46a3c', lw: 7, shade: () => { stroke([[1440, FLOOR - 85], [1610, FLOOR - 85]], 4); } });
  barber(t, tq);
  // the man
  const m = man(t);
  if (m) {
    const asking = mouthOpen('ADAM', t) > 0 || t > L(A[m.d]) - .1 && t < Lend(A[m.d]) + .2;
    const style = m.d === 1 && m.in !== undefined && m.in < 1 ? { jit: 4, lean: -.2 } : m.d === 2 && m.walk ? { lean: m.face * .55, sq: .05 } : {};
    const dk = (m.x - DOOR) / (STAND - DOOR);
    nail({ x: m.x, y: lerp(WALLF + 10, FLOOR, dk) + bob(t, m.walk), s: lerp(.8, .92, dk), face: m.face, t: tq, look: m.face > 0 ? [.9, -.1] : [1, 0], lid: .55, brow: asking ? .3 : 0,
      o: mouthOpen('ADAM', t), mw: mouthWide('ADAM', t), sm: -.3, blink: Math.floor(tq * 12) % 41 === 0, sq: Math.sin(tq * 2.2) * .012, ...style });
  }
  // the apprentice: sweeps, salutes, runs out, bursts back in, shows his phone
  apprentice(t, tq);
}

function barber(t, tq) {
  const d = dayOf(t), talking = mouthOpen('BERBER', t) > .05;
  const [cs, ce] = T.cnt[Math.min(d, 2)], counting = t > cs - .1 && t < ce + .1 && t < T.sus;
  const sus = t > T.sus && t < T.send, send = t > T.send && t < T.run + .6;
  const asking = t > L(18) - .1 && t < Lend(18) + .1, stunned = t > T.eve;
  const n = QSIZE[d], kk = counting ? Math.min(n - 1, Math.floor((t - cs) / (ce - cs) * n)) : 0;
  const work = Math.floor(tq * 6) % 2;
  let hR = [235, -420 + work * 8], hL = [-90, -300], tool = 'scissors';
  if (counting) hR = [210 + kk * 6, -360 - (kk % 2) * 14], tool = 'comb';
  else if (talking && !asking) hR = [200, -400];
  if (sus) hR = [110, -330], hL = [-70, -330];
  if (send) hR = [280, -500 + Math.sin(t * 20) * 8];
  if (asking) { const k = Math.floor(tq * 3) % 2; hR = [190, -420 - k * 30]; hL = [-150, -330 - (1 - k) * 30]; }
  if (t > L(19)) {   // clippers held just above the forehead; in the hold they drop onto the head and run front to back
    const [bx, by] = lane(shaveK(t)), lift = 30 * (1 - seg(t, T.slip - .08, T.slip));
    hR = [1530 - bx, by - lift - (FLOOR - 170) - 86]; tool = 'clippers';
    if (t > T.slip + PASS) { const k = seg(t, T.slip + PASS, T.slip + PASS + .2); hR = [hR[0] - k * 30, hR[1] - k * 40]; }
  }
  const lookDown = t > T.slip + 1.15;
  cemil({ x: 1530, y: FLOOR - 170, s: 1, face: -1, t: tq,
    look: lookDown ? [.9, .7] : stunned ? [1, -.1] : asking || t > L(17) ? [1, .1] : counting ? [1, .1] : talking || (t > L(A[0]) && t < T.sus && !counting) ? [1, -.05] : [.7, .4],
    lid: sus ? .7 : stunned ? 0 : .2, brow: sus ? -.8 : stunned ? 1 : asking ? .8 : .3, sm: sus ? -.4 : stunned ? -.9 : -.3,
    o: mouthOpen('BERBER', t), mw: mouthWide('BERBER', t), jaw: stunned && t > Lend(20) ? seg(t, Lend(20), Lend(20) + .3) * .7 : 0,
    curl: sus ? .25 + Math.sin(t * 14) * .25 : lookDown ? lerp(.25, -.5, seg(t, T.slip + 1.15, T.slip + 1.4)) : .25,
    sweat: stunned && t > Lend(20) + .3 ? 1 : 0, jit: lookDown && t < T.slip + 1.3 ? 3 : 0,
    blink: Math.floor(tq * 12) % 53 === 0 && !stunned, sq: Math.sin(tq * 2.4) * .012, handR: hR, handL: hL,
    holdR: h => tool === 'scissors' ? scissors(h, t, work) : tool === 'clippers' ? clippers(h, t, t > T.slip - .1 && t < T.slip + PASS + .15) : comb(h) });
}
function comb(h) { push(); translate(h[0] + 20, h[1] - 16); rotate(-.3); shape(rr(0, -8, 70, 18, 4), { fill: '#3d6fa8', lw: 4 }); for (let i = 0; i < 7; i++) stroke([[6 + i * 9, 10], [6 + i * 9, 24]], 3); pop(); }

function apprentice(t, tq) {
  if (t < T.run + .5) {   // in the shop, right: sweeps, salutes, runs to the door
    const runK = seg(t, T.run, T.run + .5), salute = t > T.send + .4 && t < T.run;
    const x = lerp(1760, DOOR, ss(runK)), dk = clamp((x - DOOR) / 500);
    emre({ x, y: lerp(WALLF + 10, FLOOR, dk) + bob(t, runK > 0), s: lerp(.8, .9, dk), face: runK > 0 ? -1 : -1, t: tq, lean: runK > 0 ? .8 : 0, look: salute ? [1, -.1] : t > T.send ? [-1, 0] : [.3, .9],
      lid: t > T.send ? 0 : .4, brow: salute ? .6 : 0, sm: salute ? .7 : .3, handR: salute ? [40, -530] : runK > 0 ? [90, -300] : [60, -260], handL: runK > 0 ? [-80, -260] : undefined,
      holdR: !salute && runK === 0 ? broom : undefined, sq: Math.sin(tq * 2.6) * .012 });
    if (runK > 0 && runK < 1) dust(x + 120, FLOOR - 20, 1, T.run, t);
    return;
  }
  if (t < T.burst) return;
  const inK = seg(t, T.burst, T.burst + .35), x = lerp(DOOR, 960, eo(inK)), dk = clamp((x - DOOR) / 500);
  const showing = t > T.show, panting = t < L(19);
  emre({ x, y: lerp(WALLF + 10, FLOOR, dk) + bob(t, inK < 1), s: lerp(.8, .9, dk), face: 1, t: tq, lean: inK < 1 ? .6 : panting ? .3 : 0, look: showing ? [.9, -.1] : [.9, 0], lid: 0, brow: .7,
    o: mouthOpen('ÇIRAK', t) + (panting && inK >= 1 ? (Math.floor(tq * 6) % 2) * .3 : 0), sm: .1, panic: panting && inK >= 1, jit: inK < 1 ? 4 : 0,
    handR: showing ? [110, -560] : undefined, handL: showing ? [60, -500] : undefined, sq: panting ? Math.sin(t * 9) * .03 : Math.sin(tq * 2.6) * .012 });
  if (showing) phoneShow(x + 120, FLOOR - 560 * .9 - 30, .8, t);
}

// hair tufts thrown off the clippers: each leaves the lane as the blade passes, spins up and back, lands on the cape
function tufts(t) {
  for (let i = 0; i < 7; i++) {
    const k = (i + .5) / 7, t0 = T.slip + PASS * k, lt = t - t0;
    if (lt < 0) continue;
    const [x0, y0] = lane(k), vx = 140 + hash(i * 3.1) * 260, vy = -420 - hash(i * 5.7) * 260, land = 1150 + hash(i * 2.3) * 60;
    const tl = (-vy + Math.sqrt(vy * vy - 4 * 1300 * (y0 - land))) / (2 * 1300), f = Math.min(lt, tl);   // tl: when it lands
    const x = x0 + vx * f, y = y0 + vy * f + 1300 * f * f;
    push(); translate(x, y); rotate(f * (6 + i));
    shape(spline([[-16, 4], [-8, -12], [2, -4], [8, -16], [16, 2], [0, 10]]), { fill: '#2a1d18', lw: 4 });
    pop();
  }
}

function streetWorld(t) {
  const tq = q(t);
  const inK = seg(t, T.inDoor - .2, T.inDoor + .3);
  street(t, { doorOpen: t > T.inDoor - .3 && t < T.inDoor + .8 ? 1 : 0 });
  // the man walks to the pink door and goes in
  if (t < T.inDoor + .25) {
    const k = clamp((t - T.st) / (T.inDoor - T.st));
    nail({ x: lerp(2650, 3700, k), y: FLOOR + bob(t, k < 1), s: .92, face: 1, t: tq, look: [1, 0], lid: .55, sm: -.2, sq: Math.sin(tq * 2.2) * .012 + inK * .1 });
  }
  // the apprentice tiptoes behind with his phone up, hides by the lamp post, then runs back
  const backK = seg(t, T.back, T.back + .7);
  const xf = backK > 0 ? lerp(2990, 2300, ss(backK)) : lerp(2250, 2990, clamp((t - T.st) / (T.inDoor - T.st + .2)));
  emre({ x: xf, y: FLOOR + bob(t, backK > 0) - (backK === 0 ? Math.abs(Math.sin(t * 7)) * 8 : 0), s: .9, face: backK > 0 ? -1 : 1, t: tq,
    lean: backK > 0 ? .8 : -.15, look: backK > 0 ? [1, 0] : [1, -.1], lid: backK > 0 ? 0 : .3, brow: backK > 0 ? 1 : .2, sm: backK > 0 ? -.5 : .4,
    filming: backK > 0 ? 0 : 1, panic: backK > 0, sq: Math.sin(tq * 2.6) * .012 });
  if (backK > 0 && backK < 1) dust(xf + 140, FLOOR - 20, 1.1, T.back, t);
}

function world(t) { if (t > Ledge(16) && t < Ledge(17)) streetWorld(t); else shopWorld(t); }

// —— camera ——
let SHOT_LT = 9;
function cam(t, cx, cy, z, { shake = 0, rot = 0 } = {}) {
  frame(t);
  z *= 1 + .08 * (1 - eo(clamp(SHOT_LT / .5)));
  cx += Math.sin(t * .63) * 9 / z; cy += Math.cos(t * .81) * 7 / z; rot += Math.sin(t * .37) * .006;
  const k = Math.floor(t * 24), sx = shake ? (hash(k * 1.3) - .5) * shake : 0, sy = shake ? (hash(k * 2.1 + 5) - .5) * shake : 0;
  translate(W / 2 + sx, H / 2 + sy); rotate(rot); scale(z); translate(-cx, -cy);
}
const after = t => drawSubs(g, t, { names: NAMES, pill });

const SH = [];
const S = (a, b, f) => { SH.push([a, b]); shot(a, b, (lt, t) => { SHOT_LT = lt; f(lt, t, b - a); world(t); }); };
const wide = (lt, t, d) => cam(t, lerp(640, 680, lt / d), 700, lerp(.9, .94, lt / d));
const ask = z => (lt, t, d) => cam(t, 360, 1080, lerp(z, z * 1.08, ss(lt / d)), { rot: .02 });
const count = d => (lt, t, dd) => cam(t, lerp(1000, 560, ss(clamp(lt / dd))), 1160, 1.35);
const enter = (lt, t, d) => cam(t, 300, 1040, lerp(1.0, 1.1, lt / d));
// day 1
S(0, L(1) - .05, wide);
S(L(1) - .05, L(2), ask(1.45));
S(L(2), Ledge(4), count(0));
S(Ledge(4), Ledge(5), (lt, t, d) => cam(t, 480, 760, lerp(1.0, 1.05, lt / d)));
// day 2: the calendar, the door bangs open
S(Ledge(5), T.tin[1] - .25, (lt, t, d) => cam(t, 600, 660, lerp(2.2, 2.4, lt / d)));
S(T.tin[1] - .25, L(6) - .05, (lt, t, d) => cam(t, 300, 1040, 1.05, { shake: t > T.tin[1] - .15 && t < T.tin[1] + .2 ? 18 : 0 }));
S(L(6) - .05, L(7), ask(1.65));
S(L(7), Ledge(9), count(1));
S(Ledge(9), Ledge(10), wide);
// day 3
S(Ledge(10), T.tin[2] - .2, (lt, t, d) => cam(t, 600, 660, lerp(2.4, 2.6, lt / d), { rot: -.03 }));
S(T.tin[2] - .2, L(11) - .05, enter);
S(L(11) - .05, L(12), ask(1.9));
S(L(12), w(wordOf(13, 4)) - .1, count(2));
S(w(wordOf(13, 4)) - .1, Ledge(14), (lt, t, d) => cam(t, 1440, 920, lerp(1.6, 1.7, lt / d)));   // "45 dakikaya sıra sana gelir"
S(Ledge(14), Ledge(15), (lt, t, d) => cam(t, 480, 760, lerp(1.0, 1.05, lt / d)));
// suspicion, the apprentice goes
S(Ledge(15), T.send - .05, (lt, t, d) => cam(t, 1490, 880, lerp(2.0, 2.7, ss(lt / d)), { rot: .03 * ss(lt / d) }));
S(T.send - .05, Ledge(16), (lt, t, d) => cam(t, lerp(1420, 760, ss(clamp((t - T.run) / .6))), 900, 1.0));
// the street
S(Ledge(16), Ledge(17), (lt, t, d) => { const k = clamp((t - T.st) / (T.inDoor - T.st)); cam(t, t < T.back ? lerp(2650, 3450, ss(k)) : lerp(3450, 2900, ss(clamp((t - T.back) / .6))), 980, 1.0); });
// back in the shop
S(Ledge(17), L(18) - .05, (lt, t, d) => cam(t, lerp(520, 820, ss(lt / d)), 860, 1.0, { shake: lt < .3 ? 10 : 0 }));
S(L(18) - .05, Ledge(19), (lt, t, d) => cam(t, lerp(1300, 1350, lt / d), 960, lerp(1.0, 1.08, lt / d)));
S(Ledge(19), T.home, (lt, t, d) => cam(t, 1060, 1000, lerp(1.4, 1.55, lt / d)));
S(T.home, Lend(20) + .1, (lt, t, d) => cam(t, 1640, 800, lerp(2.6, 3.2, eo(clamp(lt / .6)))));
S(Lend(20) + .1, endStart(), (lt, t, d) => cam(t, 1400, 1060, lerp(1.9, 2.1, ss(lt / d)), { shake: t > T.slip + .75 && t < T.slip + .9 ? 8 : 0 }));
seam(Ledge(5), 'whip', .18); seam(Ledge(10), 'whip', .18); seam(Ledge(16), 'whip', .18); seam(Ledge(17), 'whip', .18);
seam(endStart(), 'portal', .5);
endCard({ follow: CFG.follow });

const overlay = t => {
  if (t < 2.2) { push(); setM([1, 0, 0, 1, 0, 0]); titleCard('BERBER', .05, t, { y: 270, size: 110 }); pop(); if (t > .1) reportText('title', 'BERBER', 220, 230, 860, 360); }
};
await boot({ canvas: g.canvas, fonts: ['800 58px "Baloo 2"'], overlay, after });
