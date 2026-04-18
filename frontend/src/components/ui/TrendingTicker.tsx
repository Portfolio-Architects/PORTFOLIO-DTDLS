'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Flame } from 'lucide-react';

interface TrendingTickerProps {
  topApts: { name: string; rank: number }[];
}

export function TrendingTicker({ topApts }: TrendingTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // PAUSED: 실시간 인기검색 로직 임시 중단 (추후 복원)
    /*
    if (topApts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topApts.length);
    }, 3000); // 3초마다 롤링
    return () => clearInterval(interval);
    */
  }, [topApts]);

  // if (topApts.length === 0) return null; // 빈 데이터라도 틀은 보여주기 위해 주석 처리

  return (
    <div className="bg-gradient-to-r from-[#fff0f0] to-white border-y border-[#ffe5e5] px-4 py-2 flex items-center justify-between w-full overflow-hidden shadow-sm">
      <div className="flex items-center gap-2">
        <Flame size={16} className="text-[#ff3b30] animate-pulse" />
        <span className="text-[12px] font-black text-[#ff3b30] shrink-0 tracking-tight">실시간 인기 검색</span>
      </div>
      
      <div className="flex-1 relative h-5 ml-4 overflow-hidden flex items-center">
        <span className="text-[13px] font-bold text-[#8b95a1]">-</span>
      </div>

      <TrendingUp size={14} className="text-[#8b95a1] shrink-0 ml-2" />
    </div>
  );
}
