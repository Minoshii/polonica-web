/* ═══════════════════════════════════════════════════════════════
   POLONICA · SINAV HUB'I
   Dersler ve derslere yüklenen HTML/PDF dosyaları.
   İçerik koda gömülmez: dosyalar siteden yüklenir, kaldırılır.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KINDS = [
    ['konu', '📖 Konu Anlatımı'],
    ['test', '⚡ Test / Quiz'],
    ['kaynak', '📚 Kaynak / Kitap'],
    ['diger', '📎 Diğer']
  ];
  function kindLabel(k) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0] === k) return KINDS[i][1]; return '📎 Diğer'; }

  var CSS = [
    '.sh{color:var(--text,#e8e6e1);font-family:"Syne",system-ui,sans-serif;width:100%;max-width:1040px}',
    '.sh *{box-sizing:border-box}',
    '.sh-h1{font-size:22px;font-weight:800;letter-spacing:-.4px;margin:0}',
    '.sh-sub{font-size:13px;color:var(--text2,#888);margin:3px 0 16px}',
    '.sh-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.sh-sp{flex:1}',
    '.sh-term{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text3,#555);margin:20px 0 10px}',
    '.sh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}',
    '.sh-card{background:var(--surface2,#161616);border:1px solid var(--border,#222);border-radius:12px;padding:15px;cursor:pointer;transition:border-color .15s,transform .15s}',
    '.sh-card:hover{border-color:var(--accent-dim,#6b5d48);transform:translateY(-2px)}',
    '.sh-card.add{display:flex;align-items:center;justify-content:center;border-style:dashed;color:var(--text2,#888);font-weight:700;min-height:120px}',
    '.sh-emoji{font-size:26px}',
    '.sh-title{font-weight:800;font-size:15px;margin:7px 0 2px}',
    '.sh-meta{font-size:11.5px;color:var(--text2,#888)}',
    '.sh-pill{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--accent-bg,#1a160e);color:var(--accent,#c8b89a);border:1px solid var(--accent-dim,#6b5d48);margin-top:8px}',
    '.sh-btn{background:var(--surface2,#161616);border:1px solid var(--border2,#2a2a2a);color:var(--text,#e8e6e1);border-radius:8px;padding:7px 13px;cursor:pointer;font:inherit;font-size:12.5px;font-weight:700;white-space:nowrap}',
    '.sh-btn:hover{border-color:var(--accent-dim,#6b5d48)}',
    '.sh-btn.pri{border-color:var(--accent-dim,#6b5d48);color:var(--accent,#c8b89a);background:var(--accent-bg,#1a160e)}',
    '.sh-btn.red{color:#e07070}',
    '.sh-btn.sm{padding:5px 9px;font-size:12px}',
    '.sh-drop{border:1.5px dashed var(--border2,#2a2a2a);border-radius:12px;padding:18px;text-align:center;color:var(--text2,#888);font-size:13px;margin:14px 0 6px;transition:border-color .15s,background .15s}',
    '.sh-drop.over{border-color:var(--accent,#c8b89a);background:var(--accent-bg,#1a160e)}',
    '.sh-drop .sh-btn{margin-top:8px}',
    '.sh-sec{font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--text2,#888);margin:20px 0 8px}',
    '.sh-file{display:flex;align-items:center;gap:10px;background:var(--surface2,#161616);border:1px solid var(--border,#222);border-radius:10px;padding:10px 12px;margin-bottom:7px}',
    '.sh-file:hover{border-color:var(--border2,#2a2a2a)}',
    '.sh-fname{flex:1;min-width:0;cursor:pointer}',
    '.sh-fname b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sh-fname:hover b{color:var(--accent,#c8b89a)}',
    '.sh-acts{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}',
    '.sh-sel,.sh-in{background:var(--surface2,#161616);border:1px solid var(--border2,#2a2a2a);color:var(--text,#e8e6e1);border-radius:7px;padding:6px 8px;font:inherit;font-size:12.5px}',
    '.sh .sh-sel{width:auto;margin-bottom:0}',
    '.sh-in{width:100%;margin-bottom:8px;padding:9px 11px}',
    '.sh-form{background:var(--surface2,#161616);border:1px solid var(--border,#222);border-radius:12px;padding:16px;margin:14px 0;max-width:520px}',
    '.sh-form label{font-size:11px;color:var(--text3,#555);font-weight:700;text-transform:uppercase;letter-spacing:.06em}',
    '.sh-row{display:grid;grid-template-columns:80px 1fr;gap:8px}',
    '.sh-empty{color:var(--text3,#555);font-size:13px;padding:14px 0}',
    '.sh-view{display:flex;flex-direction:column;height:calc(100vh - 70px)}',
    '.sh-frame{flex:1;width:100%;border:1px solid var(--border,#222);border-radius:10px;background:#fff;margin-top:10px;min-height:400px}',
    '.sh-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--surface3,#1c1c1c);border:1px solid var(--accent-dim,#6b5d48);color:var(--text,#e8e6e1);padding:9px 16px;border-radius:9px;font-size:13px;z-index:9999}',
    '@media(max-width:640px){.sh-file{flex-wrap:wrap}.sh-acts{width:100%;justify-content:flex-start}.sh-view{height:calc(100vh - 110px)}}'
  ].join('\n');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function daysUntil(d) { if (!d) return null; var t = new Date(d + 'T00:00:00'); var n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((t - n) / 864e5); }
  function size(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function toast(m) { var t = document.createElement('div'); t.className = 'sh-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }
  function fileUrl(f, dl) { return location.origin + '/sinav-dosya/' + f.token + (dl ? '?indir=1' : ''); }

  /* opts.req(method, url, body|FormData) -> Promise<json>  (auth başlıklarını Polonica ekler) */
  function SinavHub(root, opts) {
    this.root = root; this.req = opts.req; this.data = { courses: [], files: [] };
    if (!document.getElementById('sh-css')) { var s = document.createElement('style'); s.id = 'sh-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('sh');
  }

  SinavHub.prototype.load = function () {
    var self = this;
    return this.req('GET', '/api/sinav').then(function (d) { self.data = d; return d; });
  };

  /* ── DERS LİSTESİ ─────────────────────────────────────── */
  SinavHub.prototype.showList = function () {
    var self = this;
    this.view = 'list';
    this.root.innerHTML = '<div class="sh-empty">Yükleniyor…</div>';
    this.load().then(function () { self.renderList(); }).catch(function (e) { self.root.innerHTML = '<div class="sh-empty">Yüklenemedi: ' + esc(e.message) + '</div>'; });
  };

  SinavHub.prototype.renderList = function (showForm) {
    var self = this, d = this.data;
    var groups = [], by = {};
    d.courses.forEach(function (c) { var t = c.term || 'Diğer'; if (!by[t]) { by[t] = []; groups.push(t); } by[t].push(c); });
    var h = '<div class="sh-top"><h2 class="sh-h1">📝 Sınav</h2></div><div class="sh-sub">Derslerin ve dosyaların tek yerde. Bir derse girip HTML ya da PDF yükle.</div>';
    if (showForm) h += this.courseForm({}, 'new');
    if (!d.courses.length) h += '<div class="sh-grid">' + '<div class="sh-card add" data-add="1">+ Ders ekle</div></div>';
    groups.forEach(function (t, gi) {
      h += '<div class="sh-term">' + esc(t) + '</div><div class="sh-grid">';
      by[t].forEach(function (c) {
        var n = d.files.filter(function (f) { return f.courseId === c.id; }).length, dd = daysUntil(c.examDate);
        h += '<div class="sh-card" data-c="' + esc(c.id) + '"><div class="sh-emoji">' + esc(c.emoji || '📘') + '</div><div class="sh-title">' + esc(c.title) + '</div>' +
          '<div class="sh-meta">' + esc(c.teacher || '') + (c.teacher ? ' · ' : '') + n + ' dosya</div>' +
          (dd != null && dd >= 0 ? '<span class="sh-pill">' + (dd === 0 ? 'Sınav bugün' : dd + ' gün kaldı') + '</span>' : '') + '</div>';
      });
      if (gi === 0) h += '<div class="sh-card add" data-add="1">+ Ders ekle</div>';
      h += '</div>';
    });
    this.root.innerHTML = h;
    this.root.querySelectorAll('[data-c]').forEach(function (el) { el.onclick = function () { self.openCourse(el.getAttribute('data-c')); }; });
    this.root.querySelectorAll('[data-add]').forEach(function (el) { el.onclick = function () { self.renderList(true); }; });
    this.bindForm(null);
  };

  SinavHub.prototype.courseForm = function (c, mode) {
    var term = c.term || (this.data.courses[0] && this.data.courses[0].term) || '';
    return '<div class="sh-form" data-form="' + mode + '">' +
      '<div class="sh-row"><div><label>Emoji</label><input class="sh-in" name="emoji" value="' + esc(c.emoji || '📘') + '"></div>' +
      '<div><label>Ders adı</label><input class="sh-in" name="title" value="' + esc(c.title || '') + '" placeholder="ör. Rusça 2"></div></div>' +
      '<label>Hoca</label><input class="sh-in" name="teacher" value="' + esc(c.teacher || '') + '">' +
      '<div class="sh-row" style="grid-template-columns:1fr 1fr"><div><label>Dönem</label><input class="sh-in" name="term" value="' + esc(term) + '" placeholder="2026–27 Güz"></div>' +
      '<div><label>Sınav tarihi</label><input class="sh-in" type="date" name="examDate" value="' + esc(c.examDate || '') + '"></div></div>' +
      '<button class="sh-btn pri" data-save="1">' + (mode === 'new' ? 'Dersi ekle' : 'Kaydet') + '</button> <button class="sh-btn" data-cancel="1">Vazgeç</button></div>';
  };

  SinavHub.prototype.bindForm = function (course) {
    var self = this, f = this.root.querySelector('[data-form]');
    if (!f) return;
    var get = function () { var o = {}; f.querySelectorAll('input').forEach(function (i) { o[i.name] = i.value.trim(); }); return o; };
    var t = f.querySelector('[name=title]'); if (t && !t.value) t.focus();
    f.querySelector('[data-cancel]').onclick = function () { course ? self.renderCourse(course.id) : self.renderList(); };
    f.querySelector('[data-save]').onclick = function () {
      var o = get(); if (!o.title) { toast('Ders adı gerekli'); return; }
      var p = course ? self.req('PUT', '/api/sinav/courses/' + course.id, o) : self.req('POST', '/api/sinav/courses', o);
      p.then(function (c) {
        if (c.error) throw new Error(c.error);
        return self.load().then(function () { course ? self.renderCourse(course.id) : self.openCourse(c.id); });
      }).catch(function (e) { toast(e.message); });
    };
  };

  /* ── DERS SAYFASI ─────────────────────────────────────── */
  SinavHub.prototype.openCourse = function (id) {
    var self = this;
    this.load().then(function () { self.renderCourse(id); });
  };

  SinavHub.prototype.renderCourse = function (id, editing) {
    var self = this, d = this.data, c = d.courses.filter(function (x) { return x.id === id; })[0];
    if (!c) return this.renderList();
    this.view = 'course'; this.courseId = id;
    var files = d.files.filter(function (f) { return f.courseId === id; });
    var dd = daysUntil(c.examDate);
    var h = '<div class="sh-top"><button class="sh-btn" data-back="1">← Dersler</button><h2 class="sh-h1">' + esc(c.emoji || '') + ' ' + esc(c.title) + '</h2>' +
      (dd != null && dd >= 0 ? '<span class="sh-pill" style="margin:0">' + (dd === 0 ? 'Sınav bugün' : dd + ' gün kaldı') + '</span>' : '') +
      '</div>' +
      '<div class="sh-sub" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + esc([c.teacher, c.term].filter(Boolean).join(' · ')) +
      '<button class="sh-btn sm" data-edit="1">✏️ Düzenle</button><button class="sh-btn sm red" data-delc="1">🗑 Dersi sil</button></div>';
    if (editing) h += this.courseForm(c, 'edit');
    h += '<div class="sh-drop"><div>HTML ya da PDF dosyalarını buraya sürükle</div>' +
      '<select class="sh-sel" data-kind style="margin-top:8px"><option value="">Tür: otomatik</option>' + KINDS.map(function (k) { return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select> ' +
      '<button class="sh-btn pri" data-pick="1">📤 Dosya seç</button><input type="file" accept=".html,.htm,.pdf" multiple hidden></div>';
    if (!files.length) h += '<div class="sh-empty">Bu derste henüz dosya yok.</div>';
    KINDS.forEach(function (k) {
      var list = files.filter(function (f) { return (f.kind || 'diger') === k[0] || (k[0] === 'diger' && !KINDS.some(function (x) { return x[0] === f.kind; })); });
      if (!list.length) return;
      h += '<div class="sh-sec">' + k[1] + ' (' + list.length + ')</div>';
      list.forEach(function (f) {
        h += '<div class="sh-file" data-f="' + esc(f.id) + '"><span>' + (f.type === 'pdf' ? '📕' : '🌐') + '</span>' +
          '<div class="sh-fname" data-open="1"><b>' + esc(f.title) + '</b><span class="sh-meta">' + f.type.toUpperCase() + ' · ' + size(f.size) + ' · ' + esc(String(f.addedAt).slice(0, 10)) + '</span></div>' +
          '<div class="sh-acts"><select class="sh-sel" data-k>' + KINDS.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === f.kind ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
          '<button class="sh-btn sm" data-ren="1" title="Yeniden adlandır">✏️</button>' +
          '<button class="sh-btn sm" data-link="1" title="Paylaşım linkini kopyala">🔗</button>' +
          '<a class="sh-btn sm" href="' + esc(fileUrl(f, true)) + '" title="İndir">⬇</a>' +
          '<button class="sh-btn sm red" data-del="1" title="Sil">🗑</button></div></div>';
      });
    });
    this.root.innerHTML = h;
    var q = function (s) { return self.root.querySelector(s); };
    q('[data-back]').onclick = function () { self.showList(); };
    q('[data-edit]').onclick = function () { self.renderCourse(id, true); };
    q('[data-delc]').onclick = function () {
      if (!confirm('"' + c.title + '" dersi ve içindeki ' + files.length + ' dosya silinsin mi?')) return;
      self.req('DELETE', '/api/sinav/courses/' + id).then(function () { toast('Ders silindi'); self.showList(); });
    };
    if (editing) this.bindForm(c);

    // Yükleme
    var input = q('input[type=file]'), drop = q('.sh-drop');
    q('[data-pick]').onclick = function () { input.click(); };
    input.onchange = function () { self.upload(id, input.files); };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = function () { drop.classList.remove('over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); self.upload(id, e.dataTransfer.files); };

    // Dosya işlemleri
    this.root.querySelectorAll('.sh-file').forEach(function (row) {
      var f = files.filter(function (x) { return x.id === row.getAttribute('data-f'); })[0];
      row.querySelector('[data-open]').onclick = function () { self.openFile(f); };
      row.querySelector('[data-k]').onchange = function (e) {
        self.req('PUT', '/api/sinav/files/' + f.id, { kind: e.target.value }).then(function () { return self.load(); }).then(function () { self.renderCourse(id); });
      };
      row.querySelector('[data-ren]').onclick = function () {
        var t = prompt('Yeni ad:', f.title); if (!t || !t.trim()) return;
        self.req('PUT', '/api/sinav/files/' + f.id, { title: t.trim() }).then(function () { return self.load(); }).then(function () { self.renderCourse(id); });
      };
      row.querySelector('[data-link]').onclick = function () {
        var u = fileUrl(f);
        if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { toast('Link kopyalandı'); }, function () { prompt('Link:', u); });
        else prompt('Link:', u);
      };
      row.querySelector('[data-del]').onclick = function () {
        if (!confirm('"' + f.title + '" silinsin mi?')) return;
        self.req('DELETE', '/api/sinav/files/' + f.id).then(function () { return self.load(); }).then(function () { toast('Silindi'); self.renderCourse(id); });
      };
    });
  };

  SinavHub.prototype.upload = function (courseId, fileList) {
    var self = this, files = Array.prototype.filter.call(fileList || [], function (f) { return /\.(html?|pdf)$/i.test(f.name); });
    if (!files.length) { toast('Sadece .html ve .pdf yüklenebilir'); return; }
    var fd = new FormData();
    files.forEach(function (f) { fd.append('files', f, f.name); });
    var kindSel = this.root.querySelector('[data-kind]'); if (kindSel && kindSel.value) fd.append('kind', kindSel.value);
    var drop = this.root.querySelector('.sh-drop'); if (drop) drop.firstChild.textContent = '⏳ ' + files.length + ' dosya yükleniyor…';
    this.req('POST', '/api/sinav/courses/' + courseId + '/files', fd).then(function (r) {
      if (r && r.error) throw new Error(r.error);
      toast(files.length + ' dosya eklendi');
      return self.load();
    }).then(function () { self.renderCourse(courseId); }).catch(function (e) { toast('Yüklenemedi: ' + e.message); self.renderCourse(courseId); });
  };

  /* ── GÖRÜNTÜLEYİCİ ────────────────────────────────────── */
  SinavHub.prototype.openFile = function (f) {
    var self = this;
    this.view = 'file';
    this.root.innerHTML = '<div class="sh-view"><div class="sh-top"><button class="sh-btn" data-back="1">← Geri</button><b style="font-size:15px">' + esc(f.title) + '</b>' +
      '<a class="sh-btn sm" href="' + esc(fileUrl(f)) + '" target="_blank" rel="noopener">↗ Yeni sekmede aç</a></div>' +
      '<iframe class="sh-frame" src="' + esc(fileUrl(f)) + '"></iframe></div>';
    this.root.querySelector('[data-back]').onclick = function () { self.renderCourse(f.courseId); };
  };

  window.SinavHub = SinavHub;
})();
