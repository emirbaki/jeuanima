// Telefon — a phone repair shop. world(t) draws the set and both characters from the timeline; shots only move the camera.
// Script lines 0..3 (see script.txt). Never hard-code seconds.
import { clamp, lerp, seg, ss, eo, back, hash } from '/core/lib.js';
import { init, frame, W, H, push, pop, translate, scale, rotate, setM, reset, fillOnly, rect } from './engine/styles/scifi-toon/toon.js';
import { titleCard } from './engine/styles/scifi-toon/props.js';
import { nail, NAIL } from './engine/cast/scifi-toon/nail.js';
import { riza, RIZA } from './engine/cast/scifi-toon/riza.js';
import { TL, w, L, Lend, Ledge, wordOf, q, mouthOpen, mouthWide } from './engine/core/js/time.js';
import { shot, seam, ev, boot, reportText, setHold, endStart } from './engine/core/js/film.js';
import { drawSubs } from './engine/core/js/subs.js';
import { endCard } from './engine/core/js/brand.js';
import { pill } from './engine/styles/scifi-toon/ui.js';   // also registers the 'whip' seam
import { shop, counter, phone, plane, rain } from './set.js';

const g = init(document.getElementById('c'));
const CFG = await (await fetch('film.json')).json();
const NAMES = { USTA: { label: 'USTA', color: NAIL.color }, AMCA: { label: 'AMCA', color: RIZA.color } };
setHold(CFG.hold);

// —— key times ——
const T = {
  tap: L(0) + .9,                                   // the repairman taps the phone: it plays sad music
  sad: L(1), bang: L(2) + .12, stop: L(2) + .7,     // "Kapat lan": cane bang, music off
  show: L(3) + .2, plane: w(wordOf(3, 4)) - .05,    // "açmışsın": he flips the switch, the airplane leaves the phone
};
T.calls = T.plane + .7;
const PH = { x: 560, y: 1250, s: .9 };
const callsAt = t => t < T.calls ? 0 : Math.min(47, 1 + Math.floor((t - T.calls) * 14));

// —— sound ——
ev(T.tap - .1, 'click'); ev(T.tap, 'plink'); ev(T.sad + .3, 'wobble', { gain: .4 }); ev(T.bang, 'bonk'); ev(T.bang + .02, 'thump');
ev(T.stop, 'click'); ev(T.show, 'blip'); ev(T.plane, 'click'); ev(T.plane + .08, 'whistle_up'); ev(T.plane + .4, 'whoosh');
for (let k = 0; k < 6; k++) ev(T.calls + k * .45, k % 2 ? 'beep' : 'ding', { gain: .6 });
ev(Lend(3) + .5, 'tada', { gain: .7 }); ev(Lend(3) + 1.3, 'kazoo'); ev(endStart() + .1, 'pop');
ev(0, 'music', { cue: 'title' }); ev(.9, 'music', { cue: 'theme' }); ev(T.tap, 'music', { cue: 'sad' }); ev(L(2), 'music', { cue: 'silence' });
ev(T.calls, 'music', { cue: 'theme' }); ev(endStart(), 'music', { cue: 'end' });

