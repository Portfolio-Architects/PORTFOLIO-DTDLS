const fs = require('fs');
const iconv = require('iconv-lite');
const buffer = fs.readFileSync('C:\\Users\\ocs56\\OneDrive\\바탕 화면\\아파트(전월세)_실거래가_20260410224113.csv');
const lines = iconv.decode(buffer, 'euc-kr').split('\n');
const parseCSV = (str) => {
  const arr = [];
  let quote = false;
  let col = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '"') { quote = !quote; }
    else if (c === ',' && !quote) { arr.push(col.trim()); col = ''; }
    else { col += c; }
  }
  arr.push(col.trim());
  return arr;
};
let headerIdx = -1;
for (let i=0; i<30; i++) {
  if (lines[i] && lines[i].includes('"NO"')) { headerIdx = i; break; }
}
for (let i=headerIdx+1; i<lines.length; i++) {
  if (lines[i].includes('그린힐') && lines[i].includes('202603')) {
    const row = parseCSV(lines[i]);
    console.log(`202603${row[9]} - ${row[10]}/${row[11]} - ${row[16]}/${row[17]}`);
  }
}
