const fs = require('fs');
let content = fs.readFileSync('src/components/ApartmentModal.tsx', 'utf-8');

if (!content.includes('setChartType(\'sale\')') || content.split('setChartType(\'sale\')').length < 3) {
  content = content.replace(
    /{\/\* --- 평형별 최근 거래가 --- \*\/}\r?\n\s*<h5 className="text-\[13px\] font-bold text-\[#8b95a1\] mb-3 flex items-center gap-1\.5 mt-2">\r?\n\s*평형별 최근 거래가\r?\n\s*<\/h5>/g,
    `{/* --- 평형별 최근 거래가 --- */}
                <div className="flex items-center justify-between mb-3 mt-2 pr-1">
                  <h5 className="text-[13px] font-bold text-[#8b95a1] flex items-center gap-1.5">
                    평형별 최근 거래가
                  </h5>
                  <div className="bg-[#f2f4f6] p-0.5 rounded-lg flex items-center shadow-inner">
                    <button onClick={() => setChartType('sale')} className={\`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all \${chartType === 'sale' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'}\`}>매매</button>
                    <button onClick={() => setChartType('jeonse')} className={\`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all \${chartType === 'jeonse' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'}\`}>전월세</button>
                  </div>
                </div>`
  );
  fs.writeFileSync('src/components/ApartmentModal.tsx', content);
  console.log('Injected UI toggle!');
} else {
  console.log('UI toggle already exists!');
}