function world(t) {
  const tq = q(t);
  const sadK = seg(t, T.sad - .2, T.sad + .6) * (1 - seg(t, L(2) - .05, L(2) + .1));
  shop(t, { sad: sadK });
  // the repairman behind the counter (deadpan); taps the phone with his front hand
  const tapping = Math.abs(t - T.tap) < .25 || Math.abs(t - T.stop) < .25 || Math.abs(t - T.plane) < .25;
  const showing = t > T.show && t < T.plane + .4;
  nail({ x: 780, y: 1340, s: 1.1, face: -1, t: tq, look: t > T.calls ? [.6, .9] : t > L(1) && t < Ledge(3) ? [.8, .3] : [.5, .6],
    lid: t > T.calls ? .7 : .55, o: mouthOpen('USTA', t), mw: mouthWide('USTA', t), sm: -.35, sq: Math.sin(tq * 2.3) * .012,
    handR: tapping ? [190, -330] : showing ? [180, -360] : [120, -300], blink: Math.floor(tq * 12) % 47 === 0 });
  counter(t);
  // the phone on the counter
  const screen = t > T.calls ? 'calls' : t > T.show ? 'plane' : t > T.tap && t < T.stop ? 'music' : 'off';
  phone(PH.x, PH.y, PH.s * (t > T.calls ? 1 + .05 * Math.sin(t * 30) : 1), t, { screen, buzz: t > T.calls ? 1 : 0, calls: callsAt(t), tap: t > T.plane ? 1 : 0 });
  plane(PH.x, PH.y - 140 * PH.s, T.plane + .05, t);
  // the old man in front of the counter: sad, then angry, then joy
  const angry = t > L(2) && t < Ledge(3) + .4, joy = t > T.calls + .3;
  const bangK = t > T.bang - .25 && t < T.bang + .2 ? (t < T.bang ? seg(t, T.bang - .25, T.bang) : 1 - seg(t, T.bang, T.bang + .2)) : 0;
  riza({ x: 300, y: 1640, s: 1.15, t: tq, look: joy ? [.7, -.3] : t > T.show ? [.8, .2] : angry ? [.8, -.2] : sadK > .3 ? [.2, .7] : [.7, -.2],
    lid: sadK > .3 ? .55 : joy ? 0 : .3, brow: angry ? -1 : sadK > .3 ? .9 : joy ? .6 : 0, sm: joy ? .9 : angry ? -.8 : sadK > .3 ? -.9 : -.4,
    o: mouthOpen('AMCA', t) * 1.1, mw: mouthWide('AMCA', t), tear: sadK > .5 || joy, jit: angry ? 3 : 0, bang: bangK,
    sq: joy ? .05 * Math.abs(Math.sin(tq * 9)) : Math.sin(tq * 2.0) * .012, lean: sadK * .5 });
  if (sadK > .4) rain(160, 600, 340, 900, t);
}

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

const A = [0, Ledge(1), Ledge(2), Ledge(3), T.plane - .15, T.plane + 1.3, endStart()];
const S = (i, f) => shot(A[i], A[i + 1], (lt, t) => { SHOT_LT = lt; f(lt, t, A[i + 1] - A[i]); world(t); });
S(0, (lt, t, d) => cam(t, 560, lerp(1080, 1060, lt / d), lerp(1.05, 1.15, lt / d)));                     // 1 the shop, the phone plays
S(1, (lt, t, d) => cam(t, 320, 1210, lerp(1.8, 2.35, ss(lt / d)), { rot: -.03 * ss(lt / d) }));        // 2 sad-edit push on the old man
S(2, (lt, t, d) => cam(t, 330, 1200, 1.9, { shake: t > T.bang && t < T.bang + .25 ? 22 : 0 }));         // 3 "Kapat lan"
S(3, (lt, t, d) => cam(t, 690, 840, lerp(1.75, 1.85, lt / d)));                                        // 4 the repairman explains
S(4, (lt, t, d) => cam(t, lerp(560, 760, ss(lt / d)), lerp(1180, 900, ss(lt / d)), lerp(3.0, 1.8, ss(lt / d))));   // 5 the airplane leaves the phone
S(5, (lt, t, d) => cam(t, 520, 1120, lerp(1.1, 1.2, lt / d), { shake: 4 }));                           // 6 the calls come in
seam(Ledge(2), 'whip', .22); ev(Ledge(2) - .05, 'swish');
seam(endStart(), 'portal', .5);
endCard({ follow: CFG.follow });

const overlay = t => {
  if (t < 2.2) { push(); setM([1, 0, 0, 1, 0, 0]); titleCard('TELEFON', .05, t, { y: 270, size: 110 }); pop(); if (t > .1) reportText('title', 'TELEFON', 220, 230, 860, 360); }
};
await boot({ canvas: g.canvas, fonts: ['800 58px "Baloo 2"'], overlay, after });
