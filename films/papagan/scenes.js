// Papağan — one hotel room, two times (night, morning). world(t) draws the set and every character from the timeline;
// each shot only moves the camera. Script lines 0..26 (see script.txt). Never hard-code seconds.
import { clamp, lerp, seg, ss, eo, ei, back, hash } from '/core/lib.js';
import { init, frame, W, H, push, pop, translate, scale, rotate, setM, reset, fillOnly, rect, shape, ell, spline, stroke } from './engine/styles/scifi-toon/toon.js';
import { titleCard, dust } from './engine/styles/scifi-toon/props.js';
import { kerem, KEREM } from './engine/cast/scifi-toon/kerem.js';
import { leyla, LEYLA } from './engine/cast/scifi-toon/leyla.js';
import { pasa, perch, PASA } from './engine/cast/scifi-toon/pasa.js';
import { TL, w, L, Lend, Ledge, wordOf, q, mouthOpen, mouthWide } from './engine/core/js/time.js';
import { shot, seam, ev, boot, reportText, setHold, endStart } from './engine/core/js/film.js';
import { drawSubs } from './engine/core/js/subs.js';
import { endCard } from './engine/core/js/brand.js';
import { pill } from './engine/styles/scifi-toon/ui.js';   // also registers the 'whip' seam
import { room, suitcase, flyer, hearts, NIGHT, MORNING } from './set.js';

const g = init(document.getElementById('c'));
const CFG = await (await fetch('film.json')).json();
const NAMES = { KOCA: { label: 'KOCA', color: KEREM.color }, KADIN: { label: 'KADIN', color: LEYLA.color }, PAPAĞAN: { label: 'PAPAĞAN', color: PASA.color } };
setHold(CFG.hold);

// —— key times (all from the timeline) ——
const T = {
  enter: 0, flap: L(3) - .3, uneasy: L(4), glare: L(6), shout: L(7), blown: L(7) + .1, cower: L(9),
  spin: L(10) + .15, dark: L(11) + .2, morning: Ledge(12), bags: L(13),
  press: L(15), pop: [L(16) + .1, L(16) + .8, L(17) + .3], idea: L(18) + .2,
  drag: L(19) + .2, climb: L(20) + .3, top: L(20) + 1.6, ready: L(21),
  perk: L(22) + .3, peek: L(23) + .4, spinBack: L(25) - .25, punch: L(25),
  jump: Lend(26) + .3, slam: Lend(26) + .85,
};
T.wardrobeTop = 640;

// —— sound events ——
ev(.2, 'creak'); ev(.4, 'slide', { gain: .8 }); ev(1.6, 'slide', { gain: .6 }); ev(T.flap, 'flutter'); ev(T.flap + .4, 'squeak');
ev(T.uneasy + .3, 'blip'); ev(T.glare, 'whoosh'); ev(T.shout + .05, 'whoosh'); ev(T.blown, 'wobble'); ev(L(8) + .2, 'bonk', { gain: .5 });
ev(T.spin, 'swish'); ev(T.spin + .15, 'squeak'); ev(T.dark, 'click'); ev(T.dark + .6, 'sparkle', { gain: .5 });
ev(T.morning + .1, 'flutter', { gain: .4 }); ev(T.bags + .2, 'ding', { gain: .3 }); ev(T.bags + 1.2, 'wobble', { gain: .4 });
ev(T.press, 'thump', { gain: .6 }); T.pop.forEach((t, k) => { ev(t, 'boing'); ev(t + .05, 'pop'); }); ev(L(17) + 1.2, 'thump', { gain: .6 });
ev(T.idea, 'ding'); ev(T.drag, 'slide'); ev(T.climb, 'squeak'); ev(T.climb + .5, 'squeak', { gain: .6 }); ev(T.top, 'thump', { gain: .5 }); ev(T.top + .1, 'tada', { gain: .4 });
ev(T.perk, 'wobble'); ev(T.peek, 'squeak', { gain: .5 }); ev(T.spinBack, 'whistle_up'); ev(T.spinBack + .2, 'swish'); ev(T.punch, 'flutter');
ev(T.jump, 'whistle_down'); ev(T.slam, 'crash'); ev(T.slam + .02, 'thump'); ev(T.slam + .1, 'boing'); ev(T.slam + .5, 'kazoo'); ev(endStart() + .1, 'pop');
// music
ev(0, 'music', { cue: 'title' }); ev(1, 'music', { cue: 'theme' }); ev(T.shout, 'music', { cue: 'tension' }); ev(T.dark, 'music', { cue: 'mystic' });
ev(T.morning, 'music', { cue: 'theme' }); ev(T.climb, 'music', { cue: 'tension' }); ev(T.punch, 'music', { cue: 'silence' }); ev(endStart(), 'music', { cue: 'end' });

