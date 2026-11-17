# Tema sistemi yeniden yapım planı (Kasım 2026)

## Sorun
- `index.html` içinde koda doğrudan yazılmış ~1.970 renk var. Tema değişince bu renkler değişmiyor.
- Bu delikleri kapatmak için 471 satır tema-özel yama yazılmış (skyline 91, sakura 79, …).
- Sonuç: okunmayan yazılar, kaybolan HUD'lar, uyumsuz logolar.

## Hedef
1. Her tema ~20 anlamlı değişken tanımlar: zemin, yüzey 1–3, kenarlık, yazı, soluk yazı, vurgu, başarı/hata/bilgi (+ zemin tonları), açık/koyu bayrağı, font.
2. Koda gömülü renkler bu değişkenlere çevrilir (script ile), tema yamaları silinir.
3. Her tema tutarlı bir paket olur: renk + font + logo + HUD (XP kartı, Spotify widget'ı, alttaki butonlar) + hover/animasyon.
4. Her tema × her panel için otomatik ekran görüntüsü kontrolü (kontrast, kaybolan HUD).

## Tema kararları (Burak)
| Tema | Karar | Not |
|---|---|---|
| Koyu (varsayılan) | Kalır | Çok iyi |
| Loş (dim) | Kalır | Çok iyi |
| Açık (light) | Kalır | Çok iyi |
| skyline | Kalır | Çok iyi çalışıyor, referans alınabilir |
| inheritance | Kalır | İyi |
| duskgold | Kalır | Güzel |
| dracula | Kalır | |
| tokyonight | Kalır, düzenlenecek | Hover animasyonları belirsiz, layout netleşmeli |
| mono (monochrome) | Kalır, iyileştirilecek | En estetik temalardan biri. Siyahlar katmanlanacak (açık siyah / koyu siyah), yazılar beyaz kalacak |
| dragonking | Kalır, düzenlenecek | Çok güzel ama yazılar okunmuyor; font ve layout ayarı gerekli |
| vaporwave | Kalır, düzenlenecek | Bazı sekmelerde yazılar zor okunuyor, kontrast artırılacak |
| deepsea | Kalır, düzenlenecek | Renklerde biraz değişiklik |
| desert | Kalır, düzenlenecek | Oturaklı ama fazla açık; HUD ve layout kontrastı artırılacak |
| sakura | Kalır, düzenlenecek | Tatlı; HUD, layout ve bazı başlıklar okunmuyor, küçük dokunuşlar |
| forest | Kalır, düzenlenecek | Okunurluk kötü, dokunuşlar |
| arctic | Şartlı kalır | Renk uyumu kötü; dengelenebilirse kalır |
| espresso | Tamamen yeniden yapılacak | Kahve temasını yansıtmıyor; mevcut renk uyumu iyi bir başlangıç olabilir |
| fullthrottle (Türkiye) | Kaldırılacak | |
| asiimov | Kaldırılacak | |
| noiramber | Kaldırılacak | |
| inkneon | Kaldırılacak | |
| autumn | Kaldırılacak | |
| sunset | Kaldırılacak | |
| slate | Kaldırılacak | |
| nebula | Kaldırılacak | Çok koyu |
| midnight | Kaldırılacak | |
| ocean | Kaldırılacak | |

Kaldırılan bir tema seçili olan kullanıcı, açılışta otomatik olarak Koyu temaya geçirilecek.
