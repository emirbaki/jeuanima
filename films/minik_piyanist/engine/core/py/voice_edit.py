"""JeuAnima · voice_edit.py: clean a single-file voice before alignment.

A home recording has retakes ("Lambayı ovaladıklarında ortaya çıkıyor... Lambayı ovaladıklarında ortaya çok yaşlı...")
and long gaps. The steps:
  split_chunks    cut the track at silences (energy below a share of the loud level for min_sil seconds)
  find_retakes    a chunk is a false start when one of the next two chunks starts with the same words
  assemble        keep the good chunks, shorten every gap to max_gap, remember where each chunk moved (remap)
  insert_silences add the script's (sessizlik X) beats back as exact silences
All pure functions on numpy arrays; prep_timeline.py runs Whisper on each chunk and calls them."""
import difflib
import numpy as np


def split_chunks(y, sr, min_sil=.3, th_rel=.06, hop_s=.02, min_len=.12):
    hop = max(1, int(hop_s * sr))
    n = len(y) // hop
    if n == 0: return []
    e = np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(1))
    loud = e > np.percentile(e, 95) * th_rel
    chunks, i, need = [], 0, int(round(min_sil / hop_s))
    while i < n:
        if not loud[i]: i += 1; continue
        j, quiet = i, 0
        while j < n:
            quiet = quiet + 1 if not loud[j] else 0
            if quiet >= need: break
            j += 1
        end = j - quiet + 1
        if (end - i) * hop_s >= min_len: chunks.append((round(i * hop_s, 3), round(end * hop_s, 3)))
        i = j + 1
    return chunks


def _restart(a, b):
    """How many words of the false start a come back at the start of b (same first word, one word may change)."""
    if not a or not b or a[0] != b[0]: return 0
    sm = difflib.SequenceMatcher(None, a, b[:len(a) + 1], autojunk=False)
    return sum(m.size for m in sm.get_matching_blocks())


def find_retakes(words, look=2, min_words=2, share=.6):
    """words: normalized word lists, one per chunk. Returns the indexes to drop: false starts, the filler between a
    false start and its restart ("Evet."), and chunks with no words."""
    drop = {i for i, w in enumerate(words) if not w}
    for i, w in enumerate(words):
        if not w or i in drop: continue
        for j in range(i + 1, min(len(words), i + 1 + look)):
            k = _restart(w, words[j])
            if k >= min_words and k >= share * len(w):
                drop.update(range(i, j)); break
    return drop


def assemble(y, sr, chunks, keep, max_gap=.55, lead=.6, tail=.3, pad=.06):
    """Returns (track, mapping); mapping = [(src_a, src_b, dst_a)] for each kept chunk (pad included)."""
    parts, mapping, t, prev_end = [np.zeros(int(lead * sr))], [], lead, None
    for i in sorted(keep):
        a, b = max(0., chunks[i][0] - pad), min(len(y) / sr, chunks[i][1] + pad)
        if prev_end is not None:
            g = min(max(0., a - prev_end), max_gap); parts.append(np.zeros(int(round(g * sr)))); t += round(g * sr) / sr
        seg = y[int(a * sr):int(b * sr)]
        mapping.append((a, b, t)); parts.append(seg); t += len(seg) / sr; prev_end = b
    parts.append(np.zeros(int(tail * sr)))
    return np.concatenate(parts), mapping


def remap(t, mapping, tol=.15):
    """Source time -> cleaned time. None when t falls in a dropped part."""
    for a, b, d in mapping:
        if a - tol <= t <= b + tol: return d + min(max(t, a), b) - a
    return None


def insert_silences(y, sr, words, inserts):
    """inserts: [(t, seconds)] in cleaned time. Inserts exact silences; words ({'a','b'}) after t move later."""
    words = [dict(w) for w in words]
    for t, d in sorted(inserts, reverse=True):
        k = int(round(t * sr)); y = np.concatenate([y[:k], np.zeros(int(round(d * sr))), y[k:]])
        for w in words:
            if w['a'] >= t: w['a'] += d; w['b'] += d
    return y, words
