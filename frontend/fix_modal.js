const fs = require('fs');
let content = fs.readFileSync('src/components/ApartmentModal.tsx', 'utf-8');

// Chunk 1
content = content.replace(
  /\/\/ 1\) 평형별 최근 거래가 그룹핑\n *const byArea = new Map/g,
  `// 1) 평형별 최근 거래가 그룹핑
            const cardTransactions = transactions.filter(tx => {
              if (chartType === 'sale' && (tx.dealType === '전세' || tx.dealType === '월세')) return false;
              if (chartType === 'jeonse' && tx.dealType !== '전세' && tx.dealType !== '월세') return false;
              return true;
            });
            const byArea = new Map`
);

content = content.replace(/transactions\.forEach\(tx => {/g, (match, offset) => {
  // Replace the first 'transactions.forEach' located AFTER '// 1) 평형별 최근 거래가 그룹핑'
  if (offset > content.indexOf('// 1) 평형별 최근 거래가 그룹핑')) {
    if (!global.didReplace) {
      global.didReplace = true;
      return 'cardTransactions.forEach(tx => {';
    }
  }
  return match;
});

// Chunk 2
// Replace occurrences of 'transactions' with 'cardTransactions' specifically in the baseTx section
// Find:
// const baseTx = priceTypeFilter === 'ALL'
//   ? transactions
//   : transactions.filter(tx => String(tx.area) === priceTypeFilter);
content = content.replace(
  /const baseTx \= priceTypeFilter \=\=\= \'ALL\'\n[ \t]*\? transactions\n[ \t]*\: transactions\.filter/g,
  `const baseTx = priceTypeFilter === 'ALL'
              ? cardTransactions
              : cardTransactions.filter`
);

// Chunk 3
content = content.replace(
  /{\/\* --- 평형별 최근 거래가 --- \*\/}\n *<h5 className="text-\[13px\] font-bold text-\[#8b95a1\] mb-3 flex items-center gap-1\.5 mt-2">\n *평형별 최근 거래가\n *<\/h5>/g,
  `{/* --- 평형별 최근 거래가 --- */}
                <div className="flex items-center justify-between mb-3 mt-2">
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
console.log('Successfully patched ApartmentModal.tsx via script!');
