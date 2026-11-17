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
    '.sv-books a{color:var(--sv-ac)}',
    '.sv-term-h{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--sv-t3);margin:22px 0 10px}',
    '.sv-arch{opacity:.65}',
    '.sv-body-txt{font-size:13.5px;line-height:1.6;margin-top:10px;white-space:pre-line}',
    '.sv-tbl{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}',
    '.sv-tbl th,.sv-tbl td{border:1px solid var(--sv-b2);padding:6px 9px;text-align:left}',
    '.sv-tbl th{background:var(--sv-s1);color:var(--sv-ac);font-size:11.5px}',
    '.sv-tl{font-family:"DM Mono",monospace;font-size:.8em;color:var(--sv-t2);margin-left:6px}',
    '.sv-w{background:var(--sv-s2);border:1px solid var(--sv-b);border-radius:12px;padding:16px 18px;margin-bottom:12px}',
    '.sv-w h3{margin:0 0 8px;font-size:15.5px;line-height:1.45}',
    '.sv-wstep{font-size:13px;line-height:1.55;background:var(--sv-s1);border:1px dashed var(--sv-b2);border-radius:8px;padding:9px 12px;margin-bottom:10px;font-style:italic}',
    '.sv-model{font-size:13.5px;line-height:1.65;background:var(--sv-s1);border-left:3px solid var(--sv-g);border-radius:6px;padding:11px 13px;margin-top:10px;white-space:pre-line}',
    '.sv-pts{margin-top:10px}',
    '.sv-pts label{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.45;padding:4px 0;cursor:pointer}',
    '.sv-pts input{margin-top:3px;accent-color:var(--sv-ac)}',
    '.sv-ph{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.sv-ph span{font-size:12px;background:var(--sv-s1);border:1px solid var(--sv-b2);border-radius:7px;padding:4px 8px;cursor:pointer}',
    '.sv-ph span i{font-style:normal;color:var(--sv-t2);display:none;margin-left:5px}',
    '.sv-ph span.open i{display:inline}',
    '.sv-sel{background:var(--sv-s2);border:1px solid var(--sv-b2);color:var(--sv-t);border-radius:8px;padding:7px 10px;font:inherit;font-size:12.5px}'
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

  /* Metinden kısa, kararlı id: parça eklenince sıralama kaysa da ilerleme kaybolmaz */
  function hash(str) { var h = 5381; str = String(str || ''); for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  /* Sınav JSON'unu normalize et: soru id'leri, terim haritası */
  function prepare(exam) {
    exam.periods = exam.periods || [];
    exam.terms = exam.terms || [];
    exam.quick = exam.quick || [];
    exam.yorum = exam.yorum || [];
    exam.vocab = exam.vocab || [];
    exam.written = exam.written || [];
    exam.labels = exam.labels || {};
    exam.vocab.forEach(function (v) { v.id = v.id || 'v' + hash(v.w); });
    exam.written.forEach(function (w) { w.id = w.id || 'w' + hash(w.q); });
    exam._terms = {};
    exam.terms.forEach(function (t) { exam._terms[t.id] = t; });
    exam.quick.forEach(function (q) { q.id = q.id || 'k' + hash(q.q); });
    exam.yorum.forEach(function (q) { q.id = q.id || 'y' + hash(q.q); });
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

  function tableHtml(t) {
    return (t.title ? '<div class="sv-side-t" style="margin-top:14px">' + esc(t.title) + '</div>' : '') +
      '<table class="sv-tbl">' + (t.head ? '<tr>' + t.head.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>' : '') +
      (t.rows || []).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
  }

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
      var h = '<h2 class="sv-h1">📝 Sınav</h2><div class="sv-sub">Bütün vize ve finaller tek yerde. Bir ders seç.</div>';
      var groups = [], byTerm = {};
      list.forEach(function (e) { var t = e.term || 'Diğer'; if (!byTerm[t]) { byTerm[t] = []; groups.push(t); } byTerm[t].push(e); });
      groups.forEach(function (t, gi) {
      h += '<div class="sv-term-h">' + esc(t) + (gi > 0 ? ' · arşiv' : '') + '</div><div class="sv-grid' + (gi > 0 ? ' sv-arch' : '') + '">';
      byTerm[t].forEach(function (e) {
        var d = daysUntil(e.examDate);
        var pct = e._prog.total ? Math.round(100 * (e._prog.mastered || 0) / e._prog.total) : 0;
        h += '<div class="sv-card" data-id="' + esc(e.id) + '">' +
          '<div class="sv-card-emoji">' + esc(e.emoji || '📘') + '</div>' +
          '<div class="sv-card-title">' + esc(e.title) + (e.kind ? ' <span class="sv-pill">' + esc(e.kind) + '</span>' : '') + '</div>' +
          '<div class="sv-card-meta">' + esc(e.teacher || '') + (e.scope ? ' · ' + esc(e.scope) : '') + '</div>' +
          (d != null && d >= 0 ? '<div style="margin-top:8px"><span class="sv-pill">' + (d === 0 ? 'Bugün!' : d + ' gün kaldı') + '</span></div>' : '') +
          '<div class="sv-bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="sv-card-meta" style="margin-top:5px">' + (e._prog.total ? pct + '% öğrenildi' : 'Henüz başlamadın') + '</div>' +
          '</div>';
      });
      h += '</div>';
      });
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
      // Ders birden çok parça dosyadan oluşabilir: "parts": ["rusca-1-sifatlar.json", ...]
      // Yeni konu eklemek = yeni bir parça dosyası + parts'a bir satır.
      if (!exam.parts || !exam.parts.length) return exam;
      return Promise.all(exam.parts.map(function (f) { return self.fetchJson(self.base + f); })).then(function (parts) {
        parts.forEach(function (pt) {
          ['periods', 'terms', 'quick', 'yorum', 'vocab', 'written', 'books'].forEach(function (k) {
            if (pt[k]) exam[k] = (exam[k] || []).concat(pt[k]);
          });
        });
        delete exam.parts;
        return exam;
      });
    }).then(function (exam) {
      self.exam = prepare(exam);
      return self.store.load(exam.id);
    }).then(function (prog) {
      self.prog = prog || {};
      self.prog.q = self.prog.q || {};
      self.prog.w = self.prog.w || {};
      self.prog.pdfs = self.prog.pdfs || [];
      self.renderExam(tab || 'ozet');
    }).catch(function (e) { self.root.innerHTML = '<div class="sv-empty">Sınav yüklenemedi: ' + esc(e.message) + '</div>'; });
  };

  SinavApp.prototype.saveProg = function () {
    var e = this.exam, q = this.prog.q, all = e.quick.concat(e.yorum, e.vocab), m = 0;
    all.forEach(function (x) { var s = q[x.id]; if (s && s.last === 1) m++; });
    this.prog.total = all.length; this.prog.mastered = m; this.prog.updatedAt = new Date().toISOString();
    this.store.save(e.id, this.prog);
  };

  SinavApp.prototype.renderExam = function (tab) {
    var self = this, e = this.exam;
    this.tab = tab;
    var wrongCount = e.quick.concat(e.yorum).filter(function (q) { var s = self.prog.q[q.id]; return s && s.last === 0; }).length;
    var L = e.labels;
    var tabs = [];
    if (e.periods.length) tabs.push(['ozet', L.ozet || '🗂 Özet', e.periods.length]);
    if (e.quick.length) tabs.push(['kisa', L.kisa || '⚡ Kısa Sorular', e.quick.length]);
    if (e.vocab.length) tabs.push(['kelime', L.kelime || '🔤 Kelime', e.vocab.length]);
    if (e.yorum.length) tabs.push(['yorum', L.yorum || '🧠 Yorum', e.yorum.length]);
    if (e.written.length) tabs.push(['yazili', L.yazili || '✍️ Yazılı Cevap', e.written.length]);
    if (e.quick.length || e.yorum.length) tabs.push(['yanlis', '🔁 Yanlışlarım', wrongCount]);
    if (e.terms.length || e.vocab.length) tabs.push(['kart', '🃏 Kartlar', e.terms.length + e.vocab.length]);
    if (e.terms.length) tabs.push(['terim', L.terim || '📚 Terimler', e.terms.length]);
    var books = (e.books || []).length + (this.o.pdfs ? this.prog.pdfs.length : 0);
    if (books || this.o.pdfs) tabs.push(['kitap', '📖 Kaynaklar', books]);
    if (!tabs.some(function (t) { return t[0] === tab; })) tab = tabs.length ? tabs[0][0] : 'ozet';
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
    else if (tab === 'kelime') this.renderVocab();
    else if (tab === 'yazili') this.renderWritten();
  };

  /* ── ÖZET: dönem başına neden → ne oldu → sonuç ────────── */
  SinavApp.prototype.renderOzet = function () {
    var self = this, e = this.exam, L = e.labels;
    var h = e.periods.map(function (p) {
      var ev = (p.events || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      var tt = (p.terms || []).map(function (id) { var t = e._terms[id]; return t ? '<span class="sv-tterm" data-term="' + esc(id) + '">' + esc(t.term) + '</span>' : ''; }).join('');
      var nq = e.quick.filter(function (q) { return q.period === p.id; }).length;
      return '<div class="sv-period"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><h3>' + esc(p.title) + '</h3><div class="sv-years">' + esc(p.years || '') + '</div></div>' +
        (nq ? '<button class="sv-btn pri" data-quiz="' + esc(p.id) + '" style="white-space:nowrap">⚡ ' + nq + ' soru</button>' : '') + '</div>' +
        (p.cause || p.result || ev ? '<div class="sv-flow"><div><b class="l">' + esc(L.cause || 'Neden') + '</b>' + esc(p.cause || '') + '</div><div><b class="l">' + esc(L.events || 'Ne oldu') + '</b><ul>' + ev + '</ul></div><div><b class="l">' + esc(L.result || 'Sonuç') + '</b>' + esc(p.result || '') + '</div></div>' : '') +
        (p.body ? '<div class="sv-body-txt">' + esc(p.body) + '</div>' : '') +
        (p.table ? tableHtml(p.table) : '') + (p.tables ? p.tables.map(tableHtml).join('') : '') +
        (tt ? '<div class="sv-tterms">' + tt + '</div>' : '') + '</div>';
    }).join('');
    this.body.innerHTML = h || '<div class="sv-empty">Bu derse henüz içerik eklenmedi.</div>';
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
    var self = this, i = 0;
    var terms = shuffle(this.exam.terms.concat(this.exam.vocab.map(function (v) {
      return { term: v.w + (v.tl ? ' (' + v.tl + ')' : ''), short: v.tr, detail: v.note };
    })));
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
    if (this.o.pdfs) {
      this.body.innerHTML = '<div class="sv-empty">Yükleniyor…</div>';
      this.o.pdfs().then(function (all) {
        var linked = all.filter(function (p) { return self.prog.pdfs.indexOf(p.id) >= 0; });
        var free = all.filter(function (p) { return self.prog.pdfs.indexOf(p.id) < 0; });
        var empty = !(e.periods.length || e.quick.length || e.yorum.length || e.vocab.length || e.written.length || e.terms.length);
        var h = (empty ? '<div class="sv-empty" style="padding-top:0">Bu derse henüz içerik eklenmedi. Konular geldikçe burada açılacak.</div>' : '') + (e.books || []).map(function (b) {
          return '<div class="sv-term"><b>' + esc(b.title) + '</b>' + (b.author ? '<span class="s">' + esc(b.author) + '</span>' : '') + (b.note ? '<p>' + esc(b.note) + '</p>' : '') + '</div>';
        }).join('');
        h += '<div class="sv-side-t" style="margin:16px 0 8px">Bu derse bağlı PDF\'ler</div>';
        h += linked.map(function (p) {
          return '<div class="sv-term" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>📄 ' + esc(p.name) + '</b><span><button class="sv-btn pri" data-open="' + esc(p.id) + '">Aç</button> <button class="sv-btn" data-un="' + esc(p.id) + '">Kaldır</button></span></div>';
        }).join('') || '<div class="sv-empty" style="padding:4px 0 10px">Henüz PDF bağlanmadı.</div>';
        h += free.length ? '<div style="display:flex;gap:8px;margin-top:8px"><select class="sv-sel">' + free.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>'; }).join('') + '</select><button class="sv-btn" data-link="1">+ Bağla</button></div>' : '';
        h += '<div class="sv-card-meta" style="margin-top:10px">Yeni kitap eklemek için önce PDF Kütüphanesi\'ne yükle, sonra buradan bağla.</div>';
        self.body.innerHTML = h;
        self.body.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { self.o.openPdf(b.getAttribute('data-open')); }; });
        self.body.querySelectorAll('[data-un]').forEach(function (b) { b.onclick = function () { self.prog.pdfs = self.prog.pdfs.filter(function (x) { return x !== b.getAttribute('data-un'); }); self.saveProg(); self.renderBooks(); }; });
        var lk = self.body.querySelector('[data-link]'); if (lk) lk.onclick = function () { self.prog.pdfs.push(self.body.querySelector('.sv-sel').value); self.saveProg(); self.renderBooks(); };
      });
      return;
    }
    this.body.innerHTML = '<div class="sv-books">' + (e.books || []).map(function (b, i) {
      return '<div class="sv-term"><b>' + esc(b.title) + '</b>' + (b.author ? '<span class="s">' + esc(b.author) + '</span>' : '') + (b.note ? '<p>' + esc(b.note) + '</p>' : '') +
        (b.pdfId && self.o.openPdf ? '<p><a href="#" data-pdf="' + esc(b.pdfId) + '">📄 PDF\'i aç</a></p>' : '') + '</div>';
    }).join('') + '</div>';
    this.body.querySelectorAll('[data-pdf]').forEach(function (a) { a.onclick = function (ev) { ev.preventDefault(); self.o.openPdf(a.getAttribute('data-pdf')); }; });
  };

  /* ── KELİME: sadece "bu ne demek?" testi + liste ─────────── */
  SinavApp.prototype.renderVocab = function (mode, group) {
    var self = this, e = this.exam;
    mode = mode || 'test'; group = group || 'all';
    var groups = []; e.vocab.forEach(function (v) { if (v.group && groups.indexOf(v.group) < 0) groups.push(v.group); });
    var pool = group === 'all' ? e.vocab : e.vocab.filter(function (v) { return v.group === group; });
    var h = '<div class="sv-chips"><button class="sv-chip' + (mode === 'test' ? ' on' : '') + '" data-m="test">Test</button><button class="sv-chip' + (mode === 'liste' ? ' on' : '') + '" data-m="liste">Liste</button>' +
      (groups.length > 1 ? '<span style="width:12px"></span><button class="sv-chip' + (group === 'all' ? ' on' : '') + '" data-g="all">Hepsi</button>' + groups.map(function (g) { return '<button class="sv-chip' + (group === g ? ' on' : '') + '" data-g="' + esc(g) + '">' + esc(g) + '</button>'; }).join('') : '') +
      '</div><div class="sv-vb"></div>';
    this.body.innerHTML = h;
    this.body.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { self.renderVocab(b.getAttribute('data-m'), group); }; });
    this.body.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { self.renderVocab(mode, b.getAttribute('data-g')); }; });
    var out = this.body.querySelector('.sv-vb');
    if (mode === 'liste') {
      out.innerHTML = pool.map(function (v) {
        return '<div class="sv-term"><b>' + esc(v.w) + '</b>' + (v.tl ? '<span class="sv-tl">' + esc(v.tl) + '</span>' : '') + '<span class="s">' + esc(v.tr) + '</span>' + (v.note ? '<p>' + esc(v.note) + '</p>' : '') + '</div>';
      }).join('');
      return;
    }
    // Test: kelime → 3 anlam (yanlış şıklar aynı gruptan)
    var qs = shuffle(pool).map(function (v) {
      var same = e.vocab.filter(function (x) { return x !== v && x.tr !== v.tr && (!v.group || x.group === v.group); });
      if (same.length < 2) same = e.vocab.filter(function (x) { return x !== v && x.tr !== v.tr; });
      var opts = shuffle(same).slice(0, 2).map(function (x) { return { t: x.tr, ok: false }; }).concat([{ t: v.tr, ok: true }]);
      return { q: { id: v.id, q: v.w + (v.tl ? '  ·  ' + v.tl : ''), why: v.w + ' = ' + v.tr + (v.note ? ' — ' + v.note : '') }, opts: shuffle(opts) };
    });
    this.body.querySelector('.sv-vb').className = 'sv-qarea';
    this.qs = { kind: 'kelime', pool: pool, filter: group, list: qs, i: 0, ok: 0, n: 0, wrong: [] };
    var origDone = this.renderDone;
    this.renderDone = function () {
      var s = self.qs, area = self.body.querySelector('.sv-qarea');
      area.innerHTML = '<div class="sv-q sv-done"><div class="big">' + s.ok + ' / ' + s.n + '</div><br><button class="sv-btn pri">Yeniden</button></div>';
      area.querySelector('button').onclick = function () { self.renderVocab('test', group); };
      self.renderDone = origDone;
    };
    if (!qs.length) { this.body.querySelector('.sv-qarea').innerHTML = '<div class="sv-empty">Kelime yok.</div>'; return; }
    this.renderQ();
  };

  /* ── YAZILI CEVAP / KOMPOZİSYON / KONUŞMA ──────────────── */
  SinavApp.prototype.renderWritten = function () {
    var self = this, e = this.exam;
    this.body.innerHTML = e.written.map(function (w) {
      var done = self.prog.w[w.id] || [];
      return '<div class="sv-w" data-w="' + esc(w.id) + '">' +
        (w.tag ? '<div class="sv-years" style="margin-bottom:4px">' + esc(w.tag) + '</div>' : '') +
        '<h3>' + esc(w.q) + '</h3>' +
        (w.wstep ? '<div class="sv-wstep">' + esc(w.wstep) + '</div>' : '') +
        (w.points && w.points.length ? '<div class="sv-side-t">Cevabında olmalı</div><div class="sv-pts">' + w.points.map(function (pt, i) {
          return '<label><input type="checkbox" data-i="' + i + '"' + (done[i] ? ' checked' : '') + '><span>' + esc(pt) + '</span></label>';
        }).join('') + '</div>' : '') +
        (w.phrases && w.phrases.length ? '<div class="sv-side-t" style="margin-top:10px">Kullanılacak kalıplar (dokun → anlam)</div><div class="sv-ph">' + w.phrases.map(function (ph) {
          return '<span>' + esc(ph.pl || ph.w) + '<i>' + esc(ph.tr) + '</i></span>';
        }).join('') + '</div>' : '') +
        (w.answer ? '<div style="margin-top:12px"><button class="sv-btn pri" data-a="show">Örnek cevabı göster</button></div><div class="sv-model" style="display:none">' + esc(w.answer) + '</div>' : '') +
        '</div>';
    }).join('');
    this.body.querySelectorAll('.sv-w').forEach(function (box) {
      var id = box.getAttribute('data-w');
      box.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
        cb.onchange = function () {
          var arr = self.prog.w[id] || []; arr[+cb.getAttribute('data-i')] = cb.checked; self.prog.w[id] = arr; self.saveProg();
        };
      });
      box.querySelectorAll('.sv-ph span').forEach(function (sp) { sp.onclick = function () { sp.classList.toggle('open'); }; });
      var b = box.querySelector('[data-a=show]');
      if (b) b.onclick = function () { var m = box.querySelector('.sv-model'); var on = m.style.display === 'none'; m.style.display = on ? 'block' : 'none'; b.textContent = on ? 'Örnek cevabı gizle' : 'Örnek cevabı göster'; };
    });
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
