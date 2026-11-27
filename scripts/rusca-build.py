#!/usr/bin/env python3
"""Rusça veri dosyalarını (data/rusca/*.txt) public/rusca-data.js'e derler.

Kullanım:  python3 scripts/rusca-build.py
Kelime eklemek için data/rusca/kelimeler.txt'ye, fiil eklemek için
data/rusca/fiiller.txt'ye satır ekleyip bu betiği yeniden çalıştır.
Vurgu: vurgulu ünlüden sonra ' yazılır (чита'ть).
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'data', 'rusca')
A = '́'
acc = lambda s: s.strip().replace("'", A)


def rows(name):
    for line in open(os.path.join(D, name), encoding='utf8'):
        if line.startswith('#') or not line.strip():
            continue
        yield line.rstrip('\n').split('|')


words, seen = [], set()
for f in rows('kelimeler.txt'):
    f += [''] * (5 - len(f))
    ru, c, tr, pl, t = f[:5]
    key = acc(ru).replace(A, '').lower()
    if key in seen:
        continue
    seen.add(key)
    words.append(dict(ru=acc(ru), c=c.strip(), tr=tr.strip(), pl=acc(pl), t=t.strip() or 'Kitap sözlüğü'))

verbs = []
for f in rows('fiiller.txt'):
    f += [''] * (11 - len(f))
    note = next((x for x in reversed(f[9:]) if x), '')
    verbs.append(dict(inf=acc(f[0]), tr=f[1], pl=f[2], k=f[3], pr=acc(f[4]), pa=acc(f[5]),
                      pf=acc(f[6]), pff=acc(f[7]), pfp=acc(f[8]), n=acc(note)))
    k = verbs[-1]['inf'].replace(A, '')
    for w in words:
        if w['ru'].replace(A, '') == k:
            w['c'] = 'v'

out = os.path.join(ROOT, 'public', 'rusca-data.js')
with open(out, 'w', encoding='utf8') as fh:
    fh.write('/* Otomatik üretildi: scripts/rusca-build.py — elle düzenleme, data/rusca/*.txt dosyalarını düzenle. */\n')
    fh.write('window.RU_DATA=' + json.dumps(dict(w=words, v=verbs), ensure_ascii=False, separators=(',', ':')) + ';\n')
print(f'{len(words)} kelime, {len(verbs)} fiil -> {out}', file=sys.stderr)
