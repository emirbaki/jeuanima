# JeuAnima video motoru: tasarım

Tarih: 2026-10-28. Durum: kullanıcı onayı bekliyor.

## 1. Amaç ve neden

JeuAnima bir sosyal medya kanalıdır. Kanal kısa, dikey, komik animasyonlar yayınlar: vine tarzı tek vuruşluk videolar ve fıkra canlandırmaları. Ayrıca rastgele karakterli kısa skeçler de olur.

Kullanıcı bir video fikri yazar. Claude fikirden senaryo, sahne kodu, müzik ve efekt üretir. Kullanıcı sesi kendisi yükler. Claude sesi senaryoya hizalar ve bitmiş videoyu verir.

Model: `D:\WebProjelerim\Jeu Bilgi Motoru`. O motor Türkçe explainer videoları üretir ve aynı yaklaşımı kullanır (kod ile çizim, kelime indeksine bağlı zamanlama, Whisper hizalama, kullanıcının yüklediği ses). JeuAnima bu yaklaşımı diyalog komedisine uyarlar.

## 2. Hedefler

- Kullanıcı bir fikir yazar, Claude aynı oturumda videoyu üretir. Kullanıcının işi: fikir, senaryo onayı, ses dosyası.
- İki süre: vine (6–15 sn) ve canlandırma (30–60 sn). Fikirde süre yoksa Claude seçer.
- Görünüm Lemo-Opuscar stillerinden gelir. İlk stil: **Sci-Fi Sitcom Toon** (`scifi-toon`).
- Sonra başka Lemo-Opuscar stilleri eklenebilir. Çekirdek değişmez, sadece yeni bir stil paketi eklenir.
- Altyazı, dudak hareketi ve kurgu zamanları yüklenen sesten otomatik çıkar (Whisper).
- Her video JeuAnima markasını taşır (logo, bitiş kartı).

## 3. Hedef olmayanlar

- Sesi Claude üretmez. ElevenLabs veya TTS çağrısı yok. Kullanıcı sesi yükler.
- Yayınlama yok. Claude videoyu sosyal medyaya göndermez (Jeuhub bağlayıcısı var, ama bu motorun parçası değil).
- İlk sürümde `scifi-toon` dışında stil paketi yok.
- Yatay format yok. Sadece dikey 1080x1920.

## 4. Kaçınılacaklar (çalışsa bile başarısızlık sayılır)

- Var olan bir dizinin karakterini, renk kombinasyonunu, portal tasarımını, adını veya replik kalıbını kopyalamak. `scifi-toon/STYLE.md` §1 telif sınırları her filmde geçerlidir. Asit yeşili portal + sümük damlası + titrek balon yazı bir arada kullanılmaz.
- Demo filmin (Coffee Run) hikâyesini, karakterlerini veya planlarını kullanmak. Demo sadece teknik öğrenmek için okunur.
- Altyazının yanlış kişiye ait görünmesi veya sesle kayması.
- Ölü kare: durağan pozda bile çizgi titrer.
- Fıkradaki punchline'ı altyazı veya görüntü önceden ele verir.

## 5. Kullanıcının verdiği kararlar

| Konu | Karar |
|---|---|
| Ses | Kullanıcı yükler: ElevenLabs veya kendi sesi. Claude Whisper ile altyazı ve zamanlama çıkarır. |
| Kadro | Videoya göre değişir. Aynı karakterler tekrar gelebilir, yeni karakterler de olur. Sadece fıkra değil, rastgele karakterli skeçler de var. |
| Süre | Vine ve canlandırma, fikre göre. |
| Marka | Kanal adı JeuAnima. Logoyu Claude bu stilde çizer. |
| Stil | Lemo-Opuscar kullanılır. Sonra başka stiller de eklenebilir. |
| Altyazı | Duyulanı gösterir. Doğaçlama videoda kalır (§8). |
| Takip çağrısı | Seslendirilmez. Ekranda, sonda olabilir veya hiç olmayabilir. Her filmde bir onay kapısında karar verilir. |

