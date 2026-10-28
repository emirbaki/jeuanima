// Cast · PİYANİST — 25 cm tall, big head, slicked hair, tailcoat, very polite. Never speaks.
// Drawn at full detail; scale it down with s. lw is lowered for him so tiny lines do not turn into blobs.
// P: {x, y, s, face, t, play (0..1 hands on keys), bow (0..1), look, blink, lid, sm, o}
import { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, dot, S } from '../../styles/scifi-toon/toon.js';
import { eye, mouth, hand, brow, nose, leg, arm, shade } from '../../styles/scifi-toon/chars.js';

export const PIYANIST = { label: 'PİYANİST', color: '#3b3550', skin: '#f0c8a2', skinS: '#cfa27c', coat: '#25212e', coatS: '#15121b', shirt: '#ffffff', hair: '#1a1420' };
const C = PIYANIST;

export function piyanist(P) {
  const { x = 0, y = 0, s = 1, face = 1, t = 0, play = 0, bow = 0 } = P;
  const lw0 = S.lwScale; S.lwScale = P.lw ?? .75;
  push(); translate(x, y); scale(s * face, s);
  const hipY = -110, shY = -210;
  leg([-16, hipY], [-18, -8], 30, C.coat, C.coatS, 1); leg([16, hipY], [20, -8], 30, C.coat, C.coatS, 1);
  push(); translate(0, hipY); rotate(bow * .9); translate(0, -hipY);
  // tails
  shape(spline([[-40, hipY - 10], [-62, hipY + 60], [-36, hipY + 50], [-20, hipY + 4]]), { fill: C.coat, lw: 6 });
  const k = play ? Math.floor(t * 12) % 2 : 0;
  const hR = play ? [74, hipY - 18 - k * 8] : [48, hipY + 4], hL = play ? [56, hipY - 26 + k * 8] : [-48, hipY + 4];
  arm([-30, shY + 16], hL, -8, 24, C.coatS); hand(hL[0], hL[1], .2, 12, C.skin);
  shape(spline([[-44, hipY + 2], [-50, shY + 20], [-30, shY - 6], [30, shY - 6], [50, shY + 20], [44, hipY + 2], [0, hipY + 8]]), { fill: C.coat, shade: () =>
    fillOnly([[-14, shY - 8], [14, shY - 8], [6, hipY - 10], [-6, hipY - 10]], C.shirt, { boil: .4 }) });
  shape(spline([[0, shY - 2], [-16, shY - 12], [-16, shY + 6]]), { fill: C.coatS, lw: 5 }); shape(spline([[0, shY - 2], [16, shY - 12], [16, shY + 6]]), { fill: C.coatS, lw: 5 });
  // head (big)
  push(); translate(4, shY - 10);
  const hc = [0, -64];
  const head = ell(hc[0], hc[1], 60, 64, 40);
  shape(head, { fill: C.skin, shade: () => shade(ell(hc[0] - 50, hc[1] + 10, 34, 70, 20), C.skinS) });
  shape(spline([[hc[0] - 62, hc[1] - 4], [hc[0] - 56, hc[1] - 56], [hc[0] + 10, hc[1] - 74], [hc[0] + 62, hc[1] - 40], [hc[0] + 20, hc[1] - 44], [hc[0] - 30, hc[1] - 30]]), { fill: C.hair, lw: 6 });
  const lk = P.look || [0, 0];
  if (P.blink || bow > .5) { stroke(arc(hc[0] - 4, hc[1] - 2, 14, 8, .2, 2.9, 8), 6); stroke(arc(hc[0] + 30, hc[1] - 4, 13, 8, .2, 2.9, 8), 6); }
  else { eye(hc[0] - 4, hc[1] - 4, 17, 20, { lid: P.lid ?? .15, look: lk, skin: C.skin }); eye(hc[0] + 30, hc[1] - 6, 16, 19, { lid: P.lid ?? .15, look: lk, skin: C.skin }); }
  brow(hc[0] - 2, hc[1] - 32, 24, .2, { lw: 7 }); brow(hc[0] + 32, hc[1] - 34, 22, -.2, { lw: 7 });
  nose(hc[0] + 16, hc[1] + 16, .6, { fill: C.skin });
  mouth(hc[0] + 14, hc[1] + 36, 22, { o: P.o || 0, sm: P.sm ?? .6, teeth: false });
  pop();
  arm([30, shY + 16], hR, 8, 24, C.coat); hand(hR[0], hR[1], .2, 12, C.skin);
  pop(); pop();
  S.lwScale = lw0;
}

// Tiny grand piano, side view, keyboard on the right. Origin at the floor under the middle.
export function piano(x, y, s = 1, { lid = 1, t = 0, keysDown = 0 } = {}) {
  const lw0 = S.lwScale; S.lwScale = .75;
  push(); translate(x, y); scale(s);
  for (const lx of [-120, 70]) shape(rr(lx, -90, 18, 90, 4), { fill: '#1d1922', lw: 6 });   // legs
  shape(rr(-30, -40, 14, 40, 3), { fill: '#1d1922', lw: 5 });                               // pedal lyre
  // lid (open)
  push(); translate(-130, -150); rotate(-.55 * lid);
  shape(spline([[0, 0], [250, 0], [240, -14], [40, -50], [0, -20]]), { fill: '#2b2533', lw: 6 }); pop();
  stroke([[60, -150], [-30, -220 * lid - 150 * (1 - lid)]], 5);                              // lid stick
  // body
  shape(spline([[-140, -150], [-150, -120], [-140, -90], [110, -90], [120, -150]]), { fill: '#2b2533', lw: 7, shade: () =>
    fillOnly([[-150, -110], [130, -110], [130, -80], [-150, -80]], '#16131a', { boil: .3 }) });
  // keyboard
  shape(rr(96, -138, 60, 22, 4), { fill: '#fffaf0', lw: 5 });
  for (let k = 0; k < 6; k++) { const down = keysDown && Math.floor(t * 12 + k * 3) % 4 === 0; fillOnly(rect(100 + k * 9, -138, 5, down ? 14 : 11), '#1d1922', { boil: 0 }); }
  pop(); S.lwScale = lw0;
}
