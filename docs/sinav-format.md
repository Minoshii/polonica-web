# Sınav hub'ı: içerik formatı

Sınav sekmesinin içeriği `public/sinav/` klasöründe durur. Kod değiştirmeden içerik eklenir.

## Ders listesi: `public/sinav/index.json`

```json
{"id":"rusca-1","term":"2026–27 Güz","kind":"Final","title":"Rusça 1","emoji":"🇷🇺","teacher":"Mariana hoca","scope":"…","examDate":"2027-01-08"}
```

`term` aynı olan dersler birlikte gruplanır. İlk grup güncel dönemdir, sonraki gruplar arşiv olarak görünür.

## Ders dosyası: `public/sinav/<id>.json`

Dersin üst bilgileri ve parça listesi bu dosyada tutulur:

```json
{"id":"rusca-1","title":"Rusça 1","teacher":"…","scope":"…","examDate":"","note":"…",
 "labels":{"yazili":"🗣 Konuşma Konuları"},
 "parts":["rusca-1-sifatlar.json","rusca-1-cogullar.json"]}
```

**Yeni konu eklemek** iki adımdan oluşur: yeni bir parça dosyası (`<id>-<konu>.json`) oluşturulur ve adı `parts` listesine bir satır olarak eklenir. Motor bütün parçaları birleştirir.

## Parça dosyası

Bütün alanlar isteğe bağlıdır. Sadece kullanılanlar yazılır.

| Alan | Sekme | Şekil |
|---|---|---|
| `periods` | 🗂 Özet | `{id, short, title, years, cause, events[], result, body, table{title,head[],rows[][]}, terms[]}` |
| `quick` | ⚡ Kısa Sorular | `{period, q, options[2–3], answer, why, terms[]}` |
| `yorum` | 🧠 Yorum | `quick` ile aynı şekil, sorular uzun |
| `vocab` | 🔤 Kelime | `{w, tl (transliterasyon), tr, note, group}`: sadece "bu ne demek?" testi ve liste |
| `written` | ✍️ Yazılı Cevap | `{tag, q, wstep, points[], phrases[{pl,tr}], answer}` |
| `terms` | 📚 Terimler ve hatırlatma kartları | `{id, period, term, short, detail}` |

Kısa Sorular ve Yorum sorularında şıklar karıştırılır, bu yüzden `answer` alanı her zaman doğru şıkkın dizideki indeksidir (0'dan başlar). Şık uzunluklarının birbirine yakın olması gerekir. Tarih sıralama sorusu eklenmez.

**Id kuralı:** Sorulara `id` verilmezse motor, sorunun metninden kararlı bir id üretir. Bu sayede yeni parça eklemek, eski soruların kayıtlı ilerlemesini bozmaz. Bir sorunun metni değişirse o sorunun ilerlemesi sıfırlanır. `periods` ve `terms` içindeki `id` değerleri elle verilir ve bütün ders içinde benzersiz olmalıdır, bu yüzden her parça kendi önekini kullanır (ör. `sif-…`).
