/* ═══════════════════════════════════════════════════════════════
   POLONICA · RUSÇA+  (Rusça panelinin yeni sekmeleri)
   📐 Fiil & Zaman · 🔤 Fiil Listesi · 🎨 Sıfatlar · 📚 Kelimeler · 🃏 Kartlar · ✅ Test
   Veri: public/rusca-data.js  (scripts/rusca-build.py ile data/rusca/*.txt'den üretilir)
   Kaynak kitap: «Читаем по-русски» (SumDU 2009) sözlüğü + metinleri
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var DATA = window.RU_DATA;
  if (!DATA) return;
  var A = '́';
  var EASE = 'cubic-bezier(.22,1,.36,1)';

  /* ---------- CSS (site tema değişkenlerine bağlı) ---------- */
  var CSS = [
    '.rx{width:100%;max-width:1000px;--rx-m:var(--c-blue);--rx-f:var(--c-pink);--rx-n:var(--c-green);--rx-pl:var(--c-purple);--rx-a:var(--c-gold);--rx-v:var(--c-amber);--rx-ok:var(--c-green);--rx-bad:var(--c-red)}',
    '.rx *{box-sizing:border-box}',
    '.rx-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px}',
    '.rx-card h3{margin:0 0 4px;font-size:17px;color:var(--text)}',
    '.rx-card h4{margin:14px 0 6px;font-size:14px;color:var(--accent-text,var(--accent))}',
    '.rx-lead{color:var(--text2);margin:0 0 10px;font-size:14px;line-height:1.55}',
    '.rx-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0}',
    '.rx-flow>div{background:var(--surface2);border-radius:12px;padding:11px 12px;font-size:13.5px;color:var(--text);line-height:1.5}',
    '.rx-flow b.k{display:block;font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--text3);margin-bottom:3px}',
    '@media(max-width:700px){.rx-flow{grid-template-columns:1fr}}',
    '.rx-pl{border-left:3px solid var(--rx-pl);background:color-mix(in srgb,var(--rx-pl) 10%,transparent);padding:9px 12px;border-radius:0 10px 10px 0;margin:10px 0;font-size:13.5px;color:var(--text);line-height:1.5}',
    '.rx-pl::before{content:"🇵🇱 Lehçe köprüsü · ";font-weight:800;color:var(--rx-pl)}',
    'table.rx-cj{width:100%;border-collapse:collapse;font-size:14px;margin:6px 0;background:none}',
    'table.rx-cj th,table.rx-cj td{padding:7px 8px;border:0;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;background:none;color:var(--text)}',
    'table.rx-cj th{font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.05em}',
    'table.rx-cj td.p{color:var(--text3);width:84px;white-space:nowrap}',
    '.rx-ru{font-weight:700;color:var(--text)}',
    '.rx-tl{display:block;color:var(--text3);font-size:12px;font-weight:500}',
    '.rx-tl b{color:var(--accent-text,var(--accent));font-weight:800}',
    '.rx-end{color:var(--accent-text,var(--accent));font-weight:800}',
    '.rx-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
    '@media(max-width:760px){.rx-g2{grid-template-columns:1fr}}',
    '.rx details{margin-top:10px;background:var(--surface2);border-radius:12px;padding:10px 12px}',
    '.rx summary{cursor:pointer;font-weight:700;color:var(--text2);font-size:13.5px}',
    '.rx-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}',
    '.rx-bar input{flex:1 1 220px;min-width:0;margin:0!important;font-size:14px!important;padding:11px 14px!important;border-radius:12px!important}',
    '.rx-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
    '.rx-chip{border:1px solid var(--border);background:var(--surface2);padding:6px 11px;border-radius:999px;font:inherit;font-size:12.5px;font-weight:700;color:var(--text2);cursor:pointer;transition:border-color .15s,color .15s,background .15s}',
    '.rx-chip:hover{color:var(--text);border-color:var(--accent)}',
    '.rx-chip.on{background:var(--accent-bg);border-color:var(--accent);color:var(--text)}',
    '.rx-btn{border:1px solid var(--border);background:var(--surface2);color:var(--text);padding:10px 16px;border-radius:12px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;transition:transform .15s ' + EASE + ',border-color .15s}',
    '.rx-btn:hover{border-color:var(--accent)}',
    '.rx-btn:active{transform:scale(.96)}',
    '.rx-btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent,#fff)}',
    '.rx-count{color:var(--text3);font-size:12.5px}',
    '.rx-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}',
    '.rx-row{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px 12px;text-align:left;display:block;width:100%;font:inherit;color:var(--text);cursor:pointer;transition:border-color .15s,transform .2s ' + EASE + '}',
    '.rx-row:hover{border-color:var(--accent);transform:translateY(-1px)}',
    '.rx-row .top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}',
    '.rx-row .mean{margin-top:6px;color:var(--text);font-size:14px;display:none}',
    '.rx-row .mean small{color:var(--text2);display:block;font-size:12px;margin-top:2px}',
    '.rx-row.open .mean,.rx-all .rx-row .mean,.rx-row .mean.always{display:block}',
    '.rx-row .hint{font-size:11px;color:var(--text3);margin-top:4px}',
    '.rx-row.open .hint,.rx-all .rx-row .hint{display:none}',
    '.rx-b{flex:none;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;border:1px solid currentColor;white-space:nowrap}',
    '.rx-b-m{color:var(--rx-m)}.rx-b-f{color:var(--rx-f)}.rx-b-n{color:var(--rx-n)}.rx-b-pl{color:var(--rx-pl)}.rx-b-a{color:var(--rx-a)}.rx-b-v{color:var(--rx-v)}.rx-b-d,.rx-b-p{color:var(--text2)}',
    '.rx-b-x{color:var(--rx-bad)}.rx-b-1{color:var(--rx-m)}.rx-b-2{color:var(--rx-n)}',
    '.rx-ist{display:inline-block;font-size:10.5px;font-weight:800;color:var(--rx-bad);background:color-mix(in srgb,var(--rx-bad) 13%,transparent);padding:1px 7px;border-radius:6px;margin-left:6px}',
    '.rx-note{background:var(--accent-bg);border-radius:10px;padding:9px 12px;margin:10px 0;font-size:13.5px;color:var(--text)}',
    '.rx-note::before{content:"⚠️ "}',
    '.rx-spk{border:0;background:var(--surface2);color:var(--text);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;vertical-align:middle;margin-left:6px}',
    '.rx-spk:hover{background:var(--accent-bg)}',
    /* sheet */
    '.rx-sheet{position:fixed;inset:0;background:rgba(5,7,15,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:none;align-items:flex-end;justify-content:center;z-index:9000}',
    '.rx-sheet.on{display:flex}',
    '.rx-sheet .box{background:var(--surface);color:var(--text);border:1px solid var(--border2,var(--border));border-radius:22px 22px 0 0;width:100%;max-width:760px;max-height:90vh;overflow:auto;padding:20px 18px 28px}',
    'html:not([data-motion="off"]) .rx-sheet.on .box{animation:rxUp .35s ' + EASE + '}',
    '@media(min-width:760px){.rx-sheet{align-items:center}.rx-sheet .box{border-radius:22px}}',
    '@keyframes rxUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}',
    '.rx-x{float:right;border:0;background:var(--surface2);color:var(--text);width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer}',
    '.rx-k{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;font-weight:800}',
    /* kartlar */
    '.rx-fcw{perspective:1200px;max-width:520px;margin:10px auto}',
    '.rx-fc{position:relative;height:280px;transition:transform .55s ' + EASE + ';transform-style:preserve-3d;cursor:pointer}',
    '.rx-fc.flip{transform:rotateY(180deg)}',
    '.rx-fc .face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--surface);border:1px solid var(--border);border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px;text-align:center;box-shadow:0 18px 40px -18px rgba(0,0,0,.45)}',
    '.rx-fc .back{transform:rotateY(180deg);background:var(--surface2)}',
    '.rx-fc .big{font-size:32px;font-weight:800;line-height:1.2;color:var(--text)}',
    '.rx-fc .rx-tl{font-size:15px;margin-top:6px}',
    '.rx-fc .meaning{font-size:22px;font-weight:700;color:var(--text)}',
    '.rx-fc .extra{color:var(--text2);font-size:14px;margin-top:10px}',
    '.rx-ctrl{display:flex;justify-content:center;gap:8px;margin-top:14px;flex-wrap:wrap}',
    /* test */
    '.rx-qw{max-width:640px;margin:0 auto}',
    '.rx-qbar{height:6px;background:var(--surface2);border-radius:9px;overflow:hidden;margin:6px 0 14px}',
    '.rx-qbar i{display:block;height:100%;background:var(--accent);transition:width .35s ' + EASE + '}',
    '.rx-qc{background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:22px 18px}',
    '.rx-qq{font-size:20px;font-weight:700;margin:8px 0 16px;line-height:1.35;color:var(--text)}',
    '.rx-qq .rx-tl{font-size:13.5px}',
    '.rx-opts{display:grid;gap:9px}',
    '.rx-opt{border:1.5px solid var(--border);background:var(--surface2);color:var(--text);border-radius:14px;padding:12px 14px;text-align:left;font:inherit;font-size:16px;cursor:pointer;transition:border-color .15s,background .15s}',
    '.rx-opt:hover:not([disabled]){border-color:var(--accent)}',
    '.rx-opt[disabled]{cursor:default}',
    '.rx-opt.ok{border-color:var(--rx-ok);background:color-mix(in srgb,var(--rx-ok) 14%,transparent)}',
    '.rx-opt.bad{border-color:var(--rx-bad);background:color-mix(in srgb,var(--rx-bad) 13%,transparent)}',
    '.rx-opt .info{display:none;font-size:12.5px;color:var(--text2);margin-top:3px}',
    '.rx-qc.done .rx-opt .info{display:block}',
    '.rx-exp{display:none;margin-top:14px;background:var(--surface2);border-radius:12px;padding:11px 13px;font-size:14px;color:var(--text)}',
    '.rx-qc.done .rx-exp{display:block}',
    '.rx-qnav{display:flex;justify-content:space-between;align-items:center;margin-top:14px}',
    '.rx-score{font-size:46px;font-weight:800;text-align:center;color:var(--text)}',
    'html:not([data-motion="off"]) .rx-pop{animation:rxPop .35s ' + EASE + '}',
    '@keyframes rxPop{0%{transform:scale(.97)}50%{transform:scale(1.02)}100%{transform:none}}',
    'html:not([data-motion="off"]) .rx-shake{animation:rxShake .35s}',
    '@keyframes rxShake{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}'
  ].join('\n');

  /* ---------- yardımcılar ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plain(s) { return String(s).replace(/́/g, ''); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  var TL = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ç', ш: 'ş', щ: 'şç', ъ: '', ы: 'ı', ь: 'ʼ', э: 'e', ю: 'yu', я: 'ya' };
  var VOW = 'аеёиоуыэюя';
  function translit(s) {
    var out = '', ch = Array.from(s);
    for (var i = 0; i < ch.length; i++) {
      var c = ch[i]; if (c === A) continue;
      var lc = c.toLowerCase(), t = TL[lc];
      if (t === undefined) { out += esc(c); continue; }
      if (lc === 'е') { var p = (ch[i - 1] === A ? ch[i - 2] : ch[i - 1]) || ' '; var pl = p.toLowerCase(); if (TL[pl] === undefined || VOW.indexOf(pl) >= 0 || pl === 'ь' || pl === 'ъ') t = 'ye'; }
      if (c !== lc) t = t.charAt(0).toUpperCase() + t.slice(1);
      out += (ch[i + 1] === A || lc === 'ё') ? '<b>' + t + '</b>' : t;
    }
    return out;
  }
  function mono(s) { return String(s).split(' ').map(function (t) { return Array.from(plain(t)).filter(function (c) { return VOW.indexOf(c.toLowerCase()) >= 0; }).length <= 1 ? plain(t) : t; }).join(' '); }
  function RU(s) { s = mono(s); return '<span class="rx-ru">' + esc(s) + '</span><span class="rx-tl">' + translit(s) + '</span>'; }
  function speak(s) { if (typeof window.ruSpeak === 'function') window.ruSpeak(plain(s)); }
  function spk(s) { return '<button class="rx-spk" data-say="' + esc(plain(s)) + '" title="Dinle">🔊</button>'; }
  function xp(n, why) { try { if (typeof window.awardXp === 'function') window.awardXp(n, why); } catch (e) {} }

  /* ---------- fiil morfolojisi ---------- */
  var END1 = ['ю', 'ешь', 'ет', 'ем', 'ете', 'ют'];
  var REFL = { 'ю': 'юсь', 'ешь': 'ешься', 'ет': 'ется', 'ем': 'емся', 'ете': 'етесь', 'ют': 'ются' };
  var PRON = ['я', 'ты', 'он / она́', 'мы', 'вы', 'они́'];
  var BUDU = ['бу́ду', 'бу́дешь', 'бу́дет', 'бу́дем', 'бу́дете', 'бу́дут'];
  function isRefl(inf) { return /(ся|сь)$/.test(inf); }
  function auto1(inf) { var r = isRefl(inf), b = inf.replace(/ться$|ть$/, ''); return END1.map(function (e) { return b + (r ? REFL[e] : e); }); }
  function autoPast(inf) { var r = isRefl(inf), b = inf.replace(/ться$|ть$/, ''); return r ? [b + 'лся', b + 'лась', b + 'лось', b + 'лись'] : [b + 'л', b + 'ла', b + 'ло', b + 'ли']; }
  function V(v) {
    if (v._) return v._;
    var o = {};
    o.pres = v.pr === '=' ? auto1(v.inf) : (v.pr === '—' || !v.pr) ? null : v.pr.split(',');
    o.past = v.pa ? v.pa.split(',') : autoPast(v.inf);
    o.fut = plain(v.inf) === 'быть' ? BUDU.slice() : BUDU.map(function (b) { return b + ' ' + v.inf; });
    if (v.pf) {
      o.pfut = v.pff.charAt(0) === '+' ? o.pres.map(function (f) { return v.pff.slice(1) + f; }) : v.pff === '=' ? auto1(v.pf) : v.pff.split(',');
      o.pfpast = v.pfp ? v.pfp.split(',') : autoPast(v.pf);
    }
    Object.keys(o).forEach(function (k) { if (Array.isArray(o[k])) o[k] = o[k].map(mono); });
    return (v._ = o);
  }
  var KTYPE = { '1': 'I. çekim', '2': 'II. çekim', 'x': 'Özel / düzensiz' };

  /* ---------- sıfatlar ---------- */
  var VEL = 'гкх', HUSH = 'жшчщ';
  function adjForms(m) {
    var st, l;
    if (m.slice(-3) === 'о' + A + 'й') { st = m.slice(0, -3); l = plain(st).slice(-1); return [m, st + 'а' + A + 'я', st + 'о' + A + 'е', st + ((VEL + HUSH).indexOf(l) >= 0 ? 'и' : 'ы') + A + 'е']; }
    if (m.slice(-2) === 'ой') { st = m.slice(0, -2); l = plain(st).slice(-1); return [m, st + 'ая', st + 'ое', st + ((VEL + HUSH).indexOf(l) >= 0 ? 'ие' : 'ые')]; }
    if (m.slice(-2) === 'ый') { st = m.slice(0, -2); return [m, st + 'ая', st + 'ое', st + 'ые']; }
    if (m.slice(-2) === 'ий') {
      st = m.slice(0, -2); l = plain(st).slice(-1);
      if (VEL.indexOf(l) >= 0) return [m, st + 'ая', st + 'ое', st + 'ие'];
      if (HUSH.indexOf(l) >= 0) return [m, st + 'ая', st + 'ее', st + 'ие'];
      return [m, st + 'яя', st + 'ее', st + 'ие'];
    }
    return null;
  }
  function adjType(m) {
    if (/о́?й$/.test(m)) return 'vurgulu -ой';
    if (/ый$/.test(m)) return 'sert -ый';
    var l = plain(m).slice(-3, -2);
    if (VEL.indexOf(l) >= 0) return 'г/к/х + ий';
    if (HUSH.indexOf(l) >= 0) return 'ж/ш/ч/щ + ий';
    return 'yumuşak -ний';
  }

  /* ---------- isimler ---------- */
  function regPl(sg) {
    var s = plain(sg), l = s.slice(-1), st = s.slice(0, -1), sl = st.slice(-1);
    if (l === 'й' || l === 'ь' || l === 'я') return st + 'и';
    if (l === 'а') return st + ((VEL + HUSH).indexOf(sl) >= 0 ? 'и' : 'ы');
    if (l === 'о') return st + 'а';
    if (l === 'е') return st + 'я';
    if (VOW.indexOf(l) >= 0) return s;
    return s + ((VEL + HUSH).indexOf(l) >= 0 ? 'и' : 'ы');
  }
  function plKind(w) {
    var sg = plain(w.ru), pl = plain(w.pl);
    if (!pl) return null;
    var r = regPl(sg);
    if (pl === r) return null;
    if (pl === sg) return 'değişmez';
    if (/ья$/.test(pl)) return '-ья çoğulu';
    if (w.c === 'm' && /[ая]$/.test(pl)) return '-а / -я çoğulu';
    if (pl.replace(/ё/g, 'е') === r) return 'е → ё olur';
    if (/ер[иья]$/.test(pl)) return '-ер- eklenir';
    if (/ен[аи]$/.test(pl)) return '-ен- eklenir';
    if (r.length - pl.length === 1) return 'ünlü düşer';
    return 'bambaşka kelime';
  }
  var GL = { m: 'eril', f: 'dişil', n: 'nötr', pl: 'çoğul', a: 'sıfat', v: 'fiil', d: 'zarf / diğer', p: 'kalıp' };

  /* ---------- veri ---------- */
  var W = DATA.w, VB = DATA.v, VBYINF = {};
  VB.forEach(function (v) { V(v); v.inf = mono(v.inf); if (v.pf) v.pf = mono(v.pf); VBYINF[plain(v.inf)] = v; });
  var ADJ = W.filter(function (w) { return w.c === 'a' && adjForms(w.ru); });
  var NOUNS = W.filter(function (w) { return w.c === 'm' || w.c === 'f' || w.c === 'n'; });
  var PLN = W.filter(function (w) { return w.pl; });
  var PLIRR = PLN.filter(function (w) { return plKind(w); });
  function topicsOf(list) { return uniq(list.map(function (w) { return w.t; })); }

  function conjTable(forms) { return '<table class="rx-cj">' + forms.map(function (f, i) { return '<tr><td class="p">' + PRON[i] + '</td><td>' + RU(f) + '</td></tr>'; }).join('') + '</table>'; }

  /* ============ 📐 FİİL & ZAMAN ============ */
  function renderKural(root) {
    var irr = ['хотеть', 'мочь', 'есть', 'жить', 'писать', 'брать', 'идти', 'ехать', 'давать', 'пить'];
    var pirr = ['идти', 'есть', 'мочь', 'жить', 'брать', 'быть', 'ждать', 'спать'];
    var ch = V(VBYINF['читать']);
    root.innerHTML =
      '<div class="rx-card"><h3>1 · Şimdiki zaman: iki çekim grubu</h3>' +
      '<p class="rx-lead">Hangi grupta olduğunu <b>ты</b> formundan anlarsın: <b>-ешь</b> ise I. çekim, <b>-ишь</b> ise II. çekim.</p>' +
      '<div class="rx-g2"><div><h4>I. çekim · чита́ть (okumak)</h4>' + conjTable(ch.pres) + '</div><div><h4>II. çekim · говори́ть (konuşmak)</h4>' + conjTable(V(VBYINF['говорить']).pres) + '</div></div>' +
      '<div class="rx-flow"><div><b class="k">I. çekim kimlerdir?</b>-ать / -ять fiillerinin çoğu: чита́ть, де́лать, гуля́ть, понима́ть</div>' +
      '<div><b class="k">II. çekim kimlerdir?</b>-ить fiillerinin çoğu, ayrıca смотре́ть, ви́деть, стоя́ть, лежа́ть, слы́шать</div>' +
      '<div><b class="k">Yazım kuralı</b>ж ш ч щ г к х\'den sonra ю/я yazılmaz, yerine у/а gelir: учу́, у́чат</div></div>' +
      '<div class="rx-pl">I. çekim Lehçedeki <b>czytam, czytasz</b> grubuna benzer. II. çekim ise <b>mówię, mówisz</b> grubuna benzer: <b>-isz ↔ -ишь</b>.</div>' +
      '<details><summary>II. çekimde «я» formundaki ses değişimleri</summary><table class="rx-cj"><tr><th>Değişim</th><th>Örnek</th></tr>' +
      '<tr><td>д → ж</td><td>ходи́ть → хожу́, ви́деть → ви́жу</td></tr><tr><td>с → ш</td><td>проси́ть → прошу́, висе́ть → вишу́</td></tr>' +
      '<tr><td>т → ч</td><td>лете́ть → лечу́, отве́тить → отве́чу</td></tr><tr><td>ст → щ</td><td>чи́стить → чи́щу</td></tr>' +
      '<tr><td>+л (б, в, м, п)</td><td>люби́ть → люблю́, гото́вить → гото́влю, спать → сплю</td></tr></table>' +
      '<p class="rx-lead">Bu değişim sadece <b>я</b> formunda olur. ты, он ve diğer formlar normal çekilir: хожу́, <b>хо́дишь</b>, хо́дит…</p></details></div>' +

      '<div class="rx-card"><h3>2 · Özel kalıplar ve düzensizler</h3>' +
      '<div class="rx-flow"><div><b class="k">-овать / -евать → -ую</b>рисова́ть → рису́ю, рису́ешь · танцева́ть → танцу́ю</div>' +
      '<div><b class="k">-авать → -аю</b>дава́ть → даю́, даёшь · встава́ть → встаю́</div>' +
      '<div><b class="k">-ся / -сь (dönüşlü)</b>Ünsüzden sonra -ся, ünlüden sonra -сь: занима́юсь, занима́ешься</div></div>' +
      '<div class="rx-pl"><b>-ować → -uję</b> kuralının aynısı: rysować → rysuję = рисовать → рисую. Dönüşlü <b>-ся</b>, Lehçedeki <b>się</b> zamirine karşılık gelir, ama ayrı yazılmaz, fiile eklenir: uczę się = учу́сь.</div>' +
      '<h4>Mutlaka ezberle</h4><table class="rx-cj"><tr><th>Fiil</th><th>я</th><th>ты</th><th>они́</th></tr>' +
      irr.map(function (k) { var v = VBYINF[k], p = V(v).pres; return '<tr><td>' + RU(v.inf) + '<span class="rx-tl">' + esc(v.tr) + '</span></td><td>' + RU(p[0]) + '</td><td>' + RU(p[1]) + '</td><td>' + RU(p[5]) + '</td></tr>'; }).join('') + '</table></div>' +

      '<div class="rx-card"><h3>3 · Geçmiş zaman: kişi yok, cinsiyet var</h3>' +
      '<p class="rx-lead">Mastardaki <b>-ть</b> atılır, yerine özneye göre <b>-л</b> (eril), <b>-ла</b> (dişil), <b>-ло</b> (nötr) ya da <b>-ли</b> (çoğul) gelir. Fiil kişiye göre değişmez, yalnızca cinsiyete ve sayıya göre değişir.</p>' +
      '<table class="rx-cj"><tr><th>он</th><th>она́</th><th>оно́</th><th>они́</th></tr><tr>' + ch.past.map(function (f) { return '<td>' + RU(f) + '</td>'; }).join('') + '</tr></table>' +
      '<div class="rx-flow"><div><b class="k">Erkek konuşursa</b>Я чита́<span class="rx-end">л</span>. Ты чита́<span class="rx-end">л</span>?</div>' +
      '<div><b class="k">Kadın konuşursa</b>Я чита́<span class="rx-end">ла</span>. Ты чита́<span class="rx-end">ла</span>?</div>' +
      '<div><b class="k">Biz / siz / onlar</b>Мы / вы / они́ чита́<span class="rx-end">ли</span>.</div></div>' +
      '<div class="rx-pl">Lehçedeki <b>czytał / czytała / czytało / czytali</b> ile aynı ekler: <b>-ł → -л</b>. Lehçeden daha kolay, çünkü kişi eki yok: czytał<b>em</b> yerine sadece я чита́л.</div>' +
      '<details><summary>Düzensiz geçmiş zamanlar</summary><table class="rx-cj"><tr><th>Fiil</th><th>он</th><th>она́</th><th>они́</th></tr>' +
      pirr.map(function (k) { var v = VBYINF[k], p = V(v).past; return '<tr><td>' + RU(v.inf) + '</td><td>' + RU(p[0]) + '</td><td>' + RU(p[1]) + '</td><td>' + RU(p[3]) + '</td></tr>'; }).join('') + '</table></details></div>' +

      '<div class="rx-card"><h3>4 · Gelecek zaman: iki yolu var</h3>' +
      '<div class="rx-g2"><div><h4>Süreç (imperfektif) → бу́ду + mastar</h4>' + conjTable(ch.fut) + '</div><div><h4>Sonuç (perfektif) → şimdiki gibi çekilir</h4>' + conjTable(ch.pfut) + '</div></div>' +
      '<div class="rx-flow"><div><b class="k">Завтра я бу́ду чита́ть</b>Yarın okuyacağım (bir süre, süreç olarak)</div>' +
      '<div><b class="k">Завтра я прочита́ю кни́гу</b>Yarın kitabı okuyacağım (okuyup bitireceğim)</div>' +
      '<div><b class="k">✗ бу́ду прочита́ть</b>Yanlış! Perfektif fiil бу́ду ile kullanılmaz.</div></div>' +
      '<div class="rx-pl">Lehçeyle birebir aynı: <b>będę czytać</b> = бу́ду чита́ть, <b>przeczytam</b> = прочита́ю. Perfektif fiilin «şimdiki zaman» çekimi her iki dilde de gelecek anlamı taşır.</div></div>' +

      '<div class="rx-card"><h3>5 · Aspekt çiftleri nasıl oluşur?</h3>' +
      '<div class="rx-flow"><div><b class="k">Önek eklenir</b>чита́ть → <span class="rx-end">про</span>чита́ть · писа́ть → <span class="rx-end">на</span>писа́ть · де́лать → <span class="rx-end">с</span>де́лать</div>' +
      '<div><b class="k">Ek değişir</b>реша́ть → реши́ть · покупа́ть → купи́ть · отдыха́ть → отдохну́ть</div>' +
      '<div><b class="k">Bambaşka fiil</b>говори́ть → сказа́ть · брать → взять · иска́ть → найти́</div></div>' +
      '<div class="rx-pl">Niedokonany ve dokonany ayrımı Lehçeyle aynı: czytać → <b>prze</b>czytać, pisać → <b>na</b>pisać, mówić → <b>powiedzieć</b>.</div></div>' +

      '<div class="rx-card"><h3>6 · Çoğul istisnaları (sınavda çıkanlar)</h3>' +
      '<p class="rx-lead">Kurallar «➕ Tekil / Çoğul» sekmesinde. Burada kurala uymayanlar ve nedenleri var.</p>' +
      '<table class="rx-cj"><tr><th>Tekil</th><th>Çoğul</th><th>Neden?</th></tr>' +
      PLIRR.map(function (w) { return '<tr><td>' + RU(w.ru) + '<span class="rx-tl">' + esc(w.tr) + '</span></td><td>' + RU(w.pl) + '</td><td class="p" style="white-space:normal">' + plKind(w) + '</td></tr>'; }).join('') + '</table></div>';
  }

  /* ============ 🔤 FİİL LİSTESİ ============ */
  var vfilter = 'all';
  function renderFiil(root) {
    if (!root.dataset.built) {
      root.dataset.built = '1';
      root.innerHTML = '<div class="rx-bar"><input type="text" id="rx-vq" placeholder="Fiil ara: чита / okumak / çitat…" autocomplete="off"><span class="rx-count" id="rx-vcount"></span></div><div class="rx-chips" id="rx-vchips"></div><div class="rx-list" id="rx-vlist"></div>';
      $('#rx-vq').addEventListener('input', function () { renderFiil(root); });
    }
    var q = plain($('#rx-vq').value.trim().toLowerCase());
    $('#rx-vchips').innerHTML = [['all', 'Hepsi'], ['1', 'I. çekim'], ['2', 'II. çekim'], ['x', 'Özel / düzensiz']].map(function (c) { return '<button class="rx-chip' + (vfilter === c[0] ? ' on' : '') + '" data-vf="' + c[0] + '">' + c[1] + '</button>'; }).join('');
    var list = VB.filter(function (v) {
      return (vfilter === 'all' || v.k === vfilter) && (!q || plain(v.inf).indexOf(q) >= 0 || v.tr.toLowerCase().indexOf(q) >= 0 || translit(v.inf).replace(/<\/?b>/g, '').toLowerCase().indexOf(q) >= 0 || (v.pf && plain(v.pf).indexOf(q) >= 0));
    });
    $('#rx-vcount').textContent = list.length + ' fiil';
    $('#rx-vlist').innerHTML = list.map(function (v) {
      return '<button class="rx-row" data-verb="' + esc(plain(v.inf)) + '"><div class="top"><div>' + RU(v.inf) + '</div><span class="rx-b rx-b-' + v.k + '">' + KTYPE[v.k] + '</span></div><div class="mean always">' + esc(v.tr) + (v.pf ? '<small>perfektif: ' + esc(v.pf) + '</small>' : '') + '</div></button>';
    }).join('');
  }
  function openVerb(key, tab) {
    tab = tab || 'pres';
    var v = VBYINF[key], o = V(v), body = '';
    if (tab === 'pres') body = o.pres ? conjTable(o.pres) : '<p class="rx-lead">Bu fiil şimdiki zamanda kullanılmaz. Örnek: <b>Я студе́нт.</b> (Ben öğrenciyim.)</p>';
    if (tab === 'past') body = '<table class="rx-cj"><tr><th></th><th>' + esc(v.inf) + '</th>' + (v.pf ? '<th>' + esc(v.pf) + '</th>' : '') + '</tr>' +
      ['он', 'она́', 'оно́', 'они́ / мы / вы'].map(function (p, i) { return '<tr><td class="p">' + p + '</td><td>' + RU(o.past[i]) + '</td>' + (v.pf ? '<td>' + RU(o.pfpast[i]) + '</td>' : '') + '</tr>'; }).join('') +
      '</table><p class="rx-lead">я / ты için konuşanın cinsiyetine bakılır: я ' + esc(o.past[0]) + ' (erkek), я ' + esc(o.past[1]) + ' (kadın).</p>';
    if (tab === 'fut') body = '<div class="rx-g2"><div><h4>Süreç · бу́ду + ' + esc(v.inf) + '</h4>' + conjTable(o.fut) + '</div>' +
      (v.pf ? '<div><h4>Sonuç · ' + esc(v.pf) + '</h4>' + conjTable(o.pfut) + '</div>' : '<div><p class="rx-lead">Bu fiilin listede perfektif çifti yok.</p></div>') + '</div>';
    var box = $('#rx-sheet .box');
    box.innerHTML = '<button class="rx-x" data-close>×</button><div class="rx-k">' + KTYPE[v.k] + '</div>' +
      '<div style="font-size:26px;margin:4px 0 0">' + RU(v.inf).replace('</span><span', '</span>' + spk(v.inf) + '<span') + '</div>' +
      '<p class="rx-lead" style="margin-top:6px"><b style="color:var(--text)">' + esc(v.tr) + '</b> · <span style="color:var(--rx-pl)">🇵🇱 ' + esc(v.pl) + '</span>' + (v.pf ? ' · perfektif <b style="color:var(--text)">' + esc(v.pf) + '</b>' : '') + '</p>' +
      (v.n ? '<div class="rx-note">' + esc(v.n) + '</div>' : '') +
      '<div class="rx-chips" style="margin-top:12px">' + [['pres', 'Şimdiki'], ['past', 'Geçmiş'], ['fut', 'Gelecek']].map(function (t) { return '<button class="rx-chip' + (t[0] === tab ? ' on' : '') + '" data-vt="' + t[0] + '" data-key="' + esc(key) + '">' + t[1] + '</button>'; }).join('') + '</div>' + body;
    $('#rx-sheet').classList.add('on');
  }

  /* ============ 🎨 SIFATLAR ============ */
  var afilter = 'all';
  function renderSifat(root) {
    if (!root.dataset.built) {
      root.dataset.built = '1';
      var ex = ['но́вый', 'большо́й', 'ру́сский', 'хоро́ший', 'си́ний'];
      var C = [['Yalın · кто? что?', 'но́вый', 'но́вая', 'но́вое', 'но́вые'], ['-in · кого́? чего́?', 'но́вого', 'но́вой', 'но́вого', 'но́вых'], ['-e · кому́? чему́?', 'но́вому', 'но́вой', 'но́вому', 'но́вым'], ['-i · кого́? что?', 'но́вый / -ого', 'но́вую', 'но́вое', 'но́вые / -ых'], ['ile · кем? чем?', 'но́вым', 'но́вой', 'но́вым', 'но́выми'], ['-de · о ком? о чём?', '(о) но́вом', 'но́вой', 'но́вом', 'но́вых']];
      root.innerHTML = '<div class="rx-card"><h3>Sıfatlar: 4 yalın form</h3><p class="rx-lead">Sıfat, nitelediği ismin cinsiyetine ve sayısına uyar. Hangi eki alacağını sıfatın son harfleri belirler.</p>' +
        '<table class="rx-cj"><tr><th>Tür</th><th>он</th><th>она́</th><th>оно́</th><th>они́</th></tr>' + ex.map(function (a) { return '<tr><td class="p">' + adjType(a) + '</td>' + adjForms(a).map(function (x) { return '<td>' + RU(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
        '<div class="rx-flow"><div><b class="k">г к х ж ш ч щ + ы ✗</b>Bu harflerden sonra ы yazılmaz, и yazılır: ру́сск<span class="rx-end">ие</span>, хоро́ш<span class="rx-end">ие</span></div>' +
        '<div><b class="k">ж ш ч щ + о (vurgusuz) ✗</b>Vurgusuzsa е yazılır: хоро́ш<span class="rx-end">ее</span>, ama большо́е</div>' +
        '<div><b class="k">-ой = vurgu sonda</b>молод<span class="rx-end">о́й</span>, больш<span class="rx-end">о́й</span>, дорог<span class="rx-end">о́й</span></div></div>' +
        '<div class="rx-pl"><b>nowy, nowa, nowe</b> = но́вый, но́вая, но́вое. Rusçada çoğulun tek bir formu var: но́вые (Lehçedeki nowi / nowe ayrımı yok).</div>' +
        '<details><summary>Sıfatların bütün halleri (но́вый)</summary><table class="rx-cj"><tr><th>Hal</th><th>он</th><th>она́</th><th>оно́</th><th>они́</th></tr>' +
        C.map(function (r) { return '<tr><td class="p" style="white-space:normal">' + r[0] + '</td>' + r.slice(1).map(function (x) { return '<td class="rx-ru">' + x + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</table><p class="rx-lead">Belirtme halinde (-i) canlı varlıklar için eril ve çoğulda -ого / -ых kullanılır: Я ви́жу но́в<b>ого</b> студе́нта. Lehçede de aynısı var: widzę nowego studenta.</p></details></div>' +
        '<div class="rx-bar"><input type="text" id="rx-aq" placeholder="Sıfat ara…" autocomplete="off"><button class="rx-btn" data-showall="rx-alist">Anlamları göster</button><span class="rx-count" id="rx-acount"></span></div><div class="rx-chips" id="rx-achips"></div><div class="rx-list" id="rx-alist"></div>';
      $('#rx-aq').addEventListener('input', function () { renderSifat(root); });
    }
    var q = plain($('#rx-aq').value.trim().toLowerCase());
    $('#rx-achips').innerHTML = ['all', 'sert -ый', 'vurgulu -ой', 'г/к/х + ий', 'ж/ш/ч/щ + ий', 'yumuşak -ний'].map(function (t) { return '<button class="rx-chip' + (afilter === t ? ' on' : '') + '" data-af="' + t + '">' + (t === 'all' ? 'Hepsi' : t) + '</button>'; }).join('');
    var list = ADJ.filter(function (a) { return (afilter === 'all' || adjType(a.ru) === afilter) && (!q || plain(a.ru).indexOf(q) >= 0 || a.tr.toLowerCase().indexOf(q) >= 0); });
    $('#rx-acount').textContent = list.length + ' sıfat';
    $('#rx-alist').innerHTML = list.map(function (a) { var f = adjForms(a.ru); return '<button class="rx-row"><div class="top"><div>' + RU(a.ru) + '</div><span class="rx-b rx-b-a">' + adjType(a.ru) + '</span></div><div class="hint">anlamı için dokun</div><div class="mean"><b>' + esc(a.tr) + '</b><small>' + f.slice(1).map(mono).map(esc).join(' · ') + '</small></div></button>'; }).join('');
  }

  /* ============ 📚 KELİMELER ============ */
  var wtopic = 'all', wtype = 'all';
  function renderKelime(root) {
    if (!root.dataset.built) {
      root.dataset.built = '1';
      root.innerHTML = '<div class="rx-bar"><input type="text" id="rx-wq" placeholder="Kelime ara: дом / ev / dom…" autocomplete="off"><button class="rx-btn" data-showall="rx-wlist">Anlamları göster</button><span class="rx-count" id="rx-wcount"></span></div><div class="rx-chips" id="rx-wtopics"></div><div class="rx-chips" id="rx-wtypes"></div><div class="rx-list" id="rx-wlist"></div>';
      $('#rx-wq').addEventListener('input', function () { renderKelime(root); });
    }
    var q = plain($('#rx-wq').value.trim().toLowerCase());
    $('#rx-wtopics').innerHTML = ['all'].concat(topicsOf(W)).map(function (t) { return '<button class="rx-chip' + (wtopic === t ? ' on' : '') + '" data-wt="' + esc(t) + '">' + (t === 'all' ? 'Tüm konular' : esc(t)) + '</button>'; }).join('');
    $('#rx-wtypes').innerHTML = [['all', 'Hepsi'], ['noun', 'İsimler'], ['a', 'Sıfatlar'], ['v', 'Fiiller'], ['d', 'Zarf / diğer'], ['ist', 'Çoğul istisnaları']].map(function (t) { return '<button class="rx-chip' + (wtype === t[0] ? ' on' : '') + '" data-wy="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    var list = W.filter(function (w) {
      var okT = wtype === 'all' || (wtype === 'noun' ? ['m', 'f', 'n', 'pl'].indexOf(w.c) >= 0 : wtype === 'ist' ? !!(w.pl && plKind(w)) : wtype === 'd' ? (w.c === 'd' || w.c === 'p') : w.c === wtype);
      return (wtopic === 'all' || w.t === wtopic) && okT && (!q || plain(w.ru).toLowerCase().indexOf(q) >= 0 || w.tr.toLowerCase().indexOf(q) >= 0 || translit(w.ru).replace(/<\/?b>/g, '').toLowerCase().indexOf(q) >= 0);
    });
    $('#rx-wcount').textContent = list.length + ' kelime';
    $('#rx-wlist').innerHTML = list.map(function (w) {
      var k = w.pl && plKind(w), vb = w.c === 'v' && VBYINF[plain(w.ru)];
      return '<button class="rx-row"' + (vb ? ' data-verb="' + esc(plain(w.ru)) + '"' : '') + '><div class="top"><div>' + RU(w.ru) + '</div><span class="rx-b rx-b-' + w.c + '">' + GL[w.c] + '</span></div><div class="hint">' + (vb ? 'çekimi görmek için dokun' : 'anlamı için dokun') + '</div><div class="mean"><b>' + esc(w.tr) + '</b>' + (w.pl ? '<small>çoğul: ' + esc(mono(w.pl)) + (k ? '<span class="rx-ist">istisna · ' + k + '</span>' : '') + '</small>' : '') + '</div></button>';
    }).join('');
  }

  /* ============ 🃏 KARTLAR ============ */
  var fdeck = 'w', ftopic = 'all', fcards = [], fi = 0;
  function buildDeck() {
    if (fdeck === 'w') fcards = W.filter(function (w) { return w.c !== 'v' && (ftopic === 'all' || w.t === ftopic); }).map(function (w) { return { f: w.ru, b: w.tr, x: w.pl ? 'çoğul: ' + mono(w.pl) : GL[w.c] }; });
    if (fdeck === 'v') fcards = VB.map(function (v) { var o = V(v); return { f: v.inf, b: v.tr, x: o.pres ? 'я ' + o.pres[0] + ' · ты ' + o.pres[1] + ' · они́ ' + o.pres[5] : 'geçmiş: ' + o.past.join(', ') }; });
    if (fdeck === 'a') fcards = ADJ.map(function (a) { return { f: a.ru, b: a.tr, x: adjForms(a.ru).slice(1).map(mono).join(' · ') }; });
    if (fdeck === 'p') fcards = PLIRR.map(function (w) { return { f: w.ru, b: w.pl, x: w.tr + ' · ' + plKind(w), rb: true }; });
    fcards = shuffle(fcards); fi = 0; showCard();
  }
  function showCard() {
    var c = fcards[fi], fc = $('#rx-fc'); if (!fc) return;
    fc.classList.remove('flip');
    $('#rx-fpos').textContent = fcards.length ? (fi + 1) + ' / ' + fcards.length + ' · karta dokununca döner' : 'Kart yok';
    if (!c) { $('#rx-ffront').innerHTML = ''; $('#rx-fback').innerHTML = ''; return; }
    var f = mono(c.f);
    $('#rx-ffront').innerHTML = '<div class="big">' + esc(f) + '</div><div class="rx-tl">' + translit(f) + '</div><div class="extra">' + (fdeck === 'p' ? 'Çoğulu ne?' : 'Anlamı ne?') + '</div>';
    setTimeout(function () {
      var b = mono(c.b);
      $('#rx-fback').innerHTML = c.rb ? '<div class="big">' + esc(b) + '</div><div class="rx-tl">' + translit(b) + '</div><div class="extra">' + esc(c.x) + '</div>' : '<div class="meaning">' + esc(c.b) + '</div><div class="extra">' + esc(mono(c.x)) + '</div>';
    }, 150);
  }
  function renderKart(root) {
    if (!root.dataset.built) {
      root.dataset.built = '1';
      root.innerHTML = '<div class="rx-chips" id="rx-fdecks"></div><div class="rx-chips" id="rx-ftopics"></div>' +
        '<div class="rx-fcw"><div class="rx-fc" id="rx-fc"><div class="face front" id="rx-ffront"></div><div class="face back" id="rx-fback"></div></div></div>' +
        '<div class="rx-ctrl"><button class="rx-btn" data-fc="prev">←</button><button class="rx-btn pri" data-fc="flip">Çevir</button><button class="rx-btn" data-fc="next">→</button><button class="rx-btn" data-fc="say">🔊</button><button class="rx-btn" data-fc="shuf">🔀 Karıştır</button></div>' +
        '<p class="rx-count" style="text-align:center" id="rx-fpos"></p>';
      $('#rx-fc').addEventListener('click', function () { this.classList.toggle('flip'); });
      buildDeck();
    }
    $('#rx-fdecks').innerHTML = [['w', '📚 Kelimeler'], ['v', '🔤 Fiiller'], ['a', '🎨 Sıfatlar'], ['p', '⚠️ Çoğul istisnaları']].map(function (d) { return '<button class="rx-chip' + (fdeck === d[0] ? ' on' : '') + '" data-fd="' + d[0] + '">' + d[1] + '</button>'; }).join('');
    $('#rx-ftopics').style.display = fdeck === 'w' ? 'flex' : 'none';
    $('#rx-ftopics').innerHTML = ['all'].concat(topicsOf(W.filter(function (w) { return w.c !== 'v'; }))).map(function (t) { return '<button class="rx-chip' + (ftopic === t ? ' on' : '') + '" data-ft="' + esc(t) + '">' + (t === 'all' ? 'Tüm konular' : esc(t)) + '</button>'; }).join('');
  }

  /* ============ ✅ TEST ============ */
  var MODES = [['mix', '🎲 Karışık'], ['anlam', 'Kelime anlamı'], ['simdi', 'Şimdiki zaman'], ['gecmis', 'Geçmiş zaman'], ['gelecek', 'Gelecek zaman'], ['sifat', 'Sıfat uyumu'], ['cogul', 'Çoğul'], ['cins', 'Cinsiyet']];
  var qmode = 'mix', qs = [], qi = 0, qok = 0, qwrong = [];
  function optRU(s, info) { s = mono(s); return { h: '<span class="rx-ru">' + esc(s) + '</span><span class="rx-tl">' + translit(s) + '</span>', info: info }; }
  function ext(o, more) { for (var k in more) o[k] = more[k]; return o; }
  function pickNear(pool, target, n, key) {
    var t = key(target).length;
    return shuffle(pool.filter(function (x) { return x !== target && key(x) !== key(target); }))
      .sort(function (a, b) { return Math.abs(key(a).length - t) - Math.abs(key(b).length - t); }).slice(0, 12)
      .sort(function () { return Math.random() - 0.5; }).slice(0, n);
  }
  var GEN = {
    anlam: function () {
      var pool = W.filter(function (w) { return w.c !== 'p'; }), w = rnd(pool);
      var grp = function (c) { return ['m', 'f', 'n', 'pl'].indexOf(c) >= 0 ? 'noun' : c; };
      var ds = pickNear(pool.filter(function (x) { return grp(x.c) === grp(w.c); }), w, 2, function (x) { return x.tr; });
      return { k: 'Kelime anlamı', q: RU(w.ru) + '<div class="rx-lead" style="margin-top:8px">Bu kelime ne demek?</div>',
        o: shuffle([{ h: esc(w.tr), ok: 1, info: mono(w.ru) }].concat(ds.map(function (d) { return { h: esc(d.tr), info: mono(d.ru) }; }))),
        e: '<b>' + esc(mono(w.ru)) + '</b> = ' + esc(w.tr) + ' · ' + GL[w.c] + (w.pl ? ' · çoğul: ' + esc(mono(w.pl)) : '') };
    },
    simdi: function () {
      var v = rnd(VB.filter(function (v) { return V(v).pres; })), f = V(v).pres, i = Math.floor(Math.random() * 6);
      var others = shuffle(uniq(f.filter(function (x) { return x !== f[i]; }))).slice(0, 2);
      return { k: 'Şimdiki zaman · ' + KTYPE[v.k], q: RU(v.inf) + '<div style="margin-top:10px">' + PRON[i] + ' <span class="rx-end">___</span> ?</div>',
        o: shuffle([ext(optRU(f[i], PRON[i]), { ok: 1 })].concat(others.map(function (o) { return optRU(o, PRON[f.indexOf(o)]); }))),
        e: esc(v.tr) + '. ' + PRON[i] + ' <b>' + esc(f[i]) + '</b>' + (v.n ? '<br>' + esc(v.n) : '') };
    },
    gecmis: function () {
      var v = rnd(VB), o = V(v);
      var s = rnd([['Он', 0, 'erkek'], ['Она́', 1, 'kadın'], ['Они́', 3, 'çoğul'], ['Мы', 3, 'çoğul'], ['Я (Ольга)', 1, 'kadın'], ['Я (Ахмед)', 0, 'erkek']]), i = s[1];
      var ds = uniq([0, 1, 3].map(function (j) { return o.past[j]; })).filter(function (x) { return x !== o.past[i]; });
      if (Math.random() < 0.4 && o.pres) { ds.length = 1; ds.push(o.pres[i === 3 ? 5 : 2]); }
      var lbl = function (x) { return x === o.past[0] ? 'eril' : x === o.past[1] ? 'dişil' : x === o.past[3] ? 'çoğul' : 'şimdiki zaman!'; };
      return { k: 'Geçmiş zaman', q: RU(v.inf) + '<div style="margin-top:10px">Вчера́ ' + s[0] + ' <span class="rx-end">___</span>.</div>',
        o: shuffle([ext(optRU(o.past[i], lbl(o.past[i])), { ok: 1 })].concat(ds.slice(0, 2).map(function (d) { return optRU(d, lbl(d)); }))),
        e: 'Özne ' + s[2] + ' → <b>' + esc(o.past[i]) + '</b>. Geçmiş zamanda kişi eki yok, cinsiyet ve sayı eki var.' };
    },
    gelecek: function () {
      var v = rnd(VB.filter(function (v) { return v.pf && V(v).pres; })), o = V(v), i = rnd([0, 1, 3, 5]);
      if (Math.random() < 0.5) {
        return { k: 'Gelecek zaman · süreç', q: RU(v.inf) + '<div class="rx-lead" style="margin-top:6px">' + esc(v.tr) + ' · süreç olarak (devam eden iş)</div><div style="margin-top:8px">За́втра ' + PRON[i] + ' <span class="rx-end">___</span>.</div>',
          o: shuffle([ext(optRU(o.fut[i], 'бу́ду + mastar ✓'), { ok: 1 }), optRU(BUDU[i] + ' ' + o.pres[i], 'бу́ду + çekimli fiil ✗'), optRU(o.fut[(i + 2) % 6], 'kişi uymuyor ✗')]),
          e: 'İmperfektif gelecek: <b>бу́ду / бу́дешь… + mastar</b> (Lehçe będę ' + esc(v.pl.split(',')[0]) + ').' };
      }
      return { k: 'Gelecek zaman · sonuç', q: RU(v.pf) + '<div style="margin-top:10px">За́втра ' + PRON[i] + ' <span class="rx-end">___</span>.</div>',
        o: shuffle([ext(optRU(o.pfut[i], 'perfektif çekim = gelecek ✓'), { ok: 1 }), optRU(BUDU[i] + ' ' + v.pf, 'perfektif + бу́ду olmaz ✗'), optRU(o.pfpast[i === 3 || i === 5 ? 3 : 0], 'bu geçmiş zaman ✗')]),
        e: 'Perfektif fiil şimdiki zaman gibi çekilir ama anlamı gelecektir: <b>' + esc(o.pfut[i]) + '</b>.' };
    },
    sifat: function () {
      var AJ = ['но́вый', 'ста́рый', 'большо́й', 'ма́ленький', 'хоро́ший', 'плохо́й', 'краси́вый', 'интере́сный', 'ру́сский', 'си́ний', 'ле́тний', 'дома́шний', 'све́жий', 'дорого́й', 'зелёный', 'чи́стый', 'удо́бный', 'совреме́нный', 'молодо́й', 'мя́гкий'];
      var a = rnd(AJ), aw = W.filter(function (w) { return w.ru === a; })[0], f = adjForms(a);
      var n = rnd(NOUNS.filter(function (x) { return x.t !== 'Kitap sözlüğü'; })), gi = { m: 0, f: 1, n: 2 }[n.c], noun = n.ru, why = GL[n.c];
      if (n.pl && Math.random() < 0.3) { gi = 3; noun = n.pl; why = 'çoğul'; }
      var L = ['eril', 'dişil', 'nötr', 'çoğul'];
      var ds = shuffle([0, 1, 2, 3].filter(function (j) { return j !== gi && f[j] !== f[gi]; })).slice(0, 2);
      return { k: 'Sıfat uyumu', q: '<div class="rx-lead">' + esc(aw ? aw.tr : '') + ' + ' + esc(n.tr) + '</div><span class="rx-end">___</span> ' + RU(noun),
        o: shuffle([ext(optRU(f[gi], L[gi]), { ok: 1 })].concat(ds.map(function (j) { return optRU(f[j], L[j]); }))),
        e: esc(plain(noun)) + ' ' + why + ' → <b>' + esc(f[gi]) + ' ' + esc(mono(noun)) + '</b>' };
    },
    cogul: function () {
      var w = Math.random() < 0.6 ? rnd(PLIRR) : rnd(PLN), k = plKind(w), ok = plain(w.pl), r = regPl(plain(w.ru)), ds = [];
      if (k) ds.push(r);
      var sw = function (s) { return /ы$/.test(s) ? s.slice(0, -1) + 'и' : /и$/.test(s) ? s.slice(0, -1) + 'ы' : /а$/.test(s) ? s.slice(0, -1) + 'ы' : /я$/.test(s) ? s.slice(0, -1) + 'и' : s + 'ы'; };
      [sw(ok), sw(r), plain(w.ru) + 'а', plain(w.ru) + 'ы', ok.slice(0, -1) + 'ов'].forEach(function (c) { if (ds.length < 2 && c !== ok && ds.indexOf(c) < 0) ds.push(c); });
      return { k: 'Çoğul', q: RU(w.ru) + '<div class="rx-lead" style="margin-top:8px">' + esc(w.tr) + ' · çoğulu hangisi?</div>',
        o: shuffle([{ h: '<span class="rx-ru">' + esc(ok) + '</span>', ok: 1, info: k ? 'istisna · ' + k : 'kurala uygun' }].concat(ds.map(function (d) { return { h: '<span class="rx-ru">' + esc(d) + '</span>', info: d === r && k ? 'kurala göre olurdu, ama istisna' : 'yanlış' }; }))),
        e: esc(mono(w.ru)) + ' → <b>' + esc(mono(w.pl)) + '</b>' + (k ? ' <span class="rx-ist">' + k + '</span>' : '') };
    },
    cins: function () {
      var w = rnd(NOUNS.filter(function (w) { return !/ь$/.test(plain(w.ru)) || Math.random() < 0.5; })), s = plain(w.ru);
      var why = /ь$/.test(s) ? '-ь ile bitiyor, ezberlemek gerekiyor' : /мя$/.test(s) ? '-мя ile biten isimler nötr' : ['папа', 'дедушка', 'дядя'].indexOf(s) >= 0 ? 'anlamca erkek olduğu için eril' : s === 'кофе' ? 'istisna: ко́фе eril' : /[ая]$/.test(s) ? '-а / -я → dişil' : /[оеё]$/.test(s) ? '-о / -е → nötr' : 'ünsüz / -й → eril';
      return { k: 'Cinsiyet', q: RU(w.ru) + '<div class="rx-lead" style="margin-top:8px">' + esc(w.tr) + ' · cinsiyeti ne?</div>',
        o: [['m', 'eril · он', 'мой'], ['f', 'dişil · она', 'моя́'], ['n', 'nötr · оно', 'моё']].map(function (x) { return { h: x[1], ok: x[0] === w.c ? 1 : 0, info: x[2] + ' ' + s }; }),
        e: esc(mono(w.ru)) + ' → <b>' + GL[w.c] + '</b> (' + why + ')' };
    }
  };
  function newRound(list) {
    var keys = Object.keys(GEN);
    qs = list || Array.from({ length: 10 }, function () { return GEN[qmode === 'mix' ? rnd(keys) : qmode](); });
    qi = 0; qok = 0; qwrong = []; showQ();
  }
  function showQ() {
    $('#rx-qbar').style.width = (qi / qs.length * 100) + '%';
    var box = $('#rx-qbox');
    if (qi >= qs.length) {
      var pct = Math.round(qok / qs.length * 100);
      box.innerHTML = '<div class="rx-qc rx-pop" style="text-align:center"><div class="rx-k">Tur bitti</div><div class="rx-score">' + qok + ' / ' + qs.length + '</div><p class="rx-lead">' +
        (pct >= 90 ? 'Mükemmel! 🔥' : pct >= 70 ? 'Çok iyi, devam!' : pct >= 50 ? 'İyi gidiyor, yanlışlara bir daha bak.' : '«📐 Fiil & Zaman» sekmesine kısa bir göz atıp tekrar dene.') +
        '</p><div class="rx-ctrl">' + (qwrong.length ? '<button class="rx-btn" data-q="retry">↺ Yanlışları tekrar et</button>' : '') + '<button class="rx-btn pri" data-q="new">Yeni tur</button></div></div>';
      return;
    }
    var q = qs[qi];
    box.innerHTML = '<div class="rx-qc" id="rx-qc"><div class="rx-k">' + esc(q.k) + ' · ' + (qi + 1) + '/' + qs.length + '</div><div class="rx-qq">' + q.q + '</div>' +
      '<div class="rx-opts">' + q.o.map(function (o, j) { return '<button class="rx-opt" data-j="' + j + '">' + o.h + (o.info ? '<span class="info">' + esc(o.info) + '</span>' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="rx-exp">' + q.e + '</div><div class="rx-qnav"><span class="rx-count" id="rx-qok">✓ ' + qok + '</span><button class="rx-btn pri" data-q="next" id="rx-qnext" style="visibility:hidden">Sonraki →</button></div></div>';
  }
  function answer(j) {
    var q = qs[qi], c = $('#rx-qc'); if (!c || c.classList.contains('done')) return;
    c.classList.add('done');
    var btns = c.querySelectorAll('.rx-opt');
    btns.forEach(function (b, k) { b.disabled = true; if (q.o[k].ok) b.classList.add('ok'); });
    if (q.o[j].ok) { qok++; c.classList.add('rx-pop'); xp(1, 'Rusça test'); }
    else { btns[j].classList.add('bad'); c.classList.add('rx-shake'); qwrong.push(q); }
    $('#rx-qok').textContent = '✓ ' + qok;
    $('#rx-qnext').style.visibility = 'visible';
  }
  function renderTest(root) {
    if (!root.dataset.built) {
      root.dataset.built = '1';
      root.innerHTML = '<div class="rx-qw"><div class="rx-chips" id="rx-qmodes"></div><div class="rx-qbar"><i id="rx-qbar"></i></div><div id="rx-qbox"></div></div>';
      newRound();
    }
    $('#rx-qmodes').innerHTML = MODES.map(function (m) { return '<button class="rx-chip' + (qmode === m[0] ? ' on' : '') + '" data-qm="' + m[0] + '">' + m[1] + '</button>'; }).join('');
  }

  /* ---------- olaylar ---------- */
  var RENDER = { kural: renderKural, fiiller: renderFiil, sifat: renderSifat, kelime: renderKelime, kart: renderKart, test: renderTest };
  function root(id) { return document.getElementById('rx-' + id); }
  function show(id) {
    var r = root(id); if (!r || !RENDER[id]) return;
    if (id === 'kural') { if (!r.dataset.built) { r.dataset.built = '1'; renderKural(r); } return; }
    RENDER[id](r);
  }

  function onClick(e) {
    var t = e.target.closest('button');
    if (!t) { if (e.target.id === 'rx-sheet') $('#rx-sheet').classList.remove('on'); return; }
    var inRx = t.closest('.rx, .rx-sheet'); if (!inRx) return;
    var d = t.dataset;
    if (d.say) { speak(d.say); return; }
    if (d.close !== undefined) { $('#rx-sheet').classList.remove('on'); return; }
    if (d.vt) { openVerb(d.key, d.vt); return; }
    if (d.verb) { openVerb(d.verb); return; }
    if (d.vf) { vfilter = d.vf; show('fiiller'); return; }
    if (d.af) { afilter = d.af; show('sifat'); return; }
    if (d.wt) { wtopic = d.wt; show('kelime'); return; }
    if (d.wy) { wtype = d.wy; show('kelime'); return; }
    if (d.showall) { var l = document.getElementById(d.showall); l.classList.toggle('rx-all'); t.textContent = l.classList.contains('rx-all') ? 'Anlamları gizle' : 'Anlamları göster'; return; }
    if (t.classList.contains('rx-row')) { t.classList.toggle('open'); return; }
    if (d.fd) { fdeck = d.fd; show('kart'); buildDeck(); return; }
    if (d.ft) { ftopic = d.ft; show('kart'); buildDeck(); return; }
    if (d.fc === 'flip') { $('#rx-fc').classList.toggle('flip'); return; }
    if (d.fc === 'next') { fi = (fi + 1) % Math.max(fcards.length, 1); showCard(); return; }
    if (d.fc === 'prev') { fi = (fi - 1 + fcards.length) % Math.max(fcards.length, 1); showCard(); return; }
    if (d.fc === 'shuf') { buildDeck(); return; }
    if (d.fc === 'say') { if (fcards[fi]) speak(fcards[fi].f); return; }
    if (d.qm) { qmode = d.qm; show('test'); newRound(); return; }
    if (d.j !== undefined && t.classList.contains('rx-opt')) { answer(+d.j); return; }
    if (d.q === 'next') { qi++; showQ(); return; }
    if (d.q === 'new') { newRound(); return; }
    if (d.q === 'retry') { newRound(shuffle(qwrong)); return; }
  }
  function onKey(e) {
    if (e.key === 'Escape') { var s = $('#rx-sheet'); if (s) s.classList.remove('on'); }
    var tsec = document.getElementById('ru-test');
    if (!tsec || !tsec.classList.contains('active') || !tsec.offsetParent || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (['1', '2', '3'].indexOf(e.key) >= 0) { var b = document.querySelectorAll('#rx-qc .rx-opt')[+e.key - 1]; if (b && !b.disabled) answer(+e.key - 1); }
    if (e.key === 'Enter') { var n = $('#rx-qnext'); if (n && n.style.visibility === 'visible') { e.preventDefault(); qi++; showQ(); } }
  }

  function init() {
    var st = document.createElement('style'); st.id = 'rx-css'; st.textContent = CSS; document.head.appendChild(st);
    var sh = document.createElement('div'); sh.className = 'rx-sheet'; sh.id = 'rx-sheet'; sh.innerHTML = '<div class="box"></div>'; document.body.appendChild(sh);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.RUX = { show: show, data: { words: W.length, verbs: VB.length } };
})();
