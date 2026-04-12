'use client';

import { Compass, MessageSquare, Home } from 'lucide-react';
import Link from 'next/link';
import FloatingUserBar from '@/components/FloatingUserBar';
import { useState, useEffect } from 'react';

export default function LoungeHeader({ activeTab = 'lounge' }: { activeTab?: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [areaUnit, setAreaUnit] = useState<'m2' | 'pyeong'>('m2');

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
      <header className="bg-white border-b border-[#e5e8eb] relative z-40" role="banner">
        <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16">
          {/* Top row: Brand + UserBar */}
          <div className="flex items-center justify-between pt-5 pb-3 sm:pt-6 sm:pb-4">
            <div className="flex items-center gap-3">
              <img src="/d-view-icon.png" alt="D-VIEW" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shadow-sm ring-1 ring-black/5" />
              <div className="flex flex-col mt-0.5">
                <Link href="/">
                  <h1 className="text-[18px] sm:text-[21px] font-extrabold text-[#191f28] tracking-tight leading-tight cursor-pointer">
                    동탄 아파트 가치 분석
                  </h1>
                </Link>
                <div className="hidden sm:flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-[2px] bg-[#e8f3ff] text-[#3182f6] rounded-[5px] text-[10px] sm:text-[11px] font-bold tracking-tight">
                    DATA LAB
                  </span>
                  <span className="text-[12px] sm:text-[13px] font-semibold text-[#505967] tracking-tight">
                    실시간 실거래·임장 리포트
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex bg-[#f2f4f6] rounded-full p-0.5 gap-0.5">
                <button
                  onClick={() => setAreaUnit('m2')}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                    areaUnit === 'm2' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
                  }`}
                >
                  m²
                </button>
                <button
                  onClick={() => setAreaUnit('pyeong')}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                    areaUnit === 'pyeong' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
                  }`}
                >
                  평
                </button>
              </div>
              <div className="hidden sm:block">
                <FloatingUserBar />
              </div>
            </div>
          </div>
          {/* Bottom row: Tab navigation */}
          <nav aria-label="메인 네비게이션" className="flex items-center gap-1 -mb-px">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-bold transition-all duration-200 border-b-2 ${
                activeTab === 'imjang'
                  ? 'border-[#3182f6] text-[#3182f6]'
                  : 'border-transparent text-[#8b95a1] hover:text-[#4e5968] hover:border-[#d1d5db]'
              }`}
            >
              <Compass size={14} strokeWidth={activeTab === 'imjang' ? 2.5 : 1.5} />
              <span>단지 분석</span>
            </Link>
            <Link
              href="/lounge"
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-bold transition-all duration-200 border-b-2 ${
                activeTab === 'lounge'
                  ? 'border-[#3182f6] text-[#3182f6]'
                  : 'border-transparent text-[#8b95a1] hover:text-[#4e5968] hover:border-[#d1d5db]'
              }`}
            >
              <MessageSquare size={14} strokeWidth={activeTab === 'lounge' ? 2.5 : 1.5} />
              <span>커뮤니티</span>
            </Link>
            <Link
              href="/#recommend"
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-bold transition-all duration-200 border-b-2 ${
                activeTab === 'recommend'
                  ? 'border-[#3182f6] text-[#3182f6]'
                  : 'border-transparent text-[#8b95a1] hover:text-[#4e5968] hover:border-[#d1d5db]'
              }`}
            >
              <Home size={14} strokeWidth={activeTab === 'recommend' ? 2.5 : 1.5} />
              <span>집 추천</span>
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
