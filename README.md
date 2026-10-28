# JeuAnima

Sosyal medya için dikey (1080x1920, 24 fps) Türkçe komedi kısaları: vine, fıkra canlandırması, skeç. Her film kodla yazılmış bir Canvas 2D animasyonudur.

## Nasıl çalışır

1. Kullanıcı fikri yazar ve sesi yükler (ElevenLabs veya kendi kaydı).
2. Whisper sesi senaryoya hizalar. Altyazı, Whisper'ın duyduğunu gösterir.
3. Başsız bir tarayıcı kareleri çizer. Python sesi ve müziği karıştırır.

Çizim kütüphanesi bu depoda değildir: Lemo-Opuscar stil paketleri ayrı bir klasörde (`~/lemo-opuscar`) durur.

## Klasörler

- `engine/core/`: stilden bağımsız motor (Python ve JS), araçlar, testler.
- `engine/styles/scifi-toon/`: stil paketi (MIT, LemoLab demosundan).
- `engine/cast/`: tekrar eden karakterler.
- `films/<ad>/`: bir film ve motorun kendi kopyası.
- `docs/`: tasarım ve plan.

Video, ses ve ara çıktılar depoda yoktur (`.gitignore`). Bir filmi yeniden üretmek için kendi ses dosyanı `films/<ad>/assets/voice.mp4` yoluna koy ve `build.ps1` dosyasını çalıştır.

## Testler

```bash
python -m pytest engine/core/tests -q
```

## Lisanslar

- `engine/styles/scifi-toon/`: MIT, bkz. `LICENSE`.
- `engine/core/fonts/`: Baloo 2 ve Poppins, SIL Open Font License 1.1 (Google Fonts).
