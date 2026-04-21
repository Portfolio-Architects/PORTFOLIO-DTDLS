'use client';

import { Compass, MessageSquare, Home } from 'lucide-react';
import Link from 'next/link';

interface MobileDockProps {
  activeTab: 'imjang' | 'lounge' | 'recommend';
  areaUnit?: 'm2' | 'pyeong';
  setAreaUnit?: (unit: 'm2' | 'pyeong') => void;
  onTabClick?: (tab: 'imjang' | 'recommend') => void;
}

export default function MobileDock({ activeTab, areaUnit = 'm2', setAreaUnit, onTabClick }: MobileDockProps) {
  return (
    <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-[32px] px-3 py-2.5 flex items-center justify-between border border-[#e5e8eb] w-[92%] max-w-[360px]">
      {/* 면적 토글 (좌측) */}
      <div className="flex flex-col items-center justify-center pl-1 shrink-0">
        <div className="flex flex-col bg-[#f2f4f6] rounded-[14px] p-0.5 gap-0.5 min-w-[32px] shadow-inner">
          <button
            onClick={() => setAreaUnit?.('m2')}
            className={`px-1 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 leading-none ${
              areaUnit === 'm2' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
            }`}
          >
            m²
          </button>
          <button
            onClick={() => setAreaUnit?.('pyeong')}
            className={`px-1 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 leading-none ${
              areaUnit === 'pyeong' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
            }`}
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
          { id: 'imjang' as const, label: '단지 분석', icon: Compass, href: '/' },
          { id: 'lounge' as const, label: '커뮤니티', icon: MessageSquare, href: '/lounge' },
          { id: 'recommend' as const, label: '아파트 탐색', icon: Home, href: '/#recommend' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          
          if (onTabClick && tab.id !== 'lounge') {
             // Dashboard usage
             return (
               <button
                 key={tab.id}
                 onClick={() => onTabClick(tab.id as 'imjang' | 'recommend')}
                 className={`flex flex-col items-center justify-center w-full min-h-[50px] rounded-[22px] transition-all duration-300 relative ${
                   isActive ? 'text-[#3182f6]' : 'text-[#8b95a1] hover:text-[#4e5968]'
                 }`}
               >
                 {isActive && (
                    <div className="absolute inset-0 bg-[#3182f6]/10 rounded-[22px] transition-opacity" />
                 )}
                 <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1 relative z-10" />
                 <span className="text-[10px] font-bold tracking-wide relative z-10">{tab.label}</span>
               </button>
             );
          }

          // Lounge or cross-page links
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full min-h-[50px] rounded-[22px] transition-all duration-300 relative ${
                isActive ? 'text-[#3182f6]' : 'text-[#8b95a1] hover:text-[#4e5968]'
              }`}
            >
              {isActive && (
                 <div className="absolute inset-0 bg-[#3182f6]/10 rounded-[22px] transition-opacity" />
              )}
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1 relative z-10" />
              <span className="text-[10px] font-bold tracking-wide relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
