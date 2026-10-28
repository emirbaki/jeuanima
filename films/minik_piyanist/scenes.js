// Minik Piyanist — one bar, one world. world(t) draws the whole set from the timeline; each shot only moves the camera.
// Every time comes from script lines (L, Lend, Ledge) or words (w, wordOf). Script lines: see script.txt (0..24).
import { clamp, lerp, seg, ss, eio, eo, back, hash } from '/core/lib.js';
import { init, frame, W, H, push, pop, translate, scale, rotate, setM, reset, screenRect, fillOnly, rect } from './engine/styles/scifi-toon/toon.js';
import { barBack, counter, stool, shotGlass, lamp, liverBubble, notes, titleCard, paperTag, dust, bill, moth, BAR } from './engine/styles/scifi-toon/props.js';
import { portal, PORTAL } from './engine/styles/scifi-toon/portal.js';
import { nail, NAIL } from './engine/cast/scifi-toon/nail.js';
import { cemil, CEMIL } from './engine/cast/scifi-toon/cemil.js';
import { piyanist, piano } from './engine/cast/scifi-toon/piyanist.js';
import { cin } from './engine/cast/scifi-toon/cin.js';
import { yeniceri } from './engine/cast/scifi-toon/yeniceri.js';
import { TL, w, wb, L, Lend, Ledge, wordOf, q, mouthOpen, mouthWide } from './engine/core/js/time.js';
import { shot, seam, ev, boot, reportText, setHold, endStart } from './engine/core/js/film.js';
import { drawSubs } from './engine/core/js/subs.js';
import { endCard } from './engine/core/js/brand.js';
import { pill } from './engine/styles/scifi-toon/ui.js';   // also registers the 'whip' seam

const g = init(document.getElementById('c'));
const CFG = await (await fetch('film.json')).json();
const NAMES = { ADAM: { label: 'ADAM', color: NAIL.color } };
setHold(CFG.hold);                     // reaction after the punchline, before the end card

// —— key times (all from the timeline) ——
const T = {
  glass: [0, 1, 2].map(k => L(1) + .05 + k * .32),                   // "üç duble viski"
  drink: [0, 1, 2].map(k => Lend(1) + .25 + k * .34),
  bill: L(2) - .2, pocket: L(3) + .9, moth: L(3) + 1.3,
  finger: L(4), lean: L(6),
  reach: w(wordOf(7, 2)) - .3,                                          // "cebinden"
  pian: w(wordOf(8, 0)),                                                // "minik"
  piano: w(wordOf(9, 4)) - .1,                                          // "piyano"
  play: L(10) + .2, jaw: L(12) + .1,
  lamp: w(wordOf(14, 5)) - .25,                                         // "lamba"
  rub: L(15), open: w(wordOf(16, 0)) + .15,                             // "ortaya"
  cinUp: w(wordOf(16, 0)) + .6, trumpet: w(wordOf(16, 3)),             // "az duyan"
  wish: L(17), bubble: w(wordOf(18, 1)) - .1,                           // "iki yeni ciğer"
  hush: Ledge(19), nod: L(20) + .2,
  snap: L(21) + .3, drop: [w(wordOf(21, 6)), w(wordOf(21, 6)) + .42],  // "yeniçeri"
  panic: L(22), turn: L(23) + .5, punch: L(24),
  faint: Lend(24) + .75,                                               // Cemil faints after the punchline
};
const FLY = .55;                                                     // seconds from the portal to the floor
const yDrop = k => {
  const lt = TLt - (T.drop[k] - .2); if (lt < 0) return null;
  const f = clamp(lt / FLY), tx_ = k ? 1030 : 640, land = lt - FLY;
  return { x: lerp(820, tx_, f), y: lerp(560, 1330, f * f) - Math.sin(Math.PI * f) * 260, s: lerp(.35, .95, eo(f)),
    rot: (1 - eo(f)) * Math.PI * 2 * (k ? -1 : 1), cross: land > .28 ? 1 : 0,
    sq: land > 0 ? .28 * Math.exp(-land * 8) * Math.cos(land * 28) : -.12 * Math.sin(Math.PI * f),
    hop: land > .28 && land < .5 ? Math.sin((land - .28) / .22 * Math.PI) * 26 : 0,
    twirl: land > .4 ? .5 * Math.exp(-(land - .4) * 3) * Math.abs(Math.sin((land - .4) * 14)) : 0, flying: f < 1 };
};
let TLt = 0;

