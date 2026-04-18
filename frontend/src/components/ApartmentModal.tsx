'use client';

import { useState, useRef, useMemo } from 'react';
import {
  MapPin, X, TrendingUp, Camera, Maximize2,
  MessageSquare, UserCircle, CheckCircle2, Building, Info, ShieldAlert, Radar, ChevronDown, ArrowLeftRight
} from 'lucide-react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Bar, Customized, Line, Legend } from 'recharts';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { normalize84Price } from '@/lib/utils/valuation';
import { normalizeAptName, getDisplayAptName } from '@/lib/utils/apartmentMapping';
import type { CommentData, FieldReportData } from '@/lib/DashboardFacade';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import CommentSection from '@/components/CommentSection';
import { ApartmentGallery } from './apartment-modal/ApartmentGallery';
import { TransactionTable } from './apartment-modal/TransactionTable';
import { TransactionChartSection } from './apartment-modal/TransactionChartSection';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

const AdvancedValuationMetrics = dynamic(() => import('@/components/consumer/AdvancedValuationMetrics'), { ssr: false });
const AnchorTenantCard = dynamic(() => import('@/components/consumer/AnchorTenantCard'), { ssr: false });
// PaymentButton 비활성화 (Vercel Hobby Plan 호환성 — 추후 유료 모델 전환 시 복원)
// const PaymentButton = dynamic(() => import('@/components/PaymentButton'), { ssr: false });

interface TransactionRecord {
  dong: string;
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
  dealType: string;
  reqGb?: string;
  rnuYn?: string;
}


