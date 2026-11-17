#!/usr/bin/env python3
"""
Her tema × ana paneller için ekran görüntüsü alır (görsel kontrol için).
Gerekenler: pip install playwright && playwright install chromium
Kullanım:  node server.js &   →   python3 scripts/tema-ekran.py [http://localhost:3000] [cikti_klasoru]
Profil 'test' adıyla oluşturulur; APP_PASSWORD kapalı olmalı.
"""
import sys, re, os, json, urllib.request
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'tema-ekran'
PANELS = ['lesson', 'special', 'grammar', 'fonetik', 'stats', 'sinav', 'test', 'kultur']
os.makedirs(OUT, exist_ok=True)

html = urllib.request.urlopen(URL + '/').read().decode()
themes = ['dark', 'dim', 'light'] + json.loads(re.search(r'var _customThemes = (\[.*?\]);', html).group(1))
try:
    urllib.request.urlopen(urllib.request.Request(URL + '/api/profiles', data=b'{"name":"test"}', headers={'Content-Type': 'application/json'}))
except Exception:
    pass

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL + '/')
    pg.evaluate("localStorage.setItem('polonica_profile','test');localStorage.setItem('polonica_token','open')")
    pg.goto(URL + '/'); pg.wait_for_timeout(1500)
    for t in themes:
        for panel in PANELS:
            pg.evaluate(f"setTheme('{t}'); showPanel('{panel}')")
            pg.wait_for_timeout(350)
            pg.screenshot(path=f'{OUT}/{t}__{panel}.png')
    b.close()
print(f'{len(themes)} tema × {len(PANELS)} panel → {OUT}/')
if errors: print('Sayfa hataları:', *set(errors), sep='\n  ')
