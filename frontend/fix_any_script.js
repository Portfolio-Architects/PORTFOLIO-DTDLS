const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walk(dirFile, filelist);
    } else if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walk(path.join(__dirname, 'src'));
let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. catch statements
  content = content.replace(/catch\s*\(\s*(error|err|e)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');

  // 2. scores as any
  content = content.replace(/\(scores as any\)/g, '(scores as Record<string, number>)');
  content = content.replace(/\(adjustedScores as any\)/g, '(adjustedScores as Record<string, number>)');

  // 3. Recharts formatters
  content = content.replace(/formatter=\{\(value: any\)/g, 'formatter={(value: number | string)');
  content = content.replace(/formatter=\{\(value: any, name: any, entry: any\)/g, 'formatter={(value: number, name: string, entry: unknown)');
  content = content.replace(/CustomTooltip = \(\{ active, payload \}: any\)/g, 'CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] })');

  // 4. DB timestamps
  content = content.replace(/createdAt\s*\??\s*:\s*any\s*;/g, 'createdAt?: unknown;');
  content = content.replace(/purchasedAt\s*\??\s*:\s*any\s*;/g, 'purchasedAt?: unknown;');

  // 5. Array any
  content = content.replace(/<Record<string, any\[\]>>/g, '<Record<string, unknown[]>>');
  content = content.replace(/Record<string, any>/g, 'Record<string, unknown>');
  
  // 6. Firebase docSnap
  content = content.replace(/snapshot\.forEach\(\(docSnap: any\)/g, 'snapshot.forEach((docSnap: any)'); // will fix manually

  // 7. sort
  content = content.replace(/\(a: any, b: any\) => b\._rawTimestamp - a\._rawTimestamp/g, '(a: { _rawTimestamp: number }, b: { _rawTimestamp: number }) => b._rawTimestamp - a._rawTimestamp');
  
  // 8. API route mapping
  content = content.replace(/const getVal = \(row: any, keys: string\[\]\)/g, 'const getVal = (row: unknown[], keys: string[])');
  
  // 9. others
  content = content.replace(/const monthRecords: any\[\] = \[\];/g, 'const monthRecords: unknown[] = [];');
  content = content.replace(/const data = metaDoc\.data\(\) as Record<string, any>;/g, 'const data = metaDoc.data() as Record<string, unknown>;');
  content = content.replace(/{\s*updates:\s*any\[\],\s*adds:\s*any\[\],\s*deletes:\s*string\[\]\s*}/g, '{ updates: unknown[], adds: unknown[], deletes: string[] }');
  
  // 10. (meta as any)
  content = content.replace(/\(meta as any\)\.dong/g, '(meta as Record<string, unknown>).dong');
  content = content.replace(/\(meta as any\)\.txKey/g, '(meta as Record<string, unknown>).txKey');
  content = content.replace(/\(meta as any\)\.isPublicRental/g, '(meta as Record<string, unknown>).isPublicRental');
  
  // 11. (aptMeta\[name\] as any)\?\.dong
  content = content.replace(/\(aptMeta\[name\] as any\)\?\.dong/g, '(aptMeta[name] as Record<string, unknown>)?.dong');

  // 12. undefined as any
  content = content.replace(/undefined as any/g, 'undefined as unknown as string');

  // 13. [prev: any] -> [prev: number] ?
  content = content.replace(/setPost\(\(prev: any\) => prev \? \{ \.\.\.prev, likes: \(prev\.likes \|\| 0\) \+ 1 \} : prev\);/g, 'setPost((prev: { likes?: number } | null) => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : prev);');

  if (content !== original) {
    fs.writeFileSync(file, content);
    const diff = content.split('any').length - original.split('any').length;
    console.log(`Updated ${file} (${Math.abs(diff)} replacements)`);
    totalReplaced += Math.abs(diff);
  }
});

console.log(`Total replaced: ${totalReplaced}`);
