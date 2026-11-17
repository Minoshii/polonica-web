/* ═══════════════════════════════════════════════════════════════
   POLONICA · SINAV MOTORU
   Tek motor, iki yer: Polonica içindeki "Sınav" paneli ve
   herkese açık /sinav.html?d=<id> sayfası.
   İçerik: /sinav/index.json (ders listesi) + /sinav/<id>.json
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CSS = [
    '.sv{--sv-bg:var(--bg,#0c0c0c);--sv-s1:var(--surface,#111);--sv-s2:var(--surface2,#161616);--sv-s3:var(--surface3,#1c1c1c);--sv-b:var(--border,#222);--sv-b2:var(--border2,#2a2a2a);--sv-ac:var(--accent,#c8b89a);--sv-acd:var(--accent-dim,#6b5d48);--sv-acbg:var(--accent-bg,#1a160e);--sv-t:var(--text,#e8e6e1);--sv-t2:var(--text2,#888);--sv-t3:var(--text3,#555);--sv-g:var(--green,#4a9a6a);--sv-gbg:var(--green-bg,#0d2017);--sv-r:var(--red,#c05050);--sv-rbg:var(--red-bg,#200d0d);color:var(--sv-t);font-family:"Syne",system-ui,sans-serif;max-width:980px;width:100%}',
    '.sv *{box-sizing:border-box}',
    '.sv-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}',
    '.sv-back{background:none;border:1px solid var(--sv-b2);color:var(--sv-t2);border-radius:8px;padding:6px 11px;cursor:pointer;font:inherit;font-size:12px}',
    '.sv-back:hover{color:var(--sv-t);border-color:var(--sv-acd)}',
    '.sv-h1{font-size:22px;font-weight:800;letter-spacing:-.4px;margin:0}',
    '.sv-sub{font-size:13px;color:var(--sv-t2);margin:2px 0 16px}',
    '.sv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}',
    '.sv-card{background:var(--sv-s2);border:1px solid var(--sv-b);border-radius:12px;padding:16px;cursor:pointer;transition:border-color .15s,transform .15s;position:relative}',
    '.sv-card:hover{border-color:var(--sv-acd);transform:translateY(-2px)}',
    '.sv-card-emoji{font-size:26px}',
    '.sv-card-title{font-weight:800;font-size:15px;margin:8px 0 2px}',
    '.sv-card-meta{font-size:11.5px;color:var(--sv-t2)}',
    '.sv-bar{height:5px;background:var(--sv-s3);border-radius:99px;margin-top:12px;overflow:hidden}',
    '.sv-bar>i{display:block;height:100%;background:var(--sv-ac);border-radius:99px}',
    '.sv-pill{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--sv-acbg);color:var(--sv-ac);border:1px solid var(--sv-acd)}',
    '.sv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}',
    '.sv-tab{background:var(--sv-s2);border:1px solid var(--sv-b);color:var(--sv-t2);border-radius:99px;padding:7px 14px;cursor:pointer;font:inherit;font-size:12.5px;font-weight:700}',
    '.sv-tab.on{background:var(--sv-acbg);border-color:var(--sv-acd);color:var(--sv-ac)}',
    '.sv-tab .n{opacity:.6;font-weight:600;margin-left:4px}',
    '.sv-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}',
    '.sv-chip{background:none;border:1px solid var(--sv-b2);color:var(--sv-t2);border-radius:7px;padding:4px 10px;cursor:pointer;font:inherit;font-size:11.5px}',
    '.sv-chip.on{border-color:var(--sv-ac);color:var(--sv-ac)}',
    '.sv-period{background:var(--sv-s2);border:1px solid var(--sv-b);border-radius:12px;padding:16px 18px;margin-bottom:12px}',
    '.sv-period h3{margin:0 0 2px;font-size:16px;font-weight:800}',
    '.sv-years{font-size:11.5px;color:var(--sv-ac);font-family:"DM Mono",monospace}',
    '.sv-flow{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:10px;margin-top:12px}',
    '@media(max-width:700px){.sv-flow{grid-template-columns:1fr}}',
    '.sv-flow>div{background:var(--sv-s1);border:1px solid var(--sv-b);border-radius:9px;padding:10px 12px;font-size:13px;line-height:1.5}',
    '.sv-flow b.l{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;color:var(--sv-t3)}',
    '.sv-flow ul{margin:0;padding-left:16px}.sv-flow li{margin-bottom:3px}',
    '.sv-tterms{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}',
    '.sv-tterm{font-size:11px;border:1px dashed var(--sv-b2);border-radius:6px;padding:2px 7px;color:var(--sv-t2);cursor:pointer}',
    '.sv-tterm:hover{color:var(--sv-ac);border-color:var(--sv-acd)}',
    '.sv-qwrap{display:grid;grid-template-columns:1fr 250px;gap:14px;align-items:start}',
    '@media(max-width:760px){.sv-qwrap{grid-template-columns:1fr}}',
    '.sv-q{background:var(--sv-s2);border:1px solid var(--sv-b);border-radius:12px;padding:18px}',
    '.sv-qhead{display:flex;justify-content:space-between;font-size:11.5px;color:var(--sv-t3);margin-bottom:10px}',
    '.sv-qtext{font-size:16.5px;font-weight:700;line-height:1.45;margin-bottom:14px}',
    '.sv-opt{display:block;width:100%;text-align:left;background:var(--sv-s1);border:1px solid var(--sv-b2);color:var(--sv-t);border-radius:9px;padding:11px 13px;margin-bottom:8px;cursor:pointer;font:inherit;font-size:14px;line-height:1.4;transition:border-color .12s}',
    '.sv-opt:hover:not(:disabled){border-color:var(--sv-acd)}',
    '.sv-opt:disabled{cursor:default}',
    '.sv-opt.ok{border-color:var(--sv-g);background:var(--sv-gbg)}',
    '.sv-opt.bad{border-color:var(--sv-r);background:var(--sv-rbg)}',
    '.sv-why{margin-top:6px;font-size:13px;line-height:1.55;color:var(--sv-t2);background:var(--sv-s1);border-left:3px solid var(--sv-acd);border-radius:6px;padding:9px 12px}',
    '.sv-nav{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:12px}',
    '.sv-btn{background:var(--sv-s2);border:1px solid var(--sv-b2);color:var(--sv-t);border-radius:8px;padding:8px 15px;cursor:pointer;font:inherit;font-size:13px;font-weight:700}',
    '.sv-btn:hover{border-color:var(--sv-acd)}',
    '.sv-btn.pri{border-color:var(--sv-acd);color:var(--sv-ac);background:var(--sv-acbg)}',
    '.sv-score{font-family:"DM Mono",monospace;font-size:12.5px;color:var(--sv-t2)}',
    '.sv-side{display:flex;flex-direction:column;gap:8px}',
    '.sv-side-t{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--sv-t3);font-weight:800}',
    '.sv-rem{background:var(--sv-s2);border:1px solid var(--sv-b);border-radius:9px;padding:9px 11px;font-size:12px;line-height:1.45}',
    '.sv-rem b{display:block;font-size:12.5px;color:var(--sv-ac);margin-bottom:2px}',
    '.sv-done{text-align:center;padding:30px 16px}',
    '.sv-done .big{font-size:40px;font-weight:800;color:var(--sv-ac)}',
    '.sv-flash{perspective:1000px;max-width:520px;margin:0 auto}',
    '.sv-flash-in{position:relative;height:250px;transition:transform .45s;transform-style:preserve-3d;cursor:pointer}',
    '.sv-flash-in.flip{transform:rotateY(180deg)}',
    '.sv-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--sv-s2);border:1px solid var(--sv-b2);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px;text-align:center}',
    '.sv-face.back{transform:rotateY(180deg)}',
    '.sv-face .tt{font-size:22px;font-weight:800}',
    '.sv-face .hint{font-size:11px;color:var(--sv-t3);margin-top:12px}',
    '.sv-face .ds{font-size:14px;line-height:1.55}',
    '.sv-face .ds small{display:block;color:var(--sv-t2);margin-top:8px;font-size:12px}',
    '.sv-search{width:100%;background:var(--sv-s2);border:1px solid var(--sv-b);color:var(--sv-t);border-radius:8px;padding:9px 12px;font:inherit;font-size:13px;margin-bottom:12px}',
    '.sv-term{background:var(--sv-s2);border:1px solid var(--sv-b);border-radius:10px;padding:11px 14px;margin-bottom:7px}',
    '.sv-term b{font-size:14px}.sv-term .s{font-size:12.5px;color:var(--sv-ac);margin-left:6px}',
    '.sv-term p{margin:5px 0 0;font-size:12.5px;line-height:1.5;color:var(--sv-t2)}',
    '.sv-actions{display:flex;gap:8px;flex-wrap:wrap;margin:-4px 0 16px}',
    '.sv-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--sv-s3);border:1px solid var(--sv-acd);color:var(--sv-t);padding:9px 16px;border-radius:9px;font-size:13px;z-index:9999}',
    '.sv-empty{color:var(--sv-t3);font-size:13px;padding:20px 0}',
    '.sv-books a{color:var(--sv-ac)}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('sv-css')) return;
    var s = document.createElement('style'); s.id = 'sv-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function daysUntil(d) { if (!d) return null; var t = new Date(d + 'T00:00:00'); var n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((t - n) / 864e5); }
  function toast(msg) { var t = document.createElement('div'); t.className = 'sv-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }

  /* Sınav JSON'unu normalize et: soru id'leri, terim haritası */
  function prepare(exam) {
    exam.periods = exam.periods || [];
    exam.terms = exam.terms || [];
    exam.quick = exam.quick || [];
    exam.yorum = exam.yorum || [];
    exam._terms = {};
    exam.terms.forEach(function (t) { exam._terms[t.id] = t; });
    exam.quick.forEach(function (q, i) { q.id = q.id || 'k' + i; });
    exam.yorum.forEach(function (q, i) { q.id = q.id || 'y' + i; });
    exam._period = {};
    exam.periods.forEach(function (p) { exam._period[p.id] = p; });
    return exam;
  }

  /* ─────────────────────────────────────────────────────────
     İLERLEME
     opts.store: {load(examId) -> Promise<obj>, save(examId,obj) -> Promise}
     Varsayılan: localStorage
     ───────────────────────────────────────────────────────── */
  var localStore = {
    load: function (id) { try { return Promise.resolve(JSON.parse(localStorage.getItem('sv_prog_' + id) || '{}')); } catch (e) { return Promise.resolve({}); } },
    save: function (id, d) { try { localStorage.setItem('sv_prog_' + id, JSON.stringify(d)); } catch (e) {} return Promise.resolve(); }
  };

  function SinavApp(root, opts) {
    this.root = root;
    this.o = opts || {};
    this.base = this.o.baseUrl || '/sinav/';
    this.store = this.o.store || localStore;
    this.exam = null;
    this.prog = {};
    injectCss();
    root.classList.add('sv');
  }

  SinavApp.prototype.fetchJson = function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url + ' yüklenemedi'); return r.json(); });
  };

  /* ── DERS LİSTESİ ─────────────────────────────────────── */
  SinavApp.prototype.showList = function () {
    var self = this;
    this.root.innerHTML = '<div class="sv-empty">Yükleniyor…</div>';
    this.fetchJson(this.base + 'index.json').then(function (list) {
      return Promise.all(list.map(function (e) { return self.store.load(e.id).then(function (p) { e._prog = p || {}; return e; }); }));
    }).then(function (list) {
      var h = '<h2 class="sv-h1">📝 Sınav</h2><div class="sv-sub">Dönem içi sınavlar tek yerde. Bir ders seç.</div><div class="sv-grid">';
      list.forEach(function (e) {
        var d = daysUntil(e.examDate);
        var pct = e._prog.total ? Math.round(100 * (e._prog.mastered || 0) / e._prog.total) : 0;
        h += '<div class="sv-card" data-id="' + esc(e.id) + '">' +
          '<div class="sv-card-emoji">' + esc(e.emoji || '📘') + '</div>' +
          '<div class="sv-card-title">' + esc(e.title) + '</div>' +
          '<div class="sv-card-meta">' + esc(e.teacher || '') + (e.scope ? ' · ' + esc(e.scope) : '') + '</div>' +
          (d != null && d >= 0 ? '<div style="margin-top:8px"><span class="sv-pill">' + (d === 0 ? 'Bugün!' : d + ' gün kaldı') + '</span></div>' : '') +
          '<div class="sv-bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="sv-card-meta" style="margin-top:5px">' + (e._prog.total ? pct + '% öğrenildi' : 'Henüz başlamadın') + '</div>' +
          '</div>';
      });
      h += '</div>';
      self.root.innerHTML = h;
      self.root.querySelectorAll('.sv-card').forEach(function (c) {
        c.onclick = function () { self.open(c.getAttribute('data-id')); };
      });
    }).catch(function (e) { self.root.innerHTML = '<div class="sv-empty">Ders listesi yüklenemedi: ' + esc(e.message) + '</div>'; });
  };

  /* ── DERS AÇ ──────────────────────────────────────────── */
  SinavApp.prototype.open = function (id, tab) {
    var self = this;
    var p = this.o.data ? Promise.resolve(JSON.parse(JSON.stringify(this.o.data))) : this.fetchJson(this.base + encodeURIComponent(id) + '.json');
    this.root.innerHTML = '<div class="sv-empty">Yükleniyor…</div>';
    return p.then(function (exam) {
      self.exam = prepare(exam);
      return self.store.load(exam.id);
    }).then(function (prog) {
      self.prog = prog || {};
      self.prog.q = self.prog.q || {};
      self.renderExam(tab || 'ozet');
    }).catch(function (e) { self.root.innerHTML = '<div class="sv-empty">Sınav yüklenemedi: ' + esc(e.message) + '</div>'; });
  };

  SinavApp.prototype.saveProg = function () {
    var e = this.exam, q = this.prog.q, all = e.quick.concat(e.yorum), m = 0;
    all.forEach(function (x) { var s = q[x.id]; if (s && s.last === 1) m++; });
    this.prog.total = all.length; this.prog.mastered = m; this.prog.updatedAt = new Date().toISOString();
    this.store.save(e.id, this.prog);
  };

  SinavApp.prototype.renderExam = function (tab) {
    var self = this, e = this.exam;
    this.tab = tab;
    var wrongCount = e.quick.concat(e.yorum).filter(function (q) { var s = self.prog.q[q.id]; return s && s.last === 0; }).length;
    var tabs = [
      ['ozet', '🗂 Özet', e.periods.length],
      ['kisa', '⚡ Kısa Sorular', e.quick.length],
      ['yorum', '🧠 Yorum', e.yorum.length],
      ['yanlis', '🔁 Yanlışlarım', wrongCount],
      ['kart', '🃏 Kartlar', e.terms.length],
      ['terim', '📚 Terimler', e.terms.length]
    ];
    if (e.books && e.books.length) tabs.push(['kitap', '📖 Kaynaklar', e.books.length]);
    var d = daysUntil(e.examDate);
    var h = '<div class="sv-top">' + (this.o.standalone ? '' : '<button class="sv-back" data-act="list">← Dersler</button>') +
      '<h2 class="sv-h1">' + esc(e.emoji || '') + ' ' + esc(e.title) + '</h2>' +
      (d != null && d >= 0 ? '<span class="sv-pill">' + (d === 0 ? 'Sınav bugün' : d + ' gün kaldı') + '</span>' : '') + '</div>' +
      '<div class="sv-sub">' + esc([e.teacher, e.scope].filter(Boolean).join(' · ')) + (e.note ? '<br>' + esc(e.note) : '') + '</div>';
    if (!this.o.standalone) {
      h += '<div class="sv-actions"><button class="sv-btn" data-act="share">🔗 Linki kopyala</button><button class="sv-btn" data-act="export">⬇ Tek HTML indir</button></div>';
    }
    h += '<div class="sv-tabs">' + tabs.map(function (t) {
      return '<button class="sv-tab' + (t[0] === tab ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '<span class="n">' + t[2] + '</span></button>';
    }).join('') + '</div><div class="sv-body"></div>';
    this.root.innerHTML = h;
    this.body = this.root.querySelector('.sv-body');
    this.root.querySelectorAll('.sv-tab').forEach(function (b) { b.onclick = function () { self.renderExam(b.getAttribute('data-tab')); }; });
    var back = this.root.querySelector('[data-act=list]'); if (back) back.onclick = function () { self.showList(); };
    var sh = this.root.querySelector('[data-act=share]'); if (sh) sh.onclick = function () { self.copyLink(); };
    var ex = this.root.querySelector('[data-act=export]'); if (ex) ex.onclick = function () { self.exportHtml(); };

    if (tab === 'ozet') this.renderOzet();
    else if (tab === 'kisa') this.startQuiz(e.quick, 'kisa');
    else if (tab === 'yorum') this.startQuiz(e.yorum, 'yorum');
    else if (tab === 'yanlis') this.startQuiz(e.quick.concat(e.yorum).filter(function (q) { var s = self.prog.q[q.id]; return s && s.last === 0; }), 'yanlis');
    else if (tab === 'kart') this.renderFlash();
    else if (tab === 'terim') this.renderTerms();
    else if (tab === 'kitap') this.renderBooks();
  };

  /* ── ÖZET: dönem başına neden → ne oldu → sonuç ────────── */
  SinavApp.prototype.renderOzet = function () {
    var self = this, e = this.exam;
    var h = e.periods.map(function (p) {
      var ev = (p.events || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      var tt = (p.terms || []).map(function (id) { var t = e._terms[id]; return t ? '<span class="sv-tterm" data-term="' + esc(id) + '">' + esc(t.term) + '</span>' : ''; }).join('');
      var nq = e.quick.filter(function (q) { return q.period === p.id; }).length;
      return '<div class="sv-period"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><h3>' + esc(p.title) + '</h3><div class="sv-years">' + esc(p.years || '') + '</div></div>' +
        (nq ? '<button class="sv-btn pri" data-quiz="' + esc(p.id) + '" style="white-space:nowrap">⚡ ' + nq + ' soru</button>' : '') + '</div>' +
        '<div class="sv-flow"><div><b class="l">Neden</b>' + esc(p.cause || '') + '</div><div><b class="l">Ne oldu</b><ul>' + ev + '</ul></div><div><b class="l">Sonuç</b>' + esc(p.result || '') + '</div></div>' +
        (tt ? '<div class="sv-tterms">' + tt + '</div>' : '') + '</div>';
    }).join('');
    this.body.innerHTML = h || '<div class="sv-empty">Bu derste özet yok.</div>';
    this.body.querySelectorAll('[data-quiz]').forEach(function (b) {
      b.onclick = function () {
        self.renderExam('kisa');
        self.startQuiz(e.quick, 'kisa', b.getAttribute('data-quiz'));
      };
    });
    this.body.querySelectorAll('[data-term]').forEach(function (b) {
      b.onclick = function () { var t = e._terms[b.getAttribute('data-term')]; if (t) toast(t.term + ' — ' + t.short); };
    });
  };

  /* ── QUIZ ─────────────────────────────────────────────── */
  SinavApp.prototype.startQuiz = function (pool, kind, periodFilter) {
    var self = this, e = this.exam;
    this.qs = { kind: kind, pool: pool, filter: periodFilter || 'all' };
    var periodsInPool = e.periods.filter(function (p) { return pool.some(function (q) { return q.period === p.id; }); });
    var list = this.qs.filter === 'all' ? pool : pool.filter(function (q) { return q.period === self.qs.filter; });
    this.qs.list = shuffle(list).map(function (q) {
      var opts = q.options.map(function (t, i) { return { t: t, ok: i === q.answer }; });
      return { q: q, opts: shuffle(opts) };
    });
    this.qs.i = 0; this.qs.ok = 0; this.qs.n = 0; this.qs.wrong = [];

    var chips = '';
    if (periodsInPool.length > 1) {
      chips = '<div class="sv-chips"><button class="sv-chip' + (this.qs.filter === 'all' ? ' on' : '') + '" data-f="all">Hepsi</button>' +
        periodsInPool.map(function (p) { return '<button class="sv-chip' + (self.qs.filter === p.id ? ' on' : '') + '" data-f="' + esc(p.id) + '">' + esc(p.short || p.title) + '</button>'; }).join('') + '</div>';
    }
    this.body.innerHTML = chips + '<div class="sv-qarea"></div>';
    this.body.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { self.startQuiz(pool, kind, b.getAttribute('data-f')); }; });
    if (!this.qs.list.length) {
      this.body.querySelector('.sv-qarea').innerHTML = '<div class="sv-empty">' + (kind === 'yanlis' ? 'Yanlış yaptığın soru yok. 👏' : 'Bu bölümde soru yok.') + '</div>';
      return;
    }
    this.renderQ();
  };

  SinavApp.prototype.renderQ = function () {
    var self = this, e = this.exam, s = this.qs, area = this.body.querySelector('.sv-qarea');
    if (s.i >= s.list.length) return this.renderDone();
    var item = s.list[s.i], q = item.q, p = e._period[q.period];
    var rem = (q.terms || []).map(function (id) { var t = e._terms[id]; return t ? '<div class="sv-rem"><b>' + esc(t.term) + '</b>' + esc(t.short) + '</div>' : ''; }).join('');
    area.innerHTML = '<div class="sv-qwrap"><div class="sv-q">' +
      '<div class="sv-qhead"><span>' + (p ? esc(p.short || p.title) : '') + '</span><span>' + (s.i + 1) + ' / ' + s.list.length + '</span></div>' +
      '<div class="sv-qtext">' + esc(q.q) + '</div>' +
      item.opts.map(function (o, i) { return '<button class="sv-opt" data-i="' + i + '">' + esc(o.t) + '</button>'; }).join('') +
      '<div class="sv-fb"></div>' +
      '<div class="sv-nav"><span class="sv-score">✔ ' + s.ok + ' / ' + s.n + '</span><button class="sv-btn pri sv-next" style="visibility:hidden">Sonraki →</button></div>' +
      '</div>' + (rem ? '<div class="sv-side"><div class="sv-side-t">Hatırlatma</div>' + rem + '</div>' : '<div></div>') + '</div>';
    area.querySelectorAll('.sv-opt').forEach(function (b) { b.onclick = function () { self.answer(+b.getAttribute('data-i')); }; });
    area.querySelector('.sv-next').onclick = function () { s.i++; self.renderQ(); };
  };

  SinavApp.prototype.answer = function (i) {
    var s = this.qs, item = s.list[s.i], q = item.q, area = this.body.querySelector('.sv-qarea');
    var right = item.opts[i].ok;
    var btns = area.querySelectorAll('.sv-opt');
    btns.forEach(function (b, k) { b.disabled = true; if (item.opts[k].ok) b.classList.add('ok'); });
    if (!right) btns[i].classList.add('bad');
    s.n++; if (right) s.ok++; else s.wrong.push(q);
    var st = this.prog.q[q.id] || { c: 0, w: 0 };
    if (right) st.c++; else st.w++;
    st.last = right ? 1 : 0;
    this.prog.q[q.id] = st;
    this.saveProg();
    if (right && this.o.onXp) { try { this.o.onXp(s.kind === 'yorum' ? 2 : 1); } catch (e) {} }
    area.querySelector('.sv-fb').innerHTML = '<div class="sv-why">' + (right ? '✅ ' : '❌ ') + esc(q.why || '') + '</div>';
    area.querySelector('.sv-score').textContent = '✔ ' + s.ok + ' / ' + s.n;
    var nx = area.querySelector('.sv-next'); nx.style.visibility = 'visible'; nx.focus();
  };

  SinavApp.prototype.renderDone = function () {
    var self = this, s = this.qs, area = this.body.querySelector('.sv-qarea');
    var pct = s.n ? Math.round(100 * s.ok / s.n) : 0;
    area.innerHTML = '<div class="sv-q sv-done"><div class="big">' + s.ok + ' / ' + s.n + '</div><div style="color:var(--sv-t2);margin:6px 0 18px">%' + pct + (pct >= 80 ? ' · çok iyi 🎉' : pct >= 50 ? ' · fena değil' : ' · biraz daha tekrar') + '</div>' +
      (s.wrong.length ? '<button class="sv-btn pri" data-a="wrong">🔁 Yanlış ' + s.wrong.length + ' soruyu tekrar et</button> ' : '') +
      '<button class="sv-btn" data-a="again">Baştan</button></div>';
    var w = area.querySelector('[data-a=wrong]'); if (w) w.onclick = function () { self.startQuiz(s.wrong, s.kind); };
    area.querySelector('[data-a=again]').onclick = function () { self.startQuiz(s.pool, s.kind, s.filter); };
  };

  /* ── FLASHCARD ────────────────────────────────────────── */
  SinavApp.prototype.renderFlash = function () {
    var self = this, terms = shuffle(this.exam.terms), i = 0;
    if (!terms.length) { this.body.innerHTML = '<div class="sv-empty">Kart yok.</div>'; return; }
    function draw() {
      var t = terms[i];
      self.body.innerHTML = '<div class="sv-flash"><div class="sv-flash-in">' +
        '<div class="sv-face"><div class="tt">' + esc(t.term) + '</div><div class="hint">çevirmek için dokun</div></div>' +
        '<div class="sv-face back"><div class="ds"><b style="color:var(--sv-ac)">' + esc(t.short) + '</b>' + (t.detail ? '<small>' + esc(t.detail) + '</small>' : '') + '</div></div>' +
        '</div><div class="sv-nav"><button class="sv-btn" data-a="prev">←</button><span class="sv-score">' + (i + 1) + ' / ' + terms.length + '</span><button class="sv-btn pri" data-a="next">→</button></div></div>';
      var card = self.body.querySelector('.sv-flash-in');
      card.onclick = function () { card.classList.toggle('flip'); };
      self.body.querySelector('[data-a=prev]').onclick = function () { i = (i - 1 + terms.length) % terms.length; draw(); };
      self.body.querySelector('[data-a=next]').onclick = function () { i = (i + 1) % terms.length; draw(); };
    }
    draw();
  };

  /* ── TERİM LİSTESİ ────────────────────────────────────── */
  SinavApp.prototype.renderTerms = function () {
    var e = this.exam, self = this;
    this.body.innerHTML = '<input class="sv-search" placeholder="Terim ara…"><div class="sv-tlist"></div>';
    var inp = this.body.querySelector('.sv-search'), out = this.body.querySelector('.sv-tlist');
    function draw() {
      var f = inp.value.trim().toLocaleLowerCase('tr');
      var list = e.terms.filter(function (t) { return !f || (t.term + ' ' + t.short + ' ' + (t.detail || '')).toLocaleLowerCase('tr').indexOf(f) >= 0; });
      out.innerHTML = list.map(function (t) {
        var p = e._period[t.period];
        return '<div class="sv-term"><b>' + esc(t.term) + '</b><span class="s">' + esc(t.short) + '</span>' + (p ? ' <span class="sv-years" style="margin-left:6px">' + esc(p.short || p.title) + '</span>' : '') + (t.detail ? '<p>' + esc(t.detail) + '</p>' : '') + '</div>';
      }).join('') || '<div class="sv-empty">Bulunamadı.</div>';
    }
    inp.oninput = draw; draw();
  };

  /* ── KAYNAKLAR (kitaplar) ─────────────────────────────── */
  SinavApp.prototype.renderBooks = function () {
    var e = this.exam, self = this;
    this.body.innerHTML = '<div class="sv-books">' + e.books.map(function (b, i) {
      return '<div class="sv-term"><b>' + esc(b.title) + '</b>' + (b.author ? '<span class="s">' + esc(b.author) + '</span>' : '') + (b.note ? '<p>' + esc(b.note) + '</p>' : '') +
        (b.pdfId && self.o.openPdf ? '<p><a href="#" data-pdf="' + esc(b.pdfId) + '">📄 PDF\'i aç</a></p>' : '') + '</div>';
    }).join('') + '</div>';
    this.body.querySelectorAll('[data-pdf]').forEach(function (a) { a.onclick = function (ev) { ev.preventDefault(); self.o.openPdf(a.getAttribute('data-pdf')); }; });
  };

  /* ── PAYLAŞIM ─────────────────────────────────────────── */
  SinavApp.prototype.shareUrl = function () {
    return location.origin + '/sinav.html?d=' + encodeURIComponent(this.exam.id);
  };
  SinavApp.prototype.copyLink = function () {
    var u = this.shareUrl();
    if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast('Link kopyalandı'); }, function () { prompt('Link:', u); });
    else prompt('Link:', u);
  };

  /* Motoru + sınav verisini tek bir HTML dosyasına göm (internet olmadan da çalışır) */
  SinavApp.prototype.exportHtml = function () {
    var self = this, e = this.exam;
    fetch('/sinav.js', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (js) {
      var clean = JSON.parse(JSON.stringify(e, function (k, v) { return k.charAt(0) === '_' ? undefined : v; }));
      delete clean.books;
      var data = JSON.stringify(clean).replace(/</g, '\\u003c');
      var html = '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>' + esc(e.title) + ' · Polonica</title>' +
        '<style>body{margin:0;background:#0c0c0c;color:#e8e6e1;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:22px 14px}</style></head><body>' +
        '<div id="app"></div><script>' + js.replace(/<\/script/gi, '<\\/script') + '<\/script>' +
        '<script>new SinavApp(document.getElementById("app"),{standalone:true,data:' + data + '}).open("' + e.id + '");<\/script>' +
        '<div style="position:fixed;bottom:8px;right:12px;font-size:11px;color:#555">Polonica</div></body></html>';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      a.download = e.id + '.html';
      document.body.appendChild(a); a.click(); a.remove();
      toast('HTML indirildi');
    }).catch(function (err) { toast('İndirilemedi: ' + err.message); });
  };

  window.SinavApp = SinavApp;
})();
