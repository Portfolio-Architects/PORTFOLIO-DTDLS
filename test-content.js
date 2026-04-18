const fs = require('fs');
const content = fs.readFileSync('frontend/src/lib/transaction-summary.ts', 'utf8');
const start = content.indexOf('"동탄숲속마을자연앤경남아너스빌1115-0"');
console.log(content.substring(start, start + 300));
