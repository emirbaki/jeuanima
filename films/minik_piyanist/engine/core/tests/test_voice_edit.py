import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'py'))
from voice_edit import split_chunks, find_retakes, assemble, remap, insert_silences

SR = 16000


def tone(d, f=220):
    t = np.arange(int(d * SR)) / SR
    return .5 * np.sin(2 * np.pi * f * t)


def z(d): return np.zeros(int(d * SR))


def test_split_chunks_on_silence():
    y = np.concatenate([z(.5), tone(1.0), z(.8), tone(.6), z(.2), tone(.4), z(.5)])
    ch = split_chunks(y, SR, min_sil=.3)
    assert len(ch) == 2                                  # the 0.2 s gap does not split
    assert abs(ch[0][0] - .5) < .05 and abs(ch[0][1] - 1.5) < .05
    assert abs(ch[1][0] - 2.3) < .05 and abs(ch[1][1] - 3.5) < .05


def test_find_retakes_false_start():
    words = [['lambayı', 'ovaladıklarında', 'ortaya', 'çıkıyor'],
             ['lambayı', 'ovaladıklarında', 'ortaya', 'çok', 'yaşlı', 'az', 'duyan', 'bir', 'cin', 'çıkar']]
    assert find_retakes(words) == {0}


def test_find_retakes_restart_two_chunks_later():
    words = [['ancak', 'cinin', 'kulağı'], ['ııı'], ['ancak', 'cinin', 'kulağı', 'pek', 'iyi', 'duymadığı', 'için']]
    assert find_retakes(words) == {0, 1}


def test_find_retakes_keeps_normal_speech():
    words = [['adamın', 'biri', 'bir', 'barda', 'oturur'], ['üç', 'duble', 'viski', 'içer'], ['barmen', 'merak', 'eder'], ['barmen', 'bu', 'duruma', 'çok', 'şaşırır']]
    assert find_retakes(words) == set()


def test_find_retakes_drops_empty_chunks():
    assert find_retakes([['bir', 'iki'], [], ['üç']]) == {1}


def test_assemble_drops_and_shortens_gaps():
    y = np.concatenate([z(1.0), tone(1.0), z(2.0), tone(1.0), z(.3), tone(.5)])
    ch = [(1.0, 2.0), (4.0, 5.0), (5.3, 5.8)]
    y2, m = assemble(y, SR, ch, keep=[0, 2], max_gap=.5, lead=.4, pad=0)
    assert abs(len(y2) / SR - (.4 + 1.0 + .5 + .5 + .3)) < .02     # lead + chunk0 + gap + chunk2 + tail (.3)
    assert abs(remap(1.5, m) - .9) < .02                          # inside chunk 0
    assert abs(remap(5.5, m) - 2.1) < .02                         # inside chunk 2
    assert remap(4.5, m) is None                                  # inside the dropped chunk


def test_insert_silences_shifts_later_words():
    y = np.ones(int(3 * SR))
    words = [{'a': .5, 'b': 1.0}, {'a': 1.2, 'b': 1.8}, {'a': 2.0, 'b': 2.5}]
    y2, words2 = insert_silences(y, SR, words, [(1.9, 1.5)])
    assert abs(len(y2) / SR - 4.5) < .01
    assert words2[1] == {'a': 1.2, 'b': 1.8} and abs(words2[2]['a'] - 3.5) < 1e-6
    assert np.all(y2[int(1.95 * SR):int(3.35 * SR)] == 0)


def test_find_retakes_with_a_changed_word_and_a_cue():
    words = [['barmen', 'hemen'], ['ancak', 'cin', 'kulağı', 'pek'], ['evet'],
             ['ancak', 'cinin', 'kulağı', 'pek', 'iyi', 'duymadığı', 'için']]
    assert find_retakes(words) == {1, 2}
