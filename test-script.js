const fs = require('fs');
const content = fs.readFileSync('frontend/src/lib/dong-apartments.ts', 'utf8');
const lines = content.split('\n');
const keys = [];
for(let line of lines) {
  if (line.includes('경남')) {
    keys.push(line.trim());
  }
}
console.log(keys);