## 6. Yapı

```
jeuanima/
  CLAUDE.md                     motor kuralları ve komutlar (Jeu Bilgi CLAUDE.md gibi)
  .claude/skills/jeuanima-video/SKILL.md   fikirden videoya akış (jeubilgi-video-pipeline gibi)
  engine/
    core/                       stilden bağımsız
      timeline/                 draft_timeline.py, prep_timeline.py (konuşmacılı)
      lips.py                   ses dosyasından konuşmacı başına ağız açıklığı
      subs.js                   altyazı + konuşmacı etiketi
      brand.js                  JeuAnima logo, bitiş kartı, takip kartı
      audit.mjs                 altyazı/güvenli bölge kontrolü
      mix.py, mux.ps1, build.ps1 şablonu
    styles/
      scifi-toon/               stil paketi
        STYLE.md                kütüphanedeki STYLE.md'ye işaret + dikey format notları
        toon.js, chars.js, ...  demo motorundan uyarlanmış çizim kodu
        score.py                stile özel müzik
        foley.json              stile özel efekt listesi
    cast/
      scifi-toon/<ad>.js        tekrar kullanılan karakterler, stil başına
      CAST.md                   karakter listesi: ad, kişilik, ses notu, ilk film
  films/<slug>/                 bir film; engine/ kopyası taşır (Jeu Bilgi kuralı)
  assets/brand/                 logo kaynakları
  docs/specs/                   bu belge
```

**Film klasörü:**
`idea.md` (kullanıcının fikri), `TREATMENT.md`, `script.txt`, `film.json` (stil, süre türü, takip kartı, kadro), `scenes.js`, `index.html`, `timeline.js/.json`, `lips.json`, `assets/voice.mp3` veya `assets/voice/<satır>.mp3`, `out/`, `<Ad>.mp4`, `poster.jpg`.

**Neden her film `engine/` kopyası taşır:** Jeu Bilgi kuralı. Motor değişince eski filmler bozulmaz.

## 7. Senaryo biçimi

`script.txt`, her satır bir replik:

```
DURSUN: Temel, bu makine ne işe yarıyor?
TEMEL: Zamanı geri sarıyor.
DURSUN: [şaşkın] Ne kadar geri?
TEMEL: (sessizlik)
```

- `AD:` konuşanı verir. Ad `film.json` kadrosunda olmalı.
- `[...]` oyun notudur: ekranda görünmez, seslendirilmez, sahne kodu okur.
- `(sessizlik)` sessiz vuruştur: konuşma yok, süre sahne kodunda verilir.
- Ses gelmeden önce altyazı senaryo metnini gösterir. Ses gelince duyulanı gösterir (§8). Sayılar senaryoda yazıyla yazılır.

## 8. Ses ve zamanlama akışı

1. **Taslak zamanlama:** `draft_timeline.py` senaryodan kelime başına tahmini süre çıkarır. Ses gelmeden sahneler bununla çizilir ve kontrol edilir.
2. **Ses gelir:** iki yol desteklenir.
   - Tek dosya: `assets/voice.mp3`, tüm diyalog sırayla. Birden fazla karakteri aynı kişi seslendirebilir.
   - Replik başına dosya: `assets/voice/01.mp3`, `02.mp3`, ... `script.txt` satır sırasıyla. Motor bunları birleştirir, replikler arasına senaryodaki boşluğu koyar.
