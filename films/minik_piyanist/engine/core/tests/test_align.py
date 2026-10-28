import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'py'))
from script import parse_script
from align import align, apply_fixes


def H(*ws, t0=0.0, step=.4, p=.9):
    out, t = [], t0
    for w in ws:
        out.append({'w': w, 'a': round(t, 3), 'b': round(t + .3, 3), 'p': p})
        t += step
    return out


def test_exact_match():
    s = parse_script("ADAM: Sen şimdi ne sandın?")
    r = align(s, H('sen', 'şimdi', 'ne', 'sandın'), 3.0)
    assert r['how'] == ['match'] * 4
    assert r['subs'][0]['text'] == 'Sen şimdi ne sandın?'
    assert r['subs'][0]['who'] == 'ADAM'
    assert r['report'] == {'added': [], 'missing': [], 'doubtful': []}


def test_adlib_inside_line():
    s = parse_script("A: Bir iki üç.")
    r = align(s, H('bir', 'yani', 'iki', 'üç'), 3.0)
    assert len(r['times']) == 3
    assert r['subs'][0]['text'] == 'Bir yani iki üç.'
    assert r['subs'][0]['who'] == 'A'
    assert r['report']['added'] == ['yani']


def test_adlib_between_lines_goes_to_previous():
    s = parse_script("A: Bir iki.\nB: Üç dört.")
    r = align(s, H('bir', 'iki', 'hmm', 'üç', 'dört'), 3.0)
    assert r['subs'][0]['text'] == 'Bir iki. hmm'
    assert r['subs'][1]['text'] == 'Üç dört.'
    assert r['subs'][1]['who'] == 'B'


def test_missing_word_interpolated_monotonic():
    s = parse_script("A: Bir iki üç dört.")
    r = align(s, H('bir', 'iki', 'dört'), 3.0)
    assert r['how'][2] == 'spread'
    assert 'üç' not in r['subs'][0]['text']
    assert r['report']['missing'] == ['üç']
    a = [t[0] for t in r['times']]
    assert a == sorted(a)


def test_doubtful():
    s = parse_script("A: Bir iki.")
    h = H('bir', 'iki'); h[1]['p'] = .3
    assert align(s, h, 2.0)['report']['doubtful'] == ['iki']


def test_turkish_case_and_apostrophe_match():
    s = parse_script("A: Mozart'ın Türk Marşı'nı")
    r = align(s, H('Mozartın', 'türk', 'marşını'), 2.0)
    assert r['how'] == ['match'] * 3 and r['subs'][0]['text'] == "Mozart'ın Türk Marşı'nı"


def test_sub_end_never_passes_next_start():
    s = parse_script("A: Bir.\nB: İki.")
    r = align(s, H('bir', 'iki', step=.32), 2.0)
    assert r['subs'][0]['b'] <= r['subs'][1]['a']


def test_fixes():
    subs = [{'text': 'iki yeni ciğer whisky', 'line': 0, 'who': 'A', 'a': 0, 'b': 1}]
    assert apply_fixes(subs, {'whisky': 'viski'})[0]['text'] == 'iki yeni ciğer viski'


def test_apostrophe_split_merged():
    s = parse_script("A: Adam barmene döner.")
    r = align(s, H('Adam', 'barmen', "'e", 'döner.'), 2.0)
    assert r['how'] == ['match'] * 3
    assert r['subs'][0]['text'] == 'Adam barmene döner.'
    assert r['report']['added'] == []


def test_digits_match_words_and_show_digits():
    s = parse_script("A: Yirmi beş santim boyunda bin yıllık")
    r = align(s, H('25', 'santim', 'boyunda', '1000', 'yıllık'), 3.0)
    assert r['how'] == ['match'] * 6
    assert r['subs'][0]['text'] == '25 santim boyunda 1000 yıllık'
    assert r['report'] == {'added': [], 'missing': [], 'doubtful': []}
    assert r['times'][0][1] <= r['times'][1][0] + 1e-9


def test_digits_in_script_match_heard_digits():
    s = parse_script("ALİ: 25 lira verdim.")
    r = align(s, H('25', 'lira', 'verdim.'), 2.0)
    assert r['how'] == ['match'] * 3
    assert r['report'] == {'added': [], 'missing': [], 'doubtful': []}
    assert r['subs'][0]['text'] == '25 lira verdim.'


def test_digits_in_script_match_heard_words():
    s = parse_script("ALİ: 25 lira.")
    r = align(s, H('yirmi', 'beş', 'lira.'), 2.0)
    assert r['how'] == ['match'] * 2
    assert r['times'][0] == [0.0, 0.7]


def test_heard_word_joining_two_script_words():
    s = parse_script("A: Adam da cebinden. Ciğer diler.")
    r = align(s, H('Adamda', 'cebinden.', 'ciğerdiler.'), 2.0)
    assert r['how'] == ['match'] * 5
    assert r['subs'][0]['text'] == 'Adam da cebinden. Ciğer diler.'
    assert r['report']['added'] == [] and r['report']['missing'] == []


def test_subs_carry_word_times():
    s = parse_script("A: Adam da cebinden 25 lira.")
    r = align(s, H('Adamda', 'cebinden', '25', 'lira.'), 3.0)
    ws = r['subs'][0]['words']
    assert [w['w'] for w in ws] == ['Adam da', 'cebinden', '25', 'lira.']
    assert ws[1]['a'] == .4 and ws[1]['b'] == .7


def test_fixes_change_word_list_too():
    subs = [{'text': 'iki whisky', 'line': 0, 'who': 'A', 'a': 0, 'b': 1, 'words': [{'w': 'iki', 'a': 0, 'b': .4}, {'w': 'whisky', 'a': .5, 'b': .9}]}]
    out = apply_fixes(subs, {'whisky': 'viski'})
    assert out[0]['words'][1]['w'] == 'viski'
