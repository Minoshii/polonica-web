/* ═══════════════════════════════════════════════════════════════
   POLONICA · WIADOMOŚCI
   Polonya'nın büyük haber sitelerinden baş haberler + "Bugün
   Polonya'da" özeti (Türkçe açıklama, derste söylenecek Lehçe cümle).
   Sunucu: GET /api/wiadomosci, POST /api/wiadomosci/ozet, /cevir
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CSS = [
    '.wd{width:100%;max-width:1320px}',
    '.wd *{box-sizing:border-box}',
    '.wd-top{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}',
    '.wd-sp{flex:1}',
    '.wd-meta{font-size:11.5px;color:var(--text3)}',
    '.wd-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}',
    '.wd-chip{background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:99px;padding:5px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}',
    '.wd-chip.on{border-color:var(--accent);color:var(--accent-text,var(--accent));background:var(--accent-bg)}',
    '.wd-chip.off{opacity:.55;text-decoration:line-through}',
    '.wd-brief{background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:16px 18px;margin-bottom:18px}',
    '.wd-brief h3{margin:0 0 4px;font-size:15px;font-weight:800}',
    '.wd-bi{border-top:1px solid var(--border);padding:12px 0 4px}',
    '.wd-bi:first-of-type{border-top:none}',
    '.wd-bi b.t{font-size:14px;display:block;margin-bottom:3px}',
    '.wd-bi p{margin:0 0 6px;font-size:13px;line-height:1.55;color:var(--text2)}',
    '.wd-say{background:var(--surface);border-left:3px solid var(--accent);border-radius:6px;padding:8px 11px;font-size:13px;line-height:1.55;margin:6px 0}',
    '.wd-say i{display:block;font-style:normal;color:var(--text2);font-size:12px;margin-top:2px}',
    '.wd-kw{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}',
    '.wd-kw span{font-size:11.5px;background:var(--surface);border:1px solid var(--border2);border-radius:7px;padding:3px 8px}',
    '.wd-kw span em{font-style:normal;color:var(--text2);margin-left:4px}',
    '.wd-list{display:grid;gap:9px}',
    '.wd-item{display:flex;gap:12px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:11px 13px}',
    '.wd-img{width:92px;height:62px;border-radius:8px;object-fit:cover;flex-shrink:0;background:var(--surface3)}',
    '.wd-body{flex:1;min-width:0}',
    '.wd-src{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-text,var(--accent))}',
    '.wd-src span{color:var(--text3);font-weight:600;letter-spacing:0;text-transform:none;margin-left:6px}',
    '.wd-title{font-size:14.5px;font-weight:700;line-height:1.4;margin:3px 0 4px;color:var(--text)}',
    '.wd-desc{font-size:12.5px;line-height:1.5;color:var(--text2);margin:0}',
    '.wd-tr{font-size:13px;line-height:1.5;margin-top:6px;padding:7px 10px;border-radius:7px;background:var(--surface);border:1px dashed var(--border2)}',
    '.wd-acts{display:flex;gap:6px;margin-top:7px}',
    '.wd-btn{background:var(--surface);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:5px 10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px}',
    '.wd-btn:hover{border-color:var(--accent)}',
    '.wd-btn.pri{border-color:var(--accent);color:var(--accent-text,var(--accent));background:var(--accent-bg)}',
    '.wd-empty{color:var(--text3);font-size:13px;padding:16px 0}',
    '@media(max-width:640px){.wd-img{display:none}}',
    '.wd-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:18px;align-items:start}',
    '@media(max-width:1100px){.wd-grid{grid-template-columns:1fr}.wd-side{position:static!important;max-height:none!important}}',
    '.wd-side{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto;background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:14px 16px}',
    '.wd-tabs{display:flex;gap:6px;margin-bottom:10px}',
    '.wd-tab{flex:1;background:var(--surface);border:1px solid var(--border2);color:var(--text2);border-radius:9px;padding:7px 8px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
    '.wd-tab.on{border-color:var(--accent);color:var(--accent-text,var(--accent));background:var(--accent-bg)}',
    '.wd-hl{border-top:1px solid var(--border);padding:10px 0}',
    '.wd-hl:first-of-type{border-top:none}',
    '.wd-hl-h{display:flex;gap:8px;align-items:flex-start;cursor:pointer}',
    '.wd-num{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:var(--accent-bg);color:var(--accent-text,var(--accent));font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:1px}',
    '.wd-hl-h b{font-size:13.5px;line-height:1.4;flex:1}',
    '.wd-day{font-size:10.5px;color:var(--text3);font-weight:700;white-space:nowrap;margin-top:3px}',
    '.wd-hl-d{display:none;padding:6px 0 0 30px}',
    '.wd-hl.open .wd-hl-d{display:block}',
    '.wd-hl-d p{margin:0 0 6px;font-size:12.5px;line-height:1.55;color:var(--text2)}',
    '.wd-srcs{display:flex;flex-direction:column;gap:3px;margin-top:6px}',
    '.wd-srcs a{font-size:11.5px;color:var(--text2);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.wd-srcs a:hover{color:var(--accent-text,var(--accent))}',
    '.wd-srcs a b{color:var(--accent-text,var(--accent));font-size:10px;letter-spacing:.05em;text-transform:uppercase;margin-right:5px}'
  ].join('\n');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ago(iso) {
    if (!iso) return '';
    var m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return 'şimdi'; if (m < 60) return m + ' dk önce';
    var h = Math.round(m / 60); if (h < 24) return h + ' sa önce';
    return Math.round(h / 24) + ' gün önce';
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : '#'; }

  function Wiadomosci(root, opts) {
    this.root = root; this.req = opts.req; this.data = null; this.filter = 'all'; this.brief = null; this.tab = 'hafta'; this.week = null;
    if (!document.getElementById('wd-css')) { var s = document.createElement('style'); s.id = 'wd-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('wd');
  }

  Wiadomosci.prototype.load = function (force) {
    var self = this;
    if (!this.data) this.root.innerHTML = '<div class="panel-title">📰 Wiadomości</div><div class="wd-empty">Haberler yükleniyor…</div>';
    return this.req('GET', '/api/wiadomosci' + (force ? '?yenile=1' : '')).then(function (d) {
      if (d.error) throw new Error(d.error);
      self.data = d; self.render();
    }).catch(function (e) {
      self.root.innerHTML = '<div class="panel-title">📰 Wiadomości</div><div class="wd-empty">Haberler alınamadı: ' + esc(e.message) + '</div>';
    });
  };

  Wiadomosci.prototype.render = function () {
    var self = this, d = this.data;
    var items = this.filter === 'all' ? d.items : d.items.filter(function (i) { return i.source === self.filter; });
    var srcName = {}; d.sources.forEach(function (s) { srcName[s.id] = s.name; });
    var h = '<div class="wd-top"><div><div class="panel-title">📰 Wiadomości</div>' +
      '<div class="panel-sub" style="margin-bottom:0">Polonya\'nın büyük haber sitelerinden son baş haberler.</div></div></div>';

    h += '<div class="wd-grid"><div class="wd-main">';
    h += '<div class="wd-chips"><button class="wd-chip' + (this.filter === 'all' ? ' on' : '') + '" data-f="all">Hepsi · ' + d.items.length + '</button>' +
      d.sources.map(function (s) {
        return '<button class="wd-chip' + (self.filter === s.id ? ' on' : '') + (s.ok ? '' : ' off') + '" data-f="' + esc(s.id) + '" title="' + esc(s.ok ? s.count + ' haber' : 'Ulaşılamadı: ' + (s.error || '')) + '"' + (s.ok ? '' : ' disabled') + '>' + esc(s.name) + (s.ok ? ' · ' + s.count : '') + '</button>';
      }).join('') + '<span class="wd-sp"></span><span class="wd-meta" style="align-self:center">' + esc(ago(d.fetchedAt)) + ' güncellendi</span><button class="wd-btn" data-a="refresh">↻ Yenile</button></div>';

    h += '<div class="wd-list">' + (items.slice(0, 80).map(function (it, i) {
      return '<div class="wd-item" data-i="' + i + '">' +
        (it.img ? '<img class="wd-img" loading="lazy" referrerpolicy="no-referrer" src="' + esc(safeUrl(it.img)) + '" alt="" onerror="this.remove()">' : '') +
        '<div class="wd-body"><div class="wd-src">' + esc(srcName[it.source] || it.source) + '<span>' + esc(ago(it.date)) + '</span></div>' +
        '<div class="wd-title" lang="pl">' + esc(it.title) + '</div>' +
        (it.desc ? '<p class="wd-desc" lang="pl">' + esc(it.desc) + '</p>' : '') +
        '<div class="wd-tr" style="display:none"></div>' +
        '<div class="wd-acts"><button class="wd-btn" data-a="tr">🇹🇷 Türkçesi</button><a class="wd-btn" href="' + esc(safeUrl(it.link)) + '" target="_blank" rel="noopener noreferrer">↗ Habere git</a></div>' +
        '</div></div>';
    }).join('') || '<div class="wd-empty">Bu kaynakta haber yok.</div>') + '</div>';
    h += '</div><aside class="wd-side"><div class="wd-tabs"><button class="wd-tab' + (this.tab === 'hafta' ? ' on' : '') + '" data-t="hafta">📅 Haftanın öne çıkanları</button><button class="wd-tab' + (this.tab === 'bugun' ? ' on' : '') + '" data-t="bugun">🇹🇷 Bugün</button></div><div class="wd-sidebody"></div></aside></div>';

    this.root.innerHTML = h;
    this.root.querySelector('[data-a=refresh]').onclick = function () { self.brief = null; self.load(true); };
    this.root.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { self.filter = b.getAttribute('data-f'); self.render(); }; });
    this.root.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { self.tab = b.getAttribute('data-t'); self.root.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('on', x === b); }); self.renderSide(); }; });
    this.renderSide();
    this.root.querySelectorAll('.wd-item').forEach(function (row) {
      var it = items[+row.getAttribute('data-i')];
      row.querySelector('[data-a=tr]').onclick = function () { self.translate(it, row, this); };
    });
  };

  Wiadomosci.prototype.briefHtml = function () {
    var b = this.brief;
    var head = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><div class="wd-meta" style="flex:1;min-width:160px">Son haberlerden bugünün en önemli 5 gelişmesi: Türkçe açıklama ve derste söyleyebileceğin Lehçe cümle.</div>';
    if (!b) return head + '<button class="wd-btn pri" data-a="brief">✨ Özeti hazırla</button></div>';
    if (b === 'loading') return head + '<button class="wd-btn" disabled>⏳ Hazırlanıyor…</button></div>';
    if (b.error) return head + '<button class="wd-btn pri" data-a="brief">↻ Tekrar dene</button></div><div class="wd-empty">Özet hazırlanamadı: ' + esc(b.error) + '</div>';
    return head + '<button class="wd-btn" data-a="brief-hide">Gizle</button></div>' + (b.items || []).map(function (x) {
      return '<div class="wd-bi"><b class="t">' + esc(x.baslik_tr) + '</b><p>' + esc(x.ozet_tr) + (x.neden_onemli ? ' <b>' + esc(x.neden_onemli) + '</b>' : '') + '</p>' +
        (x.derste_pl ? '<div class="wd-say" lang="pl">🗣 ' + esc(x.derste_pl) + '<i>' + esc(x.derste_tr || '') + '</i></div>' : '') +
        (x.kelimeler && x.kelimeler.length ? '<div class="wd-kw">' + x.kelimeler.map(function (k) { return '<span lang="pl">' + esc(k.pl) + '<em>' + esc(k.tr) + '</em></span>'; }).join('') + '</div>' : '') +
        '</div>';
    }).join('');
  };

  Wiadomosci.prototype.renderSide = function () {
    var box = this.root.querySelector('.wd-sidebody');
    if (!box) return;
    if (this.tab === 'bugun') { box.innerHTML = '<div class="wd-brief" style="margin:0;padding:0;border:none;background:none">' + this.briefHtml() + '</div>'; this.bindBrief(); return; }
    this.renderWeek(box);
  };

  Wiadomosci.prototype.loadWeek = function (force) {
    var self = this;
    this.week = 'loading'; this.renderSide();
    this.req('GET', '/api/wiadomosci/hafta' + (force ? '?yenile=1' : '')).then(function (r) {
      self.week = r && !r.error ? r : { error: (r && r.error) || 'bilinmeyen hata' };
    }).catch(function (e) { self.week = { error: e.message }; }).then(function () { self.renderSide(); });
  };

  Wiadomosci.prototype.renderWeek = function (box) {
    var self = this, w = this.week;
    if (!w) { this.loadWeek(false); return; }
    if (w === 'loading') { box.innerHTML = '<div class="wd-empty">⏳ Son 7 günün haberleri taranıyor…</div>'; return; }
    if (w.error) { box.innerHTML = '<div class="wd-empty">Hazırlanamadı: ' + esc(w.error) + '</div><button class="wd-btn pri" data-a="wk">↻ Tekrar dene</button>'; box.querySelector('[data-a=wk]').onclick = function () { self.loadWeek(true); }; return; }
    var srcName = {}; (this.data ? this.data.sources : []).forEach(function (s) { srcName[s.id] = s.name; });
    var note = w.days < 7 ? '<div class="wd-meta" style="margin:0 0 8px">Arşiv ' + w.days + ' günlük. Sunucu haberleri biriktirdikçe tam haftaya tamamlanacak.</div>' : '';
    box.innerHTML = '<div class="wd-meta" style="margin-bottom:6px">Son ' + Math.min(w.days, 7) + ' gün · ' + w.count + ' haber tarandı · en önemliden başlayarak</div>' + note +
      (w.items.length ? w.items.map(function (x, i) {
        return '<div class="wd-hl' + (i === 0 ? ' open' : '') + '"><div class="wd-hl-h"><span class="wd-num">' + (i + 1) + '</span><b>' + esc(x.baslik_tr) + '</b><span class="wd-day">' + esc(x.gun || '') + '</span></div>' +
          '<div class="wd-hl-d"><p>' + esc(x.ozet_tr) + (x.neden_onemli ? ' <b>' + esc(x.neden_onemli) + '</b>' : '') + '</p>' +
          (x.derste_pl ? '<div class="wd-say" lang="pl">🗣 ' + esc(x.derste_pl) + '<i>' + esc(x.derste_tr || '') + '</i></div>' : '') +
          (x.kelimeler && x.kelimeler.length ? '<div class="wd-kw">' + x.kelimeler.map(function (k) { return '<span lang="pl">' + esc(k.pl) + '<em>' + esc(k.tr) + '</em></span>'; }).join('') + '</div>' : '') +
          (x.kaynaklar && x.kaynaklar.length ? '<div class="wd-srcs">' + x.kaynaklar.map(function (k) { return '<a href="' + esc(safeUrl(k.link)) + '" target="_blank" rel="noopener noreferrer" lang="pl"><b>' + esc(srcName[k.source] || k.source) + '</b>' + esc(k.title) + '</a>'; }).join('') + '</div>' : '') +
          '</div></div>';
      }).join('') : '<div class="wd-empty">Bu hafta için yeterli haber yok.</div>') +
      '<div style="margin-top:10px;text-align:right"><button class="wd-btn" data-a="wk">↻ Yeniden hazırla</button></div>';
    box.querySelectorAll('.wd-hl-h').forEach(function (h) { h.onclick = function () { h.parentNode.classList.toggle('open'); }; });
    box.querySelector('[data-a=wk]').onclick = function () { self.loadWeek(true); };
  };

  Wiadomosci.prototype.bindBrief = function () {
    var self = this, box = this.root.querySelector('.wd-sidebody');
    var go = box.querySelector('[data-a=brief]');
    if (go) go.onclick = function () {
      self.brief = 'loading'; self.renderSide();
      var items = self.data.items.slice(0, 40).map(function (i) { return { source: i.source, title: i.title, desc: i.desc }; });
      self.req('POST', '/api/wiadomosci/ozet', { items: items }).then(function (r) {
        self.brief = r && !r.error ? r : { error: (r && r.error) || 'bilinmeyen hata' };
      }).catch(function (e) { self.brief = { error: e.message }; }).then(function () { self.renderSide(); });
    };
    var hide = box.querySelector('[data-a=brief-hide]');
    if (hide) hide.onclick = function () { self.brief = null; self.renderSide(); };
  };

  Wiadomosci.prototype.translate = function (it, row, btn) {
    var out = row.querySelector('.wd-tr');
    if (out.style.display !== 'none') { out.style.display = 'none'; btn.textContent = '🇹🇷 Türkçesi'; return; }
    out.style.display = 'block';
    if (it._tr) { out.textContent = it._tr; btn.textContent = 'Gizle'; return; }
    out.textContent = '⏳ Çevriliyor…'; btn.disabled = true;
    this.req('POST', '/api/wiadomosci/cevir', { text: it.title + (it.desc ? '\n' + it.desc : '') }).then(function (r) {
      it._tr = r.tr || ('Çevrilemedi: ' + (r.error || '')); out.textContent = it._tr; btn.textContent = 'Gizle';
    }).catch(function (e) { out.textContent = 'Çevrilemedi: ' + e.message; }).then(function () { btn.disabled = false; });
  };

  window.Wiadomosci = Wiadomosci;
})();
