"""scifi-toon · score.py: the film's score, synthesized (no samples) → <film>/out/score.wav (48 kHz stereo).

usage:  python score.py <film dir>
Cues come from events.json: {type: 'music', cue: <name>, t}. A cue plays from its time to the next cue and is cut hard
there, reverb tail included (silence is the punchline). Cue names:
  title    a rising theremin sting            theme    lounge groove: walking bass, brushes, sparse theremin
  march    Mozart, Rondo alla Turca (K. 331, public domain) on a toy piano with an um-pa bass
  mystic   portal pad + vibes arpeggio         tension  tremolo strings rising, low pulse
  sad      'sad edit' cliché: slow minor piano, crying theremin
  silence  nothing (room tone comes from mix.py)          end   logo jingle
  file     a song from the film folder: ev(t, 'music', {cue: 'file', file: 'assets/x.m4a', offset: s, fade: .25, gain: dB, end: 'rewind'})
           end: 'rewind' = at the next cue the song rewinds to a stop (made from its own last 1.5 s)
Instrument ideas follow the scifi-toon STYLE.md §7 (theremin lead, analogue bass, retro drums); code is written here."""
import sys, os, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter, fftconvolve

SR = 48000
rng = np.random.default_rng(11)
def tt(d): return np.arange(int(round(d * SR))) / SR
def mf(m): return 440 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def M(s):  # 'G#4' -> 68
    n = NOTE[s[0]] + (1 if '#' in s else -1 if 'b' in s[1:] else 0); return n + 12 * (int(s[-1]) + 1)
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR * .45), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def env(n, a=.005, d=.1, s=.6, r=.1, hold=None):
    i = np.arange(n); A, D, R = max(int(a * SR), 1), max(int(d * SR), 1), max(int(r * SR), 1)
    H = max(1, n - R if hold is None else int(hold * SR))
    e = np.where(i < A, i / A, np.where(i < A + D, 1 - (1 - s) * (i - A) / D, s))
    return np.where(i >= H, e[min(H, n - 1)] * np.clip(1 - (i - H) / R, 0, 1), e)
def saw(ph): return 2 * (ph % 1) - 1
def sq(ph, w=.5): return np.where(ph % 1 < w, 1., -1.)

# —— instruments ——
def theremin(notes, glide=.07, vib=.3, rate=5.6, bright=.14):
    t0 = notes[0][0]; t1 = max(t + d for t, d, _ in notes) + .25; n = int((t1 - t0) * SR)
    target = np.full(n, float(notes[0][2])); amp = np.zeros(n); vib_e = np.zeros(n)
    for t, d, m in notes:
        a, b = int((t - t0) * SR), int((t + d - t0) * SR); target[a:] = m
        e = env(b - a + int(.12 * SR), .035, .08, .85, .12, hold=d); amp[a:a + len(e)] = np.maximum(amp[a:a + len(e)], e[:n - a])
        L = len(e); w = np.clip((np.arange(L) / SR - .15) / .25, 0, 1); vib_e[a:a + L] = np.maximum(vib_e[a:a + L], w[:n - a])
    k = 1 - np.exp(-1 / (glide * SR)); mid = lfilter([k], [1, -(1 - k)], target, zi=[target[0] * (1 - k)])[0]
    ph = np.cumsum(mf(mid + vib * vib_e * np.sin(np.arange(n) / SR * rate * 2 * np.pi))) / SR
    return t0, lp((np.sin(2 * np.pi * ph) + bright * np.sin(4 * np.pi * ph) + .05 * np.sin(6 * np.pi * ph)) * amp, 5000)
def bass(d, m, v=1.):
    n = int((d + .06) * SR); ph = np.cumsum(np.full(n, mf(m))) / SR
    return lp(.7 * saw(ph) + .6 * np.sin(2 * np.pi * ph), 700) * env(n, .004, .15, .55, .05, hold=d) * v
