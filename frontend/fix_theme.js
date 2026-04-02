const fs = require('fs');
// Fix DashboardClient.tsx
let dashboard = fs.readFileSync('src/components/DashboardClient.tsx', 'utf-8');

dashboard = dashboard.replace('bg-[#191f28]/95', 'bg-white/90');
dashboard = dashboard.replace('shadow-[0_20px_40px_rgba(0,0,0,0.3)]', 'shadow-[0_10px_40px_rgba(0,0,0,0.15)]');
dashboard = dashboard.replace('border-white/10', 'border-[#e5e8eb]');
dashboard = dashboard.replace("isActive ? 'text-white' : 'text-[#8b95a1] hover:text-[#d1d6db]'", "isActive ? 'text-[#3182f6]' : 'text-[#8b95a1] hover:text-[#4e5968]'");
dashboard = dashboard.replace('bg-white/10', 'bg-[#3182f6]/10');
fs.writeFileSync('src/components/DashboardClient.tsx', dashboard);

// Fix ApartmentModal.tsx
let modal = fs.readFileSync('src/components/ApartmentModal.tsx', 'utf-8');

modal = modal.replace(
  "background: '#1e293b', borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: 'none'",
  "background: '#ffffff', borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #f2f4f6'"
);
modal = modal.split("color: 'rgba(255,255,255,0.5)'").join("color: '#8b95a1'");

modal = modal.replace(
  "color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2",
  "color: '#8b95a1', fontSize: 11, marginTop: 2"
);

modal = modal.replace(
  "background: '#1e293b', borderRadius: 10, padding: '10px 14px',",
  "background: '#ffffff', borderRadius: 10, padding: '10px 14px', border: '1px solid #f2f4f6',"
);
modal = modal.replace(
  "boxShadow: '0 8px 24px rgba(0,0,0,0.25)',",
  "boxShadow: '0 8px 24px rgba(0,0,0,0.12)',"
);

modal = modal.replace(
  /<div style=\{\{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 3 \}\}>/g,
  "<div style={{ color: '#191f28', fontSize: 16, fontWeight: 800, marginBottom: 3 }}>"
);

modal = modal.replace(
  /\{typeName \? <span style=\{\{ color: '#93c5fd', fontWeight: 600 \}\}>\{typeName\}<\/span> : <span>\{d\.area\}평<\/span>\}/g,
  "{typeName ? <span style={{ color: '#3182f6', fontWeight: 600 }}>{typeName}</span> : <span>{d.area}평</span>}"
);

fs.writeFileSync('src/components/ApartmentModal.tsx', modal);
console.log('Themes switched to light mode!');
