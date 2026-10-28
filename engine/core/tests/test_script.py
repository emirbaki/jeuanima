import os, sys, json, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'py'))
from script import parse_script, norm
from draft_timeline import draft


def test_parse_basic():
    s = parse_script("DURSUN: Bu ne? [şaşkın]\nTEMEL: Makine.")
    assert len(s['lines']) == 2
    assert s['lines'][0]['notes'] == ['şaşkın']
    assert s['lines'][0]['text'] == 'Bu ne?'
    assert len(s['words']) == 3
    assert s['words'][2]['who'] == 'TEMEL' and s['words'][2]['line'] == 1


def test_parse_silence():
    s = parse_script("A: Bir.\n(sessizlik 1.5)\n(sessizlik)\nB: İki.")
    assert s['lines'][1]['silence'] == 1.5 and s['lines'][1]['who'] == ''
    assert s['lines'][2]['silence'] == 1.0
    assert [w['line'] for w in s['words']] == [0, 3]


def test_parse_skips_blank_and_comments():
    s = parse_script("# not\n\nA: Bir iki.\n")
    assert len(s['lines']) == 1 and len(s['words']) == 2


def test_norm_turkish():
    assert norm("İSTANBUL'a,") == norm("istanbula")
    assert norm("IŞIK") == "ışık"
    assert norm("Mozart'ın") == "mozartın"


def test_draft_monotonic():
    s = parse_script("A: Bir iki üç.\n(sessizlik 2)\nB: Dört.")
    tl = draft(s)
    a = [w['a'] for w in tl['words']]
    assert a == sorted(a) and tl['draft'] is True
    assert tl['words'][3]['a'] - tl['words'][2]['b'] >= 2.0
    assert len(tl['subs']) == 2 and tl['subs'][0]['text'] == 'Bir iki üç.'
    assert tl['lines'][1]['b'] - tl['lines'][1]['a'] == 2.0
    assert tl['dur'] > tl['words'][-1]['b']


def test_note_only_line_is_a_zero_beat():
    s = parse_script("ALİ: [güler]\nALİ: Tamam.")
    assert s['lines'][0]['silence'] == 0.0 and s['lines'][0]['who'] == 'ALİ'
    tl = draft(s)
    assert tl['lines'][0]['b'] >= tl['lines'][0]['a']
    assert len(tl['subs']) == 1


def test_silence_decimal_comma():
    assert parse_script("(sessizlik 1,5)")['lines'][0]['silence'] == 1.5


def test_draft_subs_carry_word_times():
    tl = draft(parse_script("A: Bir iki üç."))
    assert [w['w'] for w in tl['subs'][0]['words']] == ['Bir', 'iki', 'üç.']
    assert tl['subs'][0]['words'][0]['a'] == tl['words'][0]['a']


def test_norm_circumflex():
    assert norm("hâlâ") == norm("hala") and norm("Kâğıt") == norm("kağıt")
