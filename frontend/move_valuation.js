const fs = require('fs');

const filepath = 'd:\\Desktop\\PORTFOLIO\\PORTFOLIO - DTDLS\\frontend\\src\\components\\ApartmentModal.tsx';
let contentStr = fs.readFileSync(filepath, 'utf8');

// The sticky nav block
const stickyNavStart = contentStr.indexOf('{/* Sticky Section Nav — stub이면 숨김 */}');
const stickyNavEndMatch = contentStr.indexOf('</nav>\n          )}');
const stickyNavEnd = stickyNavEndMatch !== -1 ? stickyNavEndMatch + 19 : -1;

// The valuation block
const valStart = contentStr.indexOf('{/* 밸류에이션 퀀트 수치 — 무료 티어 개방 */}');
const valEnd = contentStr.indexOf('{/* Photo Gallery — Category Tab Grid (100+ photos) */}');

if (stickyNavStart !== -1 && valStart !== -1 && valEnd !== -1) {
  // Extract valuation block
  const valBlock = contentStr.substring(valStart, valEnd);
  
  // Cut valuation block out
  let newContent = contentStr.substring(0, valStart) + contentStr.substring(valEnd);
  
  // Find the new position to insert Valuation Block (right BEFORE Sticky Nav)
  const insertPos = newContent.indexOf('{/* Sticky Section Nav — stub이면 숨김 */}');
  
  // Insert valuation block
  newContent = newContent.substring(0, insertPos) + valBlock + '\n' + newContent.substring(insertPos);
  
  // Update the array in the Sticky Nav
  newContent = newContent.replace(
    `{['밸류에이션', '현장 사진', '이 아파트 이야기'].map((label, idx) => {`,
    `{['현장 사진', '이 아파트 이야기'].map((label, idx) => {`
  );
  newContent = newContent.replace(
    `const ids = ['sec-premium', 'sec-photos', 'sec-comments'];`,
    `const ids = ['sec-photos', 'sec-comments'];`
  );
  
  fs.writeFileSync(filepath, newContent);
  console.log('Successfully reordered blocks in ApartmentModal.tsx');
} else {
  console.log('Error finding boundaries:', {stickyNavStart, stickyNavEndMatch, valStart, valEnd});
}
