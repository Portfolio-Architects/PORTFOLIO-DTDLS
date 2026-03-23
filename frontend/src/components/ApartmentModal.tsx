'use client';

import { useState, useRef, useMemo } from 'react';
import {
  MapPin, X, TrendingUp, Camera, Maximize2,
  MessageSquare, UserCircle, CheckCircle2, Building, Info, ShieldAlert, Radar
} from 'lucide-react';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Bar, Customized, Line, Legend } from 'recharts';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { normalize84Price } from '@/lib/utils/valuation';
import { normalizeAptName } from '@/lib/utils/apartmentMapping';
import type { CommentData, FieldReportData } from '@/lib/DashboardFacade';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import CommentSection from '@/components/CommentSection';

const PropertyScoreChart = dynamic(() => import('@/components/consumer/PropertyScoreChart'), { ssr: false });
const ValuationWaterfall = dynamic(() => import('@/components/consumer/ValuationWaterfall'), { ssr: false });
const DynamicSimulator = dynamic(() => import('@/components/consumer/DynamicSimulator'), { ssr: false });
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<'6M'|'1Y'|'3Y'|'ALL'>('ALL');
  const [isTxExpanded, setIsTxExpanded] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<{ x: number; y: number; data: any } | null>(null);
  // TODO: 유료 모델 전환 시 아래 라인 복원
  // const isUnlocked = !!(isPurchased || isAdmin);
  const isUnlocked = true; // 프리미엄 콘텐츠 전면 개방 (Vercel Hobby Plan 대응)
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

  const content = (
    <>
          {/* Hero Section — Layout: 40% table / 60% chart */}
          <div className={`bg-white w-full flex flex-col md:flex-row p-4 ${inline ? 'md:p-6' : 'md:p-10'} gap-4 md:gap-8 ${inline ? '' : 'rounded-t-3xl'} shrink-0 pt-4 md:pt-8 ${inline ? 'border-b border-[#f2f4f6]' : 'border-b border-[#e5e8eb]'}`}>
            
            {/* Left: 실거래가 전체 리스트 — mobile: 2번째, desktop: 1번째 (40%) */}
            <div className="w-full md:w-[40%] shrink-0 order-2 md:order-1 flex flex-col">
              {transactions.length > 0 ? (
                <div className="bg-[#f9fafb] rounded-2xl p-4 ring-1 ring-black/5 h-full flex flex-col">
                  <h4 className="text-sm font-bold text-[#8b95a1] mb-3 flex items-center gap-1.5 shrink-0">
                    <TrendingUp size={16} className="text-[#03c75a]" />
                    <span className="flex items-center gap-1.5">실거래가 내역 <span className="text-sm font-medium ml-0.5">총 {transactions.length.toLocaleString()}건</span></span>
                  </h4>
                  <div className="overflow-y-auto max-h-[460px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#f9fafb]">
                        <tr className="border-b border-[#e5e8eb] text-[#8b95a1]">
                          <th className="py-3 pl-2 text-left font-bold">거래일</th>
                          <th className="py-3 pr-2 text-right font-bold w-[25%]">금액</th>
                          <th className="py-3 text-center font-bold w-[18%]">{areaUnit === 'm2' ? 'm²' : '평'}</th>
                          <th className="py-3 text-center font-bold w-[15%]">층</th>
                          <th className="py-3 pr-2 text-right font-bold w-[18%]">유형</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const colors: [string, string][] = [['text-[#3182f6]','bg-[#e8f3ff]'], ['text-[#059669]','bg-[#d1fae5]'], ['text-[#7c3aed]','bg-[#ede9fe]'], ['text-[#d97706]','bg-[#fef3c7]'], ['text-[#db2777]','bg-[#fce7f3]']];
                          // 전체 거래에서 고유 평형 그룹(숫자/3 반올림)을 추출해 오름차순으로 정렬
                          const groupSet = new Set<number>();
                          transactions.forEach(tx => {
                            const norm = normalizeAptName(tx.aptName);
                            const t = typeMap[norm]?.[String(tx.area)];
                            const label = t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : null;
                            if (!label) return;
                            const m = label.match(/\d+/);
                            if (m) groupSet.add(Math.round(parseInt(m[0]) / 3));
                          });
                          const sortedGroups = Array.from(groupSet).sort((a, b) => a - b);
                          const groupColorIdx = new Map(sortedGroups.map((g, i) => [g, i]));

                          return transactions.map((tx, idx) => {
                            const txDate = new Date(parseInt(tx.contractYm.slice(0, 4)), parseInt(tx.contractYm.slice(4)) - 1, parseInt(tx.contractDay) || 15);
                            const now = new Date();
                            const isRecent = txDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                            const norm = normalizeAptName(tx.aptName);
                            const t = typeMap[norm]?.[String(tx.area)];
                            const label = t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : null;
                            const badgeEl = (() => {
                              if (!label) return <span className="text-xs">{tx.areaPyeong}평</span>;
                              const m = label.match(/\d+/);
                              const group = m ? Math.round(parseInt(m[0]) / 3) : 0;
                              const cIdx = (groupColorIdx.get(group) ?? 0) % colors.length;
                              const [tc, bgc] = colors[cIdx];
                              return <span className={`font-bold ${tc} ${bgc} px-1.5 py-0.5 rounded text-xs`} title={`${tx.areaPyeong}평`}>{label}</span>;
                            })();
                            return (
                              <tr key={idx} className={`border-b border-[#f2f4f6] hover:bg-white/60 transition-colors ${isRecent ? 'bg-[#f0f7ff]' : ''}`}>
                                <td className={`py-3 pl-2 ${isRecent ? 'text-[#191f28] font-bold' : 'text-[#4e5968]'}`}>
                                  {isRecent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3182f6] mr-1.5 mb-[1px]" />}
                                  {tx.contractYm.slice(0,4)}.{tx.contractYm.slice(4)}.{tx.contractDay}
                                </td>
                                <td className={`py-3 pr-2 text-right font-extrabold ${isRecent ? 'text-[#3182f6]' : 'text-[#191f28]'}`}>{tx.priceEok}</td>
                                <td className="py-3 text-center">{badgeEl}</td>
                                <td className="py-3 text-center text-[#4e5968]">{tx.floor}층</td>
                                <td className="py-3 pr-2 text-right text-[#8b95a1]">{tx.dealType}</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : (
                <div className="bg-[#f9fafb] rounded-2xl p-8 flex items-center justify-center ring-1 ring-black/5 h-full min-h-[200px]">
                  <span className="text-[#8b95a1] text-sm font-bold">매매 기록이 없습니다</span>
                </div>
              )}
            </div>

            {/* Right: Title + Chart — mobile: 1번째, desktop: 2번째 (60%) */}
             <div className="w-full md:w-[60%] flex flex-col order-1 md:order-2">
               <div className="flex items-center gap-2 mb-3">
                 <span className="bg-[#3182f6] text-white text-sm font-bold px-3 py-1 rounded-full">{report.dong || '동탄'}</span>
               </div>
               <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-2 text-[#191f28]">{report.apartmentName}</h1>

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

                 // 층수별 색상 — 해당 아파트 최고층 대비 비율로 동적 분류
                 const maxFloor = Math.max(...scatterData.map(d => d.floor), 1);
                 const lowCut = Math.ceil(maxFloor / 3);
                 const midCut = Math.ceil((maxFloor * 2) / 3);
                 const getFloorColor = (floor: number) => {
                   if (floor >= midCut) return '#EF4444'; // 고층 = 빨강
                   if (floor >= lowCut) return '#3182f6'; // 중층 = 파랑
                   return '#03c75a'; // 저층 = 초록
                 };
                 const getFloorTier = (floor: number): 'low' | 'mid' | 'high' => {
                   if (floor >= midCut) return 'high';
                   if (floor >= lowCut) return 'mid';
                   return 'low';
                 };

                 // 월별 층별 평균 + 거래량
                 const byMonthTier = new Map<number, { low: number[]; mid: number[]; high: number[]; all: number[] }>();
                 scatterData.forEach(d => {
                   if (!byMonthTier.has(d.yearMonth)) byMonthTier.set(d.yearMonth, { low: [], mid: [], high: [], all: [] });
                   const bucket = byMonthTier.get(d.yearMonth)!;
                   bucket[getFloorTier(d.floor)].push(d.price);
                   bucket.all.push(d.price);
                 });
                 const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 1000) / 1000 : undefined;
                 const monthlyData = Array.from(byMonthTier.entries())
                   .map(([ym, buckets]) => ({
                     ts: new Date(Math.floor(ym / 100), (ym % 100) - 1, 15).getTime(),
                     monthAvg: avg(buckets.all)!,
                     lowAvg: avg(buckets.low),
                     midAvg: avg(buckets.mid),
                     highAvg: avg(buckets.high),
                     volume: buckets.all.length, ym,
                     bandHigh, bandLow,
                   }))
                   .sort((a, b) => a.ts - b.ts);

                 const prices = scatterData.map(d => d.price);
                 let minP = Infinity, maxP = -Infinity, sumP = 0;
                 for (const p of prices) { if (p < minP) minP = p; if (p > maxP) maxP = p; sumP += p; }
                 const domainMin = Math.floor(minP * 10) / 10 - 0.3;
                 const domainMax = Math.ceil(maxP * 10) / 10 + 0.5;
                 const maxVol = Math.max(...monthlyData.map(d => d.volume), 1);
                 const latestAvg = monthlyData[monthlyData.length - 1]?.monthAvg || (prices.length > 0 ? sumP / prices.length : 0);
                 const firstAvg = monthlyData[0]?.monthAvg || latestAvg;
                 const changePercent = firstAvg > 0 ? ((latestAvg - firstAvg) / firstAvg * 100) : 0;

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
                     <div className="flex items-center gap-3 mb-4">
                       <span className="text-[24px] font-extrabold text-[#191f28]">
                         {latestAvg >= 1 ? `${Math.floor(latestAvg)}억` : ''}{(() => { const rem = Math.round((latestAvg % 1) * 10000); return rem > 0 ? rem.toLocaleString() : ''; })()}
                       </span>
                       {yoyChange !== null && (
                         <span className="text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-1 rounded-lg">
                           전년 대비 {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                         </span>
                       )}
                       <span className="text-[12px] text-[#8b95a1] font-medium">{scatterData.length}건 · 최고 {maxP.toFixed(1)}억 · 최저 {minP.toFixed(1)}억</span>
                     </div>
                     <div className="h-[300px] relative">
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
                               const vol = item?.volume;
                               return (
                                 <div style={{ background: '#1e293b', borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: 'none' }}>
                                   <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>
                                     {new Date(item?.ts).getFullYear()}.{String(new Date(item?.ts).getMonth()+1).padStart(2,'0')}월
                                   </div>
                                   {item?.highAvg && <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>고층 {item.highAvg.toFixed(2)}억</div>}
                                   {item?.midAvg && <div style={{ color: '#3182f6', fontSize: 12, fontWeight: 700 }}>중층 {item.midAvg.toFixed(2)}억</div>}
                                   {item?.lowAvg && <div style={{ color: '#03c75a', fontSize: 12, fontWeight: 700 }}>저층 {item.lowAvg.toFixed(2)}억</div>}
                                   {vol != null && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>거래 {vol}건</div>}
                                 </div>
                               );
                             }}
                             cursor={{ stroke: '#d1d6db', strokeWidth: 1, strokeDasharray: '3 3' }}
                           />
                           {/* 가격 밴드 (P5~P95) */}
                           <Area type="monotone" dataKey="bandHigh" yAxisId="price" stroke="none" fill="url(#bandGrad)" fillOpacity={1} dot={false} activeDot={false} isAnimationActive={false} />
                           {/* 거래량 막대그래프 */}
                           <Bar dataKey="volume" yAxisId="volume" fill="#e5e8eb" radius={[2, 2, 0, 0]} maxBarSize={12} opacity={0.6} isAnimationActive={false} />
                           {/* 저층 월별 평균선 — 점점선 */}
                           <Line type="monotone" dataKey="lowAvg" yAxisId="price" stroke="#03c75a" strokeWidth={2.5} strokeDasharray="2 3" dot={false} activeDot={false} connectNulls isAnimationActive={false} />
                           {/* 중층 월별 평균선 — 점선 */}
                           <Line type="monotone" dataKey="midAvg" yAxisId="price" stroke="#3182f6" strokeWidth={2.5} strokeDasharray="6 3" dot={false} activeDot={false} connectNulls isAnimationActive={false} />
                           {/* 고층 월별 평균선 — 실선 */}
                           <Line type="monotone" dataKey="highAvg" yAxisId="price" stroke="#EF4444" strokeWidth={2.5} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
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
                         const typeData = typeMap[aptKey]?.[String(d.rawArea)];
                        const typeName = typeData ? (areaUnit === 'm2' ? typeData.typeM2 : (typeData.typePyeong || typeData.typeM2)) : undefined;
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
                     {/* 범례 */}
                     <div className="flex items-center gap-4 mt-2 px-1 text-[13px] font-bold text-[#8b95a1]">
                       <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dotted border-[#03c75a]"/>저층 (1~{lowCut - 1}F)</span>
                       <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-[#3182f6]"/>중층 ({lowCut}~{midCut - 1}F)</span>
                       <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-[#EF4444] rounded"/>고층 ({midCut}F~)</span>
                       <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#e5e8eb] rounded-sm"/>거래량</span>
                     </div>
                   </div>
                 );
               })()}
            </div>

          </div>

          {/* ── 평형별 최근 거래가 · 트렌드 · 활성도 ── (Full-width below chart) */}
          {transactions.length > 0 && (() => {
            const now = new Date();
            const aptNorm = normalizeAptName(report.apartmentName);

            // 1) 평형별 최근 거래가 그룹핑
            const byArea = new Map<string, { label: string; price: string; count: number; latestYm: number }>();
            transactions.forEach(tx => {
              const key = String(tx.area);
              const typeData = typeMap[aptNorm]?.[key];
              const typeName = typeData ? (areaUnit === 'm2' ? typeData.typeM2 : (typeData.typePyeong || typeData.typeM2)) : undefined;
              const label = typeName || `${tx.areaPyeong}평`;
              const ym = parseInt(tx.contractYm);
              const existing = byArea.get(key);
              if (!existing || ym > existing.latestYm) {
                byArea.set(key, { label, price: tx.priceEok, count: (existing?.count || 0) + 1, latestYm: ym });
              } else {
                existing.count++;
              }
            });
            const areaCards = Array.from(byArea.values())
              .sort((a, b) => b.count - a.count);

            // 2) 최근 3개월 vs 이전 3개월 트렌드
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            const ymThree = threeMonthsAgo.getFullYear() * 100 + (threeMonthsAgo.getMonth() + 1);
            const ymSix = sixMonthsAgo.getFullYear() * 100 + (sixMonthsAgo.getMonth() + 1);
            const recent3 = transactions.filter(tx => parseInt(tx.contractYm) >= ymThree);
            const prev3 = transactions.filter(tx => { const ym = parseInt(tx.contractYm); return ym >= ymSix && ym < ymThree; });
            const avg3 = recent3.length > 0 ? recent3.reduce((s, t) => s + t.price, 0) / recent3.length : 0;
            const avgPrev3 = prev3.length > 0 ? prev3.reduce((s, t) => s + t.price, 0) / prev3.length : 0;
            const trendPct = avgPrev3 > 0 ? ((avg3 - avgPrev3) / avgPrev3 * 100) : null;
            const avg3Eok = avg3 >= 10000
              ? `${Math.floor(avg3 / 10000)}억${(avg3 % 10000) > 0 ? (avg3 % 10000).toLocaleString() : ''}`
              : `${avg3.toLocaleString()}만`;

            // 3) 거래 활성도 (1/3/6개월)
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const ymOne = oneMonthAgo.getFullYear() * 100 + (oneMonthAgo.getMonth() + 1);
            const cnt1 = transactions.filter(tx => parseInt(tx.contractYm) >= ymOne).length;
            const cnt3 = recent3.length;
            const cnt6 = transactions.filter(tx => parseInt(tx.contractYm) >= ymSix).length;
            const maxCnt = Math.max(cnt1, cnt3, cnt6, 1);

            return (
              <div className="bg-white w-full px-4 md:px-10 pb-6 border-b border-[#e5e8eb]">
                <h5 className="text-[13px] font-bold text-[#8b95a1] mb-3 flex items-center gap-1.5">
                  평형별 최근 거래가
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* 평형별 카드 */}
                  {areaCards.map((c, i) => (
                    <div key={i} className="bg-[#f9fafb] rounded-xl px-3.5 py-3 ring-1 ring-black/5 hover:ring-[#3182f6]/30 transition-all">
                      <div className="text-[11px] font-bold text-[#3182f6] bg-[#e8f3ff] inline-block px-2 py-0.5 rounded-md mb-1.5">{c.label}</div>
                      <div className="text-[15px] font-extrabold text-[#191f28] leading-tight">{c.price}</div>
                      <div className="text-[11px] text-[#8b95a1] mt-0.5">{c.count}건</div>
                    </div>
                  ))}

                  {/* 3개월 평균 카드 */}
                  {recent3.length > 0 && (
                    <div className="bg-[#f9fafb] rounded-xl px-3.5 py-3 ring-1 ring-black/5">
                      <div className="text-[11px] font-bold text-[#8b95a1] mb-1.5">최근 3개월 평균</div>
                      <div className="text-[15px] font-extrabold text-[#191f28] leading-tight">{avg3Eok}</div>
                      {trendPct !== null && (
                        <div className={`text-[11px] font-bold mt-1 ${trendPct >= 0 ? 'text-[#EF4444]' : 'text-[#3182f6]'}`}>
                          전분기 대비 {trendPct > 0 ? '+' : ''}{trendPct.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  )}

                  {/* 거래 활성도 카드 */}
                  <div className="bg-[#f9fafb] rounded-xl px-3.5 py-3 ring-1 ring-black/5 col-span-2 sm:col-span-1">
                    <div className="text-[11px] font-bold text-[#8b95a1] mb-2">거래 활성도</div>
                    <div className="space-y-1.5">
                      {[
                        { label: '1개월', count: cnt1 },
                        { label: '3개월', count: cnt3 },
                        { label: '6개월', count: cnt6 },
                      ].map(({ label, count }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#4e5968] w-[36px] shrink-0">{label}</span>
                          <div className="flex-1 bg-[#e5e8eb] rounded-full h-[6px] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#3182f6] to-[#6dd5fa] transition-all duration-500"
                              style={{ width: `${Math.max((count / maxCnt) * 100, count > 0 ? 8 : 0)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-extrabold text-[#191f28] w-[28px] text-right shrink-0">{count}건</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sticky Section Nav — stub이면 숨김 */}
          {!isStub && (
          <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] px-4 py-2.5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[1000px] mx-auto">
              {['밸류에이션', '동적 시뮬레이터', '현장 사진', '이 아파트 이야기'].map((label, idx) => {
                const ids = ['sec-premium', 'sec-simulator', 'sec-photos', 'sec-comments'];
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
          <div className={`${inline ? 'px-2 py-2 md:px-6 md:py-4' : 'px-2 py-2 md:px-3 md:py-3'} flex flex-col gap-8 w-full`}>



            {/* ── PAYWALL GATE — 비활성화 (프리미엄 콘텐츠 전면 공개 중) ──
             * TODO: 유료 모델 전환 시 이 블록 복원
             * 원본: isPurchased/isAdmin 체크 후 PaymentButton 표시
             */}

            {/* 0. Premium Score Analysis — Gated behind paywall */}
            {isUnlocked && (
              isLoadingDetail ? (
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
                report.premiumScores ? (
                  <div id="sec-premium" className="mb-2 scroll-mt-14">
                    <PropertyScoreChart scores={report.premiumScores} />
                  </div>
                ) : null
              )
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
                <div id="sec-simulator" className="mb-2 scroll-mt-14">
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
                      <div className="text-[13px] font-bold text-[#03c75a] mb-1">학원 (500m)</div>
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
                      <div className="text-[11px] font-bold text-[#f59e0b] mb-1">🍽️ 음식점·카페 (500m)</div>
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
                              <span className="text-[#4e5968]">학원 밀집도 (500m)</span>
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
                                <span className="text-[#4e5968]">음식점·카페 (500m)</span>
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

                            {/* 앵커 테넌트 */}
                            <div className="mt-4 pt-3 border-t border-[#f2f4f6]">
                              <h4 className="text-[12px] font-bold text-[#8b95a1] mb-2 flex items-center gap-1.5">🎯 핵심 앵커 테넌트 (최단거리)</h4>
                              <div className="flex flex-wrap gap-2">
                                {report.metrics.distanceToStarbucks != null && (
                                  <div className="bg-[#f2f4f6] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#4e5968] flex items-center gap-1">
                                    ☕ 스타벅스 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToStarbucks}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToOliveYoung != null && (
                                  <div className="bg-[#f2f4f6] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#4e5968] flex items-center gap-1">
                                    💄 올리브영 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToOliveYoung}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToDaiso != null && (
                                  <div className="bg-[#f2f4f6] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#4e5968] flex items-center gap-1">
                                    🛍️ 다이소 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToDaiso}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToSupermarket != null && (
                                  <div className="bg-[#f2f4f6] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#4e5968] flex items-center gap-1">
                                    🛒 대형마트 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToSupermarket}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToMcDonalds != null && (
                                  <div className="bg-[#f2f4f6] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#4e5968] flex items-center gap-1">
                                    🍔 맥도날드 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToMcDonalds}m</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Anchor Tenant Metrics — 앵커 테넌트 인접도 시각화 */}
            {report.metrics && (
              <AnchorTenantCard
                distanceToStarbucks={report.metrics.distanceToStarbucks}
                distanceToOliveYoung={report.metrics.distanceToOliveYoung}
                distanceToDaiso={report.metrics.distanceToDaiso}
                distanceToSupermarket={report.metrics.distanceToSupermarket}
                distanceToMcDonalds={report.metrics.distanceToMcDonalds}
              />
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
            <CommentSection
              comments={comments}
              commentInput={commentInput}
              onCommentChange={onCommentChange}
              onSubmitComment={onSubmitComment}
              user={user}
              isUnlocked={isUnlocked}
            />

          </div>
          )}
    </>
  );

  // ── Return: inline panel vs modal overlay ──
  if (inline) {
    return (
      <div ref={modalRef} className="bg-white h-full flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden">
        {content}
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
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 md:p-12 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-[#191f28]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div ref={modalRef} className={`relative bg-[#f2f4f6] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] max-h-[90vh] rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5`}>
          <button onClick={onClose} className="sticky top-4 z-20 ml-auto mr-4 mt-4 -mb-14 bg-[#191f28]/80 hover:bg-[#191f28] text-white w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0">
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

