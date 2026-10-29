// Berber — the barber shop (x -300..1800) and the street with the barber's house (x 2400..4300). Film-only props.
// Floor line y 1560 in both places.
import { clamp, lerp, hash, ss } from '/core/lib.js';
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, dot, text, bands } from './engine/styles/scifi-toon/toon.js';
import { shade } from './engine/styles/scifi-toon/chars.js';

export const FLOOR = 1560, WALLF = 1450, BACK = 1490;   // front floor / where the wall meets the floor / the back row
export const SHOP = { wall: '#8fcbb4', wallS: '#74b29a', tile: '#f1e6cc', tileS: '#d8caa8', floor: '#3a3340', floorS: '#2c2632',
  wood: '#7a4a32', woodS: '#5a3424', chair: '#a23a4a', chairS: '#7a2434', chrome: '#c9ccd6', chromeS: '#9a9eac', mirror: '#bfe0e8',
  door: '#e86a8a', doorS: '#c24d6e', sky: '#f2a65a', skyS: '#e88a4a', house: '#f1e0b8', houseS: '#d8c493', roof: '#a23a4a', street: '#5a5560' };
const P = SHOP;

// —— the shop ——
export function shop(t, { doorOpen = 0, bell = 0 } = {}) {
  bands([P.wallS, P.wall, P.wall], -1500, 1250, -1400, 2000);
  // tiled lower wall
  shape(rect(-1400, 1150, 3400, 300), { fill: P.tile, lw: 7, shade: () => { for (let k = 0; k < 34; k++) stroke([[-1400 + k * 100, 1150], [-1400 + k * 100, 1450]], 4, { line: P.tileS }); stroke([[-1400, 1300], [2000, 1300]], 4, { line: P.tileS }); } });
  // door (left): the frame, the open door swings toward the camera, the bell above
  shape(rect(20, 780, 230, 670), { fill: P.sky, lw: 8, shade: () => { fillOnly(rect(20, 1250, 230, 200), P.street, { boil: .3 }); fillOnly(ell(160, 900, 60, 60, 20), '#ffd27a', { boil: .3 }); } });
  const dw = 230 * (1 - doorOpen * .75);
  shape(rect(20, 780, dw, 670), { fill: P.wood, lw: 7, shade: () => { if (dw > 60) fillOnly(rr(40, 820, dw - 40, 260, 10), P.mirror, { boil: .3 }); } });
  if (dw > 60) dot(20 + dw - 26, 1130, 9, '#e9c46a');
  const sw = Math.sin(t * 30) * bell * .5;
  push(); translate(135, 760); rotate(sw); stroke([[0, -26], [0, 0]], 4); shape(spline([[-24, 30], [-14, -2], [0, -10], [14, -2], [24, 30]]), { fill: '#e9c46a', lw: 5 }); dot(0, 34, 6, '#5a3424'); pop();
  // barber pole by the door
  push(); translate(330, 850);
  shape(rr(-34, 0, 68, 300, 30), { fill: '#f4f1ea', lw: 7, shade: () => { const ph = (t * .8) % 1; for (let k = -2; k < 6; k++) { const y0 = (k + ph) * 70; fillOnly([[-40, y0], [40, y0 + 40], [40, y0 + 64], [-40, y0 + 24]], k % 2 ? '#3d6fa8' : '#e8433b', { boil: 0 }); } } });
  shape(rr(-44, -24, 88, 28, 12), { fill: P.chrome, lw: 6 }); shape(rr(-44, 296, 88, 28, 12), { fill: P.chrome, lw: 6 });
  pop();
  // floor
  shape(rect(-1400, WALLF, 3400, 1600), { fill: P.floor, lw: 7, shade: () => { for (let k = 0; k < 30; k++) for (let j = 0; j < 9; j++) if ((k + j) % 2) fillOnly(rect(-1400 + k * 120, WALLF + j * 90, 120, 90), P.floorS, { boil: 0 }); } });
  // mirror + shelf (right)
  shape(rr(1110, 520, 380, 520, 30), { fill: P.wood, lw: 8 });
  shape(rr(1140, 550, 320, 460, 18), { fill: P.mirror, lw: 6, shade: () => { stroke([[1180, 620], [1260, 560]], 10, { line: '#e8f6f8' }); stroke([[1190, 680], [1310, 580]], 6, { line: '#e8f6f8' }); } });
  shape(rect(1090, 1050, 420, 30), { fill: P.woodS, lw: 6 });
  for (const [x, c, h] of [[1140, '#3d6fa8', 70], [1190, '#e9c46a', 50], [1240, '#e86a8a', 80]]) shape(rr(x - 16, 1050 - h, 32, h, 8), { fill: c, lw: 5 });   // bottles
  // a towel rack
  shape(rr(1560, 1180, 130, 26, 10), { fill: P.chrome, lw: 6 });
  for (let k = 0; k < 3; k++) shape(rr(1566 + k * 40, 1200, 34, 120, 8), { fill: ['#f4f1ea', '#e9c46a', '#f4f1ea'][k], lw: 5 });
}

