---
name: jeuanima-video
description: JeuAnima'da kullanıcının fikrinden dikey (1080x1920) komik kısa video üretir (vine, fıkra canlandırması, skeç). Kullanıcı bir video fikri veya fıkra yazdığında, ses dosyası yüklediğinde ya da films/<ad>/ altındaki yarım bir filmi sürdürmek istediğinde kullan.
---

# JeuAnima video akışı

Kullanıcı fikri yazar ve sesi yükler. Gerisini bu oturum yapar. Önce `CLAUDE.md` dosyasını oku (komutlar, mimari, kurallar).

## Yarım film var mı?

`films/*/film.json` içindeki `stage` alanına bak. Kullanıcının söz ettiği film yarımsa, o aşamadan devam et:

| stage | Sonraki iş |
|---|---|
| `idea` | treatment + senaryo, KAPI 1 |
| `script_ok` | kadro + sahneler (taslak zamanlama) |
| `scenes` | KAPI 2: ses bekleniyor |
| `voice_wait` | ses geldi mi bak, `prep_timeline.py` |
| `built` | düzeltme isteği varsa uygula, yeniden build |

Her aşama sonunda `stage` alanını güncelle.

## Akış

1. **Fikir.** `python engine/core/tools/new_film.py <slug> --kind vine|sketch [--title "..."]`. Fikri `idea.md` dosyasına yaz. Süre: vine 6–15 sn, canlandırma 30–60 sn (fikirde süre yoksa sen seç). Ses zaten geldiyse önce `prep_timeline.py` ile ne söylendiğini çıkar, senaryoyu duyulandan yaz.
2. **Treatment.** `TREATMENT.md`: üç yapı, seçim ve sebebi, kadro, palet, imza hamlesi, plan tablosu. Örnek: `films/minik_piyanist/TREATMENT.md`. Lemo-Opuscar kuralı: önce treatment, sonra demo kodu (sadece teknik için).
3. **KAPI 1 (senaryo).** Kullanıcıya göster: senaryo, plan tablosu, süre, kadro, takip kartı seçeneği (`end` = bitiş kartında "Takip et!", `none` = sadece logo). Onay al. Senaryo biçimi: `AD: replik [oyun notu]`, `(sessizlik 1.5)`, anlatıcı `ANLATICI:`.
4. **Kadro.** `engine/cast/<stil>/CAST.md` listesine bak. Kayıtlı karakteri kullan, yoksa yeni dosya yaz (aynı klasöre, `nail.js` biçiminde) ve `CAST.md`'ye ekle. Yeni karakterin model sayfasını (still) kontrol et.
5. **Sahneler.** `draft_timeline.py` ile taslak zamanlama. `scenes.js`: bir `world(t)` tüm dekoru çizer, her plan sadece kamerayı oynatır. Zaman her zaman `L(n)`, `Lend(n)`, `Ledge(n)`, `w(wordOf(n, k))` ile. Still + `sheet.py` ile bak, `audit.mjs` temiz olmalı.
6. **KAPI 2 (ses).** Kullanıcıya replik listesini ver. Ses yolları: tek dosya `assets/voice.(mp3|wav|m4a|mp4)` veya replik başına `assets/voice/01.mp3, 02.mp3, ...` (senaryo sırası, sessizlik satırı dosya almaz). ElevenLabs veya kendi sesi. Sesi sen üretme.
7. **Hizalama.** `prep_timeline.py <film>`. Tek dosyalı seste tekrarlar (yarım kalan denemeler, "Evet." gibi işaretler) kesilir ve uzun boşluklar 0.55 sn'ye iner. Kesilen yerleri kullanıcıya göster. Bilinçli bir duraklama gerekiyorsa senaryoya `(sessizlik X)` yaz. Sahne kodunda satır numaraları bu satırı da sayar. Altyazı duyulanı gösterir. Üç listeyi kullanıcıya söyle: eklenen, eksik, şüpheli kelimeler. Yanlış duyulan kelimeyi `subs_fix.json` ile düzelt (`{"duyulan": "doğru"}`), sonra `prep_timeline.py` yeniden.
8. **Bitiş.** Punchline'dan sonra `hold` saniye tepki planı olsun (film.json `hold`, varsayılan 1.8). Bitişteki her şey `endStart()` ile.
9. **Build.** `powershell -ExecutionPolicy Bypass -File films\<slug>\build.ps1`. 90 sn film yaklaşık 2 dk.
10. **Teslim.** Kontrol: süre ≈ ses + 2 sn, `blackdetect` boş, ≈ −14 LUFS, son videodan 4–6 kare. Kullanıcıya: `<Başlık>.mp4`, `poster.jpg`, hizalama listeleri, kontrol edemediklerin (videoyu baştan sona izlemedin).

## Kurallar

- Telif: hiçbir dizinin karakterini, adını, portal görünüşünü, replik kalıbını kopyalama. Asit yeşili portal + sümük damlası + titrek balon yazı birlikte yok. Videoda LemoLab yazısı yok.
- Stil sabittir: `~/lemo-opuscar/styles/scifi-toon/STYLE.md`. Kalın titreyen çizgi, düz renk, gradyan yok, portal tek parlayan şey, karakterler 12 fps.
- Her saçma görüntüden sonra bir tepki yakın planı. Punchline'da müzik kesilir (`ev(t, 'music', {cue: 'silence'})`).
- Altyazı ekranın ortasında (y 1150), kelime kelime ve en fazla 3 kelimelik parçalar halinde çıkar. Ekran y 1080–1220 bandına yazı veya önemli nesne koyma. Yazılar güvenli bölgede (x 60..1020, y 220..1500).
- Kredi harcayan, yayınlayan veya paylaşan hiçbir adımı onaysız yapma.
