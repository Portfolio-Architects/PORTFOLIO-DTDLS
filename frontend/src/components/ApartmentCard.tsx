'use client';

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
  rank?: number;
  isSelected?: boolean;
  isFavorited?: boolean;
  favoriteCount?: number;
  onToggleFavorite?: () => void;
}

export default function ApartmentCard({ apt, txSummary, report, isPublicRental, onClick, rank, isSelected, isFavorited, favoriteCount, onToggleFavorite }: ApartmentCardProps) {
  // 84㎡ 정규화 가격
  const norm84Label = (() => {
    if (!txSummary?.recent?.[0]) return null;
    const r = txSummary.recent[0];
    const priceMatch = r.priceEok.match(/(\d+)억([\d,]*)/);
    if (!priceMatch) return null;
    const priceMan = parseInt(priceMatch[1]) * 10000 + parseInt((priceMatch[2] || '0').replace(/,/g, ''));
    const norm84 = normalize84Price(priceMan, r.area);
    const eok = Math.floor(norm84 / 10000);
    const rem = norm84 % 10000;
    return `${eok > 0 ? `${eok}억` : ''}${rem > 0 ? rem.toLocaleString() : ''}`;
  })();

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3.5 transition-all duration-150 cursor-pointer hover:bg-[#f9fafb] active:bg-[#f2f4f6] border-b border-[#f2f4f6] last:border-b-0 group ${
        !report && !txSummary ? 'opacity-60' : ''
      } ${
        isSelected ? 'bg-[#f8faff]' : ''
      }`}
    >
      {/* 선택 액센트 바 */}
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#3182f6]" />
      )}
      {/* 순위 */}
      {rank != null && (
        <span className="text-[13px] font-extrabold text-[#8b95a1] w-5 text-center shrink-0 tabular-nums">
          {rank}
        </span>
      )}

      {/* 아파트 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-[14px] font-bold text-[#191f28] truncate group-hover:text-[#3182f6] transition-colors leading-tight">
            {apt.name}
          </h4>
          {report && (
            <span className="text-[9px] font-bold bg-[#f0fdf4] text-[#03c75a] px-1.5 py-[1px] rounded shrink-0">✅</span>
          )}
          {!report && isPublicRental && (
            <span className="text-[9px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-1.5 py-[1px] rounded shrink-0">공공</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-[#8b95a1]">{apt.dong}</span>
          {apt.householdCount && <span className="text-[11px] text-[#d1d6db]">·</span>}
          {apt.householdCount && <span className="text-[11px] text-[#8b95a1]">{apt.householdCount.toLocaleString()}세대</span>}
          {apt.yearBuilt && <span className="text-[11px] text-[#d1d6db]">·</span>}
          {apt.yearBuilt && <span className="text-[11px] text-[#8b95a1]">{apt.yearBuilt}</span>}
        </div>
      </div>

      {/* 가격 영역 */}
      <div className="flex items-center shrink-0">
        {txSummary ? (
          <div className="text-right min-w-[80px]">
            <div className="text-[14px] font-extrabold text-[#191f28] tabular-nums leading-tight">
              {txSummary.latestPriceEok}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-[#3182f6]">{txSummary.latestArea}평</span>
              <span className="text-[10px] text-[#8b95a1]">{txSummary.txCount}건</span>
            </div>
            {norm84Label && (
              <div className="text-[10px] font-bold text-[#8b5cf6] mt-0.5">84㎡ {norm84Label}</div>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-[#d1d6db]">—</span>
        )}
      </div>

      {/* ♡ 관심 등록 버튼 */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            isFavorited 
              ? 'text-[#ff3b30] hover:bg-red-50' 
              : 'text-[#d1d6db] hover:text-[#ff3b30] hover:bg-[#f9fafb]'
          }`}
          title={isFavorited ? '관심 해제' : '관심 등록'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {(favoriteCount ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-[#ff3b30] bg-white rounded-full px-0.5 min-w-[12px] text-center leading-tight">
              {favoriteCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
