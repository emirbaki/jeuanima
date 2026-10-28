# CLAUDE.md

This file guides Claude Code in this folder.

## What this is

JeuAnima makes vertical (1080x1920, 24 fps) Turkish comedy shorts for social media: vines (6–15 s), joke re-enactments and sketches (30–90 s). Every film is a Canvas 2D animation in code. The user writes the idea and uploads the voice (ElevenLabs or their own recording). Whisper aligns the voice to the script. The subtitles show what Whisper heard. A headless browser renders the frames, and Python mixes the sound. There is no package.json, no git repository and no test runner other than pytest.

The look comes from Lemo-Opuscar style packs. The render library is **not in this folder**: it lives in `~/lemo-opuscar` (Node + Playwright + Python `.venv`). Never edit `~/lemo-opuscar/core` or `styles`. Use the project skill `jeuanima-video` (`.claude/skills/`) for every new film.

Design: `docs/specs/2026-10-28-jeuanima-motoru-tasarim.md`. Plan and rulings: `docs/plans/`.

## Layout

- `engine/core/`: style-free. `py/` (script parse, Whisper alignment, draft timeline, lips, mix), `js/` (time, film/page contract, subtitles, brand), `tools/` (audit, new_film), `templates/`, `fonts/` (Baloo 2, Poppins: full Turkish glyphs), `tests/` (pytest).
- `engine/styles/<style>/`: one style pack. `scifi-toon`: `toon.js` (boiling vector engine, from the Lemo-Opuscar demo, MIT), `chars.js` (face and body parts), `props.js` (sets, props, title card, terminal tag), `portal.js` (the only glow + the swirl wipe), `ui.js`, `score.py` (synth score from music cues), `foley.py` (synth sounds).
- `engine/cast/<style>/`: recurring characters, one file each, listed in `CAST.md`.
- `films/<slug>/`: one film, with **its own copy of `engine/`**. Fixing the master engine does not change old films.
- Reference film: `films/minik_piyanist` (87.7 s narrated joke, one bar set, 15 shots, genie, portal, punchline).

## Commands

Python is `~/lemo-opuscar/.venv/Scripts/python.exe` (`$PY`). Node render tools run from `~/lemo-opuscar` with the film's absolute path.

```bash
$PY engine/core/tools/new_film.py <slug> --kind vine|sketch --title "Başlık" --follow end|none
$PY films/<slug>/engine/core/py/draft_timeline.py films/<slug>          # free draft timing, prints word indices
$PY films/<slug>/engine/core/py/prep_timeline.py films/<slug>           # voice → cleaned voice + timeline.json (--fresh, --raw)
cd ~/lemo-opuscar && node core/render/still.mjs <film> 2 9.5 --size 1080x1920 --out <film>/stills
node <film>/engine/core/tools/audit.mjs <film>                          # safe zone + text overlap
$PY core/render/sheet.py out.jpg a.jpg b.jpg --cols 5 --w 360           # contact sheet
powershell -ExecutionPolicy Bypass -File films\<slug>\build.ps1         # lips, events, score, mix, audit, video, mux, poster
$PY -m pytest engine/core/tests -q                                       # 33 tests
```

`build.ps1` stops when `timeline.json` is a draft or when the voice is newer than the timeline. A 90 s film builds in about 2 minutes.

## Engine architecture

- Lemo-Opuscar page contract: `window.render(t)`, `READY`, `DUR` (voice + 2 s end card), `EV` (sound and music events), `TEXTS(t)` (every text box, for the audit). Everything is a pure function of `t`. No `Math.random`, no clock.
- `timeline.json`: `words` (script words, fixed indices), `lines` (per script line, `who`, `a`, `b`), `subs` (what was heard, per line). Scenes use `w(i)`, `edge(i)`, `L(n)`, `Lend(n)`, `Ledge(n)`, `wordOf(line, k)`. Never hard-code seconds.
- Pattern: `world(t)` draws the whole set and every character state from the timeline. Each `shot(a, b, fn)` only sets the camera, then calls `world(t)`. Transitions: hard cuts, or `seam(t, 'portal')`.
- Mouths: `mouthOpen(who, t)` from `lips.json` (RMS of the voice, 24 Hz, stepped at 12 fps). Only the line's speaker moves the mouth.
- Sound: `ev(t, type)` types map to `foley.py` SOUNDS (unknown types are silent and listed by `mix.py`). Music: `ev(t, 'music', {cue})` with `title`, `theme`, `march`, `mystic`, `tension`, `silence`, `end`. A cue is cut hard at the next cue.
- Subtitles (`subs.js`): word by word. Each cue is cut into pieces of at most 3 words / 18 letters (a new piece after punctuation), centred at screen y 1150, Baloo 2 70 px with a thick outline. The spoken word is yellow and pops on twos. Narrator lines (`ANLATICI`) have no pill. Character lines get a pill above the piece. Every sub carries `words` [{w, a, b}] from align.py.
- Voice cleaning (`voice_edit.py`, single-file voice only): the track is split at silences, each chunk is transcribed alone, a chunk is cut when one of the next two chunks restarts with the same words (one word may change), and the filler between them ("Evet.") goes too. Gaps are shortened to film.json `max_gap` (default 0.55 s, 0.12 = almost no gaps). `(sessizlik X)` lines are added back as exact silences. The cuts are printed and kept in `out/align_report.json` (`edits`). `--raw` keeps the recording as it is.
- Mix (`mix.py`): music sits `MUSIC_BELOW` 16 dB under the voice and dips `MUSIC_DUCK` 9 dB more while words play. Foley peaks at `FX_GAIN` 0.2 and dips 6 dB under words. The voice must always be on top.
- Motion (`scenes.js` pattern): every cut settles in with a small push, the camera drifts slightly, characters breathe on twos, and some cuts use the `whip` seam (`ui.js`). Foley has 32 types in `foley.py`: put a sound on every visible action.
- End of film: `HOLD` seconds (film.json `hold`, default 1.8) of picture after the last word, for the reaction to the punchline, then the 2 s end card. Use `endStart()` for anything at the end.
- Whisper fixes in `align.py`: a split suffix ("barmen" + "'e") is joined, and digits ("25") match Turkish number words ("yirmi beş") but stay as digits on screen, digits in the script match too, and a heard word that joins two script words ("Adamda" = "Adam da") is split.

## Rules that matter

- Safe zone for text: x 60..1020, y 220..1500. Keep text and key props out of screen y 1080..1220 (caption band).
- Style invariants: `~/lemo-opuscar/styles/scifi-toon/STYLE.md`. Constant screen-space line width, boil at 12 fps, flat fills, hard shadows, the portal (orange to pink, never acid green) is the only glow.
- Copyright: no existing show's characters, names, catchphrases or portal look. No LemoLab text in videos.
- Whisper runs on CUDA (large-v3, float16) by loading cuBLAS/cuDNN from torch's lib folder in `D:\MLProjelerim\.venv_ml` (`JEUANIMA_CUDA_DLLS` overrides the path). Do not install packages into that venv. Without it, CPU + medium. Chunk transcripts are cached in `out/chunks.json`.
- Faces: noses sit below the eyes, inside the face outline (`nose()` in `chars.js`, centre of the bulb).
- On-screen props with text use a diegetic style (a paper tag, a sign), not a terminal readout.
- `film.json` is written without a BOM. Python reads it with `utf-8-sig`.
- Deliverables in a film folder: `<Title>.mp4`, `poster.jpg`, `TREATMENT.md`.
