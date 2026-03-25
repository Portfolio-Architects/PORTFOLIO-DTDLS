const fs = require('fs');

const filepath = 'd:\\Desktop\\PORTFOLIO\\PORTFOLIO - DTDLS\\frontend\\src\\components\\ApartmentModal.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const deletedBlock = `            );
          })()}

          {/* 밸류에이션 퀀트 수치 — 무료 티어 개방 */}
            {report.premiumScores && transactions.length > 0 && (() => {
              // 84㎡ 기준 가격 산출
              const tx84 = transactions.find(t => t.area >= 80 && t.area <= 88) || transactions[0];
              const price84 = tx84 ? normalize84Price(tx84.price, tx84.area) : 0;
              const formatYear = (y: string | number | undefined) => {
                if (!y) return null;
                const s = String(y).trim();
                return /^\\d{6}$/.test(s) ? \`\${s.slice(0, 4)}년 \${s.slice(4, 6)}월\` : \`\${s}년\`;
              };
              return price84 > 0 ? (
                <div className="mb-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb]">
                  
                  {/* 기본 정보 */}
                  <div className="mb-2">
                    <h3 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-4">
                      <Building2 size={18} className="text-[#3182f6]"/> 단지 기본 정보
                    </h3>
                    <div className="w-full grid grid-cols-3 md:grid-cols-6 gap-[1px] bg-[#e5e8eb] border border-[#e5e8eb] rounded-2xl overflow-hidden">
                      [
                        { label: '세대수', value: report.metrics?.householdCount ? \`\${report.metrics.householdCount.toLocaleString()}세대\` : '-' },
                        { label: '준공연도', value: formatYear(report.metrics?.yearBuilt) || formatYear(transactions.find(t => t.buildYear)?.buildYear) || '-' },
                        { label: '주차(세대당)', value: report.metrics?.parkingPerHousehold ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{Number(report.metrics.parkingPerHousehold).toFixed(2)}대</span>
                            {report.metrics.parkingCount && (
                              <span className="text-[10px] text-[#8b95a1] font-medium leading-none">총 {report.metrics.parkingCount.toLocaleString()}대</span>
                            )}
                          </div>
                        ) : '-' },
                        { label: '용적률', value: report.metrics?.far ? \`\${report.metrics.far}%\` : '-' },
                        { label: '건폐율', value: report.metrics?.bcr ? \`\${report.metrics.bcr}%\` : '-' },
                        { label: '브랜드', value: report.metrics?.brand || '-' },`;

// Find where it was replaced
const searchTarget = `                      ].map((item, i) => (
                        <div key={i} className="bg-white p-3.5 flex flex-col items-center justify-center text-center">`;

if (content.includes(searchTarget)) {
  content = content.replace(searchTarget, deletedBlock + '\\n' + searchTarget);
  // Remove the dangling `[` that was left in the file since we are inserting it via deletedBlock
  content = content.replace(`                      [\n                      ].map((item, i)`, `                      ].map((item, i)`);
  fs.writeFileSync(filepath, content);
  console.log("Successfully restored the deleted block.");
} else {
  console.log("Target not found!");
}
