const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardClient.tsx', 'utf8');

// 1. Add ArrowUp to lucide-react imports if not there
if (!code.includes('ArrowUp')) {
  code = code.replace(
    /import \{([^{}]+)\} from 'lucide-react';/,
    (match, p1) => {
      return `import { ArrowUp, ${p1.trim()} } from 'lucide-react';`;
    }
  );
}

// 2. Add ScrollToTop button right before WriteReviewModal
const scrollToTopButton = `
      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={\`fixed z-50 bottom-24 sm:bottom-8 right-4 sm:right-8 bg-white text-[#3182f6] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#e5e8eb] w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#f8f9fa] hover:scale-105 active:scale-95 \${
          isScrolled ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-10 opacity-0 pointer-events-none'
        }\`}
        aria-label="맨 위로 이동"
        title="맨 위로 이동"
      >
        <ArrowUp size={22} strokeWidth={2.5} />
      </button>

`;

if (!code.includes('Scroll to Top Button')) {
  code = code.replace(
    /\{showReviewModal && user && \(/g,
    scrollToTopButton + '      {showReviewModal && user && ('
  );
  fs.writeFileSync('src/components/DashboardClient.tsx', code);
  console.log('Scroll to Top button added successfully!');
} else {
  console.log('Scroll to Top button already exists!');
}
