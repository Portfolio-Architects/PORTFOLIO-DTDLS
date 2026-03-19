'use client';

import { 
  Building, MapPin, Map as MapIcon, Info, Users, AlertCircle, ShieldAlert,
  Car, BookOpen, ClipboardCheck, Tag, X, FileText, CheckCircle2, TrendingUp, Radar,
  MessageSquare, Heart, Compass, LayoutDashboard, Camera, UserCircle, Star, Maximize2, Link2, Trash2, Text, LogOut,
  Home, PenLine, Send, Edit3, Shield, ShieldCheck, Building2, Check, Pencil
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Scatter, Bar, ReferenceDot, Legend, Customized, Line } from 'recharts';
import Sparkline from '@/components/Sparkline';
import { normalize84Price } from '@/lib/utils/valuation';

// Lazy-loaded heavy chart components (reduces initial bundle ~40KB)
const MainChart = dynamic(() => import('@/components/MainChart'), { ssr: false });
const EduBubbleChart = dynamic(() => import('@/components/EduBubbleChart'), { ssr: false });
const LifestyleRadarChart = dynamic(() => import('@/components/LifestyleRadarChart'), { ssr: false });
const PropertyScoreChart = dynamic(() => import('@/components/consumer/PropertyScoreChart'), { ssr: false });
const ValuationWaterfall = dynamic(() => import('@/components/consumer/ValuationWaterfall'), { ssr: false });
const DynamicSimulator = dynamic(() => import('@/components/consumer/DynamicSimulator'), { ssr: false });
const ArchitectureMindmap = dynamic(() => import('@/components/admin/ArchitectureMindmap'), { ssr: false });
const PaymentButton = dynamic(() => import('@/components/PaymentButton'), { ssr: false });

import { useDashboardData, dashboardFacade, CommentData, FieldReportData, UserReview } from '@/lib/DashboardFacade';
import WriteReviewModal from '@/components/WriteReviewModal';
import { DONGS, getDongByName, getDongColor, getAllDongNames } from '@/lib/dongs';
import { APARTMENTS_BY_DONG, TOTAL_APARTMENTS } from '@/lib/apartment-data';
import type { StaticApartment } from '@/lib/apartment-data';
import { TX_SUMMARY } from '@/lib/transaction-summary';
import type { AptTxSummary } from '@/lib/transaction-summary';
import { isSameApartment, normalizeAptName, findTxKey } from '@/lib/utils/apartmentMapping';
import * as PurchaseRepo from '@/lib/repositories/purchase.repository';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import * as UserRepo from '@/lib/repositories/user.repository';
import type { UserProfile } from '@/lib/types/user.types';
import { getDisplayName } from '@/lib/types/user.types';

interface TransactionRecord {
  dong: string;
  aptName: string;
  area: number;
  areaPyeong: number;
  contractYm: string;
  contractDay: string;
  price: number;
  priceEok: string;
  floor: number;
  buildYear: number;
  dealType: string;
}