// —— sound events ——
T.glass.forEach(t => ev(t, 'slide')); T.glass.forEach(t => ev(t + .24, 'clink', { gain: .6 })); T.drink.forEach(t => ev(t, 'gulp')); T.drink.forEach(t => ev(t + .16, 'clink', { gain: .4 }));
ev(T.reach, 'zip'); ev(T.lamp - .7, 'zip'); ev(T.pian - .05, 'poof', { gain: .7 }); ev(T.piano + .1, 'plink'); ev(T.pian + .5, 'squeak', { gain: .5 });
ev(T.jaw + .2, 'bonk', { gain: .6 }); ev(T.rub - .2, 'poof', { gain: .5 }); ev(T.cinUp, 'whistle_up'); ev(T.trumpet + .05, 'honk');
ev(T.nod, 'wobble'); ev(T.panic + .2, 'wobble', { gain: .6 }); ev(T.faint, 'whistle_down', { gain: .7 }); ev(endStart() + .1, 'pop');
ev(T.bill, 'paper'); ev(T.pocket, 'cloth'); ev(T.moth, 'flutter'); ev(T.finger, 'blip'); ev(T.lean, 'squeak');
ev(T.pian, 'pop'); ev(T.piano, 'thump', { gain: .5 }); ev(T.jaw, 'boing'); ev(T.lamp, 'clank');
ev(T.lamp + .9, 'beep'); ev(T.rub, 'rub'); ev(T.open, 'portal_open'); ev(T.cinUp + 1.6, 'cough'); ev(T.trumpet, 'squeak');
ev(T.bubble, 'sparkle'); ev(T.nod, 'blip'); ev(T.snap, 'snap'); ev(T.snap + .1, 'portal_open');
T.drop.forEach((t, k) => { ev(t - .2, 'whistle_down'); ev(t + .35, 'crash', { gain: .8 }); ev(t + .36, 'thump'); ev(t + .63, 'tada', { gain: k ? .8 : .6 }); }); ev(T.turn - .05, 'whoosh'); ev(T.faint + .1, 'squeak'); ev(T.faint + .45, 'thump', { gain: .7 }); ev(T.faint + .7, 'kazoo');
// music cues (score.py reads them from events.json)
ev(0, 'music', { cue: 'title' }); ev(1.0, 'music', { cue: 'theme' }); ev(T.play, 'music', { cue: 'march' });
ev(T.lamp - .4, 'music', { cue: 'theme' }); ev(T.open, 'music', { cue: 'mystic' });
ev(T.panic, 'music', { cue: 'tension' }); ev(T.punch, 'music', { cue: 'silence' });
ev(endStart(), 'music', { cue: 'end' });

