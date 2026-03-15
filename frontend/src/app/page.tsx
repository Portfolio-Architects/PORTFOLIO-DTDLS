'use client';

import { 
  Building, MapPin, Map as MapIcon, Info, Users, AlertCircle, ShieldAlert,
  Car, BookOpen, ClipboardCheck, Tag, X, FileText, CheckCircle2, TrendingUp, Radar,
  MessageSquare, Heart, Compass, LayoutDashboard, Camera, UserCircle, Star, Maximize2, Link2, Trash2, Text, LogOut,
  Home, PenLine, Send, Edit3, Shield, ShieldCheck, Building2, Check, Pencil
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Scatter } from 'recharts';

// Lazy-loaded heavy chart components (reduces initial bundle ~40KB)
const MainChart = dynamic(() => import('@/components/MainChart'), { ssr: false });
const EduBubbleChart = dynamic(() => import('@/components/EduBubbleChart'), { ssr: false });
const LifestyleRadarChart = dynamic(() => import('@/components/LifestyleRadarChart'), { ssr: false });
const PropertyScoreChart = dynamic(() => import('@/components/consumer/PropertyScoreChart'), { ssr: false });
const ArchitectureMindmap = dynamic(() => import('@/components/admin/ArchitectureMindmap'), { ssr: false });

