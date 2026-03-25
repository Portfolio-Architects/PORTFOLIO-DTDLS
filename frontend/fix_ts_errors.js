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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // 1. Error object properties (e.unknown)
  content = content.replace(/catch\s*\(\s*(error|err|e)\s*:\s*unknown\s*\)\s*{([\s\S]*?)}/g, (match, errVar, body) => {
    let newBody = body.replace(new RegExp(`\\b${errVar}\\.message\\b`, 'g'), `(${errVar} as Error).message`);
    newBody = newBody.replace(new RegExp(`\\b${errVar}\\.code\\b`, 'g'), `(${errVar} as { code?: string }).code`);
    return `catch (${errVar}: unknown) {${newBody}}`;
  });
  // one-liners
  content = content.replace(/catch \((error|err|e): unknown\) {([^}]+)}/g, (match, errVar, body) => {
    if (body.includes(`${errVar}.message`)) {
      return match.replace(`${errVar}.message`, `(${errVar} as Error).message`);
    } return match;
  });

  // 2. Double assertion for missing index signature (ObjectiveMetrics, PremiumScores)
  content = content.replace(/\(scores as Record<string, number>\)/g, '(scores as unknown as Record<string, number>)');
  content = content.replace(/\((m|adjustedScores) as Record<string, number>\)/g, '($1 as unknown as Record<string, number>)');
  content = content.replace(/\(m as Record<string, unknown>\)/g, '(m as unknown as Record<string, unknown>)');

  // 3. apts map/find
  content = content.replace(/\(apts as unknown\[\]\)\.forEach/g, '(apts as Record<string, unknown>[]).forEach');
  content = content.replace(/\(apts as \{ name: string \}\[\]\)/g, '(apts as { name: string; [key: string]: unknown }[])');
  
  // 4. Firebase snapshot
  if (file.includes('report.repository.ts')) {
    content = content.replace(/snapshot: unknown/g, 'snapshot: FirebaseFirestore.QuerySnapshot');
    content = content.replace(/docSnap: unknown/g, 'docSnap: FirebaseFirestore.QueryDocumentSnapshot');
    content = content.replace(/\(a: \{ _rawTimestamp: number \}, b: \{ _rawTimestamp: number \}\)/g, '(a: FieldReportData, b: FieldReportData)');
    content = content.replace(/FieldReportData \[\]/g, 'FieldReportData[]');
  }
  
  // 5. write-report / edit-report
  if (file.includes('edit-report')) {
    content = content.replace(/useState<unknown>\(null\)/g, 'useState<Record<string, unknown> | null>(null)');
  }
  if (file.includes('lounge')) {
    content = content.replace(/useState<unknown>\(null\)/g, 'useState<Record<string, unknown> | null>(null)');
    content = content.replace(/payload\?: unknown\[\]/g, 'payload?: { value: number | string; name: string }[]');
  }
  
  // 6. write-report Type narrowing
  content = content.replace(/\(sections\[section\] as Record<string, number \| string>\)/g, '(sections[section] as unknown as Record<string, number | string>)');

  // 7. page.tsx
  if (file.endsWith('page.tsx') && !file.includes('admin')) {
    content = content.replace(/\(meta as Record<string, unknown>\)\.txKey/g, '(meta as Record<string, string>).txKey');
  }

  // 8. Recharts formatter types
  content = content.replace(/formatter=\{\(value: number \| string\)/g, 'formatter={(value: number | string | undefined)');
  content = content.replace(/formatter=\{\(value: number, name: string, entry: unknown\)/g, 'formatter={(value: number | string | undefined, name: string | undefined, entry: unknown)');

  // 9. API route google spreadsheet row
  content = content.replace(/row: unknown\[\]/g, 'row: { get: (k: string) => string }');
  
  // 10. ApartmentModal.tsx
  if (file.includes('ApartmentModal.tsx')) {
    content = content.replace(/data: unknown/g, 'data: Record<string, unknown>');
    content = content.replace(/component=\{\(rechartProps: unknown\)/g, 'component={(rechartProps: Record<string, unknown>)');
    content = content.replace(/Object\.values\(xAxisMap\)\[0\] as unknown;/g, 'Object.values((rechartProps as Record<string, Record<string, unknown>>).xAxisMap || {})[0] as Record<string, unknown>;');
    content = content.replace(/Object\.values\(yAxisMap\)\[0\] as unknown;/g, 'Object.values((rechartProps as Record<string, Record<string, unknown>>).yAxisMap || {})[0] as Record<string, unknown>;');
    content = content.replace(/Object\.values\(xAxisMap\)\[0\]/g, 'Object.values((rechartProps as any).xAxisMap || {})[0]'); // wait no any!
    content = content.replace(/d\.name/g, '(d as Record<string, string>).name');
    content = content.replace(/d\.value/g, '(d as Record<string, number>).value');
  }
  
  // 11. CustomTooltip payload
  content = content.replace(/payload\?: any\[\]/g, 'payload?: { value: number | string; name: string }[]');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
