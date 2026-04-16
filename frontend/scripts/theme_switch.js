const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['src/components', 'src/app', 'src/lib', 'src/styles'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
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

// Map tailored specifically for the green transition
const MAPPINGS = [
  // 1. Transaction Badges Swap First (to avoid overlap)
  // Sale (blue -> emerald)
  { from: /bg-\[#e8f3ff\] text-\[#1b64da\]/g, to: 'bg-[#ecfdf5] text-[#047857]' },
  // Jeonse (green -> blue)
  { from: /bg-\[#e6f4ea\] text-\[#0d652d\]/g, to: 'bg-[#e8f3ff] text-[#1b64da]' },
  
  // 2. Primary HEX replacements
  { from: /#3182f6/gi, to: '#10b981' }, // Primary Toss Blue -> Emerald 500
  { from: /#1b64da/gi, to: '#047857' }, // Dark Toss Blue -> Emerald 700 (outside of badges)
  { from: /#e8f3ff/gi, to: '#ecfdf5' }, // Light Toss Blue -> Emerald 50 (outside of badges)
  
  // 3. Tailwind Class Replacements
  { from: /blue-50\b(?:0(?:\b|[^0-9]))?/g, matchFn: (m) => m.startsWith('blue-500') ? 'emerald-500' : 'emerald-50' },
  { from: /\bblue-50\b/g, to: 'emerald-50' },
  { from: /\bblue-100\b/g, to: 'emerald-100' },
  { from: /\bblue-400\b/g, to: 'emerald-400' },
  { from: /\bblue-500\b/g, to: 'emerald-500' },
  { from: /\bblue-600\b/g, to: 'emerald-600' },
  { from: /\bblue-700\b/g, to: 'emerald-700' },
  
  // 4. rgba values for dropshadow/charts if any
  { from: /rgba\(49,\s*130,\s*246/g, to: 'rgba(16, 185, 129' },
];

let changedFiles = 0;

DIRECTORIES.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = getAllFiles(dir);

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Apply mappings safely
    // Since some mappings might overlap (e.g. blue badges vs hex replacements), the order matters.
    
    // First, process the badge swap
    content = content.replace(/bg-\[#e8f3ff\] text-\[#1b64da\]/g, 'TEMP_SALE_BADGE');
    content = content.replace(/bg-\[#e6f4ea\] text-\[#0d652d\]/g, 'TEMP_JEONSE_BADGE');
    
    content = content.replace(/TEMP_SALE_BADGE/g, 'bg-[#ecfdf5] text-[#047857]');
    content = content.replace(/TEMP_JEONSE_BADGE/g, 'bg-[#e8f3ff] text-[#1b64da]');
    
    // Replace hex
    content = content.replace(/#3182f6/gi, '#10b981');
    
    // Replace tailwind
    content = content.replace(/\bblue-50\b/g, 'emerald-50');
    content = content.replace(/\bblue-100\b/g, 'emerald-100');
    content = content.replace(/\bblue-400\b/g, 'emerald-400');
    content = content.replace(/\bblue-500\b/g, 'emerald-500');
    content = content.replace(/\bblue-600\b/g, 'emerald-600');
    content = content.replace(/\bblue-700\b/g, 'emerald-700');
    
    // Line charts / Area charts standard blue rgba
    content = content.replace(/rgba\(49,\s*130,\s*246/g, 'rgba(16, 185, 129');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
      console.log(`Updated: ${file.replace(__dirname, '')}`);
    }
  });
});

console.log(`\nSuccessfully updated ${changedFiles} files to the Emerald Green theme!`);
