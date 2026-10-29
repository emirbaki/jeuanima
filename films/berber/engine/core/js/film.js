// JeuAnima · film.js — shot list, transitions, sound events and the Lemo-Opuscar page contract
// (window.render, READY, DUR, EV, TEXTS). Style packs draw; this file only decides what runs when.
import { TL } from './time.js';

export const END_CARD = 2.0;                 // seconds of logo at the very end
// HOLD: seconds of picture after the voice ends (the reaction to the punchline), before the end card.
// film.json "hold" sets it; scenes.js calls setHold(CFG.hold) before endCard().
export let HOLD = 1.8;
export function setHold(h) { if (h != null) HOLD = h; }
export const endStart = () => TL.dur + HOLD;
const SHOTS = [], SEAMS = [], EVS = [], SEAM_FN = {};
let texts = [];

export function shot(a, b, fn) { SHOTS.push({ a, b, fn }); }
// transition centred on t, d seconds long; type must be registered by the style pack (or 'cut')
export function seam(t, type = 'cut', d = .4) { SEAMS.push({ t, type, d }); }
export function registerSeam(type, fn) { SEAM_FN[type] = fn; }   // fn(k, t): k goes -1 → 0 (cut point) → 1
export function ev(t, type, o = {}) { EVS.push({ t: Math.round(t * 1000) / 1000, type, ...o }); }
export function reportText(id, text, x0, y0, x1, y1) { texts.push({ id, text, x0, y0, x1, y1 }); }

export async function boot({ canvas, fonts = [], overlay = null, after = null }) {
  const dur = TL.dur + HOLD + END_CARD;
  window.DUR = Math.round(dur * 1000) / 1000;
  window.EV = EVS.sort((a, b) => a.t - b.t);
  SHOTS.sort((a, b) => a.a - b.a);
  const render = t => {
    texts = [];
    const s = SHOTS.find(x => t >= x.a && t < x.b) || SHOTS[SHOTS.length - 1];
    if (s) s.fn(t - s.a, t);
    for (const m of SEAMS) {
      const k = (t - m.t) / (m.d / 2);
      if (k > -1 && k < 1 && SEAM_FN[m.type]) SEAM_FN[m.type](k, t);
    }
    if (overlay) overlay(t);
    if (after) after(t);
  };
  window.render = render;
  window.TEXTS = t => { render(t); return texts.slice(); };
  try { const r = await fetch('lips.json'); if (r.ok) window.LIPS = await r.json(); } catch (e) { }
  await Promise.all(fonts.map(f => document.fonts.load(f, 'ğüşİıöç')));
  await document.fonts.ready;
  render(0);
  window.READY = true;
}
