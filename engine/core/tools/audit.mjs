// JeuAnima · audit.mjs — every 0.1 s: each text box inside the safe zone, no two boxes overlapping.
// usage (from the library root):  node <film>/engine/core/tools/audit.mjs <film> [--step 0.1]
// Safe zone (social apps cover the rest): x 60..1020, y 220..1500 on a 1080x1920 frame. Exit 0 = clean, 1 = problems.
import path from 'path'; import { pathToFileURL } from 'url';
const LIB = process.env.LEMO_OPUSCAR_HOME || path.join(process.env.USERPROFILE || process.env.HOME, 'lemo-opuscar');
const { openDemo, closeServer, requireDemo } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const args = process.argv.slice(2), dir = path.resolve(args[0]); requireDemo(dir);
const STEP = +(args.includes('--step') ? args[args.indexOf('--step') + 1] : .1);
const ZONE = { x0: 60, y0: 220, x1: 1020, y1: 1500 };
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
const errs = await page.evaluate(({ STEP, ZONE }) => {
  const out = [];
  for (let t = 0; t <= window.DUR; t += STEP) {
    const T = window.TEXTS(t) || [];
    for (const b of T) if (b.x0 < ZONE.x0 || b.y0 < ZONE.y0 || b.x1 > ZONE.x1 || b.y1 > ZONE.y1)
      out.push(`${t.toFixed(1)}s zone   ${b.id} "${b.text.slice(0, 30)}" [${b.x0 | 0},${b.y0 | 0},${b.x1 | 0},${b.y1 | 0}]`);
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const a = T[i], b = T[j];
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) out.push(`${t.toFixed(1)}s overlap ${a.id} × ${b.id}`);
    }
  }
  return out;
}, { STEP, ZONE });
await browser.close(); closeServer();
const uniq = [...new Set(errs.map(e => e.replace(/^\S+\s/, '')))];
if (!errs.length) { console.log('audit: clean'); process.exit(0); }
console.log(`audit: ${errs.length} problems (${uniq.length} distinct)`); errs.slice(0, 20).forEach(e => console.log('  ' + e));
process.exit(1);
