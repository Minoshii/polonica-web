/* ═══════════════════════════════════════════════════════════════
   POLONICA · DZIENNIK (Lehçe günlük)
   Her gün: "Dziś" (bugün ne yaptım) + "Jutro" (ne yapacağım).
   ✨ Sprawdź: hatalar (Türkçe açıklamalı), doğal hali, fiil/sıfat
   önerileri ve ertesi gün için 3 kelimelik görev.
   Sunucu: GET /api/dziennik, PUT /api/dziennik/:date,
           POST /api/dziennik/:date/sprawdz
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(.22,1,.36,1)';
  var CSS = [
    '.dz{width:100%;max-width:1100px}',
    '.dz *{box-sizing:border-box}',
    '.dz-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px}',
    '.dz-sp{flex:1}',
    /* seri alevi */
    '.dz-streak{display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:8px 14px}',
    '.dz-flame{font-size:26px;display:inline-block;transform-origin:50% 90%}',
    'html[data-motion="full"] .dz-flame.on{animation:dzFlame 1.6s ease-in-out infinite}',
    '@keyframes dzFlame{0%,100%{transform:scale(1) rotate(-3deg);filter:drop-shadow(0 0 6px rgba(255,140,40,.55))}50%{transform:scale(1.12) rotate(3deg);filter:drop-shadow(0 0 14px rgba(255,120,30,.8))}}',
    '.dz-flame.off{filter:grayscale(1);opacity:.45}',
    '.dz-streak b{font-size:20px;font-weight:800;line-height:1}',
    '.dz-streak small{display:block;font-size:11px;color:var(--text2)}',
    /* takvim */
    '.dz-heat{display:grid;grid-template-columns:repeat(7,13px);grid-auto-rows:13px;gap:3px}',
    '.dz-heat i{border-radius:3px;background:var(--surface3);cursor:pointer;transition:transform .2s ' + EASE + '}',
    '.dz-heat i:hover{transform:scale(1.35)}',
    '.dz-heat i.l1{background:color-mix(in srgb,var(--accent) 35%,var(--surface3))}',
    '.dz-heat i.l2{background:color-mix(in srgb,var(--accent) 65%,var(--surface3))}',
    '.dz-heat i.l3{background:var(--accent)}',
    '.dz-heat i.sel{outline:2px solid var(--text);outline-offset:1px}',
    '.dz-heat i.fut{opacity:.25;cursor:default}',
    /* tarih gezgini */
    '.dz-nav{display:flex;align-items:center;gap:8px;margin-bottom:12px}',
    '.dz-date{font-size:17px;font-weight:800;min-width:230px;text-align:center}',
    'html[data-motion="full"] .dz-date.swap{animation:dzSwap .45s ' + EASE + '}',
    '@keyframes dzSwap{from{opacity:0;transform:translateY(6px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}',
    '.dz-btn{background:var(--surface2);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}',
    '.dz-btn:hover:not(:disabled){border-color:var(--accent)}',
    '.dz-btn:disabled{opacity:.4;cursor:default}',
    '.dz-btn.pri{border-color:var(--accent);background:var(--accent);color:var(--on-accent,#111)}',
    '.dz-btn.big{padding:11px 20px;font-size:14px;border-radius:12px}',
    /* görev çipleri */
    '.dz-quest{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 14px;padding:10px 14px;border-radius:12px;background:var(--accent-bg);border:1px dashed var(--accent)}',
    '.dz-quest .lbl{font-size:12px;font-weight:800;color:var(--accent-text,var(--accent))}',
    '.dz-q{font-size:12.5px;font-weight:700;padding:4px 10px;border-radius:99px;background:var(--surface);border:1px solid var(--border2);transition:all .4s ' + EASE + '}',
    '.dz-q em{font-style:normal;font-weight:500;color:var(--text2);margin-left:5px}',
    '.dz-q.ok{background:var(--green-bg);border-color:var(--green);color:var(--c-green)}',
    'html[data-motion="full"] .dz-q.ok.pop{animation:dzPop .6s cubic-bezier(.34,1.56,.64,1)}',
    '@keyframes dzPop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}',
    /* defter sayfaları */
    '.dz-pages{display:grid;grid-template-columns:1fr 1fr;gap:16px}',
    '@media(max-width:860px){.dz-pages{grid-template-columns:1fr}}',
    '.dz-page{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px 18px 12px;box-shadow:0 10px 30px -18px rgba(0,0,0,.45);transform-origin:left center}',
    'html[data-motion="full"] .dz-page.in{animation:dzPage .7s ' + EASE + ' both}',
    'html[data-motion="full"] .dz-page.in:nth-child(2){animation-delay:.08s}',
    '@keyframes dzPage{from{opacity:0;transform:perspective(1200px) rotateY(-14deg) translateX(-8px)}to{opacity:1;transform:none}}',
    '.dz-page h3{margin:0 0 2px;font-size:15px;font-weight:800;display:flex;align-items:center;gap:7px}',
    '.dz-page .hint{font-size:11.5px;color:var(--text2);margin-bottom:8px}',
    '.dz .dz-ta{width:100%;height:auto;min-height:240px;margin:0;resize:vertical;border:none!important;border-radius:0;outline:none;box-shadow:none!important;background-color:transparent!important;color:var(--text);font:inherit;font-family:inherit!important;font-size:15px!important;line-height:30px;padding:0 4px!important;',
    'background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 29px,color-mix(in srgb,var(--border2) 70%,transparent) 29px,color-mix(in srgb,var(--border2) 70%,transparent) 30px)!important;background-attachment:local!important;caret-color:var(--accent)}',
    '.dz-ta::placeholder{color:var(--text3)}',
    '.dz-foot{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text2);margin-top:6px}',
    '.dz-ink{width:8px;height:8px;border-radius:50%;background:var(--text3);transition:background .3s}',
    '.dz-ink.saving{background:var(--accent)}',
    'html[data-motion="full"] .dz-ink.saving{animation:dzInk .8s ease-in-out infinite}',
    '@keyframes dzInk{0%,100%{transform:scale(1)}50%{transform:scale(1.6)}}',
    '.dz-ink.saved{background:var(--green)}',
    /* mühür */
    '.dz-stamp{position:absolute;right:16px;top:12px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--c-green);border:2px solid var(--c-green);border-radius:7px;padding:3px 8px;opacity:0;transform:rotate(-8deg) scale(1.6);pointer-events:none}',
    '.dz-stamp.show{opacity:.85;transform:rotate(-8deg) scale(1);transition:all .35s cubic-bezier(.34,1.56,.64,1)}',
    '.dz-stamp.fade{opacity:0;transition:opacity 1s ease .6s}',
    /* eylem çubuğu */
    '.dz-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:16px 0 4px}',
    '.dz-shine{position:relative;overflow:hidden}',
    'html[data-motion="full"] .dz-shine::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translateX(-120%);animation:dzShine 2.8s ' + EASE + ' infinite}',
    '@keyframes dzShine{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}',
    'html[data-motion="full"] .dz-loading{animation:dzPulse 1.2s ease-in-out infinite}',
    '@keyframes dzPulse{0%,100%{opacity:1}50%{opacity:.55}}',
    /* sonuç */
    '.dz-res{margin-top:16px;display:grid;gap:14px}',
    'html[data-motion="full"] .dz-res>*{animation:dzRise .6s ' + EASE + ' both}',
    'html[data-motion="full"] .dz-res>*:nth-child(2){animation-delay:.08s}',
    'html[data-motion="full"] .dz-res>*:nth-child(3){animation-delay:.16s}',
    'html[data-motion="full"] .dz-res>*:nth-child(4){animation-delay:.24s}',
    'html[data-motion="full"] .dz-res>*:nth-child(5){animation-delay:.32s}',
    '@keyframes dzRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '.dz-card{background:var(--surface2);border:1px solid var(--border);border-radius:16px;padding:16px 18px}',
    '.dz-card h4{margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--text2)}',
    '.dz-score{display:flex;align-items:center;gap:18px;flex-wrap:wrap}',
    '.dz-ring{width:92px;height:92px;flex-shrink:0}',
    '.dz-ring circle{fill:none;stroke-width:9}',
    '.dz-ring .bg{stroke:var(--surface3)}',
    '.dz-ring .fg{stroke:var(--accent);stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset 1.4s ' + EASE + '}',
    '.dz-ring text{fill:var(--text);font-size:24px;font-weight:800;text-anchor:middle;dominant-baseline:central;font-family:inherit}',
    '.dz-lvl{display:inline-block;font-size:12px;font-weight:800;padding:3px 10px;border-radius:99px;background:var(--accent-bg);color:var(--accent-text,var(--accent));border:1px solid var(--accent)}',
    '.dz-txt{font-size:15px;line-height:1.85;white-space:pre-wrap}',
    '.dz-err{position:relative;cursor:help;text-decoration:underline wavy var(--c-red);text-decoration-thickness:1.5px;text-underline-offset:4px;background:color-mix(in srgb,var(--red) 12%,transparent);border-radius:4px;padding:0 2px}',
    'html[data-motion="full"] .dz-err{animation:dzErr .8s ' + EASE + ' both}',
    '@keyframes dzErr{from{background:color-mix(in srgb,var(--red) 40%,transparent)}to{background:color-mix(in srgb,var(--red) 12%,transparent)}}',
    '.dz-err.fixed{text-decoration:none;background:color-mix(in srgb,var(--green) 16%,transparent)}',
    '.dz-err .was{text-decoration:line-through;opacity:.55;margin-right:4px}',
    '.dz-errs{display:grid;gap:8px;margin-top:12px}',
    '.dz-e{display:block;font-size:13px;line-height:1.55;padding:10px 12px;border-radius:10px;background:var(--surface);border:1px solid var(--border);overflow-wrap:anywhere}',
    '.dz-e .tag{display:inline-block;max-width:100%;font-size:10.5px;font-weight:800;letter-spacing:.04em;padding:2px 8px;border-radius:6px;background:var(--red-bg);color:var(--c-red);margin-bottom:5px;white-space:normal}',
    '.dz-e .fix{display:block;font-size:14px;margin-bottom:3px}',
    '.dz-e s{opacity:.6}',
    '.dz-e b{color:var(--c-green)}',
    '.dz-e .why{display:block;color:var(--text2)}',
    '.dz-words{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}',
    '.dz-w{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:11px 12px;transition:transform .3s ' + EASE + ',border-color .2s}',
    '.dz-w:hover{transform:translateY(-2px);border-color:var(--accent)}',
    '.dz-w .k{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-text,var(--accent))}',
    '.dz-w .p{font-size:15px;font-weight:800;margin:2px 0}',
    '.dz-w .t{font-size:12.5px;color:var(--text2)}',
    '.dz-w .ex{font-size:12px;color:var(--text2);font-style:italic;margin-top:5px}',
    '.dz-w .dz-btn{margin-top:8px;padding:4px 9px;font-size:11.5px}',
    '.dz-toggle{display:flex;gap:6px;margin-bottom:10px}',
    '.dz-toggle .dz-btn.on{border-color:var(--accent);color:var(--accent-text,var(--accent));background:var(--accent-bg)}',
    '.dz-tip{position:fixed;z-index:9999;max-width:300px;background:var(--surface3);border:1px solid var(--border2);color:var(--text);border-radius:10px;padding:9px 11px;font-size:12.5px;line-height:1.5;box-shadow:0 12px 30px rgba(0,0,0,.35);pointer-events:none}',
    '.dz-empty{color:var(--text2);font-size:13px}'
  ].join('\n');

  var MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  var DAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function key(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(k) { var a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function shift(k, n) { var d = parse(k); d.setDate(d.getDate() + n); return key(d); }
  function today() { return key(new Date()); }
  function words(s) { return (String(s || '').trim().match(/\S+/g) || []).length; }
  function hasText(e) { return !!(e && ((e.done || '').trim() || (e.plan || '').trim())); }
  function prettyDate(k) { var d = parse(k); return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  var TURLER = ['przypadek', 'aspekt', 'odmiana', 'rodzaj', 'pisownia', 'szyk', 'przyimek', 'liczebnik', 'słownictwo', 'interpunkcja', 'inne'];
  var TUR_TR = { przypadek: 'hal eki', aspekt: 'aspekt', odmiana: 'çekim', rodzaj: 'cinsiyet', pisownia: 'yazım', szyk: 'söz dizimi', przyimek: 'edat', liczebnik: 'sayı', 'słownictwo': 'kelime', interpunkcja: 'noktalama', inne: 'diğer' };
  // Eski kayıtlarda "tur" alanında uzun metin olabiliyor: kısa etikete indir, uzun metni açıklamaya taşı
  function tagOf(p) {
    var raw = String(p.tur || '').toLowerCase();
    var found = TURLER.filter(function (t) { return raw.indexOf(t.slice(0, 6)) >= 0; });
    if (raw.indexOf('przecin') >= 0 && found.indexOf('interpunkcja') < 0) found.push('interpunkcja');
    var tag = found.slice(0, 2).map(function (t) { return TUR_TR[t] || t; }).join(' + ') || 'hata';
    var why = p.aciklama || (raw.length > 20 ? p.tur : '');
    return { tag: tag, why: why };
  }
  function motion() { return document.documentElement.getAttribute('data-motion') || 'full'; }

  function usedWord(w, text) {
    var t = String(text || '').toLocaleLowerCase('pl');
    return String(w || '').toLocaleLowerCase('pl').split(/[\/,]/).some(function (form) {
      form = form.trim(); if (!form) return false;
      var stem = form.split(/\s+/).pop();
      stem = stem.length > 5 ? stem.slice(0, stem.length - 2) : stem.slice(0, Math.max(3, stem.length - 1));
      return new RegExp('(^|[^\\p{L}])' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u').test(t);
    });
  }

  function Dziennik(root, opts) {
    this.root = root; this.req = opts.req; this.saveSpecial = opts.saveSpecial;
    this.data = { entries: {} }; this.date = today(); this.timer = null; this.view = 'hatalar';
    if (!document.getElementById('dz-css')) { var s = document.createElement('style'); s.id = 'dz-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('dz');
  }

  Dziennik.prototype.load = function () {
    var self = this;
    if (!this._loaded) this.root.innerHTML = '<div class="panel-title">📔 Dziennik</div><div class="dz-empty">Yükleniyor…</div>';
    return this.req('GET', '/api/dziennik').then(function (d) {
      self.data = d && d.entries ? d : { entries: {} }; self._loaded = true;
      if (self.date > today()) self.date = today();
      self.render(true);
    });
  };

  Dziennik.prototype.entry = function (k) { return this.data.entries[k || this.date] || {}; };

  Dziennik.prototype.streak = function () {
    var n = 0, k = today();
    if (!hasText(this.data.entries[k])) k = shift(k, -1);
    while (hasText(this.data.entries[k])) { n++; k = shift(k, -1); }
    return n;
  };

  Dziennik.prototype.heat = function () {
    var cells = '', t = today(), start = shift(t, -34), sel = this.date;
    for (var i = 0; i < 35; i++) {
      var k = shift(start, i), e = this.data.entries[k], w = words((e && e.done || '') + ' ' + (e && e.plan || ''));
      var l = w === 0 ? '' : w < 40 ? 'l1' : w < 100 ? 'l2' : 'l3';
      cells += '<i class="' + l + (k === sel ? ' sel' : '') + '" data-k="' + k + '" title="' + esc(prettyDate(k)) + (w ? ' · ' + w + ' kelime' : '') + '"></i>';
    }
    return '<div class="dz-heat">' + cells + '</div>';
  };

  Dziennik.prototype.render = function (firstPaint) {
    var self = this, e = this.entry(), st = this.streak(), isToday = this.date === today();
    var y = this.data.entries[shift(this.date, -1)], quest = y && y.check && y.check.yarin || [];
    var all = (e.done || '') + '\n' + (e.plan || '');

    var h = '<div class="panel-title">📔 Dziennik</div><div class="panel-sub">Her gün Lehçe yaz: bugün ne yaptın, yarın ne yapacaksın. Kontrol ettir, seviye atla.</div>';

    h += '<div class="dz-head"><div class="dz-nav" style="margin:0"><button class="dz-btn" data-a="prev">←</button><div class="dz-date' + (firstPaint ? '' : ' swap') + '">' + esc(prettyDate(this.date)) + (isToday ? ' · dziś' : '') + '</div>' +
      '<button class="dz-btn" data-a="next"' + (isToday ? ' disabled' : '') + '>→</button>' + (isToday ? '' : '<button class="dz-btn" data-a="today">Dziś</button>') + '</div><span class="dz-sp"></span>' +
      '<div class="dz-streak"><span class="dz-flame ' + (st ? 'on' : 'off') + '">🔥</span><div><b>' + st + '</b><small>günlük seri</small></div></div>' + this.heat() + '</div>';

    if (quest.length) {
      h += '<div class="dz-quest"><span class="lbl">🎯 Dzisiejsze wyzwanie: bu kelimeleri kullan</span>' + quest.map(function (q, i) {
        return '<span class="dz-q' + (usedWord(q.pl, all) ? ' ok' : '') + '" data-q="' + i + '">' + (usedWord(q.pl, all) ? '✓ ' : '') + esc(q.pl) + '<em>' + esc(q.tr) + '</em></span>';
      }).join('') + '</div>';
    }

    h += '<div class="dz-pages">' +
      '<div class="dz-page' + (firstPaint ? ' in' : '') + '"><span class="dz-stamp">Zapisano</span><h3>✅ Dziś</h3><div class="hint">Bugün ne yaptın? (Dziś rano…, Potem…, Wieczorem…)</div>' +
      '<textarea class="dz-ta" data-f="done" lang="pl" spellcheck="false" placeholder="Dziś wstałem o siódmej, zjadłem jajka i pojechałem na uczelnię…">' + esc(e.done || '') + '</textarea>' +
      '<div class="dz-foot"><span class="dz-ink" data-ink="done"></span><span data-wc="done">' + words(e.done) + ' kelime</span></div></div>' +
      '<div class="dz-page' + (firstPaint ? ' in' : '') + '"><span class="dz-stamp">Zapisano</span><h3>🗓 Jutro / plany</h3><div class="hint">Yarın ne yapacaksın? (Jutro zrobię…, Mam zamiar…, Muszę…)</div>' +
      '<textarea class="dz-ta" data-f="plan" lang="pl" spellcheck="false" placeholder="Jutro muszę napisać kompozycję, a potem pójdę na siłownię…">' + esc(e.plan || '') + '</textarea>' +
      '<div class="dz-foot"><span class="dz-ink" data-ink="plan"></span><span data-wc="plan">' + words(e.plan) + ' kelime</span></div></div></div>';

    h += '<div class="dz-actions"><button class="dz-btn pri big dz-shine" data-a="check"' + (hasText(e) ? '' : ' disabled') + '>✨ Sprawdź mój polski</button>' +
      '<span class="dz-empty">' + (e.check ? 'Son kontrol: ' + new Date(e.check.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + (this.stale(e) ? ' · metin değişti, tekrar kontrol et' : '') : 'Yazdıkların otomatik kaydedilir.') + '</span></div>';

    h += '<div class="dz-res">' + (e.check ? this.resultHtml(e.check) : '') + '</div>';

    this.root.innerHTML = h;
    this.bind();
    if (e.check) this.animateResult();
  };

  Dziennik.prototype.stale = function (e) {
    if (!e.check || !e.check.kaynak) return false;
    var text = ((e.done || '').trim() ? 'DZIŚ:\n' + e.done.trim() : '') + ((e.done || '').trim() && (e.plan || '').trim() ? '\n\n' : '') + ((e.plan || '').trim() ? 'JUTRO / PLANY:\n' + e.plan.trim() : '');
    return text !== e.check.kaynak;
  };

  Dziennik.prototype.resultHtml = function (c) {
    var errs = (c.parcalar || []).filter(function (p) { return p.hata; });
    var self = this;
    var circ = 2 * Math.PI * 38;
    var h = '<div class="dz-card"><div class="dz-score">' +
      '<svg class="dz-ring" viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="38"/><circle class="fg" cx="46" cy="46" r="38" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + circ.toFixed(1) + '" data-p="' + (+c.puan || 0) + '"/><text x="46" y="46" data-n="' + (+c.puan || 0) + '">0</text></svg>' +
      '<div style="flex:1;min-width:220px"><span class="dz-lvl">' + esc(c.seviye || '') + '</span> <span class="dz-empty" style="margin-left:6px">' + errs.length + ' hata</span>' +
      '<p style="margin:8px 0 4px;font-size:13.5px;line-height:1.55">💪 ' + esc(c.guclu || '') + '</p><p style="margin:0;font-size:13.5px;line-height:1.55">🎯 ' + esc(c.odak || '') + '</p></div></div></div>';

    h += '<div class="dz-card"><div class="dz-toggle"><button class="dz-btn' + (this.view === 'hatalar' ? ' on' : '') + '" data-v="hatalar">🔍 Hatalarım</button><button class="dz-btn' + (this.view === 'duzgun' ? ' on' : '') + '" data-v="duzgun">✔ Düzeltilmiş</button><button class="dz-btn' + (this.view === 'dogal' ? ' on' : '') + '" data-v="dogal">🌿 Doğal hali</button></div>' +
      '<div class="dz-txt" lang="pl">' + this.viewHtml(c) + '</div>' +
      (this.view === 'hatalar' && errs.length ? '<div class="dz-errs">' + errs.map(function (p) {
        var tg = tagOf(p);
        return '<div class="dz-e"><span class="tag">' + esc(tg.tag) + '</span><span class="fix"><s lang="pl">' + esc(String(p.t).trim()) + '</s> → <b lang="pl">' + esc(p.dogru) + '</b></span>' + (tg.why ? '<span class="why">' + esc(tg.why) + '</span>' : '') + '</div>';
      }).join('') + '</div>' : '') + '</div>';

    if (c.kelimeler && c.kelimeler.length) {
      h += '<div class="dz-card"><h4>📚 Senin için fiiller ve sıfatlar</h4><div class="dz-words">' + c.kelimeler.map(function (w, i) {
        return '<div class="dz-w"><div class="k">' + esc(w.tur || '') + '</div><div class="p" lang="pl">' + esc(w.pl) + '</div><div class="t">' + esc(w.tr) + '</div>' +
          (w.ornek ? '<div class="ex" lang="pl">„' + esc(w.ornek) + '"</div>' : '') +
          (self.saveSpecial ? '<button class="dz-btn" data-sp="' + i + '">⭐ Burak Special\'e ekle</button>' : '') + '</div>';
      }).join('') + '</div></div>';
    }
    if (c.yarin && c.yarin.length) {
      h += '<div class="dz-card"><h4>🎯 Yarının görevi</h4><div class="dz-empty" style="margin-bottom:8px">Yarınki günlüğünde bu 3 kelimeyi kullan, kullandıkça yeşil yanacaklar.</div><div style="display:flex;gap:8px;flex-wrap:wrap">' +
        c.yarin.map(function (q) { return '<span class="dz-q" lang="pl">' + esc(q.pl) + '<em>' + esc(q.tr) + '</em></span>'; }).join('') + '</div></div>';
    }
    return h;
  };

  Dziennik.prototype.viewHtml = function (c) {
    if (this.view === 'duzgun') return esc(c.duzeltilmis || '');
    if (this.view === 'dogal') return esc(c.dogal || '');
    var parts = c.parcalar || [];
    if (!parts.length) return esc(c.kaynak || '');
    return parts.map(function (p, i) {
      if (!p.hata) return esc(p.t);
      return '<span class="dz-err" data-e="' + i + '" style="animation-delay:' + (0.3 + i * 0.06).toFixed(2) + 's">' + esc(p.t) + '</span>';
    }).join('');
  };

  Dziennik.prototype.animateResult = function () {
    var ring = this.root.querySelector('.dz-ring .fg'), num = this.root.querySelector('.dz-ring text');
    if (!ring) return;
    var p = +ring.getAttribute('data-p') || 0, circ = parseFloat(ring.getAttribute('stroke-dasharray'));
    var target = circ * (1 - p / 100);
    if (motion() === 'off') { ring.style.strokeDashoffset = target; num.textContent = p; return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { ring.style.strokeDashoffset = target; }); });
    var t0 = performance.now(), dur = motion() === 'full' ? 1400 : 400;
    (function step(t) { var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 4); num.textContent = Math.round(p * k); if (k < 1) requestAnimationFrame(step); })(t0);
  };

  Dziennik.prototype.bind = function () {
    var self = this, R = this.root;
    R.querySelector('[data-a=prev]').onclick = function () { self.go(shift(self.date, -1)); };
    var nx = R.querySelector('[data-a=next]'); if (nx) nx.onclick = function () { self.go(shift(self.date, 1)); };
    var td = R.querySelector('[data-a=today]'); if (td) td.onclick = function () { self.go(today()); };
    R.querySelectorAll('.dz-heat i').forEach(function (c) { var k = c.getAttribute('data-k'); if (k > today()) c.classList.add('fut'); else c.onclick = function () { self.go(k); }; });
    R.querySelectorAll('.dz-ta').forEach(function (ta) {
      ta.addEventListener('input', function () { self.onType(ta); });
    });
    var ck = R.querySelector('[data-a=check]'); if (ck) ck.onclick = function () { self.check(ck); };
    R.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { self.view = b.getAttribute('data-v'); var e = self.entry(); R.querySelector('.dz-res').innerHTML = self.resultHtml(e.check); self.bindResult(); self.animateResult(); }; });
    this.bindResult();
  };

  Dziennik.prototype.bindResult = function () {
    var self = this, R = this.root, c = this.entry().check;
    if (!c) return;
    R.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { self.view = b.getAttribute('data-v'); R.querySelector('.dz-res').innerHTML = self.resultHtml(c); self.bindResult(); self.animateResult(); }; });
    var tip = null;
    R.querySelectorAll('.dz-err').forEach(function (el) {
      var p = (c.parcalar || [])[+el.getAttribute('data-e')];
      if (!p) return;
      el.addEventListener('mouseenter', function () {
        tip = document.createElement('div'); tip.className = 'dz-tip';
        tip.innerHTML = '<b style="color:var(--c-green)">' + esc(p.dogru) + '</b><br>' + esc(tagOf(p).why || '');
        document.body.appendChild(tip);
        var r = el.getBoundingClientRect(); tip.style.left = Math.min(innerWidth - 310, r.left) + 'px'; tip.style.top = (r.bottom + 8) + 'px';
      });
      el.addEventListener('mouseleave', function () { if (tip) { tip.remove(); tip = null; } });
      el.addEventListener('click', function () {
        // dokununca düzeltilmiş hali yerinde göster
        if (el.classList.contains('fixed')) { el.classList.remove('fixed'); el.innerHTML = esc(p.t); }
        else { el.classList.add('fixed'); el.innerHTML = '<span class="was">' + esc(p.t) + '</span>' + esc(p.dogru); }
      });
    });
    R.querySelectorAll('[data-sp]').forEach(function (b) {
      b.onclick = function () {
        var w = (c.kelimeler || [])[+b.getAttribute('data-sp')];
        if (!w || !self.saveSpecial) return;
        b.disabled = true; b.textContent = '⏳';
        Promise.resolve(self.saveSpecial({ pl: w.pl, original: w.pl, tr: w.tr, category: w.tur === 'czasownik' ? 'verb' : w.tur === 'przymiotnik' ? 'adj' : w.tur === 'rzeczownik' ? 'noun' : 'other', example_pl: w.ornek || '', note: 'Dziennik ' + self.date }))
          .then(function () { b.textContent = '✓ Eklendi'; }).catch(function () { b.disabled = false; b.textContent = 'Tekrar dene'; });
      };
    });
  };

  Dziennik.prototype.onType = function (ta) {
    var self = this, f = ta.getAttribute('data-f'), e = this.data.entries[this.date] || (this.data.entries[this.date] = {});
    e[f] = ta.value;
    var wc = this.root.querySelector('[data-wc=' + f + ']'); if (wc) wc.textContent = words(ta.value) + ' kelime';
    var ink = this.root.querySelector('[data-ink=' + f + ']'); if (ink) { ink.className = 'dz-ink saving'; }
    var ck = this.root.querySelector('[data-a=check]'); if (ck) ck.disabled = !hasText(e);
    // görev çiplerini canlı güncelle
    var all = (e.done || '') + '\n' + (e.plan || ''), y = this.data.entries[shift(this.date, -1)], quest = y && y.check && y.check.yarin || [];
    this.root.querySelectorAll('.dz-q[data-q]').forEach(function (chip) {
      var q = quest[+chip.getAttribute('data-q')], was = chip.classList.contains('ok'), now = usedWord(q.pl, all);
      if (now !== was) {
        chip.classList.toggle('ok', now); chip.innerHTML = (now ? '✓ ' : '') + esc(q.pl) + '<em>' + esc(q.tr) + '</em>';
        if (now) { chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop'); }
      }
    });
    clearTimeout(this.timer);
    this.timer = setTimeout(function () { self.save(ta); }, 900);
  };

  Dziennik.prototype.save = function (ta) {
    var self = this, e = this.entry(), date = this.date;
    return this.req('PUT', '/api/dziennik/' + date, { done: e.done || '', plan: e.plan || '' }).then(function () {
      self.root.querySelectorAll('.dz-ink.saving').forEach(function (i) { i.className = 'dz-ink saved'; });
      var page = ta && ta.closest('.dz-page'), st = page && page.querySelector('.dz-stamp');
      if (st && motion() !== 'off') { st.className = 'dz-stamp'; void st.offsetWidth; st.className = 'dz-stamp show'; setTimeout(function () { st.className = 'dz-stamp show fade'; }, 50); }
      var streakB = self.root.querySelector('.dz-streak b'), n = self.streak(); if (streakB && +streakB.textContent !== n) { streakB.textContent = n; self.root.querySelector('.dz-flame').className = 'dz-flame ' + (n ? 'on' : 'off'); }
    });
  };

  Dziennik.prototype.check = function (btn) {
    var self = this, date = this.date;
    clearTimeout(this.timer);
    btn.disabled = true; btn.classList.add('dz-loading'); btn.textContent = '✍️ Nauczycielka czyta…';
    this.save().then(function () {
      return self.req('POST', '/api/dziennik/' + date + '/sprawdz', {});
    }).then(function (r) {
      if (!r || r.error) throw new Error(r && r.error || 'hata');
      self.data.entries[date] = r.entry; self.view = 'hatalar';
      self.render(false);
      var res = self.root.querySelector('.dz-res'); if (res && res.scrollIntoView) res.scrollIntoView({ behavior: motion() === 'full' ? 'smooth' : 'auto', block: 'start' });
    }).catch(function (e) {
      btn.disabled = false; btn.classList.remove('dz-loading'); btn.textContent = '✨ Sprawdź mój polski';
      var m = self.root.querySelector('.dz-actions .dz-empty'); if (m) m.textContent = 'Kontrol edilemedi: ' + e.message;
    });
  };

  Dziennik.prototype.go = function (k) {
    var self = this;
    if (k > today()) return;
    clearTimeout(this.timer);
    var pending = this.root.querySelector('.dz-ink.saving');
    (pending ? this.save() : Promise.resolve()).then(function () { self.date = k; self.view = 'hatalar'; self.render(false); });
  };

  window.Dziennik = Dziennik;
})();
