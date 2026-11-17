/* ═══════════════════════════════════════════════════════════════
   POLONICA · HAREKET KATMANI
   iOS benzeri yumuşak geçişler: panel girişleri, kademeli liste
   açılışı, kayan menü işareti, imleci takip eden ışık, hafif eğim,
   basınca yaylanan butonlar.

   Ayar: html[data-motion] = "full" (varsayılan) | "lite" | "off"
   - Sistemde "hareketi azalt" açıksa varsayılan "lite" olur.
   - Ayarlar > Animasyon'dan değiştirilir (localStorage: polonica_motion).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(.22,1,.36,1)';        // iOS benzeri "ease-out-quint"
  var SPRING = 'cubic-bezier(.34,1.56,.64,1)';    // hafif yaylanma

  var CSS = [
    /* ── Panel girişi: bulanıklıktan netleşerek, hafif yukarı kayarak ── */
    'html[data-motion="full"] .panel.active{animation:mxPanelIn .55s ' + EASE + ' both!important;}',
    'html[data-motion="lite"] .panel.active{animation:mxFade .25s ease both!important;}',
    'html[data-motion="off"] .panel.active{animation:none!important;}',
    '@keyframes mxPanelIn{from{opacity:0;transform:translateY(14px) scale(.992);filter:blur(6px);}to{opacity:1;transform:none;filter:none;}}',
    '@keyframes mxFade{from{opacity:0;}to{opacity:1;}}',

    /* ── Kademeli açılış: panelin ilk seviye öğeleri sırayla gelir ── */
    'html[data-motion="full"] .mx-stagger>*{animation:mxRise .6s ' + EASE + ' both;animation-delay:calc(var(--mx-i,0) * 45ms + 60ms);}',
    '@keyframes mxRise{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}',

    /* ── Butonlar: üstüne gelince hafif kalkar, basınca yaylanarak çöker ── */
    'html[data-motion="full"] :is(.btn,.gtab,.special-tab,.ru-tab,.kultur-cat-btn,.sh-btn,.theme-mode-btn,.custom-theme-btn){transition:transform .35s ' + SPRING + ',background-color .2s,border-color .2s,color .2s,box-shadow .3s ' + EASE + '!important;will-change:transform;}',
    'html[data-motion="full"] :is(.btn,.gtab,.special-tab,.ru-tab,.kultur-cat-btn,.sh-btn):hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px -8px color-mix(in srgb,var(--accent) 45%,transparent);}',
    'html[data-motion="full"] :is(.btn,.gtab,.special-tab,.ru-tab,.kultur-cat-btn,.sh-btn,.nav-btn,.custom-theme-btn,.sh-card,.word-card):active:not(:disabled){transform:scale(.965)!important;transition-duration:.08s!important;}',

    /* ── Parlama: birincil butonların üstünden ince bir ışık geçer ── */
    'html[data-motion="full"] :is(.btn-accent,.btn-teal,.sh-btn.pri,.btn-green){position:relative;overflow:hidden;}',
    'html[data-motion="full"] :is(.btn-accent,.btn-teal,.sh-btn.pri,.btn-green)::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.22) 50%,transparent 70%);transform:translateX(-120%);pointer-events:none;}',
    'html[data-motion="full"] :is(.btn-accent,.btn-teal,.sh-btn.pri,.btn-green):hover::after{transform:translateX(120%);transition:transform .8s ' + EASE + ';}',

    /* ── İmleci takip eden ışık (kartlar ve büyük butonlar) ── */
    'html[data-motion="full"] .mx-spot{background-image:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),color-mix(in srgb,var(--accent) var(--mx-a,0%),transparent),transparent 65%)!important;transition:--mx-a .3s;}',
    'html[data-motion="full"] .mx-spot:hover{--mx-a:13%;}',
    '@property --mx-a{syntax:"<percentage>";inherits:false;initial-value:0%;}',

    /* ── Hafif 3B eğim (büyük kartlar) ── */
    'html[data-motion="full"] .mx-tilt{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--ty,0px));transition:transform .5s ' + EASE + ',box-shadow .4s ' + EASE + ',border-color .2s!important;}',
    'html[data-motion="full"] .mx-tilt:hover{--ty:-3px;box-shadow:0 18px 40px -18px rgba(0,0,0,.45);}',

    /* ── Menü: seçili sekmenin arkasında kayan işaret ── */
    '.mx-pill{position:absolute;left:10px;right:10px;top:0;height:0;border-radius:9px;pointer-events:none;z-index:0;opacity:0;background:var(--mx-pill-bg,var(--surface3));box-shadow:inset 3px 0 0 var(--mx-pill-mark,var(--accent));}',
    'html[data-motion="full"] .mx-pill{transition:transform .5s ' + SPRING + ',height .35s ' + EASE + ',opacity .25s;}',
    'html[data-motion="lite"] .mx-pill{transition:transform .2s ease,height .2s ease,opacity .2s;}',
    'html.mx-has-pill #sidebar .nav-btn{position:relative;z-index:1;}',
    'html.mx-has-pill #sidebar .nav-btn.active{background:transparent!important;box-shadow:none!important;}',
    'html[data-motion="full"] #sidebar .nav-btn{transition:color .2s,background-color .2s,transform .35s ' + SPRING + '!important;}',
    'html[data-motion="full"] #sidebar .nav-btn:hover:not(.active){transform:translateX(3px);}',

    /* ── Açılır pencereler: yaylanarak büyür ── */
    'html[data-motion="full"] .modal-overlay[style*="flex"] .modal-box,html[data-motion="full"] .modal-overlay[style*="block"] .modal-box{animation:mxPop .45s ' + SPRING + ' both;}',
    'html[data-motion="full"] .modal-overlay[style*="flex"],html[data-motion="full"] .modal-overlay[style*="block"]{animation:mxFade .25s ease both;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}',
    '@keyframes mxPop{from{opacity:0;transform:translateY(10px) scale(.96);}to{opacity:1;transform:none;}}',

    /* ── Doğru/yanlış cevap geri bildirimi ── */
    'html[data-motion="full"] :is(.mc-opt.correct,.sv-opt.ok,.ru-opt.ok){animation:mxGood .5s ' + SPRING + ';}',
    'html[data-motion="full"] :is(.mc-opt.wrong,.sv-opt.bad,.ru-opt.bad){animation:mxShake .4s ' + EASE + ';}',
    '@keyframes mxGood{0%{transform:scale(1);}40%{transform:scale(1.03);}100%{transform:scale(1);}}',
    '@keyframes mxShake{0%,100%{transform:none;}20%{transform:translateX(-5px);}40%{transform:translateX(5px);}60%{transform:translateX(-3px);}80%{transform:translateX(2px);}}',

    /* ── Genel: yumuşak kaydırma ve odak halkası ── */
    'html[data-motion="full"]{scroll-behavior:smooth;}',
    'html[data-motion="full"] :focus-visible{outline:2px solid var(--accent);outline-offset:2px;transition:outline-offset .2s ' + EASE + ';}',

    /* ── Kapalı modda her şey anında ── */
    'html[data-motion="off"] *,html[data-motion="off"] *::before,html[data-motion="off"] *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important;}',

    /* ── Ayar düğmeleri ── */
    '.mx-seg{display:flex;gap:6px;}',
    '.mx-seg button{flex:1;padding:8px 10px;border-radius:9px;border:1px solid var(--border2);background:var(--surface2);color:var(--text2);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;}',
    '.mx-seg button.on{border-color:var(--accent);color:var(--accent-text,var(--accent));background:var(--accent-bg);}'
  ].join('\n');

  var SPOT = '.word-card,.sh-card,.sh-file,.custom-theme-btn,.kultur-card,.theme-word-card,.theme-cat-card,.btn,.gtab,.special-tab,.stat-card';
  var TILT = '.sh-card,.custom-theme-btn,.theme-word-card,.kultur-card';
  var root = document.documentElement;

  function mode() { return root.getAttribute('data-motion') || 'full'; }

  function setMotion(m) {
    root.setAttribute('data-motion', m);
    try { localStorage.setItem('polonica_motion', m); } catch (e) {}
    document.querySelectorAll('[data-mx-set]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mx-set') === m); });
    movePill();
  }
  window.setMotion = setMotion;

  function initMode() {
    var saved = null;
    try { saved = localStorage.getItem('polonica_motion'); } catch (e) {}
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.setAttribute('data-motion', saved || (reduce ? 'lite' : 'full'));
  }

  /* ── Kayan menü işareti ── */
  var pill = null;
  function movePill() {
    var sb = document.getElementById('sidebar');
    if (!sb) return;
    if (!pill) {
      if (getComputedStyle(sb).position === 'static') sb.style.position = 'relative';
      pill = document.createElement('div'); pill.className = 'mx-pill';
      sb.insertBefore(pill, sb.firstChild);
      root.classList.add('mx-has-pill');
    }
    var act = sb.querySelector('.nav-btn.active');
    if (!act || act.offsetParent === null) { pill.style.opacity = '0'; return; }
    // Temanın seçili sekme zeminini ve işaret rengini kullan
    pill.style.setProperty('--mx-pill-bg', 'var(--side-active, var(--surface3))');
    pill.style.setProperty('--mx-pill-mark', 'var(--side-mark, var(--accent))');
    // Konum, kenar çubuğuna göre ölçülür (offsetTop sarmalayıcılara göre yanılabiliyor)
    var sr = sb.getBoundingClientRect(), ar = act.getBoundingClientRect();
    var top = ar.top - sr.top + sb.scrollTop - sb.clientTop;
    var left = ar.left - sr.left + sb.scrollLeft - sb.clientLeft;
    pill.style.transform = 'translateY(' + top + 'px)';
    pill.style.height = ar.height + 'px';
    pill.style.left = left + 'px';
    pill.style.width = ar.width + 'px';
    pill.style.right = 'auto';
    pill.style.opacity = '1';
  }

  /* ── Kademeli açılış ── */
  function stagger(panel) {
    if (!panel || mode() !== 'full') return;
    var kids = Array.prototype.slice.call(panel.children).filter(function (k) { return k.offsetParent !== null; }).slice(0, 14);
    kids.forEach(function (k, i) { k.style.setProperty('--mx-i', i); });
    panel.classList.remove('mx-stagger'); void panel.offsetWidth; panel.classList.add('mx-stagger');
    clearTimeout(panel._mxT);
    panel._mxT = setTimeout(function () { panel.classList.remove('mx-stagger'); }, 1400);
  }

  function wrapShowPanel() {
    if (typeof window.showPanel !== 'function' || window.showPanel._mx) return;
    var orig = window.showPanel;
    var wrapped = function (name) {
      var r = orig.apply(this, arguments);
      requestAnimationFrame(function () {
        movePill();
        stagger(document.getElementById('panel-' + name));
      });
      return r;
    };
    wrapped._mx = true;
    window.showPanel = wrapped;
  }

  /* ── İmleç ışığı ve eğim (tek dinleyici, kare başına bir güncelleme) ── */
  var pending = null, lastTilt = null;
  function onMove(e) {
    if (mode() !== 'full' || e.pointerType === 'touch') return;
    pending = e;
    if (onMove._raf) return;
    onMove._raf = requestAnimationFrame(function () {
      onMove._raf = 0;
      var ev = pending; if (!ev) return;
      var t = ev.target && ev.target.closest ? ev.target.closest(SPOT) : null;
      if (t && !t._mxSkip) {
        if (!t.classList.contains('mx-spot')) {
          // Kendi degrade zemini olan öğelere dokunma
          if (getComputedStyle(t).backgroundImage !== 'none') { t._mxSkip = true; t = null; }
          else t.classList.add('mx-spot');
        }
      } else t = null;
      if (t) {
        var r = t.getBoundingClientRect();
        t.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        t.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      }
      var tt = ev.target && ev.target.closest ? ev.target.closest(TILT) : null;
      if (lastTilt && lastTilt !== tt) { lastTilt.style.setProperty('--rx', '0deg'); lastTilt.style.setProperty('--ry', '0deg'); }
      if (tt) {
        if (!tt.classList.contains('mx-tilt')) tt.classList.add('mx-tilt');
        var b = tt.getBoundingClientRect();
        var px = (ev.clientX - b.left) / b.width - .5, py = (ev.clientY - b.top) / b.height - .5;
        tt.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
        tt.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
      }
      lastTilt = tt;
    });
  }

  function boot() {
    var s = document.createElement('style'); s.id = 'mx-css'; s.textContent = CSS;
    document.head.appendChild(s);
    initMode();
    wrapShowPanel();
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', function () { if (lastTilt) { lastTilt.style.setProperty('--rx', '0deg'); lastTilt.style.setProperty('--ry', '0deg'); } }, true);
    window.addEventListener('resize', function () { requestAnimationFrame(movePill); });
    // Tema değişince kenar çubuğu boyutları değişebilir
    new MutationObserver(function () { requestAnimationFrame(movePill); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    // Fontlar, XP kartı ya da menü içeriği değişip menüyü kaydırırsa işaret de takip etsin
    var sb = document.getElementById('sidebar');
    var queue = function () { cancelAnimationFrame(queue._r); queue._r = requestAnimationFrame(movePill); };
    if (sb && window.ResizeObserver) {
      var ro = new ResizeObserver(queue);
      ro.observe(sb);
      Array.prototype.forEach.call(sb.children, function (c) { ro.observe(c); });
    }
    if (sb) new MutationObserver(queue).observe(sb, { childList: true, subtree: true, characterData: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
    setTimeout(movePill, 300);
    setTimeout(movePill, 1500);
    document.querySelectorAll('[data-mx-set]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mx-set') === mode()); });
  }

  initMode();  // ilk boyamadan önce
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  // showPanel ana script'te tanımlanıyor; yüklendikten sonra da sarmala
  window.addEventListener('load', function () { wrapShowPanel(); movePill(); });
})();
