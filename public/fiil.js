/* ═══════════════════════════════════════════════════════════════
   POLONICA · FİİL (rekcja)
   Fiili yaz → otomatik tamamlama (Lehçe harfsiz/hatalı yazımı da bulur)
   → hangi hal (przypadek) ve hangi edatla kullanıldığı, örnekler.
   Sunucu: POST /api/fiil  (sonuçlar sunucuda önbelleklenir)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(.22,1,.36,1)';
  var CASES = {
    'mianownik':    { c: 'var(--text2)',    q: 'kto? co?',          tr: 'yalın' },
    'dopełniacz':   { c: 'var(--c-purple)', q: 'kogo? czego?',      tr: 'ilgi / -ın' },
    'celownik':     { c: 'var(--c-teal)',   q: 'komu? czemu?',      tr: 'yönelme / -e' },
    'biernik':      { c: 'var(--c-blue)',   q: 'kogo? co?',         tr: 'belirtme / -i' },
    'narzędnik':    { c: 'var(--c-gold)',   q: 'kim? czym?',        tr: 'araç / ile' },
    'miejscownik':  { c: 'var(--c-green)',  q: 'o kim? o czym?',    tr: 'bulunma / -de' },
    'bezokolicznik':{ c: 'var(--c-pink)',   q: 'co robić?',         tr: 'mastar' },
    'zdanie':       { c: 'var(--c-red)',    q: 'że…',               tr: 'yan cümle' }
  };

  var CSS = [
    '.fl{width:100%;max-width:1000px}',
    '.fl *{box-sizing:border-box}',
    '.fl-search{position:relative;margin:4px 0 12px}',
    '.fl-input{width:100%;font:inherit;font-size:20px!important;font-weight:700;padding:16px 18px 16px 52px!important;border-radius:16px!important;border:1.5px solid var(--border2)!important;background:var(--surface2)!important;color:var(--text);margin:0!important;transition:border-color .2s,box-shadow .3s ' + EASE + '}',
    '.fl-input:focus{outline:none;border-color:var(--accent)!important;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}',
    '.fl-ico{position:absolute;left:18px;top:50%;transform:translateY(-50%);font-size:20px;pointer-events:none}',
    '.fl-dd{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:50;background:var(--surface2);border:1px solid var(--border2);border-radius:14px;box-shadow:0 18px 40px -12px rgba(0,0,0,.45);overflow:hidden}',
    'html[data-motion="full"] .fl-dd{animation:flDrop .25s ' + EASE + '}',
    '@keyframes flDrop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
    '.fl-opt{display:flex;align-items:baseline;gap:10px;padding:10px 16px;cursor:pointer;font-size:15px}',
    '.fl-opt.on,.fl-opt:hover{background:var(--accent-bg)}',
    '.fl-opt b{font-weight:800}',
    '.fl-opt mark{background:none;color:var(--accent-text,var(--accent))}',
    '.fl-opt span{color:var(--text2);font-size:13px}',
    '.fl-opt .src{margin-left:auto;font-size:10.5px;font-weight:800;color:var(--c-gold)}',
    '.fl-recent{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:14px;font-size:12px;color:var(--text2)}',
    '.fl-chip{background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:99px;padding:4px 11px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
    '.fl-chip:hover{border-color:var(--accent)}',
    '.fl-legend{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}',
    '.fl-case{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:99px;border:1px solid color-mix(in srgb,var(--cc) 55%,transparent);color:var(--cc);background:color-mix(in srgb,var(--cc) 12%,transparent);white-space:nowrap}',
    '.fl-case i{font-style:normal;font-weight:600;opacity:.85}',
    '.fl-head{background:var(--surface2);border:1px solid var(--border);border-radius:18px;padding:18px 20px;margin-bottom:16px;box-shadow:0 12px 30px -20px rgba(0,0,0,.5)}',
    '.fl-verb{font-size:30px;font-weight:800;letter-spacing:-.5px;line-height:1.15}',
    '.fl-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;font-size:13px;color:var(--text2)}',
    '.fl-asp{font-size:11px;font-weight:800;padding:3px 9px;border-radius:7px;background:var(--accent-bg);color:var(--accent-text,var(--accent));border:1px solid var(--accent)}',
    '.fl-pair{cursor:pointer;border-bottom:1px dashed var(--text3)}',
    '.fl-pair:hover{color:var(--accent-text,var(--accent))}',
    '.fl-tr{font-size:16px;margin-top:6px}',
    '.fl-fix{font-size:12.5px;color:var(--text2);margin-bottom:6px}',
    '.fl-grp{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text2);margin:18px 0 10px}',
    '.fl-pats{display:grid;gap:10px}',
    '.fl-pat{position:relative;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--cc);border-radius:14px;padding:14px 16px;transition:transform .3s ' + EASE + ',box-shadow .3s ' + EASE + '}',
    '.fl-pat:hover{transform:translateY(-2px);box-shadow:0 12px 26px -16px rgba(0,0,0,.5)}',
    'html[data-motion="full"] .fl-anim>*{animation:flRise .6s ' + EASE + ' both;animation-delay:calc(var(--i,0) * 70ms)}',
    '@keyframes flRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '.fl-pat .top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}',
    '.fl-kalip{font-size:18px;font-weight:800}',
    '.fl-kalip em{font-style:normal;color:var(--cc)}',
    '.fl-edat{font-size:12px;font-weight:900;padding:2px 9px;border-radius:7px;background:var(--text);color:var(--bg)}',
    '.fl-freq{margin-left:auto;font-size:11px;color:var(--text2);white-space:nowrap}',
    '.fl-pat .m{font-size:14px;margin:2px 0 8px}',
    '.fl-ex{font-size:13.5px;line-height:1.55;background:var(--surface2);border-radius:9px;padding:8px 11px}',
    '.fl-ex i{display:block;font-style:normal;color:var(--text2);font-size:12.5px}',
    '.fl-note{display:flex;gap:10px;align-items:flex-start;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:11px 14px;margin-top:12px;font-size:13.5px;line-height:1.55}',
    '.fl-sim{display:flex;gap:8px;flex-wrap:wrap}',
    '.fl-btn{background:var(--surface2);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:6px 11px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
    '.fl-btn:hover:not(:disabled){border-color:var(--accent)}',
    '.fl-empty{color:var(--text2);font-size:13.5px;padding:14px 0}',
    'html[data-motion="full"] .fl-loading{animation:flPulse 1.1s ease-in-out infinite}',
    '@keyframes flPulse{0%,100%{opacity:1}50%{opacity:.5}}'
  ].join('\n');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MAP = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z' };
  function norm(s) { return String(s || '').toLowerCase().replace(/[ąćęłńóśźż]/g, function (c) { return MAP[c]; }).replace(/\s+/g, ' ').trim(); }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function caseOf(p) { return CASES[p] || { c: 'var(--text2)', q: '', tr: p || '' }; }

  function Fiil(root, opts) {
    this.root = root; this.req = opts.req; this.saveSpecial = opts.saveSpecial; this.specialList = opts.specialList;
    this.list = []; this.sel = -1; this.result = null;
    var self = this;
    (window.FIIL_LISTE || '').trim().split('\n').forEach(function (l) { var p = l.split('|'); if (p[0]) self.list.push({ pl: p[0].trim(), tr: (p[1] || '').trim(), n: norm(p[0]) }); });
    if (!document.getElementById('fl-css')) { var s = document.createElement('style'); s.id = 'fl-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('fl');
  }

  Fiil.prototype.init = function () {
    var self = this;
    if (this._ready) { this.focus(); return; }
    this._ready = true;
    this.render();
    // Burak Special'daki fiilleri de öneriye kat
    if (this.specialList) Promise.resolve(this.specialList()).then(function (arr) {
      var have = {}; self.list.forEach(function (v) { have[v.n] = 1; });
      (arr || []).forEach(function (w) {
        if (w && w.category === 'verb' && w.pl && !have[norm(w.pl)]) { self.list.push({ pl: w.pl, tr: w.tr || '', n: norm(w.pl), special: true }); have[norm(w.pl)] = 1; }
      });
    }).catch(function () {});
  };

  Fiil.prototype.recent = function () { try { return JSON.parse(localStorage.getItem('polonica_fiil_son') || '[]'); } catch (e) { return []; } };
  Fiil.prototype.pushRecent = function (v) { var r = this.recent().filter(function (x) { return x !== v; }); r.unshift(v); try { localStorage.setItem('polonica_fiil_son', JSON.stringify(r.slice(0, 8))); } catch (e) {} };

  Fiil.prototype.render = function () {
    var self = this;
    var legend = Object.keys(CASES).map(function (k) { var c = CASES[k]; return '<span class="fl-case" style="--cc:' + c.c + '">' + esc(k) + ' <i>' + esc(c.q) + '</i></span>'; }).join('');
    this.root.innerHTML = '<div class="panel-title">🔗 Fiil</div><div class="panel-sub">Fiili yaz: hangi hali (przypadek) ve hangi edatı istediğini, örnekleriyle gör.</div>' +
      '<div class="fl-search"><span class="fl-ico">🔎</span><input class="fl-input" lang="pl" autocomplete="off" spellcheck="false" placeholder="przyglądać się, czekać, bać się…"><div class="fl-dd" style="display:none"></div></div>' +
      '<div class="fl-recent"></div><div class="fl-legend">' + legend + '</div><div class="fl-out"></div>';
    var inp = this.root.querySelector('.fl-input');
    inp.addEventListener('input', function () { self.suggest(inp.value); });
    inp.addEventListener('keydown', function (e) {
      var opts = self.root.querySelectorAll('.fl-opt');
      if (e.key === 'ArrowDown' && opts.length) { e.preventDefault(); self.sel = (self.sel + 1) % opts.length; self.mark(); }
      else if (e.key === 'ArrowUp' && opts.length) { e.preventDefault(); self.sel = (self.sel - 1 + opts.length) % opts.length; self.mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); var pick = self.sel >= 0 && self.sugg[self.sel] ? self.sugg[self.sel].pl : inp.value; self.lookup(pick); }
      else if (e.key === 'Escape') self.hideDD();
    });
    inp.addEventListener('blur', function () { setTimeout(function () { self.hideDD(); }, 150); });
    this.renderRecent();
    this.focus();
  };

  Fiil.prototype.focus = function () { var i = this.root.querySelector('.fl-input'); if (i && window.innerWidth > 700) i.focus(); };

  Fiil.prototype.renderRecent = function () {
    var self = this, r = this.recent(), box = this.root.querySelector('.fl-recent');
    box.innerHTML = r.length ? 'Son aramalar: ' + r.map(function (v) { return '<button class="fl-chip" lang="pl">' + esc(v) + '</button>'; }).join('') : '';
    box.querySelectorAll('.fl-chip').forEach(function (b) { b.onclick = function () { self.lookup(b.textContent); }; });
  };

  Fiil.prototype.suggest = function (q) {
    var n = norm(q), dd = this.root.querySelector('.fl-dd');
    this.sel = -1;
    if (n.length < 2) { this.hideDD(); return; }
    var scored = [];
    this.list.forEach(function (v) {
      var s;
      if (v.n.indexOf(n) === 0) s = 0 + (v.n.length - n.length) / 100;
      else if (v.n.indexOf(n) > 0) s = 1 + v.n.indexOf(n) / 100;
      else {
        var head = v.n.slice(0, n.length + 1), d = Math.min(lev(n, head), lev(n, v.n.slice(0, n.length)));
        if (d <= (n.length > 6 ? 2 : 1)) s = 2 + d;
      }
      if (s != null) scored.push({ v: v, s: s + (v.special ? -0.05 : 0) });
    });
    scored.sort(function (a, b) { return a.s - b.s; });
    this.sugg = scored.slice(0, 8).map(function (x) { return x.v; });
    if (!this.sugg.length) { dd.innerHTML = '<div class="fl-opt" style="cursor:default"><span>Listede yok. Enter\'a bas, yine de bakalım.</span></div>'; dd.style.display = 'block'; return; }
    dd.innerHTML = this.sugg.map(function (v, i) {
      var k = v.n.indexOf(n), label = esc(v.pl);
      if (k >= 0 && v.n.length === v.pl.length) label = esc(v.pl.slice(0, k)) + '<mark>' + esc(v.pl.slice(k, k + n.length)) + '</mark>' + esc(v.pl.slice(k + n.length));
      return '<div class="fl-opt" data-i="' + i + '"><b lang="pl">' + label + '</b><span>' + esc(v.tr) + '</span>' + (v.special ? '<span class="src">⭐ Special</span>' : '') + '</div>';
    }).join('');
    dd.style.display = 'block';
    var self = this;
    dd.querySelectorAll('.fl-opt[data-i]').forEach(function (o) { o.onmousedown = function (e) { e.preventDefault(); self.lookup(self.sugg[+o.getAttribute('data-i')].pl); }; });
  };
  Fiil.prototype.mark = function () { var self = this; this.root.querySelectorAll('.fl-opt').forEach(function (o, i) { o.classList.toggle('on', i === self.sel); }); };
  Fiil.prototype.hideDD = function () { var dd = this.root.querySelector('.fl-dd'); if (dd) dd.style.display = 'none'; };

  Fiil.prototype.lookup = function (verb, force) {
    var self = this, out = this.root.querySelector('.fl-out'), inp = this.root.querySelector('.fl-input');
    verb = String(verb || '').trim(); if (!verb) return;
    inp.value = verb; this.hideDD();
    out.innerHTML = '<div class="fl-empty fl-loading">🔗 <b lang="pl">' + esc(verb) + '</b> fiilinin kalıpları çıkarılıyor…</div>';
    this.req('POST', '/api/fiil', { verb: verb, yenile: !!force }).then(function (r) {
      if (!r || r.error) throw new Error(r && r.error || 'hata');
      self.result = r; self.pushRecent(r.fiil || verb); self.renderRecent(); self.show(r);
    }).catch(function (e) { out.innerHTML = '<div class="fl-empty">Bulunamadı: ' + esc(e.message) + '</div>'; });
  };

  Fiil.prototype.patHtml = function (k, i) {
    var cs = caseOf(k.przypadek), kal = esc(k.kalip || '');
    // edatı ve hal sorusu kelimelerini (kogo, czemu, kimś…) renklendir
    kal = kal.replace(/(^|\s)(kogo|co|komu|czemu|kim|czym|kimś|czymś|kogoś|czegoś|komuś|czemuś|coś|kim\/czym|czego|o kim|o czym|robić|zrobić|że)(?=[\s\/,.;]|$)/g, '$1<em>$2</em>');
    return '<div class="fl-pat" style="--cc:' + cs.c + ';--i:' + i + '">' +
      '<div class="top">' + (k.edat ? '<span class="fl-edat" lang="pl">' + esc(k.edat) + '</span>' : '') +
      '<span class="fl-case" style="--cc:' + cs.c + '">' + esc(k.przypadek) + ' <i>' + esc(k.soru || cs.q) + '</i></span>' +
      '<span class="fl-freq">' + esc(k.siklik || '') + '</span></div>' +
      '<div class="fl-kalip" lang="pl">' + kal + '</div>' +
      '<div class="m">' + esc(k.tr || '') + '</div>' +
      (k.ornek_pl ? '<div class="fl-ex" lang="pl">' + esc(k.ornek_pl) + '<i>' + esc(k.ornek_tr || '') + '</i></div>' : '') +
      (this.saveSpecial ? '<div style="margin-top:8px"><button class="fl-btn" data-sp="' + i + '">⭐ Special\'e ekle</button></div>' : '') +
      '</div>';
  };

  Fiil.prototype.show = function (r) {
    var self = this, out = this.root.querySelector('.fl-out');
    var pats = (r.kaliplar || []).map(function (k, i) { k._i = i; return k; });
    var bez = pats.filter(function (k) { return !k.edat; }), zEd = pats.filter(function (k) { return k.edat; });
    var h = '<div class="fl-anim">';
    h += '<div class="fl-head" style="--i:0">' + (r.duzeltme && r.girdi && r.girdi !== r.fiil ? '<div class="fl-fix">„' + esc(r.girdi) + '" → şöyle anlaşıldı:</div>' : '') +
      '<div class="fl-verb" lang="pl">' + esc(r.fiil) + '</div>' +
      '<div class="fl-meta"><span class="fl-asp">' + esc(r.aspekt || '') + '</span>' +
      (r.cift && r.cift.fiil ? '<span>çifti: <span class="fl-pair" lang="pl" data-pair="1">' + esc(r.cift.fiil) + '</span> (' + esc(r.cift.aspekt || '') + ')</span>' : '') +
      (r.cached ? '<span style="margin-left:auto;font-size:11px">kayıtlı sonuç · <a href="#" data-a="yenile" style="color:inherit">yenile</a></span>' : '') + '</div>' +
      '<div class="fl-tr">' + esc(r.tr || '') + '</div></div>';
    if (bez.length) h += '<div class="fl-grp" style="--i:1">Edatsız kullanım</div><div class="fl-pats">' + bez.map(function (k, i) { return self.patHtml(k, k._i); }).join('') + '</div>';
    if (zEd.length) h += '<div class="fl-grp" style="--i:2">Edatlı kullanım</div><div class="fl-pats">' + zEd.map(function (k) { return self.patHtml(k, k._i); }).join('') + '</div>';
    if (r.olumsuz) h += '<div class="fl-note" style="--i:3"><span>🚫</span><div><b>Olumsuzda:</b> ' + esc(r.olumsuz) + '</div></div>';
    if (r.dikkat) h += '<div class="fl-note" style="--i:4"><span>⚠️</span><div>' + esc(r.dikkat) + '</div></div>';
    if (r.benzer && r.benzer.length) h += '<div class="fl-grp" style="--i:5">Benzer fiiller</div><div class="fl-sim" style="--i:5">' + r.benzer.map(function (b) {
      return '<button class="fl-chip" lang="pl" data-sim="' + esc(String(b.kalip || '').split(/[\s(]/)[0] + (/\bsię\b/.test(b.kalip || '') ? ' się' : '')) + '" title="' + esc(b.tr || '') + '">' + esc(b.kalip) + ' <span style="color:var(--text2);font-weight:500">· ' + esc(b.tr || '') + '</span></button>';
    }).join('') + '</div>';
    h += '</div>';
    out.innerHTML = h;
    out.querySelectorAll('.fl-anim > *').forEach(function (el, i) { if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i); });
    var pair = out.querySelector('[data-pair]'); if (pair) pair.onclick = function () { self.lookup(r.cift.fiil); };
    var yen = out.querySelector('[data-a=yenile]'); if (yen) yen.onclick = function (e) { e.preventDefault(); self.lookup(r.girdi || r.fiil, true); };
    out.querySelectorAll('[data-sim]').forEach(function (b) { b.onclick = function () { self.lookup(b.getAttribute('data-sim')); }; });
    out.querySelectorAll('[data-sp]').forEach(function (b) {
      b.onclick = function () {
        var k = pats[+b.getAttribute('data-sp')]; if (!k || !self.saveSpecial) return;
        b.disabled = true; b.textContent = '⏳';
        Promise.resolve(self.saveSpecial({ pl: k.kalip, original: k.kalip, tr: k.tr, category: 'phrase', type: 'rekcja', example_pl: k.ornek_pl || '', example_tr: k.ornek_tr || '', note: (k.edat ? k.edat + ' + ' : '') + k.przypadek + ' · ' + r.fiil }))
          .then(function () { b.textContent = '✓ Eklendi'; }).catch(function () { b.disabled = false; b.textContent = 'Tekrar dene'; });
      };
    });
  };

  window.Fiil = Fiil;
})();