const PERCH = { x: 900, y: 1500 }, PARROT_Y = PERCH.y - 524;

function world(t) {
  const tq = q(t), morning = t >= T.morning, P = morning ? MORNING : NIGHT;
  room(t, P, { messy: morning });
  // —— the parrot on its perch ——
  perch(PERCH.x, PERCH.y);
  // turn: 0 faces us, 1 faces the wall. A fast flip to the wall, small twitches when it hears the plan,
  // then 1.5 spins back to face us on the punchline (the value runs 1 -> 4, and 4 mod 2 = 0).
  let turnVal = 0;
  if (t >= T.spin) turnVal = seg(t, T.spin, T.spin + .25);
  if (t >= T.peek) turnVal = 1 - .12 * Math.abs(Math.sin((t - T.peek) * 3));
  if (t >= T.spinBack) turnVal = 1 + 3 * eo(seg(t, T.spinBack, T.spinBack + .3));
  const shout = t > T.blown && t < Lend(8) + .2;
  pasa({ x: PERCH.x, y: PARROT_Y + (t > T.flap && t < T.flap + .4 ? -40 * Math.sin(seg(t, T.flap, T.flap + .4) * Math.PI) : 0), s: .95, t: tq, turn: turnVal % 2,
    look: t < T.uneasy ? [-.5, .3] : t < T.glare ? [-.6, .2] : [-.7, .1], lid: t < T.shout ? .25 : 0,
    blown: shout ? .8 + .2 * Math.sin(tq * 30) : 0, jit: shout ? 5 : t > T.spin && t < T.morning ? 2 : 0, sweat: t > T.spin && t < T.dark + 2,
    bags: morning, crest: t > T.perk ? ss(seg(t, T.perk, T.perk + .4)) : 0, flap: t > T.flap && t < T.flap + .5 || t > T.punch,
    wings: t > T.punch ? .9 : 0, bigEyes: t > T.punch, o: mouthOpen('PAPAĞAN', t) * 1.1 });
  // —— the couple ——
  if (!morning) {
    const walk = eo(seg(t, T.enter, T.enter + 2.2));
    const kx = lerp(-260, 640, walk), lx = lerp(-200, 330, eo(seg(t, .5, 2.9)));   // Kerem near the parrot, Leyla on the left: his gestures never cross her face
    const kStep = walk < 1 ? Math.abs(Math.sin(tq * 9)) * 14 : 0;
    suitcase(kx - 150, 1590, .7, t, { lid: 1, stuff: .3 });
    const kMouth = mouthOpen('KOCA', t), angry = t > T.glare && t < T.cower + .6;
    kerem({ x: kx, y: 1590 - kStep, s: 1.02, t: tq, look: angry ? [1, -.3] : t > T.uneasy ? [.6, 0] : [.5, 0], brow: angry ? -1 : 0,
      o: kMouth * 1.2, mw: mouthWide('KOCA', t), sm: angry ? -.6 : .2, lean: angry ? .5 : 0, sq: Math.sin(tq * 2.4) * .012,
      handR: angry ? [150, -520 - (Math.floor(tq * 12) % 2) * 20] : [70, -250], handL: walk < 1 ? [-170, -200] : undefined });
    const lUneasy = t > T.uneasy && t < T.glare + .5;
    leyla({ x: lx, y: 1590, s: 1.0, t: tq, face: 1, look: lUneasy ? (Math.floor(tq * 2) % 2 ? [-.9, -.2] : [.9, -.2]) : t > T.glare ? [.6, 0] : [.5, 0],
      brow: lUneasy ? .9 : 0, sm: lUneasy ? -.4 : .4, lid: lUneasy ? .3 : .1, sq: Math.sin(tq * 2.1 + 1) * .012,
      handR: lUneasy ? [100, -330] : undefined });
  } else {
    // morning: the suitcase, the struggle, the wardrobe
    const dragK = ss(seg(t, T.drag, T.drag + 1.0));
    const sx = lerp(560, 190, dragK);
    const pressing = t > T.press && t < T.idea;
    const bounce = pressing ? Math.abs(Math.sin((t - T.press) * 7)) : 0;
    const flatK = t > T.slam ? Math.exp(-(t - T.slam) * 1.2) : 0;
    suitcase(sx, 1600, 1.0, t, { lid: t > T.slam ? 1 : pressing ? .9 - bounce * .15 : .78, bulge: pressing ? bounce : t > T.slam ? 0 : .6, stuff: t > T.slam ? .2 : 1, squash: t > T.slam ? .3 * Math.exp(-(t - T.slam) * 5) : 0 });
    T.pop.forEach((tp, k) => flyer(['sock', 'shoe', 'duck'][k], sx + (k - 1) * 80, 1440, tp, t, { vx: [-320, 360, 120][k], vy: [-1100, -1000, -1300][k] }));
    if (t > T.slam) for (const k of [0, 1, 2]) flyer(['sock', 'sock', 'duck'][k], sx, 1450, T.slam + k * .04, t, { vx: [-500, 520, 60][k], vy: [-900, -800, -1400][k] });
    if (t > T.slam) dust(sx, 1590, 1.2, T.slam, t);
    // Kerem: presses the lid, then crouches holding it under the wardrobe; flattened at the slam
    const kHold = t > T.drag;
    kerem({ x: kHold ? sx + 150 : 400, y: 1600, s: 1.02, t: tq, face: kHold ? -1 : 1, crouch: pressing ? .5 + bounce * .2 : kHold ? .7 : 0,
      look: t > T.climb ? [-.4, -1] : pressing ? [.3, .8] : [.6, 0], brow: pressing ? -.6 : t > T.climb ? .9 : 0, sweat: pressing || t > T.climb,
      o: mouthOpen('KOCA', t), sm: pressing ? -.7 : t > T.slam ? -.2 : 0, flat: flatK * .9, jit: pressing ? 2 : 0,
      handR: pressing ? [110, -200 + bounce * 20] : kHold ? [130, -110] : undefined, handL: pressing ? [-60, -210 + bounce * 20] : kHold ? [-10, -100] : undefined,
      blink: t > T.slam && t < T.slam + 1.2 });
    // Leyla: presses, gets the idea, climbs the wardrobe, jumps
    let lx = pressing ? 700 : 640, ly = 1600, lean = 0, ls = 1;
    const climbK = seg(t, T.climb, T.top);
    if (t > T.climb) { lx = lerp(640, 180, ss(climbK)); ly = lerp(1600, T.wardrobeTop, ss(climbK)) - Math.sin(climbK * Math.PI * 4) * 30 * (1 - climbK); }
    if (t > T.jump) { const j = seg(t, T.jump, T.slam); lx = lerp(180, sx, j); ly = lerp(T.wardrobeTop, 1440, j * j) - Math.sin(j * Math.PI) * 220; lean = -.6 * Math.sin(j * Math.PI); }
    if (t > T.slam) { lx = sx; ly = 1440 + 10 * Math.exp(-(t - T.slam) * 6) * Math.cos((t - T.slam) * 25); }
    const idea = t > T.idea && t < T.climb;
    leyla({ x: lx, y: ly, s: ls, t: tq, face: -1, lean, look: t > T.climb ? [.4, .6] : idea ? [-.3, -.8] : pressing ? [-.2, .8] : [-.5, 0],
      brow: idea ? -.2 : pressing ? -.5 : 0, sm: idea || t > T.top ? .8 : pressing ? -.6 : .2, o: mouthOpen('KADIN', t), mw: mouthWide('KADIN', t),
      handR: pressing ? [70, -220 + bounce * 20] : idea ? undefined : t > T.climb && t < T.top ? [60, -560 + (Math.floor(tq * 12) % 2) * 40] : t > T.jump && t < T.slam ? [90, -560] : undefined,
      handL: pressing ? [-80, -220 + bounce * 20] : idea ? [-150, -540] : t > T.jump && t < T.slam ? [-90, -560] : undefined, veil: 260 + (t > T.top ? 120 : 0), sq: t > T.slam ? .15 * Math.exp(-(t - T.slam) * 6) : Math.sin(tq * 2.1) * .012 });
    if (idea) { push(); translate(lx + 10, ly - 640); const k = Math.floor((t - T.idea) * 12); scale(k < 1 ? .5 : k < 2 ? 1.15 : 1);
      shape(ell(0, 0, 34, 38, 24), { fill: '#fff3d6', lw: 6 }); shape(rect(-16, 34, 32, 22), { fill: '#a8a8b8', lw: 5 });
      for (let a = 0; a < 6; a++) { const r = a / 6 * Math.PI * 2; stroke([[Math.cos(r) * 50, Math.sin(r) * 50], [Math.cos(r) * 70, Math.sin(r) * 70]], 5); } pop(); }
  }
  // night: the lights go out; the parrot sweats at the wall, little hearts float over the bed
  if (!morning && t > T.dark) {
    const a = ss(seg(t, T.dark, T.dark + .15)) * .86;
    push(); setM([1, 0, 0, 1, 0, 0]); fillOnly(rect(-50, -50, W + 100, H + 100), '#140f24', { boil: 0, alpha: a }); pop();
    hearts(560, 1260, t, 3);
  }
}

