const fs = require('fs');

const filepath = 'd:\\Desktop\\PORTFOLIO\\PORTFOLIO - DTDLS\\frontend\\src\\components\\ApartmentModal.tsx';
let contentStr = fs.readFileSync(filepath, 'utf8');

// 1. Alter the top Valuation block
contentStr = contentStr.replace(
  `<div id="sec-premium" className="mb-2 scroll-mt-14 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb]">`,
  `<div className="mb-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb]">`
);

contentStr = contentStr.replace(
  `<div className="mb-10">\n                    <h3 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-4">\n                      <Building2 size={18} className="text-[#3182f6]"/> 단지 기본 정보\n                    </h3>`,
  `<div className="mb-2">\n                    <h3 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-4">\n                      <Building2 size={18} className="text-[#3182f6]"/> 단지 기본 정보\n                    </h3>`
);

contentStr = contentStr.replace(
  `                  </div>\n\n                  <AdvancedValuationMetrics price84Man={price84} />\n                </div>`,
  `                  </div>\n                </div>`
);

// 2. Append Valuation block at the bottom
const commentSectionTarget = `            <CommentSection\n              comments={comments}\n              commentInput={commentInput}\n              onCommentChange={onCommentChange}\n              onSubmitComment={onSubmitComment}\n              user={user}\n              isUnlocked={isUnlocked}\n            />`;
const valuationBottomBlock = `
            {/* 밸류에이션 하단 이동 */}
            <div id="sec-premium" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
              {report.premiumScores && transactions.length > 0 && (() => {
                const tx84 = transactions.find(t => t.area >= 80 && t.area <= 88) || transactions[0];
                const price84 = tx84 ? (typeof normalize84Price === 'function' ? normalize84Price(tx84.price, tx84.area) : 0) : 0;
                return price84 > 0 ? <AdvancedValuationMetrics price84Man={price84} /> : null;
              })()}
            </div>
`;
contentStr = contentStr.replace(commentSectionTarget, commentSectionTarget + '\n' + valuationBottomBlock);

// 3. Update Sticky Tabs
contentStr = contentStr.replace(
  `{['현장 사진', '이 아파트 이야기'].map((label, idx) => {\n                const ids = ['sec-photos', 'sec-comments'];`,
  `{['현장 사진', '이 아파트 이야기', 'AI 밸류에이션'].map((label, idx) => {\n                const ids = ['sec-photos', 'sec-comments', 'sec-premium'];`
);

// If the previous replace failed because it was from the original text:
contentStr = contentStr.replace(
  `{['밸류에이션', '현장 사진', '이 아파트 이야기'].map((label, idx) => {\n                const ids = ['sec-premium', 'sec-photos', 'sec-comments'];`,
  `{['현장 사진', '이 아파트 이야기', 'AI 밸류에이션'].map((label, idx) => {\n                const ids = ['sec-photos', 'sec-comments', 'sec-premium'];`
);

fs.writeFileSync(filepath, contentStr);
console.log('Successfully moved valuation down and grouped basic info.');
