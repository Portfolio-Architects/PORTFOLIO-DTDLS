const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['src/components', 'src/app', 'src/lib', 'src/styles'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(process.cwd(), dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (['.tsx', '.ts', '.jsx', '.js', '.css'].includes(ext)) {
        arrayOfFiles.push(path.join(process.cwd(), dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

let changedFiles = 0;

DIRECTORIES.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = getAllFiles(dir);

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Transaction Badges Swap Back
    // Current Sale is emerald -> Back to blue
    content = content.replace(/bg-\[#ecfdf5\] text-\[#047857\]/g, 'TEMP_SALE_BADGE');
    // Current Jeonse is blue -> Back to green
    content = content.replace(/bg-\[#e8f3ff\] text-\[#1b64da\]/g, 'TEMP_JEONSE_BADGE');
    
    content = content.replace(/TEMP_SALE_BADGE/g, 'bg-[#e8f3ff] text-[#1b64da]');
    content = content.replace(/TEMP_JEONSE_BADGE/g, 'bg-[#e6f4ea] text-[#0d652d]');
    
    // 2. Primary HEX replacements back to blue
    content = content.replace(/#10b981/gi, '#3182f6');
    
    // 3. Tailwind class replacements back to blue
    content = content.replace(/\bemerald-50\b/g, 'blue-50');
    content = content.replace(/\bemerald-100\b/g, 'blue-100');
    content = content.replace(/\bemerald-400\b/g, 'blue-400');
    content = content.replace(/\bemerald-500\b/g, 'blue-500');
    content = content.replace(/\bemerald-600\b/g, 'blue-600');
    content = content.replace(/\bemerald-700\b/g, 'blue-700');
    
    // 4. rgba values for dropshadow/charts back to blue
    content = content.replace(/rgba\(16,\s*185,\s*129/g, 'rgba(49, 130, 246');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
      console.log(`Rolled back: ${path.basename(file)}`);
    }
  });
});

console.log(`\nSuccessfully rolled back ${changedFiles} files to the original Toss Blue theme!`);