import { useDashboardData, dashboardFacade, CommentData, FieldReportData, UserReview } from '@/lib/DashboardFacade';
import WriteReviewModal from '@/components/WriteReviewModal';
import { ZONES, dongToZoneId, getZoneById, getDongsForZone, getAllDongs, getZoneColorForDong, ZoneInfo } from '@/lib/zones';
import { isSameApartment, normalizeAptName } from '@/lib/utils/apartmentMapping';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebaseConfig';
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
  isLoadingDetail
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
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'6M'|'1Y'|'3Y'|'ALL'>('ALL');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-[#191f28]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div ref={modalRef} className={`relative bg-[#f2f4f6] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] max-h-[90vh] rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5`}>
          <button onClick={onClose} className="sticky top-4 z-20 ml-auto mr-4 mt-4 -mb-14 bg-[#191f28]/80 hover:bg-[#191f28] text-white w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0">
            <X size={20} />
          </button>

          {/* Hero Section */}
          <div className="bg-white w-full flex flex-col md:flex-row p-6 md:p-10 gap-6 md:gap-8 rounded-t-3xl shrink-0 pt-4 md:pt-8 border-b border-[#e5e8eb]">
            
            {/* Left: 실거래가 전체 리스트 — mobile: 2번째, desktop: 1번째 */}
            <div className="w-full md:w-[50%] shrink-0 order-2 md:order-1">
              {transactions.length > 0 ? (
                <div className="bg-[#f9fafb] rounded-2xl p-4 ring-1 ring-black/5">
                  <h4 className="text-[13px] font-bold text-[#8b95a1] mb-3 flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-[#03c75a]" />
                    실거래가 내역 <span className="text-[11px] ml-1">{transactions.length}건</span>
                  </h4>
                  <div className="overflow-y-auto max-h-[360px] custom-scrollbar">
                    <table className="w-full text-[12px]">
                      <thead className="sticky top-0 bg-[#f9fafb]">
                        <tr className="border-b border-[#e5e8eb] text-[#8b95a1]">
                          <th className="py-2 text-left font-bold">거래일</th>
                          <th className="py-2 text-right font-bold">금액</th>
                          <th className="py-2 text-right font-bold">면적</th>
                          <th className="py-2 text-right font-bold">층</th>
                          <th className="py-2 text-right font-bold">유형</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => (
                          <tr key={idx} className="border-b border-[#f2f4f6] hover:bg-white/60 transition-colors">
                            <td className="py-2 text-[#4e5968]">{tx.contractYm.slice(0,4)}.{tx.contractYm.slice(4)}.{tx.contractDay}</td>
                            <td className="py-2 text-right font-extrabold text-[#191f28]">{tx.priceEok}</td>
                            <td className="py-2 text-right text-[#4e5968]">{(() => { const norm = normalizeAptName(tx.aptName); const t = typeMap[norm]?.[String(tx.area)]; return t ? <span className="font-bold text-[#3182f6]">{t}</span> : `${tx.areaPyeong}평`; })()}</td>
                            <td className="py-2 text-right text-[#4e5968]">{tx.floor}층</td>
                            <td className="py-2 text-right text-[#8b95a1]">{tx.dealType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f9fafb] rounded-2xl p-8 flex items-center justify-center ring-1 ring-black/5 h-[200px]">
                  <span className="text-[#8b95a1] text-[13px] font-bold">매매 기록이 없습니다</span>
                </div>
              )}
            </div>

            {/* Right: Title + Chart — mobile: 1번째, desktop: 2번째 */}
            <div className="w-full md:w-[50%] flex flex-col order-1 md:order-2">
               <div className="flex items-center gap-2 mb-3">
                 <span className="bg-[#3182f6] text-white text-[13px] font-bold px-3 py-1 rounded-full">{report.dong || '동탄'}</span>
               </div>
               <h1 className="text-[28px] md:text-[36px] font-extrabold leading-tight tracking-tight mb-4 text-[#191f28]">{report.apartmentName}</h1>
               
               <div className="flex items-center gap-3 pb-4 border-b border-[#e5e8eb] text-[#4e5968]">
                 <span className="text-[14px] font-bold">by 임장크루</span>
                 <span className="text-[13px] opacity-60">·</span>
                 <span className="text-[13px]">{report.createdAt}</span>
               </div>

               {/* 매매가 추이 차트 (시계열 선택 + 스캐터) */}
               {transactions.length > 0 && (() => {
                 // 만원 → 억 변환
                 const rawData = [...transactions].reverse().map((tx, idx) => {
                   let priceEokNum = tx.price / 10000;
                   if (priceEokNum > 100) priceEokNum = tx.price / 100000000;
                   const ym = tx.contractYm; // e.g. '202511'
                   return {
                     date: `${ym.slice(2,4)}.${ym.slice(4)}`,
                     fullDate: `${ym.slice(0,4)}.${ym.slice(4)}.${tx.contractDay}`,
                     yearMonth: parseInt(ym),
                     price: Math.round(priceEokNum * 1000) / 1000,
                     area: tx.areaPyeong,
                     floor: tx.floor,
                     priceEok: tx.priceEok,
                     idx,
                   };
                 });

                 // 시계열 필터
                 const now = new Date();
                 const cutoffMap: Record<string, number> = {
                   '6M': 6, '1Y': 12, '3Y': 36, 'ALL': 9999,
                 };
                 const months = cutoffMap[chartTimeframe];
                 const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
                 const cutoffYm = cutoffDate.getFullYear() * 100 + (cutoffDate.getMonth() + 1);
                 const timeFiltered = rawData.filter(d => d.yearMonth >= cutoffYm);

                 // IQR 이상치 필터
                 const sorted = [...timeFiltered].sort((a, b) => a.price - b.price);
                 const q1 = sorted[Math.floor(sorted.length * 0.1)]?.price || 0;
                 const q3 = sorted[Math.floor(sorted.length * 0.9)]?.price || 10;
                 const iqr = q3 - q1;
                 const lower = Math.max(0, q1 - iqr * 2);
                 const upper = q3 + iqr * 2;
                 const chartData = timeFiltered.filter(d => d.price >= lower && d.price <= upper);

                 if (chartData.length === 0) return null;

                 // 월별 중앙값 계산
                 const byMonth = new Map<number, number[]>();
                 chartData.forEach(d => {
                   if (!byMonth.has(d.yearMonth)) byMonth.set(d.yearMonth, []);
                   byMonth.get(d.yearMonth)!.push(d.price);
                 });
                 const getMedian = (arr: number[]) => {
                   const s = [...arr].sort((a, b) => a - b);
                   const mid = Math.floor(s.length / 2);
                   return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
                 };
                 // chartData에 median 필드 추가 (같은 월이면 같은 중앙값)
                 const medianMap = new Map<number, number>();
                 byMonth.forEach((prices, ym) => medianMap.set(ym, Math.round(getMedian(prices) * 1000) / 1000));
                 const enrichedData = chartData.map(d => ({
                   ...d,
                   median: medianMap.get(d.yearMonth) ?? d.price,
                 }));

                 const prices = chartData.map(d => d.price);
                 const minP = Math.min(...prices);
                 const maxP = Math.max(...prices);
                 const avgP = prices.reduce((a, b) => a + b, 0) / prices.length;
                 const medianAll = getMedian(prices);
                 const domainMin = Math.floor(minP * 10) / 10 - 0.3;
                 const domainMax = Math.ceil(maxP * 10) / 10 + 0.3;

                 return (
                   <div className="mt-4 bg-white rounded-2xl p-4 ring-1 ring-black/5 flex-1">
                     {/* Header + Timeframe */}
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="text-[12px] font-bold text-[#4e5968] flex items-center gap-1.5">
                         <TrendingUp size={13} className="text-[#3182f6]" />
                         매매가 추이
                       </h4>
                       <div className="flex items-center gap-1">
                         {(['6M','1Y','3Y','ALL'] as const).map(tf => (
                           <button
                             key={tf}
                             onClick={() => setChartTimeframe(tf)}
                             className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                               chartTimeframe === tf
                                 ? 'bg-[#3182f6] text-white'
                                 : 'bg-[#f2f4f6] text-[#8b95a1] hover:bg-[#e5e8eb]'
                             }`}
                           >
                             {tf}
                           </button>
                         ))}
                       </div>
                     </div>
                     {/* Stats */}
                     <div className="flex items-center gap-3 text-[10px] mb-2">
                       <span className="text-[#3182f6] font-bold">최고 {maxP.toFixed(1)}억</span>
                       <span className="text-[#FBBF24] font-bold">중앙 {medianAll.toFixed(1)}억</span>
                       <span className="text-[#8b95a1]">최저 {minP.toFixed(1)}억</span>
                       <span className="ml-auto text-[#8b95a1]">{chartData.length}건</span>
                     </div>
                     {/* Chart */}
                     <div className="h-[200px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={enrichedData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                           <defs>
                             <linearGradient id="priceGradModal" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#3182f6" stopOpacity={0.12}/>
                               <stop offset="95%" stopColor="#3182f6" stopOpacity={0.01}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" vertical={false} />
                           <XAxis
                             dataKey="date"
                             tick={{ fill: '#8b95a1', fontSize: 9 }}
                             axisLine={false}
                             tickLine={false}
                             interval={Math.max(1, Math.floor(enrichedData.length / 7))}
                           />
                           <YAxis
                             domain={[Math.max(0, domainMin), domainMax]}
                             tick={{ fill: '#8b95a1', fontSize: 10 }}
                             axisLine={false}
                             tickLine={false}
                             width={45}
                             tickFormatter={(v: number) => `${v.toFixed(1)}억`}
                           />
                           <RechartsTooltip
                             contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e8eb', fontSize: '12px', fontWeight: 'bold', color: '#191f28', padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                             labelFormatter={(label: any, payload: any) => {
                               const item = payload?.[0]?.payload;
                               return item ? `📅 ${item.fullDate}` : label;
                             }}
                             formatter={(value: any, name: any, props: any) => {
                               const item = props?.payload;
                               if (name === 'median') return [`월 중앙값 ${value.toFixed(2)}억`, '추세'];
                               return [`${item?.priceEok || value + '억'}  ·  ${item?.area || '-'}평  ·  ${item?.floor || '-'}층`, '매매'];
                             }}
                             cursor={{ stroke: '#3182f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                           />
                           {/* 월별 중앙값 추세선 */}
                           <Area
                             type="monotone"
                             dataKey="median"
                             stroke="#3182f6"
                             strokeWidth={2.5}
                             fill="url(#priceGradModal)"
                             dot={false}
                             activeDot={false}
                             connectNulls
                           />
                           {/* 개별 거래 점 */}
                           <Scatter
                             dataKey="price"
                             fill="#3182f6"
                             shape={(props: any) => {
                               const { cx, cy } = props;
                               if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
                               return <circle cx={cx} cy={cy} r={3} fill="#3182f6" fillOpacity={0.4} stroke="#fff" strokeWidth={0.8} />;
                             }}
                           />
                         </ComposedChart>
                       </ResponsiveContainer>
                     </div>
                   </div>
                 );
               })()}
            </div>

          </div>

          {/* Sticky Section Nav */}
          <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] px-4 py-2.5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[1000px] mx-auto">
              {['요약', '프리미엄', '사진', '명세', '인프라', '생태', '결론', '댓글'].map((label, idx) => {
                const ids = ['sec-summary', 'sec-premium', 'sec-photos', 'sec-specs', 'sec-infra', 'sec-eco', 'sec-conclusion', 'sec-comments'];
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

          {/* Magazine Content Wrapper */}
          <div className="px-2 py-6 md:px-3 md:py-8 flex flex-col gap-8 w-full">

            {/* 요약 브리프 (맨 위 배치 — 항상 렌더링) */}
              <div id="sec-summary" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-16">
                <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Text size={20} className="text-[#3182f6]"/> 요약 브리프</h2>
                {s?.assessment ? (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-0 rounded-2xl overflow-hidden border border-[#bbf7d0]">
                    <div className="w-1.5 bg-[#03c75a] shrink-0" />
                    <div className="bg-[#f0fdf4] p-5 flex-1">
                      <h3 className="text-[15px] font-extrabold text-[#03c75a] mb-2 flex items-center gap-1.5"><CheckCircle2 size={18}/> 이 단지의 핵심 장점</h3>
                      <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{s.assessment.alphaDriver || '내용 없음'}</p>
                    </div>
                  </div>
                  <div className="flex gap-0 rounded-2xl overflow-hidden border border-[#ffebec]">
                    <div className="w-1.5 bg-[#f04452] shrink-0" />
                    <div className="bg-[#fff5f5] p-5 flex-1">
                      <h3 className="text-[15px] font-extrabold text-[#f04452] mb-2 flex items-center gap-1.5"><AlertCircle size={18}/> 주의할 단점</h3>
                      <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{s.assessment.systemicRisk || '내용 없음'}</p>
                    </div>
                  </div>
                </div>
                ) : (
                  <p className="text-[14px] text-[#8b95a1] text-center py-8">요약 정보가 아직 작성되지 않았습니다.</p>
                )}
              </div>

            {/* 0. Premium Score Analysis (If Available, outside of legacy toggle) */}
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
                 <PropertyScoreChart scores={report.premiumScores} />
              </div>
            )}

            {/* Location Infrastructure Info — Enhanced with categories + raw data */}
            {report.metrics && (report.metrics.distanceToElementary || report.metrics.distanceToSubway || report.metrics.academyDensity) && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3">
                  <MapPin size={18} className="text-[#3182f6]"/> 학군·교통·생활 인프라
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.metrics.distanceToElementary > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 text-center">
                      <div className="text-[11px] font-bold text-[#8b95a1] mb-1">🏫 초등학교</div>
                      <div className="text-[22px] font-extrabold text-[#191f28]">{report.metrics.distanceToElementary}<span className="text-[13px] text-[#8b95a1] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.elementary && (
                        <div className="text-[10px] text-[#4e5968] mt-1 truncate">{report.metrics.nearestSchoolNames.elementary}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToMiddle > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 text-center">
                      <div className="text-[11px] font-bold text-[#8b95a1] mb-1">🏫 중학교</div>
                      <div className="text-[22px] font-extrabold text-[#191f28]">{report.metrics.distanceToMiddle}<span className="text-[13px] text-[#8b95a1] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.middle && (
                        <div className="text-[10px] text-[#4e5968] mt-1 truncate">{report.metrics.nearestSchoolNames.middle}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToHigh > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 text-center">
                      <div className="text-[11px] font-bold text-[#8b95a1] mb-1">🏫 고등학교</div>
                      <div className="text-[22px] font-extrabold text-[#191f28]">{report.metrics.distanceToHigh}<span className="text-[13px] text-[#8b95a1] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.high && (
                        <div className="text-[10px] text-[#4e5968] mt-1 truncate">{report.metrics.nearestSchoolNames.high}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToSubway > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 text-center">
                      <div className="text-[11px] font-bold text-[#3182f6] mb-1">🚇 GTX-A/SRT</div>
                      <div className="text-[22px] font-extrabold text-[#3182f6]">{report.metrics.distanceToSubway}<span className="text-[13px] text-[#3182f6]/70 ml-0.5">m</span></div>
                      {report.metrics.nearestStationName && (
                        <div className="text-[10px] text-[#3182f6]/80 mt-1 truncate">{report.metrics.nearestStationName}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToIndeokwon != null && report.metrics.distanceToIndeokwon > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 text-center">
                      <div className="text-[11px] font-bold text-[#3182f6] mb-1">🚆 인덕원선</div>
                      <div className="text-[22px] font-extrabold text-[#3182f6]">{report.metrics.distanceToIndeokwon}<span className="text-[13px] text-[#3182f6]/70 ml-0.5">m</span></div>
                    </div>
                  )}
                  {report.metrics.distanceToTram != null && report.metrics.distanceToTram > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 text-center">
                      <div className="text-[11px] font-bold text-[#3182f6] mb-1">🚊 동탄트램</div>
                      <div className="text-[22px] font-extrabold text-[#3182f6]">{report.metrics.distanceToTram}<span className="text-[13px] text-[#3182f6]/70 ml-0.5">m</span></div>
                    </div>
                  )}
                  {/* Academy Density with Category Breakdown */}
                  {report.metrics.academyDensity > 0 && (
                    <div className="bg-[#f0fdf4] rounded-2xl p-4 text-center col-span-1">
                      <div className="text-[11px] font-bold text-[#03c75a] mb-1">📚 학원 (1km)</div>
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

          </div>
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

  // Transaction data
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [typeMap, setTypeMap] = useState<Record<string, Record<string, string>>>({});

  // Auth & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [anonProfile, setAnonProfile] = useState<{nickname: string; frontName?: string; photoURL?: string} | null>(null);

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
      } else {
        setAnonProfile(null);
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch transaction + type map data in parallel
  useEffect(() => {
    Promise.all([
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/type-map').then(r => r.json()),
    ]).then(([txData, tmData]) => {
      if (txData.records) setAllTransactions(txData.records);
      if (tmData.entries) {
        const map: Record<string, Record<string, string>> = {};
        for (const e of tmData.entries) {
          const key = normalizeAptName(e.aptName);
          if (!map[key]) map[key] = {};
          map[key][e.area] = e.typeName;
        }
        setTypeMap(map);
      }
    }).catch(err => console.warn('데이터 로딩 실패:', err)).finally(() => setTxLoading(false));
  }, []);

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
  useEffect(() => {
    if (selectedReport) {
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
    }
  }, [selectedReport]);

  // Fetch comments automatically when a report modal is opened
  useEffect(() => {
    if (selectedReport && !commentsData[selectedReport.id]) {
      const unsubscribe = dashboardFacade.listenToComments(selectedReport.id, (comments) => {
        setCommentsData(prev => ({ ...prev, [selectedReport.id]: comments }));
      });
      return () => unsubscribe();
    }
  }, [selectedReport]);

  // Count field reports by zone (for display counts on zone cards)
  const zoneReportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ZONES.forEach(z => { counts[z.id] = 0; });
    fieldReports?.forEach(report => {
      const zoneId = dongToZoneId(report.dong);
      counts[zoneId] = (counts[zoneId] || 0) + 1;
    });
    return counts;
  }, [fieldReports]);

  // Count field reports by dong (for dong filter chip counts)
  const dongReportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    getAllDongs().forEach(d => { counts[d] = 0; });
    fieldReports?.forEach(report => {
      if (report.dong) counts[report.dong] = (counts[report.dong] || 0) + 1;
    });
    return counts;
  }, [fieldReports]);

  // Pre-group transactions by apartment name (O(N) once, then O(1) per card lookup)
  const transactionsByApt = useMemo(() => {
    const map: Record<string, TransactionRecord[]> = {};
    for (const tx of allTransactions) {
      const norm = normalizeAptName(tx.aptName);
      if (!map[norm]) map[norm] = [];
      map[norm].push(tx);
    }
    return map;
  }, [allTransactions]);

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
        <div className="w-full max-w-[2000px] mx-auto px-6 md:px-10 lg:px-16 h-16 flex justify-between items-center">
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
      <main className="w-full max-w-[2000px] mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-12 animate-in fade-in duration-500">

        {/* ═══ TAB 1: 임장기 ═══ */}
        {mounted && activeTab === 'imjang' && (
        <section>
          {/* 1. Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#191f28] tracking-tight">
                프리미엄 임장기
              </h2>
              <span suppressHydrationWarning className="inline-flex items-center gap-1.5 bg-[#e8f3ff] text-[#3182f6] text-[13px] font-bold px-3 py-1 rounded-full shrink-0">
                <FileText size={13} />
                {fieldReports.length}개 단지
              </span>
            </div>
            <p className="text-[15px] text-[#8b95a1] font-medium">
              장점부터 숨기고 싶은 단점까지 — 직접 현장을 다니며 기록한 솔직한 임장 리포트
            </p>
          </div>

          {/* ── Dong Filter Chips (Single Row) ── */}
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
                전체 ({fieldReports.length})
              </button>
              {getAllDongs().map(dong => {
                const count = dongReportCounts[dong] || 0;
                const zoneColor = getZoneColorForDong(dong);
                const isActive = selectedDong === dong;
                return (
                  <button
                    suppressHydrationWarning
                    key={dong}
                    onClick={() => setSelectedDong(isActive ? null : dong)}
                    className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-white shadow-md'
                        : 'bg-[#f2f4f6] text-[#4e5968] hover:bg-[#e5e8eb]'
                    }`}
                    style={isActive ? { backgroundColor: zoneColor } : {}}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isActive ? '#fff' : zoneColor }} />
                    {dong} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Latest Reports (filtered) */}
          {filteredReports.length > 0 ? (
            <div>
              <h3 className="text-[18px] font-extrabold text-[#191f28] mb-4 flex items-center gap-2">
                <ClipboardCheck size={18} className="text-[#f59e0b]" />
                {selectedDong ? '필터 결과' : '임장 리포트'}
                <span className="text-[13px] font-bold text-[#8b95a1] ml-1">{filteredReports.length}개</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map(report => {
                  const normName = normalizeAptName(report.apartmentName);
                  const txs = transactionsByApt[normName] || [];
                  return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col md:flex-row"
                  >
                    {/* Left: Photo */}
                    <div className="w-full md:w-[240px] h-[180px] md:h-auto bg-[#f2f4f6] overflow-hidden relative shrink-0">
                      {report.imageUrl ? (
                         <Image src={report.imageUrl} alt={report.apartmentName} fill sizes="(max-width: 768px) 100vw, 240px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[160px]">
                          <Camera size={32} className="text-[#d1d6db]" />
                        </div>
                      )}
                    </div>
                    {/* Right: Info */}
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {report.dong && <span className="text-[11px] font-bold text-[#3182f6] bg-[#e8f3ff] px-2 py-0.5 rounded-md">{report.dong}</span>}
                          {report.premiumScores?.totalPremiumScore != null && (
                            <span className="text-[11px] font-bold text-[#f59e0b] bg-[#fff8e1] px-2 py-0.5 rounded-md">종합 {report.premiumScores.totalPremiumScore}점</span>
                          )}
                          <span className="ml-auto text-[11px] text-[#8b95a1]">{report.createdAt}</span>
                        </div>
                        <h4 className="text-[17px] font-extrabold text-[#191f28] truncate mb-3">{report.apartmentName}</h4>
                      </div>

                      {/* 최근 실거래 + 가격 요약 */}
                      <div className="flex items-center gap-3">
                        {txLoading ? (
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {[1,2,3].map(i => <div key={i} className="h-3 bg-[#e5e8eb] rounded animate-pulse" style={{width: `${90-i*15}%`}} />)}
                            <p className="text-[10px] text-[#8b95a1] mt-1 animate-pulse">📊 실거래가 로드중...</p>
                          </div>
                        ) : txs.length > 0 && (
                          <div className="basis-3/5 grow min-w-0">
                            <table className="w-full text-[12px]">
                              <tbody>
                                {txs.slice(0, 4).map((tx, idx) => {
                                  const norm = normalizeAptName(tx.aptName);
                                  const t = typeMap[norm]?.[String(tx.area)];
                                  return (
                                    <tr key={idx} className="border-b border-[#f2f4f6] last:border-0">
                                      <td className="py-1 pr-2 text-[11px] text-[#8b95a1] whitespace-nowrap">{tx.contractYm.slice(4)}.{tx.contractDay}</td>
                                      <td className="py-1 pr-2 text-right font-extrabold text-[#191f28] whitespace-nowrap">{tx.priceEok}</td>
                                      <td className="py-1 pr-1 text-right text-[11px] text-[#3182f6] font-bold whitespace-nowrap">{t || `${tx.areaPyeong}평`}</td>
                                      <td className="py-1 text-right text-[11px] text-[#8b95a1] whitespace-nowrap">{tx.floor}층</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {txs.length > 2 && (() => {
                          const prices = txs.map(t => t.price);
                          const maxPrice = Math.max(...prices);
                          const minPrice = Math.min(...prices);
                          const latestPrice = prices[0];
                          const prevPrice = prices[1] || prices[0];
                          const changePercent = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
                          const gapFromHigh = maxPrice > 0 ? ((latestPrice - maxPrice) / maxPrice * 100) : 0;
                          const isUp = changePercent >= 0;
                          const formatEok = (p: number) => {
                            const e = Math.floor(p / 10000);
                            const r = Math.round((p % 10000) / 1000) * 1000;
                            return e > 0 ? (r > 0 ? `${e}.${Math.round(r/1000)}억` : `${e}억`) : `${p.toLocaleString()}만`;
                          };
                          return (
                            <div className="basis-2/5 grow bg-[#f9fafb] rounded-xl px-4 py-2.5 flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#8b95a1]">최고가</span>
                                <span className="text-[14px] font-extrabold text-[#f04452]">{formatEok(maxPrice)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#8b95a1]">최저가</span>
                                <span className="text-[14px] font-extrabold text-[#3182f6]">{formatEok(minPrice)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#8b95a1]">직전대비</span>
                                <span className={`text-[13px] font-extrabold ${isUp ? 'text-[#f04452]' : 'text-[#3182f6]'}`}>
                                  {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(1)}%
                                </span>
                              </div>
                              {gapFromHigh < -3 && (
                                <div className="text-[10px] text-[#8b95a1]">
                                  고점대비 {gapFromHigh.toFixed(0)}%
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ) : selectedDong && (
            <div className="bg-white rounded-2xl border border-[#e5e8eb] p-12 text-center">
              <MapPin size={40} className="mx-auto mb-4 text-[#d1d6db]" />
              <p className="text-[15px] font-bold text-[#4e5968]">해당 동에 임장 리포트가 없습니다</p>
              <p className="text-[13px] text-[#8b95a1] mt-1">첫 번째 리포트를 작성해보세요!</p>
            </div>
          )}

          {/* 권역별 탐색 */}
          <div className="mt-10">
            <h3 className="text-[18px] font-extrabold text-[#191f28] mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-[#3182f6]" />
              권역별 탐색
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {ZONES.map(zone => {
                const count = zoneReportCounts[zone.id] || 0;
                return (
                  <div
                    key={zone.id}
                    onClick={() => router.push(`/zone/${zone.id}`)}
                    className="bg-white rounded-2xl border border-[#e5e8eb] p-3 cursor-pointer hover:shadow-lg hover:border-transparent hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                      <h4 className="text-[12px] font-extrabold text-[#191f28] truncate">{zone.name}</h4>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mb-1.5" style={{ backgroundColor: zone.color + '18', color: zone.color }}>{zone.dongLabel}</span>
                    <p className="text-[10px] text-[#8b95a1] leading-relaxed line-clamp-2 mb-2">{zone.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#4e5968]">{count}개 단지</span>
                      <span className="text-[10px] font-bold transition-opacity" style={{ color: zone.color }}>보기 →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 동네 리뷰 ── */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-[28px] font-extrabold tracking-tight text-[#191f28] mb-1">동네 리뷰</h2>
                <p className="text-[15px] text-[#8b95a1] font-medium">주민들의 솔직한 한줄평</p>
              </div>
              <button
                onClick={() => user ? setShowReviewModal(true) : alert('로그인 후 리뷰를 작성할 수 있습니다.')}
                className="px-4 py-2 bg-[#191f28] text-white rounded-xl text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#333d4b] active:scale-[0.97] transition-all"
              >
                <PenLine size={14} />
                리뷰 쓰기
              </button>
            </div>

            {userReviews.length > 0 ? (
              <div className="flex flex-col gap-3">
                {userReviews.map(review => (
                  <div key={review.id} className="bg-white rounded-2xl border border-[#e5e8eb] p-5 hover:shadow-md transition-shadow">
                    {/* Header: author + verification */}
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

                    {/* Apartment name */}
                    <h4 className="text-[15px] font-extrabold text-[#191f28] mb-2 truncate">{review.apartmentName}</h4>

                    {/* Rating stars */}
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#e5e8eb]'} />
                      ))}
                      <span className="text-[12px] font-bold text-[#8b95a1] ml-1">{review.rating}.0</span>
                    </div>

                    {/* Content */}
                    <p className="text-[14px] text-[#4e5968] leading-relaxed mb-3">{review.content}</p>

                    {/* Photo */}
                    {review.photoURL && (
                      <div className="w-full h-48 rounded-xl overflow-hidden mb-3">
                        <img src={review.photoURL} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Actions: Like + Delete */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => dashboardFacade.incrementReviewLike(review.id)}
                        className="flex items-center gap-1 text-[12px] font-bold text-[#8b95a1] hover:text-[#f04452] transition-colors"
                      >
                        <Heart size={14} />
                        {review.likes || 0}
                      </button>
                      {(user?.uid === review.authorUid || dashboardFacade.isAdmin(user?.email)) && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('이 리뷰를 삭제하시겠습니까?')) return;
                            try {
                              await dashboardFacade.deleteReview(review.id);
                            } catch {
                              alert('삭제에 실패했습니다.');
                            }
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#8b95a1] hover:text-[#f04452] transition-colors"
                        >
                          <Trash2 size={13} />
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e5e8eb] p-12 text-center">
                <Edit3 size={40} className="mx-auto mb-4 text-[#d1d6db]" />
                <p className="text-[15px] font-bold text-[#4e5968] mb-2">아직 리뷰가 없습니다</p>
                <p className="text-[13px] text-[#8b95a1] mb-4">첫 번째 리뷰를 남겨보세요!</p>
                <button
                  onClick={() => user ? setShowReviewModal(true) : alert('로그인 후 리뷰를 작성할 수 있습니다.')}
                  className="px-5 py-2.5 bg-[#3182f6] text-white rounded-xl text-[13px] font-bold active:scale-[0.97] transition-all"
                >
                  리뷰 작성하기
                </button>
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
            {/* 3D Architecture Mindmap */}
            <ArchitectureMindmap />
            <div className="w-full h-[200px] bg-gradient-to-br from-[#3182f6] to-[#2b72d6] rounded-3xl p-8 flex flex-col justify-end text-white relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-white/20 transition-colors"></div>
              <h3 className="text-[24px] font-extrabold mb-1 relative z-10">우리 아파트 탈탈 털어드림!</h3>
              <p className="text-white/80 text-[14px] relative z-10">장점부터 숨기고 싶은 단점까지 속 시원하게 분석 신청하기</p>
              <div className="absolute top-8 right-8 bg-white text-[#3182f6] w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-black/10">&rarr;</div>
            </div>

            {/* KPI Cards */}
            {kpis.map(kpi => (
              <div key={kpi.id} className="bg-white p-6 rounded-3xl border border-[#e5e8eb] shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[13px] text-[#4e5968] font-bold mb-3">{kpi.title}</h3>
                <div className="text-[24px] font-extrabold text-[#191f28]">{kpi.mainValue}</div>
                {kpi.subValue && <p className="text-[12px] text-[#8b95a1] font-medium mt-1">{kpi.subValue}</p>}
              </div>
            ))}

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
          transactions={allTransactions.filter(tx => isSameApartment(selectedReport.apartmentName, tx.aptName))}
          typeMap={typeMap}
          isLoadingDetail={isLoadingDetail}
        />
      )}



      {showReviewModal && user && (
        <WriteReviewModal onClose={() => setShowReviewModal(false)} userUid={user.uid} />
      )}

    </div>
  );
}