// the framed photo of the barber's house (pink door): hangs next to the mirror the whole film
export function photo(x, y, s = 1, { glint = 0 } = {}) {
  push(); translate(x, y); scale(s);
  shape(rr(-110, -90, 220, 180, 12), { fill: '#e9c46a', lw: 8 });
  shape(rect(-88, -70, 176, 140), { fill: P.sky, lw: 5, shade: () => { fillOnly(rect(-88, 30, 176, 40), '#5f8a4a', { boil: .2 }); } });
  houseShape(0, 40, .32);
  if (glint) stroke([[-70, -50], [-30, -66]], 8, { line: '#fff3d6', alpha: glint });
  pop();
}
function houseShape(x, y, s) {
  push(); translate(x, y); scale(s);
  shape(rect(-200, -330, 400, 330), { fill: P.house, lw: 9, shade: () => shade(rect(100, -340, 120, 350), P.houseS) });
  shape(spline([[-250, -320], [0, -500], [250, -320]]), { fill: P.roof, lw: 9 });
  shape(rr(-50, -200, 100, 200, 12), { fill: P.door, lw: 8 }); dot(30, -100, 9, '#e9c46a');
  for (const sx of [-140, 140]) shape(rect(sx - 45, -270, 90, 80), { fill: P.mirror, lw: 7, shade: () => stroke([[sx, -270], [sx, -190]], 5) });
  pop();
}

// the wall calendar by the door: one big day number, the page tears off on a new day
export function calendar(x, y, day, t, tear = -1) {
  push(); translate(x, y); rotate(-.04);
  shape(rr(-90, -110, 180, 220, 10), { fill: '#f4f1ea', lw: 7 });
  shape(rect(-90, -110, 180, 50), { fill: '#e8433b', lw: 7 });
  text('EKİM', 0, -84, { font: '800 34px "Baloo 2"', fill: '#fff3d6' });
  text(String(day), 0, 22, { font: '800 120px "Baloo 2"', fill: '#2a1c1c' });
  for (const sx of [-50, 50]) dot(sx, -110, 8, INKD);
  pop();
  const lt = t - tear;
  if (tear >= 0 && lt >= 0 && lt < .7) {   // yesterday's page flies off and spins down
    const k = lt / .7;
    push(); translate(x + k * 180, y + k * k * 420); rotate(k * 2.4); scale(1 - k * .3);
    shape(rr(-90, -60, 180, 170, 10), { fill: '#f4f1ea', lw: 6 });
    text(String(day - 1), 0, 22, { font: '800 110px "Baloo 2"', fill: '#2a1c1c' });
    pop();
  }
}
const INKD = '#1b1422';