export function FieldReportModal({ 
  report, 
  onClose,
  comments,
  commentInput,
  onCommentChange,
  onSubmitComment,
  user,
  transactions,
  typeMap,
  isLoadingDetail,
  isPurchased,
  isAdmin,
  onPurchaseComplete,
  inline,
  areaUnit = 'm2'
}: { 
  report: FieldReportData;
  onClose: () => void;
  comments: CommentData[];
  commentInput: string;
  onCommentChange: (text: string) => void;
  onSubmitComment: () => void;
  user: User | null;
  transactions: TransactionRecord[];
  typeMap: Record<string, Record<string, { typeM2: string; typePyeong: string }>>;
  isLoadingDetail?: boolean;
  isPurchased?: boolean;
  isAdmin?: boolean;
  onPurchaseComplete?: () => void;
  inline?: boolean;
  areaUnit?: 'm2' | 'pyeong';
}) {
  useSwipeNavigation({ onBack: onClose });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const displayAptName = getDisplayAptName(report.apartmentName);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [priceTypeFilter, setPriceTypeFilter] = useState<string>('ALL');
  const [showPriceHelp, setShowPriceHelp] = useState(false);
  const [activeTab, setActiveTab] = useState('sec-summary');

  // 차트 매매/전월세 토글
  const [chartType, setChartType] = useState<'sale' | 'jeonse'>('sale');
  const [periodDealType, setPeriodDealType] = useState<'sale' | 'jeonse'>('sale');


  // TODO: 유료 모델 전환 시 아래 라인 복원
  // const isUnlocked = !!(isPurchased || isAdmin);
  const isUnlocked = true; // 프리미엄 콘텐츠 전면 개방 (Vercel Hobby Plan 대응)
  const isStub = report.id.startsWith('stub-');
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollToSection = (id: string) => {
    setActiveTab(id);
    if (id === 'sec-summary' && modalRef.current) {
      // Summary = first section, just scroll modal to top
      modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = modalRef.current?.querySelector(`#${id}`);
    if (el && modalRef.current) {
      const topPos = el.getBoundingClientRect().top + modalRef.current.scrollTop - modalRef.current.getBoundingClientRect().top - 60;
      modalRef.current.scrollTo({ top: topPos, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!modalRef.current) return;
    const sections = ['sec-summary', 'sec-infra-metrics', 'sec-valuation', 'sec-photos', 'sec-comments'];
    let current = 'sec-summary';
    for (const id of sections) {
      if (id === 'sec-summary') continue;
      const el = modalRef.current.querySelector(`#${id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const containerRect = modalRef.current.getBoundingClientRect();
        if (rect.top - containerRect.top < 300) {
          current = id;
        }
      }
    }
    setActiveTab(current);
  };

  const s = report.sections;
  const coverImage = report.imageUrl || s?.infra?.gateImg || s?.infra?.landscapeImg || s?.ecosystem?.communityImg;
  const rating = report.premiumScores?.totalPremiumScore ? Math.max(1, Math.round(report.premiumScores.totalPremiumScore / 20)) : (report.rating || 5);

  const typeBadgeColors: [string, string][] = [['text-[#3182f6]','bg-[#e8f3ff]'], ['text-[#059669]','bg-[#d1fae5]'], ['text-[#7c3aed]','bg-[#ede9fe]'], ['text-[#d97706]','bg-[#fef3c7]'], ['text-[#db2777]','bg-[#fce7f3]']];
  const groupSet = new Set<number>();
  transactions.forEach(tx => {
    const norm = normalizeAptName(tx.aptName);
    const t = typeMap[norm]?.[String(tx.area)];
    const label = t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : null;
    if (label) {
      const m = label.match(/\d+/);
      if (m) groupSet.add(Math.round(parseInt(m[0]) / 3));
    }
  });
  const sortedGroups = Array.from(groupSet).sort((a, b) => a - b);
  const groupColorIdx = new Map(sortedGroups.map((g, i) => [g, i]));

  const getBadgeColorClasses = (label: string | null) => {
    if (!label) return ['text-[#3182f6]', 'bg-[#e8f3ff]'];
    const m = label.match(/\d+/);
    const group = m ? Math.round(parseInt(m[0]) / 3) : 0;
    const cIdx = (groupColorIdx.get(group) ?? 0) % typeBadgeColors.length;
    return typeBadgeColors[cIdx];
  };

  // 고유 m² 타입 목록
  const areaTypes = Array.from(new Set(transactions.map(tx => {
    const norm = normalizeAptName(tx.aptName);
    const t = typeMap[norm]?.[String(tx.area)];
    return t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : (areaUnit === 'm2' ? `${tx.area}m²` : `${tx.areaPyeong}평`);
  }))).sort();
  // 고유 유형 목록
  const dealTypes = Array.from(new Set(transactions.map(tx => tx.dealType))).sort();

  const chipClass = (active: boolean) => `w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
    active ? 'bg-[#e8f3ff] text-[#3182f6]' : 'bg-transparent text-[#4e5968] hover:bg-[#f2f4f6]'
  }`;



  const content = (
    <>
      {/* Hero Section — Layout: 40% table / 60% chart */}
          <div className={`bg-white w-full flex flex-col md:flex-row p-4 ${inline ? 'md:p-6' : 'md:p-10'} gap-4 md:gap-8 ${inline ? '' : 'rounded-t-3xl'} shrink-0 pt-4 md:pt-8 ${inline ? 'border-b border-[#f2f4f6]' : 'border-b border-[#e5e8eb]'}`}>
            
            {/* Left: 실거래가 전체 리스트 — mobile: 2번째, desktop: 1번째 (40%) */}
            <div className="w-full md:w-[40%] shrink-0 order-2 md:order-1 flex flex-col self-start">
              <TransactionTable 
                transactions={transactions} 
                typeMap={typeMap} 
                areaUnit={areaUnit} 
                chartType={chartType} 
                normalizeAptName={normalizeAptName} 
              />
            </div>

            {/* Right: Title + Chart — mobile: 1번째, desktop: 2번째 (60%) */}
            <TransactionChartSection 
              transactions={transactions} 
              chartType={chartType} 
              setChartType={setChartType} 
              displayAptName={displayAptName} 
              dong={report.dong || ''} 
              typeMap={typeMap} 
              areaUnit={areaUnit || 'm2'} 
              normalizeAptName={normalizeAptName} 
            />

          </div>

          {/* ── 평형별 최근 거래가 + 기간별 평균 ── */}
          {transactions.length > 0 && (() => {
            const now = new Date();
            const aptNorm = normalizeAptName(report.apartmentName);

            // 1) 타입 필터 칩 목록 구성 (단지 내 존재하는 전 평형 추출)
            const byArea = new Map<string, { label: string; area: number }>();
            transactions.forEach(tx => {
              const key = String(tx.area);
              if (!byArea.has(key)) {
                const txAptNorm = normalizeAptName(tx.aptName);
                const typeData = typeMap[txAptNorm]?.[key];
                const typeName = typeData ? (areaUnit === 'm2' ? typeData.typeM2 : (typeData.typePyeong || typeData.typeM2)) : undefined;
                const label = typeName || (areaUnit === 'm2' ? `${tx.area}m²` : `${tx.areaPyeong}평`);
                byArea.set(key, { label, area: tx.area });
              }
            });

            const typeFilters: { key: string; label: string; area: number }[] = [
              { key: 'ALL', label: '단지 전체', area: 0 },
              ...Array.from(byArea.values())
                .sort((a, b) => {
                  const numA = parseInt(a.label.match(/\d+/)?.[0] || '0');
                  const numB = parseInt(b.label.match(/\d+/)?.[0] || '0');
                  if (numA !== numB) return numA - numB;
                  return a.label.localeCompare(b.label);
                })
                .map(c => ({ key: String(c.area), label: c.label, area: c.area }))
            ];

            // 3) 기간별 평균 산출 (1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, ALL)
            const periods = [
              { key: '1M', label: '1개월', months: 1 },
              { key: '3M', label: '3개월', months: 3 },
              { key: '6M', label: '6개월', months: 6 },
              { key: '1Y', label: '1년', months: 12 },
              { key: '3Y', label: '3년', months: 36 },
              { key: '5Y', label: '5년', months: 60 },
              { key: '10Y', label: '10년', months: 120 },
              { key: 'ALL', label: '전체', months: 9999 },
            ];

            const getTxDate = (tx: TransactionRecord) => {
              const y = parseInt(tx.contractYm.slice(0, 4));
              const m = parseInt(tx.contractYm.slice(4, 6));
              const d = parseInt(tx.contractDay) || 1;
              return new Date(y, m - 1, d);
            };

            const periodTransactions = transactions.filter(tx => {
              if (periodDealType === 'sale' && (tx.dealType === '전세' || tx.dealType === '월세')) return false;
              if (periodDealType === 'jeonse' && tx.dealType !== '전세' && tx.dealType !== '월세') return false;
              return true;
            });

            // Filter transactions by type if selected
            const baseTx = priceTypeFilter === 'ALL'
              ? periodTransactions
              : periodTransactions.filter(tx => String(tx.area) === priceTypeFilter);

            // Calculate supply pyeong for a transaction
            const getTxSupplyPyeong = (tx: TransactionRecord) => {
              const key = String(tx.area);
              const txAptNorm = normalizeAptName(tx.aptName);
              const typeData = typeMap[txAptNorm]?.[key];
              if (typeData?.typeM2) {
                const supplyM2Match = typeData.typeM2.match(/\d+(\.\d+)?/);
                if (supplyM2Match) return parseFloat(supplyM2Match[0]) * 0.3025;
              }
              // fallback to roughly estimating supply area if not in typeMap
              return tx.area * 0.3025 * 1.33; 
            };

            // Area pyeong for per-pyeong calc (type-specific or average)
            const avgAreaPyeong = baseTx.length > 0
              ? baseTx.reduce((s, tx) => s + getTxSupplyPyeong(tx), 0) / baseTx.length
              : 30;

            const formatEok = (priceMan: number) => {
              if (priceMan >= 10000) {
                const eok = Math.floor(priceMan / 10000);
                const rem = Math.round(priceMan % 10000);
                return `${eok}억${rem > 0 ? rem.toLocaleString() : ''}`;
              }
              return `${Math.round(priceMan).toLocaleString()}만`;
            };

            const overallAvgPrice = baseTx.length > 0 ? baseTx.reduce((s, t) => s + t.price, 0) / baseTx.length : 0;

            // Find the latest transaction date to act as the base date for period calculation
            const sortedBaseTx = [...baseTx].sort((a, b) => getTxDate(b).getTime() - getTxDate(a).getTime());
            const latestTxDate = sortedBaseTx.length > 0 ? getTxDate(sortedBaseTx[0]) : now;

            const periodData = periods.map(p => {
              const cutoffDate = new Date(latestTxDate.getFullYear(), latestTxDate.getMonth() - p.months, latestTxDate.getDate());
              const filtered = baseTx.filter(tx => p.months >= 9999 || getTxDate(tx) >= cutoffDate);
              const rawAvgPrice = filtered.length > 0 ? filtered.reduce((s, t) => s + t.price, 0) / filtered.length : 0;
              const avgPrice = Math.round(rawAvgPrice / 100) * 100;
              
              // 변동률 전체기간(overallAvgPrice) 기준
              const trendPct = overallAvgPrice > 0 && p.months < 9999 
                ? ((avgPrice - overallAvgPrice) / overallAvgPrice * 100) 
                : null;
              const perPyeong = filtered.length > 0
                ? Math.round(filtered.reduce((s, tx) => s + (tx.price / getTxSupplyPyeong(tx)), 0) / filtered.length)
                : 0;
              return {
                ...p,
                count: filtered.length,
                avgPrice,
                avgPriceEok: formatEok(avgPrice),
                perPyeong,
                perPyeongEok: formatEok(perPyeong),
                trendPct,
              };
            }).filter(p => p.count > 0);

            const activeFilterLabel = typeFilters.find(f => f.key === priceTypeFilter)?.label || '단지 전체';

            return (
              <div className="bg-white w-full px-4 md:px-10 pb-6 border-b border-[#e5e8eb]">
                {/* --- 기간별 단지 평균 테이블 --- */}
                {periodData.length > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap w-full">
                      <div className="flex items-center gap-2 justify-between w-full sm:w-auto sm:justify-start">
                        <h5 className="text-[15px] font-bold text-[#4e5968] flex items-center gap-1.5">기간별 평균가격
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPriceHelp((prev: boolean) => !prev); }}
                            className="w-4 h-4 rounded-full bg-[#d1d6db] hover:bg-[#8b95a1] text-[10px] font-extrabold text-white inline-flex items-center justify-center transition-colors leading-none flex-shrink-0"
                            aria-label="기준 설명"
                          >?</button>
                        </h5>
                        <div className="bg-[#f2f4f6] p-1 rounded-lg flex items-center shadow-inner ml-2">
                          <button onClick={() => setPeriodDealType('sale')} className={`px-3 py-1 rounded-md text-[13px] font-bold transition-all ${periodDealType === 'sale' ? 'bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-[#8b95a1] hover:text-[#4e5968]'}`}>매매</button>
                          <button onClick={() => setPeriodDealType('jeonse')} className={`px-3 py-1 rounded-md text-[13px] font-bold transition-all ${periodDealType === 'jeonse' ? 'bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-[#8b95a1] hover:text-[#4e5968]'}`}>전월세</button>
                        </div>
                      </div>
                      {showPriceHelp && (
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={() => setShowPriceHelp(false)} />
                          <div className="absolute left-4 top-12 z-[9999] w-[260px] bg-[#1e293b] text-white text-[11px] leading-relaxed rounded-xl px-4 py-3 shadow-2xl">
                            <div className="font-bold mb-1.5">📊 기간별 평균가격이란?</div>
                            <p className="text-white/80">각 기간 내 실거래된 모든 자료의 <span className="text-white font-bold">산술 평균</span>입니다.</p>
                            <p className="text-white/80 mt-1">100만 원 단위로 반올림하여 표시합니다.</p>
                            <p className="text-white/50 mt-1.5 text-[10px]">예: "1개월" = 최근 1개월간 거래된 가격의 평균</p>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Type filter chips */}
                    <div className="flex flex-nowrap gap-1.5 overflow-x-auto custom-scrollbar pb-3 -mx-1 px-1">
                      {typeFilters.map(f => {
                        const isActive = priceTypeFilter === f.key;
                        return (
                          <button key={f.key} onClick={() => setPriceTypeFilter(f.key)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              isActive
                                ? 'bg-[#191f28] text-white shadow-sm'
                                : 'bg-[#f2f4f6] text-[#8b95a1] hover:bg-[#e5e8eb]'
                            }`}
                          >{f.label}</button>
                        );
                      })}
                    </div>
                      <div className="overflow-x-auto custom-scrollbar -mx-4 md:-mx-10 px-4 md:px-10 mt-1">
                      <table className="w-full text-sm min-w-[600px] border-t border-[#f2f4f6]">
                        <thead>
                          <tr className="border-b border-[#e5e8eb] text-[#8b95a1] text-[12px] font-bold bg-[#f9fafb]">
                            <th className="py-2.5 px-2 text-center w-[52px] min-w-[52px] shrink-0">구분</th>
                            {periodData.map(p => (
                              <th key={`th-${p.key}`} className="py-2.5 px-3 text-center whitespace-nowrap">{p.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-2 text-[12px] md:text-[13px] font-bold text-[#4e5968] bg-[#f9fafb]/50 align-middle">
                              <div className="flex flex-col items-center justify-center leading-tight">
                                <span>평균</span>
                                <span>가격</span>
                              </div>
                            </td>
                            {periodData.map(p => (
                              <td key={`price-${p.key}`} className="py-3 px-3 text-center whitespace-nowrap">
                                <span className="text-[13px] md:text-[14px] font-bold md:font-extrabold text-[#191f28]">{p.avgPriceEok}</span>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-2 text-[12px] md:text-[13px] font-bold text-[#4e5968] bg-[#f9fafb]/50 align-middle">
                              <div className="flex flex-col items-center justify-center leading-tight">
                                <span>평당</span>
                                <span>가격</span>
                              </div>
                            </td>
                            {periodData.map(p => (
                              <td key={`perpyeong-${p.key}`} className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                                  <span className="text-[12px] md:text-[13px] font-bold text-[#4e5968]">{p.perPyeongEok}</span>
                                  <span className="text-[10px] md:text-[11px] text-[#8b95a1] font-medium tracking-tight">/평</span>
                                </div>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-2 text-[12px] md:text-[13px] font-bold text-[#4e5968] bg-[#f9fafb]/50 align-middle">
                              <div className="flex flex-col items-center justify-center leading-tight">
                                <span>거래</span>
                                <span>건수</span>
                              </div>
                            </td>
                            {periodData.map(p => (
                              <td key={`count-${p.key}`} className="py-3 px-3 text-center whitespace-nowrap">
                                <span className="text-[12px] md:text-[13px] font-medium text-[#8b95a1]">{p.count}건</span>
                              </td>
                            ))}
                          </tr>

                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Sticky Section Nav */}
          <nav className="sticky top-0 z-[60] bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] px-4 md:px-8 pt-3 pb-0 shadow-sm shadow-[#191f28]/5">
            <div className="flex gap-6 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full relative">
              {(() => {
                const tabs = [
                  { id: 'sec-summary', label: '단지 기본정보', show: true },
                  { id: 'sec-infra-metrics', label: '단지 입지정보', show: !!report.metrics },
                  { id: 'sec-valuation', label: '밸류에이션 분석', show: transactions.length > 0 },
                  { id: 'sec-photos', label: '현장 검증 사진', show: report.images && report.images.length > 0 },
                  { id: 'sec-comments', label: '아파트 이야기', show: true },
                ].filter(t => t.show);

                return tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => scrollToSection(tab.id)}
                      className={`relative shrink-0 pb-3 text-[14px] font-bold transition-all duration-200 outline-none ${
                         isActive ? 'text-[#191f28]' : 'text-[#8b95a1] hover:text-[#191f28]'
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#191f28] rounded-t-sm" />
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </nav>

          {/* Magazine Content Wrapper */}
          <div className={`${inline ? 'px-2 py-2 md:px-6 md:py-4' : 'px-2 py-2 md:px-3 md:py-3'} flex flex-col gap-8 w-full`}>

            {/* 1. 단지 기본 명세 (Specs) */}
            {report.metrics && (
              <div id="sec-specs" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb]">
                 <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3">
                   <Building size={18} className="text-[#3182f6]"/> 단지 기본정보
                 </h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">단지명 / 시공사</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{displayAptName} {report.metrics.brand && <span className="block text-[13px] text-[#4e5968] font-medium mt-0.5">({report.metrics.brand})</span>}</p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">사용승인일 (연차)</p>
                      <p className="text-[15px] text-[#191f28] font-bold">
                        {report.metrics.yearBuilt ? (() => {
                          const ybStr = String(report.metrics.yearBuilt);
                          const now = new Date();
                          const currentYear = now.getFullYear();
                          const currentMonth = now.getMonth() + 1;
                          
                          if (ybStr.length >= 6) {
                            const year = parseInt(ybStr.substring(0, 4));
                            const month = parseInt(ybStr.substring(4, 6));
                            const elapsedMonths = (currentYear - year) * 12 + (currentMonth - month);
                            
                            let ageStr = '';
                            if (elapsedMonths < 0) {
                              ageStr = '입주 전';
                            } else if (elapsedMonths === 0) {
                              ageStr = '신축 1개월 미만';
                            } else {
                              const y = Math.floor(elapsedMonths / 12);
                              const m = elapsedMonths % 12;
                              if (y > 0 && m > 0) ageStr = `${y}년 ${m}개월차`;
                              else if (y > 0) ageStr = `${y}년차`;
                              else ageStr = `${m}개월차`;
                            }
                            return <>{year}년 {month}월 <span className="block text-[13px] text-[#3182f6] font-medium mt-0.5">({ageStr})</span></>;
                          }
                          
                          const year = parseInt(ybStr);
                          const age = currentYear - year + 1;
                          return <>{year}년 <span className="block text-[13px] text-[#3182f6] font-medium mt-0.5">({age}년차)</span></>;
                        })() : '-'}
                      </p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">규모 (세대/층)</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.metrics.householdCount ? `${report.metrics.householdCount}세대` : '-'} <span className="block text-[#8b95a1] text-[13px] font-medium mt-0.5">/ {report.metrics.maxFloor ? `최고 ${report.metrics.maxFloor}층` : '-'}</span></p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">용적률 / 건폐율</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.metrics.far ? `${report.metrics.far}%` : '-'} <span className="block text-[#8b95a1] text-[13px] font-medium mt-0.5">/ {report.metrics.bcr ? `${report.metrics.bcr}%` : '-'}</span></p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">주차대수 (세대당)</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.metrics.parkingCount ? `${report.metrics.parkingCount}대` : '-'} <span className="block text-[#8b95a1] text-[13px] font-medium mt-0.5">/ {report.metrics.parkingPerHousehold ? `${report.metrics.parkingPerHousehold}대` : '-'}</span></p>
                    </div>

                 </div>
              </div>
            )}

            {/* ── PAYWALL GATE — 비활성화 (프리미엄 콘텐츠 전면 공개 중) ──
             * TODO: 유료 모델 전환 시 이 블록 복원
             * 원본: isPurchased/isAdmin 체크 후 PaymentButton 표시
             */}





          {/* 단지 입지정보 컨테이너 (인프라 + 앵커 테넌트 묶음) */}
          <div id="sec-infra-metrics" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb] flex flex-col gap-10 scroll-mt-14">
            {/* Location Infrastructure Info — Enhanced Design v2 */}
            {report.metrics && (report.metrics.distanceToElementary || report.metrics.distanceToSubway || report.metrics.academyDensity) && (
              <div className="flex flex-col w-full">
                <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3">
                  <MapPin size={18} className="text-[#3182f6]"/> 단지 입지정보
                </h2>

                {/* ─── 🎓 학군 Section ─── */}
                {(report.metrics.distanceToElementary > 0 || report.metrics.distanceToMiddle > 0 || report.metrics.distanceToHigh > 0) && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">

                      <span className="text-[13px] font-bold text-[#4e5968] tracking-wide uppercase">학군</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#e5e8eb] to-transparent ml-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
                      {[
                        { label: '초등학교', dist: report.metrics.distanceToElementary, name: report.metrics.nearestSchoolNames?.elementary },
                        { label: '중학교', dist: report.metrics.distanceToMiddle, name: report.metrics.nearestSchoolNames?.middle },
                        { label: '고등학교', dist: report.metrics.distanceToHigh, name: report.metrics.nearestSchoolNames?.high },
                      ].filter(s => s.dist && s.dist > 0).map(school => {
                        const grade = school.dist! <= 300 ? 'excellent' : school.dist! <= 700 ? 'good' : school.dist! <= 1000 ? 'average' : 'far';
                        const gradeStyles = {
                          excellent: { bg: 'bg-[#f0fdf4]', border: 'border-[#bbf7d0]', text: 'text-[#15803d]', badge: 'bg-[#dcfce7] text-[#15803d]', dot: 'bg-[#22c55e]' },
                          good: { bg: 'bg-[#f0f9ff]', border: 'border-[#bae6fd]', text: 'text-[#0369a1]', badge: 'bg-[#e0f2fe] text-[#0369a1]', dot: 'bg-[#0ea5e9]' },
                          average: { bg: 'bg-[#fffbeb]', border: 'border-[#fed7aa]', text: 'text-[#c2410c]', badge: 'bg-[#ffedd5] text-[#c2410c]', dot: 'bg-[#f97316]' },
                          far: { bg: 'bg-[#fef2f2]', border: 'border-[#fecaca]', text: 'text-[#b91c1c]', badge: 'bg-[#fee2e2] text-[#b91c1c]', dot: 'bg-[#ef4444]' },
                        };
                        const s = gradeStyles[grade];
                        return (
                          <div key={school.label} className={`${s.bg} rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col border ${s.border} hover:shadow-md transition-all duration-200 group`}>
                            <div className="flex items-center justify-between mb-1.5 md:mb-2.5">
                              <span className="text-[11px] md:text-[13px] font-bold text-[#4e5968] truncate pr-1">
                                {school.label}
                              </span>
                              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${s.dot} animate-pulse`} />
                            </div>
                            <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                              <span className={`text-[20px] md:text-[28px] font-black ${s.text} tracking-tight tabular-nums leading-none`}>{(school.dist! / 1000).toFixed(2)}</span>
                              <span className={`text-[10px] md:text-[13px] font-semibold ${s.text} opacity-60 ml-0.5 mt-auto`}>km</span>
                            </div>
                            {school.name && (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name + ' 화성시')}`}
                                target="_blank" rel="noopener noreferrer"
                                className={`text-[10px] md:text-[12px] flex items-center justify-center gap-0.5 md:gap-1 font-semibold ${s.text} mt-2 md:mt-2.5 ${s.badge} rounded-md md:rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5 text-center hover:opacity-80 transition-opacity`}
                                title={`${school.name} 구글 지도에서 보기`}
                              >
                                <MapPin size={10} className="shrink-0 md:w-3 md:h-3" />
                                <span className="truncate leading-tight block pt-px">{school.name}</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── 🚇 교통 Section ─── */}
                {(report.metrics.distanceToSubway > 0 || (report.metrics.distanceToIndeokwon != null && report.metrics.distanceToIndeokwon > 0) || (report.metrics.distanceToTram != null && report.metrics.distanceToTram > 0)) && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">

                      <span className="text-[13px] font-bold text-[#4e5968] tracking-wide uppercase">교통</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#e5e8eb] to-transparent ml-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
                      {[
                        { label: report.metrics.nearestStationLine || 'GTX-A / SRT', dist: report.metrics.distanceToSubway, name: report.metrics.nearestStationName, coords: report.metrics.nearestStationCoords, color: '#3182f6', bgFrom: '#eef6ff', bgTo: '#dbeafe' },
                        { label: report.metrics.nearestIndeokwonLine || '인덕원선', dist: report.metrics.distanceToIndeokwon, name: report.metrics.nearestIndeokwonStationName, coords: report.metrics.nearestIndeokwonCoords, color: '#7c3aed', bgFrom: '#f5f3ff', bgTo: '#ede9fe' },
                        { label: report.metrics.nearestTramLine || '동탄트램', dist: report.metrics.distanceToTram, name: report.metrics.nearestTramStationName, coords: report.metrics.nearestTramCoords, color: '#0891b2', bgFrom: '#ecfeff', bgTo: '#cffafe' },
                      ].filter(s => s.dist != null && s.dist > 0).map(station => (
                        <div key={station.label}
                          className="rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col border hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${station.bgFrom}, ${station.bgTo})`,
                            borderColor: `${station.color}25`,
                          }}>
                          {/* Subtle gradient accent bar */}
                          <div className="absolute top-0 left-0 right-0 h-[3px] opacity-80" style={{ background: `linear-gradient(90deg, ${station.color}, ${station.color}60)` }} />
                          <div className="flex items-center justify-between mb-1.5 md:mb-2.5">
                            <span className="text-[11px] md:text-[13px] font-bold truncate pr-1" style={{ color: station.color }}>
                              {station.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                            <span className="text-[20px] md:text-[28px] font-black tracking-tight tabular-nums leading-none" style={{ color: station.color }}>{(station.dist! / 1000).toFixed(2)}</span>
                            <span className="text-[10px] md:text-[13px] font-semibold opacity-60 ml-0.5 mt-auto" style={{ color: station.color }}>km</span>
                          </div>
                          {station.name && (
                            <a 
                              href={station.coords ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.coords)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.name + (station.name.includes('정거장') ? ' 동탄' : ' 역'))}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[10px] md:text-[12px] flex items-center justify-center gap-0.5 md:gap-1 font-semibold mt-2 md:mt-2.5 rounded-md md:rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5 text-center bg-white/80 backdrop-blur-sm hover:opacity-80 transition-opacity"
                              style={{ color: station.color, border: `1px solid ${station.color}20` }}
                              title={`${station.name} 구글 지도에서 보기`}
                            >
                              <MapPin size={10} className="shrink-0 md:w-3 md:h-3" />
                              <span className="truncate leading-tight block pt-px">{station.name}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── 🏪 생활 인프라 Section ─── */}
                {(report.metrics.academyDensity > 0 || (report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0)) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">

                      <span className="text-[13px] font-bold text-[#4e5968] tracking-wide uppercase">생활 인프라</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#e5e8eb] to-transparent ml-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2.5">
                      {/* Academy Density */}
                      {report.metrics.academyDensity > 0 && (
                        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]/50 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col border border-[#bbf7d0] hover:shadow-md transition-all duration-200 relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#22c55e] to-[#22c55e]/40" />
                          <div className="text-[11px] md:text-[13px] font-bold text-[#15803d] mb-1 md:mb-2 truncate pr-1">
                            학원 · 500m 반경
                          </div>
                          <div className="flex items-baseline gap-0.5 mb-2.5 md:mb-3 whitespace-nowrap">
                            <span className="text-[22px] md:text-[30px] font-black text-[#15803d] tracking-tight tabular-nums leading-none">{report.metrics.academyDensity}</span>
                            <span className="text-[11px] md:text-[13px] font-semibold text-[#15803d]/60 ml-0.5">개</span>
                          </div>
                          {report.metrics.academyCategories && Object.keys(report.metrics.academyCategories).length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-auto">
                              {Object.entries(report.metrics.academyCategories)
                                .sort(([,a], [,b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([cat, cnt]) => (
                                  <div key={cat} className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-lg px-2 md:px-2.5 py-1 md:py-1.5 border border-[#bbf7d0]/60">
                                    <span className="text-[10px] md:text-[12px] text-[#4e5968] font-medium truncate mr-1 md:mr-2">{cat}</span>
                                    <span className="font-extrabold text-[10px] md:text-[12px] text-[#15803d] shrink-0 tabular-nums">{cnt as number}개</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Restaurant/Cafe Density */}
                      {report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0 && (
                        <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]/50 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col border border-[#fde68a] hover:shadow-md transition-all duration-200 relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f59e0b] to-[#f59e0b]/40" />
                          <div className="text-[11px] md:text-[13px] font-bold text-[#b45309] mb-1 md:mb-2 truncate pr-1">
                            음식점·카페·500m
                          </div>
                          <div className="flex items-baseline gap-0.5 mb-2.5 md:mb-3 whitespace-nowrap">
                            <span className="text-[22px] md:text-[30px] font-black text-[#b45309] tracking-tight tabular-nums leading-none">{report.metrics.restaurantDensity}</span>
                            <span className="text-[11px] md:text-[13px] font-semibold text-[#b45309]/60 ml-0.5">개</span>
                          </div>
                          {report.metrics.restaurantCategories && Object.keys(report.metrics.restaurantCategories).length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-auto">
                              {Object.entries(report.metrics.restaurantCategories)
                                .sort(([,a], [,b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([cat, cnt]) => (
                                  <div key={cat} className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-lg px-2 md:px-2.5 py-1 md:py-1.5 border border-[#fde68a]/60">
                                    <span className="text-[10px] md:text-[12px] text-[#4e5968] font-medium truncate mr-1 md:mr-2">{cat}</span>
                                    <span className="font-extrabold text-[10px] md:text-[12px] text-[#b45309] shrink-0 tabular-nums">{cnt as number}개</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Anchor Tenant Metrics — 주요 편의시설 접근성 시각화 */}
            {report.metrics && (
              <AnchorTenantCard
                distanceToStarbucks={report.metrics.distanceToStarbucks}
                starbucksName={report.metrics.starbucksName}
                starbucksAddress={report.metrics.starbucksAddress}
                starbucksCoordinates={report.metrics.starbucksCoordinates}
                distanceToOliveYoung={report.metrics.distanceToOliveYoung}
                oliveYoungName={report.metrics.oliveYoungName}
                oliveYoungAddress={report.metrics.oliveYoungAddress}
                oliveYoungCoordinates={report.metrics.oliveYoungCoordinates}
                distanceToDaiso={report.metrics.distanceToDaiso}
                daisoName={report.metrics.daisoName}
                daisoAddress={report.metrics.daisoAddress}
                daisoCoordinates={report.metrics.daisoCoordinates}
                distanceToSupermarket={report.metrics.distanceToSupermarket}
                supermarketName={report.metrics.supermarketName}
                supermarketAddress={report.metrics.supermarketAddress}
                supermarketCoordinates={report.metrics.supermarketCoordinates}
                distanceToMcDonalds={report.metrics.distanceToMcDonalds}
                mcdonaldsName={report.metrics.mcdonaldsName}
                mcdonaldsAddress={report.metrics.mcdonaldsAddress}
                mcdonaldsCoordinates={report.metrics.mcdonaldsCoordinates}
              />
            )}
          </div>

            {/* 밸류에이션 리포트 (P/U Ratio & PER) */}
            {transactions.length > 0 && (
              <div id="sec-valuation" className="mb-2 scroll-mt-14 scroll-mb-6">
                <AdvancedValuationMetrics report={report} transactions={transactions} />
              </div>
            )}

            {/* Photo Gallery — Category Tab Grid (100+ photos) */}
            {report.images && report.images.length > 0 && (() => {
              const IMAGE_TAG_LABELS: Record<string, string> = {
                'gateImg': '정문', 'landscapeImg': '조경', 'parkingImg': '주차장',
                'maintenanceImg': '공용부', 'communityImg': '커뮤니티', 'schoolImg': '통학로', 'commerceImg': '상권',
              };
              const allTags = ['전체', ...Array.from(new Set(report.images.map(img => img.locationTag || '기타')))];
              return (
                <div id="sec-photos" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                  <details open>
                    <summary className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3 cursor-pointer list-none">
                      <Camera size={20} className="text-[#3182f6]"/>
                      현장 검증 사진
                      <div className="ml-auto flex items-center gap-2 md:gap-3">
                        <span className="text-[13px] font-bold text-[#8b95a1]">{report.images.length}장</span>
                      </div>
                    </summary>

                    {/* Category Filter Chips */}
                    <ApartmentGallery images={report.images} tags={allTags} tagLabels={IMAGE_TAG_LABELS} onImageClick={setFullscreenImage} />
                  </details>
                </div>
              );
            })()}

            {!s ? null : (
              // Advanced Template Render (요약은 위로 이동됨)
              <>

                {/* 2. 단지 기본정보 (Specs) */}
                <div id="sec-specs" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Building size={20} className="text-[#3182f6]"/> 단지 기본정보</h2>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">준공 연월 / 연차</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.builtYear || '-'}</p>
                      </div>
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">규모 (세대/동)</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.scale || '-'}</p>
                      </div>
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">용적률 / 건폐율</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.farBuild || '-'}</p>
                      </div>
                      <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                        <p className="text-[12px] text-[#8b95a1] font-bold mb-1">세대당 주차 (지하%)</p>
                        <p className="text-[15px] text-[#191f28] font-medium">{s.specs.parkingRatio || '-'}</p>
                      </div>
                   </div>
                </div>

                {/* 3. 물리적 인프라 & 조경 */}
                <div id="sec-infra" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Camera size={20} className="text-[#3182f6]"/> 현장 인프라 둘러보기</h2>
                   <div className="flex flex-col gap-8">
                      {/* Gate */}
                      {(s.infra.gateText || s.infra.gateImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.infra.gateImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#f2f4f6]"><Image src={s.infra.gateImg} alt="진입로/문주" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">진입로 및 정문</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.gateText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Landscaping */}
                      {(s.infra.landscapeText || s.infra.landscapeImg) && (
                        <div className="flex flex-col md:flex-row-reverse gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.infra.landscapeImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#f2f4f6]"><Image src={s.infra.landscapeImg} alt="조경/지형" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">단지 조경 및 지형</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.landscapeText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Parking & Maintenance ... (Skip strict layout for brevity, just render them similarly) */}
                       {(s.infra.parkingText || s.infra.parkingImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.infra.parkingImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#f2f4f6]"><Image src={s.infra.parkingImg} alt="지하주차장" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">지하주차장 인프라</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.parkingText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 4. Ecosystem */}
                <div id="sec-eco" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Info size={20} className="text-[#3182f6]"/> 생활 편의시설 및 거시 입지</h2>
                   <div className="flex flex-col gap-8">
                      {(s.ecosystem.schoolText || s.ecosystem.schoolImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.ecosystem.schoolImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#f2f4f6]"><Image src={s.ecosystem.schoolImg} alt="학군" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f8f9fa] border border-[#e5e8eb] inline-block px-3 py-1 rounded-lg">학군 및 통학로</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.ecosystem.schoolText}</p>
                          </div>
                        </div>
                      )}
                      {(s.ecosystem.commerceText || s.ecosystem.commerceImg) && (
                        <div className="flex flex-col md:flex-row-reverse gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.ecosystem.commerceImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#f2f4f6]"><Image src={s.ecosystem.commerceImg} alt="상권" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f8f9fa] border border-[#e5e8eb] inline-block px-3 py-1 rounded-lg">동네 상권</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.ecosystem.commerceText}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 5. 최종 결론 */}
                <div id="sec-conclusion" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><ShieldAlert size={20} className="text-[#3182f6]"/> 최종 매수 타당성 평가</h2>
                   <div className="flex flex-col gap-4">
                      <div className="bg-[#191f28] p-6 rounded-2xl text-white">
                        <h4 className="text-[13px] font-bold text-[#8b95a1] mb-2">교통 및 개발 호재</h4>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap mb-4 pb-4 border-b border-white/10">{s.location.trafficText || '-'}</p>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{s.location.developmentText || '-'}</p>
                      </div>
                      <div className="p-6 rounded-2xl border-2 border-[#191f28] bg-[#fdfdfd]">
                        <h4 className="text-[16px] font-extrabold text-[#191f28] mb-2">💡 최종 결론</h4>
                        <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.assessment.synthesis || '-'}</p>
                        
                        {s.assessment.probability && (
                          <div className="mt-6 p-4 bg-[#e8f3ff] rounded-xl flex items-start gap-3">
                             <Radar size={20} className="text-[#3182f6] shrink-0 mt-0.5" />
                             <div>
                               <h5 className="text-[13px] font-bold text-[#3182f6] mb-1">향후 가격 전망</h5>
                               <p className="text-[14px] text-[#191f28] leading-snug">{s.assessment.probability}</p>
                             </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* Comments Section */}
            <div id="sec-comments">
              <CommentSection
                comments={comments}
                commentInput={commentInput}
                onCommentChange={onCommentChange}
                onSubmitComment={onSubmitComment}
                user={user}
                isUnlocked={isUnlocked}
              />
            </div>

          </div>
    </>
  );

  // ── Return: inline panel vs modal overlay ──
  if (inline) {
    return (
      <div ref={modalRef} onScroll={handleScroll} className="bg-white h-full flex flex-col overflow-y-auto overflow-x-hidden">
        {content}
        {/* Fullscreen Image Overlay */}
        {fullscreenImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
            onClick={() => setFullscreenImage(null)}
          >
            <button 
              className="absolute top-6 right-6 z-50 text-white/50 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
            >
              <X size={24} />
            </button>
            <div className="relative w-[95vw] h-[95vh]">
              <Image 
                src={fullscreenImage} 
                alt="Fullscreen view"
                fill
                sizes="100vw"
                className="object-contain select-none shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 md:p-12 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-[#191f28]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div ref={modalRef} onScroll={handleScroll} className={`relative bg-[#f2f4f6] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] max-h-[90vh] rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5`}>
          <button onClick={onClose} className="sticky top-4 z-[100] ml-auto mr-4 mt-4 -mb-14 bg-[#191f28]/80 hover:bg-[#191f28] text-white w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0">
            <X size={20} />
          </button>
          {content}
        </div>
      </div>
      {/* Fullscreen Image Overlay */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen view" 
            className="max-w-[95vw] max-h-[95vh] object-contain select-none shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}

