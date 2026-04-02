const fs = require('fs');
let content = fs.readFileSync('src/components/ApartmentModal.tsx', 'utf-8');

if (!content.includes('const cardTransactions = transactions.filter')) {
  content = content.replace(
    /\/\/ 1\) 평형별 최근 거래가 그룹핑\r?\n\s*const byArea = new Map/g,
    `// 1) 평형별 최근 거래가 그룹핑
            const cardTransactions = transactions.filter(tx => {
              if (chartType === 'sale' && (tx.dealType === '전세' || tx.dealType === '월세')) return false;
              if (chartType === 'jeonse' && tx.dealType !== '전세' && tx.dealType !== '월세') return false;
              return true;
            });
            const byArea = new Map`
  );
  fs.writeFileSync('src/components/ApartmentModal.tsx', content);
  console.log('Fixed undefined cardTransactions!');
} else {
  console.log('Already defined!');
}
