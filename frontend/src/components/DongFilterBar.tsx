'use client';

import { DONGS, getDongByName } from '@/lib/dongs';

interface DongFilterBarProps {
  selectedDong: string | null;
  onSelectDong: (dong: string | null) => void;
  totalAptCount: number;
  dongAptCounts: Record<string, number>;
  dongReportCounts: Record<string, number>;
}

export default function DongFilterBar({
  selectedDong,
  onSelectDong,
  totalAptCount,
  dongAptCounts,
  dongReportCounts,
}: DongFilterBarProps) {
  return (
    <>
      {/* ── Dong Filter Chips ── */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            suppressHydrationWarning
            onClick={() => onSelectDong(null)}
            className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
              !selectedDong
                ? 'bg-[#191f28] text-white shadow-md'
                : 'bg-[#f2f4f6] text-[#8b95a1] hover:bg-[#e5e8eb]'
            }`}
          >
            전체 ({totalAptCount})
          </button>
          {DONGS.map(dong => {
            const aptCount = dongAptCounts[dong.name] || 0;
            const reportCount = dongReportCounts[dong.name] || 0;
            const isActive = selectedDong === dong.name;
            if (aptCount === 0) return null;
            return (
              <button
                suppressHydrationWarning
                key={dong.id}
                onClick={() => onSelectDong(isActive ? null : dong.name)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'bg-[#f2f4f6] text-[#4e5968] hover:bg-[#e5e8eb]'
                }`}
                style={isActive ? { backgroundColor: dong.color } : {}}
              >
                {dong.name} ({aptCount})
                {reportCount > 0 && <span className="text-[10px] opacity-70">📝{reportCount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 동 소개 배너 (선택 시) ── */}
      {selectedDong && (() => {
        const dongInfo = getDongByName(selectedDong);
        if (!dongInfo) return null;
        return (
          <div className="mb-6 bg-white rounded-2xl border border-[#e5e8eb] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-[16px] sm:text-[18px] font-extrabold text-[#191f28]">{dongInfo.name}</h3>
              <p className="text-[12px] sm:text-[13px] text-[#8b95a1] mt-0.5 line-clamp-2">{dongInfo.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center">
                <div className="text-[16px] sm:text-[18px] font-extrabold text-[#191f28]">{dongAptCounts[selectedDong] || 0}</div>
                <div className="text-[10px] text-[#8b95a1] font-bold">아파트</div>
              </div>
              <div className="text-center">
                <div className="text-[16px] sm:text-[18px] font-extrabold text-[#3182f6]">{dongReportCounts[selectedDong] || 0}</div>
                <div className="text-[10px] text-[#8b95a1] font-bold">리포트</div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