def toy(m, v=1.):            # toy piano: bright, fast decay, slightly detuned partial
    n = int(.7 * SR); x = tt(.7); f = mf(m)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x / .35) + .45 * np.sin(2 * np.pi * f * 4.2 * x) * np.exp(-x / .08) + .2 * np.sin(2 * np.pi * f * 2.01 * x) * np.exp(-x / .2)
    return y[:n] * v
def xylo(m, v=1.):
    x = tt(.5); f = mf(m)
    return (np.sin(2 * np.pi * f * x) * np.exp(-x / .18) + .4 * np.sin(2 * np.pi * f * 3.93 * x) * np.exp(-x / .05)) * v
def pad(d, ms, v=1., cut=1500):
    n = int((d + .5) * SR); y = np.zeros(n)
    for m in ms:
        for dt in (-.08, 0, .09): y += saw(np.cumsum(np.full(n, mf(m + dt))) / SR + rng.random())
    return lp(y / len(ms) / 3, cut) * env(n, .4, .3, .8, .5, hold=d) * v
def strings_trem(d, ms, v=1., rise=0.):
    n = int(d * SR); x = np.arange(n) / SR; y = np.zeros(n)
    for m in ms:
        for dt in (-.12, 0, .12): y += saw(np.cumsum(mf(m + dt + rise * x / d)) / SR + rng.random())
    return lp(y, 2600) * (.55 + .45 * np.sin(2 * np.pi * 13 * x)) * env(n, .08, .1, 1, .02, hold=d - .02) * v / len(ms)
def kick(v=1.): x = tt(.3); return np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-x / .03)) / SR) * np.exp(-x / .12) * v
def brush(v=1.): x = tt(.18); return bp(rng.standard_normal(len(x)), 2500, 9000) * np.exp(-x / .06) * v * .5
def hat(v=1.): x = tt(.05); return hp(rng.standard_normal(len(x)), 7000) * np.exp(-x / .012) * v * .4

class Bus:
    def __init__(s, n): s.b = np.zeros((n, 2))
    def add(s, x, at, g=1., pan=0.):
        st = int(round(at * SR)); l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        if st < 0: x = x[-st:]; st = 0
        e = min(len(s.b), st + len(x))
        if e > st: s.b[st:e, 0] += x[:e - st] * g * l; s.b[st:e, 1] += x[:e - st] * g * r

# —— cues ——
def cue_title(B, t0, t1):
    st, x = theremin([(t0, .5, M('A4')), (t0 + .45, .5, M('E5'))], glide=.12); B.add(x * .35, st)
    B.add(kick(.9), t0 + .02); B.add(xylo(M('A5'), .4), t0 + .45, pan=.3)
