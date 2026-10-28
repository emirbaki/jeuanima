# JeuAnima video motoru: uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bir senaryo ve kullanıcının yüklediği sesten, Lemo-Opuscar `scifi-toon` stilinde dikey (1080x1920) komik kısa video üreten motor.

**Architecture:** Stilden bağımsız bir çekirdek (senaryo, Whisper hizalama, altyazı, ağız zarfı, marka, mix, build) ve stil paketleri. Sayfa Lemo-Opuscar sayfa sözleşmesini uygular (`window.render(t)`, `READY`, `DUR`, `EV`, `TEXTS`). Render araçları `~/lemo-opuscar` kütüphanesinden çalışır.

**Tech Stack:** Canvas 2D + ES modülleri, Node (Lemo-Opuscar render araçları, Playwright), Python 3.12 (`~/lemo-opuscar/.venv/Scripts/python.exe`: numpy, scipy, librosa, soundfile, faster-whisper, pytest), ffmpeg, PowerShell build.

**Spec:** `docs/specs/2026-10-28-jeuanima-motoru-tasarim.md`

## Global Constraints

- Format 1080x1920, render 24 fps. Karakter pozu, ağız, göz kırpma, çizgi titremesi 12 fps (`q(t)`).
- Her şey `t`'nin saf fonksiyonu. `Math.random` ve saat yok. Tohumlu `hash`/`mulberry` kullan.
- Sahne kodu saniye sabitlemez: `w(i)`, `edge(i)`, `L(n)`, `Lend(n)`.
- Altyazı Whisper'ın duyduğunu gösterir. Senaryo kelime indeksleri doğaçlamadan etkilenmez.
- Whisper dili `tr`. Türkçe karşılaştırma anahtarı: `İ→i`, `I→ı`, sonra `lower()`, noktalama ve kesme işareti atılır.
- Replik başına ses dosyalarında varsayılan boşluk 0.3 sn. `(sessizlik X)` X sn verir.
- Güvenli bölge (Claude kararı, sosyal medya arayüzü dışarıda kalır): yazı x 60..1020, y 220..1500. Altyazı bandı y 1330..1500, merkez y 1400.
- Altyazı fontu Baloo 2 ExtraBold ~56 px, beyaz, ~11 px siyah dış çizgi, solda konuşmacı rengi etiketi. 900 px üstü satır iki satıra bölünür.
- Çizgi rengi `#1b1422`, çizgi kalınlığı ekran uzayında sabit (karakter 7 px).
- Telif: hiçbir dizinin karakteri, adı, portal görünüşü kopyalanmaz. Portal rengi asit yeşili değil. Videoda LemoLab yazısı yok.
- Uyarlanan demo kodu `engine/styles/scifi-toon/LICENSE` (MIT) ve `CREDITS.md` taşır.
- `~/lemo-opuscar/core/` ve `styles/` değiştirilmez.
- Klasör git deposu değil: commit adımı yok. Her görevin sonunda testler ve kontroller geçer.

## Review Focus

1. Türkçe büyük-küçük harf (`İSTANBUL` / `istanbul`, `IŞIK` / `ışık`) hizalamada eşleşir. → Görev 2 testi `test_norm_turkish`.
2. İki replik arasında doğaçlama kelime önceki repliğe ve konuşmacıya gider. → Görev 2 testi `test_adlib_between_lines_goes_to_previous`.
3. Seste olmayan senaryo kelimesi altyazıda yok, zamanı komşulardan, zamanlar monoton. → Görev 2 testi `test_missing_word_interpolated_monotonic`.
4. Replik başına dosyalar sıra ve boşlukla birleşir, `(sessizlik 1.5)` 1.5 sn ekler. → Görev 3 testi `test_concat_gaps`.
5. Uzun Türkçe altyazı iki satıra bölünür ve güvenli bölgede kalır, ğ ş İ doğru çizilir. → Görev 5 kontrolü (`audit.mjs` + still).

---

## Dosya yapısı

