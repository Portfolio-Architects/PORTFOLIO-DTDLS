// Diagnostic: find apartments that don't match any TX_SUMMARY key
const fs = require('fs');
const path = require('path');

const BASE = 'd:/Desktop/PORTFOLIO/PORTFOLIO - DTDLS';

const aptDataRaw = fs.readFileSync(path.join(BASE, 'frontend/src/lib/apartment-data.ts'), 'utf-8');
const aptNames = [];
const namePattern = /name:\s*'([^']+)'/g;
let m;
while ((m = namePattern.exec(aptDataRaw)) !== null) aptNames.push(m[1]);

const txRaw = fs.readFileSync(path.join(BASE, 'frontend/src/lib/transaction-summary.ts'), 'utf-8');
const txKeys = [];
const keyPattern = /"([^"]+)":\s*\{[\s\n\r]*"latestPrice"/g;
while ((m = keyPattern.exec(txRaw)) !== null) txKeys.push(m[1]);

function normalizeAptName(name) {
  return name.replace(/\[.*?\]\s*/g, '').replace(/\s+/g, '').replace(/[()（）]/g, '').trim();
}
const LOCATION_PREFIXES = [
  '숲속마을동탄', '푸른마을동탄', '나루마을동탄',
  '동탄역시범', '동탄시범다은마을', '동탄시범한빛마을', '동탄시범나루마을',
  '시범다은마을', '시범한빛마을', '시범나루마을', '시범',
  '반탄솔빛마을', '솔빛마을', '예당마을', '새강마을',
  '동탄2신도시', '동탄신도시', '동탄숲속마을', '동탄푸른마을', '동탄나루마을',
  '동탄호수공원역', '동탄호수공원', '동탄호수', '동탄역',
  '화성동탄2', '능동역', '호수공원역',
  '동탄2', '동탄',
];
function stripPrefix(norm) {
  for (const p of LOCATION_PREFIXES) {
    if (norm.startsWith(p) && norm.length > p.length) return norm.slice(p.length);
  }
  return norm;
}
const ROMAN_MAP = {'Ⅰ':'1','Ⅱ':'2','Ⅲ':'3','Ⅳ':'4','Ⅴ':'5','Ⅵ':'6','Ⅶ':'7','Ⅷ':'8','Ⅸ':'9','Ⅹ':'10'};
function deepNormalize(name) {
  let r = name.replace(/^[가-힣]+,/g, '');
  for (const [roman, arabic] of Object.entries(ROMAN_MAP)) r = r.replace(roman, arabic);
  r = r.replace(/(\d+)차/g, '$1').replace(/아파트/g, '').replace(/(\d+)번지/g, '$1')
       .replace(/\.0(?=$|[^0-9])/g, '').replace(/스위콈/g, '스위첸').replace(/케이씨씨/g, 'KCC');
  return r;
}
function findTxKey(aptName) {
  const norm = normalizeAptName(aptName);
  if (txKeys.includes(norm)) return norm;
  const stripped = stripPrefix(norm);
  if (stripped !== norm && txKeys.includes(stripped)) return stripped;
  for (const key of txKeys) { if (stripPrefix(key) === stripped) return key; }
  const deepNorm = deepNormalize(stripped);
  for (const key of txKeys) { if (deepNormalize(stripPrefix(key)) === deepNorm) return key; }
  return null;
}

console.log(`APT: ${aptNames.length} | TX: ${txKeys.length}\n`);
const unmatched = [], matched = [];
for (const apt of aptNames) {
  const key = findTxKey(apt);
  if (key) matched.push({apt,key}); else unmatched.push(apt);
}
console.log(`Matched: ${matched.length} | Unmatched: ${unmatched.length}\n`);
console.log('=== UNMATCHED ===');
unmatched.forEach(a => {
  const norm = normalizeAptName(a);
  const stripped = stripPrefix(norm);
  let best = null, bestScore = 0;
  for (const key of txKeys) {
    const ks = deepNormalize(stripPrefix(key));
    const ds = deepNormalize(stripped);
    let score = 0;
    for (let i = 0; i < Math.min(ds.length, ks.length); i++) { if (ds[i] === ks[i]) score++; else break; }
    if (score > bestScore) { bestScore = score; best = key; }
  }
  console.log(`${a} -> norm:[${norm}] stripped:[${stripped}] closest:[${best}](${bestScore})`);
});
const usedTxKeys = new Set(matched.map(m => m.key));
const unusedTx = txKeys.filter(k => !usedTxKeys.has(k));
console.log(`\n=== UNUSED TX (${unusedTx.length}) ===`);
unusedTx.forEach(k => console.log(k));
