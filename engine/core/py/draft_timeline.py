"""JeuAnima · draft_timeline.py: a free stand-in timeline from script.txt alone, before the voice exists.

usage:  python draft_timeline.py <film dir> [--rate 1.0]
Writes <film>/timeline.json + timeline.js and prints every word with its index (scenes.js uses the indices)."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import parse_script


def draft(script, rate=1.0):
    t, words, lines, subs = 0.4, [], [], []
    prev_who = None
    for l in script['lines']:
        if l['silence'] is not None:
            lines.append({'i': l['i'], 'who': l['who'], 'a': round(t, 3), 'b': round(t + l['silence'], 3), 'silence': l['silence']})
            t += l['silence']
            continue
        if prev_who is not None and l['who'] != prev_who:
            t += .15 / rate
        a0 = t
        for w in l['text'].split():
            letters = sum(c.isalpha() for c in w)
            d = (.11 + .058 * letters) / rate
            words.append({'w': w, 'a': round(t, 3), 'b': round(t + d, 3), 'who': l['who'], 'line': l['i']})
            t += d + .03 / rate
            if w[-1] in '.?!': t += .3 / rate
            elif w[-1] in ',:;': t += .2 / rate
        lines.append({'i': l['i'], 'who': l['who'], 'a': round(a0, 3), 'b': words[-1]['b'], 'silence': None})
        subs.append({'line': l['i'], 'who': l['who'], 'a': round(a0, 3), 'b': round(words[-1]['b'] + .35, 3), 'text': l['text'],
                     'words': [{'w': x['w'], 'a': x['a'], 'b': x['b']} for x in words if x['line'] == l['i']]})
        t += .35 / rate
        prev_who = l['who']
    return {'dur': round(t + .6, 2), 'draft': True, 'words': words, 'lines': lines, 'subs': subs}


def write_timeline(tl, film):
    json.dump(tl, open(os.path.join(film, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    open(os.path.join(film, 'timeline.js'), 'w', encoding='utf-8').write('window.TIMELINE=' + json.dumps(tl, ensure_ascii=False) + ';')


def main():
    film = sys.argv[1].rstrip('/\\')
    rate = float(sys.argv[sys.argv.index('--rate') + 1]) if '--rate' in sys.argv else 1.0
    tl = draft(parse_script(open(os.path.join(film, 'script.txt'), encoding='utf-8').read()), rate)
    write_timeline(tl, film)
    for i, w in enumerate(tl['words']):
        print(f"{i:3d} {w['a']:6.2f} L{w['line']:<2d} {w['w']}")
    print(f"draft: {len(tl['words'])} words, {tl['dur']} s")


if __name__ == '__main__':
    main()
