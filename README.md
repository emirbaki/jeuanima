# JeuAnima

Sosyal medya için dikey (1080x1920, 24 fps) Türkçe komedi kısaları: vine, fıkra canlandırması, skeç. Her film kodla yazılmış bir Canvas 2D animasyonudur.

## Nasıl çalışır

1. Sen fikri ve senaryoyu yazarsın. Sesi kaydedersin (ElevenLabs veya kendi sesin).
2. Whisper sesi senaryoya hizalar. Altyazı, Whisper'ın duyduğunu gösterir.
3. Başsız bir tarayıcı kareleri çizer. Python sesi, müziği ve efektleri karıştırır.

## Kurulum (Windows, yaklaşık 10 dakika)

Önce bu araçları kur: Git for Windows (`sh` için), Node 20+, Python 3.12 (veya [uv](https://docs.astral.sh/uv/)), ffmpeg.

```bash
git clone https://github.com/emirbaki/jeuanima.git
```

```bash
cd jeuanima
```

```bash
powershell -ExecutionPolicy Bypass -File setup.ps1
```

`setup.ps1` şunları yapar:

1. [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) çizim kütüphanesini `~/lemo-opuscar` klasörüne indirir. Başka bir klasör için `LEMO_OPUSCAR_HOME` değişkenini ayarla.
2. Node paketlerini ve başsız Chromium'u kurar.
3. `~/lemo-opuscar/.venv` içine Python paketlerini kurar (`requirements.txt`).
4. Testleri çalıştırır.

Whisper NVIDIA GPU ile hızlı çalışır. GPU yoksa CPU ve `medium` modeli kullanılır.

## Yeni film

`$PY` = `~/lemo-opuscar/.venv/Scripts/python.exe`

1. Filmi aç:
   ```bash
   $PY engine/core/tools/new_film.py benim_filmim --kind sketch --title "Benim Filmim" --follow end
   ```
2. `films/benim_filmim/script.txt` dosyasına senaryoyu yaz. Sahneleri `scenes.js` dosyasına yaz.
3. Sesi `films/benim_filmim/assets/voice.mp3` yoluna koy.
4. Sesi senaryoya hizala:
   ```bash
   $PY films/benim_filmim/engine/core/py/prep_timeline.py films/benim_filmim
   ```
5. Filmi üret. Çıktı: `films/benim_filmim/Benim_Filmim.mp4` ve `poster.jpg`.
   ```bash
   powershell -ExecutionPolicy Bypass -File films\benim_filmim\build.ps1
   ```

Ayrıntılar: `CLAUDE.md` ve `docs/`. Claude Code kullanıyorsan `jeuanima-video` becerisi (`.claude/skills/`) bütün adımları yönetir.

## Klasörler

- `engine/core/`: stilden bağımsız motor (Python ve JS), araçlar, testler.
- `engine/styles/scifi-toon/`: stil paketi.
- `engine/cast/`: tekrar eden karakterler.
- `films/<ad>/`: bir film, motorun kendi kopyası, kareler (`stills/`) ve poster.
- `docs/`: tasarım ve plan.

Depoda video, ses kaydı ve ara ses dosyaları yoktur (`.gitignore`). Örnek filmleri yeniden üretmek için kendi ses kaydını `assets/` klasörüne koy.

## Lisans ve atıf

- **Kod:** [Apache 2.0](LICENSE). Kodu kullanan, kopyalayan veya değiştiren herkes [`NOTICE`](NOTICE) dosyasını korumak ve JeuAnima'ya bağlantıyla atıf yapmak zorundadır.
- **Film içeriği** (senaryolar, fikirler, `TREATMENT.md`, karakter tasarımları, kareler, posterler): [CC BY 4.0](LICENSE-CONTENT). Kullanan herkes "JeuAnima" adını ve bu deponun bağlantısını vermek zorundadır.
- **Üçüncü taraf:** `engine/styles/scifi-toon/` MIT (LemoLab), `engine/core/fonts/` SIL OFL 1.1.

Atıf örneği: `JeuAnima — https://github.com/emirbaki/jeuanima`
