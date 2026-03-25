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

  // report.repository.ts
  content = content.replace(/mapSnapshot = \(snapshot: any\)/g, 'mapSnapshot = (snapshot: unknown)');
  content = content.replace(/snapshot\.forEach\(\(docSnap: any\)/g, 'snapshot.forEach((docSnap: any)'); // skip or fix: manually easier? let's fix
  content = content.replace(/snapshot\.forEach\(\(docSnap: any\)/g, 'snapshot.forEach((docSnap: unknown)');
  content = content.replace(/} as any\);/g, '} as unknown as FieldReportData);');

  // DashboardFacade.tsx
  content = content.replace(/premiumScores: any/g, 'premiumScores: Record<string, number>');
  content = content.replace(/\(mergedSections\[section\] as any\)\[field\]/g, '(mergedSections[section] as Record<string, string>)[field]');
  
  // write-report/page.tsx
  content = content.replace(/\(sections\[section\] as any\)\[field\]/g, '(sections[section] as Record<string, number | string>)[field]');

  // EduBubbleChart.tsx
  content = content.replace(/payload\?: any\[\]/g, 'payload?: unknown[]');

  // lounge/[id]/page.tsx & edit-report/[id]/page.tsx
  content = content.replace(/useState<any>\(null\)/g, 'useState<unknown>(null)');
  
  // ApartmentModal.tsx
  content = content.replace(/data: any }/g, 'data: unknown }');
  content = content.replace(/component=\{\(rechartProps: any\)/g, 'component={(rechartProps: unknown)');
  content = content.replace(/Object\.values\(xAxisMap\)\[0\] as any;/g, 'Object.values(xAxisMap)[0] as unknown;');
  content = content.replace(/Object\.values\(yAxisMap\)\[0\] as any;/g, 'Object.values(yAxisMap)[0] as unknown;');
  
  // admin/page.tsx
  content = content.replace(/\(apts as any\[\]\)\.forEach/g, '(apts as unknown[]).forEach');

  // ReportEditorForm.tsx
  content = content.replace(/initialData\.metrics as any;/g, 'initialData.metrics as Record<string, unknown>;');
  content = content.replace(/name: any, label: string/g, 'name: string, label: string'); // for input components
  content = content.replace(/\(img: any\)/g, '(img: { url: string; file?: File; category: string })');

  // admin/apartments/[name]/page.tsx
  content = content.replace(/\(apts as any\[\]\)\.find/g, '(apts as { name: string }[]).find');
  content = content.replace(/\(m as any\)\.restaurantDensity/g, '(m as Record<string, number>).restaurantDensity');
  content = content.replace(/\(m as any\)\.academyCategories/g, '(m as Record<string, unknown>).academyCategories');
  content = content.replace(/\(m as any\)\.restaurantCategories/g, '(m as Record<string, unknown>).restaurantCategories');
  content = content.replace(/\(m as any\)\.nearestSchoolNames/g, '(m as Record<string, unknown>).nearestSchoolNames');
  content = content.replace(/\(m as any\)\.nearestStationName/g, '(m as Record<string, unknown>).nearestStationName');
  content = content.replace(/{ updates: any\[\]; adds: any\[\]; deletes: string\[\] }/g, '{ updates: unknown[]; adds: unknown[]; deletes: string[] }');
  content = content.replace(/\(apts as any\[\]\)\.forEach\(a =>/g, '(apts as { name: string }[]).forEach(a =>');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    totalReplaced++;
  }
});

console.log(`Total files modified: ${totalReplaced}`);
