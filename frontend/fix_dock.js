const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardClient.tsx', 'utf-8');

// 1. Hide the top header toggle on mobile
content = content.replace(
  /<div className="inline-flex bg-\[#f2f4f6\] rounded-full p-1 gap-0\.5">/g,
  '<div className="hidden sm:inline-flex bg-[#f2f4f6] rounded-full p-1 gap-0.5">'
);

// 2. Inject the miniature toggle into the mobile dock!
const targetDockStart = '{/* 모바일 전용 하단 플로팅 네비게이션 독 */}';
const targetDockEnd = '</nav>';

const newDock = `{/* 모바일 전용 하단 플로팅 네비게이션 독 */}
      <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-[32px] px-3 py-2.5 flex items-center justify-between border border-[#e5e8eb] w-[92%] max-w-[360px]">
        {/* 면적 토글 (좌측) */}
        <div className="flex flex-col items-center justify-center pl-1 shrink-0">
          <div className="flex flex-col bg-[#f2f4f6] rounded-[14px] p-0.5 gap-0.5 min-w-[32px] shadow-inner">
            <button
              onClick={() => setAreaUnit('m2')}
              className={\`px-1 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 leading-none \${
                areaUnit === 'm2' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
              }\`}
            >
              m²
            </button>
            <button
              onClick={() => setAreaUnit('pyeong')}
              className={\`px-1 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 leading-none \${
                areaUnit === 'pyeong' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
              }\`}
            >
              평
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-[1px] h-9 bg-[#e5e8eb] mx-2 shrink-0" />

        {/* 우측 3개 탭 */}
        <div className="flex items-center justify-between flex-1 gap-1">
          {[
            { id: 'imjang' as const, label: '임장기', icon: Compass },
            { id: 'lounge' as const, label: '라운지', icon: MessageSquare },
            { id: 'recommend' as const, label: '집 추천', icon: Home },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={\`flex flex-col items-center justify-center w-full min-h-[50px] rounded-[22px] transition-all duration-300 relative \${
                  isActive ? 'text-[#3182f6]' : 'text-[#8b95a1] hover:text-[#4e5968]'
                }\`}
              >
                {isActive && (
                   <div className="absolute inset-0 bg-[#3182f6]/10 rounded-[22px] transition-opacity" />
                )}
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1 relative z-10" />
                <span className="text-[10px] font-bold tracking-wide relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>`;

const startIdx = content.indexOf(targetDockStart);
const endIdx = content.indexOf(targetDockEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newDock + content.substring(endIdx + targetDockEnd.length);
  fs.writeFileSync('src/components/DashboardClient.tsx', content);
  console.log('Dock updated successfully!');
} else {
  console.error('Dock section not found!');
}
