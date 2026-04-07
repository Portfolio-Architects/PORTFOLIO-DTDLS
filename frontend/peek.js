const fs = require('fs');
const iconv = require('iconv-lite');

const files = [
  'd:\\Desktop\\아파트(매매)_실거래가_20260403121735.csv',
  'd:\\Desktop\\아파트(전월세)_실거래가_20260403121555.csv'
];

files.forEach(f => {
  const buf = fs.readFileSync(f);
  const txt = iconv.decode(buf, 'euc-kr');
  const lines = txt.split('\n');
  const headerIdx = lines.findIndex(l => l.startsWith('"NO"'));
  console.log('\n--- FILE:', f, '---');
  if (headerIdx >= 0) {
    console.log('HEADER:', lines[headerIdx]);
    console.log('DATA 1:', lines[headerIdx + 1]);
    console.log('DATA 2:', lines[headerIdx + 2]);
  } else {
    console.log('No header found');
  }
});
