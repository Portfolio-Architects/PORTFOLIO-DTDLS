'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Flame, Heart, Clock, MapPin, Building2, TrendingUp, Sparkles } from 'lucide-react';
import ApartmentCard from './ApartmentCard';
import { FieldReportData } from '@/lib/DashboardFacade';
import type { DongApartment } from '@/lib/dong-apartments';
import type { AptTxSummary } from '@/lib/transaction-summary';
import { isSameApartment, findTxKey, getDisplayAptName } from '@/lib/utils/apartmentMapping';
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

const formatPriceEok = (priceMan: number) => {
  if (!priceMan) return '-';
  const eok = Math.floor(priceMan / 10000);
  const remainder = Math.floor(priceMan % 10000);
  if (eok === 0) return `${remainder.toLocaleString()}만`;
  if (remainder === 0) return `${eok}억`;
  return `${eok}억 ${remainder.toLocaleString()}만`;
};

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
  // Discovery Categories (Extended for Real Estate)
  const CATEGORIES = [
    { id: 'price-rank', label: '평당가 랭킹', icon: TrendingUp, color: '#8b5cf6', desc: '최근 1개월 평균 평당가 랭킹 최상위' },
    { id: 'jeonse-gap', label: '전세가율 높은', icon: Sparkles, color: '#059669', desc: '실투자금이 적게 드는 갭투자 추천 단지' },
    { id: 'mega-scale', label: '대단지 프리미엄', icon: Building2, color: '#d97706', desc: '1,500세대 이상 초대형 매머드급 단지' },
    { id: 'new-built', label: '신축 아파트', icon: MapPin, color: '#2563eb', desc: '준공 5년 이내의 쾌적한 신축 아파트' },
    { id: 'popular', label: '인기 단지', icon: Flame, color: '#f04452', desc: '현재 D-VIEW에서 가장 많이 조회된 단지' },
    { id: 'favorites', label: '내 관심 단지', icon: Heart, color: '#ff3b30', desc: '내가 하트를 눌러 찜한 단지들' },
    { id: 'recent', label: '최신 업데이트', icon: Clock, color: '#3182f6', desc: '가장 최근에 현장 임장기가 올라온 단지' },
  ];

  const [activeCategory, setActiveCategory] = useState<string>('price-rank');

  // Flatten apartments
  const allApts = useMemo(() => Object.values(sheetApartments).flat(), [sheetApartments]);

  // Pre-compute O(1) Hash Map for fieldReports
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

    if (activeCategory === 'jeonse-gap') {
      return [...allApts].filter(a => {
        const rawKey = (a as any).txKey || a.name;
        const txKey = findTxKey(rawKey, txSummaryData, nameMapping) || rawKey;
        const summary = txSummaryData[txKey];
        return summary && (summary.avg1MRentDeposit || 0) > 0 && (summary.avg1MPrice || 0) > 0;
      }).sort((a, b) => {
        const getRate = (apt: any) => {
          const rawKey = apt.txKey || apt.name;
          const txKey = findTxKey(rawKey, txSummaryData, nameMapping) || rawKey;
          const summary = txSummaryData[txKey];
          return (summary?.avg1MRentDeposit || 0) / (summary?.avg1MPrice || 1);
        };
        return getRate(b) - getRate(a);
      }).slice(0, 50);
    }

    if (activeCategory === 'mega-scale') {
      return [...allApts].filter(a => (a.householdCount || 0) >= 1500)
        .sort((a, b) => (b.householdCount || 0) - (a.householdCount || 0));
    }

    if (activeCategory === 'new-built') {
      const currentYear = new Date().getFullYear();
      return [...allApts].filter(a => {
        const yb = parseInt(a.yearBuilt?.substring(0, 4) || '0');
        return yb > 0 && (currentYear - yb) <= 5;
      }).sort((a, b) => {
        const yA = parseInt(a.yearBuilt?.substring(0, 4) || '0');
        const yB = parseInt(b.yearBuilt?.substring(0, 4) || '0');
        return yB - yA;
      });
    }

    if (activeCategory === 'popular') {
      return [...allApts].sort((a, b) => {
        const rA = fieldReportsMap.get(a.name);
        const rB = fieldReportsMap.get(b.name);
        const diff = (rB?.viewCount || 0) - (rA?.viewCount || 0);
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ko');
      }).slice(0, 50);
    }

    if (activeCategory === 'favorites') {
      return allApts.filter(a => userFavorites.has(a.name));
    }

    if (activeCategory === 'recent') {
      const reportedApts = allApts.filter(a => fieldReportsMap.has(a.name));
      return reportedApts.sort((a, b) => {
        const rA = fieldReportsMap.get(a.name);
        const rB = fieldReportsMap.get(b.name);
        const tA = rA?.createdAt ? new Date(rA.createdAt as string | number).getTime() : 0;
        const tB = rB?.createdAt ? new Date(rB.createdAt as string | number).getTime() : 0;
        return tB - tA;
      }).slice(0, 50);
    }

    return allApts;
  }, [activeCategory, allApts, fieldReportsMap, userFavorites, txSummaryData, nameMapping]);

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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHeight = () => {
        setIsDesktop(window.innerWidth >= 768);
        if (window.innerWidth >= 768) {
          setListHeight(Math.max(400, window.innerHeight - 250));
        } else {
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
      <div className="w-full md:w-[220px] lg:w-[250px] shrink-0 md:border-r md:border-[#e5e8eb] bg-[#fafafa] pt-4 md:pt-6 px-2 md:px-4">
        
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
                {cat.id === 'favorites' && <div className="mt-4 mb-2 pl-2 text-[12px] font-semibold text-[#8b95a1]">내 활동</div>}
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all group ${
                    isActive 
                      ? 'bg-[#e8f3ff] text-[#1b64da]' 
                      : 'bg-transparent text-[#4e5968] hover:bg-[#f2f4f6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg flex items-center justify-center ${isActive ? 'bg-white shadow-sm' : 'bg-transparent group-hover:bg-white group-hover:shadow-sm'}`}>
                      <cat.icon size={18} color={cat.color} />
                    </div>
                    <span className={`text-[15px] font-bold ${isActive ? 'text-[#1b64da]' : 'text-[#4e5968] group-hover:text-[#191f28]'}`}>
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
        
        {/* 헤더 부분 */}
        <div className="p-6 md:p-8 border-b border-[#f2f4f6] relative overflow-hidden bg-white">
          <h3 className="text-[22px] md:text-[28px] font-extrabold text-[#191f28] flex items-center gap-2 mb-2">
            {activeCatObj?.label}
          </h3>
          <p className="text-[#8b95a1] text-[14px] md:text-[15px] font-medium">
            {activeCatObj?.desc}
          </p>
        </div>

        {/* 아파트 리스트 렌더링 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col">
          {displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-4 min-h-[300px]">
              <Heart className="w-12 h-12 text-[#d1d6db] mb-4" strokeWidth={1.5} />
              <h4 className="text-[16px] font-bold text-[#4e5968] mb-2">
                {activeCategory === 'favorites' ? '찜한 단지가 없습니다.' : '해당하는 단지가 없습니다.'}
              </h4>
              <p className="text-[13px] text-[#8b95a1]">
                {activeCategory === 'favorites' 
                  ? '다른 탭에서 단지의 하트를 눌러 관심 단지를 모아보세요!' 
                  : '조건을 변경하여 다시 시도해주세요.'}
              </p>
            </div>
          ) : (
            <>
              {/* 데스크톱 전용 테이블 헤더 */}
              {isDesktop && (
                <div className="hidden md:flex items-center px-6 py-3 border-b border-[#f2f4f6] text-[13px] font-semibold text-[#8b95a1] bg-white sticky top-0 z-10">
                  <div className="w-12 text-center">순위</div>
                  <div className="flex-1 ml-4">단지명</div>
                  <div className="w-24 text-right">현재가(매매)</div>
                  <div className="w-24 text-right">전세가율</div>
                  <div className="w-24 text-center">지역</div>
                  <div className="w-32 text-center">연식/규모</div>
                </div>
              )}
              <FixedSizeList
                height={isDesktop ? listHeight - 44 : displayList.length * 82} // minus header height on desktop
                itemCount={displayList.length}
                itemSize={isDesktop ? 68 : 82}
                width="100%"
                overscanCount={10}
              >
                {({ index, style }) => {
                  const apt = displayList[index];
                  const rawTxKey = (apt as any).txKey || apt.name;
                  const txKey = findTxKey(rawTxKey, txSummaryData, nameMapping) || rawTxKey;
                  const matchedSummary = txKey ? txSummaryData[txKey] : undefined;
                  const matchedReport = fieldReportsMap.get(apt.name);
                  
                  // Toss Securities Table Style for Desktop
                  if (isDesktop) {
                    return (
                      <div style={style} className="flex items-center px-6 py-3 border-b border-[#f2f4f6]/50 hover:bg-[#f9fafb] cursor-pointer transition-colors" onClick={() => handleSelectApt(apt as DongApartment)}>
                        <div className="w-12 text-center text-[15px] font-bold text-[#8b95a1]">
                          {activeCategory === 'price-rank' || activeCategory === 'popular' || activeCategory === 'jeonse-gap' ? index + 1 : '-'}
                        </div>
                        <div className="flex-1 ml-4 flex items-center min-w-0">
                          <span className="text-[16px] font-bold text-[#191f28] truncate">{getDisplayAptName(apt.name)}</span>
                        </div>
                        <div className="w-24 text-right flex flex-col justify-center">
                          <span className="text-[15px] font-bold text-[#191f28]">
                            {matchedSummary?.avg1MPrice ? formatPriceEok(matchedSummary.avg1MPrice) : '-'}
                          </span>
                        </div>
                        <div className="w-24 text-right flex flex-col justify-center">
                          {(() => {
                             const jRate = matchedSummary?.avg1MRentDeposit && matchedSummary?.avg1MPrice 
                                ? (matchedSummary.avg1MRentDeposit / matchedSummary.avg1MPrice * 100).toFixed(0) + '%'
                                : '-';
                             return <span className={`text-[14px] font-bold ${matchedSummary?.avg1MRentDeposit ? 'text-[#f04452]' : 'text-[#8b95a1]'}`}>{jRate}</span>;
                          })()}
                        </div>
                        <div className="w-24 text-center text-[13px] font-medium text-[#4e5968]">{apt.dong}</div>
                        <div className="w-32 text-center text-[13px] font-medium text-[#8b95a1]">
                          {apt.yearBuilt ? apt.yearBuilt.substring(0,4) + '년' : '-'} / {apt.householdCount ? apt.householdCount.toLocaleString() + '세대' : '-'}
                        </div>
                      </div>
                    );
                  }

                  // Mobile Fallback: ApartmentCard
                  return (
                    <div style={style}>
                      <ApartmentCard
                        key={apt.name}
                        apt={apt as unknown as { name: string; dong: string; householdCount?: number; yearBuilt?: string; brand?: string; txKey?: string; }}
                        txSummary={matchedSummary}
                        report={matchedReport}
                        isPublicRental={publicRentalSet.has(apt.name)}
                        onClick={() => handleSelectApt(apt as DongApartment)}
                        rank={activeCategory === 'price-rank' || activeCategory === 'popular' || activeCategory === 'jeonse-gap' ? index + 1 : undefined}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