// the barber chair (origin: the floor under the seat). Drawn in two parts so a customer can sit between them.
export function chairBack(x) {
  push(); translate(x, FLOOR);
  shape(rr(-110, -560, 220, 260, 40), { fill: P.chair, lw: 8, shade: () => shade(rect(50, -570, 80, 280), P.chairS) });
  shape(rr(-50, -620, 100, 60, 20), { fill: P.chair, lw: 7 });   // headrest
  pop();
}
export function chairFront(x) {
  push(); translate(x, FLOOR);
  shape(rr(-150, -330, 300, 70, 26), { fill: P.chair, lw: 8, shade: () => shade(rect(80, -340, 80, 80), P.chairS) });   // seat
  for (const sd of [-1, 1]) shape(rr(sd * 150 - 26, -420, 52, 140, 20), { fill: P.chairS, lw: 7 });                  // arm rests
  shape(rect(-24, -260, 48, 220), { fill: P.chrome, lw: 7, shade: () => shade(rect(6, -270, 30, 240), P.chromeS) });   // column
  shape(ell(0, -20, 150, 26, 28), { fill: P.chrome, lw: 7 });                                                        // base
  shape(rr(-100, -150, 200, 24, 10), { fill: P.chromeS, lw: 6 });                                                    // foot rest
  pop();
}
// the cape over the customer: from the neck down over the seat (hides the legs)
export function cape(x, neckY, { flap = 0 } = {}) {
  const k = Math.sin(flap * 20) * 8 * flap;
  shape(spline([[x - 30, neckY], [x - 150 - k, neckY + 300], [x - 140, FLOOR - 310], [x + 140, FLOOR - 310], [x + 150 + k, neckY + 300], [x + 30, neckY]]),
    { fill: '#f4f1ea', lw: 8, shade: () => { for (let i = 0; i < 5; i++) stroke([[x - 100 + i * 50, neckY + 160], [x - 110 + i * 54, FLOOR - 320]], 4, { line: '#d3cdc0' }); } });
  shape(rr(x - 40, neckY - 10, 80, 26, 10), { fill: '#3d6fa8', lw: 5 });
}
// cut hair on the floor, grows with the day
export function hairPile(x, n) {
  for (let i = 0; i < n; i++) stroke([[x + (hash(i) - .5) * 300, FLOOR + 30 + hash(i * 3) * 40], [x + (hash(i) - .5) * 300 + 22, FLOOR + 22 + hash(i * 5) * 40]], 6, { line: '#2a1d18' });
}

// —— the street ——
export function street(t, { doorOpen = 0 } = {}) {
  bands([P.skyS, P.sky, P.sky], -1500, 1300, 2000, 4800);
  for (let i = 0; i < 4; i++) { push(); translate(2300 + i * 600 + Math.sin(t * .2 + i) * 20, 500 + (i % 2) * 140); shape(spline([[-100, 0], [-60, -50], [10, -60], [70, -40], [110, 0]]), { fill: '#fbe3c4', lw: 6 }); pop(); }
  // far houses
  for (let i = 0; i < 4; i++) shape(rect(2100 + i * 520, 900 + (i % 2) * 60, 360, 700), { fill: i % 2 ? '#e3b8a0' : '#cfa6c8', lw: 7 });
  houseShape(3700, FLOOR, 1.2);
  if (doorOpen > 0) shape(rr(3700 - 60, FLOOR - 240, 120, 240, 12), { fill: '#2a1d18', lw: 8 });   // the open door: dark inside
  // lamp post
  push(); translate(3050, FLOOR);
  shape(rect(-22, -820, 44, 820), { fill: '#3a3340', lw: 7 }); shape(rr(-70, -900, 140, 90, 20), { fill: '#3a3340', lw: 7 }); fillOnly(rr(-50, -880, 100, 50, 14), '#ffd27a', { boil: .3 });
  pop();
  shape(rect(2000, FLOOR, 2800, 1500), { fill: P.street, lw: 7, shade: () => { for (let k = 0; k < 14; k++) stroke([[2000 + k * 200, FLOOR + 50], [2100 + k * 200, FLOOR + 50]], 8, { line: '#fff3d6' }); } });
}

// the apprentice's phone turned to the camera: his video of the pink door
export function phoneShow(x, y, s, t) {
  push(); translate(x, y); scale(s); rotate(-.08);
  shape(rr(-70, -120, 140, 240, 18), { fill: '#1b1422', lw: 7 });
  shape(rect(-58, -104, 116, 196), { fill: P.sky, lw: 4, shade: () => fillOnly(rect(-58, 50, 116, 42), P.street, { boil: .2 }) });
  houseShape(0, 60, .2);
  dot(40, -90, 7, Math.floor(t * 2) % 2 ? '#e8433b' : '#5a2a2a');   // REC
  pop();
}