// —— the whole set at time t ——
function world(t) {
  TLt = t;
  const tq = q(t);
  barBack(t);
  // lamp wash: once the portal is open the back wall turns violet (characters keep their colours)
  const washA = seg(t, T.open, T.open + .6) * .42;
  if (washA > 0) screenRectWorld(PORTAL.wash, washA);
  const bigP = seg(t, T.snap, T.snap + .4) * (1 - seg(t, T.drop[1] + .5, T.drop[1] + 1.0));
  if (bigP > 0) portal(820, 330, 260, t, { open: bigP });            // behind the guards: they fly out of it
  // yeniçeri behind the counter
  for (const k of [0, 1]) {
    const d = yDrop(k); if (!d) continue;
    const cy = d.y - 380 * d.s;
    push(); translate(d.x, cy); rotate(d.rot); translate(-d.x, -cy);
    yeniceri({ x: d.x, y: d.y - d.hop, s: d.s, t: tq, v: k, face: -1, sq: d.sq, cross: d.cross, twirl: d.twirl, o: d.flying ? .7 : 0, sm: d.flying ? .3 : -.6,
      look: t > T.faint + .4 ? [k ? -.6 : .6, .9] : d.flying ? [0, -.6] : k ? [-.3, .2] : [-.6, .4], lid: d.flying ? 0 : .3, blink: Math.floor(tq * 12) % 41 === k * 7 });
    pop();
  }
  // Cemil
  const leanIn = seg(t, T.lean, T.lean + .4) * (1 - seg(t, T.pian - .4, T.pian));
  const jaw = t > T.jaw && t < T.lamp - .5 ? eo(seg(t, T.jaw, T.jaw + .2)) * .9 : 0;
  const panic = t > T.panic ? 1 : t > T.drop[0] + .3 ? .6 : 0;
  const hasBill = t > T.bill && t < T.finger + .6;
  const wishing = t > T.wish && t < T.hush;
  const fall = ss(seg(t, T.faint, T.faint + .45));
  push(); translate(860, 1260); rotate(fall * 1.25); translate(-860, -1260 + fall * 60);
  cemil({
    x: 860, y: 1260, s: 1.22, face: -1, t: tq, sq: Math.sin(tq * 2.9 + 1) * .015, lean: leanIn * .8 + (wishing ? .4 : 0),
    look: t > T.drop[0] ? [.7, -.6] : t > T.open ? [.3, -.7] : t > T.pian && t < T.lamp ? [.4, .8] : [.5, 0],
    lid: leanIn > .5 ? .45 : .05, jaw, blink: fall > .2, sweat: panic ? 3 : t > T.jaw && t < T.lamp ? 1 : 0, jit: panic ? 4 * panic : 0,
    brow: panic ? 1 : wishing ? .9 : leanIn > .5 ? -.4 : .4, sm: wishing ? .8 : -.5, o: wishing ? .3 + .25 * Math.abs(Math.sin(tq * 9)) : 0,
    towel: !(t > T.jaw + .15 && t < T.lamp),
    handR: hasBill ? [150, -240] : wishing ? [120, -420] : t > T.rub && t < T.open + .5 ? [210, -120] : undefined,
    holdR: hasBill ? h => bill(h[0] + 30, h[1] - 60, .8, -.1) : null,
    handL: wishing ? [-110, -430] : fall > 0 ? [-150, -460] : undefined,
  });
  pop();
  if (t > T.bubble && t < T.hush + .2) liverBubble(560, 520, .78, t, seg(t, T.bubble, T.bubble + .3) * (1 - seg(t, T.hush, T.hush + .2)));
  counter(t);
  // glasses on the counter
  T.glass.forEach((tg, k) => {
    if (t < tg) return;
    const slide = eo(seg(t, tg, tg + .25)), drunk = t > T.drink[k];
    const x = lerp(700, 400 - k * 50, slide);
    if (t < T.pian - .5) shotGlass(x, 1180, .8, { full: drunk ? 0 : 1, tilt: drunk ? Math.PI : 0 });
  });
  // the lamp and the portal from its spout
  const lampOn = t > T.lamp; let lampY = 0;
  if (lampOn) {
    // Nail shows the lamp in his hand, then puts it down on the counter just before they rub it
    const ly = t < T.rub - .45 ? lerp(1000, 1090, eo(seg(t, T.lamp, T.lamp + .3))) : lerp(1090, 1176, eo(seg(t, T.rub - .45, T.rub - .2)));
    const rubbing = t > T.rub && t < T.open + .3;
    lamp(350, ly, .55, 0, { glow: seg(t, T.rub, T.open), t, rub: rubbing ? 1 : 0 });
    dust(350, 1170, .8, T.rub - .2, t);
    lampY = ly;
  }
  const pOpen = seg(t, T.open, T.open + .45) * (1 - seg(t, T.cinUp + 1.4, T.cinUp + 1.9));
  if (pOpen > 0 && t < T.snap) portal(470, 1000, 130, t, { open: pOpen, sx: .9 });
  // the genie
  if (t > T.cinUp) {
    const rise = eo(seg(t, T.cinUp, T.cinUp + 1.3));
    const tr = t > T.hush ? 1 : ss(seg(t, T.trumpet, T.trumpet + .4)) * (1 - seg(t, T.trumpet + 2.2, T.trumpet + 2.6));
    const sn = t > T.snap - .2 && t < T.snap + .5 ? ss(seg(t, T.snap - .2, T.snap)) : 0;
    cin({ x: 540, y: 1000 - rise * 40, s: .82, face: -1, t: tq, rise, tail: [120, 170], trumpet: tr,
      nod: t > T.nod && t < T.nod + 1.6 ? seg(t, T.nod, T.nod + 1.6) : 0, cough: t > T.cinUp + 1.5 && t < T.cinUp + 2.6,
      look: t > T.wish ? [.8, .2] : [.4, .3], lid: t > T.hush && t < T.nod ? .65 : .45, snap: sn, sm: t > T.nod ? .5 : -.2 });
  }
  // the pianist and his piano on the counter
  if (t > T.pian) {
    const pp = back(seg(t, T.pian, T.pian + .3), 1.6);
    if (t > T.piano) piano(560, 1180, .34 * back(seg(t, T.piano, T.piano + .25), 1.6), { t, keysDown: t > T.play && t < T.open });
    const playing = t > T.play && t < T.open;
    const bowing = t > T.pian + .5 && t < T.piano - .1;
    piyanist({ x: playing ? 640 : 660, y: 1180, s: .36 * pp, face: playing ? -1 : -1, t: tq, play: playing ? 1 : 0, bow: bowing ? ss(seg(t, T.pian + .5, T.pian + .9)) * (1 - ss(seg(t, T.piano - .5, T.piano - .1))) : 0,
      look: t > T.punch + 1 ? [-.2, .4] : t > T.drop[0] ? [.6, -.8] : t > T.open ? [.5, -.6] : [-.4, 0], lid: t > T.punch + 1 ? .5 : .15, sm: t > T.drop[0] ? -.4 : .6 });
    if (playing) notes(560, 1060, t, 5, .8);
  }
  // Nail on his stool, in front of the counter
  stool(200, 1262, { floor: 1760, rest: 1480 });
  const showing = t > T.lamp + .25 && t < T.rub - .45;
  const reach = t > T.reach && t < T.pian + .3 || t > T.lamp - .7 && t < T.lamp + .1;
  const fingerUp = t > T.finger && t < L(6);
  const rubbing = t > T.rub && t < T.open + .2;
  const lookAt = t > T.turn ? [.9, -.2] : t > T.drop[0] ? [.5, -1] : t > T.open ? [.6, -.6] : t > T.pian && t < T.lamp ? [.6, .9] : [.6, 0];
  nail({
    x: 200, y: 1490, s: 1.12, sit: 1, t: tq, look: lookAt, sq: Math.sin(tq * 2.3) * .012,
    lid: t > T.punch ? .6 : t > T.drop[0] && t < T.turn ? .3 : .55, brow: fingerUp ? .9 : t > T.punch ? .35 : 0,
    o: mouthOpen('ADAM', t), mw: mouthWide('ADAM', t), sm: -.35,
    blink: T.drink.some(d => t > d - .05 && t < d + .2) || Math.floor(tq * 12) % 53 === 0,
    handR: fingerUp ? [110, -470] : reach ? [40, -300] : rubbing ? [150, -330 + Math.sin(t * 40) * 10] : showing ? [118, -362] : [120, -282],
    holdR: fingerUp ? h => fingerTip(h) : null,
    pocketOut: t > T.pocket && t < T.finger ? [26, -267] : null, headTilt: t > T.turn ? .05 : 0,
  });
  // paper tag hanging from the spout while he shows the lamp (in front of him)
  if (showing) { const b = paperTag(436, lampY - 47, .85, t, '1000 yıllık', { t0: T.lamp + .25 }); reportText('tag', '1000 yıllık', ...b); }
  if (t > T.moth && t < T.moth + 2.2) { const lt = t - T.moth; moth(230 + lt * 180 + Math.sin(lt * 9) * 30, 1200 - lt * 320, t); }
}
function fingerTip(h) { /* drawn by hand pose: a raised index finger reads from the hand + brow; keep simple */ }
function screenRectWorld(col, a) { push(); setM([1, 0, 0, 1, 0, 0]); fillOnly(rect(-50, -50, W + 100, H + 100), col, { boil: 0, alpha: a }); pop(); }

