"""JeuAnima · prep_timeline.py: the user's voice + script.txt -> the timeline the page reads.

usage:  python prep_timeline.py <film dir> [--model large-v3] [--fresh] [--raw]
  --fresh  transcribe again (chunk transcripts are cached in out/chunks.json)
  --raw    single file only: keep the recording as it is (no retake cut, no gap shortening)
  --max-gap S   longest gap kept between chunks (default: film.json "max_gap", else 0.55; 0.1 = no gaps)
Voice input, first found:
  assets/voice.(wav|mp3|m4a|mp4)    the whole dialogue in one file
  assets/voice/*.(wav|mp3|m4a)      one file per spoken line, in script order (name order); silence lines take no file
A single file is cleaned first (voice_edit.py): retakes cut, gaps shortened to 0.55 s, (sessizlik X) lines added
back as exact silences. Whisper: CUDA large-v3 when the CUDA DLLs load (JEUANIMA_CUDA_DLLS), else CPU medium.
Writes out/voice.wav (48 kHz mono), timeline.json/.js (draft: false), out/whisper.json, out/align_report.json.
Subtitles show what Whisper heard; subs_fix.json ({"heard": "right"}) corrects words. Prints the voice edits and three
lists: added (said but not in the script), missing (in the script but not heard), doubtful (low Whisper probability)."""
import sys, os, re, json, glob, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import parse_script, line_spans, norm
from align import align, apply_fixes
from draft_timeline import write_timeline

SR = 48000
GAP = .3             # seconds between per-line files
AUDIO = ('.wav', '.mp3', '.m4a', '.mp4', '.aac', '.ogg', '.flac')
CUDA_DLLS = os.environ.get('JEUANIMA_CUDA_DLLS', r'D:\MLProjelerim\.venv_ml\Lib\site-packages\torch\lib')


def load_audio(path, sr=SR):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def concat_lines(clips, lines, sr=SR):
    """clips: one array per spoken line. Returns (track, [[a, b]] per spoken line)."""
    spoken = [l for l in lines if l['silence'] is None]
    if len(clips) != len(spoken):
        raise ValueError(f'{len(spoken)} spoken lines in the script, but {len(clips)} voice files')
    parts, spans, t, k, after_silence = [], [], 0.0, 0, False
    for l in lines:
        if l['silence'] is not None:       # a silence line replaces the gap (a zero-length acting beat does not)
            n = int(round(l['silence'] * sr)); parts.append(np.zeros(n, np.float32)); t += n / sr; after_silence = after_silence or n > 0
            continue
        if k > 0 and not after_silence:
            n = int(round(GAP * sr)); parts.append(np.zeros(n, np.float32)); t += n / sr
        c = clips[k]; parts.append(c.astype(np.float32))
        spans.append([round(t, 3), round(t + len(c) / sr, 3)]); t += len(c) / sr; k += 1; after_silence = False
    return np.concatenate(parts), spans


