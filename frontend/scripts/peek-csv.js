const fs = require('fs');
const iconv = require('iconv-lite');
const buf = fs.readFileSync('scripts/latest-tx.csv');
const text = iconv.decode(buf, 'euc-kr');
const lines = text.split('\n');
for (let i = 10; i < Math.min(25, lines.length); i++) {
  console.log(i + ': ' + lines[i].substring(0, 150));
}