// —— camera: world point (cx, cy) to screen centre, zoom z ——
let SHOT_LT = 9;
function cam(t, cx, cy, z, { shake = 0, rot = 0 } = {}) {
  frame(t);
  z *= 1 + .08 * (1 - eo(clamp(SHOT_LT / .5)));                      // each cut lands a little wide and settles in
  cx += Math.sin(t * .63) * 9 / z; cy += Math.cos(t * .81) * 7 / z; rot += Math.sin(t * .37) * .006;   // handheld drift
  const k = Math.floor(t * 24);
  const sx = shake ? (hash(k * 1.3) - .5) * shake : 0, sy = shake ? (hash(k * 2.1 + 5) - .5) * shake : 0;
  translate(W / 2 + sx, H / 2 + sy); rotate(rot); scale(z); translate(-cx, -cy);
}
const after = t => { drawSubs(g, t, { names: NAMES, pill: (x, y, wd, ht, col) => pill(x, y, wd, ht, col) }); };

// —— shots ——
const A = [0, Ledge(2), Ledge(4), Ledge(6), Ledge(7), Ledge(10), Ledge(12), Ledge(13), Ledge(15), Ledge(17), T.hush, Ledge(21), Ledge(22), Ledge(23), Ledge(24), T.faint - .1, endStart()];
const S = (i, f) => shot(A[i], A[i + 1], (lt, t) => { SHOT_LT = lt; f(lt, t, A[i + 1] - A[i]); world(t); });
// 1 wide: title, three doubles
S(0, (lt, t, d) => cam(t, 560, lerp(900, 930, lt / d), lerp(1.08, 1.18, lt / d)));
// 2 two-shot: the bill, the empty pocket
S(1, (lt, t, d) => cam(t, 520, 1000, lerp(1.45, 1.55, lt / d)));
// 3 Nail close: "ancak..."
S(2, (lt, t, d) => cam(t, 270, 900, lerp(2.0, 2.15, lt / d)));
// 4 Cemil close: curious
S(3, (lt, t, d) => cam(t, 830, 820, lerp(2.0, 2.2, lt / d)));
// 5 insert on the counter: the pianist, the piano
S(4, (lt, t, d) => cam(t, lerp(620, 600, lt / d), 1090, lerp(3.0, 3.2, lt / d)));
// 6 two-shot with the concert in the middle
S(5, (lt, t, d) => cam(t, lerp(540, 580, lt / d), 1010, 1.25));
// 7 Cemil reaction
S(6, (lt, t, d) => cam(t, 830, 820, 2.1, { shake: lt < .3 ? 10 : 0 }));
// 8 Nail and the lamp
S(7, (lt, t, d) => cam(t, 320, 1130, lerp(1.7, 1.85, lt / d)));   // framed high: the paper tag stays above the captions
// 9 the portal opens, the genie
S(8, (lt, t, d) => cam(t, lerp(400, 520, ss(lt / d)), lerp(1060, 900, ss(lt / d)), lerp(1.7, 1.2, ss(lt / d))));
// 10 Cemil's wish (the genie listens at the left edge)
S(9, (lt, t, d) => cam(t, 740, 820, lerp(1.6, 1.7, lt / d)));
// 11 signature: the ear trumpet, cold silence, very slow push
S(10, (lt, t, d) => cam(t, lerp(560, 600, ss(lt / d)), lerp(820, 740, ss(lt / d)), lerp(1.5, 2.4, ss(lt / d))));
// 12 wide: snap, the yeniçeri land
S(11, (lt, t, d) => cam(t, 640, 860, 1.0, { shake: T.drop.some(x => t > x + .32 && t < x + .55) ? 26 : 0 }));
// 13 Cemil panic, guards behind him
S(12, (lt, t, d) => cam(t, 850, 760, 1.45));
// 14 whip pan to Nail
S(13, (lt, t, d) => { const k = ss(seg(t, T.turn - .25, T.turn + .1)); cam(t, lerp(850, 300, k), lerp(780, 920, k), 1.75); });
// 15 Nail close: the punchline, the room behind him
S(14, (lt, t, d) => cam(t, 330, lerp(930, 920, lt / d), lerp(1.75, 1.85, lt / d)));
// 16 wide: the barman faints, the guards look down, Nail does not move
S(15, (lt, t, d) => cam(t, 640, lerp(880, 900, lt / d), lerp(1.02, 1.08, lt / d), { shake: t > T.faint + .45 && t < T.faint + .6 ? 14 : 0 }));
seam(endStart(), 'portal', .5);
for (const n of [6, 12, 17]) seam(Ledge(n), 'whip', .22);           // whip pans on three cuts
for (const n of [6, 12, 17]) ev(Ledge(n) - .05, 'swish');
endCard({ follow: CFG.follow });

const overlay = t => {
  if (t < 3.6) { push(); setM([1, 0, 0, 1, 0, 0]); titleCard('MİNİK PİYANİST', .15, t, { y: 420, size: 112 }); pop(); if (t > .2) reportText('title', 'MİNİK PİYANİST', 70, 340, 1010, 500); }
};
await boot({ canvas: g.canvas, fonts: ['800 58px "Baloo 2"'], overlay, after });
