'use client';

import { FileText } from 'lucide-react';
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
  typeMap?: Record<string, Record<string, { typeM2: string; typePyeong: string }>>;
  areaUnit?: 'm2' | 'pyeong';
}

export default function ApartmentCard({ apt, txSummary, report, isPublicRental, onClick, rank, isSelected, isFavorited, favoriteCount, onToggleFavorite, typeMap, areaUnit = 'm2' }: ApartmentCardProps) {
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
        <span className="text-sm font-extrabold text-[#8b95a1] w-5 text-center shrink-0 tabular-nums">
          {rank}
        </span>
      )}

      {/* 아파트 정보 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-[#191f28] truncate group-hover:text-[#3182f6] transition-colors leading-tight">
          {apt.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-[#8b95a1]">{apt.dong}</span>
          {report && (
            <span className="inline-flex items-center gap-0.5 bg-[#fff8e1] text-[#f59e0b] text-[10px] font-bold px-1.5 py-[1px] rounded-full shrink-0" title="현장 검증 완료">
              <FileText size={9} strokeWidth={2.5} />
              리포트
            </span>
          )}
          {!report && isPublicRental && (
            <span className="text-[11px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-1.5 py-[1px] rounded shrink-0 leading-tight">공공</span>
          )}
        </div>
      </div>

      {/* 가격 영역 */}
      <div className="flex items-center shrink-0">
        {txSummary ? (
          <div className="text-right min-w-[80px]">
            <div className="text-base font-extrabold text-[#191f28] tabular-nums leading-none mb-1">
              {(() => {
                if (!txSummary.avg1MPrice && (txSummary.latestRentDeposit || 0) > 0) {
                  return `전/월세 ${txSummary.latestRentDepositEok}`;
                }
                if (!txSummary.avg1MPrice) return '-';
                const roundedMan = Math.round(txSummary.avg1MPrice / 100) * 100;
                if (roundedMan >= 10000) {
                  const eok = Math.floor(roundedMan / 10000);
                  const rem = roundedMan % 10000;
                  return `${eok}억${rem > 0 ? rem.toLocaleString() : ''}`;
                }
                return `${roundedMan.toLocaleString()}만`;
              })()}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              {(() => {
                if (typeMap && txSummary.recent?.[0]) {
                  const m2Area = txSummary.recent[0].area;
                  const aptNorm = apt.name.replace(/\[.*?\]\s*/g, '').replace(/\s+/g, '').replace(/[()（）]/g, '').trim();
                  const t = typeMap[aptNorm]?.[String(m2Area)];
                  if (t) {
                    const supplyM2Match = t.typeM2?.match(/\d+(\.\d+)?/);
                    const supplyM2 = supplyM2Match ? parseFloat(supplyM2Match[0]) : null;
                    const supplyPyeong = supplyM2 ? Math.round(supplyM2 * 0.3025 * 10) / 10 : null;
                    const perPyeong = supplyPyeong && txSummary.avg1MPrice
                      ? Math.round(txSummary.avg1MPrice / supplyPyeong)
                      : null;
                    if (perPyeong) {
                      return <span className="text-xs font-bold text-[#3182f6]">{perPyeong.toLocaleString()}만/평</span>;
                    }
                  }
                }
                if (!txSummary.avg1MPerPyeong) return null;
                return <span className="text-xs font-bold text-[#3182f6]">{txSummary.avg1MPerPyeong.toLocaleString()}만/평</span>;
              })()}
            </div>
          </div>
        ) : (
          <span className="text-xs text-[#d1d6db]">—</span>
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
            <span className="absolute -top-0.5 -right-0.5 text-[10px] font-bold text-[#ff3b30] bg-white rounded-full px-1 min-w-[14px] text-center leading-tight shadow-sm ring-1 ring-white">
              {favoriteCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
