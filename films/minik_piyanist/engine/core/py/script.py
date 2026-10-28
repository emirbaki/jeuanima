"""JeuAnima · script.py: reads script.txt.

Format, one line per line of dialogue:
  WHO: text [acting note]      WHO = a cast name from film.json, or ANLATICI for the narrator
  (sessizlik 1.5)              a silent beat (default 1.0 s)
  # comment                    ignored
Notes in [...] are never shown or spoken. Words are split on spaces; their index is what scenes.js uses."""
import re

SILENCE = re.compile(r'^\(\s*sessizlik\s*([0-9.,]*)\s*\)$', re.I)
LINE = re.compile(r'^([^\s:][^:]{0,30}):\s*(.*)$')


def norm(s):
    """Turkish-aware comparison key: İ/I handled before lower(), punctuation and apostrophes dropped."""
    s = s.replace('İ', 'i').replace('I', 'ı').lower()
    return re.sub(r'[^\w]', '', s)


def parse_script(text):
    lines, words = [], []
    for raw in text.splitlines():
        raw = raw.strip()
        if not raw or raw.startswith('#'):
            continue
        m = SILENCE.match(raw)
        if m:
            try: sec = float((m.group(1) or '1').replace(',', '.'))
            except ValueError: raise ValueError(f'silence length is not a number: {raw}')
            lines.append({'i': len(lines), 'who': '', 'text': '', 'notes': [], 'silence': sec})
            continue
        m = LINE.match(raw)
        if not m:
            raise ValueError(f'script line has no speaker ("WHO: text"): {raw}')
        who, body = m.group(1).strip(), m.group(2)
        notes = re.findall(r'\[([^\]]*)\]', body)
        body = re.sub(r'\s*\[[^\]]*\]\s*', ' ', body).strip()
        li = len(lines)
        if not body:                        # a line with only a note ("ALİ: [güler]") is a silent acting beat
            lines.append({'i': li, 'who': who, 'text': '', 'notes': notes, 'silence': 0.0})
            continue
        lines.append({'i': li, 'who': who, 'text': body, 'notes': notes, 'silence': None})
        for w in body.split():
            words.append({'w': w, 'line': li, 'who': who})
    return {'lines': lines, 'words': words}


def line_spans(script, word_times):
    """[{i, who, a, b, silence}] from per-word times; a silence line spans the gap it sits in."""
    out, wi = [], 0
    by_line = {}
    for k, w in enumerate(script['words']):
        by_line.setdefault(w['line'], []).append(k)
    for l in script['lines']:
        ks = by_line.get(l['i'])
        if ks:
            out.append({'i': l['i'], 'who': l['who'], 'a': word_times[ks[0]][0], 'b': word_times[ks[-1]][1], 'silence': None})
        else:
            out.append({'i': l['i'], 'who': '', 'a': None, 'b': None, 'silence': l['silence']})
    for k, o in enumerate(out):             # silence: from the previous line's end, for its length
        if o['a'] is None:
            prev = next((p['b'] for p in reversed(out[:k]) if p['b'] is not None), 0.0)
            o['a'], o['b'] = prev, round(prev + (o['silence'] or 1.0), 3)
    return out
