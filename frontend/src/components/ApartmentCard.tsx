'use client';

import Sparkline from '@/components/Sparkline';
import { normalize84Price } from '@/lib/utils/valuation';
import type { AptTxSummary } from '@/lib/transaction-summary';
import type { FieldReportData } from '@/lib/DashboardFacade';

interface StaticApartment {
  name: string;
  dong: string;
  householdCount?: number;
  yearBuilt?: string;
  brand?: string;
}

interface ApartmentCardProps {
  apt: StaticApartment;
  txSummary?: AptTxSummary;
  report?: FieldReportData;
  isPublicRental: boolean;
  onClick: () => void;
}

export default function ApartmentCard({ apt, txSummary, report, isPublicRental, onClick }: ApartmentCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#e5e8eb] p-5 transition-all duration-200 group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-[#3182f6]/30 ${
        !report && !txSummary ? 'opacity-70' : ''
      }`}
    >
      {/* 상단: 이름 + 뱃지 */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-extrabold text-[#191f28] truncate group-hover:text-[#3182f6] transition-colors">{apt.name}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {apt.householdCount && <span className="text-[11px] text-[#8b95a1]">{apt.householdCount.toLocaleString()}세대</span>}
            {apt.yearBuilt && <span className="text-[11px] text-[#8b95a1]">· {apt.yearBuilt}년</span>}
            {apt.brand && <span className="text-[11px] text-[#8b95a1]">· {apt.brand}</span>}
          </div>
        </div>
        {report && (
          <div className="shrink-0 ml-2">
            <span className="text-[10px] font-bold bg-[#f0fdf4] text-[#03c75a] px-2 py-0.5 rounded-md">✅ 현장 검증</span>
          </div>
        )}
        {!report && isPublicRental && (
          <div className="shrink-0 ml-2">
            <span className="text-[10px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-md">🏠 공공임대</span>
          </div>
        )}
      </div>

      {/* 실거래가 요약 (정적 데이터) + 스파크라인 */}
      {txSummary ? (
        <div className="bg-[#f9fafb] rounded-xl px-3 py-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8b95a1]">최근</span>
              <span className="text-[14px] font-extrabold text-[#191f28]">{txSummary.latestPriceEok}</span>
              <span className="text-[11px] font-bold text-[#3182f6]">{txSummary.latestArea}평</span>
            </div>
            <div className="flex items-center gap-1.5">
              {txSummary.recent && txSummary.recent.length >= 2 && (
                <Sparkline data={[...txSummary.recent].reverse().map(r => {
                  const match = r.priceEok.match(/(\d+)억([\d,]*)/);
                  if (!match) return 0;
                  return parseInt(match[1]) * 10000 + parseInt((match[2] || '0').replace(/,/g, ''));
                })} width={48} height={16} />
              )}
              <span className="text-[10px] text-[#8b95a1]">{txSummary.txCount}건</span>
            </div>
          </div>
          {txSummary.txCount >= 2 && (
            <div className="flex items-center gap-3 mt-1.5 text-[10px]">
              <span className="text-[#8b95a1] font-bold">최고 <span className="text-[#191f28]">{txSummary.maxPriceEok}</span></span>
              <span className="text-[#8b95a1] font-bold">최저 <span className="text-[#191f28]">{txSummary.minPriceEok}</span></span>
              {/* 84㎡ 기준 정규화 가격 */}
              {txSummary.recent?.[0] && (() => {
                const r = txSummary.recent[0];
                const priceMatch = r.priceEok.match(/(\d+)억([\d,]*)/);
                if (!priceMatch) return null;
                const priceMan = parseInt(priceMatch[1]) * 10000 + parseInt((priceMatch[2] || '0').replace(/,/g, ''));
                const norm84 = normalize84Price(priceMan, r.area);
                const norm84Eok = Math.floor(norm84 / 10000);
                const norm84Rem = norm84 % 10000;
                return (
                  <span className="text-[#8b5cf6] font-bold ml-auto">84㎡ {norm84Eok > 0 ? `${norm84Eok}억` : ''}{norm84Rem > 0 ? `${norm84Rem.toLocaleString()}` : ''}</span>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-[#d1d6db] mt-2">거래 내역 없음</div>
      )}
    </div>
  );
}
