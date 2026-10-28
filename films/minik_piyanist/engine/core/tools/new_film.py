"""JeuAnima · new_film.py: make films/<slug>/ with its own copy of the engine.

usage:  python engine/core/tools/new_film.py <slug> [--style scifi-toon] [--kind vine|sketch] [--title "Başlık"] [--follow end|none]
Copies engine/core, engine/styles/<style>, engine/cast/<style> and the page templates. Writes film.json (stage: idea),
an empty script.txt and idea.md. A film keeps its engine copy: later engine fixes do not change it."""
import sys, os, json, shutil, argparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('slug'); ap.add_argument('--style', default='scifi-toon'); ap.add_argument('--kind', default='sketch', choices=['vine', 'sketch'])
    ap.add_argument('--title', default=None); ap.add_argument('--follow', default='end', choices=['end', 'none'])
    a = ap.parse_args()
    if not a.slug.replace('_', '').isalnum() or a.slug.lower() != a.slug:
        raise SystemExit('slug: lowercase ascii letters, digits and _ only')
    eng = os.path.join(ROOT, 'engine')
    if not os.path.isdir(os.path.join(eng, 'styles', a.style)):
        raise SystemExit(f'no style pack engine/styles/{a.style}')
    film = os.path.join(ROOT, 'films', a.slug)
    if os.path.exists(film): raise SystemExit(f'{film} exists')
    for sub in ('core', os.path.join('styles', a.style), os.path.join('cast', a.style)):
        shutil.copytree(os.path.join(eng, sub), os.path.join(film, 'engine', sub), ignore=shutil.ignore_patterns('tests', '__pycache__'))
    for f in ('index.html', 'build.ps1', 'scenes.js'):
        shutil.copy(os.path.join(eng, 'core', 'templates', f), film)
    os.makedirs(os.path.join(film, 'assets'), exist_ok=True)
    json.dump({'title': a.title or a.slug.replace('_', ' ').title(), 'style': a.style, 'kind': a.kind, 'follow': a.follow, 'cast': {}, 'stage': 'idea'},
              open(os.path.join(film, 'film.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(os.path.join(film, 'script.txt'), 'w', encoding='utf-8').write('# WHO: text [note]   ·   (sessizlik 1.5)\n')
    open(os.path.join(film, 'idea.md'), 'w', encoding='utf-8').write('# Fikir\n\n')
    print(film)


if __name__ == '__main__':
    main()
