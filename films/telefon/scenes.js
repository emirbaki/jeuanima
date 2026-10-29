// Telefon — a phone repair shop. world(t) draws the set and both characters from the timeline; shots only move the camera.
// Script lines 0..3 (see script.txt). Emre the apprentice (right, behind the counter) films the old man and plays a sad-edit
// song on his speaker from the first frame. Line 1 gets the sad mood (rain, slow push). On line 2 the owner turns and shouts
// at him; when the line ends he switches the speaker off and the song rewinds to a stop (score.py 'rewind').
// The film ends on the last word ("çalışmıyor"): the end-card transition comes right there. Never hard-code seconds.
import { clamp, lerp, seg, ss, eo, back, hash } from '/core/lib.js';
import { init, frame, W, H, push, pop, translate, scale, rotate, setM, fillOnly, rect, shape, ell, stroke } from './engine/styles/scifi-toon/toon.js';
import { titleCard } from './engine/styles/scifi-toon/props.js';
import { nail, NAIL } from './engine/cast/scifi-toon/nail.js';
import { riza, RIZA } from './engine/cast/scifi-toon/riza.js';
import { emre } from './engine/cast/scifi-toon/emre.js';
import { TL, w, L, Lend, Ledge, wordOf, q, mouthOpen, mouthWide } from './engine/core/js/time.js';
import { shot, seam, ev, boot, reportText, setHold, endStart } from './engine/core/js/film.js';
import { drawSubs } from './engine/core/js/subs.js';
import { endCard } from './engine/core/js/brand.js';
import { pill } from './engine/styles/scifi-toon/ui.js';   // also registers the 'whip' seam
import { shop, counter, phone, plane, rain, speaker } from './set.js';

const g = init(document.getElementById('c'));
const CFG = await (await fetch('film.json')).json();
const NAMES = { USTA: { label: 'USTA', color: NAIL.color }, AMCA: { label: 'AMCA', color: RIZA.color } };
setHold(Lend(3) + .15 - TL.dur);                   // end on the last word, no reaction hold (user's choice)

// —— key times ——
const T = {
  tap: L(0) + .9,                                   // the owner taps the phone: the screen lights up, it works
  sad: L(1) - .25, wall: L(2), off: Lend(2) + .1,  // sad mood / the owner shouts to the right / the apprentice turns the song off
  show: L(3) + .2, plane: w(wordOf(3, 4)) - .05,    // "açmışsın": he flips the switch, the airplane leaves the phone
};
const PH = { x: 560, y: 1250, s: .9 };

// —— sound ——
ev(T.tap - .1, 'click'); ev(T.tap, 'ding', { gain: .5 }); ev(T.sad + .4, 'wobble', { gain: .3 });
ev(T.wall + .1, 'thump'); ev(T.wall + .12, 'bonk', { gain: .5 }); ev(T.wall + .2, 'squeak', { gain: .5 }); ev(T.off - .08, 'click', { gain: .7 });
ev(T.show, 'blip'); ev(T.plane, 'click'); ev(T.plane + .08, 'whistle_up'); ev(T.plane + .45, 'whoosh'); ev(endStart() + .1, 'pop');
ev(0, 'music', { cue: 'file', file: 'assets/sad_edit.m4a', offset: 0, fade: .15, gain: 4, end: 'rewind' });   // Semicenk, Batık Gemi (slow edit), from the user
ev(T.off, 'music', { cue: 'silence' }); ev(endStart(), 'music', { cue: 'end' });

