"""JeuAnima · align.py: script words <-> heard words (Whisper), and subtitles built from what was heard.

Script word indices never move: scenes.js hangs on them. Subtitles show the heard words. A heard word that matches a
script word takes the script spelling (case, punctuation, Turkish letters); an extra heard word keeps Whisper's spelling
and joins the line of the nearest matched word before it."""
import difflib, re
import numpy as np
from script import norm

SUB_TAIL = .35       # a subtitle stays this long after its last word
DOUBT_P = .5         # Whisper word probability under this is reported as doubtful


ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']


def num_words(n):
    """Turkish number words for 0..999999 ('1000' -> ['bin'], '25' -> ['yirmi', 'beş'])."""
    if n == 0: return ['sıfır']
    out = []
    if n >= 1000:
        k = n // 1000
        out += ([] if k == 1 else num_words(k)) + ['bin']; n %= 1000
    if n >= 100:
        h = n // 100
        out += ([] if h == 1 else [ONES[h]]) + ['yüz']; n %= 100
    if n >= 10: out.append(TENS[n // 10]); n %= 10
    if n: out.append(ONES[n])
    return out


def merge_suffixes(heard):
    """Whisper splits "barmen'e" into "barmen" + "'e": join a token that starts with an apostrophe to the one before."""
    out = []
    for h in heard:
        if out and h['w'][:1] in "'’":
            o = out[-1]; out[-1] = {**o, 'w': o['w'] + h['w'], 'b': h['b'], 'p': min(o.get('p', 1), h.get('p', 1))}
        else:
            out.append(dict(h))
    return out


def expand(heard):
    """One matching unit per spoken word: a heard "25" becomes "yirmi" + "beş", its time split evenly."""
    units = []
    for j, h in enumerate(heard):
        digits = re.sub(r'[^\d]', '', h['w'])
        if digits and digits == re.sub(r"[.,!?;:'’]", '', h['w']) and int(digits) < 1000000:
            ws = num_words(int(digits)); d = (h['b'] - h['a']) / len(ws)
            units += [{'w': w, 'a': h['a'] + d * k, 'b': h['a'] + d * (k + 1), 'src': j, 'num': True} for k, w in enumerate(ws)]
        else:
            units.append({'w': h['w'], 'a': h['a'], 'b': h['b'], 'src': j, 'num': False})
    return units


def script_units(toks):
    """One matching unit per spoken word of the script: a script "25" becomes "yirmi" + "beş"."""
    keys, src = [], []
    for i, t in enumerate(toks):
        bare = re.sub(r"[.,!?;:'’\"]", '', t)
        if bare.isdigit() and int(bare) < 1000000:
            for wd in num_words(int(bare)): keys.append(wd); src.append(i)
        else:
            keys.append(norm(t)); src.append(i)
    return keys, src


def split_joined(units, S):
    """Whisper writes "Adam da" as "Adamda": split a heard unit that equals two neighbouring script units joined."""
    pairs = {S[i] + S[i + 1]: (S[i], S[i + 1]) for i in range(len(S) - 1)}
    known, out = set(S), []
    for u in units:
        k = norm(u['w'])
        if k not in known and k in pairs:
            a, b = pairs[k]; mid = u['a'] + (u['b'] - u['a']) * len(a) / (len(a) + len(b))
            out += [{**u, 'w': a, 'b': mid}, {**u, 'w': b, 'a': mid}]
        else:
            out.append(u)
    return out


def align(script, heard, dur):
    toks = [w['w'] for w in script['words']]
    S, s_src = script_units(toks)                   # matching runs over units on both sides
    heard_words = merge_suffixes(heard)
    heard = split_joined(expand(heard_words), S)    # subtitles are built over heard_words
    Hn = [norm(h['w']) for h in heard]
    out, how = [None] * len(S), [''] * len(S)
    h2s = [None] * len(heard)                       # heard unit -> script unit (matched only)

    def fill(i0, i1, j0, j1):
        if i1 <= i0: return
        if i1 - i0 == j1 - j0:
            for k in range(i1 - i0):
                out[i0 + k] = (heard[j0 + k]['a'], heard[j0 + k]['b']); how[i0 + k] = 'pair'; h2s[j0 + k] = i0 + k
            return
        if j1 > j0: a, b = heard[j0]['a'], heard[j1 - 1]['b']
        else:
            a = out[i0 - 1][1] if i0 > 0 else 0.0
            b = heard[j1]['a'] if j1 < len(heard) else dur
        n = i1 - i0
        if b - a < .05 * n: b = a + .05 * n
        wt = np.array([max(len(S[i]), 1) for i in range(i0, i1)], float)
        c = np.concatenate([[0], np.cumsum(wt) / wt.sum()])
        for k in range(n):
            out[i0 + k] = (a + (b - a) * c[k], a + (b - a) * c[k + 1]); how[i0 + k] = 'spread'

    pi = pj = 0
    blocks = [m for m in difflib.SequenceMatcher(None, S, Hn, autojunk=False).get_matching_blocks() if m.size > 0]
    for m in blocks + [difflib.Match(len(S), len(Hn), 0)]:
        fill(pi, m.a, pj, m.b)
        for k in range(m.size):
            out[m.a + k] = (heard[m.b + k]['a'], heard[m.b + k]['b']); how[m.a + k] = 'match'; h2s[m.b + k] = m.a + k
        pi, pj = m.a + m.size, m.b + m.size

    # units -> script words: a word spans its units; it is 'match' only if every unit matched
    rank = {'match': 0, 'pair': 1, 'spread': 2}
    wtimes, whow = [None] * len(toks), [''] * len(toks)
    for u, i in enumerate(s_src):
        if wtimes[i] is None: wtimes[i] = list(out[u]); whow[i] = how[u]
        else:
            wtimes[i] = [min(wtimes[i][0], out[u][0]), max(wtimes[i][1], out[u][1])]
            if rank[how[u]] > rank[whow[i]]: whow[i] = how[u]
    h2s = [s_src[x] if x is not None else None for x in h2s]
    how = whow

    times, last = [], 0.0
    for t0, t1 in wtimes:
        t0 = max(t0, last); t1 = max(t1, t0 + .02)
        times.append([round(float(t0), 3), round(float(t1), 3)]); last = t0

    # subtitles from heard words: a heard word is matched when any of its units matched
    hw2s, hw_all = [None] * len(heard_words), [set() for _ in heard_words]
    for u, si in zip(heard, h2s):
        if si is not None:
            hw_all[u['src']].add(si)
            if hw2s[u['src']] is None: hw2s[u['src']] = si
    is_num = [False] * len(heard_words)
    for u in heard:
        if u['num']: is_num[u['src']] = True
    line_of = []
    for j in range(len(heard_words)):
        s_ = hw2s[j]
        if s_ is None:
            prev = next((hw2s[k] for k in range(j - 1, -1, -1) if hw2s[k] is not None), None)
            s_ = prev if prev is not None else next((hw2s[k] for k in range(j + 1, len(heard_words)) if hw2s[k] is not None), None)
        line_of.append(script['words'][s_]['line'] if s_ is not None else 0)
    who_of = {l['i']: l['who'] for l in script['lines']}
    subs = []
    for j, h in enumerate(heard_words):
        li = line_of[j]
        if is_num[j]: text = h['w']                 # numbers stay as digits on screen
        elif hw2s[j] is not None: text = ' '.join(toks[k] for k in sorted(hw_all[j]))   # "Adamda" -> "Adam da"
        else: text = h['w']
        if subs and subs[-1]['line'] == li:
            subs[-1]['text'] += ' ' + text; subs[-1]['b'] = h['b']
            subs[-1]['words'].append({'w': text, 'a': round(h['a'], 3), 'b': round(h['b'], 3)})
        else:
            subs.append({'line': li, 'who': who_of.get(li, ''), 'a': h['a'], 'b': h['b'], 'text': text,
                         'words': [{'w': text, 'a': round(h['a'], 3), 'b': round(h['b'], 3)}]})
    for k, s_ in enumerate(subs):
        end = s_['b'] + SUB_TAIL
        if k + 1 < len(subs): end = min(end, subs[k + 1]['a'])
        s_['b'] = round(max(end, s_['b']), 3); s_['a'] = round(s_['a'], 3)

    report = {
        'added': [heard_words[j]['w'] for j in range(len(heard_words)) if hw2s[j] is None],
        'missing': [toks[i] for i in range(len(toks)) if how[i] == 'spread'],
        'doubtful': [heard_words[j]['w'] for j in range(len(heard_words)) if heard_words[j].get('p', 1) < DOUBT_P],
    }
    return {'times': times, 'how': how, 'subs': subs, 'report': report}


def apply_fixes(subs, fixes):
    """subs_fix.json: {"heard word": "right word"}, whole words only (the cue text and its word list).
    "right word" may be "": the word is dropped and the word before it takes its time."""
    def fix(t):
        for bad, good in fixes.items():
            t = re.sub(r'(?<!\w)' + re.escape(bad) + r'(?!\w)', good, t)
        return t
    for s in subs:
        s['text'] = ' '.join(fix(s['text']).split())
        kept = []
        for w in s.get('words', []):
            w['w'] = fix(w['w']).strip()
            if w['w']: kept.append(w)
            elif kept: kept[-1]['b'] = w['b']
        if 'words' in s: s['words'] = kept
    return subs
