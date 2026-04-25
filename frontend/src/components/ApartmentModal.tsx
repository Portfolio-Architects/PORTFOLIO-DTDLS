'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  MapPin, X, TrendingUp, Camera, Maximize2,
  MessageSquare, UserCircle, CheckCircle2, Building, Info, ShieldAlert, Radar, ChevronDown, ArrowLeftRight, ArrowLeft, Download, Share
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
import { createPortal } from 'react-dom';
import CommentSection from '@/components/CommentSection';
import { ApartmentGallery } from './apartment-modal/ApartmentGallery';
import { TransactionTable } from './apartment-modal/TransactionTable';
import { TransactionChartSection } from './apartment-modal/TransactionChartSection';
import { TransactionSummaryMetrics } from './apartment-modal/TransactionSummaryMetrics';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { PhotoUploadModal } from './apartment-modal/PhotoUploadModal';

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
  areaUnit = 'm2',
  txSummary
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
  txSummary?: any;
}) {
  useSwipeNavigation({ onBack: onClose });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const displayAptName = getDisplayAptName(report.apartmentName);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sec-summary');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 차트 매매/전월세 토글
  const [chartType, setChartType] = useState<'sale' | 'jeonse'>('sale');

  // Hydration-safe portal mount
  useEffect(() => {
    setMounted(true);
  }, []);


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

  const handleDownloadWatermarkedImage = async (imageUrl: string) => {
    try {
      const img = new window.Image();
      
      // Use custom API route to fetch the image with CORS headers
      img.crossOrigin = 'anonymous';
      img.src = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          ctx.drawImage(img, 0, 0);
          
          // Add subtle dark background for text readability
          const textMargin = canvas.width * 0.03;
          const fontSize = Math.max(canvas.width * 0.025, 14);
          
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          
          const uploaderName = currentImgData?.uploaderName;
          const watermarkText = uploaderName ? `D-VIEW x ${uploaderName}` : 'D-VIEW';
          
          const textMetrics = ctx.measureText(watermarkText);
          const bgPaddingX = fontSize * 0.8;
          const bgPaddingY = fontSize * 0.5;
          const bgWidth = textMetrics.width + (bgPaddingX * 2);
          const bgHeight = fontSize + (bgPaddingY * 2);
          
          const bgX = canvas.width - textMargin - bgWidth;
          const bgY = canvas.height - textMargin - bgHeight;
          
          // Draw rounded rectangle background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.roundRect(bgX, bgY, bgWidth, bgHeight, fontSize * 0.4);
          ctx.fill();
          
          // Draw text
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          if ('letterSpacing' in ctx) {
            (ctx as any).letterSpacing = '0.1em';
          }
          
          ctx.fillText(watermarkText, canvas.width - textMargin - bgPaddingX, canvas.height - textMargin - bgPaddingY);
          ctx.restore();
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `D-VIEW_${displayAptName}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {
          console.error('Canvas tainting or drawing error:', e);
          window.open(imageUrl, '_blank');
        }
      };
      
      img.onerror = () => {
        console.warn('Canvas download failed due to load error, falling back to original image.');
        window.open(imageUrl, '_blank');
      };
    } catch (error) {
      console.error('Failed to download watermarked image', error);
      window.open(imageUrl, '_blank');
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
            <div className="w-full md:w-[40%] shrink-0 order-2 md:order-1 flex flex-col self-start md:self-stretch">
              <TransactionTable 
                transactions={transactions} 
                typeMap={typeMap} 
                areaUnit={areaUnit} 
                chartType={chartType} 
                normalizeAptName={normalizeAptName} 
              />
            </div>

            <TransactionChartSection 
              transactions={transactions} 
              chartType={chartType} 
              setChartType={setChartType} 
              displayAptName={displayAptName} 
              dong={report.dong || ''} 
              typeMap={typeMap} 
              areaUnit={areaUnit || 'm2'} 
              normalizeAptName={normalizeAptName} 
              txSummary={txSummary}
            />

          </div>

          {/* ── 평형별 최근 거래가 + 기간별 평균 ── */}
          <TransactionSummaryMetrics 
            transactions={transactions} 
            apartmentName={report.apartmentName}
            typeMap={typeMap}
            areaUnit={areaUnit || 'm2'}
          />

          {/* Sticky Section Nav */}
          <nav className="sticky top-0 z-[60] bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] px-4 md:px-8 pt-3 pb-0 shadow-sm shadow-[#191f28]/5">
            <div className="flex gap-6 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full relative">
              {(() => {
                const tabs = [
                  { id: 'sec-summary', label: '단지 기본정보', show: true },
                  { id: 'sec-infra-metrics', label: '단지 입지정보', show: !!report.metrics },
                  { id: 'sec-valuation', label: '밸류에이션 분석', show: transactions.length > 0 },
                  { id: 'sec-photos', label: '우리 단지 갤러리', show: true },
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
                          excellent: { dot: 'bg-[#3182f6]', badge: 'bg-[#f2f4f6] text-[#4e5968]' },
                          good: { dot: 'bg-[#22c55e]', badge: 'bg-[#f2f4f6] text-[#4e5968]' },
                          average: { dot: 'bg-[#f59e0b]', badge: 'bg-[#f2f4f6] text-[#4e5968]' },
                          far: { dot: 'bg-[#ef4444]', badge: 'bg-[#f2f4f6] text-[#4e5968]' },
                        };
                        const s = gradeStyles[grade];
                        return (
                          <div key={school.label} className="bg-white rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col border border-[#e5e8eb] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 group">
                            <div className="flex items-center justify-between mb-1.5 md:mb-2.5">
                              <span className="text-[11px] md:text-[13px] font-semibold text-[#8b95a1] truncate pr-1">
                                {school.label}
                              </span>
                              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${s.dot}`} />
                            </div>
                            <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                              <span className="text-[20px] md:text-[28px] font-bold text-[#191f28] tracking-tight tabular-nums leading-none">{(school.dist! / 1000).toFixed(2)}</span>
                              <span className="text-[10px] md:text-[13px] font-medium text-[#8b95a1] ml-0.5 mt-auto">km</span>
                              <span className="text-[11px] md:text-[12px] font-medium text-[#4e5968] ml-1.5 md:ml-2 mt-auto bg-[#f2f4f6] px-1.5 py-0.5 rounded-md">도보 {Math.ceil(school.dist! / 80)}분</span>
                            </div>
                            {school.name && (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name + ' 화성시')}`}
                                target="_blank" rel="noopener noreferrer"
                                className={`text-[10px] md:text-[12px] flex items-center justify-center gap-0.5 md:gap-1 font-semibold mt-2 md:mt-2.5 ${s.badge} rounded-md md:rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5 text-center hover:opacity-80 transition-opacity`}
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
                        <div key={station.label} className="bg-white rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col border border-[#e5e8eb] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 group">
                          <div className="flex items-center justify-between mb-1.5 md:mb-2.5">
                            <span className="text-[11px] md:text-[13px] font-semibold text-[#8b95a1] truncate pr-1">
                              {station.label}
                            </span>
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0" style={{ backgroundColor: station.color }} />
                          </div>
                          <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                            <span className="text-[20px] md:text-[28px] font-bold text-[#191f28] tracking-tight tabular-nums leading-none">{(station.dist! / 1000).toFixed(2)}</span>
                            <span className="text-[10px] md:text-[13px] font-medium text-[#8b95a1] ml-0.5 mt-auto">km</span>
                            <span className="text-[11px] md:text-[12px] font-medium text-[#4e5968] ml-1.5 md:ml-2 mt-auto bg-[#f2f4f6] px-1.5 py-0.5 rounded-md">도보 {Math.ceil(station.dist! / 80)}분</span>
                          </div>
                          {station.name && (
                            <a 
                              href={station.coords ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.coords)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.name + (station.name.includes('정거장') ? ' 동탄' : ' 역'))}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[10px] md:text-[12px] flex items-center justify-center gap-0.5 md:gap-1 font-semibold mt-2 md:mt-2.5 rounded-md md:rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5 text-center bg-[#f2f4f6] text-[#4e5968] hover:opacity-80 transition-opacity"
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
                        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col border border-[#e5e8eb] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 group">
                          <div className="flex items-center justify-between mb-1 md:mb-2">
                            <span className="text-[11px] md:text-[13px] font-semibold text-[#8b95a1] truncate pr-1">
                              학원 · 500m 반경
                            </span>
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 bg-[#22c55e]" />
                          </div>
                          <div className="flex items-baseline gap-0.5 mb-2.5 md:mb-3 whitespace-nowrap">
                            <span className="text-[22px] md:text-[30px] font-bold text-[#191f28] tracking-tight tabular-nums leading-none">{report.metrics.academyDensity}</span>
                            <span className="text-[11px] md:text-[13px] font-medium text-[#8b95a1] ml-0.5">개</span>
                          </div>
                          {report.metrics.academyCategories && Object.keys(report.metrics.academyCategories).length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-auto">
                              {Object.entries(report.metrics.academyCategories)
                                .sort(([,a], [,b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([cat, cnt]) => (
                                  <div key={cat} className="flex justify-between items-center bg-[#f2f4f6] rounded-lg px-2 md:px-2.5 py-1 md:py-1.5">
                                    <span className="text-[10px] md:text-[12px] text-[#4e5968] font-medium truncate mr-1 md:mr-2">{cat}</span>
                                    <span className="font-semibold text-[10px] md:text-[12px] text-[#4e5968] shrink-0 tabular-nums">{cnt as number}개</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Restaurant/Cafe Density */}
                      {report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0 && (
                        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col border border-[#e5e8eb] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 group">
                          <div className="flex items-center justify-between mb-1 md:mb-2">
                            <span className="text-[11px] md:text-[13px] font-semibold text-[#8b95a1] truncate pr-1">
                              음식점·카페·500m
                            </span>
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 bg-[#f59e0b]" />
                          </div>
                          <div className="flex items-baseline gap-0.5 mb-2.5 md:mb-3 whitespace-nowrap">
                            <span className="text-[22px] md:text-[30px] font-bold text-[#191f28] tracking-tight tabular-nums leading-none">{report.metrics.restaurantDensity}</span>
                            <span className="text-[11px] md:text-[13px] font-medium text-[#8b95a1] ml-0.5">개</span>
                          </div>
                          {report.metrics.restaurantCategories && Object.keys(report.metrics.restaurantCategories).length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-auto">
                              {Object.entries(report.metrics.restaurantCategories)
                                .sort(([,a], [,b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([cat, cnt]) => (
                                  <div key={cat} className="flex justify-between items-center bg-[#f2f4f6] rounded-lg px-2 md:px-2.5 py-1 md:py-1.5">
                                    <span className="text-[10px] md:text-[12px] text-[#4e5968] font-medium truncate mr-1 md:mr-2">{cat}</span>
                                    <span className="font-semibold text-[10px] md:text-[12px] text-[#4e5968] shrink-0 tabular-nums">{cnt as number}개</span>
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

            {/* Photo Gallery — Category Tab Grid (100+ photos) or Empty State */}
            {report.images && report.images.length > 0 ? (() => {
              const IMAGE_TAG_LABELS: Record<string, string> = {
                'gateImg': '정문', 'landscapeImg': '조경', 'parkingImg': '주차장',
                'maintenanceImg': '공용부', 'communityImg': '커뮤니티', 'schoolImg': '통학로', 'commerceImg': '상권',
              };
              const allTags = ['전체', ...Array.from(new Set(report.images.map(img => img.locationTag || '기타')))];
              return (
                <div id="sec-photos" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14 relative">
                  <div className="absolute top-6 md:top-8 right-6 md:right-8 flex items-center gap-2 md:gap-3 z-10">
                    <span className="text-[13px] font-bold text-[#8b95a1]">{report.images.length}장</span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsUploadModalOpen(true);
                      }}
                      className="text-[13px] font-bold text-[#3182f6] bg-[#e8f3ff] px-3 py-1.5 rounded-lg hover:bg-[#d1e7ff] transition-colors"
                    >
                      + 사진 추가
                    </button>
                  </div>
                  <details open>
                    <summary className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3 cursor-pointer list-none pr-32">
                      <Camera size={20} className="text-[#3182f6]"/>
                      우리 단지 갤러리
                    </summary>

                    {/* Category Filter Chips */}
                    <ApartmentGallery aptName={report.apartmentName} images={report.images} tags={allTags} tagLabels={IMAGE_TAG_LABELS} onImageClick={setFullscreenImage} />
                  </details>
                </div>
              );
            })() : (
              <div id="sec-photos" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14 overflow-hidden relative group">
                <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3">
                  <Camera size={20} className="text-[#3182f6]"/> 우리 단지 갤러리
                </h2>
                <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f8f9fa] to-[#f2f4f6] border border-[#e5e8eb] p-8 md:p-12 flex flex-col items-center justify-center min-h-[300px]">
                  {/* Glassmorphism subtle background effects */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#3182f6] mix-blend-multiply filter blur-[80px] opacity-[0.03] rounded-full transform translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7c3aed] mix-blend-multiply filter blur-[80px] opacity-[0.03] rounded-full transform -translate-x-1/2 translate-y-1/2" />
                  
                  <div className="w-16 h-16 bg-white shadow-sm border border-[#e5e8eb] rounded-2xl flex items-center justify-center mb-5 relative z-10">
                    <Camera className="text-[#3182f6]" size={32} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-[18px] md:text-[20px] font-extrabold text-[#191f28] tracking-tight mb-2 relative z-10 text-center">
                    데이터가 담지 못하는 우리 단지의 진정한 가치
                  </h3>
                  <p className="text-[14px] md:text-[15px] text-[#4e5968] font-medium leading-relaxed mb-8 max-w-md relative z-10 text-center">
                    매수자의 첫인상을 결정하는 대표 이미지 1장.<br className="hidden md:block" />
                    입주민의 시선으로 <strong className="text-[#3182f6]">우리 단지의 품격</strong>을 직접 완성해 주세요.
                  </p>
                  
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsUploadModalOpen(true);
                    }}
                    className="group relative z-10 flex items-center gap-2 bg-[#191f28] text-white text-[15px] font-bold px-6 py-3.5 rounded-xl hover:bg-[#3182f6] hover:shadow-[0_4px_12px_rgba(49,130,246,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <span>우리 단지 첫 번째 앰배서더 되기</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182f6] group-hover:bg-white animate-pulse" />
                  </button>
                  
                  <p className="text-[12px] text-[#8b95a1] font-medium mt-5 relative z-10 text-center">
                    * 고화질 사진이 풍부한 단지는 <span className="text-[#191f28] font-bold">인기 단지 탐색 상단에 우선 노출</span>됩니다.
                  </p>
                </div>
              </div>
            )}

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

  // --- Image Navigation Logic ---
  const currentImageIndex = report?.images?.findIndex(img => img.url === fullscreenImage) ?? -1;
  const hasImages = report?.images && report.images.length > 0;
  
  const handleNextImage = React.useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasImages && currentImageIndex !== -1 && currentImageIndex < report.images!.length - 1) {
      setFullscreenImage(report.images![currentImageIndex + 1].url);
    }
  }, [hasImages, currentImageIndex, report?.images]);

  const handlePrevImage = React.useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasImages && currentImageIndex > 0) {
      setFullscreenImage(report.images![currentImageIndex - 1].url);
    }
  }, [hasImages, currentImageIndex, report?.images]);

  // Keyboard navigation & preloading
  React.useEffect(() => {
    if (!fullscreenImage || !hasImages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setFullscreenImage(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    // Preload next and previous images
    if (currentImageIndex !== -1) {
      if (currentImageIndex > 0) {
        const prevImg = new window.Image();
        prevImg.src = report.images![currentImageIndex - 1].url;
      }
      if (currentImageIndex < report.images!.length - 1) {
        const nextImg = new window.Image();
        nextImg.src = report.images![currentImageIndex + 1].url;
      }
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, hasImages, currentImageIndex, handleNextImage, handlePrevImage, report?.images]);

  const FullscreenOverlay = () => {
    if (!fullscreenImage) return null;
    const currentImgData = report?.images?.[currentImageIndex];
    return (
      <div 
        className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
        onClick={() => setFullscreenImage(null)}
      >
        <button 
          className="absolute top-6 right-6 z-50 text-white/50 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
        >
          <X size={24} />
        </button>
        <button 
          className="absolute top-6 right-20 z-50 text-white/50 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={(e) => { e.stopPropagation(); handleDownloadWatermarkedImage(fullscreenImage); }}
          title="이미지 저장 (워터마크 포함)"
        >
          <Download size={24} />
        </button>

        {/* Left Arrow */}
        {currentImageIndex > 0 && (
          <button
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white p-3 rounded-full bg-black/20 hover:bg-white/20 transition-colors"
            onClick={handlePrevImage}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}

        {/* Right Arrow */}
        {hasImages && currentImageIndex < report!.images!.length - 1 && (
          <button
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white p-3 rounded-full bg-black/20 hover:bg-white/20 transition-colors"
            onClick={handleNextImage}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        <div className="relative flex flex-col items-center justify-center w-full h-full" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
          <div className="relative flex items-center justify-center">
            {/* Use standard img with fetchPriority for faster loading than Next/Image in this specific raw URL context */}
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view"
              fetchPriority="high"
              className="max-w-[95vw] max-h-[85vh] object-contain select-none shadow-2xl pointer-events-none transition-opacity duration-300"
            />
            {/* Subtle Corner Watermark */}
            <div className="absolute right-4 bottom-4 pointer-events-none z-20">
              <span className="text-white/70 font-bold text-sm md:text-base tracking-widest select-none drop-shadow-xl bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
                {currentImgData?.uploaderName ? `D-VIEW x ${currentImgData.uploaderName}` : 'D-VIEW'}
              </span>
            </div>
          </div>
          
          {/* Metadata Footer */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-full flex items-center gap-3 border border-white/10 shadow-lg">
              <span className="text-white/90 text-[13px] font-bold">
                {currentImageIndex + 1} <span className="text-white/40 font-normal">/ {report!.images!.length}</span>
              </span>
              {currentImgData?.locationTag && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-white/80 text-[13px] font-medium">{currentImgData.locationTag}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Return: inline panel vs modal overlay ──
  if (inline) {
    return (
      <div ref={modalRef} onScroll={handleScroll} className="bg-white h-full flex flex-col overflow-y-auto overflow-x-hidden">
        {content}
        <FullscreenOverlay />
        
        {/* Upload Modal */}
        {isUploadModalOpen && (
          <PhotoUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            apartmentId={report.id}
            apartmentName={report.apartmentName}
            user={user}
          />
        )}
      </div>
    );
  }

  // Use Portal for the modal to escape CSS containing blocks (transforms)
  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end md:items-center md:justify-center p-0 md:p-12 animate-in fade-in duration-200" style={{ position: 'fixed' }}>
        <div className="absolute inset-0 bg-[#191f28]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div ref={modalRef} onScroll={handleScroll} className={`relative bg-[#f2f4f6] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] h-[100dvh] md:h-auto md:max-h-[90vh] rounded-none md:rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden shadow-2xl transition-transform duration-300 ring-1 ring-black/5 pb-24 md:pb-0 slide-in-from-bottom`}>

          <button onClick={onClose} className="sticky top-4 z-[100] ml-auto mr-4 mt-4 -mb-14 bg-[#191f28]/80 hover:bg-[#191f28] text-white w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0 hidden md:flex">
            <X size={20} />
          </button>
          
          {content}
          {/* 하단 고정 버튼 영역 침범 방지용 여백 (모바일 전용) */}
          <div className="h-28 md:hidden shrink-0" />

          {/* Mobile Sticky CTA (공유하기) */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#e5e8eb] md:hidden z-[100]">
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={onClose}
                className="w-[56px] h-[56px] bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#4e5968] rounded-2xl flex items-center justify-center transition-colors shrink-0"
                title="뒤로가기"
              >
                <ArrowLeft size={24} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `[D-VIEW] ${displayAptName}`,
                      text: `이 단지의 가치를 뜯어보세요! 실거래가 및 인프라 분석`,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    alert('공유하기 기능이 지원되지 않는 브라우저입니다.');
                  }
                }}
                className="flex-1 h-[56px] bg-[#3182f6] hover:bg-[#1b64da] text-white font-extrabold text-[16px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(49,130,246,0.2)] transition-colors"
              >
                <Share size={20} strokeWidth={2.5} />
                공유하기
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <PhotoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          apartmentId={report.id}
          apartmentName={report.apartmentName}
          user={user}
        />
      )}
      
      <FullscreenOverlay />
    </>,
    document.getElementById('modal-root') || document.body
  );
}
