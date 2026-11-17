#!/usr/bin/env python3
"""
Temaların okunurluk tonlarını hesaplayıp public/index.html içindeki
/* <auto-tonlar> */ … /* </auto-tonlar> */ bölgesine yazar. Tema renkleri değişince yeniden çalıştır:
    python3 scripts/tema-tonlari.py
Üretilenler (her tema için, ana alan ve ayrıca kenar çubuğu zeminine göre):
  --c-teal … --c-purple : vurgu yazı tonları (koyu temada eski renklerin aynısı; gerekirse okunur olana kadar açılır/koyulaşır)
  --accent-text          : vurgu renginde yazı (gerekirse siyah/beyazla karıştırılarak okunur hale getirilir)
  --on-accent, --on-teal, --on-green, --on-pink, --on-purple, --on-red, --on-blue : o renkteki dolu buton üstündeki yazı
"""
import re, colorsys, json, os
P = os.path.join(os.path.dirname(__file__), '..', 'public', 'index.html')
s = open(P, encoding='utf-8').read()
css = s[s.index('<style>') + 7:s.index('</style>')]
START, END = '/* <auto-tonlar> */', '/* </auto-tonlar> */'
if START in css: css = css[:css.index(START)] + css[css.index(END) + len(END):]

def vars_of(sel):
    out = {}
    for m in re.finditer(sel + r'\s*\{([^}]*)\}', css):
        for k, v in re.findall(r'--([a-z0-9-]+)\s*:\s*([^;]+);?', m.group(1)): out[k] = v.strip()
    return out
def rgb(h):
    h = h.strip()
    m = re.match(r'#([0-9a-fA-F]{3,8})$', h)
    if not m: return None
    h = m.group(1)
    if len(h) in (3, 4): h = ''.join(c * 2 for c in h[:3])
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def L(c):
    f = lambda v: (v / 255) / 12.92 if v / 255 <= 0.03928 else ((v / 255 + 0.055) / 1.055) ** 2.4
    r, g, b = map(f, c); return .2126 * r + .7152 * g + .0722 * b
def cr(a, b):
    x, y = L(a), L(b); return (max(x, y) + .05) / (min(x, y) + .05)
def hx(c): return '#%02x%02x%02x' % tuple(int(round(x)) for x in c)
def fit(c, bgs, target=4.8):
    """Rengi tonunu koruyarak, verilen zeminlerin hepsinde hedef kontrasta ulaşana kadar aç/koyulaştır."""
    light = sum(L(b) for b in bgs) / len(bgs) > 0.35
    h, l, sat = colorsys.rgb_to_hls(*[x / 255 for x in c]); cc = c
    for _ in range(80):
        if min(cr(cc, b) for b in bgs) >= target: break
        l = max(0, min(1, l + (-0.015 if light else 0.015)))
        cc = tuple(round(x * 255) for x in colorsys.hls_to_rgb(h, l, sat))
    return cc
def on(c):
    dark, white = (0, 0, 0), (255, 255, 255)
    return hx(white) if cr(white, c) >= cr(dark, c) else hx(dark)

HUES = {'c-teal': '#5dc0b0', 'c-red': '#e07070', 'c-gold': '#c8a050', 'c-blue': '#7090d0', 'c-green': '#6dbf9a', 'c-pink': '#e090c0', 'c-purple': '#b080e0'}
ONS = ['accent', 'teal', 'green', 'pink', 'purple', 'red', 'blue']
base = vars_of(':root')
names = sorted(set(re.findall(r'\[data-theme="([a-z0-9]+)"\]\s*\{', css)))

def block(v, bgs, with_on=True):
    out = {}
    for k, h in HUES.items(): out[k] = hx(fit(rgb(v.get(k, '')) or rgb(h), bgs))  # tema kendi tonunu verdiyse ondan başla
    ac = rgb(v.get('accent', ''))
    if ac:
        # Kullanıcı farklı bir vurgu rengi seçebildiği için hex değil, var(--accent)'i karıştıran bir ifade üretilir
        light = sum(L(b) for b in bgs) / len(bgs) > 0.35
        toward = (0, 0, 0) if light else (255, 255, 255)
        p = 100
        while p > 20:
            c = tuple(ac[i] * p / 100 + toward[i] * (1 - p / 100) for i in range(3))
            if min(cr(c, b) for b in bgs) >= 4.8: break
            p -= 5
        out['accent-text'] = 'var(--accent)' if p == 100 else 'color-mix(in srgb,var(--accent) %d%%,%s)' % (p, '#000' if light else '#fff')
    t2 = rgb(v.get('text2', ''))
    if with_on and t2 and min(cr(t2, b) for b in bgs) < 4.5:
        out['text2'] = hx(fit(t2, bgs, 4.6))
    if with_on:
        for k in ONS:
            c = rgb(v.get(k, ''))
            if c: out['on-' + k] = on(c)
    return ''.join('--%s:%s;' % kv for kv in out.items())

lines = [START]
lines.append(':root{' + block(base, [rgb(base['surface']), rgb(base['surface2']), rgb(base['surface3'])]) + '}')
for n in names:
    v = dict(base); v.update(vars_of(r'\[data-theme="%s"\]' % n))
    bgs = [rgb(v[k]) for k in ('surface', 'surface2', 'surface3') if rgb(v.get(k, ''))]
    if not bgs: continue
    lines.append('[data-theme="%s"]{' % n + block(v, bgs) + '}')
    side = None
    for mm in re.finditer(r'\[data-theme="%s"\]\s*#sidebar\s*\{([^}]*)\}' % n, css):
        b = re.search(r'background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})', mm.group(1))
        if b: side = rgb(b.group(1))
    if side and abs(L(side) - L(bgs[0])) > 0.08:
        lines.append('[data-theme="%s"] #sidebar{' % n + block(v, [side, tuple(max(0, x - 12) for x in side)], with_on=False) + '}')
lines.append(END)
gen = '\n'.join(lines) + '\n'

if START not in s:
    raise SystemExit('index.html içinde /* <auto-tonlar> */ bölgesi yok')
s = s[:s.index(START)] + gen + s[s.index(END) + len(END) + 1:]
open(P, 'w', encoding='utf-8').write(s)
print('Güncellendi:', len(lines) - 2, 'blok')
