#!/usr/bin/env node
/*
 * Polonica tema kontrolü
 *   node scripts/tema-kontrol.js           → her temanın okunurluk (kontrast) raporu
 *   node scripts/tema-kontrol.js --strict  → eşik altı varsa hata koduyla çıkar
 *
 * Temalar public/index.html içindeki ":root{...}" ve '[data-theme="x"]{...}' bloklarından okunur.
 * Eşikler WCAG: normal yazı 4.5, soluk/küçük yardımcı yazı ve vurgu 3.0.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));

const REQUIRED = ['bg', 'surface', 'surface2', 'surface3', 'border', 'border2', 'accent', 'accent-dim', 'accent-bg',
  'text', 'text2', 'text3', 'green', 'green-bg', 'red', 'red-bg', 'blue', 'blue-bg', 'purple', 'purple-bg', 'pink', 'pink-bg', 'teal', 'teal-bg'];

function vars(selectorRe) {
  const out = {};
  const re = new RegExp(selectorRe + '\\s*\\{([^}]*)\\}', 'g');
  let m;
  while ((m = re.exec(css))) {
    m[1].replace(/--([a-z0-9-]+)\s*:\s*([^;]+);?/gi, (_, k, v) => { out[k] = v.trim(); });
  }
  return out;
}

function hex(c) {
  c = (c || '').trim();
  let m = c.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map(x => x + x).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }
  m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) return m[1].split(',').slice(0, 3).map(x => parseFloat(x));
  return null;
}
function lum(rgb) {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function mix(a, b, t) { return a.map((v, i) => Math.round(v * t + b[i] * (1 - t))); }

const base = vars(':root');
const names = [...new Set([...css.matchAll(/\[data-theme="([a-z0-9]+)"\]\s*\{/g)].map(m => m[1]))];
const themes = [['dark', {}], ...names.map(n => [n, vars('\\[data-theme="' + n + '"\\]')])];

const CHECKS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface2', 4.5],
  ['text2', 'surface', 4.5], ['text2', 'surface2', 4.5],
  ['text3', 'surface', 3.0], ['accent', 'surface', 3.0], ['accent', 'surface2', 3.0],
];

let fails = 0;
for (const [name, own] of themes) {
  const v = Object.assign({}, base, own);
  const missing = REQUIRED.filter(k => !(k in own) && name !== 'dark');
  const col = {};
  for (const k of REQUIRED) col[k] = hex(v[k]);
  // index.html'deki genel kural: --text3 = text2 %72 + bg
  if (col.text2 && col.bg) col.text3 = mix(col.text2, col.bg, 0.72);
  const rows = [];
  for (const [fg, bg, min] of CHECKS) {
    if (!col[fg] || !col[bg]) { rows.push(`  ? ${fg}/${bg}: renk okunamadı (${v[fg]} / ${v[bg]})`); continue; }
    const r = ratio(col[fg], col[bg]);
    if (r < min) { fails++; rows.push(`  ✗ ${fg} / ${bg}: ${r.toFixed(2)} (en az ${min})`); }
  }
  const status = rows.some(r => r.includes('✗')) ? '✗' : '✓';
  console.log(`${status} ${name}` + (missing.length ? `  (eksik değişkenler: ${missing.join(', ')})` : ''));
  rows.forEach(r => console.log(r));
}
console.log(`\n${themes.length} tema, ${fails} okunurluk sorunu.`);
if (process.argv.includes('--strict') && fails) process.exit(1);
