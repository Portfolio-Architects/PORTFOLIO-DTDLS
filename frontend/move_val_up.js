const fs = require('fs');

const filepath = 'd:\\Desktop\\PORTFOLIO\\PORTFOLIO - DTDLS\\frontend\\src\\components\\ApartmentModal.tsx';
let lines = fs.readFileSync(filepath, 'utf8').split('\n');

// 1. Find and extract the bottom Valuation block
const valStartIdx = lines.findIndex(l => l.includes('            {/* 밸류에이션 리포트 (하단 이동) */}'));
let valBlockLines = [];
if (valStartIdx !== -1) {
  const valEndIdx = lines.findIndex((l, i) => i > valStartIdx && l.includes('            </div>'));
  if (valEndIdx !== -1) {
    valBlockLines = lines.splice(valStartIdx, valEndIdx - valStartIdx + 1);
  }
}

// 2. Change the tab arrays
const tabsIdx = lines.findIndex(l => l.includes("              {['현장 사진', '이 아파트 이야기', 'AI 밸류에이션 리포트'].map((label, idx) => {"));
if (tabsIdx !== -1) {
  lines[tabsIdx] = "              {['AI 밸류에이션', '현장 사진', '이 아파트 이야기'].map((label, idx) => {";
}

const idsIdx = lines.findIndex(l => l.includes("                const ids = ['sec-photos', 'sec-comments', 'sec-premium'];"));
if (idsIdx !== -1) {
  lines[idsIdx] = "                const ids = ['sec-premium', 'sec-photos', 'sec-comments'];";
}

// 3. Insert the Valuation block BEFORE the Photos section
const photosIdx = lines.findIndex(l => l.includes('            {/* Photo Gallery — Category Tab Grid (100+ photos) */}'));
if (photosIdx !== -1 && valBlockLines.length > 0) {
  valBlockLines[0] = '            {/* 밸류에이션 리포트 */}';
  lines.splice(photosIdx, 0, ...valBlockLines, '');
}

fs.writeFileSync(filepath, lines.join('\n'));
console.log('Successfully moved Valuation Report above Field Photos.');
