const fs = require('fs');

async function check() {
  const url = 'https://docs.google.com/spreadsheets/d/1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE/gviz/tq?tqx=out:csv&sheet=apartments';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  const nameIdx = headers.findIndex(h => h.includes('아파트명') || h.includes('name'));
  const txKeyIdx = headers.findIndex(h => h.toLowerCase() === 'txkey');
  const hhIdx = headers.findIndex(h => h.includes('세대수') || h.includes('세대'));

  const txKeys = new Set(JSON.parse(fs.readFileSync('public/tx-data/_index.json', 'utf8')));
  
  let totalHh = 0;
  let missingHh = 0;
  let missing = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length <= nameIdx || !cols[nameIdx]) continue;
    
    const name = cols[nameIdx];
    let txKey = txKeyIdx !== -1 ? cols[txKeyIdx] : '';
    const normName = name.replace(/\[.*?\]\s*/g, '').replace(/\s+/g, '').replace(/[()（）]/g, '').trim();
    if (!txKey) txKey = normName;
    
    const hhStr = hhIdx !== -1 ? cols[hhIdx] : '0';
    const hh = parseInt(hhStr.replace(/,/g, '')) || 0;
    
    totalHh += hh;
    if (!txKeys.has(txKey) && !txKeys.has(normName)) {
      missing.push({ name, txKey, hh });
      missingHh += hh;
    }
  }

  let report = `Sheet count: ${lines.length - 1}\n`;
  report += `TX_SUMMARY count: ${txKeys.size}\n`;
  report += `Missing from TX_SUMMARY: ${missing.length}\n`;
  report += `Total Households in Sheet: ${totalHh}\n`;
  report += `Households missing from TX_SUMMARY: ${missingHh}\n`;
  report += `Missing items:\n`;
  missing.forEach(m => {
    report += `  - ${m.name} (txkey: ${m.txKey}, hh: ${m.hh})\n`;
  });

  fs.writeFileSync('missing_report.txt', report, 'utf8');
  console.log('Report written to missing_report.txt');
}

check().catch(console.error);
