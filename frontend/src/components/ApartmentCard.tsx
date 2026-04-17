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
  // 사진 등록 여부 확인
  const hasPhotos = !!(
    report?.imageUrl ||
    (report?.images && report.images.length > 0) ||
    report?.sections?.infra?.gateImg || report?.sections?.infra?.gateImgs?.length ||
    report?.sections?.infra?.landscapeImg || report?.sections?.infra?.landscapeImgs?.length ||
    report?.sections?.infra?.parkingImg ||
    report?.sections?.ecosystem?.communityImg ||
    report?.sections?.ecosystem?.schoolImg ||
    report?.sections?.ecosystem?.commerceImg
  );

  // 입지 분석(metrics) 유무 확인 (기본 건축정보를 제외한 실제 주변 인프라 입지 데이터가 있는지)
  const m = report?.metrics;
  const hasAnalysis = !!m && !!(
    m.distanceToElementary || m.distanceToMiddle || m.distanceToHigh ||
    m.distanceToSubway || m.distanceToIndeokwon || m.distanceToTram ||
    m.academyDensity || m.restaurantDensity ||
    m.distanceToStarbucks || m.distanceToMcDonalds || m.distanceToOliveYoung ||
    m.distanceToDaiso || m.distanceToSupermarket
  );

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
        !hasAnalysis && !hasPhotos && !txSummary ? 'opacity-60' : ''
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
        <span className="text-sm font-extrabold text-[#8b95a1] w-7 text-center shrink-0 tabular-nums">
          {rank}
        </span>
      )}

      {/* 아파트 정보 */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-[14.5px] font-bold text-[#191f28] truncate group-hover:text-[#3182f6] transition-colors leading-tight">
          {apt.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-[#8b95a1]">{apt.dong}</span>
          {hasPhotos ? (
            <span className="inline-flex items-center gap-0.5 bg-[#fff4e6] text-[#ff8a3d] text-[10px] font-bold px-1.5 py-[1px] rounded shrink-0 leading-tight" title="현장 검증 완료">
              현장검증
            </span>
          ) : hasAnalysis ? (
            <span className="inline-flex items-center gap-0.5 bg-[#e8f3ff] text-[#1b64da] text-[10px] font-bold px-1.5 py-[1px] rounded shrink-0 leading-tight" title="입지 분석 완료">
              입지분석
            </span>
          ) : null}
          {(!hasAnalysis && !hasPhotos) && isPublicRental && (
            <span className="text-[11px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-1.5 py-[1px] rounded shrink-0 leading-tight">공공</span>
          )}
        </div>
      </div>

      {/* 가격 영역 */}
      <div className="flex items-center shrink-0">
        {txSummary ? (
          <div className="text-right min-w-[80px]">
            <div className="flex justify-end items-baseline text-base leading-none mb-1">
              {(() => {
                let eok = 0;
                let rem = 0;
                let hasValue = false;
                
                if (txSummary.avg1MPrice > 0) {
                  const rounded = Math.round(txSummary.avg1MPrice / 100) * 100;
                  eok = Math.floor(rounded / 10000);
                  rem = rounded % 10000;
                  hasValue = true;
                } else if (txSummary.recent && txSummary.recent.length > 0) {
                  const r = txSummary.recent[0].priceEok;
                  const match = r.match(/(\d+)억\s*([\d,]*)/);
                  if (match) {
                    eok = parseInt(match[1]);
                    rem = parseInt((match[2] || '0').replace(/,/g, ''));
                    hasValue = true;
                  } else if (r.includes('만')) {
                    eok = 0;
                    rem = parseInt(r.replace(/[^\d]/g, ''));
                    hasValue = true;
                  } else if (!isNaN(parseInt(r))) {
                    eok = 0;
                    rem = parseInt(r);
                    hasValue = true;
                  }
                }
                
                if (hasValue) {
                   return (
                     <>
                       <span className="font-extrabold text-[#191f28] tabular-nums">{eok >= 1 ? `${eok}억` : ''}</span>
                       <span className={`inline-block text-left font-bold tabular-nums ml-[2px] ${eok > 0 ? 'w-[38px] text-[14.5px] text-[#4e5968]' : 'text-base text-[#191f28]'}`}>
                         {rem > 0 ? (eok === 0 ? `${rem.toLocaleString()}만` : rem.toLocaleString()) : (eok === 0 ? '0' : '')}
                       </span>
                     </>
                   );
                }

                if (txSummary && (txSummary.latestRentDeposit || 0) > 0) {
                  return <span className="font-extrabold text-[#191f28] text-[14.5px] tracking-tight">{`전/월세 ${txSummary.latestRentDepositEok}`}</span>;
                }
                return <span className="font-extrabold text-[#191f28]">-</span>;
              })()}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              {(() => {
                // 1. If we have 1-month average, display the accurate 1-month per-pyeong calculation
                if (txSummary.avg1MPrice > 0 && txSummary.avg1MPerPyeong > 0) {
                  return <span className="text-xs font-bold text-[#3182f6]">{txSummary.avg1MPerPyeong.toLocaleString()}만/평</span>;
                }

                // 2. Otherwise, if we have recent transaction, calculate per-pyeong of that specific transaction
                if (txSummary.recent && txSummary.recent.length > 0) {
                  const r = txSummary.recent[0];
                  let priceMan = 0;
                  const match = r.priceEok.match(/(\d+)억\s*([\d,]*)/);
                  if (match) {
                    priceMan = parseInt(match[1]) * 10000 + parseInt((match[2] || '0').replace(/,/g, ''));
                  } else if (r.priceEok.includes('만')) {
                    priceMan = parseInt(r.priceEok.replace(/[^\d]/g, ''));
                  }
                  
                  if (priceMan > 0 && r.areaPyeong > 0) {
                    return <span className="text-xs font-bold text-[#3182f6]">{Math.round(priceMan / r.areaPyeong).toLocaleString()}만/평</span>;
                  }
                }
                
                return null;
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
          className={`shrink-0 h-8 flex items-center justify-center gap-1 rounded-full transition-all px-2 -mr-2 ${
            isFavorited 
              ? 'text-[#ff3b30] hover:bg-red-50' 
              : 'text-[#d1d6db] hover:text-[#ff3b30] hover:bg-[#f9fafb]'
          }`}
          title={isFavorited ? '관심 해제' : '관심 등록'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {favoriteCount != null && (
            <span className={`text-[12px] font-bold ${isFavorited ? 'text-[#ff3b30]' : 'text-[#8b95a1] group-hover:text-[#ff3b30]'}`}>
              {favoriteCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