def find_voice(film):
    for ext in AUDIO:
        p = os.path.join(film, 'assets', 'voice' + ext)
        if os.path.exists(p): return [p]
    nat = lambda f: [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', os.path.basename(f))]
    files = sorted((f for f in glob.glob(os.path.join(film, 'assets', 'voice', '*')) if f.lower().endswith(AUDIO)), key=nat)
    if files: return files
    raise SystemExit('no voice found: put assets/voice.mp3 (one file) or assets/voice/01.mp3, 02.mp3 ... (one per line)')


def load_model(name=None):
    """CUDA + large-v3 when the CUDA DLLs load (torch's lib folder has cublas and cudnn), else CPU + medium."""
    from faster_whisper import WhisperModel
    if os.path.isdir(CUDA_DLLS):
        try:
            os.add_dll_directory(CUDA_DLLS); os.environ['PATH'] = CUDA_DLLS + os.pathsep + os.environ['PATH']
            m = WhisperModel(name or 'large-v3', device='cuda', compute_type='float16')
            list(m.transcribe(np.zeros(16000, np.float32), language='tr')[0])   # a missing DLL fails here
            print('whisper: cuda', name or 'large-v3'); return m
        except Exception as e:
            print(f'whisper: cuda not usable ({type(e).__name__}), using cpu')
    print('whisper: cpu', name or 'medium')
    return WhisperModel(name or 'medium', device='cpu', compute_type='int8')


def transcribe(model, audio16k, offset=0.0):
    segs, _ = model.transcribe(audio16k, language='tr', word_timestamps=True, condition_on_previous_text=False)
    return [{'w': w.word.strip(), 'a': round(offset + w.start, 3), 'b': round(offset + w.end, 3), 'p': round(w.probability, 3)}
            for s in segs for w in s.words if w.word.strip()]


def clean_single(film, path, model_name, fresh, max_gap=.55, lead=.6):
    """Split at silences, transcribe each chunk, cut retakes, shorten gaps.
    Returns (track 48 kHz, heard words in the cleaned time, report lines). Chunk transcripts are cached in out/chunks.json."""
    from voice_edit import split_chunks, find_retakes, assemble, remap
    y = load_audio(path); y16 = load_audio(path, 16000)
    chunks = split_chunks(y, SR)
    cache = os.path.join(film, 'out', 'chunks.json')
    key = json.loads(json.dumps([os.path.getsize(path), os.path.getmtime(path), chunks]))
    data = json.load(open(cache, encoding='utf-8')) if os.path.exists(cache) and not fresh else None
    if not data or data.get('key') != key:
        model = load_model(model_name); words = []
        for a, b in chunks:
            a0, b0 = max(0, a - .05), b + .05
            words.append(transcribe(model, y16[int(a0 * 16000):int(b0 * 16000)], a0))
        data = {'key': key, 'words': words}
        json.dump(data, open(cache, 'w', encoding='utf-8'), ensure_ascii=False)
    words = data['words']
    drop = find_retakes([[norm(w['w']) for w in ws] for ws in words])
    keep = [i for i in range(len(chunks)) if i not in drop]
    y2, mapping = assemble(y, SR, chunks, keep, max_gap=max_gap, lead=lead)
    heard = []
    for i in keep:
        for w in words[i]:
            a, b = remap(w['a'], mapping), remap(w['b'], mapping)
            if a is not None and b is not None: heard.append({**w, 'a': round(a, 3), 'b': round(b, 3)})
    rep = [f"  cut {chunks[i][0]:6.2f}-{chunks[i][1]:6.2f}  " + (' '.join(w['w'] for w in words[i]) or '(no words)') for i in sorted(drop)]
    rep.append(f"  voice {len(y) / SR:.2f} s -> {len(y2) / SR:.2f} s ({len(chunks)} chunks, {len(drop)} cut, gaps at most {max_gap:g} s)")
    return y2, heard, rep


def silence_inserts(script, times):
    """(sessizlik X) lines -> [(t, X)]: in the middle of the gap between the spoken lines around them."""
    by_line = {}
    for k, w in enumerate(script['words']): by_line.setdefault(w['line'], []).append(k)
    out = []
    for l in script['lines']:
        if not l['silence']: continue
        prev = [k for li, ks in by_line.items() if li < l['i'] for k in ks]
        nxt = [k for li, ks in by_line.items() if li > l['i'] for k in ks]
        if prev and nxt: out.append(((times[max(prev)][1] + times[min(nxt)][0]) / 2, l['silence']))
        elif prev: out.append((times[max(prev)][1] + .1, l['silence']))
    return out


def to16k(y):
    import librosa
    return librosa.resample(y.astype(np.float32), orig_sr=SR, target_sr=16000)


def main():
    import soundfile as sf
    from voice_edit import insert_silences
    film = sys.argv[1].rstrip('/\\')
    arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
    script = parse_script(open(os.path.join(film, 'script.txt'), encoding='utf-8').read())
    os.makedirs(os.path.join(film, 'out'), exist_ok=True)
    files = find_voice(film)
    single = len(files) == 1 and os.path.basename(os.path.dirname(files[0])) != 'voice'
    edits = []
    if single and '--raw' not in sys.argv:
        cfg = json.load(open(os.path.join(film, 'film.json'), encoding='utf-8-sig')) if os.path.exists(os.path.join(film, 'film.json')) else {}
        mg = float(arg('--max-gap', cfg.get('max_gap', .55)))
        y, heard, edits = clean_single(film, files[0], arg('--model'), '--fresh' in sys.argv, max_gap=mg, lead=min(.6, max(.25, mg * 2)))
        ins = silence_inserts(script, align(script, heard, len(y) / SR)['times'])
        if ins:
            y, heard = insert_silences(y, SR, heard, ins)
            edits.append('  silences added: ' + ', '.join(f'{d:g} s at {t:.2f}' for t, d in ins))
    else:
        y = load_audio(files[0]) if single else concat_lines([load_audio(f) for f in files], script['lines'])[0]
        heard = transcribe(load_model(arg('--model')), to16k(y))
    sf.write(os.path.join(film, 'out', 'voice.wav'), y, SR)
    dur = len(y) / SR
    json.dump(heard, open(os.path.join(film, 'out', 'whisper.json'), 'w', encoding='utf-8'), ensure_ascii=False)

    r = align(script, heard, dur)
    fx = os.path.join(film, 'subs_fix.json')
    if os.path.exists(fx): apply_fixes(r['subs'], json.load(open(fx, encoding='utf-8')))
    words = [{'w': w['w'], 'a': t[0], 'b': t[1], 'who': w['who'], 'line': w['line']} for w, t in zip(script['words'], r['times'])]
    tl = {'dur': round(dur + .3, 2), 'draft': False, 'words': words,
          'lines': line_spans(script, r['times']), 'subs': r['subs']}
    write_timeline(tl, film)
    json.dump({'how': r['how'], **r['report'], 'edits': edits}, open(os.path.join(film, 'out', 'align_report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for i, (w, h) in enumerate(zip(words, r['how'])):
        print(f"{i:3d} {w['a']:6.2f} L{w['line']:<2d} {w['w']}" + ('' if h == 'match' else f'   <{h}>'))
    rep = r['report']
    if edits: print('voice edits:'); print('\n'.join(edits))
    print(f"voice {dur:.2f} s · {len(words)} script words · {r['how'].count('match')} matched")
    print('added (said, not in script):', ', '.join(rep['added']) or '-')
    print('missing (in script, not heard):', ', '.join(rep['missing']) or '-')
    print('doubtful (check by ear):', ', '.join(rep['doubtful']) or '-')


if __name__ == '__main__':
    main()