function world(t) {
  const tq = q(t);
  const sadK = seg(t, T.sad, T.sad + .6) * (1 - seg(t, T.wall, T.wall + .25));
  shop(t, { sad: sadK });
  // the owner behind the counter (deadpan); on line 2 he turns right and shouts at the unseen apprentice
  const wall = t > T.wall && t < Ledge(3);
  const tapping = Math.abs(t - T.tap) < .25 || Math.abs(t - T.plane) < .25;
  const showing = t > T.show && t < T.plane + .4;
  nail({ x: 690, y: 1340, s: 1.1, face: wall ? 1 : -1, t: tq, look: wall ? [1, -.1] : t > L(1) && t < T.wall ? [.8, .3] : [.5, .6],
    lid: wall ? .1 : .55, brow: wall ? -1 : 0, o: mouthOpen('USTA', t) * (wall ? 1.3 : 1), mw: mouthWide('USTA', t), sm: wall ? -.7 : -.35,
    lean: wall ? .5 : 0, jit: wall ? 3 : 0, sq: Math.sin(tq * 2.3) * .012,
    handR: wall ? [105, -370 + (Math.floor(tq * 12) % 2) * 20] :   // an open hand thrown toward the apprentice, away from his face
      tapping ? [190, -330] : showing ? [180, -360] : [120, -300],
    blink: Math.floor(tq * 12) % 47 === 0 });
  // Emre behind the counter, right: films the old man; flinches at the shout, switches the speaker off, looks down
  const flinch = t > T.wall && t < T.wall + .35, off = t > T.off - .25;
  emre({ x: 1010, y: 1340, s: 1.0, face: -1, t: tq, filming: off ? 0 : flinch ? .4 : 1, panic: t > T.wall && t < T.off + .8, jit: flinch ? 4 : 0,
    look: off ? [.3, .9] : t > T.wall ? [.9, -.2] : [.6, .3], lid: off && t > T.off + .5 ? .45 : 0, brow: t > T.wall ? .9 : 0, o: flinch ? .5 : 0, sm: t > T.wall ? -.5 : .5,
    handL: off && t < T.off + .2 ? [150, -230] : !off ? [10, -320] : undefined, handR: !off ? [60, -330] : undefined, sq: flinch ? .06 : Math.sin(tq * 2.6) * .012 });
  counter(t);
  speaker(880, 1250, .8, t, { on: t < T.off });
  const screen = t > T.show ? 'plane' : t > T.tap ? 'home' : 'off';
  phone(PH.x, PH.y, PH.s, t, { screen, tap: t > T.plane ? 1 : 0 });
  plane(PH.x, PH.y - 140 * PH.s, T.plane + .05, t);
  // the old man: sad in the rain, startled when it stops, then he looks at the phone
  const startled = t > T.wall && t < T.wall + 1.2;
  riza({ x: 300, y: 1640, s: 1.15, t: tq, look: startled ? [.9, -.4] : t > T.show ? [.8, .2] : sadK > .3 ? [.2, .7] : [.7, -.2],
    lid: sadK > .3 ? .55 : startled ? 0 : .3, brow: startled ? .9 : sadK > .3 ? .9 : 0, sm: sadK > .3 ? -.9 : startled ? -.2 : -.4,
    o: mouthOpen('AMCA', t) * 1.1, mw: mouthWide('AMCA', t), tear: sadK > .5, jit: startled && t < T.wall + .3 ? 4 : 0,
    blink: t > T.wall && t < T.wall + .15, sq: startled && t < T.wall + .3 ? .08 : Math.sin(tq * 2.0) * .012, lean: sadK * .5 });
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

const A = [0, Ledge(1), Ledge(2), Ledge(3), T.plane - .15, endStart()];
const S = (i, f) => shot(A[i], A[i + 1], (lt, t) => { SHOT_LT = lt; f(lt, t, A[i + 1] - A[i]); world(t); });
S(0, (lt, t, d) => cam(t, 560, lerp(1080, 1060, lt / d), lerp(1.05, 1.15, lt / d)));                     // 1 the shop, the phone works
S(1, (lt, t, d) => cam(t, 320, 1210, lerp(1.8, 2.35, ss(lt / d)), { rot: -.03 * ss(lt / d) }));        // 2 sad-edit push on the old man
S(2, (lt, t, d) => cam(t, lerp(780, 840, ss(lt / d)), 830, lerp(1.5, 1.6, lt / d), { shake: lt < .3 ? 12 : 2 }));   // 3 the owner shouts at the apprentice
S(3, (lt, t, d) => cam(t, 620, 840, lerp(1.75, 1.85, lt / d)));                                        // 4 he explains
S(4, (lt, t, d) => cam(t, lerp(560, 760, ss(lt / d)), lerp(1180, 900, ss(lt / d)), lerp(3.0, 1.8, ss(lt / d))));   // 5 the airplane leaves the phone
seam(Ledge(2), 'whip', .18);
seam(endStart(), 'portal', .5);
endCard({ follow: CFG.follow });

const overlay = t => {
  if (t < 2.2) { push(); setM([1, 0, 0, 1, 0, 0]); titleCard('TELEFON', .05, t, { y: 270, size: 110 }); pop(); if (t > .1) reportText('title', 'TELEFON', 220, 230, 860, 360); }
};
await boot({ canvas: g.canvas, fonts: ['800 58px "Baloo 2"'], overlay, after });
