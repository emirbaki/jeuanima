"""JeuAnima · mix.py: voice + score + foley + room tone -> <film>/out/mix.wav (48 kHz stereo).

usage:  python mix.py <film dir>
Reads out/voice.wav (optional), out/score.wav (optional), events.json and the style pack's foley.py
(<film>/engine/styles/<style>/foley.py, style from film.json). The voice is compressed first, then the music is ducked
MUSIC_DUCK dB under it and balanced MUSIC_BELOW dB under the voice; foley dips while words play. Loudness to -14 LUFS happens in mux.sh."""
import sys, os, json, importlib.util
import numpy as np, soundfile as sf
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SR = 48000
MUSIC_BELOW = 16      # dB: the score sits this far under the voice (RMS)
MUSIC_DUCK = 9        # dB: extra dip while someone speaks
FX_GAIN = .2          # foley peak level against a 0.9 voice peak
LIB = os.environ.get('LEMO_OPUSCAR_HOME') or os.path.join(os.path.expanduser('~'), 'lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import compress, limit, lp, hp


def load(path, n):
    if not os.path.exists(path): return np.zeros((n, 2))
    y, sr = sf.read(path, always_2d=True)
    if sr != SR: raise SystemExit(f'{path}: expected {SR} Hz, got {sr}')
    if y.shape[1] == 1: y = np.repeat(y, 2, 1)
    out = np.zeros((n, 2)); m = min(n, len(y)); out[:m] = y[:m]; return out


def rms(x): return float(np.sqrt(np.mean(x ** 2))) if x.size else 0.0


def balance(v, music):
    """Duck the music MUSIC_DUCK dB under the voice and set it MUSIC_BELOW dB below the voice. Safe for silence."""
    music = music.copy()
    venv = uniform_filter1d(maximum_filter1d(np.abs(v), int(.05 * SR)), int(.25 * SR))
    on = venv > 1e-4
    if on.any():
        duck = 1 - (1 - 10 ** (-MUSIC_DUCK / 20)) * np.clip(venv / np.percentile(venv[on], 60), 0, 1)
        music *= duck[:, None]
    speech = np.abs(v) > .02
    mv, vv = rms(music[music.any(1)]), rms(v[speech])
    if mv > 0 and vv > 0: music *= (vv / 10 ** (MUSIC_BELOW / 20)) / mv
    return music


def main():
    film = sys.argv[1].rstrip('/\\')
    cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8-sig'))
    E = json.load(open(os.path.join(film, 'events.json'), encoding='utf-8')); dur = E['dur']; n = int(dur * SR)
    spec = importlib.util.spec_from_file_location('foley', os.path.join(film, 'engine', 'styles', cfg['style'], 'foley.py'))
    foley = importlib.util.module_from_spec(spec); spec.loader.exec_module(foley)

    voice = load(os.path.join(film, 'out', 'voice.wav'), n)
    v = voice.mean(1)
    if np.abs(v).max() > 0:
        v = hp(v, 70); v = v / (np.abs(v).max() + 1e-9) * .9; v = compress(v, .2, 3.5)
        v = v / (np.abs(v).max() + 1e-9) * .9
    voice = np.stack([v, v], 1)

    music = load(os.path.join(film, 'out', 'score.wav'), n)
    music = balance(v, music)

    fx = np.zeros((n, 2)); missing = set()
    for e in E['ev']:
        if e['type'] == 'music': continue
        fn = foley.SOUNDS.get(e['type'])
        if not fn: missing.add(e['type']); continue
        x = fn(e) * e.get('gain', 1.0) * FX_GAIN; a = int(e['t'] * SR); b = min(n, a + len(x))
        if b > a: fx[a:b] += x[:b - a, None]
    if missing: print('silent (no foley):', ', '.join(sorted(missing)))

    rng = np.random.default_rng(3); tt = np.arange(n) / SR
    room = (lp(rng.standard_normal(n), 400) * .004 + np.sin(2 * np.pi * 120 * tt) * .0025)[:, None]   # fridge hum

    # foley never covers words: dip it 6 dB while the voice is loud
    vbusy = np.clip(uniform_filter1d(np.abs(v), int(.1 * SR)) / .05, 0, 1)
    fx *= (1 - .5 * vbusy)[:, None]
    mix = voice + music + fx + room
    mix = np.stack([limit(mix[:, i], .95) for i in range(2)], 1)
    sf.write(os.path.join(film, 'out', 'mix.wav'), mix.astype(np.float32), SR)
    print(f'mix: {dur:.1f} s, voice rms {20 * np.log10(rms(v) + 1e-9):.1f} dBFS, peak {20 * np.log10(np.abs(mix).max() + 1e-9):.1f} dBFS')


if __name__ == '__main__':
    main()
