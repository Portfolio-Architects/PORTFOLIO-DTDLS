'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Flame, Heart, Clock, MapPin, Building2, TrendingUp } from 'lucide-react';
import ApartmentCard from './ApartmentCard';
import { FieldReportData } from '@/lib/DashboardFacade';
import type { DongApartment } from '@/lib/dong-apartments';
import type { AptTxSummary } from '@/lib/transaction-summary';
import { isSameApartment, findTxKey } from '@/lib/utils/apartmentMapping';
import { FixedSizeList } from 'react-window';

interface DiscoveryProps {
  sheetApartments: Record<string, DongApartment[]>;
  fieldReports: FieldReportData[];
  userFavorites: Set<string>;
  nameMapping: Record<string, string>;
  publicRentalSet: Set<string>;
  txSummaryData: Record<string, AptTxSummary>;
  favoriteCounts: Record<string, number>;
  onToggleFavorite: (name: string) => void;
  onSelectReport: (report: FieldReportData | {id: string, apartmentName: string, dong: string, author: string, likes: number, commentCount: number, createdAt: null, metrics: unknown}) => void;
  typeMap: Record<string, Record<string, { typeM2: string; typePyeong: string }>>;
  areaUnit: 'm2' | 'pyeong';
}

export default function ApartmentDiscoveryClient({
  sheetApartments,
  fieldReports,
  userFavorites,
  nameMapping,
  publicRentalSet,
  txSummaryData,
  favoriteCounts,
  onToggleFavorite,
  onSelectReport,
  typeMap,
  areaUnit
}: DiscoveryProps) {
  const CATEGORIES = [
    { id: 'price-rank', label: '평당가 기준', icon: TrendingUp, color: '#8b5cf6', desc: '최근 1개월 평균 평당가 기준' },
    { id: 'valuation', label: '매매가/전세가 기준', icon: Building2, color: '#f04452', desc: '매매가 대비 전세가(전세가율) 밸류에이션 기준' },
  ];

  const [activeCategory, setActiveCategory] = useState<string>('price-rank');

  // Flatten apartments
  const allApts = useMemo(() => Object.values(sheetApartments).flat(), [sheetApartments]);

  // Pre-compute O(1) Hash Map for fieldReports to avoid O(N^2) blocking
  const fieldReportsMap = useMemo(() => {
    const map = new Map<string, FieldReportData>();
    if (!fieldReports || !allApts) return map;
    allApts.forEach(apt => {
      const report = fieldReports.find(r => isSameApartment(r.apartmentName, apt.name, nameMapping));
      if (report) map.set(apt.name, report);
    });
    return map;
  }, [fieldReports, allApts, nameMapping]);

  // Derived filtered & sorted list
  const displayList = useMemo(() => {
    if (activeCategory === 'price-rank') {
      return [...allApts].sort((a, b) => {
        const rawKeyA = (a as any).txKey || a.name;
        const txKeyA = findTxKey(rawKeyA, txSummaryData, nameMapping) || rawKeyA;
        const pyeongA = txSummaryData[txKeyA]?.avg1MPerPyeong || 0;

        const rawKeyB = (b as any).txKey || b.name;
        const txKeyB = findTxKey(rawKeyB, txSummaryData, nameMapping) || rawKeyB;
        const pyeongB = txSummaryData[txKeyB]?.avg1MPerPyeong || 0;

        const diff = pyeongB - pyeongA;
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ko');
      }).slice(0, 100);
    }

    if (activeCategory === 'valuation') {
      return [...allApts].sort((a, b) => {
        const getRatio = (apt: any) => {
          const rawKey = apt.txKey || apt.name;
          const txKey = findTxKey(rawKey, txSummaryData, nameMapping) || rawKey;
          const sum = txKey ? txSummaryData[txKey] : undefined;
          if (!sum) return 0;
          const sales = sum.avg1MPrice || sum.latestPrice || 0;
          const jeonse = sum.avg1MRentDeposit || sum.latestRentDeposit || 0;
          return sales > 0 && jeonse > 0 ? (jeonse / sales) : 0;
        };

        const ratioA = getRatio(a);
        const ratioB = getRatio(b);

        const diff = ratioB - ratioA;
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ko');
      }).filter(apt => {
          const rawKey = (apt as any).txKey || apt.name;
          const txKey = findTxKey(rawKey, txSummaryData, nameMapping) || rawKey;
          const sum = txKey ? txSummaryData[txKey] : undefined;
          return sum && (sum.avg1MPrice || sum.latestPrice) && (sum.avg1MRentDeposit || sum.latestRentDeposit);
      }).slice(0, 100);
    }

    return allApts;
  }, [activeCategory, allApts, fieldReportsMap, userFavorites]);

  const activeCatObj = CATEGORIES.find(c => c.id === activeCategory);

  const handleSelectApt = (apt: DongApartment) => {
    const report = fieldReportsMap.get(apt.name);
    if (report) {
      onSelectReport(report);
    } else {
      onSelectReport({
        id: `stub-${apt.name}`,
        apartmentName: apt.name,
        dong: apt.dong,
        author: '',
        likes: 0,
        commentCount: 0,
        createdAt: null,
        metrics: apt as unknown as import('@/lib/types/scoutingReport').ObjectiveMetrics,
      });
    }
  };

  const [listHeight, setListHeight] = useState(600);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHeight = () => {
        if (window.innerWidth >= 768) {
          setListHeight(Math.max(400, window.innerHeight - 250));
        } else {
          // On mobile, just give it a fixed large height so users can scroll the page
          setListHeight(window.innerHeight - 300 > 400 ? window.innerHeight - 300 : 600);
        }
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full rounded-none md:rounded-[20px] md:border md:border-[#e5e8eb] md:shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden bg-white">
      {/* ── LEFT 네비게이션: 데스크톱용 (Mobile은 가로 스크롤로 상단 배치) ── */}
      <div className="w-full md:w-[220px] lg:w-[250px] shrink-0 md:border-r md:border-[#e5e8eb] bg-white pt-4 md:pt-6 px-2 md:px-4">
        
        {/* 모바일 렌더링: 가로 스크롤 탭 */}
        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 mb-2 custom-scrollbar snap-x px-2">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-full flex items-center gap-2 text-[14px] font-extrabold transition-all border ${
                  isActive 
                    ? 'bg-[#191f28] text-white border-[#191f28] shadow-md' 
                    : 'bg-white text-[#4e5968] border-[#e5e8eb] hover:bg-[#f9fafb]'
                }`}
              >
                <cat.icon size={16} color={isActive ? '#fff' : cat.color} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 데스크톱 렌더링: 버티컬 메뉴 */}
        <div className="hidden md:flex flex-col gap-1 sticky top-0 h-full overflow-y-auto custom-scrollbar pb-6">
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#191f28] mb-4 pl-2 pt-2">
            아파트 탐색
          </h2>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <React.Fragment key={cat.id}>
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all group ${
                    isActive 
                      ? 'bg-[#f2f4f6] text-[#191f28]' 
                      : 'bg-transparent text-[#4e5968] hover:bg-[#f9fafb]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg flex items-center justify-center ${isActive ? 'bg-white shadow-sm' : 'bg-transparent group-hover:bg-white group-hover:shadow-sm'}`}>
                      <cat.icon size={18} color={cat.color} />
                    </div>
                    <span className={`text-[15px] font-bold ${isActive ? 'text-[#191f28]' : 'text-[#4e5968] group-hover:text-[#191f28]'}`}>
                      {cat.label}
                    </span>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3182f6]" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT 콘텐츠 리스트 ── */}
      <div className="flex-1 bg-white flex flex-col min-w-0 min-h-[500px]">
        
        {/* 헤더 부분 & 배너 어울림 */}
        <div className="p-6 md:p-8 border-b border-[#f2f4f6] relative overflow-hidden bg-gradient-to-r from-white to-[#f8faff]">
          {activeCategory === 'popular' && (
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#ffe4e6]/40 to-transparent pointer-events-none" />
          )}
          <h3 className="text-[22px] md:text-[24px] font-extrabold text-[#191f28] flex items-center gap-2 mb-2 relative z-10">
            {activeCatObj?.label}
          </h3>
          <p className="text-[#8b95a1] text-[14px] md:text-[15px] font-medium relative z-10">
            {activeCatObj?.desc}
          </p>

          {/* 인라인 프리미엄 광고 배너 (선택형 렌더링) */}
          {(activeCategory === 'price-rank') && (
            <div className="mt-6 w-full bg-gradient-to-br from-[#191f28] to-[#222a35] rounded-[18px] p-5 flex items-center relative overflow-hidden group cursor-pointer shadow-md">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#3182f6] mix-blend-screen opacity-20 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 mr-4">
                <Building2 className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-blue-200 font-extrabold uppercase tracking-wider mb-1">상단 프리미엄 스폰서</div>
                <h4 className="text-white text-[15px] font-bold">동탄 최고의 부동산, 삼성공인중개사무소</h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-[#191f28] transition-colors">
                &rarr;
              </div>
            </div>
          )}
        </div>

        {/* 아파트 리스트 렌더링 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <Heart className="w-12 h-12 text-[#d1d6db] mb-4" strokeWidth={1.5} />
              <h4 className="text-[16px] font-bold text-[#4e5968] mb-2">
                해당하는 단지가 없습니다.
              </h4>
              <p className="text-[13px] text-[#8b95a1]">
                조건을 변경하여 다시 시도해주세요.
              </p>
            </div>
          ) : (
            <FixedSizeList
              height={typeof window !== 'undefined' && window.innerWidth >= 768 ? listHeight : displayList.length * 82}
              itemCount={displayList.length}
              itemSize={82}
              width="100%"
              overscanCount={5}
            >
              {({ index, style }) => {
                const apt = displayList[index];
                const rawTxKey = (apt as any).txKey || apt.name;
                const txKey = findTxKey(rawTxKey, txSummaryData, nameMapping) || rawTxKey;
                const matchedSummary = txKey ? txSummaryData[txKey] : undefined;
                const matchedReport = fieldReportsMap.get(apt.name);

                return (
                  <div style={style}>
                    <ApartmentCard
                      key={apt.name}
                      apt={apt as unknown as { name: string; dong: string; householdCount?: number; yearBuilt?: string; brand?: string; txKey?: string; }}
                      txSummary={matchedSummary}
                      report={matchedReport}
                      isPublicRental={publicRentalSet.has(apt.name)}
                      onClick={() => handleSelectApt(apt as DongApartment)}
                      rank={activeCategory === 'price-rank' || activeCategory === 'valuation' ? index + 1 : undefined}
                      isFavorited={userFavorites.has(apt.name)}
                      favoriteCount={favoriteCounts[apt.name] || 0}
                      onToggleFavorite={() => onToggleFavorite(apt.name)}
                      typeMap={typeMap}
                      areaUnit={areaUnit}
                    />
                  </div>
                );
              }}
            </FixedSizeList>
          )}
        </div>
      </div>
    </div>
  );
}
