#!/usr/bin/env node
/*
 * Koda doğrudan yazılmış renkleri sayar (tema değişince değişmeyen renkler).
 *   node scripts/renk-kontrol.js           → sayım ve en çok kullanılan renkler (tema tanımları hariç)
 *   node scripts/renk-kontrol.js --check   → sayı scripts/renk-baseline.json'daki değeri aşarsa hata
 *   node scripts/renk-kontrol.js --update  → baseline'ı güncel sayıya indir (sadece azaldıysa)
 *
 * Kural: yeni kodda renk yazılmaz, var(--text), var(--accent) gibi tema değişkenleri kullanılır.
 * Hedef: sayıyı sıfıra indirmek.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const FILES = ['public/index.html', 'public/sinav-hub.js'];
const BASE = path.join(__dirname, 'renk-baseline.json');

function scan(file) {
  let src = fs.readFileSync(path.join(root, file), 'utf8');
  if (file.endsWith('.html')) {
    // <style> içindeki tema değişken tanımları hariç; geri kalan her şey sayılır
    // tema tanımları (değişkenler ve [data-theme=…] kuralları) temanın kendisidir, sayılmaz
    src = src.replace(/<style>[\s\S]*?<\/style>/, m => m
      .replace(/[^{}]*\[data-(theme|accent)=[^{}]*\{[^{}]*\}/g, '')
      .replace(/--[a-z0-9-]+\s*:\s*[^;]+;/gi, ''));
  }
  // var(--x,#fallback) fallback'leri sayılmaz
  src = src.replace(/var\(--[a-z0-9-]+,\s*#[0-9a-f]{3,8}\)/gi, '');
  const found = src.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b(?![0-9a-z-])/gi) || [];

  return found;
}

const counts = {}; const per = {};
let total = 0;
for (const f of FILES) {
  const list = scan(f);
  per[f] = list.length; total += list.length;
  list.forEach(h => { h = h.toLowerCase(); counts[h] = (counts[h] || 0) + 1; });
}
const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')).total : null;

if (process.argv.includes('--update')) {
  if (base !== null && total > base) { console.error(`Sayı arttı (${base} → ${total}); baseline güncellenmedi.`); process.exit(1); }
  fs.writeFileSync(BASE, JSON.stringify({ total, updated: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
  console.log('Baseline:', total);
  process.exit(0);
}

console.log(`Koda yazılmış renk: ${total}` + (base !== null ? ` (baseline ${base})` : ''));
Object.entries(per).forEach(([f, n]) => console.log(`  ${f}: ${n}`));
console.log('En çok kullanılanlar:', Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([h, n]) => `${h}×${n}`).join('  '));
if (process.argv.includes('--check') && base !== null && total > base) {
  console.error(`\n✗ Yeni koda renk yazılmış: ${total - base} adet. Tema değişkeni kullan (var(--text), var(--accent) …).`);
  process.exit(1);
}
