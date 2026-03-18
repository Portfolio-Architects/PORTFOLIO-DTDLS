const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const csvPath = path.join(process.env.USERPROFILE, 'OneDrive', '바탕 화면', '아파트(매매)_실거래가_20260318211953.csv');

const buf = fs.readFileSync(csvPath);
const content = iconv.decode(buf, 'euc-kr');
const lines = content.split('\n').map(l => l.replace(/\r$/, ''));

function parseCSV(line) {
  const r = []; let c = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { r.push(c.trim()); c = ''; }
    else c += ch;
  }
  r.push(c.trim());
  return r;
}

let hIdx = -1;
for (let i = 0; i < 20; i++) { if (parseCSV(lines[i])[0] === 'NO') { hIdx = i; break; } }

console.log('Header:', parseCSV(lines[hIdx]).join(' | '));

const recs = [];
for (let i = hIdx + 1; i < lines.length; i++) {
  const l = lines[i].trim();
  if (!l) continue;
  const c = parseCSV(l);
  if (c.length < 12 || isNaN(parseInt(c[0]))) continue;
  const dong = (c[1] || '').split(/\s+/).pop();
  const price = parseInt((c[9] || '').replace(/,/g, '')) || 0;
  recs.push({ dong, apt: (c[5] || '').trim(), area: parseFloat(c[6]) || 0, ym: (c[7] || '').trim(), day: (c[8] || '').trim(), price, fl: parseInt(c[11]) || 0 });
}

console.log('\nTotal:', recs.length, 'records\n');

recs.forEach((r, i) => {
  const e = Math.floor(r.price / 10000), rem = r.price % 10000;
  const ps = e > 0 ? (rem > 0 ? `${e}억${rem.toLocaleString()}` : `${e}억`) : `${r.price.toLocaleString()}만`;
  console.log(`${i + 1}. [${r.dong}] ${r.apt} | ${r.ym}.${r.day} | ${ps} | ${(r.area / 3.3058).toFixed(1)}평 | ${r.fl}층`);
});

const byApt = {};
recs.forEach(r => { byApt[r.apt] = (byApt[r.apt] || 0) + 1; });
console.log('\n--- 아파트별 요약 ---');
Object.entries(byApt).sort((a, b) => b[1] - a[1]).forEach(([a, c]) => console.log(`  ${a}: ${c}건`));
