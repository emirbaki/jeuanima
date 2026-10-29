// JeuAnima · time.js — every time in scenes.js hangs on the timeline (word and line indices), never on fixed seconds.
// window.TIMELINE comes from timeline.js (draft_timeline.py or prep_timeline.py); window.LIPS from lips.json (optional).
import { clamp } from '/core/lib.js';

export const TL = window.TIMELINE;
export const ANIM_FPS = 12;
export const q = t => Math.floor(t * ANIM_FPS + 1e-6) / ANIM_FPS;          // characters step on twos

const W_ = i => TL.words[clamp(i, 0, TL.words.length - 1)];
export const w = i => W_(i).a;                                               // start of word i
export const wb = i => W_(i).b;                                              // end of word i
export const edge = i => i <= 0 ? 0 : i >= TL.words.length ? TL.dur : (W_(i - 1).b + W_(i).a) / 2;   // cut before word i
export const L = n => TL.lines[clamp(n, 0, TL.lines.length - 1)].a;          // start of script line n
export const Lend = n => TL.lines[clamp(n, 0, TL.lines.length - 1)].b;       // end of script line n
export const Ledge = n => n <= 0 ? 0 : n >= TL.lines.length ? TL.dur : (Lend(n - 1) + L(n)) / 2;   // cut before line n
export const wordOf = (line, k) => TL.words.findIndex(x => x.line === line) + k;   // index of the k-th word of a line

export const talking = (who, t) => TL.lines.some(l => l.who === who && t >= l.a - .04 && t <= l.b + .08);

// mouth openness 0..1 for a character; 0 when it is not their line. Draft timeline: a syllable-like wobble on words.
export function mouthOpen(who, t) {
  if (!talking(who, t)) return 0;
  const tq = q(t), lips = window.LIPS;
  if (lips && !TL.draft) return lips.o[Math.min(lips.o.length - 1, Math.round(tq * lips.fps))] || 0;
  const on = TL.words.some(x => x.who === who && tq >= x.a && tq <= x.b);
  return on ? .35 + .35 * Math.abs(Math.sin(tq * Math.PI * 5.5)) : 0;
}
export function mouthWide(who, t) {
  const lips = window.LIPS;
  if (!lips || TL.draft || !talking(who, t)) return .5;
  return lips.b[Math.min(lips.b.length - 1, Math.round(q(t) * lips.fps))] ?? .5;
}