```
engine/
  core/
    py/script.py          senaryo ayrıştırma (Görev 1)
    py/align.py           hizalama + altyazı kurma (Görev 2)
    py/draft_timeline.py  taslak zamanlama CLI (Görev 1)
    py/prep_timeline.py   ses → timeline CLI (Görev 3)
    py/lips.py            ağız zarfı (Görev 3)
    py/mix.py             foley + ses + müzik mix (Görev 7)
    js/film.js            shot/seam/ev kaydı, boot, sayfa sözleşmesi (Görev 4)
    js/time.js            w, edge, L, Lend, q, talking, mouthOpen (Görev 4)
    js/subs.js            altyazı çizimi + TEXTS (Görev 5)
    js/brand.js           logo, bitiş kartı, takip kartı (Görev 6)
    tools/audit.mjs       güvenli bölge + çakışma (Görev 5)
    tools/new_film.py     film iskeleti (Görev 8)
    templates/            index.html, build.ps1, film.json, scenes.js
    fonts/                Baloo2, VT323 vb.
    tests/                pytest
  styles/scifi-toon/
    toon.js chars.js props.js portal.js score.py foley.py STYLE.md LICENSE CREDITS.md   (Görev 6, 7)
  cast/scifi-toon/        <ad>.js + engine/cast/CAST.md (Görev 6)
.claude/skills/jeuanima-video/SKILL.md, CLAUDE.md (Görev 8)
films/<slug>/             (Görev 9)
```

Python araçlarını `PY=~/lemo-opuscar/.venv/Scripts/python.exe` ile çalıştır. Testler: `$PY -m pytest engine/core/tests -q`.

---

### Task 1: Senaryo ayrıştırma ve taslak zamanlama

**Files:**
- Create: `engine/core/py/script.py`, `engine/core/py/draft_timeline.py`
- Test: `engine/core/tests/test_script.py`

**Interfaces:**
- Produces:
  - `parse_script(text: str) -> dict` → `{"lines": [{"i": int, "who": str, "text": str, "notes": [str], "silence": float|None}], "words": [{"w": str, "line": int, "who": str}]}`. `notes` = `[...]` içeriği. `silence` sadece `(sessizlik)` satırında: süre yoksa `1.0`. Sessizlik satırının `who`'su `""`, kelimesi yok.
  - `norm(s: str) -> str` (Türkçe anahtar, Global Constraints).
  - Timeline JSON biçimi (Görev 2, 3, 4 ortak): `{"dur": float, "draft": bool, "words": [{"w","a","b","who","line"}], "lines": [{"i","who","a","b","silence"}], "subs": [{"line","who","a","b","text"}]}`. `words` senaryo kelimeleridir (indeks sabit). `subs` ekranda gösterilen altyazı parçalarıdır.
  - `draft_timeline.py script.txt <film>` → `<film>/timeline.json` + `<film>/timeline.js` (`window.TIMELINE=...;`). Her kelimeyi indeksiyle yazdırır.

