'use client';

import { Compass, MessageSquare, Home } from 'lucide-react';
import Link from 'next/link';

interface MobileDockProps {
  activeTab: 'imjang' | 'lounge';
  areaUnit?: 'm2' | 'pyeong';
  setAreaUnit?: (unit: 'm2' | 'pyeong') => void;
  onTabClick?: (tab: 'imjang') => void;
}

export default function MobileDock({ activeTab, areaUnit = 'm2', setAreaUnit, onTabClick }: MobileDockProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)] rounded-t-[24px] px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center justify-between border-t border-border w-full">
      {/* 3개 탭 */}
      <div className="flex items-center justify-between flex-1 gap-1">
        {[
          { id: 'imjang' as const, label: '아파트 탐색', icon: Home, href: '/' },
          { id: 'lounge' as const, label: '커뮤니티', icon: MessageSquare, href: '/lounge' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          
          if (onTabClick && tab.id !== 'lounge') {
             // Dashboard usage
             return (
               <button
                 key={tab.id}
                 onClick={() => onTabClick(tab.id as 'imjang')}
                 className={`flex flex-col items-center justify-center w-full min-h-[44px] rounded-[20px] transition-all duration-300 relative ${
                   isActive ? 'text-toss-blue' : 'text-tertiary hover:text-secondary'
                 }`}
               >
                 {isActive && (
                    <div className="absolute inset-0 bg-toss-blue/10 rounded-[20px] transition-opacity" />
                 )}
                 <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-0.5 relative z-10" />
                 <span className="text-[10px] font-bold tracking-wide relative z-10">{tab.label}</span>
               </button>
             );
          }

          // Lounge or cross-page links
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full min-h-[44px] rounded-[20px] transition-all duration-300 relative ${
                isActive ? 'text-toss-blue' : 'text-tertiary hover:text-secondary'
              }`}
            >
              {isActive && (
                 <div className="absolute inset-0 bg-toss-blue/10 rounded-[20px] transition-opacity" />
              )}
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-0.5 relative z-10" />
              <span className="text-[10px] font-bold tracking-wide relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 구분선 */}
      <div className="w-[1px] h-8 bg-[#e5e8eb] mx-2 shrink-0" />

      {/* 면적 토글 (우측) */}
      <div className="flex flex-col items-center justify-center pr-1 shrink-0">
        <div className="flex flex-col bg-body rounded-[14px] p-0.5 gap-0.5 min-w-[32px] shadow-inner">
          <button
            onClick={() => setAreaUnit?.('m2')}
            className={`px-1 py-1 rounded-[10px] text-[10px] font-extrabold transition-all duration-200 leading-none ${
              areaUnit === 'm2' ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'
            }`}
          >
            m²
          </button>
          <button
            onClick={() => setAreaUnit?.('pyeong')}
            className={`px-1 py-1 rounded-[10px] text-[10px] font-extrabold transition-all duration-200 leading-none ${
              areaUnit === 'pyeong' ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'
            }`}
          >
            평
          </button>
        </div>
      </div>
    </nav>
  );
}