// —— camera: every cut settles in, the frame drifts a little ——
let SHOT_LT = 9;
function cam(t, cx, cy, z, { shake = 0, rot = 0 } = {}) {
  frame(t);
  z *= 1 + .08 * (1 - eo(clamp(SHOT_LT / .5)));
  cx += Math.sin(t * .63) * 9 / z; cy += Math.cos(t * .81) * 7 / z; rot += Math.sin(t * .37) * .006;
  const k = Math.floor(t * 24), sx = shake ? (hash(k * 1.3) - .5) * shake : 0, sy = shake ? (hash(k * 2.1 + 5) - .5) * shake : 0;
  translate(W / 2 + sx, H / 2 + sy); rotate(rot); scale(z); translate(-cx, -cy);
}
const after = t => drawSubs(g, t, { names: NAMES, pill });

// —— shots ——
const A = [0, Ledge(3), Ledge(4), Ledge(6), Ledge(7), Ledge(9), Ledge(10), Ledge(12), Ledge(13), Ledge(15), Ledge(18), Ledge(19), Ledge(22), Ledge(25), Lend(26) + .1, endStart()];
const S = (i, f) => shot(A[i], A[i + 1], (lt, t) => { SHOT_LT = lt; f(lt, t, A[i + 1] - A[i]); world(t); });
S(0, (lt, t, d) => cam(t, lerp(420, 560, ss(lt / d)), 1020, lerp(1.0, 1.1, lt / d)));                 // 1 wide: they come in
S(1, (lt, t, d) => cam(t, 890, 780, lerp(2.0, 2.15, lt / d)));                                         // 2 the parrot lands on its perch
S(2, (lt, t, d) => cam(t, 350, 1110, lerp(1.9, 2.0, lt / d)));                                         // 3 Leyla is uneasy
S(3, (lt, t, d) => cam(t, 660, 1040, 1.95));                                                           // 4 Kerem turns to the parrot
S(4, (lt, t, d) => cam(t, lerp(640, 800, ss(lt / d)), 1090, 1.25, { shake: 8 }));   // faces above the caption band                      // 5 he shouts across the room
S(5, (lt, t, d) => cam(t, 890, 760, 2.3, { shake: 6 }));                                               // 6 the parrot's feathers blow back
S(6, (lt, t, d) => cam(t, lerp(820, 640, ss(lt / d)), 980, lerp(1.5, 1.1, ss(lt / d))));              // 7 it flips to the wall; lights out
S(7, (lt, t, d) => cam(t, 560, 1020, lerp(1.0, 1.08, lt / d)));                                        // 8 morning
S(8, (lt, t, d) => cam(t, 890, 760, lerp(2.0, 2.2, lt / d)));                                          // 9 the parrot, still at the wall
S(9, (lt, t, d) => cam(t, 560, 1330, lerp(1.45, 1.55, lt / d)));                                       // 10 the suitcase will not shut
S(10, (lt, t, d) => cam(t, 640, 1100, 1.85));                                                          // 11 Leyla's idea
S(11, (lt, t, d) => cam(t, lerp(500, 380, ss(lt / d)), lerp(1080, 900, ss(lt / d)), .94));            // 12 the wardrobe climb
S(12, (lt, t, d) => cam(t, 890, lerp(780, 740, ss(lt / d)), lerp(1.8, 2.5, ss(lt / d))));             // 13 the parrot's back, crest up
S(13, (lt, t, d) => cam(t, 890, 880, lerp(2.15, 2.3, lt / d), { shake: lt < .3 ? 10 : 0 }));          // 14 punchline, face to camera
S(14, (lt, t, d) => cam(t, lerp(380, 460, lt / d), 1000, .9, { shake: t > T.slam && t < T.slam + .2 ? 24 : 0 }));   // 15 the jump
seam(T.morning, 'whip', .3); ev(T.morning - .05, 'swish');
seam(Ledge(10), 'whip', .22); seam(Ledge(19), 'whip', .22); ev(Ledge(19) - .05, 'swish');
seam(endStart(), 'portal', .5);
endCard({ follow: CFG.follow });

const overlay = t => {
  if (t < 3.2) { push(); reset(); titleCard('PAPAĞAN', .1, t, { y: 420, size: 120 }); pop(); if (t > .2) reportText('title', 'PAPAĞAN', 180, 330, 900, 510); }
};
await boot({ canvas: g.canvas, fonts: ['800 58px "Baloo 2"'], overlay, after });
