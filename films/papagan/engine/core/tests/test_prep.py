import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'py'))
from script import parse_script
from prep_timeline import concat_lines, GAP
from lips import envelope

SR = 48000


def tone(d):
    t = np.arange(int(d * SR)) / SR
    return .5 * np.sin(2 * np.pi * 220 * t)


def test_concat_gaps():
    s = parse_script("A: Bir.\n(sessizlik 1.5)\nB: İki.")
    y, spans = concat_lines([tone(.5), tone(.4)], s['lines'], SR)
    assert GAP == .3
    assert abs(len(y) / SR - (.5 + 1.5 + .4)) < .01
    assert spans[0] == [0.0, 0.5]
    assert abs(spans[1][0] - 2.0) < .01


def test_concat_count_mismatch():
    s = parse_script("A: Bir.\nB: İki.")
    try:
        concat_lines([tone(.5)], s['lines'], SR)
        assert False, 'expected ValueError'
    except ValueError as e:
        assert '2' in str(e) and '1' in str(e)


def test_lips_shape():
    o, b = envelope(np.concatenate([tone(1.0), np.zeros(SR)]), SR, 24)
    assert abs(len(o) - 48) <= 1
    assert all(0 <= v <= 1 for v in o) and all(0 <= v <= 1 for v in b)
    assert max(o[:20]) > .5 and max(o[30:]) < .05


def test_find_voice_natural_order(tmp_path):
    from prep_timeline import find_voice
    d = tmp_path / 'assets' / 'voice'; d.mkdir(parents=True)
    for n in ('1', '2', '10', '11'): (d / f'{n}.mp3').write_bytes(b'')
    names = [os.path.basename(p) for p in find_voice(str(tmp_path))]
    assert names == ['1.mp3', '2.mp3', '10.mp3', '11.mp3']


def test_balance_silent_voice_and_empty_music_is_finite():
    from mix import balance
    n = SR
    m = balance(np.zeros(n), np.zeros((n, 2)))
    assert np.isfinite(m).all()
    m = balance(np.zeros(n), np.ones((n, 2)) * .1)
    assert np.isfinite(m).all() and np.abs(m).max() > 0
    m = balance(tone(1.0), np.zeros((n, 2)))
    assert np.isfinite(m).all()
