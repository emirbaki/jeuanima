# Ledger — plan: docs/plans/2026-10-28-jeuanima-motoru.md

- Ruling: No git repo, no worktree, no commits — the user's projects are not git repos (Jeu Bilgi neither) — cost if wrong: no history; files are the record.
- Ruling: Whisper runs with device='cpu' — cublas64_12.dll is missing on this machine — cost if wrong: slower transcription (medium model ~1.5 min for 90 s audio).
- Ruling: First film is the user's joke (minik_piyanist, 87.7 s), not a vine — user supplied voice + idea — cost if wrong: vine path is tested later.
- Ruling: A narrator line (ANLATICI) shows subtitles with no speaker pill; character lines show a pill — narration is not a character on screen — cost if wrong: one flag in subs.js.
- Task 3: Ruling: a (sessizlik X) line replaces the 0.3 s gap between per-line files (no extra gap around it) — the user writes the exact pause — cost if wrong: 0.6 s longer pauses.
- Task 6: Ruling: brand.js (core) draws with the scifi-toon pack's toon.js and portal.js — only one pack exists; a second pack needs a style-neutral logo path — cost if wrong: one import change per new pack.
- Task 8: Ruling: build.ps1 writes film.json without a BOM and mix.py reads utf-8-sig — PowerShell 5.1 adds a BOM that breaks json.load — cost if wrong: none.
- Task 9: complete — films/minik_piyanist built (90.0 s, -14.0 LUFS, 0 black frames, audit clean).
- Final: fixed mix NaN on silent voice / empty score — test_balance_silent_voice_and_empty_music_is_finite RED→GREEN, suite 24/24
- Final: fixed per-line voice files sorted as strings — test_find_voice_natural_order RED→GREEN, suite 24/24
- Final: fixed digits in the script never matching — test_digits_in_script_* RED→GREEN, suite 24/24
- Final: fixed note-only line crash ("ALİ: [güler]") and (sessizlik 1,5) — test_note_only_line_is_a_zero_beat, test_silence_decimal_comma RED→GREEN, suite 24/24
- Final: fixed subtitles over 2 lines leaving the safe zone — audit on a 100-char test film: 157 problems → clean
- Final: fixed build.ps1 missing a new take in assets/voice/ and poster in a trailing silence — checked by running the filter on minik_piyanist
- Final: minor (deferred): an ad-lib heard inside a long pause keeps the previous subtitle on screen through the pause
- Final: minor (deferred): when missing words are stretched into a tiny gap, word ends can overlap the next word start
- Final: minor (deferred): new_film.py accepts non-ascii letters (ş, ı) in a slug
- Final: minor (deferred): assets/voice.mp3 wins silently over an assets/voice/ folder

## Round 2 (user feedback 2026-10-28)
- Ruling: Whisper CUDA uses the DLLs in D:\MLProjelerim\.venv_ml torch/lib through os.add_dll_directory; nothing is installed into that venv — it is the user's ML env — cost if wrong: a torch upgrade there can change the DLL names, then CPU fallback.
- Ruling: retake = one of the next two chunks starts with the same first word and at least 60 % of the chunk's words (difflib), min 2 words; the chunks between are cut too — cost if wrong: a real repeated phrase ("Nope. Nope.") can be cut; --raw keeps the recording.
- Ruling: the signature silence is now a script line (sessizlik 2.2) — the old 3.9 s gap was a retake — cost if wrong: one number in script.txt.
- Ruling: 'animation cut off' read as the punchline reaction being cut by the end card 0.5 s after the last word; fixed with HOLD (2.2 s here) and a faint reaction shot — cost if wrong: the user meant another moment.
- Ruling: the lamp's terminal tag replaced by a paper tag '1000 yıllık' hanging from the spout while Nail shows the lamp, and a dust puff when he puts it down.
- Fixed: noses drawn as a bulb below the eyes for all five cast files.
- Tests: 33/33. Film: 80.8 s, -14.0 LUFS, 0 black frames, audit clean, final Whisper pass has no retake words.

## Round 3 (user feedback 2026-10-28)
- Ruling: 'remove the voice gaps completely' = film.json max_gap 0.12 s (no audible pause, words do not touch) — cost if wrong: one number.
- Ruling: the 0:53 genie silence and its 'silence' music cue removed; the mystic cue now runs from the portal to the tension cue.
- Ruling: mix levels: music 16 dB under the voice + 9 dB duck, foley gain 0.2 and a 6 dB dip under words (measured: speech -18.2 dB, music under speech -36.9 dB).
- Ruling: pupils clamp inside the eye white (below the lid) in chars.eye — fixes Nail looking up with heavy lids.
- Fixed: pockets in jacket colour, tall stool with a foot ring, genie trumpet hand and snap hand kept outside the face, yeniçeri fly out of the portal spinning with flailing arms then cross arms, whip seams, cut settle push, handheld drift, breathing, 12 new foley types.
- Film: 70.25 s (voice 65.8 s + 2.2 s hold + 2 s end card), -14.1 LUFS, 0 black frames, audit clean, 33/33 tests.

## Round 4
- Ruling: 'altyazıyı ortalayıp' = vertical centre band at y 1150 (60 %), not dead centre (y 960), so faces stay clear — cost if wrong: one number, SUB.y.
- Fixed: word-by-word captions, pieces of max 3 words / 18 letters, yellow spoken word; subs carry word times (36/36 tests).
- Ruling: title overlays use setM(identity) inside push/pop, not reset() — reset() empties the matrix stack and the next pop() crashes when a speaker pill draws in the same frame (found in telefon) — cost if wrong: none.
