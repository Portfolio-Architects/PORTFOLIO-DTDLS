const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      
      const replaceAll = (search, replace) => {
        const regex = new RegExp(search, 'gi');
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          changed = true;
        }
      };

      // Previous colors -> New true mint colors
      replaceAll('#00e676', '#00d29d'); // main mint
      replaceAll('#e6fcf2', '#e0fbf4'); // light mint
      replaceAll('#00c853', '#00b386'); // active state for main btn
      replaceAll('#024225', '#003829'); // dark mode light

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walk(srcDir);
console.log('Color replacement to true mint complete.');
