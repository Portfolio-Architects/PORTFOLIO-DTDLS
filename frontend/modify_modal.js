const fs = require('fs');
const filepath = 'd:\\Desktop\\PORTFOLIO\\PORTFOLIO - DTDLS\\frontend\\src\\components\\ApartmentModal.tsx';
let content = fs.readFileSync(filepath, 'utf8').split('\n');

const startIdx = content.findIndex(l => l.includes('Location Infrastructure Info — Enhanced with categories + raw data'));
const endIdx = content.findIndex(l => l.includes('Anchor Tenant Metrics — 앵커 테넌트 인접도 시각화'));

if (startIdx !== -1 && endIdx !== -1) {
  content.splice(startIdx - 1, endIdx - startIdx + 1); // remove the lines
  
  const lp1 = content.findIndex(l => l.includes("const LocationPremiumSection = dynamic"));
  if (lp1 !== -1) {
    content[lp1] = "const RawMetricsSection = dynamic(() => import('@/components/consumer/RawMetricsSection'), { ssr: false });";
  }
  
  const lp2 = content.findIndex(l => l.includes("<LocationPremiumSection scores={report.premiumScores} />"));
  if (lp2 !== -1) {
    content[lp2] = "                  <RawMetricsSection metrics={report.metrics} />";
  }
  
  fs.writeFileSync(filepath, content.join('\n'));
  console.log('Successfully updated ApartmentModal.tsx');
} else {
  console.log('Failed to find exact boundaries', startIdx, endIdx);
}
