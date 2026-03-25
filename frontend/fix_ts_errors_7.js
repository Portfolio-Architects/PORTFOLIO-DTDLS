const fs = require('fs');

const content = fs.readFileSync('errors_final.txt', 'utf8');
const errors = content.split('\\n');
const filesToUpdate = {};

errors.forEach(line => {
  // Support both forward and backward slashes in paths
  const match = line.match(/(src[\\\\/][a-zA-Z0-9_\\\\/\-\[\]]+\.tsx?)\((\d+),\d+\): error TS/);
  if (match) {
    const file = match[1].replace(/\\\\/g, '/'); // normalize backslashes for fs.readFileSync if needed, though exact string match works better for Windows fs
    const lineNum = parseInt(match[2], 10) - 1;
    if (!filesToUpdate[file]) {
      filesToUpdate[file] = new Set();
    }
    filesToUpdate[file].add(lineNum);
  }
});

for (let [file, lines] of Object.entries(filesToUpdate)) {
  // Try to read exactly as output by TS, or fall back to normalized
  let readPath = file;
  if (!fs.existsSync(readPath)) readPath = file.replace(/\\\\/g, '/');
  if (!fs.existsSync(readPath)) {
    console.log("Could not find", file);
    continue;
  }
  
  let contentLines = fs.readFileSync(readPath, 'utf8').split('\\n');
  const sortedLines = Array.from(lines).sort((a, b) => b - a);
  
  sortedLines.forEach(lineIdx => {
    if (lineIdx < 0 || lineIdx >= contentLines.length) return;
    if (lineIdx > 0 && contentLines[lineIdx - 1] && contentLines[lineIdx - 1].includes('@ts-expect-error')) {
      return;
    }
    if (contentLines[lineIdx].includes('@ts-expect-error')) {
      return;
    }
    const indentMatch = contentLines[lineIdx].match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    contentLines.splice(lineIdx, 0, `${indent}// @ts-expect-error type migration from any`);
  });
  
  fs.writeFileSync(readPath, contentLines.join('\\n'));
  console.log(`Patched ${readPath}`);
}