- [ ] **Step 1: Test yaz** `test_parse_basic` (`"DURSUN: Bu ne? [şaşkın]\nTEMEL: Makine."` → 2 satır, `lines[0].notes == ["şaşkın"]`, `words` 3 adet, `words[2].who == "TEMEL"`), `test_parse_silence` (`(sessizlik 1.5)` → `silence == 1.5`, `(sessizlik)` → `1.0`), `test_norm_turkish` (`norm("İSTANBUL'a,") == norm("istanbula")`, `norm("IŞIK") == "ışık"`), `test_draft_monotonic` (draft timeline'da `a` artan, sessizlik satırı ≥ süresi kadar boşluk).
- [ ] **Step 2:** `$PY -m pytest engine/core/tests/test_script.py -q` → FAIL.
- [ ] **Step 3:** Uygula. Taslak süre: Jeu Bilgi `draft_timeline.py` formülü (`.11 + .058*harf`), replik sonu +0.35 sn, konuşmacı değişimi +0.15 sn. Taslakta `subs` her replik için senaryo metniyle tek parça.
- [ ] **Step 4:** Testler PASS.

### Task 2: Hizalama ve "duyulan" altyazı

**Files:**
- Create: `engine/core/py/align.py`
- Test: `engine/core/tests/test_align.py`

**Interfaces:**
- Consumes: `parse_script`, `norm` (Görev 1).
- Produces: `align(script_words: list[dict], heard: list[dict], dur: float) -> dict` → `{"times": [[a,b]], "how": ["match"|"pair"|"spread"], "subs": [...], "report": {"added": [str], "missing": [str], "doubtful": [str]}}`. `heard` = `[{"w","a","b","p"}]` (`p` = Whisper olasılığı).
  - `apply_fixes(subs, fixes: dict) -> subs`: `subs_fix.json` = `{"yanlış kelime": "doğru kelime"}`, tam kelime değişimi.

- [ ] **Step 1: Test yaz:**
  - `test_exact_match`: duyulan = senaryo → hepsi `match`, `subs` metni senaryo yazımı (büyük harf, noktalama korunur).
  - `test_adlib_inside_line`: duyulan replik içinde fazladan "yani" → altyazıda var, aynı konuşmacı, `report.added == ["yani"]`, `times` uzunluğu senaryo kelime sayısı.
  - `test_adlib_between_lines_goes_to_previous`: iki replik arasında duyulan "hmm" → önceki repliğin altyazısına eklenir.
  - `test_missing_word_interpolated_monotonic`: senaryo kelimesi seste yok → altyazıda yok, `how == "spread"`, `times` monoton, `report.missing` içinde.
  - `test_doubtful`: `p < 0.5` olan duyulan kelime `report.doubtful` içinde.
  - `test_fixes`: `apply_fixes` kelimeyi değiştirir.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Uygula. Eşleme Jeu Bilgi `prep_timeline.py::align_script` (difflib bloklar + boşluk doldurma). Duyulan her kelimeye repliğini ver: eşleşen kelime senaryo repliğini alır. Eşleşmeyen duyulan kelime, kendinden önceki en yakın eşleşmenin repliğini alır (başta ise sonrakinin). Altyazı parçası = bir repliğin duyulan kelimeleri, `a` = ilk kelime, `b` = son kelime + 0.35 sn, sonraki parçanın başlangıcını geçmez. Eşleşen kelimede senaryo yazımı, eşleşmeyende Whisper yazımı.
- [ ] **Step 4:** PASS.

### Task 3: Ses girişi, Whisper, ağız zarfı

**Files:**
- Create: `engine/core/py/prep_timeline.py`, `engine/core/py/lips.py`
- Test: `engine/core/tests/test_prep.py`

**Interfaces:**
- Consumes: `parse_script`, `align`, `apply_fixes`.
- Produces:
  - `concat_lines(paths: list[str], lines: list[dict], sr=48000) -> (np.ndarray, list[[a,b]])`: replik dosyalarını sırayla, 0.3 sn boşlukla, sessizlik satırında `silence` sn ile birleştirir.
  - CLI `prep_timeline.py <film> [--whisper-json f] [--model small]`: `assets/voice.mp3` varsa onu, yoksa `assets/voice/*.mp3|wav` (ad sırası) kullanır. Çıktılar: `out/voice.wav` (48 kHz mono), `timeline.json/js` (`draft: false`), `out/whisper.json`, `out/align_report.json`. Üç rapor listesini yazdırır. `subs_fix.json` varsa uygular.
  - CLI `lips.py <film>` → `lips.json` = `{"fps": 24, "o": [float], "b": [float]}` (tüm ses için, RMS ve spektral merkez, demo `voice.py` formülü). Konuşmacıyı JS tarafı `lines` aralığından bulur.
- [ ] **Step 1: Test yaz** `test_concat_gaps`: 0.5 sn ve 0.4 sn iki ton + arada `(sessizlik 1.5)` → toplam ≈ 0.5+0.3+1.5+0.3+0.4, dönen aralıklar doğru. `test_lips_shape`: 1 sn ton → `len(o) == 24 ± 1`, değerler 0..1.
- [ ] **Step 2:** FAIL. **Step 3:** Uygula. Whisper: `faster_whisper.WhisperModel(model, compute_type="int8")`, `language="tr"`, `word_timestamps=True`, `initial_prompt` = senaryo metni (isimleri doğru yazdırır). **Step 4:** PASS.
- [ ] **Step 5: Gerçek ses denemesi:** `$PY engine/core/py/prep_timeline.py` herhangi bir Türkçe konuşma kaydıyla (yoksa Görev 9'da) çalışır, rapor yazdırır.

### Task 4: Sayfa çekirdeği (zaman, shot, ev, boot)

**Files:**
- Create: `engine/core/js/time.js`, `engine/core/js/film.js`, `engine/core/templates/index.html`

**Interfaces:**
- Consumes: `window.TIMELINE`, `lips.json` (opsiyonel, fetch).
- Produces (`time.js`): `w(i)`, `wb(i)` (kelime sonu), `edge(i)` (kelimeden önceki kesme: önceki kelime sonu ile bu kelime başının ortası), `L(n)`, `Lend(n)`, `q(t)` (12 fps), `talking(who, t) -> bool`, `mouthOpen(who, t) -> 0..1` (konuşmuyorsa 0, lips yoksa taslakta hece benzeri sinüs), `mouthWide(who,t)`.
- Produces (`film.js`): `shot(a, b, fn(lt, t))`, `seam(t, type, d)` (`'cut'|'portal'`, stil paketi `portal` wipe çizicisini kaydeder: `registerSeam(type, fn(t, k))`), `ev(t, type, opts)`, `boot({W:1080, H:1920, dur, overlay(t)})` → `window.render`, `window.DUR` (timeline dur + 2 sn bitiş kartı), `window.EV`, `window.TEXTS`, fontlar yüklenince `window.READY = true`. `texts.push({id,text,x0,y0,x1,y1})` için `reportText(...)`.
- [ ] **Step 1:** Boş bir test filmi (`engine/core/templates` ile) bir dolu renk + sayaç çizsin.
- [ ] **Step 2:** `cd ~/lemo-opuscar && node core/render/still.mjs <test> 0.5 2 --size 1080x1920` → iki JPEG, hata yok. `node core/render/events.mjs <test> --size 1080x1920` → `events.json`.

### Task 5: Altyazı ve denetim

**Files:**
- Create: `engine/core/js/subs.js`, `engine/core/tools/audit.mjs`; fontları kopyala (`Jeu Bilgi Motoru/fonts/Baloo2-wght.ttf`, demo `fonts/` VT323 ve başlık fontu).

**Interfaces:**
- Consumes: `TIMELINE.subs`, `film.json` `cast` (`{AD: {color}}`).
- Produces: `drawSubs(t, castColors)`. Kurallar: parça `a..b` arasında görünür, `(sessizlik)` satırında ekran temiz, aynı anda iki parça varsa yeni olan altta, eski olan üstte %70 opaklık. Her parça `reportText` ile `TEXTS`'e gider (id `sub<line>`).
- `audit.mjs <film>`: her 0.1 sn `TEXTS(t)` alır. Hata: kutu güvenli bölge dışında, iki kutu çakışıyor. Çıkış kodu 0/1, ilk 20 hatayı yazdırır.
- [ ] **Step 1:** Test filminde 60+ harflik Türkçe bir replik (ğ ş İ ı içerir) taslak timeline ile çizilsin.
- [ ] **Step 2:** Still al ve gözle kontrol et: iki satır, harfler doğru, etiket konuşmacı renginde. `node engine/core/tools/audit.mjs <test>` → 0.

### Task 6: scifi-toon stil paketi, kadro, marka

**Files:**
- Create: `engine/styles/scifi-toon/{toon.js, chars.js, props.js, portal.js, STYLE.md, LICENSE, CREDITS.md}`, `engine/cast/scifi-toon/` (ilk film karakterleri Görev 9'da), `engine/cast/CAST.md`, `engine/core/js/brand.js`, `assets/brand/`.

**Interfaces:**
- `toon.js`: demo `toon.js` uyarlaması, `W=1080, H=1920`. API aynı: `push/pop/translate/rotate/scale`, `frame(t)`, `shape`, `spline`, `ell`, `rr`, `noodle`, `text`, `bands`, `screenRect`.
- `chars.js`: `eye`, `mouth`, `hand` (demodan) + parametrik genel karakter `toonChar(spec, pose)`. `spec` = kadro dosyası (`{name, color, skin, head: {shape, w, h}, hair, outfit: {...}, eyes: {...}, height}`), `pose` = `{x, y, s, look, lid, o, w, sm, brow, arm: {...}, jitter, squash, facing}`. Demo karakterlerinin (Vask, Gary) çizimi kopyalanmaz, sadece parça fonksiyonları.
- `props.js`: oda arka planı (`room(t, pal)`: düz renk bantları, zemin, duvar detayı), `screenTag(text, col, t0, t)` (VT323 terminal etiketi), `titleCard(text, t0, t)` (kalın başlık, 12 fps adımlarla girer, STYLE.md §4).
- `portal.js`: `portal(cx, cy, r, t, {open, col})`, `portalWipe(t, k)` → `registerSeam('portal', ...)`. Portal rengi kanal rengidir: mor-turuncu, asit yeşili değil.
- `brand.js`: `logo(x, y, s, t)` (JeuAnima yazısı, kalın titreyen çizgi, kanal rengi), `endCard(t, {follow})` (2 sn, `follow: "end"` ise "Takip et!" etiketi).
- [ ] **Step 1: Model sayfası:** test filminde iki örnek karakter (biri sakin, biri panik), portal ve logo tek karede.
- [ ] **Step 2:** Still al. STYLE.md'ye karşı kontrol: çizgi sabit kalınlık, titreme 12 fps (ardışık iki 24 fps kare aynı, sonraki farklı), düz dolgu, gradyan yok, portal tek parlayan şey. Siluet testi: karakterler siyah dolguda okunuyor.

### Task 7: Müzik, efekt, mix

**Files:**
- Create: `engine/styles/scifi-toon/score.py`, `engine/styles/scifi-toon/foley.py`, `engine/core/py/mix.py`

**Interfaces:**
- `score.py <film>`: `film.json` `music: [{t, cue, until?}]` (cue: `theme`, `tension`, `silence`, `sting` + dünya türleri) ve `events.json` okur, `out/score.wav` yazar. Teknik demo `music/score.py`'den: theremin melodi, analog bas, kare arpej, davul makinesi.
- `foley.py`: `SOUNDS: dict[str, Callable[[dict], np.ndarray]]` (`portal_open`, `portal_close`, `whoosh`, `pop`, `boing`, `glorp`, `blip`, `click`, `kazoo`, `squeak`, `thump`, `gulp`). Bilinmeyen tür sessiz kalır, uyarı yazdırır.
- `mix.py <film>`: `out/voice.wav` (yoksa sessiz), `out/score.wav`, `events.json` foley → `out/mix.wav` 48 kHz stereo. Müzik konuşma altında −7 dB, ses RMS ile müziğin ~10 dB üstünde, ses önce kompresörden geçer. `silence` cue reverb dahil keser.
- [ ] **Step 1:** Test filminde 4 farklı `ev` + `theme` → `silence` → `sting`.
- [ ] **Step 2:** `mix.py` çalışır. `ffmpeg -i out/mix.wav -af ebur128 -f null -` hatasız. `silence` aralığında müzik RMS < −60 dBFS (bir satırlık numpy kontrolü).

### Task 8: İskelet aracı, build, skill, CLAUDE.md

**Files:**
- Create: `engine/core/tools/new_film.py`, `engine/core/templates/{build.ps1, film.json, scenes.js}`, `.claude/skills/jeuanima-video/SKILL.md`, `CLAUDE.md`

**Interfaces:**
- `new_film.py <slug> --style scifi-toon --kind vine|sketch`: `films/<slug>/` oluşturur, `engine/core`, `engine/styles/<style>`, `engine/cast/<style>` ve fontları kopyalar, `film.json` = `{"title", "style", "kind", "follow": "end"|"none", "cast": {}, "music": [], "stage": "idea"}`.
- `build.ps1`: `timeline.json` taslaksa veya ses timeline'dan yeniyse durur. Sırayla: `lips.py` → `events.mjs` → `score.py` → `mix.py` → `audit.mjs` → `video.mjs --fps 24 --workers 4 --size 1080x1920` → `sh core/render/mux.sh` → `<Title>.mp4`, `poster.jpg` (ffmpeg ile en iyi kare). `stage = "built"`.
- SKILL.md: tasarım §12 akışı, `stage` ile devam etme, KAPI 1 (senaryo + takip kartı `end`/`none`), KAPI 2 (replik listesi, ses yükleme yolları), rapor listeleri, telif kuralları, Lemo-Opuscar treatment kuralı (önce treatment, sonra demo).
- CLAUDE.md: Jeu Bilgi `CLAUDE.md` biçiminde: düzen, komutlar, mimari, kurallar.
- [ ] **Step 1:** `new_film.py deneme --style scifi-toon --kind vine` → klasör oluşur, `draft_timeline.py` çalışır, still alınır.

### Task 9: Deneme vine filmi (uçtan uca)

**Files:** `films/<slug>/` (kullanıcının fikri, yoksa Claude'un vine önerisi)

- [ ] **Step 1:** SKILL.md akışını izle: `idea.md`, `TREATMENT.md`, `script.txt`, KAPI 1.
- [ ] **Step 2:** Kadro dosyaları `engine/cast/scifi-toon/` altında, `CAST.md` güncel. Sahneler taslak timeline ile, still + `audit.mjs` temiz.
- [ ] **Step 3:** KAPI 2: kullanıcı sesi yükler. `prep_timeline.py`, raporu kullanıcıya göster.
- [ ] **Step 4:** `build.ps1`. Kontrol: süre ≈ ses + 2 sn, `blackdetect` boş, loudness ≈ −14 LUFS, son videodan 3 kare.
- [ ] **Step 5:** Teslim: `<Title>.mp4`, `poster.jpg`, hizalanamayan kelimeler, izlenmeyen noktalar.
