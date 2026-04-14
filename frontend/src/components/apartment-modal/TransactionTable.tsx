import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronDown, AlertTriangle, AlertCircle } from 'lucide-react';

export interface TransactionRecord {
  dong?: string;
  aptName: string;
  area: number;
  areaPyeong: number;
  contractYm: string;
  contractDay: string;
  price: number;
  priceEok: string;
  deposit?: number;
  monthlyRent?: number;
  floor: number;
  buildYear: number;
  dealType?: string;
  reqGb?: string;
  rnuYn?: string;
  cancelDate?: string;
  isOutlier?: boolean;
}

interface TransactionTableProps {
  transactions: TransactionRecord[];
  typeMap: Record<string, Record<string, any>>;
  areaUnit: 'm2' | 'pyeong';
  chartType: 'sale' | 'jeonse';
  normalizeAptName: (name: string) => string;
}

export function TransactionTable({
  transactions,
  typeMap,
  areaUnit,
  chartType,
  normalizeAptName
}: TransactionTableProps) {
  const getFloorColor = (floor: number) => '#3182f6';
  const [txSort, setTxSort] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc'>('date_desc');
  const [txFilterArea, setTxFilterArea] = useState<string>('ALL');
  const [txFilterDealType, setTxFilterDealType] = useState<string>('ALL');
  const [activeDropdown, setActiveDropdown] = useState<'sort' | 'area' | 'dealType' | null>(null);
  
  const INITIAL_DISPLAY_COUNT = 10;
  const [displayedCount, setDisplayedCount] = useState(INITIAL_DISPLAY_COUNT);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(INITIAL_DISPLAY_COUNT);
  }, [txSort, txFilterArea, txFilterDealType, chartType]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      setActiveDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  // Derived filter options
  const { areaTypes, dealTypes } = useMemo(() => {
    const areas = new Set<number>();
    const deals = new Set<string>();
    transactions.forEach(t => {
      areas.add(t.area);
      if (t.dealType) deals.add(t.dealType);
    });
    return {
      areaTypes: Array.from(areas).sort((a, b) => a - b),
      dealTypes: Array.from(deals)
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 연동 차트에 따라 매매/전월세 기본 분류 필터링
      if (chartType === 'sale' && (tx.dealType === '전세' || tx.dealType === '월세')) return false;
      if (chartType === 'jeonse' && tx.dealType !== '전세' && tx.dealType !== '월세') return false;

      // 추가 필터링
      if (txFilterArea !== 'ALL' && tx.area !== Number(txFilterArea)) return false;
      if (txFilterDealType !== 'ALL' && tx.dealType !== txFilterDealType) return false;
      return true;
    });
  }, [transactions, chartType, txFilterArea, txFilterDealType]);

  const sortedFilteredTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const getP = (t: TransactionRecord) => (t.dealType === '전세' || t.dealType === '월세') ? (t.deposit || 0) : t.price;
      if (txSort === 'date_desc') {
        const da = a.contractYm + a.contractDay.padStart(2, '0');
        const db = b.contractYm + b.contractDay.padStart(2, '0');
        if (da !== db) return parseInt(db) - parseInt(da);
        return getP(b) - getP(a);
      }
      if (txSort === 'date_asc') {
        const da = a.contractYm + a.contractDay.padStart(2, '0');
        const db = b.contractYm + b.contractDay.padStart(2, '0');
        return parseInt(da) - parseInt(db);
      }
      if (txSort === 'price_desc') return getP(b) - getP(a);
      if (txSort === 'price_asc') return getP(a) - getP(b);
      return 0;
    });
  }, [filteredTransactions, txSort]);

  // '중개거래', '직거래' 등은 거래 방식이지 유형이 아님 — 사실상 매매
  const isSaleDealType = (dealType: string | undefined) =>
    !dealType || (dealType !== '전세' && dealType !== '월세');

  const getBadgeColorClasses = (dealType: string | undefined) => {
    if (!dealType || dealType === '-') return 'bg-[#e8f3ff] text-[#1b64da]'; // 매매 기본
    if (dealType === '전세') return 'bg-[#e6f4ea] text-[#0d652d]';
    if (dealType === '월세') return 'bg-[#fef0e6] text-[#c2410c]';
    // 중개거래, 직거래, 매매 등 모두 매매 계열
    return 'bg-[#e8f3ff] text-[#1b64da]';
  };

  const getDealTypeLabel = (dealType: string | undefined) => {
    if (!dealType || dealType === '-') return '매매';
    if (dealType === '전세' || dealType === '월세') return dealType;
    // 중개거래, 직거래 → 표시 라벨
    return dealType;
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl ring-1 ring-[#e5e8eb] overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 bg-white border-b border-[#e5e8eb] w-full">
        <h4 className="text-[14px] font-bold text-[#4e5968] shrink-0">
          실거래가 <span className="text-[#3182f6] ml-1">{filteredTransactions.length}</span>건
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {/* 면적 필터 */}
          <div className="relative" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'area' ? null : 'area'); }}>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e5e8eb] bg-white text-[12px] font-bold text-[#4e5968] hover:bg-[#f9fafb] transition-colors">
              {txFilterArea === 'ALL' ? '전체 면적' : `${txFilterArea}m²`}
              <ChevronDown size={14} className={`text-[#8b95a1] transition-transform ${activeDropdown === 'area' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'area' && (
              <div className="absolute top-10 left-0 w-[140px] bg-white border border-[#e5e8eb] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-[100]">
                {[{ label: '전체 면적', value: 'ALL' }, ...areaTypes.map(a => ({ label: `${a}m²`, value: String(a) }))].map(opt => (
                  <button key={opt.value} className={`w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-[#f9fafb] transition-colors ${txFilterArea === opt.value ? 'text-[#3182f6] bg-[#f2f4f6]/50' : 'text-[#4e5968]'}`}
                    onClick={(e) => { e.stopPropagation(); setTxFilterArea(opt.value); setActiveDropdown(null); }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 거래유형 필터 */}
          <div className="relative" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'dealType' ? null : 'dealType'); }}>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e5e8eb] bg-white text-[12px] font-bold text-[#4e5968] hover:bg-[#f9fafb] transition-colors">
              {txFilterDealType === 'ALL' ? '전체 유형' : txFilterDealType}
              <ChevronDown size={14} className={`text-[#8b95a1] transition-transform ${activeDropdown === 'dealType' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'dealType' && (
              <div className="absolute top-10 left-0 w-[140px] bg-white border border-[#e5e8eb] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-[100]">
                {[{ label: '전체 유형', value: 'ALL' }, ...dealTypes.map(d => ({ label: d, value: d }))].map(opt => (
                  <button key={opt.value} className={`w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-[#f9fafb] transition-colors ${txFilterDealType === opt.value ? 'text-[#3182f6] bg-[#f2f4f6]/50' : 'text-[#4e5968]'}`}
                    onClick={(e) => { e.stopPropagation(); setTxFilterDealType(opt.value); setActiveDropdown(null); }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 정렬 필터 */}
          <div className="relative" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'sort' ? null : 'sort'); }}>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#e5e8eb] bg-white text-[12px] font-bold text-[#4e5968] hover:bg-[#f9fafb] transition-colors">
              {{ 'date_desc': '최신순', 'date_asc': '과거순', 'price_desc': '높은가격순', 'price_asc': '낮은가격순' }[txSort]}
              <ChevronDown size={14} className={`text-[#8b95a1] transition-transform ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'sort' && (
              <div className="absolute top-10 right-0 w-[140px] bg-white border border-[#e5e8eb] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-[100]">
                {[
                  { label: '최신순 (계약일)', value: 'date_desc' },
                  { label: '과거순 (계약일)', value: 'date_asc' },
                  { label: '높은가격순', value: 'price_desc' },
                  { label: '낮은가격순', value: 'price_asc' },
                ].map(opt => (
                  <button key={opt.value} className={`w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-[#f9fafb] transition-colors ${txSort === opt.value ? 'text-[#3182f6] bg-[#f2f4f6]/50' : 'text-[#4e5968]'}`}
                    onClick={(e) => { e.stopPropagation(); setTxSort(opt.value as any); setActiveDropdown(null); }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 relative max-h-[360px] md:max-h-[500px] xl:max-h-[560px]">
        {sortedFilteredTransactions.map((tx, i) => {
          const m = tx.contractYm.substring(4, 6);
          const d = tx.contractDay;
          const isRent = tx.dealType === '전세' || tx.dealType === '월세';
          const displayPrice = isRent ? (tx.deposit || 0) : tx.price;
          const displayMonthly = isRent ? (tx.monthlyRent || 0) : 0;
          const eok = Math.floor(displayPrice / 10000);
          const rem = displayPrice % 10000;
          const key = String(tx.area);
          const txAptNorm = normalizeAptName(tx.aptName);
          const typeData = typeMap[txAptNorm]?.[key];
          let typeLabel = '';
          if (typeData) {
            typeLabel = areaUnit === 'm2' ? typeData.typeM2 : (typeData.typePyeong || typeData.typeM2);
          }
          if (!typeLabel) {
             typeLabel = areaUnit === 'm2' ? `${tx.area}m²` : `${Math.round(tx.area * 0.3025)}평`;
          }

          // cancelDate가 유효한 날짜(6자리 이상 숫자)인 경우에만 취소 거래로 판정
          const isCancelled = !!(tx.cancelDate && /^\d{6,}$/.test(tx.cancelDate.trim()));

          return (
            <div key={i} className={`flex items-center justify-between p-3.5 border-b border-[#f2f4f6] hover:bg-[#f9fafb] transition-colors ${i >= displayedCount ? 'hidden md:flex' : 'flex'} ${isCancelled ? 'opacity-50' : ''}`}>
              
              {/* 1열: 날짜 (좌측 패널) */}
              <div className="flex flex-col gap-1 w-[70px] shrink-0 text-left">
                <div className="text-[13px] font-bold text-[#8b95a1] tracking-tight">{tx.contractYm.substring(2, 4)}.{m}.{d}</div>
                {isCancelled && (
                  <div className="text-[10px] font-bold text-[#ef4444] leading-tight break-keep">
                    취소 {tx.cancelDate!.substring(2).replace(/(\d{2})(\d{2})(\d{2})/, '$1.$2.$3')}
                  </div>
                )}
              </div>
              
              {/* 2열: 스펙 (가운데 정렬로 빈 공간 전체 점유) */}
              <div className="flex-1 px-2 flex justify-center items-center min-w-0">
                <div className="text-[13px] font-bold text-[#333d4b] flex items-center justify-center gap-1.5 truncate">
                  <span className="truncate max-w-[100px] text-center" title={typeLabel}>{typeLabel}</span>
                  <span className="text-[#8b95a1] shrink-0">·</span>
                  <span className="shrink-0" style={{ color: getFloorColor(tx.floor) }}>{tx.floor}층</span>
                </div>
              </div>

              {/* 3열: 배지 + 가격 (우측 패널) */}
              <div className="flex items-center justify-end gap-1.5 w-[140px] shrink-0 text-right">
                {tx.dealType === '직거래' && (
                  <div className={`shrink-0 whitespace-nowrap text-[10px] font-extrabold px-1.5 py-0.5 rounded ${getBadgeColorClasses(tx.dealType)}`}>
                    {getDealTypeLabel(tx.dealType)}
                  </div>
                )}
                {tx.isOutlier && (
                  <div className="group relative flex items-center justify-center cursor-help">
                    <AlertTriangle size={13} className="text-[#f59e0b] drop-shadow-sm" />
                    <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:-left-2 sm:translate-x-0 w-36 sm:w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-[#191f28] text-white text-[10px] sm:text-[11px] p-2 rounded-lg shadow-lg z-50 pointer-events-none break-keep text-center sm:text-left">
                      시세 대비 이례적 편차
                    </div>
                  </div>
                )}
                <span className={`shrink-0 whitespace-nowrap text-[15px] font-black ${tx.isOutlier ? 'text-[#8b95a1] line-through decoration-[#c8ced4] decoration-2' : 'text-[#191f28]'}`}>
                  {eok > 0 ? `${eok}억 ` : ''}{rem > 0 ? rem.toLocaleString() : (eok > 0 ? '' : '0')}
                  {displayMonthly > 0 && <span className="text-[#8b95a1] ml-0.5 text-[13px] font-bold">/ {displayMonthly}</span>}
                </span>
              </div>

            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-[#8b95a1] gap-2">
            <AlertCircle size={24} className="text-[#d1d6db]" />
            <span className="text-[13px] font-bold">조건에 맞는 거래 내역이 없습니다.</span>
          </div>
        )}

        {/* Gradient Fade for unexpanded state */}
        {displayedCount < filteredTransactions.length && (
          <div className="md:hidden absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2 z-10" />
        )}
      </div>

      {/* Expand/Collapse Button */}
      {displayedCount < filteredTransactions.length && (
        <>
          <button
            onClick={() => setDisplayedCount(prev => prev + 10)}
            className="md:hidden relative -mt-4 w-[160px] mx-auto z-20 flex items-center justify-center gap-1.5 bg-[#191f28] text-white py-2.5 px-4 rounded-full text-[13px] font-extrabold shadow-lg hover:bg-[#191f28]/90 transition-colors mb-4"
          >
            더보기 <ChevronDown size={14} />
          </button>
          <div className="md:hidden border-t border-[#f2f4f6]" />
        </>
      )}
    </div>
  );
}
