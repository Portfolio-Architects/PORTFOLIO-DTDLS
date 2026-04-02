const fs = require('fs');
let content = fs.readFileSync('src/components/ApartmentModal.tsx', 'utf-8');

if (content.includes('transactions={sortedFilteredTransactions}')) {
  // Replace only the occurrence tied to AdvancedValuationMetrics
  content = content.replace(
    /<AdvancedValuationMetrics\s+report=\{report\}\s+transactions=\{sortedFilteredTransactions\}\s*\/>/g,
    '<AdvancedValuationMetrics report={report} transactions={transactions} />'
  );
  fs.writeFileSync('src/components/ApartmentModal.tsx', content);
  console.log('Restored transactions prop!');
} else {
  console.log('Target not found!');
}
