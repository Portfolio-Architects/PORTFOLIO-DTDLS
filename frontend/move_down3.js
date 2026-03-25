const fs = require('fs');

const filepath = 'd:\\Desktop\\PORTFOLIO\\PORTFOLIO - DTDLS\\frontend\\src\\components\\ApartmentModal.tsx';
let lines = fs.readFileSync(filepath, 'utf8').split('\n');

// 1. Remove ID from top Valuation block
const startIdx = lines.findIndex(l => l.includes('<div id="sec-premium" className="mb-2 scroll-mt-14 bg-white'));
if (startIdx !== -1) {
  lines[startIdx] = lines[startIdx].replace('id="sec-premium" ', '').replace('scroll-mt-14 ', '');
}

// 2. Change mb-10 to mb-2 for Basic Info
const mb10Idx = lines.findIndex((l, i) => i > startIdx && i < startIdx + 20 && l.includes('className="mb-10"'));
if (mb10Idx !== -1) {
  lines[mb10Idx] = lines[mb10Idx].replace('mb-10', 'mb-2');
}

// 3. Remove AdvancedValuationMetrics from top
const advIdx = lines.findIndex(l => l.includes('<AdvancedValuationMetrics price84Man={price84} />'));
if (advIdx !== -1) {
  lines.splice(advIdx, 1);
}

// 4. Update the Sticky Tabs
const tabIdx = lines.findIndex(l => l.includes("{['현장 사진', '이 아파트 이야기'].map((label, idx) => {"));
if (tabIdx !== -1) {
  lines[tabIdx] = "              {['현장 사진', '이 아파트 이야기', 'AI 밸류에이션 리포트'].map((label, idx) => {";
}

const idsIdx = lines.findIndex(l => l.includes("const ids = ['sec-photos', 'sec-comments'];"));
if (idsIdx !== -1) {
  lines[idsIdx] = "                const ids = ['sec-photos', 'sec-comments', 'sec-premium'];";
}

// 5. Append AdvancedValuationMetrics at the bottom right before the Comments Section
const commentIdx = lines.findIndex(l => l.includes('<CommentSection'));
if (commentIdx !== -1) {
  const bottomValuation = `
            {/* 밸류에이션 리포트 (하단 이동) */}
            <div id="sec-premium" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14 mb-8">
              {report.premiumScores && transactions.length > 0 && (() => {
                const tx84 = transactions.find(t => t.area >= 80 && t.area <= 88) || transactions[0];
                const price84 = tx84 ? (typeof normalize84Price === 'function' ? normalize84Price(tx84.price, tx84.area) : 0) : 0;
                return price84 > 0 ? <AdvancedValuationMetrics price84Man={price84} /> : null;
              })()}
            </div>
`;
  lines.splice(commentIdx, 0, ...bottomValuation.split('\n'));
}

fs.writeFileSync(filepath, lines.join('\n'));
console.log('Successfully applied all changes line-by-line.');