def cue_theme(B, t0, t1, beat=.6):
    walk = ['A2', 'C3', 'E3', 'G3', 'D3', 'F3', 'A3', 'C3', 'E2', 'G#2', 'B2', 'D3', 'A2', 'E3', 'A2', 'G2']
    k = 0; t = t0
    while t < t1:
        B.add(bass(beat * .9, M(walk[k % 16]), .55), t, pan=-.1)
        B.add(brush(.6 if k % 2 else .35), t, pan=.4); B.add(hat(.5), t + beat / 2 + .07, pan=.5)
        if k % 4 == 0: B.add(kick(.35), t)
        t += beat; k += 1
    mel = [(0, 1.2, 'E5'), (1.8, .6, 'D5'), (2.4, 1.6, 'C5'), (4.8, 1.2, 'A4'), (6.6, .6, 'B4'), (7.2, 1.8, 'G#4')]
    for rep in range(int((t1 - t0) // 9.6) + 1):
        notes = [(t0 + rep * 9.6 + a, d, M(n)) for a, d, n in mel if t0 + rep * 9.6 + a + d < t1]
        if notes: st, x = theremin(notes); B.add(x * .22, st, pan=.15)
def cue_march(B, t0, t1, s16=.135):
    ph1 = ['B4', 'A4', 'G#4', 'A4', ('C5', 4), 'D5', 'C5', 'B4', 'C5', ('E5', 4), 'F5', 'E5', 'D#5', 'E5', 'B5', 'A5', 'G#5', 'A5', 'B5', 'A5', 'G#5', 'A5', ('C6', 8)]
    ph2 = [('A5', 2), ('C6', 2), ('B5', 2), ('A5', 2), ('G5', 2), ('A5', 2), ('B5', 2), ('A5', 2), ('G5', 2), ('A5', 2), ('B5', 2), ('A5', 2), ('G5', 2), ('F#5', 2), ('E5', 4)]
    seq = [n if isinstance(n, tuple) else (n, 1) for n in ph1 + ph2]
    t = t0
    while t < t1:
        for n, L in seq:
            if t >= t1: break
            B.add(toy(M(n), .5), t, pan=.2); t += L * s16
    t = t0; k = 0
    while t < t1:                                        # um-pa in A minor / E major
        root = 'A2' if (k // 4) % 2 == 0 else 'E2'
        B.add(bass(.2, M(root), .5) if k % 2 == 0 else toy(M('C4' if root == 'A2' else 'B3'), .22), t)
        t += 2 * s16; k += 1
def cue_mystic(B, t0, t1):
    d = t1 - t0; B.add(pad(d, [M('A3'), M('C4'), M('E4'), M('B4')], .28), t0)
    arp = ['A5', 'E5', 'B5', 'C6', 'E6', 'B5']; t = t0; k = 0
    while t < t1 - .2: B.add(xylo(M(arp[k % 6]), .16), t, pan=(-.5 if k % 2 else .5)); t += .3; k += 1
def cue_tension(B, t0, t1):
    d = t1 - t0; B.add(strings_trem(d, [M('A3'), M('C4'), M('D#4')], .32, rise=2.), t0)
    t = t0
    while t < t1: B.add(kick(.45), t); t += .45
def cue_end(B, t0, t1):
    for k, n in enumerate(['C5', 'E5', 'G5', 'C6']): B.add(xylo(M(n), .5), t0 + .12 + k * .1, pan=-.3 + k * .2)
    st, x = theremin([(t0 + .55, .9, M('G5')), (t0 + .9, .9, M('C6'))], glide=.1); B.add(x * .25, st)
def cue_sad(B, t0, t1):
    """a 'sad edit' cliché: slow minor piano + a crying theremin with wide vibrato, over a soft pad"""
    d = t1 - t0; B.add(pad(d, [M('A3'), M('C4'), M('E4')], .22, cut=1100), t0)
    chords = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4']]
    t, k = t0, 0
    while t < t1:
        for i, n in enumerate(chords[k % 4]): B.add(toy(M(n) - 12, .28), t + i * .09, pan=-.2 + i * .2)
        t += 1.2; k += 1
    notes = [(0, .9, 'E5'), (.9, .5, 'D5'), (1.4, 1.4, 'C5'), (2.8, .6, 'B4'), (3.4, 1.6, 'A4')]
    for rep in range(int(d // 5) + 1):
        ns = [(t0 + rep * 5 + a, dd, M(n)) for a, dd, n in notes if t0 + rep * 5 + a + dd < t1]
        if ns: st, x = theremin(ns, glide=.12, vib=.6, rate=5.2); B.add(x * .3, st, pan=.1)
CUES = {'sad': cue_sad, 'title': cue_title, 'theme': cue_theme, 'march': cue_march, 'mystic': cue_mystic, 'tension': cue_tension, 'end': cue_end, 'silence': None}

def cue_file(B, t0, t1, path, offset=0., fade=.25, gain=0.):
    """a song file (any format ffmpeg reads), from offset seconds, faded in, cut hard at t1 by the caller"""
    import subprocess
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(offset), '-t', str(t1 - t0 + .5), '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    x *= .2 / (np.sqrt((x ** 2).mean()) + 1e-9) * 10 ** (gain / 20)   # song level like the synth cues (rms .2), then gain dB
    n = min(len(x), int(fade * SR)); x[:n] *= np.linspace(0, 1, n)[:, None]
    st = int(round(t0 * SR)); e = min(len(B.b), st + len(x)); B.b[st:e] += x[:e - st]


def rewind(seg, d=.6):
    """record rewind made from the music itself: the last part played backwards, speeding up (pitch rising), then gone.
    seg: (n, 2) audio that played just before the stop."""
    seg = seg[::-1]
    n_out = int(d * SR); u = np.arange(n_out) / n_out
    speed = 1.6 + 7.5 * u ** 1.6                                   # samples of source per output sample
    pos = np.cumsum(speed); pos = pos[pos < len(seg) - 1]; n_out = len(pos)
    i = pos.astype(int); fr = (pos - i)[:, None]
    y = seg[i] * (1 - fr) + seg[i + 1] * fr
    env = np.minimum(1, np.arange(n_out) / (.01 * SR))[:, None] * np.minimum(1, (n_out - np.arange(n_out)) / (.08 * SR))[:, None]
    hiss = hp(rng.standard_normal(n_out), 3000)[:, None] * .02 * (u[:n_out, None] if len(u) >= n_out else 1)
    return (y + hiss) * env * 2.2                                  # as loud as the song it rewinds


def main():
    film = sys.argv[1].rstrip('/\\')
    E = json.load(open(os.path.join(film, 'events.json'), encoding='utf-8')); dur = E['dur']
    cues = sorted([e for e in E['ev'] if e['type'] == 'music'], key=lambda e: e['t'])
    out = np.zeros((int(dur * SR) + SR, 2)); post = []
    for k, c in enumerate(cues):
        t1 = cues[k + 1]['t'] if k + 1 < len(cues) else dur
        fn = CUES.get(c['cue'])
        if c['cue'] not in CUES and c['cue'] != 'file': print('unknown music cue (silent):', c['cue'])
        if not fn and c['cue'] != 'file': continue
        B = Bus(len(out))
        if c['cue'] == 'file': cue_file(B, c['t'], t1, os.path.join(film, c['file']), c.get('offset', 0), c.get('fade', .25), c.get('gain', 0))
        else: fn(B, c['t'], t1)
        b = B.b; a, e = int(c['t'] * SR), int(t1 * SR); f = int(.012 * SR)
        if c.get('end') == 'rewind': post.append((e, rewind(b[max(a, e - int(1.5 * SR)):e].copy())))   # rewound after the cut
        b[e:] = 0; b[max(a, e - f):e] *= np.linspace(1, 0, e - max(a, e - f))[:, None]   # hard cut, tail included
        out += b
    rv = np.exp(-np.arange(int(.35 * SR)) / SR / .09) * rng.standard_normal(int(.35 * SR)) * .04; rv[0] = 1
    out = np.stack([fftconvolve(out[:, i], rv)[:len(out)] for i in range(2)], 1)
    for c in cues:                                   # re-cut the reverb tail at silence cues
        if c['cue'] == 'silence':
            nxt = [d['t'] for d in cues if d['t'] > c['t']]; a, e = int(c['t'] * SR), int((nxt[0] if nxt else dur) * SR)
            out[a:e] = 0
    for e, x in post: m = min(len(out), e + len(x)); out[e:m] += x[:m - e]
    out = out[:int(dur * SR)]; out /= max(np.abs(out).max(), 1e-9) / .8
    os.makedirs(os.path.join(film, 'out'), exist_ok=True)
    sf.write(os.path.join(film, 'out', 'score.wav'), out.astype(np.float32), SR)
    print(f'score: {len(cues)} cues, {dur:.1f} s')

if __name__ == '__main__':
    main()
