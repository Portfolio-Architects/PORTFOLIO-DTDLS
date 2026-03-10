import type { Metadata } from 'next';
import { PieChart, LayoutDashboard, Building2, Newspaper, MessageSquare, Search, Bell } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dongtan Data Labs | 동탄 데이터 허브',
  description: '동탄 지역의 최신 실거래가, 학군, 상권 혼잡도 데이터를 한눈에 확인하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="flex min-h-screen mx-auto max-w-[1600px] flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="w-full md:w-[250px] md:h-screen md:sticky top-0 flex flex-row md:flex-col p-4 md:p-8 z-[100] bg-white/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-b md:border-b-0 border-[#f2f4f6] md:pb-8 justify-between md:justify-start items-center md:items-stretch fixed md:relative">
            <div className="flex items-center gap-3 md:mb-10 px-0 md:px-3">
              <div className="w-8 h-8 text-[#3182f6] flex items-center justify-center">
                <PieChart size={28} className="fill-current" />
              </div>
              <h2 className="text-[20px] md:text-[22px] font-bold text-[#191f28] tracking-tight">Dongtan<span className="font-normal text-[#8b95a1]">Labs</span></h2>
            </div>

            {/* Nav Menu */}
            <nav className="fixed md:relative bottom-0 left-0 right-0 flex md:flex-col justify-around md:justify-start bg-white md:bg-transparent p-2 md:p-0 border-t md:border-t-0 border-[#f2f4f6] z-[1000] md:z-auto shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:shadow-none gap-1">
              <a href="#" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-3 rounded-lg text-[#3182f6] font-bold bg-[#e8f3ff] transition-all">
                <LayoutDashboard size={20} />
                <span className="text-[12px] md:text-[16px]">대시보드</span>
              </a>
              <a href="#" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-3 rounded-lg text-[#4e5968] font-medium transition-all hover:bg-black/5 hover:text-[#191f28]">
                <Building2 size={20} />
                <span className="text-[12px] md:text-[16px]">부동산 동향</span>
              </a>
              <a href="#" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-3 rounded-lg text-[#4e5968] font-medium transition-all hover:bg-black/5 hover:text-[#191f28]">
                <Newspaper size={20} />
                <span className="text-[12px] md:text-[16px]">지역 뉴스</span>
              </a>
              <a href="#" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-3 rounded-lg text-[#4e5968] font-medium transition-all hover:bg-black/5 hover:text-[#191f28]">
                <MessageSquare size={20} />
                <span className="text-[12px] md:text-[16px]">커뮤니티</span>
              </a>
            </nav>

            {/* Sidebar Ad (Desktop Only) */}
            <div className="hidden md:block mt-auto bg-white border border-[#d1d6db] rounded-2xl p-5 relative">
              <p className="absolute top-3 right-3 bg-[#e5e8eb] text-[#8b95a1] text-[10px] py-1 px-1.5 rounded font-bold">AD</p>
              <div className="text-left">
                <h4 className="text-[15px] mb-1 font-semibold text-[#191f28]">동탄 김수학 학원</h4>
                <p className="text-[13px] text-[#4e5968] mb-4 leading-relaxed">내신부터 수능까지 완벽대비</p>
                <button className="btn-primary w-full rounded-lg">상담 문의</button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 p-5 pt-[80px] md:p-8 flex flex-col gap-6 max-w-[1200px] pb-[100px] md:pb-8">
            <header className="flex justify-between items-center pb-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#191f28]">안녕하세요! 동탄의 최신 데이터를 확인하세요.</h1>
                <p className="text-[#4e5968] text-sm md:text-[15px]">오늘의 주요 지표와 지역 소식입니다.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="icon-btn hidden md:flex"><Search size={22} /></button>
                <button className="icon-btn relative">
                  <Bell size={22} />
                  <span className="badge">3</span>
                </button>
                <div className="w-[44px] h-[44px] rounded-full overflow-hidden border border-[#d1d6db]">
                  <img src="https://ui-avatars.com/api/?name=User&background=6b46c1&color=fff" alt="User Profile" />
                </div>
              </div>
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
