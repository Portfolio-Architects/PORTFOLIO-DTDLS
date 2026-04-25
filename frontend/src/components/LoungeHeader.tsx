'use client';

import { TrendingUp, MessageSquare, Home, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import FloatingUserBar from '@/components/FloatingUserBar';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dashboardFacade } from '@/lib/DashboardFacade';

export default function LoungeHeader({ activeTab = 'lounge' }: { activeTab?: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Dynamic Minimal Sticky Header */}
      <div 
        className={`fixed top-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] shadow-sm z-50 transition-transform duration-300 flex items-center justify-between px-3 md:px-10 lg:px-16 h-[52px] ${
          isScrolled ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <span className="font-extrabold text-[#191f28] tracking-tight text-[15px] flex items-center gap-2">
           <img src="/d-view-icon.png" alt="D-VIEW" className="w-[22px] h-[22px] rounded-md" />
           <span className="text-[#3182f6]">D-VIEW</span>
           <span className="text-[#b0b8c1] font-normal text-[13px]">|</span>
           <span className="text-[#4e5968] font-semibold text-[14px]">동탄 아파트 가치 분석</span>
        </span>
        <div className="flex items-center -mr-1">
          <FloatingUserBar />
        </div>
      </div>
      
      {/* Main Header — Logo + Nav integrated */}
      <header className="shrink-0 bg-white/95 backdrop-blur-xl border-b border-[#e5e8eb] relative z-40" role="banner">
        <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 pb-3 md:py-4 gap-4 md:gap-0">
            
            {/* Left: Brand */}
            <div className="flex-1 flex items-center justify-between md:justify-start">
              <Link 
                href="/"
                className="flex items-center gap-3.5 cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <img src="/d-view-icon.png" alt="D-VIEW" className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300" />
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="text-[19px] sm:text-[22px] font-bold tracking-tight text-[#191f28] leading-none mb-1.5">
                    동탄 아파트 가치 분석
                  </h1>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="px-1.5 py-[3px] bg-[#f2f4f6] text-[#4e5968] rounded-[4px] text-[10px] font-bold tracking-widest leading-none">
                      DATA LAB
                    </span>
                    <span className="text-[11px] font-semibold text-[#8b95a1] tracking-wide">
                      Powered by D-VIEW
                    </span>
                  </div>
                </div>
              </Link>
              
              {/* Mobile User Bar */}
              <div className="md:hidden flex items-center -mr-1">
                <FloatingUserBar />
              </div>
            </div>

            {/* Center: Nav Tabs (Segmented Control Style) */}
            <nav className="hidden md:flex shrink-0 items-center gap-1 sm:gap-1.5 bg-[#f2f4f6]/80 p-1.5 rounded-[16px] overflow-x-auto no-scrollbar" aria-label="메인 메뉴">
              <Link
                href="/"
                className={`flex items-center justify-center min-w-[90px] sm:min-w-[100px] gap-1.5 px-3 py-2.5 text-[13px] sm:text-[14px] font-bold transition-all duration-300 rounded-[12px] ${
                  activeTab === 'imjang'
                    ? 'bg-white text-[#191f28] shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5'
                    : 'text-[#8b95a1] hover:text-[#4e5968] hover:bg-black/5'
                }`}
              >
                <TrendingUp size={16} className={activeTab === 'imjang' ? 'text-[#3182f6]' : 'text-[#8b95a1] group-hover:scale-110 transition-transform duration-200'} />
                <span>단지 분석</span>
              </Link>
              
              <Link
                href="/lounge"
                className={`flex items-center justify-center min-w-[90px] sm:min-w-[100px] gap-1.5 px-3 py-2.5 text-[13px] sm:text-[14px] font-bold transition-all duration-300 rounded-[12px] ${
                  activeTab === 'lounge'
                    ? 'bg-white text-[#191f28] shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5'
                    : 'text-[#8b95a1] hover:text-[#4e5968] hover:bg-black/5'
                }`}
              >
                <MessageSquare size={16} className={activeTab === 'lounge' ? 'text-[#3182f6]' : 'text-[#8b95a1] group-hover:scale-110 transition-transform duration-200'} />
                <span>커뮤니티</span>
              </Link>
              
              <Link
                href="/#recommend"
                className={`flex items-center justify-center min-w-[90px] sm:min-w-[100px] gap-1.5 px-3 py-2.5 text-[13px] sm:text-[14px] font-bold transition-all duration-300 rounded-[12px] ${
                  activeTab === 'recommend'
                    ? 'bg-white text-[#3182f6] shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5'
                    : 'text-[#8b95a1] hover:text-[#4e5968] hover:bg-black/5'
                }`}
              >
                <Home size={16} className={activeTab === 'recommend' ? 'text-[#3182f6]' : 'text-[#8b95a1] group-hover:scale-110 transition-transform duration-200'} />
                <span>아파트 탐색</span>
              </Link>

              {dashboardFacade.isAdmin(user?.email) && (
                <Link
                  href="/admin"
                  className="flex items-center justify-center min-w-[90px] sm:min-w-[100px] gap-1.5 px-3 py-2.5 text-[13px] sm:text-[14px] font-bold transition-all duration-300 rounded-[12px] text-[#ef4444] hover:bg-black/5"
                >
                  <ShieldCheck size={16} className="text-[#ef4444] transition-transform duration-200" />
                  <span>관리자</span>
                </Link>
              )}
            </nav>

            {/* Right: Desktop User Bar */}
            <div className="hidden md:flex flex-1 items-center justify-end">
              <FloatingUserBar />
            </div>
            
          </div>
        </div>
      </header>
    </>
  );
}
