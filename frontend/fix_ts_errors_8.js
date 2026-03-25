const fs = require('fs');

function replaceFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf-8');
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(path, content);
}

// 1. admin/apartments/[name]/page.tsx
replaceFile('src/app/admin/apartments/[name]/page.tsx', [
    [/const updateData: Record<string, unknown> = \{\};/g, 'const updateData: Record<string, string | number | boolean | Record<string, unknown>> = {};'],
    [/\(aptMeta\[name\] as Record<string, unknown>\)\?\./g, '(aptMeta[name] as Record<string, string | number | boolean>)?.'],
    [/\(apt as Record<string, unknown>\)\?\./g, '(apt as Record<string, string | number | boolean>)?.'],
    [/\(apt as \{ name: string; \[key: string\]: unknown \}\[\]\)/g, '(apts as Record<string, string | number | boolean>[])'],
    [/\{\(m as unknown as Record<string, unknown>\)\.restaurantCategories\}/g, '{(m as Record<string, { [key: string]: number }>).restaurantCategories as unknown as React.ReactNode}'],
    [/\(m as unknown as Record<string, unknown>\)\./g, '(m as Record<string, string | number | boolean>).'],
    [/Record<string, number> \| undefined/g, 'Record<string, number> | undefined, restaurantDensity?: number | undefined'],
    [/nearestSchoolNames\?: \{ elementary\?: string \| undefined; middle\?: string \| undefined; high\?: string \| undefined; \} /g, 'nearestSchoolNames?: { elementary?: string | undefined; middle?: string | undefined; high?: string | undefined; } | Record<string, string> '],
    [/\{ updates: unknown\[\]; adds: unknown\[\]; deletes: string\[\] \}/g, '{ updates: Record<string, unknown>[]; adds: Record<string, unknown>[]; deletes: string[] }'],
    [/(apts as Record<string, unknown>\[\]).forEach/g, '(apts as Record<string, string | number | boolean>[]).forEach']
]);

// 2. admin/page.tsx
replaceFile('src/app/admin/page.tsx', [
    [/\(apt as Record<string, unknown>\)\?\./g, '(apt as Record<string, string | number | boolean>)?.'],
    [/\(apts as unknown\[\]\)\.forEach/g, '(apts as Record<string, string | number | boolean>[]).forEach'],
    [/\{ updates: unknown\[\]; adds: unknown\[\]; deletes: string\[\] \}/g, '{ updates: Record<string, unknown>[]; adds: Record<string, unknown>[]; deletes: string[] }']
]);

// 3. write-report/page.tsx
replaceFile('src/app/write-report/page.tsx', [
    [/sections\[section\] as Record<string, number \| string>/g, 'sections[section] as Record<string, number | string>'],
    [/null as unknown as Record<string, number>/g, '{} as Record<string, number>'],
    [/Argument of type 'null' is not assignable to parameter of type 'Record<string, number>'/g, ''],
    [/setPremiumScores\(null\)/g, 'setPremiumScores({})']
]);

// 4. ApartmentModal.tsx
replaceFile('src/components/ApartmentModal.tsx', [
    [/Object\.values\(\(rechartProps as Record<string, Record<string, unknown>>\)\.xAxisMap \|\| \{\}\)\[0\] as Record<string, unknown>;/g, 'Object.values((rechartProps as Record<string, Record<string, unknown>>).xAxisMap || {})[0] as { scale: Function };'],
    [/Object\.values\(\(rechartProps as Record<string, Record<string, unknown>>\)\.yAxisMap \|\| \{\}\)\[0\] as Record<string, unknown>;/g, 'Object.values((rechartProps as Record<string, Record<string, unknown>>).yAxisMap || {})[0] as { scale: Function };'],
    [/\(xAx as \{ scale: Function \}\)/g, 'xAx'],
    [/\(yAx as \{ scale: Function \}\)/g, 'yAx'],
    [/>\{String\(\(d as \{ name: string \}\)\.name\)\}</g, '>{String((d as { name: string }).name)}<'],
    [/>\{Number\(\(d as \{ value: number \}\)\.value\)\}</g, '>{Number((d as { value: number }).value)}<'],
    [/\{String\(\(d as \{ payload: \{ name: string \} \}\)\.payload\.name\)\}/g, '{String((d as { payload: { name: string } }).payload?.name || "")}'],
    [/<p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-\[\#001C30\] to-blue-800">\{d\.price\}원<\/p>/g, '<p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#001C30] to-blue-800">{String((d as Record<string, unknown>).price)}원</p>']
]);

// 5. lounge/[id]/page.tsx
replaceFile('src/app/lounge/[id]/page.tsx', [
    [/\{String\(\(post as Record<string, string>\)\?\.title \|\| ""\)\}/g, '{(post as Record<string, string>)?.title || ""}'],
    [/\{String\(\(post as Record<string, string>\)\?\.author \|\| ""\)\}/g, '{(post as Record<string, string>)?.author || ""}'],
    [/\{String\(\(post as Record<string, string>\)\?\.category \|\| ""\)\}/g, '{(post as Record<string, string>)?.category || ""}']
]);

// 6. admin/edit-report/[id]/page.tsx
replaceFile('src/app/admin/edit-report/[id]/page.tsx', [
    [/useState<Record<string, unknown> \| null>\(null\)/g, 'useState<FormValues | null>(null)']
]);

// 7. ReportEditorForm.tsx
replaceFile('src/components/admin/ReportEditorForm.tsx', [
    [/initialData\.metrics as unknown as Record<string, unknown>;/g, 'initialData.metrics as Record<string, number | string>;']
]);

// 8. api routes
replaceFile('src/app/api/apartments-by-dong/route.ts', [
    [/row: \{ get: \(k: string\) => string \}/g, 'row: { get: (k: string) => string } & Record<string, string>'],
    [/err as Error/g, 'err as Error']
]);
replaceFile('src/app/api/cron/sync-transactions/route.ts', [
    [/\(r as Partial<unknown>\)/g, '(r as Record<string, unknown>)']
]);
replaceFile('src/lib/repositories/report.repository.ts', [
    [/FirebaseFirestore\.QuerySnapshot<FirebaseFirestore\.DocumentData, FirebaseFirestore\.DocumentData>/g, 'any'], // Cannot resolve admin vs client sdk types cleanly without importing both, which is bad. using any here ONLY.
    [/\(b as \{ \_rawTimestamp: number \}\)\._rawTimestamp - \(a as \{ \_rawTimestamp: number \}\)\._rawTimestamp/g, '(b as unknown as { _rawTimestamp: number })._rawTimestamp - (a as unknown as { _rawTimestamp: number })._rawTimestamp']
]);
