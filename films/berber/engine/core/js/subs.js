// JeuAnima · subs.js — burned-in captions from TIMELINE.subs (what Whisper heard), word by word.
// Each cue is cut into short pieces (at most SUB.maxWords words / SUB.maxChars letters, a new piece after . ? ! ,).
// A piece shows from its first word to the next piece; the spoken word is yellow and pops in on twos.
// Narrator lines (who in NARRATORS) show no speaker pill; character lines show a pill in the character's colour.
import { TL } from './time.js';
import { reportText, endStart } from './film.js';

export const SUB = { y: 1150, size: 70, minSize: 50, maxW: 920, outline: 14, maxWords: 3, maxChars: 18, font: '"Baloo 2"',
  fill: '#ffffff', hot: '#ffd23f', ink: '#140d18' };
export const NARRATORS = new Set(['ANLATICI', '']);

// cue -> [{words: [{w, a, b}], a, b}]
export function pieces(cue) {
  const ws = cue.words && cue.words.length ? cue.words : [{ w: cue.text, a: cue.a, b: cue.b }];
  const out = []; let cur = [];
  const flush = () => { if (cur.length) out.push(cur); cur = []; };
  for (const w of ws) {
    const len = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (cur.length >= SUB.maxWords || len > SUB.maxChars)) flush();
    cur.push(w);
    if (/[.?!,:;]["”']?$/.test(w.w)) flush();
  }
  flush();
  return out.map((p, k) => ({ words: p, a: k ? p[0].a : cue.a, b: k + 1 < out.length ? out[k + 1][0].a : cue.b }));
}

// g: the 2D context. names: {WHO: {label, color}}. pill(x, y, w, h, color): style-pack drawer (optional).
export function drawSubs(g, t, { names = {}, pill = null, W = 1080 } = {}) {
  if (t >= endStart()) return;                       // no caption over the end card
  const cue = TL.subs.filter(s => t >= s.a && t < s.b).pop();
  if (!cue) return;
  const ps = pieces(cue), k = ps.findIndex(p => t >= p.a && t < p.b);
  if (k < 0) return;
  const p = ps[k], tq = Math.floor(t * 12) / 12;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  let size = SUB.size;
  const text = p.words.map(x => x.w).join(' ');
  for (; size > SUB.minSize; size -= 2) { g.font = `800 ${size}px ${SUB.font}`; if (g.measureText(text).width + size * .42 * p.words.length <= SUB.maxW) break; }
  g.font = `800 ${size}px ${SUB.font}`;
  const space = size * .42, widths = p.words.map(x => g.measureText(x.w).width);   // wide gaps: the hot word grows 16 %
  const total = widths.reduce((a, b) => a + b, 0) + space * (p.words.length - 1);
  // the piece pops in on its first frames (12 fps steps)
  const lk = Math.floor((t - p.a) * 12), pop = lk < 1 ? .86 : lk < 2 ? 1.06 : 1;
  let x = W / 2 - total * pop / 2;
  const y = SUB.y;
  p.words.forEach((wd, i) => {
    const on = tq >= wd.a - .04 && (i + 1 < p.words.length ? tq < p.words[i + 1].a - .04 : true);
    const wk = Math.floor((t - wd.a) * 12), sc = pop * (on ? (wk < 1 ? 1.16 : 1.08) : 1);
    const cx = x + widths[i] * pop / 2;
    g.save(); g.translate(cx, y); g.scale(sc, sc); g.translate(-widths[i] / 2, 0);
    g.lineWidth = SUB.outline; g.strokeStyle = SUB.ink; g.strokeText(wd.w, 0, 0);
    g.fillStyle = on ? SUB.hot : SUB.fill; g.fillText(wd.w, 0, 0);
    g.restore();
    x += (widths[i] + space) * pop;
  });
  const x0 = W / 2 - total * 1.1 / 2, x1 = W / 2 + total * 1.1 / 2, top = y - size * .7, bot = y + size * .7;
  reportText(`sub${cue.line}_${k}`, text, x0, top, x1, bot);
  const who = names[cue.who];
  if (who && !NARRATORS.has(cue.who)) {
    g.font = `800 32px ${SUB.font}`; const pw = g.measureText(who.label).width + 36, ph = 46;
    const px = W / 2 - pw / 2, py = top - ph - 10;
    if (pill) pill(px, py, pw, ph, who.color); else { g.fillStyle = who.color; g.fillRect(px, py, pw, ph); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = `800 32px ${SUB.font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff'; g.lineWidth = 7; g.strokeStyle = SUB.ink; g.strokeText(who.label, W / 2, py + ph / 2 + 2); g.fillText(who.label, W / 2, py + ph / 2 + 2);
    reportText(`pill${cue.line}`, who.label, px, py, px + pw, py + ph);
  }
  g.restore();
}
