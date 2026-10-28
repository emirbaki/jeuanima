"""JeuAnima · lips.py: mouth envelope from the whole voice track.

usage:  python lips.py <film dir>        reads out/voice.wav, writes lips.json = {fps, o:[...], b:[...]}
o = openness 0..1 (RMS against the track's 95th percentile), b = brightness 0..1 (spectral centroid: wide vs round).
Which character's mouth moves is decided in the page (time.js) from timeline lines."""
import sys, os, json
import numpy as np


def envelope(y, sr, fps=24):
    import librosa
    hop = sr // fps; win = int(.05 * sr)
    S = np.abs(librosa.stft(y.astype(np.float32), n_fft=4096, hop_length=hop, win_length=win, center=True))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)
    rms = np.sqrt((S ** 2).mean(0)); p = np.percentile(rms, 95) + 1e-9
    cen = (S * freqs[:, None]).sum(0) / (S.sum(0) + 1e-9)
    o = np.clip((rms / p - .1) / .8, 0, 1)
    b = np.clip((cen - 1200) / 2600, 0, 1) * (o > .02)
    n = int(round(len(y) / sr * fps))
    return [round(float(v), 2) for v in o[:n]], [round(float(v), 2) for v in b[:n]]


def main():
    import soundfile as sf
    film = sys.argv[1].rstrip('/\\')
    y, sr = sf.read(os.path.join(film, 'out', 'voice.wav'))
    if y.ndim > 1: y = y.mean(1)
    o, b = envelope(y, sr, 24)
    json.dump({'fps': 24, 'o': o, 'b': b}, open(os.path.join(film, 'lips.json'), 'w'))
    print(f'lips: {len(o)} frames')


if __name__ == '__main__':
    main()
