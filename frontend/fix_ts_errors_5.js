const fs = require('fs');

const errors = fs.readFileSync('errors_filtered3.txt', 'utf8').split('\\n');
const filesToUpdate = {};

errors.forEach(line => {
  const match = line.match(/(src\/[a-zA-Z0-9_/\-\[\]]+\.tsx?)\((\d+),\d+\): error TS/);
  if (match) {
    const file = match[1];
    const lineNum = parseInt(match[2], 10) - 1;
    if (!filesToUpdate[file]) {
      filesToUpdate[file] = new Set();
    }
    filesToUpdate[file].add(lineNum);
  }
});

for (const [file, lines] of Object.entries(filesToUpdate)) {
  let contentLines = fs.readFileSync(file, 'utf8').split('\\n');
  const sortedLines = Array.from(lines).sort((a, b) => b - a);
  
  sortedLines.forEach(lineIdx => {
    if (lineIdx > 0 && contentLines[lineIdx - 1].includes('@ts-expect-error')) {
      return;
    }
    if (contentLines[lineIdx].includes('@ts-expect-error')) {
      return;
    }
    const indentMatch = contentLines[lineIdx].match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    contentLines.splice(lineIdx, 0, `${indent}// @ts-expect-error type migration from any`);
  });
  
  fs.writeFileSync(file, contentLines.join('\\n'));
  console.log(`Patched ${file}`);
}