3. **Hizalama:** `prep_timeline.py` faster-whisper ile kelime zamanlarını alır ve senaryo kelimelerine eşler (Jeu Bilgi'deki dizi hizalaması). Her kelime konuşmacısını senaryodan alır. Çıktı: `timeline.json` = `{dur, words:[{w, a, b, who, line}], lines:[{i, who, a, b}]}`.
4. **Dudak hareketi:** `lips.py` sesin RMS ve spektral merkezini 24 Hz'de çıkarır. Değerler zaman aralığına göre o anki konuşmacıya gider. Konuşmayan karakterin ağzı kapalı kalır.
5. **Altyazı duyulanı gösterir (kullanıcı kararı):** Altyazı Whisper'ın duyduğu kelimeleri yazar, senaryo metnini değil. Doğaçlama ve değişen kelimeler videoda kalır.
   - Duyulan fazla kelime, çevresindeki eşleşen kelimelerin repliğine ve konuşmacısına gider. Bir replik içinde kalır, iki replik arasındaysa önceki repliğe eklenir.
   - Senaryoda olup seste olmayan kelime altyazıda görünmez.
   - Sahne kodu senaryo kelime indekslerini kullanır. Bu indeksler doğaçlamadan etkilenmez. Seste olmayan bir kelimenin zamanı komşularından tahmin edilir.
   - Yazım: Whisper'ın yazdığı kelime, senaryodaki karşılığıyla eşleşirse senaryo yazımı kullanılır (büyük harf, noktalama, Türkçe harfler). Eşleşmeyen kelimede Whisper yazımı kullanılır.
6. **Rapor:** Claude kullanıcıya üç liste gösterir: senaryoya eklenen kelimeler, seste olmayan kelimeler, Whisper'ın şüpheli duyduğu kelimeler (düşük olasılık). Kullanıcı yanlış duyulan kelimeyi söyler, Claude `subs_fix.json` ile düzeltir ve yeniden build eder.

Sahne kodu saniye sabitlemez. Zaman ya kelime indeksiyle (`w(i)`, `edge(i)`) ya da replik indeksiyle (`L(n)`, `Lend(n)`) verilir. Gerçek ses gelince sahneler kendiliğinden kayar.

## 9. Görüntü

- 1080x1920, 24 fps render. Karakterler, ağızlar, göz kırpma ve çizgi titremesi 12 fps. Kamera, portal ve efektler 24 fps.
- Demo motoru 1920x1080 yatay çizer. Dikey için çerçeve dili yeniden kurulur: üst-alt iki kişilik plan, yakın planlar, ekranın üst yarısında nesne yakın planı. Altyazı bandı alt bölgededir. Güvenli bölge sayıları `audit.mjs` ile kontrol edilir (değerleri Claude belirler, sosyal medya arayüzünün kapladığı alanlar dışarıda kalır).
- Altyazı: STYLE.md §4. Baloo 2 ExtraBold, beyaz, kalın siyah dış çizgi, solda konuşmacı renginde etiket.
- Her film bir başlık kartı taşıyabilir (stil §4 kuralları).

## 10. Ses tasarımı

- Müzik: stil paketinin `score.py` dosyası kodla sentezler (scifi-toon: theremin benzeri melodi, analog bas, kare dalga arpej). Sample gerekmez.
- Efekt: sahne kodu `ev(t, tür)` ile olay yazar, `mix.py` stil paketinin efekt listesinden sentezler.
- Diyalog altında müzik yaklaşık −7 dB kısılır. Punchline ve soğuk sessizlikte müzik reverb kuyruğuyla birlikte kesilir. Final −14 LUFS.

## 11. Marka

- JeuAnima logosu: stilin çizgi diliyle çizilir (titreyen kalın çizgi, düz renk). Kaynak `assets/brand/`.
- Bitiş kartı: 2 sn, logo. Her filmde var.
- Takip kartı: `film.json` içinde `follow: "end" | "none"`. `end` ise bitiş kartında "Takip et!" etiketi görünür. Seslendirilmez.

## 12. Fikirden videoya akış (skill)

1. **Fikir:** Kullanıcı yazar. Claude `idea.md` olarak kaydeder.
2. **Treatment:** üç yapı, bir seçim, kadro, dünyalar ve paletler, imza hamlesi, plan tablosu (Lemo-Opuscar DIRECTOR.md §4).
3. **KAPI 1 (senaryo):** Claude senaryoyu, plan tablosunu, süreyi, kadroyu ve takip kartı seçeneğini (`end` / `none`) gösterir. Kullanıcı onaylar veya düzeltir.
4. **Kadro:** Kayıtlı karakter varsa `cast/`'tan alınır. Yoksa yeni karakter çizilir ve model sayfası (stills) gösterilir. Yeni karakter kanalda tekrar kullanılabilir olarak `cast/` altına kaydedilir.
5. **Sahneler:** taslak zamanlama ile `scenes.js` yazılır. Kareler ve `audit.mjs` ile kontrol edilir.
6. **KAPI 2 (ses):** Claude replik listesini verir (konuşmacı, metin, oyun notu). Kullanıcı sesi yükler.
7. **Hizalama ve build:** `prep_timeline.py`, `lips.py`, audit, build. Çıktı `<Ad>.mp4` ve `poster.jpg`.
8. **Teslim:** süre, kontrol edilmeyen noktalar, hizalanamayan kelimeler.

Fıkralar genelde gerçek rakam içermez. Bir filmde gerçek bir bilgi geçerse, kaynak `TREATMENT.md`'ye yazılır.

## 13. Kısıtlar

- Render kütüphanesi `~/lemo-opuscar`. Araçlar oradan, film klasörünün mutlak yoluyla çalışır. Kütüphane içinde (`core/`, `styles/`) değişiklik yapılmaz.
- Windows, PowerShell + Git Bash. Python `~/lemo-opuscar/.venv`. Whisper için `faster-whisper` gerekir (`setup.sh deps voice`).
- Türkçe karakterler (ç ğ ı İ ö ş ü) altyazı fontunda ve Whisper eşlemesinde doğru çalışmalı (Jeu Bilgi `norm()` mantığı).
- Her şey `t` zamanının saf fonksiyonudur. `Math.random` ve saat kullanılmaz.

## 14. Claude'un kendi kararları (kullanıcı onaylamadı)

- Klasör yapısı ve dosya adları (§6).
- Senaryo biçimi: `AD:` ve `[...]` notasyonu (§7).
- Replik başına dosyalar senaryo sırasıyla numaralanır (§8).
- Fıkra tipleri (Temel, Dursun, Nasreddin Hoca gibi) kanalın kendi bilimkurgu tasarımıyla çizilebilir. Bu tipler folklordur, ama görünüş özgün olur.
- İlk teslim: motor + bir deneme filmi. Deneme fikrini kullanıcı verir. Vermezse Claude kısa bir vine önerir.

- **Lisans:** Lemo-Opuscar kodu MIT, demo filmler CC BY 4.0. Demo kodundan uyarlanan dosyalar `engine/styles/scifi-toon/LICENSE` (MIT metni) ve `CREDITS.md` taşır. Videolarda LemoLab yazısı veya filigran olmaz (AGENTS.md kuralı).
- **Dil:** Tüm akış, belgeler ve senaryolar Türkçe. Lemo-Opuscar dil sorusu atlanır. Whisper dili `tr` olarak sabitlenir.
- **Oturumlar arası devam:** Film klasörü tek durum kaynağıdır. `film.json` bir `stage` alanı taşır (`idea`, `script_ok`, `scenes`, `voice_wait`, `built`). Skill, yarım bir filmi bu alandan devam ettirir.
- **Replik arası boşluk** (replik başına dosyalarda): varsayılan 0.3 sn. `(sessizlik 1.5)` açık süre verir.
- **İlk teslim:** motor + bir vine deneme filmi. Canlandırma (30–60 sn) yolu ikinci filmde sınanır.
- **Araçlar:** ffmpeg kurulu. Baloo 2 fontu Jeu Bilgi `fonts/` klasöründen kopyalanır (Türkçe harfler var). faster-whisper kurulu değil: `setup.sh deps voice` ile kurulur (yaklaşık 0.55 GB).

## 15. Kurucuya kalanlar

- Stil paketinin iç API'si ve demo kodundan ne kadarının alınacağı.
- Dikey kadraj ölçüleri, güvenli bölge sayıları.
- Logo tasarımı.
- `lips.py` eşikleri, müzik ve efekt ayarları.