/** GalleryGrid — Compact category-tab photo grid for 100+ photos */
function GalleryGrid({ images, tags, tagLabels, onImageClick }: {
  images: {url: string; caption?: string; locationTag?: string; isPremium?: boolean}[];
  tags: string[];
  tagLabels: Record<string, string>;
  onImageClick: (url: string) => void;
}) {
  const [activeTag, setActiveTag] = useState('전체');
  const filtered = activeTag === '전체' ? images : images.filter(img => (img.locationTag || '기타') === activeTag);

  return (
    <>
      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 custom-scrollbar">
        {tags.map(tag => {
          const count = tag === '전체' ? images.length : images.filter(img => (img.locationTag || '기타') === tag).length;
          const label = tagLabels[tag] || tag;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                activeTag === tag
                  ? 'bg-[#191f28] text-white border-[#191f28]'
                  : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6] hover:text-[#3182f6]'
              }`}
            >
              {label} <span className="opacity-60 ml-0.5">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {filtered.map((img, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-[#e5e8eb] shadow-sm"
            onClick={() => onImageClick(img.url)}
          >
            <img
              src={img.url}
              alt={img.caption || img.locationTag || `Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover bg-[#f2f4f6] group-hover:scale-105 transition-transform duration-300"
            />
            {/* Hover overlay with caption + tag */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                  {tagLabels[img.locationTag || ''] || img.locationTag || '기타'}
                </span>
                {img.isPremium && (
                  <span className="text-[9px] font-bold bg-[#ffc107] text-[#191f28] px-1.5 py-0.5 rounded-md">★ PRO</span>
                )}
              </div>
              {img.caption && (
                <p className="text-[11px] text-white/90 mt-1 line-clamp-2">{img.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[#8b95a1] text-[13px]">이 카테고리에 등록된 사진이 없습니다.</div>
      )}
    </>
  );
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
  onPurchaseComplete
}: { 
  report: FieldReportData;
  onClose: () => void;
  comments: CommentData[];
  commentInput: string;
  onCommentChange: (text: string) => void;
  onSubmitComment: () => void;
  user: User | null;
  transactions: TransactionRecord[];
  typeMap: Record<string, Record<string, string>>;
  isLoadingDetail?: boolean;
  isPurchased?: boolean;
  isAdmin?: boolean;
  onPurchaseComplete?: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'6M'|'1Y'|'3Y'|'ALL'>('ALL');
  const [isTxExpanded, setIsTxExpanded] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<{ x: number; y: number; data: any } | null>(null);
  const isUnlocked = isPurchased || isAdmin;
  const isStub = report.id.startsWith('stub-');
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollToSection = (id: string) => {
    if (id === 'sec-summary' && modalRef.current) {
      // Summary = first section, just scroll modal to top
      modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = modalRef.current?.querySelector(`#${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const s = report.sections;
  const coverImage = report.imageUrl || s?.infra?.gateImg || s?.infra?.landscapeImg || s?.ecosystem?.communityImg;
  const rating = report.premiumScores?.totalPremiumScore ? Math.max(1, Math.round(report.premiumScores.totalPremiumScore / 20)) : (report.rating || 5);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 md:p-12 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-[#191f28]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div ref={modalRef} className={`relative bg-[#f2f4f6] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] max-h-[90vh] rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5`}>
          <button onClick={onClose} className="sticky top-4 z-20 ml-auto mr-4 mt-4 -mb-14 bg-[#191f28]/80 hover:bg-[#191f28] text-white w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0">
            <X size={20} />
          </button>

          {/* Hero Section — Layout: 40% table / 60% chart */}
          <div className="bg-white w-full flex flex-col md:flex-row p-4 md:p-10 gap-4 md:gap-8 rounded-t-3xl shrink-0 pt-4 md:pt-8 border-b border-[#e5e8eb]">
            
            {/* Left: 실거래가 전체 리스트 — mobile: 2번째, desktop: 1번째 (40%) */}
            <div className="w-full md:w-[40%] shrink-0 order-2 md:order-1">
              {transactions.length > 0 ? (
                <div className="bg-[#f9fafb] rounded-2xl p-4 ring-1 ring-black/5">
                  <h4 className="text-[13px] font-bold text-[#8b95a1] mb-3 flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-[#03c75a]" />
                    실거래가 내역 <span className="text-[11px] ml-1">{transactions.length}건</span>
                  </h4>
                  <div className="flex-1">
                    <table className="w-full text-[13px]">
                      <thead className="sticky top-0 bg-[#f9fafb]">
                        <tr className="border-b border-[#e5e8eb] text-[#8b95a1]">
                          <th className="py-3 text-left font-bold">거래일</th>
                          <th className="py-3 text-right font-bold">금액</th>
                          <th className="py-3 text-right font-bold">면적</th>
                          <th className="py-3 text-right font-bold">층</th>
                          <th className="py-3 text-right font-bold">유형</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isTxExpanded ? transactions : transactions.slice(0, 10)).map((tx, idx) => (
                          <tr key={idx} className={`border-b border-[#f2f4f6] hover:bg-white/60 transition-colors ${idx < 3 ? 'bg-[#f0f7ff]' : ''}`}>
                            <td className={`py-3 ${idx < 3 ? 'text-[#191f28] font-bold' : 'text-[#4e5968]'}`}>
                              {idx < 3 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3182f6] mr-1.5 mb-[1px]" />}
                              {tx.contractYm.slice(0,4)}.{tx.contractYm.slice(4)}.{tx.contractDay}
                            </td>
                            <td className={`py-3 text-right font-extrabold ${idx < 3 ? 'text-[#3182f6]' : 'text-[#191f28]'}`}>{tx.priceEok}</td>
                            <td className="py-3 text-right text-[#4e5968]">{(() => { const norm = normalizeAptName(tx.aptName); const t = typeMap[norm]?.[String(tx.area)]; return t ? <span className="font-bold text-[#3182f6] bg-[#e8f3ff] px-1.5 py-0.5 rounded text-[10px]">{t}</span> : `${tx.areaPyeong}평`; })()}</td>
                            <td className="py-3 text-right text-[#4e5968]">{tx.floor}층</td>
                            <td className="py-3 text-right text-[#8b95a1]">{tx.dealType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {transactions.length > 10 && (
                      <button
                        onClick={() => setIsTxExpanded(!isTxExpanded)}
                        className="w-full mt-2 py-2 text-[12px] font-bold text-[#3182f6] hover:bg-[#e8f3ff] rounded-lg transition-colors"
                      >
                        {isTxExpanded ? '접기 ▲' : `나머지 ${transactions.length - 10}건 더보기 ▼`}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#f9fafb] rounded-2xl p-8 flex items-center justify-center ring-1 ring-black/5 h-[200px]">
                  <span className="text-[#8b95a1] text-[13px] font-bold">매매 기록이 없습니다</span>
                </div>
              )}
            </div>

            {/* Right: Title + Chart — mobile: 1번째, desktop: 2번째 (60%) */}
            <div className="w-full md:w-[60%] flex flex-col order-1 md:order-2">
               <div className="flex items-center gap-2 mb-3">
                 <span className="bg-[#3182f6] text-white text-[13px] font-bold px-3 py-1 rounded-full">{report.dong || '동탄'}</span>
               </div>
               <h1 className="text-[22px] sm:text-[28px] md:text-[36px] font-extrabold leading-tight tracking-tight mb-4 text-[#191f28]">{report.apartmentName}</h1>
               
               {!isStub && (
               <div className="flex items-center gap-3 pb-4 border-b border-[#e5e8eb] text-[#4e5968]">
                 <span className="text-[14px] font-bold">by 임장크루</span>
                 <span className="text-[13px] opacity-60">·</span>
                 <span className="text-[13px]">{report.createdAt}</span>
               </div>
               )}

               {/* 매매가 추이 차트 — 산점도(층수별) + 거래량 막대 + 이동평균선 */}
               {transactions.length > 0 && (() => {
                 const rawData = transactions.map((tx) => {
                   let priceEokNum = tx.price / 10000;
                   if (priceEokNum > 100) priceEokNum = tx.price / 100000000;
                   const ym = tx.contractYm;
                   const year = parseInt(ym.slice(0, 4));
                   const month = parseInt(ym.slice(4));
                   const day = parseInt(tx.contractDay) || 15;
                   return {
                     ts: new Date(year, month - 1, day).getTime(),
                     yearMonth: parseInt(ym),
                     price: Math.round(priceEokNum * 1000) / 1000,
                     area: tx.areaPyeong, rawArea: tx.area,
                     floor: tx.floor, priceEok: tx.priceEok, dealType: tx.dealType,
                     fullDate: `${year}.${String(month).padStart(2,'0')}.${String(day).padStart(2,'0')}`,
                   };
                 });

                 const now = new Date();
                 const cutoffMap: Record<string, number> = { '6M': 6, '1Y': 12, '3Y': 36, 'ALL': 9999 };
                 const monthsCut = cutoffMap[chartTimeframe];
                 const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsCut, 1);
                 const cutoffYm = cutoffDate.getFullYear() * 100 + (cutoffDate.getMonth() + 1);
                 const timeFiltered = rawData.filter(d => d.yearMonth >= cutoffYm);

                 // IQR 이상치 필터 (P5~P95)
                 const sortedPrices = [...timeFiltered].sort((a, b) => a.price - b.price);
                 const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.05)]?.price || 0;
                 const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.95)]?.price || 10;
                 const iqr = q3 - q1;
                 const bandLow = q1;
                 const bandHigh = q3;
                 const scatterData = timeFiltered.map(d => ({
                   ...d,
                   isOutlier: d.price < q1 - iqr * 2 || d.price > q3 + iqr * 2,
                 })).filter(d => d.price >= q1 - iqr * 3 && d.price <= q3 + iqr * 3);
                 if (scatterData.length === 0) return null;

                 // 월별 평균 + 거래량
                 const byMonth = new Map<number, number[]>();
                 scatterData.forEach(d => {
                   if (!byMonth.has(d.yearMonth)) byMonth.set(d.yearMonth, []);
                   byMonth.get(d.yearMonth)!.push(d.price);
                 });
                 const monthlyData = Array.from(byMonth.entries())
                   .map(([ym, prices]) => ({
                     ts: new Date(Math.floor(ym / 100), (ym % 100) - 1, 15).getTime(),
                     monthAvg: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 1000) / 1000,
                     volume: prices.length, ym,
                     bandHigh, bandLow,
                     ma3: 0, ma6: 0,
                   }))
                   .sort((a, b) => a.ts - b.ts);

                 // 3개월·6개월 이동평균 계산
                 monthlyData.forEach((d, i) => {
                   const slice3 = monthlyData.slice(Math.max(0, i - 2), i + 1);
                   d.ma3 = Math.round((slice3.reduce((s, x) => s + x.monthAvg, 0) / slice3.length) * 1000) / 1000;
                   const slice6 = monthlyData.slice(Math.max(0, i - 5), i + 1);
                   d.ma6 = Math.round((slice6.reduce((s, x) => s + x.monthAvg, 0) / slice6.length) * 1000) / 1000;
                 });

                 const prices = scatterData.map(d => d.price);
                 let minP = Infinity, maxP = -Infinity, sumP = 0;
                 for (const p of prices) { if (p < minP) minP = p; if (p > maxP) maxP = p; sumP += p; }
                 const domainMin = Math.floor(minP * 10) / 10 - 0.3;
                 const domainMax = Math.ceil(maxP * 10) / 10 + 0.5;
                 const maxVol = Math.max(...monthlyData.map(d => d.volume), 1);
                 const latestAvg = monthlyData[monthlyData.length - 1]?.monthAvg || (prices.length > 0 ? sumP / prices.length : 0);
                 const firstAvg = monthlyData[0]?.monthAvg || latestAvg;
                 const changePercent = firstAvg > 0 ? ((latestAvg - firstAvg) / firstAvg * 100) : 0;

                 // 층수별 색상 — 해당 아파트 최고층 대비 비율로 동적 분류
                 const maxFloor = Math.max(...scatterData.map(d => d.floor), 1);
                 const lowCut = Math.ceil(maxFloor / 3);
                 const midCut = Math.ceil((maxFloor * 2) / 3);
                 const getFloorColor = (floor: number) => {
                   if (floor >= midCut) return '#EF4444'; // 고층 = 빨강
                   if (floor >= lowCut) return '#3182f6'; // 중층 = 파랑
                   return '#03c75a'; // 저층 = 초록
                 };

                 // 상승률 기준점 텍스트
                 const yearAgoYm = (now.getFullYear() - 1) * 100 + (now.getMonth() + 1);
                 const yearAgoEntry = monthlyData.find(d => d.ym >= yearAgoYm);
                 const yoyChange = yearAgoEntry ? ((latestAvg - yearAgoEntry.monthAvg) / yearAgoEntry.monthAvg * 100) : null;

                 return (
                   <div className="mt-4 bg-white rounded-2xl p-5 ring-1 ring-black/5 flex-1">
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="text-[14px] font-extrabold text-[#191f28] flex items-center gap-1.5">
                         <TrendingUp size={15} className="text-[#3182f6]" /> 매매가 추이
                       </h4>
                       <div className="flex items-center gap-1">
                         {(['6M','1Y','3Y','ALL'] as const).map(tf => (
                           <button key={tf} onClick={() => setChartTimeframe(tf)}
                             className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                               chartTimeframe === tf ? 'bg-[#191f28] text-white' : 'text-[#8b95a1] hover:bg-[#f2f4f6]'
                             }`}>{tf}</button>
                         ))}
                       </div>
                     </div>
                     <div className="flex items-baseline gap-3 mb-2">
                       <span className="text-[24px] font-extrabold text-[#191f28]">
                         {latestAvg >= 1 ? `${Math.floor(latestAvg)}억` : ''}{(() => { const rem = Math.round((latestAvg % 1) * 10000); return rem > 0 ? rem.toLocaleString() : ''; })()}
                       </span>
                       {changePercent !== 0 && (
                         <span className={`text-[13px] font-bold px-2 py-0.5 rounded-md ${changePercent > 0 ? 'text-[#EF4444] bg-red-50' : 'text-[#3182f6] bg-blue-50'}`}>
                           {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                         </span>
                       )}
                       <span className="text-[12px] text-[#8b95a1] font-medium">{scatterData.length}건 · 최고 {maxP.toFixed(1)}억 · 최저 {minP.toFixed(1)}억</span>
                     </div>
                     {/* 상승률 기준점 + 범례 */}
                     <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                       {yoyChange !== null && (
                         <span className="text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-1 rounded-lg">
                           전년 대비 {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                         </span>
                       )}
                       <div className="flex items-center gap-3 text-[10px] font-bold text-[#8b95a1]">
                         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#03c75a]"/>저층</span>
                         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3182f6]"/>중층</span>
                         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]"/>고층</span>
                       </div>
                     </div>
                     <div className="h-[320px] relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                           <defs>
                             <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#3182f6" stopOpacity={0.08}/>
                               <stop offset="95%" stopColor="#3182f6" stopOpacity={0.01}/>
                             </linearGradient>
                             <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="0%" stopColor="#e5e8eb" stopOpacity={0.3}/>
                               <stop offset="100%" stopColor="#e5e8eb" stopOpacity={0.05}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" vertical={false} />
                           <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']}
                             tick={{ fill: '#8b95a1', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: '#e5e8eb' }}
                             tickLine={false} tickMargin={6}
                             tickFormatter={(ts: number) => { const d = new Date(ts); return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth()+1).padStart(2,'0')}`; }}
                           />
                           <YAxis yAxisId="price" orientation="left" domain={[Math.max(0, domainMin), domainMax]}
                             tick={{ fill: '#8b95a1', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false}
                             width={48} dx={-3}
                             tickFormatter={(v: number) => v >= 1 ? `${v.toFixed(1)}억` : `${Math.round(v * 10000)}만`}
                           />
                           <YAxis yAxisId="volume" orientation="right" domain={[0, maxVol * 4]}
                             tick={false} axisLine={false} tickLine={false} width={0}
                           />
                           <RechartsTooltip
                             content={({ active, payload }) => {
                               if (!active || !payload?.length) return null;
                               const item = payload[0]?.payload;
                               const avg = item?.monthAvg;
                               const vol = item?.volume;
                               const ma3 = item?.ma3;
                               return (
                                 <div style={{ background: '#1e293b', borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: 'none' }}>
                                   <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>
                                     {new Date(item?.ts).getFullYear()}.{String(new Date(item?.ts).getMonth()+1).padStart(2,'0')}월
                                   </div>
                                   {avg && <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>평균 {avg.toFixed(2)}억</div>}
                                   {ma3 && <div style={{ color: '#f59e0b', fontSize: 11, marginTop: 2 }}>3M이평 {ma3.toFixed(2)}억</div>}
                                   {vol != null && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>거래 {vol}건</div>}
                                 </div>
                               );
                             }}
                             cursor={{ stroke: '#d1d6db', strokeWidth: 1, strokeDasharray: '3 3' }}
                           />
                           {/* 가격 밴드 (P5~P95) */}
                           <Area type="monotone" dataKey="bandHigh" yAxisId="price" stroke="none" fill="url(#bandGrad)" fillOpacity={1} dot={false} activeDot={false} />
                           {/* 거래량 막대그래프 */}
                           <Bar dataKey="volume" yAxisId="volume" fill="#e5e8eb" radius={[2, 2, 0, 0]} maxBarSize={12} opacity={0.6} />
                           {/* 월별 평균선 */}
                           <Area type="monotone" dataKey="monthAvg" yAxisId="price"
                             stroke="#3182f6" strokeWidth={2.5} fill="url(#avgGrad)"
                             dot={false} activeDot={false} connectNulls
                           />
                           {/* 3개월 이동평균 */}
                           <Line type="monotone" dataKey="ma3" yAxisId="price" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={false} connectNulls />
                           {/* 6개월 이동평균 */}
                           <Line type="monotone" dataKey="ma6" yAxisId="price" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="6 3" dot={false} activeDot={false} connectNulls />
                           {/* 산점도 — 층수별 색상 */}
                           <Customized
                             component={(rechartProps: any) => {
                               const { xAxisMap, yAxisMap } = rechartProps;
                               if (!xAxisMap || !yAxisMap) return null;
                               const xAx = Object.values(xAxisMap)[0] as any;
                               const yAx = Object.values(yAxisMap)[0] as any;
                               if (!xAx?.scale || !yAx?.scale) return null;
                               return (
                                 <g>
                                   {scatterData.map((d, i) => {
                                     const cx = xAx.scale(d.ts);
                                     const cy = yAx.scale(d.price);
                                     if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
                                     const isHov = hoveredDot?.data === d;
                                     const floorColor = getFloorColor(d.floor);
                                     return (
                                       <circle key={i} cx={cx} cy={cy}
                                         r={isHov ? 5 : 3} fill={floorColor}
                                         opacity={d.isOutlier ? 0.1 : (isHov ? 1 : 0.35)}
                                         stroke={isHov ? '#fbbf24' : 'none'}
                                         strokeWidth={isHov ? 2 : 0}
                                         style={{ cursor: 'pointer', transition: 'r 0.15s, opacity 0.15s' }}
                                         onMouseEnter={() => setHoveredDot({ x: cx, y: cy, data: d })}
                                         onMouseLeave={() => setHoveredDot(null)}
                                       />
                                     );
                                   })}
                                 </g>
                               );
                             }}
                           />
                           <Legend wrapperStyle={{ display: 'none' }} />
                         </ComposedChart>
                       </ResponsiveContainer>
                       {hoveredDot && (() => {
                         const d = hoveredDot.data;
                         const aptKey = normalizeAptName(report.apartmentName);
                         const typeName = typeMap[aptKey]?.[String(d.rawArea)];
                         return (
                           <div style={{
                             position: 'absolute', left: hoveredDot.x + 48, top: hoveredDot.y + 10,
                             transform: 'translate(-50%, -100%) translateY(-12px)',
                             background: '#1e293b', borderRadius: 10, padding: '10px 14px',
                             boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                             pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap',
                           }}>
                             <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>{d.fullDate}</div>
                             <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 3 }}>
                               {d.priceEok || `${d.price.toFixed(2)}억`}
                             </div>
                             <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
                               {typeName ? <span style={{ color: '#93c5fd', fontWeight: 600 }}>{typeName}</span> : <span>{d.area}평</span>}
                               <span>·</span><span style={{ color: getFloorColor(d.floor) }}>{d.floor}층</span>
                               {d.dealType && <><span>·</span><span>{d.dealType}</span></>}
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                     {/* 이동평균 범례 */}
                     <div className="flex items-center gap-4 mt-2 px-1 text-[10px] font-bold text-[#8b95a1]">
                       <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#3182f6] rounded"/>월평균</span>
                       <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#f59e0b] rounded" style={{borderTop:'1px dashed #f59e0b'}}/>3M이평</span>
                       <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#8b5cf6] rounded" style={{borderTop:'1px dashed #8b5cf6'}}/>6M이평</span>
                       <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#e5e8eb] rounded-sm"/>거래량</span>
                     </div>
                   </div>
                 );
               })()}
            </div>

          </div>

          {/* Sticky Section Nav — stub이면 숨김 */}
          {!isStub && (
          <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] px-4 py-2.5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[1000px] mx-auto">
              {['사진', '명세', '인프라', '생태', '결론', '댓글'].map((label, idx) => {
                const ids = ['sec-photos', 'sec-specs', 'sec-infra', 'sec-eco', 'sec-conclusion', 'sec-comments'];
                return (
                  <button
                    key={ids[idx]}
                    onClick={() => scrollToSection(ids[idx])}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg border border-[#e5e8eb] bg-[#f9fafb] text-[12px] font-bold text-[#4e5968] hover:bg-[#191f28] hover:text-white hover:border-[#191f28] active:scale-95 transition-all duration-150"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>
          )}

          {/* Magazine Content Wrapper — stub이면 숨김 */}
          {!isStub && (
          <div className="px-2 py-6 md:px-3 md:py-8 flex flex-col gap-8 w-full">



            {/* ── PAYWALL GATE ── Premium content below this line */}
            {!isUnlocked && (
              <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-sm text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#3182f6]/10 to-[#4A6CF7]/20 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3182f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3 className="text-[20px] font-extrabold text-[#191f28] mb-2">프리미엄 리포트</h3>
                <p className="text-[14px] text-[#4e5968] mb-1">밸류에이션 분석, 상세 인프라 데이터, 현장 사진 갤러리,</p>
                <p className="text-[14px] text-[#4e5968] mb-6">단지 명세, 종합 평가를 확인하세요</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {['밸류에이션', '사진 갤러리', '상세 인프라', '단지 명세', '종합 결론'].map(tag => (
                    <span key={tag} className="bg-[#e8f3ff] text-[#3182f6] text-[12px] font-bold px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>

                {user ? (
                  <PaymentButton
                    reportId={report.id}
                    reportName={report.apartmentName}
                    userId={user.uid}
                    userEmail={user.email || undefined}
                    onPaymentComplete={onPurchaseComplete || (() => {})}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-[13px] text-[#8b95a1]">결제하려면 먼저 로그인해주세요</p>
                    <button
                      onClick={() => signInWithPopup(auth, googleProvider)}
                      className="bg-[#191f28] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#333d4b] transition-colors flex items-center gap-2"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google로 로그인
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 0. Premium Score Analysis — Gated behind paywall */}
            {isUnlocked && (
            <>
            {isLoadingDetail ? (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm animate-pulse">
                <div className="h-6 bg-[#e5e8eb] rounded-lg w-48 mb-6" />
                <div className="space-y-3">
                  <div className="h-4 bg-[#f2f4f6] rounded w-full" />
                  <div className="h-4 bg-[#f2f4f6] rounded w-5/6" />
                  <div className="h-4 bg-[#f2f4f6] rounded w-4/6" />
                  <div className="h-32 bg-[#f2f4f6] rounded-2xl mt-4" />
                  <div className="h-32 bg-[#f2f4f6] rounded-2xl" />
                </div>
              </div>
            ) : (
            <>
            {report.premiumScores && (
              <div id="sec-premium" className="mb-2 scroll-mt-14">
              </div>
            )}

            {/* 밸류에이션 폭포수 차트 — 무료 티어 개방 */}
            {report.premiumScores && transactions.length > 0 && (() => {
              // 84㎡ 기준 가격 산출
              const tx84 = transactions.find(t => t.area >= 80 && t.area <= 88) || transactions[0];
              const price84 = tx84 ? normalize84Price(tx84.price, tx84.area) : 0;
              return price84 > 0 ? (
                <div className="mb-2">
                  <ValuationWaterfall scores={report.premiumScores} price84Man={price84} />
                </div>
              ) : null;
            })()}

            {/* 동적 시뮬레이터 — 유료 페이월 */}
            {isUnlocked && report.premiumScores && transactions.length > 0 && (() => {
              const tx84 = transactions.find(t => t.area >= 80 && t.area <= 88) || transactions[0];
              const price84 = tx84 ? normalize84Price(tx84.price, tx84.area) : 0;
              return price84 > 0 ? (
                <div className="mb-2">
                  <DynamicSimulator scores={report.premiumScores} price84Man={price84} />
                </div>
              ) : null;
            })()}

            {/* Location Infrastructure Info — Enhanced with categories + raw data */}
            {report.metrics && (report.metrics.distanceToElementary || report.metrics.distanceToSubway || report.metrics.academyDensity) && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3">
                  <MapPin size={18} className="text-[#3182f6]"/> 학군·교통·생활 인프라
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.metrics.distanceToElementary > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#8b95a1] mb-1">초등학교</div>
                      <div className="text-[22px] font-extrabold text-[#191f28]">{report.metrics.distanceToElementary}<span className="text-[13px] text-[#8b95a1] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.elementary && (
                        <div className="text-[10px] text-[#4e5968] mt-1 truncate">{report.metrics.nearestSchoolNames.elementary}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToMiddle > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#8b95a1] mb-1">중학교</div>
                      <div className="text-[22px] font-extrabold text-[#191f28]">{report.metrics.distanceToMiddle}<span className="text-[13px] text-[#8b95a1] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.middle && (
                        <div className="text-[10px] text-[#4e5968] mt-1 truncate">{report.metrics.nearestSchoolNames.middle}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToHigh > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#8b95a1] mb-1">고등학교</div>
                      <div className="text-[22px] font-extrabold text-[#191f28]">{report.metrics.distanceToHigh}<span className="text-[13px] text-[#8b95a1] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.high && (
                        <div className="text-[10px] text-[#4e5968] mt-1 truncate">{report.metrics.nearestSchoolNames.high}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToSubway > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#3182f6] mb-1">GTX-A/SRT</div>
                      <div className="text-[22px] font-extrabold text-[#3182f6]">{report.metrics.distanceToSubway}<span className="text-[13px] text-[#3182f6]/70 ml-0.5">m</span></div>
                      {report.metrics.nearestStationName && (
                        <div className="text-[10px] text-[#3182f6]/80 mt-1 truncate">{report.metrics.nearestStationName}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToIndeokwon != null && report.metrics.distanceToIndeokwon > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#3182f6] mb-1">인덕원선</div>
                      <div className="text-[22px] font-extrabold text-[#3182f6]">{report.metrics.distanceToIndeokwon}<span className="text-[13px] text-[#3182f6]/70 ml-0.5">m</span></div>
                    </div>
                  )}
                  {report.metrics.distanceToTram != null && report.metrics.distanceToTram > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#3182f6] mb-1">동탄트램</div>
                      <div className="text-[22px] font-extrabold text-[#3182f6]">{report.metrics.distanceToTram}<span className="text-[13px] text-[#3182f6]/70 ml-0.5">m</span></div>
                    </div>
                  )}
                  {/* Academy Density with Category Breakdown */}
                  {report.metrics.academyDensity > 0 && (
                    <div className="bg-[#f0fdf4] rounded-2xl p-4 text-center col-span-1">
                      <div className="text-[13px] font-bold text-[#03c75a] mb-1">학원 (1km)</div>
                      <div className="text-[22px] font-extrabold text-[#03c75a]">{report.metrics.academyDensity}<span className="text-[13px] text-[#03c75a]/70 ml-0.5">개</span></div>
                      {report.metrics.academyCategories && Object.keys(report.metrics.academyCategories).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#bbf7d0]">
                          {Object.entries(report.metrics.academyCategories)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([cat, cnt]) => (
                              <div key={cat} className="flex justify-between text-[10px] px-1 py-0.5">
                                <span className="text-[#4e5968] truncate mr-1">{cat}</span>
                                <span className="font-bold text-[#03c75a] shrink-0">{cnt as number}개</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Restaurant/Cafe Density with Category Breakdown */}
                  {report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0 && (
                    <div className="bg-[#fffbeb] rounded-2xl p-4 text-center col-span-1">
                      <div className="text-[11px] font-bold text-[#f59e0b] mb-1">🍽️ 음식점·카페 (1km)</div>
                      <div className="text-[22px] font-extrabold text-[#f59e0b]">{report.metrics.restaurantDensity}<span className="text-[13px] text-[#f59e0b]/70 ml-0.5">개</span></div>
                      {report.metrics.restaurantCategories && Object.keys(report.metrics.restaurantCategories).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#fde68a]">
                          {Object.entries(report.metrics.restaurantCategories)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([cat, cnt]) => (
                              <div key={cat} className="flex justify-between text-[10px] px-1 py-0.5">
                                <span className="text-[#4e5968] truncate mr-1">{cat}</span>
                                <span className="font-bold text-[#f59e0b] shrink-0">{cnt as number}개</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Raw Data Panel — Collapsible */}
                {report.metrics && (
                  <details className="mt-5 group">
                    <summary className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#8b95a1] hover:text-[#3182f6] transition-colors select-none py-2">
                      <span className="w-5 h-5 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[10px] group-open:rotate-90 transition-transform">▶</span>
                      📊 상세 로우 데이터 보기
                    </summary>
                    <div className="mt-3 bg-[#f9fafb] rounded-2xl p-5 border border-[#e5e8eb] animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-4">
                        {/* 교육 */}
                        <div>
                          <h4 className="text-[12px] font-bold text-[#8b95a1] mb-2 flex items-center gap-1.5">🏫 교육</h4>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">초등학교 거리</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.distanceToElementary || '-'}m {report.metrics.nearestSchoolNames?.elementary ? `(${report.metrics.nearestSchoolNames.elementary})` : ''}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">중학교 거리</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.distanceToMiddle || '-'}m {report.metrics.nearestSchoolNames?.middle ? `(${report.metrics.nearestSchoolNames.middle})` : ''}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">고등학교 거리</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.distanceToHigh || '-'}m {report.metrics.nearestSchoolNames?.high ? `(${report.metrics.nearestSchoolNames.high})` : ''}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">학원 밀집도 (1km)</span>
                              <span className="font-bold text-[#03c75a]">{report.metrics.academyDensity || '-'}개</span>
                            </div>
                          </div>
                        </div>
                        {/* 교통 */}
                        <div>
                          <h4 className="text-[12px] font-bold text-[#8b95a1] mb-2 flex items-center gap-1.5">🚇 교통</h4>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">GTX-A/SRT역</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.distanceToSubway || '-'}m {report.metrics.nearestStationName ? `(${report.metrics.nearestStationName})` : ''}</span>
                            </div>
                            {report.metrics.distanceToIndeokwon != null && (
                              <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                                <span className="text-[#4e5968]">인덕원선</span>
                                <span className="font-bold text-[#191f28]">{report.metrics.distanceToIndeokwon}m</span>
                              </div>
                            )}
                            {report.metrics.distanceToTram != null && (
                              <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                                <span className="text-[#4e5968]">동탄트램</span>
                                <span className="font-bold text-[#191f28]">{report.metrics.distanceToTram}m</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* 단지 정보 */}
                        <div>
                          <h4 className="text-[12px] font-bold text-[#8b95a1] mb-2 flex items-center gap-1.5">🏢 단지 정보</h4>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">시공사</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.brand || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">세대수</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.householdCount?.toLocaleString() || '-'}세대</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">준공연도</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.yearBuilt || '-'}년</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">용적률</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.far || '-'}%</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">건폐율</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.bcr || '-'}%</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                              <span className="text-[#4e5968]">세대당 주차</span>
                              <span className="font-bold text-[#191f28]">{report.metrics.parkingPerHousehold || '-'}대</span>
                            </div>
                          </div>
                        </div>
                        {/* 생활 인프라 */}
                        {report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0 && (
                          <div>
                            <h4 className="text-[12px] font-bold text-[#8b95a1] mb-2 flex items-center gap-1.5">🍽️ 생활 인프라</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                              <div className="flex justify-between py-1.5 border-b border-[#f2f4f6]">
                                <span className="text-[#4e5968]">음식점·카페 (1km)</span>
                                <span className="font-bold text-[#f59e0b]">{report.metrics.restaurantDensity}개</span>
                              </div>
                            </div>
                            {report.metrics.restaurantCategories && (
                              <div className="mt-2 grid grid-cols-3 gap-1.5">
                                {Object.entries(report.metrics.restaurantCategories)
                                  .sort(([,a], [,b]) => (b as number) - (a as number))
                                  .map(([cat, cnt]) => (
                                    <div key={cat} className="bg-white rounded-lg py-1.5 px-2 text-[11px] border border-[#e5e8eb] flex justify-between">
                                      <span className="text-[#4e5968] truncate">{cat}</span>
                                      <span className="font-bold text-[#f59e0b] ml-1 shrink-0">{cnt as number}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
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
                      현장 사진 갤러리
                      <span className="text-[13px] font-medium text-[#8b95a1] ml-auto">{report.images.length}장</span>
                    </summary>

                    {/* Category Filter Chips */}
                    <GalleryGrid images={report.images} tags={allTags} tagLabels={IMAGE_TAG_LABELS} onImageClick={setFullscreenImage} />
                  </details>
                </div>
              );
            })()}

            {!s ? (
              // Legacy Template Render (Fallback if both schemas are empty)
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                 <h2 className="text-[20px] font-bold text-[#191f28] mb-6 border-b border-[#e5e8eb] pb-3">단지 요약 정보</h2>
                 <div className="flex flex-col gap-4">
                   {(report.pros || report.premiumContent) ? (
                     <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#bbf7d0]">
                       <h3 className="text-[15px] font-extrabold text-[#03c75a] mb-2 flex items-center gap-1.5"><CheckCircle2 size={18}/> 주요 내용 및 총평</h3>
                       <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{report.premiumContent || report.pros}</p>
                     </div>
                   ) : (
                     <p className="text-[#8b95a1] text-[15px]">데이터가 준비되지 않았습니다.</p>
                   )}
                 </div>
              </div>
            ) : (
              // Advanced Template Render (요약은 위로 이동됨)
              <>

                {/* 2. 단지 기본 명세 (Specs) */}
                <div id="sec-specs" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Building size={20} className="text-[#3182f6]"/> 단지 기본 명세</h2>
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
            </>)}
            <div id="sec-comments" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
              <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3">
                <MessageSquare size={20} className="text-[#3182f6]"/> 
                이웃들의 이야기 <span className="text-[#3182f6] text-[16px] ml-1">{comments.length}</span>
              </h2>
              
              <div className="flex flex-col gap-6">
                {/* Input Area */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder={user ? "임장기에 대한 생각이나 궁금한 점을 남겨주세요." : "로그인 후 댓글을 남길 수 있습니다."}
                    disabled={!user}
                    className="flex-1 border border-[#e5e8eb] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3182f6]/20 focus:border-[#3182f6] disabled:bg-[#f2f4f6]"
                    value={commentInput}
                    onChange={(e) => onCommentChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSubmitComment();
                    }}
                  />
                  <button 
                    onClick={onSubmitComment}
                    disabled={!user || !commentInput.trim()}
                    className="bg-[#3182f6] text-white px-5 rounded-xl font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    등록
                  </button>
                </div>

                {/* Comment List */}
                <div className="flex flex-col gap-4 mt-2">
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-3 bg-[#f9fafb] p-4 rounded-2xl border border-[#e5e8eb]">
                        <div className="w-8 h-8 rounded-full bg-white border border-[#e5e8eb] shadow-sm flex items-center justify-center shrink-0">
                           <UserCircle size={16} className="text-[#8b95a1]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-[14px] text-[#191f28]">{comment.author}</span>
                            <span className="text-[12px] text-[#8b95a1]">{comment.createdAt}</span>
                          </div>
                          <p className="text-[14px] text-[#4e5968] leading-relaxed break-all whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-[#8b95a1] text-[14px]">
                      아직 작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
            )}

          </div>
          )}
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

export default function Dashboard() {
  const router = useRouter();
  const { kpis, newsFeed, fieldReports, userReviews, dongtanApartments, adBanner } = useDashboardData();
  const [selectedReport, setSelectedReport] = useState<FieldReportData | null>(null);
  const [fullReportData, setFullReportData] = useState<FieldReportData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  // Comments State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<string, CommentData[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  // Tab state
  const [activeTab, setActiveTab] = useState<'imjang' | 'lounge' | 'recommend'>('imjang');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Lounge compose & verify state
  const [showCompose, setShowCompose] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('자유');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyDong, setVerifyDong] = useState('');
  const [verifyApt, setVerifyApt] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Dong filter state
  const [selectedDong, setSelectedDong] = useState<string | null>(null);

  // Apartment data — static import, no API call needed
  const sheetApartments = APARTMENTS_BY_DONG;

  // Transaction data — static import, no API call needed
  const [typeMap, setTypeMap] = useState<Record<string, Record<string, string>>>({});

  // Name mapping — Firestore에서 관리자 수동 매핑 로드
  const [nameMapping, setNameMapping] = useState<Record<string, string> | undefined>(undefined);
  useEffect(() => {
    getDoc(doc(db, 'settings/nameMapping')).then(snap => {
      if (snap.exists()) setNameMapping(snap.data() as Record<string, string>);
      else setNameMapping({});
    }).catch(() => setNameMapping({}));
  }, []);

  // Auth & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [anonProfile, setAnonProfile] = useState<{nickname: string; frontName?: string; photoURL?: string} | null>(null);
  const [purchasedReportIds, setPurchasedReportIds] = useState<string[]>([]);

  // (Optional) Image State - For when storage is unpaused
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await dashboardFacade.getUserProfile(currentUser.uid);
        setAnonProfile(profile);
        const up = await UserRepo.getOrCreateProfile(currentUser.uid);
        setUserProfile(up);
        // Load purchased report IDs for paywall
        const purchased = await PurchaseRepo.getUserPurchasedReportIds(currentUser.uid);
        setPurchasedReportIds(purchased);
      } else {
        setAnonProfile(null);
        setUserProfile(null);
        setPurchasedReportIds([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch type map data only (lightweight)
  useEffect(() => {
    fetch('/api/type-map').then(r => r.json()).then(tmData => {
      if (tmData.entries) {
        const map: Record<string, Record<string, string>> = {};
        for (const e of tmData.entries) {
          const key = normalizeAptName(e.aptName);
          if (!map[key]) map[key] = {};
          map[key][e.area] = e.typeName;
        }
        setTypeMap(map);
      }
    }).catch(err => console.warn('타입맵 로딩 실패:', err));
  }, []);

  // Fetch transactions from per-apartment JSON chunks (not 16MB import)
  const [modalTransactions, setModalTransactions] = useState<TransactionRecord[]>([]);
  const [isTxLoading, setIsTxLoading] = useState(false);

  // 가격 포맷팅 (JSON에서 priceEok 제거했으므로 런타임 계산)
  const formatPriceEok = (priceMan: number) => {
    const eok = Math.floor(priceMan / 10000);
    const remainder = priceMan % 10000;
    if (eok === 0) return `${priceMan.toLocaleString()}만`;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억${remainder.toLocaleString()}`;
  };

  useEffect(() => {
    if (!selectedReport) { setModalTransactions([]); return; }
    setIsTxLoading(true);

    // findTxKey로 JSON 파일명 결정 (접두사 자동 strip)
    const txKey = findTxKey(selectedReport.apartmentName, TX_SUMMARY, nameMapping);
    const fileKey = txKey || normalizeAptName(selectedReport.apartmentName);

    fetch(`/tx-data/${encodeURIComponent(fileKey)}.json`)
      .then(res => res.ok ? res.json() : [])
      .then((records: { contractYm: string; contractDay: string; price: number; area: number; areaPyeong: number; floor: number }[]) => {
        const mapped: TransactionRecord[] = records.map((r, i) => ({
          no: i + 1,
          sigungu: '', dong: '', aptName: fileKey,
          area: r.area, areaPyeong: r.areaPyeong,
          contractYm: r.contractYm, contractDay: r.contractDay,
          price: r.price, priceEok: formatPriceEok(r.price),
          floor: r.floor, buyer: '', seller: '',
          buildYear: 0, roadName: '', cancelDate: '-',
          dealType: '', agentLocation: '',
          registrationDate: '-', housingType: '',
        }));
        setModalTransactions(mapped);
      })
      .catch(err => console.warn('거래내역 로딩 실패:', err))
      .finally(() => setIsTxLoading(false));
  }, [selectedReport]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSubmitComment = async (reportId: string) => {
    if (!user) { alert("로그인 후 댓글을 남길 수 있습니다."); handleLogin(); return; }
    const text = commentInput[reportId];
    if (!text?.trim()) return;

    await dashboardFacade.addFieldReportComment(reportId, text, user.uid);
    setCommentInput(prev => ({ ...prev, [reportId]: '' }));
  };

  // Fetch full report detail data when modal opens (lazy loading)
  // stub 리포트 (id가 'stub-'로 시작)는 Firestore 조회 스킵
  const isStubReport = selectedReport?.id?.startsWith('stub-') ?? false;
  useEffect(() => {
    if (selectedReport && !isStubReport) {
      setIsLoadingDetail(true);
      setFullReportData(null);
      dashboardFacade.getFullReport(selectedReport.id).then((data) => {
        setFullReportData(data);
        setIsLoadingDetail(false);
      }).catch(() => {
        setIsLoadingDetail(false);
      });
    } else {
      setFullReportData(null);
      setIsLoadingDetail(false);
    }
  }, [selectedReport]);

  // Fetch comments automatically when a report modal is opened (stub은 스킵)
  useEffect(() => {
    if (selectedReport && !isStubReport && !commentsData[selectedReport.id]) {
      const unsubscribe = dashboardFacade.listenToComments(selectedReport.id, (comments) => {
        setCommentsData(prev => ({ ...prev, [selectedReport.id]: comments }));
      });
      return () => unsubscribe();
    }
  }, [selectedReport]);

  // Count apartments per dong (from Google Sheet)
  const dongAptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(sheetApartments).forEach(([dong, apts]) => { counts[dong] = apts.length; });
    return counts;
  }, [sheetApartments]);

  // Count field reports by dong (for dong filter chip counts)
  const dongReportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    getAllDongNames().forEach(d => { counts[d] = 0; });
    fieldReports?.forEach(report => {
      if (report.dong) counts[report.dong] = (counts[report.dong] || 0) + 1;
    });
    return counts;
  }, [fieldReports]);


  // Filtered reports based on dong selection
  const filteredReports = useMemo(() => {
    if (!fieldReports) return [];
    if (selectedDong) {
      return fieldReports.filter(r => r.dong === selectedDong);
    }
    return [...fieldReports];
  }, [fieldReports, selectedDong]);

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans selection:bg-[#3182f6]/20">
      
      {/* Top Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#e5e8eb] sticky top-0 z-40 transition-all duration-300">
        <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16 h-14 sm:h-16 flex justify-between items-center">
          {/* Left: Pill Tabs + Branding */}
          <div className="flex items-center gap-3">
            <div className="inline-flex bg-[#f2f4f6] rounded-full p-1 gap-0.5">
              {[
                { id: 'imjang' as const, label: '임장기', icon: Compass },
                { id: 'lounge' as const, label: '라운지', icon: MessageSquare },
                { id: 'recommend' as const, label: '집 추천', icon: Home },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-[#191f28] shadow-sm'
                      : 'text-[#8b95a1] hover:text-[#4e5968]'
                  }`}
                >
                  <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <span className="text-[17px] text-[#8b95a1] font-medium hidden sm:inline">by <span className="font-extrabold text-[#191f28]">임장크루</span></span>
          </div>
          {/* User bar is now handled by FloatingUserBar in layout.tsx */}
          </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16 py-5 sm:py-8 md:py-12 animate-in fade-in duration-500">

        {/* ═══ TAB 1: 임장기 ═══ */}
        {mounted && activeTab === 'imjang' && (
        <section>
          {/* 1. Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <h2 className="text-[22px] sm:text-[28px] md:text-[36px] font-extrabold text-[#191f28] tracking-tight">
                동탄 아파트 탐색
              </h2>
              <span suppressHydrationWarning className="inline-flex items-center gap-1.5 bg-[#e8f3ff] text-[#3182f6] text-[12px] sm:text-[13px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
                <Building size={13} />
                {Object.values(sheetApartments).flat().length}개 단지
              </span>
              {fieldReports.length > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-[#fff8e1] text-[#f59e0b] text-[12px] sm:text-[13px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
                  <FileText size={13} />
                  {fieldReports.length}개 리포트
                </span>
              )}
            </div>
            <p className="text-[13px] sm:text-[15px] text-[#8b95a1] font-medium">
              11개 법정동 · 아파트별 인프라·실거래가·임장 리포트를 한눈에
            </p>
          </div>

          {/* ── Dong Filter Chips ── */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                suppressHydrationWarning
                onClick={() => setSelectedDong(null)}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                  !selectedDong
                    ? 'bg-[#191f28] text-white shadow-md'
                    : 'bg-[#f2f4f6] text-[#8b95a1] hover:bg-[#e5e8eb]'
                }`}
              >
                전체 ({Object.values(sheetApartments).flat().length})
              </button>
              {DONGS.map(dong => {
                const aptCount = dongAptCounts[dong.name] || 0;
                const reportCount = dongReportCounts[dong.name] || 0;
                const isActive = selectedDong === dong.name;
                if (aptCount === 0) return null; // 아파트 없으면 숨김
                return (
                  <button
                    suppressHydrationWarning
                    key={dong.id}
                    onClick={() => setSelectedDong(isActive ? null : dong.name)}
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

          {/* ── 아파트 카드 그리드 ── */}
          {(() => {
            // 선택된 동 또는 전체 아파트 리스트
            const dongList = selectedDong 
              ? [selectedDong] 
              : DONGS.map(d => d.name).filter(d => sheetApartments[d]?.length > 0);

            return (
              <div className="space-y-10">
                {dongList.map(dongName => {
                  const apts = sheetApartments[dongName] || [];
                  if (apts.length === 0) return null;
                  const dongInfo = getDongByName(dongName);

                  return (
                    <div key={dongName}>
                      {/* 동 섹션 헤더 (전체 보기일 때만) */}
                      {!selectedDong && (
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-[18px] font-extrabold text-[#191f28]">{dongName}</h3>
                          <span className="text-[12px] text-[#8b95a1] font-bold bg-[#f2f4f6] px-2 py-0.5 rounded-full">{apts.length}개</span>
                          <button 
                            onClick={() => setSelectedDong(dongName)}
                            className="ml-auto text-[12px] font-bold text-[#3182f6] hover:underline"
                          >
                            전체보기 →
                          </button>
                        </div>
                      )}

                      {/* 아파트 카드 그리드 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(() => {
                          const sorted = [...apts].sort((a, b) => {
                            const aHas = fieldReports.some(r => isSameApartment(r.apartmentName, a.name)) ? 0 : 1;
                            const bHas = fieldReports.some(r => isSameApartment(r.apartmentName, b.name)) ? 0 : 1;
                            return aHas - bHas;
                          });
                          return (selectedDong ? sorted : sorted.slice(0, 6)).map(apt => {
                          const txKey = findTxKey(apt.name, TX_SUMMARY, nameMapping);
                          const txSummary = txKey ? TX_SUMMARY[txKey] : undefined;
                          const report = fieldReports.find(r => isSameApartment(r.apartmentName, apt.name));

                          return (
                            <div
                              key={apt.name}
                              onClick={() => {
                                if (report) {
                                  setSelectedReport(report);
                                } else {
                                  // 임장기 없는 아파트: 실거래가/차트만 보여주는 스텁 리포트 생성
                                  setSelectedReport({
                                    id: `stub-${normalizeAptName(apt.name)}`,
                                    apartmentName: apt.name,
                                    dong: apt.dong,
                                    author: '',
                                    likes: 0,
                                    commentCount: 0,
                                    createdAt: null,
                                  });
                                }
                              }}
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
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <span className="text-[10px] font-bold bg-[#e8f3ff] text-[#3182f6] px-2 py-0.5 rounded-md">📝 리포트</span>
                                    <span className="text-[10px] font-bold bg-[#f0fdf4] text-[#03c75a] px-2 py-0.5 rounded-md">✅ 현장검증</span>
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
                        });
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── 동탄 커뮤니티 ── */}
          <div className="mt-8 sm:mt-12">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-5 sm:mb-6">
              <div>
                <h2 className="text-[22px] sm:text-[28px] font-extrabold tracking-tight text-[#191f28] mb-0.5 sm:mb-1">동탄 커뮤니티</h2>
                <p className="text-[13px] sm:text-[15px] text-[#8b95a1] font-medium">주민들의 이야기 · 리뷰 · 소식</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => user ? setShowReviewModal(true) : alert('로그인 후 리뷰를 작성할 수 있습니다.')}
                  className="px-3 py-2 bg-[#f2f4f6] text-[#4e5968] rounded-xl text-[12px] font-bold flex items-center gap-1.5 hover:bg-[#e5e8eb] active:scale-[0.97] transition-all"
                >
                  <Star size={13} />
                  리뷰
                </button>
                <button
                  onClick={() => user ? setShowCompose(true) : alert('로그인 후 글을 작성할 수 있습니다.')}
                  className="px-3 py-2 bg-[#191f28] text-white rounded-xl text-[12px] font-bold flex items-center gap-1.5 hover:bg-[#333d4b] active:scale-[0.97] transition-all"
                >
                  <PenLine size={13} />
                  글쓰기
                </button>
              </div>
            </div>

            {/* Profile & Verification Bar */}
            {user && userProfile && (
              <div className="bg-white rounded-2xl border border-[#e5e8eb] p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#191f28]">{getDisplayName(userProfile)}</span>
                  {userProfile.verifiedApartment && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e8f3ff] text-[#3182f6] px-2 py-0.5 rounded-md">
                      <ShieldCheck size={11} /> {userProfile.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowVerify(true)}
                  className="text-[12px] font-bold text-[#3182f6] bg-[#e8f3ff] px-3 py-1.5 rounded-lg hover:bg-[#d4e9ff] transition-colors flex items-center gap-1"
                >
                  <Building2 size={13} />
                  {userProfile?.verifiedApartment ? '변경' : '아파트 인증'}
                </button>
              </div>
            )}

            {/* 라운지 글 (최신 3개) */}
            {newsFeed.length > 0 && (
              <div className="flex flex-col gap-3 mb-6">
                {newsFeed.slice(0, 3).map(news => (
                  <div key={news.id} onClick={() => router.push(`/lounge/${news.id}`)} className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-[16px] font-bold text-[#191f28] leading-snug flex-1">{news.title}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#8b95a1]">{news.author} · {news.meta}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[12px] text-[#8b95a1]"><Heart size={12} /> {news.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {newsFeed.length > 3 && (
                  <button
                    onClick={() => setActiveTab('lounge')}
                    className="text-[13px] font-bold text-[#3182f6] hover:underline text-center py-2"
                  >
                    라운지에서 {newsFeed.length - 3}개 더 보기 →
                  </button>
                )}
              </div>
            )}

            {/* 아파트 리뷰 */}
            {userReviews.length > 0 ? (
              <div className="flex flex-col gap-3">
                {userReviews.map(review => (
                  <div key={review.id} className="bg-white rounded-2xl border border-[#e5e8eb] p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-bold text-[#191f28] shrink-0">{review.author}</span>
                        {review.verifiedApartment && review.verificationLevel === 'registry_verified' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e8f3ff] text-[#3182f6] px-2 py-0.5 rounded-md shrink-0">
                            <ShieldCheck size={11} /> {review.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                          </span>
                        ) : review.verifiedApartment ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-md shrink-0">
                            <Shield size={11} /> {review.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-[#8b95a1] shrink-0 ml-2">{review.createdAt}</span>
                    </div>
                    <h4 className="text-[15px] font-extrabold text-[#191f28] mb-2 truncate">{review.apartmentName}</h4>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#e5e8eb]'} />
                      ))}
                      <span className="text-[12px] font-bold text-[#8b95a1] ml-1">{review.rating}.0</span>
                    </div>
                    <p className="text-[14px] text-[#4e5968] leading-relaxed mb-3">{review.content}</p>
                    {review.photoURL && (
                      <div className="w-full h-48 rounded-xl overflow-hidden mb-3">
                        <img src={review.photoURL} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => dashboardFacade.incrementReviewLike(review.id)}
                        className="flex items-center gap-1 text-[12px] font-bold text-[#8b95a1] hover:text-[#f04452] transition-colors"
                      >
                        <Heart size={14} /> {review.likes || 0}
                      </button>
                      {(user?.uid === review.authorUid || dashboardFacade.isAdmin(user?.email)) && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
                            try { await dashboardFacade.deleteReview(review.id); } catch { alert('삭제에 실패했습니다.'); }
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#8b95a1] hover:text-[#f04452] transition-colors"
                        >
                          <Trash2 size={13} /> 삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : newsFeed.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#e5e8eb] p-12 text-center">
                <MessageSquare size={40} className="mx-auto mb-4 text-[#d1d6db]" />
                <p className="text-[15px] font-bold text-[#4e5968] mb-2">아직 소식이 없습니다</p>
                <p className="text-[13px] text-[#8b95a1] mb-4">첫 번째 글이나 리뷰를 남겨보세요!</p>
              </div>
            )}
          </div>

        </section>
        )}

        {/* ═══ TAB 2: 라운지 ═══ */}
        {activeTab === 'lounge' && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-tight text-[#191f28] mb-1">실시간 동탄라운지</h2>
              <p className="text-[15px] text-[#8b95a1] font-medium">동탄 주민들의 솔직한 이야기</p>
            </div>
          </div>

          {/* Profile & Verification Bar */}
          {user && userProfile && (
            <div className="bg-white rounded-2xl border border-[#e5e8eb] p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#191f28]">{getDisplayName(userProfile)}</span>
                {userProfile.verifiedApartment && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e8f3ff] text-[#3182f6] px-2 py-0.5 rounded-md">
                    <ShieldCheck size={11} /> {userProfile.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowVerify(true)}
                className="text-[12px] font-bold text-[#3182f6] bg-[#e8f3ff] px-3 py-1.5 rounded-lg hover:bg-[#d4e9ff] transition-colors flex items-center gap-1"
              >
                <Building2 size={13} />
                {userProfile?.verifiedApartment ? '변경' : '아파트 인증'}
              </button>
            </div>
          )}

          {/* Feed */}
          <div className="flex flex-col gap-3">
            {newsFeed.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#e5e8eb]">
                <MessageSquare size={40} className="mx-auto mb-4 text-[#d1d6db]" />
                <p className="text-[15px] font-bold text-[#4e5968]">아직 글이 없습니다</p>
              </div>
            ) : (
              newsFeed.map((news) => (
                <div key={news.id} onClick={() => router.push(`/lounge/${news.id}`)} className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-[16px] font-bold text-[#191f28] leading-snug flex-1">{news.title}</h3>
                    {(user?.uid === news.authorUid || dashboardFacade.isAdmin(user?.email)) && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm('이 글을 삭제하시겠습니까?')) return;
                          try {
                            await dashboardFacade.deletePost(news.id);
                          } catch {
                            alert('삭제에 실패했습니다.');
                          }
                        }}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-[#fff0f0] text-[#adb5bd] hover:text-[#ff6b6b] transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#8b95a1]">{news.author} · {news.meta}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[12px] text-[#8b95a1]"><Heart size={12} /> {news.likes || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Floating write button */}
          {user && (
            <button
              onClick={() => setShowCompose(true)}
              className="fixed bottom-6 right-6 w-14 h-14 bg-[#3182f6] hover:bg-[#1b6de8] text-white rounded-full shadow-lg shadow-[#3182f6]/30 flex items-center justify-center transition-all active:scale-95 z-20"
            >
              <PenLine size={22} />
            </button>
          )}

          {/* Compose Modal */}
          {showCompose && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
              <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-extrabold text-[#191f28]">익명 글쓰기</h2>
                  <button onClick={() => setShowCompose(false)} className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e5e8eb] transition-colors">
                    <X size={16} className="text-[#4e5968]" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {['부동산', '교통', '교육', '문화', '자유'].map((cat) => (
                    <button key={cat} onClick={() => setPostCategory(cat)} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${postCategory === cat ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{cat}</button>
                  ))}
                </div>
                <textarea value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="동탄 이야기를 자유롭게 나눠보세요..." rows={3} className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#3182f6]/10 mb-4" autoFocus />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#8b95a1]">🎭 {userProfile ? getDisplayName(userProfile) : '익명'}</span>
                  <button
                    onClick={async () => {
                      if (!user || !postTitle.trim()) return;
                      setIsSubmitting(true);
                      try {
                        await dashboardFacade.addPost(postTitle.trim(), postCategory, user.uid);
                        setPostTitle(''); setPostCategory('자유'); setShowCompose(false);
                      } catch { alert('글 작성에 실패했습니다.'); }
                      finally { setIsSubmitting(false); }
                    }}
                    disabled={isSubmitting || !postTitle.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-[#3182f6] hover:bg-[#1b6de8] disabled:bg-[#d1d6db] text-white rounded-xl font-bold text-[14px] transition-all active:scale-95"
                  >
                    <Send size={14} />
                    {isSubmitting ? '게시 중...' : '게시하기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Apartment Verification Modal */}
          {showVerify && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVerify(false)} />
              <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-extrabold text-[#191f28]">🏠 아파트 인증</h2>
                  <button onClick={() => setShowVerify(false)} className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e5e8eb] transition-colors">
                    <X size={16} className="text-[#4e5968]" />
                  </button>
                </div>
                <p className="text-[14px] font-bold text-[#191f28] mb-3">내 아파트를 선택해주세요</p>
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                  {Array.from(new Set(dongtanApartments.map(apt => apt.match(/\[(.*?)\]/)?.[1]).filter(Boolean))).map(dong => (
                    <button key={dong} onClick={() => { setVerifyDong(dong as string); setVerifyApt(''); }} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${verifyDong === dong ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{dong}</button>
                  ))}
                </div>
                {verifyDong && (
                  <div className="bg-[#f9fafb] border border-[#d1d6db] rounded-xl overflow-hidden max-h-48 overflow-y-auto p-2 mb-5">
                    {dongtanApartments.filter(apt => apt.includes(`[${verifyDong}]`)).map(apt => (
                      <button key={apt} onClick={() => setVerifyApt(apt)} className={`w-full text-left px-4 py-3 text-[14px] font-medium rounded-lg transition-colors ${verifyApt === apt ? 'bg-[#e8f3ff] text-[#3182f6] font-bold' : 'text-[#191f28] hover:bg-[#f2f4f6]'}`}>{apt}</button>
                    ))}
                  </div>
                )}
                <button
                  onClick={async () => {
                    if (!user || !verifyApt) return;
                    await UserRepo.setApartmentVerification(user.uid, verifyApt, 'self_declared');
                    setUserProfile(prev => prev ? { ...prev, verifiedApartment: verifyApt, verificationLevel: 'self_declared' } : null);
                    setShowVerify(false);
                    alert('🏠 아파트 인증이 완료되었습니다!');
                  }}
                  disabled={!verifyApt}
                  className="w-full py-4 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:bg-[#d1d6db] disabled:text-[#8b95a1] bg-[#191f28] text-white flex items-center justify-center gap-2"
                >
                  <Shield size={16} />
                  자가선언 인증하기
                </button>
              </div>
            </div>
          )}

        </section>
        )}

        {/* ═══ TAB 3: 아파트 추천 ═══ */}
        {activeTab === 'recommend' && (
        <section>
          <div className="mb-8">
            <h2 className="text-[28px] font-extrabold tracking-tight text-[#191f28] mb-1">아파트 추천</h2>
            <p className="text-[15px] text-[#8b95a1] font-medium">동탄 맞춤 아파트 추천 & 분석</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-full h-[180px] sm:h-[200px] bg-gradient-to-br from-[#3182f6] to-[#2b72d6] rounded-3xl p-5 sm:p-8 flex flex-col justify-end text-white relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-white/20 transition-colors"></div>
              <h3 className="text-[18px] sm:text-[24px] font-extrabold mb-1 relative z-10">우리 아파트 탈탈 털어드림!</h3>
              <p className="text-white/80 text-[12px] sm:text-[14px] relative z-10">장점부터 숨기고 싶은 단점까지 속 시원하게 분석 신청하기</p>
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-white text-[#3182f6] w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-black/10">&rarr;</div>
            </div>

            {/* KPI Cards */}
            {kpis.map(kpi => (
              <div key={kpi.id} className="bg-white p-6 rounded-3xl border border-[#e5e8eb] shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[13px] text-[#4e5968] font-bold mb-3">{kpi.title}</h3>
                <div className="text-[24px] font-extrabold text-[#191f28]">{kpi.mainValue}</div>
                {kpi.subValue && <p className="text-[12px] text-[#8b95a1] font-medium mt-1">{kpi.subValue}</p>}
              </div>
            ))}

            {/* 동탄 부동산 마인드맵 — 맨 아래 배치 */}
            <ArchitectureMindmap />

            {/* Ad Banner */}
            <div className="w-full bg-[#f2f4f6] border border-[#e5e8eb] rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <span className="bg-[#191f28] text-white text-[11px] font-bold px-2 py-0.5 rounded mb-2">AD</span>
              <h3 className="text-[18px] font-bold text-[#191f28] mb-1">여기에 광고 배너가 표시됩니다</h3>
              <p className="text-[#8b95a1] text-[14px]">광고 구좌 (e.g., 부동산 플랫폼 배너, 인테리어 광고 등)</p>
            </div>
          </div>
        </section>
        )}
        
      </main>

      {/* Field Report Full View Modal */}
      {selectedReport && (
        <FieldReportModal 
          report={fullReportData || selectedReport} 
          onClose={() => setSelectedReport(null)} 
          comments={commentsData[selectedReport.id] || []}
          commentInput={commentInput[selectedReport.id] || ''}
          onCommentChange={(text) => setCommentInput(prev => ({ ...prev, [selectedReport.id]: text }))}
          onSubmitComment={() => handleSubmitComment(selectedReport.id)}
          user={user}
          transactions={modalTransactions}
          typeMap={typeMap}
          isLoadingDetail={isLoadingDetail}
          isPurchased={purchasedReportIds.includes(selectedReport.id)}
          isAdmin={dashboardFacade.isAdmin(user?.email)}
          onPurchaseComplete={() => {
            if (user) {
              PurchaseRepo.getUserPurchasedReportIds(user.uid).then(setPurchasedReportIds);
            }
          }}
        />
      )}



      {showReviewModal && user && (
        <WriteReviewModal onClose={() => setShowReviewModal(false)} userUid={user.uid} />
      )}

    </div>
  );
}
