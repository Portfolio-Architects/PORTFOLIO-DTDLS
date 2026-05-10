const fs = require('fs');

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE/gviz/tq?tqx=out:csv&sheet=apartments`;
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');
  const headers = parseCsvLine(lines[0]).map(c => c.replace(/^"|"$/g, '').toLowerCase().trim());
  const nameIdx = headers.findIndex(h => h === '아파트명');
  const txKeyIdx = headers.findIndex(h => h === 'txkey' || h === '실거래키');

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]).map(c => c.replace(/^"|"$/g, '').trim());
    const name = cols[nameIdx];
    const txKey = txKeyIdx !== -1 ? cols[txKeyIdx] : '';
    
    if ([
      '능동 숲속마을 광명메이루즈', 
      '능동 숲속마을 모아미래도 1단지', 
      '능동역 경남아너스빌', 
      '능동역 센트럴 경남아너스빌',
      '동탄역 롯데캐슬 알바트로스',
      '목동 베라체',
      '산척동 더 레이크 팰리스',
      '산척동 더샵 레이크 에듀타운',
      '산척동 레이크힐 반도유보라 아이비파크 10.2',
      '동탄역 센트럴자이'
    ].includes(name)) {
      console.log(`[${name}] txKey: "${txKey}"`);
    }
  }
}
main();
