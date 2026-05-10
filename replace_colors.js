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

      replaceAll('#0d9488', '#00e676'); // main mint
      replaceAll('#ccfbf1', '#e6fcf2'); // light mint
      replaceAll('#14b8a6', '#00e676'); // dark mode main
      replaceAll('#134e4a', '#024225'); // dark mode light
      replaceAll('#0f766e', '#00c853'); // active state for main btn

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walk(srcDir);
console.log('Color replacement complete.');
