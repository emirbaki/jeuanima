# scifi-toon stil paketi

Stilin sabit kuralları kütüphanede: `~/lemo-opuscar/styles/scifi-toon/STYLE.md` (Sci-Fi Sitcom Toon). Bu paket o kuralları uygular. Burada sadece JeuAnima'nın dikey format ve kanal kararları var.

- Kare 1080x1920. Kamera bir dünya noktasını ekran merkezine koyar (`cam(t, cx, cy, z)`).
- Dikey kadraj: tezgâh veya zemin ekranın alt üçte birinde, yüzler ekran y 500–1100 arasında. Altyazı bandı (y 1330–1500) gövdeye düşebilir, yüze düşmez.
- Portal (kanal rengi): turuncu `#ff7a3d` → pembe `#ff3d8b`, açık çekirdek `#ffe3b0`. Portal açıkken arka duvar mor `#6b3fa0` yıkama alır (karakterler değil).
- Müzik bölümleri `score.py` başlığında. Efekt türleri `foley.py` içindeki `SOUNDS`.
- Font: Baloo 2 (Türkçe harfler tam). Terminal etiketi: Consolas.
- Kaynaklar ve lisans: `CREDITS.md`, `LICENSE`.
