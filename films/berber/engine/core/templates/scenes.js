// <Film> — world(t) draws the whole set from the timeline; each shot only moves the camera.
// Times come from script lines (L, Lend, Ledge) and words (w, wordOf). Never hard-code seconds.
// Reference film: films/minik_piyanist/scenes.js
import { clamp, lerp, seg, ss, eo, back, hash } from '/core/lib.js';
import { init, frame, W, H, push, pop, translate, scale, rotate, reset } from './engine/styles/scifi-toon/toon.js';
import { barBack, counter, titleCard } from './engine/styles/scifi-toon/props.js';
import { TL, w, L, Lend, Ledge, wordOf, q, mouthOpen, mouthWide } from './engine/core/js/time.js';
import { shot, seam, ev, boot, reportText, setHold, endStart } from './engine/core/js/film.js';
import { drawSubs } from './engine/core/js/subs.js';
import { endCard } from './engine/core/js/brand.js';
import { pill } from './engine/styles/scifi-toon/ui.js';

const g = init(document.getElementById('c'));
const CFG = await (await fetch('film.json')).json();
const NAMES = {};                     // { WHO: { label, color } } for character lines (narrator lines have no pill)

function world(t) { barBack(t); counter(t); }
function cam(t, cx, cy, z) { frame(t); translate(W / 2, H / 2); scale(z); translate(-cx, -cy); }

setHold(CFG.hold);                     // film.json "hold": seconds of reaction after the last line (default 1.8)
shot(0, endStart(), (lt, t) => { cam(t, 540, 960, 1); world(t); });
ev(0, 'music', { cue: 'title' }); ev(1, 'music', { cue: 'theme' }); ev(endStart(), 'music', { cue: 'end' });
seam(endStart(), 'portal', .5);
endCard({ follow: CFG.follow });     // film.json "follow": "end" | "none"

await boot({ canvas: g.canvas, fonts: ['800 58px "Baloo 2"'], after: t => drawSubs(g, t, { names: NAMES, pill }) });
