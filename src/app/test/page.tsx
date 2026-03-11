'use client';

import { useState } from 'react';
import { useDashboardData } from '@/lib/DashboardFacade';
import { MapPin, CheckCircle2 } from 'lucide-react';

export default function RegionSelectorTestPage() {
  const { dongtanApartments } = useDashboardData();
  const [selectedDong, setSelectedDong] = useState<string>('');
  const [reportAptName, setReportAptName] = useState('');

  // Extract unique "Dongs" (e.g., [오산동] -> 오산동)
  const availableDongs = Array.from(
    new Set(dongtanApartments.map(apt => apt.match(/\[(.*?)\]/)?.[1]).filter(Boolean))
  ) as string[];

  // Filter apartments by the selected Dong
  const filteredApts = dongtanApartments.filter(apt => apt.includes(`[${selectedDong}]`));

  return (
    <div className="min-h-screen bg-[#f2f4f6] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl p-8 shadow-xl border border-[#e5e8eb]">
        
        <div className="mb-8 text-center">
          <span className="bg-[#e8f3ff] text-[#3182f6] text-[12px] font-bold px-3 py-1 rounded-full mb-3 inline-block">조작해보기</span>
          <h1 className="text-[24px] font-extrabold text-[#191f28] tracking-tight mb-2">우리 동네 단지 찾기</h1>
          <p className="text-[14px] text-[#4e5968] leading-relaxed">
            사는 동네를 먼저 고른 뒤, 단지를 골라주세요.
          </p>
        </div>

        <div className="bg-[#f9fafb] rounded-2xl p-6 border border-[#e5e8eb]">
          <h2 className="text-[16px] font-bold text-[#191f28] mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-[#3182f6]" /> 다녀오신 아파트를 선택해주세요
          </h2>
          
          {/* 1. Dong Selector (Horizontal Scroll) */}
          {dongtanApartments.length === 0 ? (
            <div className="bg-[#f2f4f6] rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-pulse border border-[#e5e8eb] mb-4">
              <div className="w-8 h-8 rounded-full border-2 border-[#3182f6] border-t-transparent animate-spin mb-4"></div>
              <p className="text-[15px] font-bold text-[#4e5968]">우리 동네 단지 목록을 가져오고 있어요...</p>
              <p className="text-[13px] text-[#8b95a1] mt-1">조금만 기다려주세요!</p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="flex gap-2.5 overflow-x-auto pb-3 custom-scrollbar">
                  {availableDongs.map(dong => (
                    <button
                      key={dong}
                      onClick={() => {
                        setSelectedDong(dong);
                        setReportAptName(''); // Reset apt on dong change
                      }}
                      className={`shrink-0 px-4 py-2.5 rounded-full text-[14px] font-bold transition-all border ${
                        selectedDong === dong 
                          ? 'bg-[#191f28] text-white border-[#191f28] shadow-md' 
                          : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6] hover:text-[#3182f6]'
                      }`}
                    >
                      {dong}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Apartment Selector (Vertical List) */}
              {selectedDong && (
                <div className="bg-white border border-[#d1d6db] rounded-xl overflow-hidden mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {filteredApts.length > 0 ? (
                    <ul className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                      {filteredApts.map(apt => (
                        <li key={apt}>
                          <button
                            onClick={() => setReportAptName(apt)}
                            className={`w-full text-left px-4 py-3.5 text-[14px] font-medium rounded-lg transition-colors ${
                              reportAptName === apt
                                ? 'bg-[#e8f3ff] text-[#3182f6] font-bold'
                                : 'text-[#191f28] hover:bg-[#f2f4f6]'
                            }`}
                          >
                            {apt}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-[#8b95a1] text-[14px]">이 동네에는 등록된 단지가 없어요.</div>
                  )}
                </div>
              )}

              {!selectedDong && (
                <div className="bg-white border border-dashed border-[#d1d6db] rounded-xl p-6 text-center text-[14px] text-[#8b95a1] mb-4">
                  위에서 먼저 <strong>'동네 이름'</strong>을 골라주세요!
                </div>
              )}
            </>
          )}

          <div className="flex items-start gap-2 bg-[#f0fdf4] p-3.5 rounded-xl border border-[#bbf7d0]">
            <CheckCircle2 size={18} className="text-[#03c75a] shrink-0" />
            <p className="text-[13.5px] text-[#03c75a] font-bold leading-snug">
              정확한 정보를 위해 지도에 등록된 실제 아파트 이름만 선택할 수 있어요.
            </p>
          </div>
        </div>

        {/* Debug Result Display */}
        <div className="mt-6 pt-6 border-t border-[#e5e8eb]">
           <p className="text-[13px] text-[#8b95a1] font-medium mb-2">내가 고른 동네와 단지:</p>
           <div className="bg-[#191f28] text-[#e8f3ff] p-4 rounded-xl font-mono text-[13px] break-all">
             const selectedDong = "{selectedDong}";<br/>
             const reportAptName = "{reportAptName}";
           </div>
        </div>

      </div>
    </div>
  );
}
