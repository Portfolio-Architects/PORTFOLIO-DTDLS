const fs = require('fs');

const data = fs.readFileSync('c:\\Users\\ocs56\\OneDrive\\바탕 화면\\PORTFOLIO\\PORTFOLIO - DTDLS\\frontend\\data\\transactions_cache.json', 'utf8');
const txData = JSON.parse(data);

let sum3 = 0, count3 = 0;
let sum4 = 0, count4 = 0;

for (const apt of Object.values(txData)) {
    const sales = apt.filter(t => t.dealType !== '전세' && t.dealType !== '월세');
    const std = sales.filter(t => t.area >= 70 && t.area <= 90); // ~ 30-36 pyeong
    std.sort((a,b) => b.contractDate.localeCompare(a.contractDate));
    
    if (std.length > 0) {
        const tx3 = std.find(t => t.contractYm <= '202603');
        if (tx3) { sum3 += tx3.price; count3++; }
        
        const tx4 = std.find(t => t.contractYm <= '202604');
        if (tx4) { sum4 += tx4.price; count4++; }
        
        if (tx3 && tx4 && tx4.price < tx3.price * 0.7) {
            console.log(`MASSIVE DROP in April: ${tx3.aptName} - Mar: ${tx3.price}, Apr: ${tx4.price}`);
        }
    }
}
console.log(`March: sum=${sum3}, count=${count3}, avg=${sum3/count3}`);
console.log(`April: sum=${sum4}, count=${count4}, avg=${sum4/count4}`);
