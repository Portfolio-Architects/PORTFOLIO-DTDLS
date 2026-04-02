const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardClient.tsx', 'utf8');

// The mobile list currently uses Math.min(sorted.length * 72, 600)
// Let's replace it with sorted.length * 72 to eliminate the box trap.
code = code.replace(
  "Math.min(sorted.length * 72, 600)",
  "sorted.length * 72"
);

fs.writeFileSync('src/components/DashboardClient.tsx', code);
console.log('FixedSizeList mobile height cap removed successfully!');
