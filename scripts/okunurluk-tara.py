#!/usr/bin/env python3
"""
Okunurluk taraması: her tema × panelde görünür yazıların, gerçekten üstünde durdukları
arka plana göre kontrastını ölçer. Hover durumunu da ölçer (nav, buton, kart).
Gerekenler: pip install playwright && playwright install chromium
Kullanım: node server.js &  →  python3 scripts/okunurluk-tara.py [URL] [tema,tema...]
Çıktı: eşik altı yazılar (temaya, panele ve öğeye göre gruplanmış).
"""
import sys, re, json, urllib.request
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'
ONLY = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] and not sys.argv[2].startswith('--') else None
PANELS = ['lesson', 'special', 'grammar', 'fonetik', 'vucut', 'harita', 'ejmala', 'test', 'writing', 'reading', 'stats', 'kultur', 'notes', 'sinav', 'rusca', 'pdf']
EXE = None
for a in sys.argv[3:]:
    if a.startswith('--chrome='): EXE = a.split('=', 1)[1]

JS = r"""
(hoverSel) => {
  function parse(c){const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};}
  function lum(c){const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);}
  function blend(top,bot){const a=top.a;return {r:top.r*a+bot.r*(1-a),g:top.g*a+bot.g*(1-a),b:top.b*a+bot.b*(1-a),a:1};}
  function bgOf(el){
    const stack=[];let e=el;
    while(e&&e.nodeType===1){const cs=getComputedStyle(e);
      if(cs.backgroundImage&&cs.backgroundImage!=='none'&&cs.backgroundImage.includes('gradient')){const m=cs.backgroundImage.match(/rgba?\([^)]+\)/g);if(m){stack.push(parse(m[Math.floor(m.length/2)]));if(stack[stack.length-1].a>=1)break;}}
      const c=parse(cs.backgroundColor);if(c&&c.a>0){stack.push(c);if(c.a>=1)break;}
      e=e.parentElement;}
    let base={r:255,g:255,b:255,a:1}; const bodyBg=parse(getComputedStyle(document.body).backgroundColor); if(bodyBg&&bodyBg.a>0)base=bodyBg;
    for(let i=stack.length-1;i>=0;i--)base=blend(stack[i],base);
    return base;
  }
  const out=[];const seen=new Set();
  const root=document.querySelector(hoverSel||'body');
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n;
  while((n=walker.nextNode())){
    const t=n.textContent.trim(); if(t.length<2)continue;
    if(!/[A-Za-z0-9\u00C0-\u024F\u0400-\u04FF]/.test(t))continue; // sadece emoji/simge
    const el=n.parentElement; if(!el)continue;
    const r=el.getBoundingClientRect(); if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||+cs.opacity===0)continue;
    let op=1,e=el;while(e){op*=+getComputedStyle(e).opacity;e=e.parentElement;} if(op<0.15)continue;
    const fg=parse(cs.color); if(!fg)continue;
    if(cs.webkitTextFillColor&&cs.webkitTextFillColor.includes('rgba(0, 0, 0, 0)'))continue; // gradient text
    const bg=bgOf(el); const f=blend({...fg,a:fg.a*op},bg);
    const L1=lum(f),L2=lum(bg); const cr=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    const size=parseFloat(cs.fontSize); const min=size>=18||(size>=14&&+cs.fontWeight>=700)?3:4.5;
    if(cr<min-0.01){
      const id=(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'');
      const key=el.tagName+id+'|'+t.slice(0,24);
      if(seen.has(key))continue;seen.add(key);
      out.push({el:el.tagName.toLowerCase()+id,text:t.slice(0,40),cr:+cr.toFixed(2),min,
        fg:'rgb('+[f.r,f.g,f.b].map(Math.round)+')',bg:'rgb('+[bg.r,bg.g,bg.b].map(Math.round)+')',
        inSidebar:!!el.closest('#sidebar')});
    }
  }
  return out;
}
"""

def main():
    html = urllib.request.urlopen(URL + '/').read().decode()
    themes = ['dark', 'dim', 'light'] + json.loads(re.search(r'var _customThemes = (\[.*?\]);', html).group(1))
    if ONLY: themes = [t for t in themes if t in ONLY]
    try: urllib.request.urlopen(urllib.request.Request(URL + '/api/profiles', data=b'{"name":"test"}', headers={'Content-Type': 'application/json'}))
    except Exception: pass
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--no-sandbox'], **({'executable_path': EXE} if EXE else {}))
        pg = b.new_page(viewport={'width': 1440, 'height': 900})
        pg.route('**/pdf.min.js', lambda r: r.fulfill(body='window.pdfjsLib={GlobalWorkerOptions:{}};', content_type='text/javascript'))
        pg.goto(URL + '/'); pg.evaluate("localStorage.setItem('polonica_profile','test');localStorage.setItem('polonica_token','open')")
        pg.goto(URL + '/'); pg.wait_for_timeout(1500)
        for t in themes:
            issues = []
            for panel in PANELS:
                pg.mouse.move(1, 1)
                pg.evaluate(f"setTheme('{t}'); showPanel('{panel}'); window.scrollTo(0,0)")
                pg.wait_for_timeout(700)  # tema geçiş animasyonları bitsin
                for it in pg.evaluate(JS, None): it['panel'] = panel; it['state'] = 'normal'; issues.append(it)
            # hover: nav düğmeleri ve paneldeki ilk butonlar/kartlar
            pg.evaluate(f"setTheme('{t}'); showPanel('lesson')"); pg.wait_for_timeout(200)
            for sel in ['#sidebar .nav-btn:not(.active) >> nth=3', '#panel-lesson .btn >> nth=0', '.gtab >> nth=1']:
                try:
                    if sel.startswith('.gtab'): pg.evaluate("showPanel('grammar')"); pg.wait_for_timeout(150)
                    loc = pg.locator(sel)
                    if loc.count() == 0: continue
                    loc.hover(timeout=1500); pg.wait_for_timeout(600)
                    for it in pg.evaluate(JS, None):
                        it['panel'] = 'hover:' + sel.split(' >>')[0]; it['state'] = 'hover'; issues.append(it)
                except Exception as e:
                    pass
            res[t] = issues
        b.close()
    total = 0
    for t, issues in res.items():
        # aynı öğe/aynı renk çiftini tekilleştir
        uniq = {}
        for i in issues:
            k = (i['el'], i['fg'], i['bg'])
            if k not in uniq: uniq[k] = dict(i, panels={i['panel']})
            else: uniq[k]['panels'].add(i['panel'])
        total += len(uniq)
        print(f"\n== {t}: {len(uniq)} sorun")
        for i in sorted(uniq.values(), key=lambda x: x['cr'])[:40]:
            print(f"  {i['cr']:>5} (≥{i['min']}) {'[kenar] ' if i['inSidebar'] else ''}{i['el']} «{i['text']}» {i['fg']} on {i['bg']}  [{','.join(sorted(i['panels']))[:60]}]")
    print(f"\nToplam: {total}")

main()
