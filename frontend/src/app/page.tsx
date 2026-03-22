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

const PaymentButton = dynamic(() => import('@/components/PaymentButton'), { ssr: false });

import { useDashboardData, dashboardFacade, CommentData, FieldReportData, UserReview } from '@/lib/DashboardFacade';
import WriteReviewModal from '@/components/WriteReviewModal';
import { DONGS, getDongByName, getDongColor, getAllDongNames } from '@/lib/dongs';
import { ZONES } from '@/lib/zones';
import { TX_SUMMARY } from '@/lib/transaction-summary';
import { buildInitialApartments } from '@/lib/dong-apartments';

interface StaticApartment { name: string; dong: string; householdCount?: number; yearBuilt?: string; brand?: string; }
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
                  ? 'bg-[#EDF2F4] text-[#EDF2F4] border-[#EDF2F4]'
                  : 'bg-[#1B2340] text-[#8D99AE] border-[#2A3558] hover:border-[#8D99AE] hover:text-[#8D99AE]'
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
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-[#1E2A45] shadow-sm"
            onClick={() => onImageClick(img.url)}
          >
            <img
              src={img.url}
              alt={img.caption || img.locationTag || `Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover bg-[#0E1730] group-hover:scale-105 transition-transform duration-300"
            />
            {/* Hover overlay with caption + tag */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#EDF2F4]/90 bg-[#1B2340]/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                  {tagLabels[img.locationTag || ''] || img.locationTag || '기타'}
                </span>
                {img.isPremium && (
                  <span className="text-[9px] font-bold bg-[#ffc107] text-[#EDF2F4] px-1.5 py-0.5 rounded-md">★ PRO</span>
                )}
              </div>
              {img.caption && (
                <p className="text-[11px] text-[#EDF2F4]/90 mt-1 line-clamp-2">{img.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[#6B7394] text-[13px]">이 카테고리에 등록된 사진이 없습니다.</div>
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
        <div className="absolute inset-0 bg-[#EDF2F4]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div ref={modalRef} className={`relative bg-[#0E1730] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] max-h-[90vh] rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5`}>
          <button onClick={onClose} className="sticky top-4 z-20 ml-auto mr-4 mt-4 -mb-14 bg-[#EDF2F4]/80 hover:bg-[#EDF2F4] text-[#EDF2F4] w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0">
            <X size={20} />
          </button>

          {/* Hero Section — Layout: 40% table / 60% chart */}
          <div className="bg-[#1B2340] w-full flex flex-col md:flex-row p-4 md:p-10 gap-4 md:gap-8 rounded-t-3xl shrink-0 pt-4 md:pt-8 border-b border-[#1E2A45]">
            
            {/* Left: 실거래가 전체 리스트 — mobile: 2번째, desktop: 1번째 (40%) */}
            <div className="w-full md:w-[40%] shrink-0 order-2 md:order-1 flex flex-col">
              {transactions.length > 0 ? (
                <div className="bg-[#141C33] rounded-2xl p-4 ring-1 ring-black/5 h-full flex flex-col">
                  <h4 className="text-[13px] font-bold text-[#6B7394] mb-3 flex items-center gap-1.5 shrink-0">
                    <TrendingUp size={13} className="text-[#03c75a]" />
                    실거래가 내역 <span className="text-[11px] ml-1">{transactions.length}건</span>
                  </h4>
                  <div className="flex-1">
                    <table className="w-full text-[13px]">
                      <thead className="sticky top-0 bg-[#141C33]">
                        <tr className="border-b border-[#1E2A45] text-[#6B7394]">
                          <th className="py-3 text-left font-bold">거래일</th>
                          <th className="py-3 text-right font-bold">금액</th>
                          <th className="py-3 text-right font-bold">면적</th>
                          <th className="py-3 text-right font-bold">층</th>
                          <th className="py-3 text-right font-bold">유형</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isTxExpanded ? transactions : transactions.slice(0, 10)).map((tx, idx) => (
                          <tr key={idx} className={`border-b border-[#0E1730] hover:bg-[#1B2340]/60 transition-colors ${idx < 3 ? 'bg-[#f0f7ff]' : ''}`}>
                            <td className={`py-3 ${idx < 3 ? 'text-[#EDF2F4] font-bold' : 'text-[#8D99AE]'}`}>
                              {idx < 3 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8D99AE] mr-1.5 mb-[1px]" />}
                              {tx.contractYm.slice(0,4)}.{tx.contractYm.slice(4)}.{tx.contractDay}
                            </td>
                            <td className={`py-3 text-right font-extrabold ${idx < 3 ? 'text-[#8D99AE]' : 'text-[#EDF2F4]'}`}>{tx.priceEok}</td>
                            <td className="py-3 text-right text-[#8D99AE]">{(() => { const norm = normalizeAptName(tx.aptName); const t = typeMap[norm]?.[String(tx.area)]; return t ? <span className="font-bold text-[#8D99AE] bg-[#141C33] px-1.5 py-0.5 rounded text-[10px]">{t}</span> : `${tx.areaPyeong}평`; })()}</td>
                            <td className="py-3 text-right text-[#8D99AE]">{tx.floor}층</td>
                            <td className="py-3 text-right text-[#6B7394]">{tx.dealType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {transactions.length > 10 && (
                      <button
                        onClick={() => setIsTxExpanded(!isTxExpanded)}
                        className="w-full mt-2 py-2 text-[12px] font-bold text-[#8D99AE] hover:bg-[#141C33] rounded-lg transition-colors"
                      >
                        {isTxExpanded ? '접기 ▲' : `나머지 ${transactions.length - 10}건 더보기 ▼`}
                      </button>
                    )}
                  </div>

                  {/* ── 거래 요약 통계 ── */}
                  {(() => {
                    const now = new Date();
                    const aptNorm = normalizeAptName(report.apartmentName);

                    // 1) 평형별 최근 거래가 그룹핑
                    const byArea = new Map<string, { label: string; price: string; count: number; latestYm: number }>();
                    transactions.forEach(tx => {
                      const key = String(tx.area);
                      const typeName = typeMap[aptNorm]?.[key];
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
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 4);

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
                      <div className="mt-3 space-y-3">
                        {/* 평형별 최근가 */}
                        <div>
                          <h5 className="text-[11px] font-bold text-[#6B7394] mb-2">평형별 최근 거래가</h5>
                          <div className="grid grid-cols-2 gap-1.5">
                            {areaCards.map((c, i) => (
                              <div key={i} className="bg-[#1B2340] rounded-lg px-2.5 py-2 ring-1 ring-black/5">
                                <div className="text-[10px] font-bold text-[#8D99AE] bg-[#141C33] inline-block px-1.5 py-0.5 rounded mb-1">{c.label}</div>
                                <div className="text-[13px] font-extrabold text-[#EDF2F4] leading-tight">{c.price}</div>
                                <div className="text-[10px] text-[#6B7394]">{c.count}건</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 거래 트렌드 */}
                        {recent3.length > 0 && (
                          <div className="bg-[#1B2340] rounded-lg px-3 py-2.5 ring-1 ring-black/5">
                            <div className="text-[11px] font-bold text-[#6B7394] mb-1">최근 3개월 평균</div>
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-extrabold text-[#EDF2F4]">{avg3Eok}</span>
                              {trendPct !== null && (
                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${trendPct >= 0 ? 'text-[#EF4444] bg-[#fef2f2]' : 'text-[#8D99AE] bg-[#141C33]'}`}>
                                  전분기 대비 {trendPct > 0 ? '+' : ''}{trendPct.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 거래 활성도 */}
                        <div className="bg-[#1B2340] rounded-lg px-3 py-2.5 ring-1 ring-black/5">
                          <div className="text-[11px] font-bold text-[#6B7394] mb-2">거래 활성도</div>
                          <div className="space-y-1.5">
                            {[
                              { label: '1개월', count: cnt1 },
                              { label: '3개월', count: cnt3 },
                              { label: '6개월', count: cnt6 },
                            ].map(({ label, count }) => (
                              <div key={label} className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[#8D99AE] w-[36px] shrink-0">{label}</span>
                                <div className="flex-1 bg-[#0E1730] rounded-full h-[6px] overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#8D99AE] to-[#6dd5fa] transition-all duration-500"
                                    style={{ width: `${Math.max((count / maxCnt) * 100, count > 0 ? 8 : 0)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-extrabold text-[#EDF2F4] w-[28px] text-right shrink-0">{count}건</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-[#141C33] rounded-2xl p-8 flex items-center justify-center ring-1 ring-black/5 h-full min-h-[200px]">
                  <span className="text-[#6B7394] text-[13px] font-bold">매매 기록이 없습니다</span>
                </div>
              )}
            </div>

            {/* Right: Title + Chart — mobile: 1번째, desktop: 2번째 (60%) */}
            <div className="w-full md:w-[60%] flex flex-col order-1 md:order-2">
               <div className="flex items-center gap-2 mb-3">
                 <span className="bg-[#8D99AE] text-[#EDF2F4] text-[13px] font-bold px-3 py-1 rounded-full">{report.dong || '동탄'}</span>
               </div>
               <h1 className="text-[22px] sm:text-[28px] md:text-[36px] font-extrabold leading-tight tracking-tight mb-2 text-[#EDF2F4]">{report.apartmentName}</h1>

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
                   if (floor >= lowCut) return '#8D99AE'; // 중층 = 파랑
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
                   <div className="mt-4 bg-[#1B2340] rounded-2xl p-5 ring-1 ring-black/5 flex-1">
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="text-[14px] font-extrabold text-[#EDF2F4] flex items-center gap-1.5">
                         <TrendingUp size={15} className="text-[#8D99AE]" /> 매매가 추이
                       </h4>
                       <div className="flex items-center gap-1">
                         {(['6M','1Y','3Y','ALL'] as const).map(tf => (
                           <button key={tf} onClick={() => setChartTimeframe(tf)}
                             className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                               chartTimeframe === tf ? 'bg-[#EDF2F4] text-[#EDF2F4]' : 'text-[#6B7394] hover:bg-[#0E1730]'
                             }`}>{tf}</button>
                         ))}
                       </div>
                     </div>
                     <div className="flex items-center gap-3 mb-4">
                       <span className="text-[24px] font-extrabold text-[#EDF2F4]">
                         {latestAvg >= 1 ? `${Math.floor(latestAvg)}억` : ''}{(() => { const rem = Math.round((latestAvg % 1) * 10000); return rem > 0 ? rem.toLocaleString() : ''; })()}
                       </span>
                       {yoyChange !== null && (
                         <span className="text-[11px] font-bold text-[#6B7394] bg-[#0E1730] px-2 py-1 rounded-lg">
                           전년 대비 {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                         </span>
                       )}
                       <span className="text-[12px] text-[#6B7394] font-medium">{scatterData.length}건 · 최고 {maxP.toFixed(1)}억 · 최저 {minP.toFixed(1)}억</span>
                     </div>
                     <div className="h-[300px] relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                           <defs>
                             <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#8D99AE" stopOpacity={0.08}/>
                               <stop offset="95%" stopColor="#8D99AE" stopOpacity={0.01}/>
                             </linearGradient>
                             <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="0%" stopColor="#1E2A45" stopOpacity={0.3}/>
                               <stop offset="100%" stopColor="#1E2A45" stopOpacity={0.05}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#0E1730" vertical={false} />
                           <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']}
                             tick={{ fill: '#6B7394', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: '#1E2A45' }}
                             tickLine={false} tickMargin={6}
                             tickFormatter={(ts: number) => { const d = new Date(ts); return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth()+1).padStart(2,'0')}`; }}
                           />
                           <YAxis yAxisId="price" orientation="left" domain={[Math.max(0, domainMin), domainMax]}
                             tick={{ fill: '#6B7394', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false}
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
                                   {item?.midAvg && <div style={{ color: '#8D99AE', fontSize: 12, fontWeight: 700 }}>중층 {item.midAvg.toFixed(2)}억</div>}
                                   {item?.lowAvg && <div style={{ color: '#03c75a', fontSize: 12, fontWeight: 700 }}>저층 {item.lowAvg.toFixed(2)}억</div>}
                                   {vol != null && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>거래 {vol}건</div>}
                                 </div>
                               );
                             }}
                             cursor={{ stroke: '#2A3558', strokeWidth: 1, strokeDasharray: '3 3' }}
                           />
                           {/* 가격 밴드 (P5~P95) */}
                           <Area type="monotone" dataKey="bandHigh" yAxisId="price" stroke="none" fill="url(#bandGrad)" fillOpacity={1} dot={false} activeDot={false} />
                           {/* 거래량 막대그래프 */}
                           <Bar dataKey="volume" yAxisId="volume" fill="#1E2A45" radius={[2, 2, 0, 0]} maxBarSize={12} opacity={0.6} />
                           {/* 저층 월별 평균선 — 점점선 */}
                           <Line type="monotone" dataKey="lowAvg" yAxisId="price" stroke="#03c75a" strokeWidth={2.5} strokeDasharray="2 3" dot={false} activeDot={false} connectNulls />
                           {/* 중층 월별 평균선 — 점선 */}
                           <Line type="monotone" dataKey="midAvg" yAxisId="price" stroke="#8D99AE" strokeWidth={2.5} strokeDasharray="6 3" dot={false} activeDot={false} connectNulls />
                           {/* 고층 월별 평균선 — 실선 */}
                           <Line type="monotone" dataKey="highAvg" yAxisId="price" stroke="#EF4444" strokeWidth={2.5} dot={false} activeDot={false} connectNulls />
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
                     {/* 범례 */}
                     <div className="flex items-center gap-4 mt-2 px-1 text-[10px] font-bold text-[#6B7394]">
                       <span className="flex items-center gap-1"><span className="w-5 border-t-2 border-dotted border-[#03c75a]"/>저층 (1~{lowCut - 1}F)</span>
                       <span className="flex items-center gap-1"><span className="w-5 border-t-2 border-dashed border-[#8D99AE]"/>중층 ({lowCut}~{midCut - 1}F)</span>
                       <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-[#EF4444] rounded"/>고층 ({midCut}F~)</span>
                       <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#1E2A45] rounded-sm"/>거래량</span>
                     </div>
                   </div>
                 );
               })()}
            </div>

          </div>

          {/* Sticky Section Nav — stub이면 숨김 */}
          {!isStub && (
          <nav className="sticky top-0 z-10 bg-[#1B2340]/95 backdrop-blur-md border-b border-[#1E2A45] px-4 py-2.5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[1000px] mx-auto">
              {['밸류에이션', '동적 시뮬레이터', '현장 사진', '이 아파트 이야기'].map((label, idx) => {
                const ids = ['sec-premium', 'sec-simulator', 'sec-photos', 'sec-comments'];
                return (
                  <button
                    key={ids[idx]}
                    onClick={() => scrollToSection(ids[idx])}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg border border-[#1E2A45] bg-[#141C33] text-[12px] font-bold text-[#8D99AE] hover:bg-[#EDF2F4] hover:text-[#EDF2F4] hover:border-[#EDF2F4] active:scale-95 transition-all duration-150"
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
          <div className="px-2 py-2 md:px-3 md:py-3 flex flex-col gap-8 w-full">



            {/* ── PAYWALL GATE ── Premium content below this line */}
            {!isUnlocked && (
              <div className="relative bg-[#1B2340] rounded-3xl p-8 md:p-10 shadow-sm text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#8D99AE]/10 to-[#4A6CF7]/20 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8D99AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3 className="text-[20px] font-extrabold text-[#EDF2F4] mb-2">프리미엄 리포트</h3>
                <p className="text-[14px] text-[#8D99AE] mb-1">밸류에이션 분석, 상세 인프라 데이터, 현장 사진 갤러리,</p>
                <p className="text-[14px] text-[#8D99AE] mb-6">단지 명세, 종합 평가를 확인하세요</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {['밸류에이션', '사진 갤러리', '상세 인프라', '단지 명세', '종합 결론'].map(tag => (
                    <span key={tag} className="bg-[#141C33] text-[#8D99AE] text-[12px] font-bold px-3 py-1 rounded-full">{tag}</span>
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
                    <p className="text-[13px] text-[#6B7394]">결제하려면 먼저 로그인해주세요</p>
                    <button
                      onClick={() => signInWithPopup(auth, googleProvider)}
                      className="bg-[#EDF2F4] text-[#EDF2F4] font-bold px-6 py-3 rounded-xl hover:bg-[#333d4b] transition-colors flex items-center gap-2"
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
              <div className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm animate-pulse">
                <div className="h-6 bg-[#1E2A45] rounded-lg w-48 mb-6" />
                <div className="space-y-3">
                  <div className="h-4 bg-[#0E1730] rounded w-full" />
                  <div className="h-4 bg-[#0E1730] rounded w-5/6" />
                  <div className="h-4 bg-[#0E1730] rounded w-4/6" />
                  <div className="h-32 bg-[#0E1730] rounded-2xl mt-4" />
                  <div className="h-32 bg-[#0E1730] rounded-2xl" />
                </div>
              </div>
            ) : (
            <>
            {report.premiumScores && (
              <div id="sec-premium" className="mb-2 scroll-mt-14">
                <PropertyScoreChart scores={report.premiumScores} />
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
                <div id="sec-simulator" className="mb-2 scroll-mt-14">
                  <DynamicSimulator scores={report.premiumScores} price84Man={price84} />
                </div>
              ) : null;
            })()}

            {/* Location Infrastructure Info — Enhanced with categories + raw data */}
            {report.metrics && (report.metrics.distanceToElementary || report.metrics.distanceToSubway || report.metrics.academyDensity) && (
              <div className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="text-[18px] font-bold text-[#EDF2F4] flex items-center gap-2 mb-5 border-b border-[#1E2A45] pb-3">
                  <MapPin size={18} className="text-[#8D99AE]"/> 학군·교통·생활 인프라
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.metrics.distanceToElementary > 0 && (
                    <div className="bg-[#141C33] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#6B7394] mb-1">초등학교</div>
                      <div className="text-[22px] font-extrabold text-[#EDF2F4]">{report.metrics.distanceToElementary}<span className="text-[13px] text-[#6B7394] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.elementary && (
                        <div className="text-[10px] text-[#8D99AE] mt-1 truncate">{report.metrics.nearestSchoolNames.elementary}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToMiddle > 0 && (
                    <div className="bg-[#141C33] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#6B7394] mb-1">중학교</div>
                      <div className="text-[22px] font-extrabold text-[#EDF2F4]">{report.metrics.distanceToMiddle}<span className="text-[13px] text-[#6B7394] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.middle && (
                        <div className="text-[10px] text-[#8D99AE] mt-1 truncate">{report.metrics.nearestSchoolNames.middle}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToHigh > 0 && (
                    <div className="bg-[#141C33] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#6B7394] mb-1">고등학교</div>
                      <div className="text-[22px] font-extrabold text-[#EDF2F4]">{report.metrics.distanceToHigh}<span className="text-[13px] text-[#6B7394] ml-0.5">m</span></div>
                      {report.metrics.nearestSchoolNames?.high && (
                        <div className="text-[10px] text-[#8D99AE] mt-1 truncate">{report.metrics.nearestSchoolNames.high}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToSubway > 0 && (
                    <div className="bg-[#141C33] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#8D99AE] mb-1">GTX-A/SRT</div>
                      <div className="text-[22px] font-extrabold text-[#8D99AE]">{report.metrics.distanceToSubway}<span className="text-[13px] text-[#8D99AE]/70 ml-0.5">m</span></div>
                      {report.metrics.nearestStationName && (
                        <div className="text-[10px] text-[#8D99AE]/80 mt-1 truncate">{report.metrics.nearestStationName}</div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToIndeokwon != null && report.metrics.distanceToIndeokwon > 0 && (
                    <div className="bg-[#141C33] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#8D99AE] mb-1">인덕원선</div>
                      <div className="text-[22px] font-extrabold text-[#8D99AE]">{report.metrics.distanceToIndeokwon}<span className="text-[13px] text-[#8D99AE]/70 ml-0.5">m</span></div>
                    </div>
                  )}
                  {report.metrics.distanceToTram != null && report.metrics.distanceToTram > 0 && (
                    <div className="bg-[#141C33] rounded-2xl p-4 text-center">
                      <div className="text-[13px] font-bold text-[#8D99AE] mb-1">동탄트램</div>
                      <div className="text-[22px] font-extrabold text-[#8D99AE]">{report.metrics.distanceToTram}<span className="text-[13px] text-[#8D99AE]/70 ml-0.5">m</span></div>
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
                                <span className="text-[#8D99AE] truncate mr-1">{cat}</span>
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
                                <span className="text-[#8D99AE] truncate mr-1">{cat}</span>
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
                    <summary className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#6B7394] hover:text-[#8D99AE] transition-colors select-none py-2">
                      <span className="w-5 h-5 rounded-full bg-[#0E1730] flex items-center justify-center text-[10px] group-open:rotate-90 transition-transform">▶</span>
                      📊 상세 로우 데이터 보기
                    </summary>
                    <div className="mt-3 bg-[#141C33] rounded-2xl p-5 border border-[#1E2A45] animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-4">
                        {/* 교육 */}
                        <div>
                          <h4 className="text-[12px] font-bold text-[#6B7394] mb-2 flex items-center gap-1.5">🏫 교육</h4>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">초등학교 거리</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.distanceToElementary || '-'}m {report.metrics.nearestSchoolNames?.elementary ? `(${report.metrics.nearestSchoolNames.elementary})` : ''}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">중학교 거리</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.distanceToMiddle || '-'}m {report.metrics.nearestSchoolNames?.middle ? `(${report.metrics.nearestSchoolNames.middle})` : ''}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">고등학교 거리</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.distanceToHigh || '-'}m {report.metrics.nearestSchoolNames?.high ? `(${report.metrics.nearestSchoolNames.high})` : ''}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">학원 밀집도 (500m)</span>
                              <span className="font-bold text-[#03c75a]">{report.metrics.academyDensity || '-'}개</span>
                            </div>
                          </div>
                        </div>
                        {/* 교통 */}
                        <div>
                          <h4 className="text-[12px] font-bold text-[#6B7394] mb-2 flex items-center gap-1.5">🚇 교통</h4>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">GTX-A/SRT역</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.distanceToSubway || '-'}m {report.metrics.nearestStationName ? `(${report.metrics.nearestStationName})` : ''}</span>
                            </div>
                            {report.metrics.distanceToIndeokwon != null && (
                              <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                                <span className="text-[#8D99AE]">인덕원선</span>
                                <span className="font-bold text-[#EDF2F4]">{report.metrics.distanceToIndeokwon}m</span>
                              </div>
                            )}
                            {report.metrics.distanceToTram != null && (
                              <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                                <span className="text-[#8D99AE]">동탄트램</span>
                                <span className="font-bold text-[#EDF2F4]">{report.metrics.distanceToTram}m</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* 단지 정보 */}
                        <div>
                          <h4 className="text-[12px] font-bold text-[#6B7394] mb-2 flex items-center gap-1.5">🏢 단지 정보</h4>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">시공사</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.brand || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">세대수</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.householdCount?.toLocaleString() || '-'}세대</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">준공연도</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.yearBuilt || '-'}년</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">용적률</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.far || '-'}%</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">건폐율</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.bcr || '-'}%</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                              <span className="text-[#8D99AE]">세대당 주차</span>
                              <span className="font-bold text-[#EDF2F4]">{report.metrics.parkingPerHousehold || '-'}대</span>
                            </div>
                          </div>
                        </div>
                        {/* 생활 인프라 */}
                        {report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0 && (
                          <div>
                            <h4 className="text-[12px] font-bold text-[#6B7394] mb-2 flex items-center gap-1.5">🍽️ 생활 인프라</h4>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                              <div className="flex justify-between py-1.5 border-b border-[#0E1730]">
                                <span className="text-[#8D99AE]">음식점·카페 (500m)</span>
                                <span className="font-bold text-[#f59e0b]">{report.metrics.restaurantDensity}개</span>
                              </div>
                            </div>
                            {report.metrics.restaurantCategories && (
                              <div className="mt-2 grid grid-cols-3 gap-1.5">
                                {Object.entries(report.metrics.restaurantCategories)
                                  .sort(([,a], [,b]) => (b as number) - (a as number))
                                  .map(([cat, cnt]) => (
                                    <div key={cat} className="bg-[#1B2340] rounded-lg py-1.5 px-2 text-[11px] border border-[#1E2A45] flex justify-between">
                                      <span className="text-[#8D99AE] truncate">{cat}</span>
                                      <span className="font-bold text-[#f59e0b] ml-1 shrink-0">{cnt as number}</span>
                                    </div>
                                  ))}
                              </div>
                            )}

                            {/* 앵커 테넌트 */}
                            <div className="mt-4 pt-3 border-t border-[#0E1730]">
                              <h4 className="text-[12px] font-bold text-[#6B7394] mb-2 flex items-center gap-1.5">🎯 핵심 앵커 테넌트 (최단거리)</h4>
                              <div className="flex flex-wrap gap-2">
                                {report.metrics.distanceToStarbucks != null && (
                                  <div className="bg-[#0E1730] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#8D99AE] flex items-center gap-1">
                                    ☕ 스타벅스 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToStarbucks}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToOliveYoung != null && (
                                  <div className="bg-[#0E1730] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#8D99AE] flex items-center gap-1">
                                    💄 올리브영 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToOliveYoung}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToDaiso != null && (
                                  <div className="bg-[#0E1730] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#8D99AE] flex items-center gap-1">
                                    🛍️ 다이소 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToDaiso}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToSupermarket != null && (
                                  <div className="bg-[#0E1730] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#8D99AE] flex items-center gap-1">
                                    🛒 대형마트 <span className="text-[#03c75a] font-bold">{report.metrics.distanceToSupermarket}m</span>
                                  </div>
                                )}
                                {report.metrics.distanceToMcDonalds != null && (
                                  <div className="bg-[#0E1730] rounded-full px-2.5 py-1 text-[11px] font-medium text-[#8D99AE] flex items-center gap-1">
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

            {/* Photo Gallery — Category Tab Grid (100+ photos) */}
            {report.images && report.images.length > 0 && (() => {
              const IMAGE_TAG_LABELS: Record<string, string> = {
                'gateImg': '정문', 'landscapeImg': '조경', 'parkingImg': '주차장',
                'maintenanceImg': '공용부', 'communityImg': '커뮤니티', 'schoolImg': '통학로', 'commerceImg': '상권',
              };
              const allTags = ['전체', ...Array.from(new Set(report.images.map(img => img.locationTag || '기타')))];
              return (
                <div id="sec-photos" className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                  <details open>
                    <summary className="text-[20px] font-bold text-[#EDF2F4] flex items-center gap-2 mb-5 border-b border-[#1E2A45] pb-3 cursor-pointer list-none">
                      <Camera size={20} className="text-[#8D99AE]"/>
                      현장 사진 갤러리
                      <span className="text-[13px] font-medium text-[#6B7394] ml-auto">{report.images.length}장</span>
                    </summary>

                    {/* Category Filter Chips */}
                    <GalleryGrid images={report.images} tags={allTags} tagLabels={IMAGE_TAG_LABELS} onImageClick={setFullscreenImage} />
                  </details>
                </div>
              );
            })()}

            {!s ? (
              // Legacy Template Render (Fallback if both schemas are empty)
              <div className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm">
                 <h2 className="text-[20px] font-bold text-[#EDF2F4] mb-6 border-b border-[#1E2A45] pb-3">단지 요약 정보</h2>
                 <div className="flex flex-col gap-4">
                   {(report.pros || report.premiumContent) ? (
                     <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#bbf7d0]">
                       <h3 className="text-[15px] font-extrabold text-[#03c75a] mb-2 flex items-center gap-1.5"><CheckCircle2 size={18}/> 주요 내용 및 총평</h3>
                       <p className="text-[15px] text-[#EDF2F4] leading-relaxed whitespace-pre-wrap">{report.premiumContent || report.pros}</p>
                     </div>
                   ) : (
                     <p className="text-[#6B7394] text-[15px]">데이터가 준비되지 않았습니다.</p>
                   )}
                 </div>
              </div>
            ) : (
              // Advanced Template Render (요약은 위로 이동됨)
              <>

                {/* 2. 단지 기본 명세 (Specs) */}
                <div id="sec-specs" className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#EDF2F4] flex items-center gap-2 mb-6 border-b border-[#1E2A45] pb-3"><Building size={20} className="text-[#8D99AE]"/> 단지 기본 명세</h2>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#141C33] p-4 rounded-xl border border-[#1E2A45]">
                        <p className="text-[12px] text-[#6B7394] font-bold mb-1">준공 연월 / 연차</p>
                        <p className="text-[15px] text-[#EDF2F4] font-medium">{s.specs.builtYear || '-'}</p>
                      </div>
                      <div className="bg-[#141C33] p-4 rounded-xl border border-[#1E2A45]">
                        <p className="text-[12px] text-[#6B7394] font-bold mb-1">규모 (세대/동)</p>
                        <p className="text-[15px] text-[#EDF2F4] font-medium">{s.specs.scale || '-'}</p>
                      </div>
                      <div className="bg-[#141C33] p-4 rounded-xl border border-[#1E2A45]">
                        <p className="text-[12px] text-[#6B7394] font-bold mb-1">용적률 / 건폐율</p>
                        <p className="text-[15px] text-[#EDF2F4] font-medium">{s.specs.farBuild || '-'}</p>
                      </div>
                      <div className="bg-[#141C33] p-4 rounded-xl border border-[#1E2A45]">
                        <p className="text-[12px] text-[#6B7394] font-bold mb-1">세대당 주차 (지하%)</p>
                        <p className="text-[15px] text-[#EDF2F4] font-medium">{s.specs.parkingRatio || '-'}</p>
                      </div>
                   </div>
                </div>

                {/* 3. 물리적 인프라 & 조경 */}
                <div id="sec-infra" className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#EDF2F4] flex items-center gap-2 mb-6 border-b border-[#1E2A45] pb-3"><Camera size={20} className="text-[#8D99AE]"/> 현장 인프라 둘러보기</h2>
                   <div className="flex flex-col gap-8">
                      {/* Gate */}
                      {(s.infra.gateText || s.infra.gateImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.infra.gateImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#0E1730]"><Image src={s.infra.gateImg} alt="진입로/문주" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#EDF2F4] mb-2 bg-[#0E1730] inline-block px-3 py-1 rounded-lg">진입로 및 정문</h4>
                            <p className="text-[15px] text-[#8D99AE] leading-relaxed whitespace-pre-wrap">{s.infra.gateText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Landscaping */}
                      {(s.infra.landscapeText || s.infra.landscapeImg) && (
                        <div className="flex flex-col md:flex-row-reverse gap-6 pt-6 border-t border-[#0E1730]">
                          {s.infra.landscapeImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#0E1730]"><Image src={s.infra.landscapeImg} alt="조경/지형" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#EDF2F4] mb-2 bg-[#0E1730] inline-block px-3 py-1 rounded-lg">단지 조경 및 지형</h4>
                            <p className="text-[15px] text-[#8D99AE] leading-relaxed whitespace-pre-wrap">{s.infra.landscapeText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Parking & Maintenance ... (Skip strict layout for brevity, just render them similarly) */}
                       {(s.infra.parkingText || s.infra.parkingImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#0E1730]">
                          {s.infra.parkingImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#0E1730]"><Image src={s.infra.parkingImg} alt="지하주차장" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#EDF2F4] mb-2 bg-[#0E1730] inline-block px-3 py-1 rounded-lg">지하주차장 인프라</h4>
                            <p className="text-[15px] text-[#8D99AE] leading-relaxed whitespace-pre-wrap">{s.infra.parkingText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 4. Ecosystem */}
                <div id="sec-eco" className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#EDF2F4] flex items-center gap-2 mb-6 border-b border-[#1E2A45] pb-3"><Info size={20} className="text-[#8D99AE]"/> 생활 편의시설 및 거시 입지</h2>
                   <div className="flex flex-col gap-8">
                      {(s.ecosystem.schoolText || s.ecosystem.schoolImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.ecosystem.schoolImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#0E1730]"><Image src={s.ecosystem.schoolImg} alt="학군" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#EDF2F4] mb-2 bg-[#f8f9fa] border border-[#1E2A45] inline-block px-3 py-1 rounded-lg">학군 및 통학로</h4>
                            <p className="text-[15px] text-[#8D99AE] leading-relaxed whitespace-pre-wrap">{s.ecosystem.schoolText}</p>
                          </div>
                        </div>
                      )}
                      {(s.ecosystem.commerceText || s.ecosystem.commerceImg) && (
                        <div className="flex flex-col md:flex-row-reverse gap-6 pt-6 border-t border-[#0E1730]">
                          {s.ecosystem.commerceImg && <div className="relative w-full md:w-[280px] h-[200px] rounded-2xl overflow-hidden shadow-sm bg-[#0E1730]"><Image src={s.ecosystem.commerceImg} alt="상권" fill sizes="280px" className="object-cover" /></div>}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#EDF2F4] mb-2 bg-[#f8f9fa] border border-[#1E2A45] inline-block px-3 py-1 rounded-lg">동네 상권</h4>
                            <p className="text-[15px] text-[#8D99AE] leading-relaxed whitespace-pre-wrap">{s.ecosystem.commerceText}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 5. 최종 결론 */}
                <div id="sec-conclusion" className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
                   <h2 className="text-[20px] font-bold text-[#EDF2F4] flex items-center gap-2 mb-6 border-b border-[#1E2A45] pb-3"><ShieldAlert size={20} className="text-[#8D99AE]"/> 최종 매수 타당성 평가</h2>
                   <div className="flex flex-col gap-4">
                      <div className="bg-[#EDF2F4] p-6 rounded-2xl text-[#EDF2F4]">
                        <h4 className="text-[13px] font-bold text-[#6B7394] mb-2">교통 및 개발 호재</h4>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap mb-4 pb-4 border-b border-white/10">{s.location.trafficText || '-'}</p>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{s.location.developmentText || '-'}</p>
                      </div>
                      <div className="p-6 rounded-2xl border-2 border-[#EDF2F4] bg-[#fdfdfd]">
                        <h4 className="text-[16px] font-extrabold text-[#EDF2F4] mb-2">💡 최종 결론</h4>
                        <p className="text-[15px] text-[#8D99AE] leading-relaxed whitespace-pre-wrap">{s.assessment.synthesis || '-'}</p>
                        
                        {s.assessment.probability && (
                          <div className="mt-6 p-4 bg-[#141C33] rounded-xl flex items-start gap-3">
                             <Radar size={20} className="text-[#8D99AE] shrink-0 mt-0.5" />
                             <div>
                               <h5 className="text-[13px] font-bold text-[#8D99AE] mb-1">향후 가격 전망</h5>
                               <p className="text-[14px] text-[#EDF2F4] leading-snug">{s.assessment.probability}</p>
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
            <div id="sec-comments" className="bg-[#1B2340] rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
              <h2 className="text-[20px] font-bold text-[#EDF2F4] flex items-center gap-2 mb-6 border-b border-[#1E2A45] pb-3">
                <MessageSquare size={20} className="text-[#8D99AE]"/> 
                이 아파트 이야기 <span className="text-[#8D99AE] text-[16px] ml-1">{comments.length}</span>
              </h2>
              
              <div className="flex flex-col gap-6">
                {/* Input Area */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder={user ? "임장기에 대한 생각이나 궁금한 점을 남겨주세요." : "로그인 후 댓글을 남길 수 있습니다."}
                    disabled={!user}
                    className="flex-1 border border-[#1E2A45] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#8D99AE]/20 focus:border-[#8D99AE] disabled:bg-[#0E1730]"
                    value={commentInput}
                    onChange={(e) => onCommentChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSubmitComment();
                    }}
                  />
                  <button 
                    onClick={onSubmitComment}
                    disabled={!user || !commentInput.trim()}
                    className="bg-[#8D99AE] text-[#EDF2F4] px-5 rounded-xl font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    등록
                  </button>
                </div>

                {/* Comment List */}
                <div className="flex flex-col gap-4 mt-2">
                  {comments.length > 0 ? (
                    <>
                      {/* 최신 1개 댓글은 무료 공개 */}
                      {comments.slice(0, 1).map(comment => (
                        <div key={comment.id} className="flex gap-3 bg-[#141C33] p-4 rounded-2xl border border-[#1E2A45]">
                          <div className="w-8 h-8 rounded-full bg-[#1B2340] border border-[#1E2A45] shadow-sm flex items-center justify-center shrink-0">
                             <UserCircle size={16} className="text-[#6B7394]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-bold text-[14px] text-[#EDF2F4]">{comment.author}</span>
                              <span className="text-[12px] text-[#6B7394]">{comment.createdAt}</span>
                            </div>
                            <p className="text-[14px] text-[#8D99AE] leading-relaxed break-all whitespace-pre-wrap">{comment.text}</p>
                          </div>
                        </div>
                      ))}

                      {/* 나머지 댓글: 결제 사용자만 */}
                      {comments.length > 1 && (
                        isUnlocked ? (
                          comments.slice(1).map(comment => (
                            <div key={comment.id} className="flex gap-3 bg-[#141C33] p-4 rounded-2xl border border-[#1E2A45]">
                              <div className="w-8 h-8 rounded-full bg-[#1B2340] border border-[#1E2A45] shadow-sm flex items-center justify-center shrink-0">
                                 <UserCircle size={16} className="text-[#6B7394]" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="font-bold text-[14px] text-[#EDF2F4]">{comment.author}</span>
                                  <span className="text-[12px] text-[#6B7394]">{comment.createdAt}</span>
                                </div>
                                <p className="text-[14px] text-[#8D99AE] leading-relaxed break-all whitespace-pre-wrap">{comment.text}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="relative">
                            {/* 블러 처리된 미리보기 */}
                            <div className="blur-sm opacity-40 pointer-events-none">
                              {comments.slice(1, 3).map(comment => (
                                <div key={comment.id} className="flex gap-3 bg-[#141C33] p-4 rounded-2xl border border-[#1E2A45] mb-3">
                                  <div className="w-8 h-8 rounded-full bg-[#1B2340] border border-[#1E2A45] shadow-sm flex items-center justify-center shrink-0">
                                    <UserCircle size={16} className="text-[#6B7394]" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="h-3 bg-[#1E2A45] rounded w-20 mb-2" />
                                    <div className="h-3 bg-[#1E2A45] rounded w-full" />
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* 페이월 안내 */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-[#1B2340] border border-[#1E2A45] rounded-2xl px-6 py-4 text-center shadow-lg">
                                <p className="text-[14px] font-bold text-[#EDF2F4] mb-1">🔒 {comments.length - 1}개의 이야기가 더 있습니다</p>
                                <p className="text-[12px] text-[#6B7394]">프리미엄 구독으로 모든 이야기를 확인하세요</p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10 text-[#6B7394] text-[14px]">
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
            className="absolute top-6 right-6 text-[#EDF2F4]/50 hover:text-[#EDF2F4] p-2 rounded-full bg-[#1B2340]/10 hover:bg-[#1B2340]/20 transition-colors"
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

  // Apartment data — 정적 import로 즉시 로드
  const sheetApartments = buildInitialApartments();

  // Transaction data — static import, no API call needed
  const [typeMap, setTypeMap] = useState<Record<string, Record<string, string>>>({});

  // Name mapping + public rental — Firestore 메타 보강
  const [nameMapping, setNameMapping] = useState<Record<string, string> | undefined>(undefined);
  const [publicRentalSet, setPublicRentalSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    const firestoreTimeout = setTimeout(() => {
      setNameMapping(prev => prev === undefined ? {} : prev);
    }, 5000);

    getDoc(doc(db, 'settings/apartmentMeta')).then(snap => {
      clearTimeout(firestoreTimeout);
      if (snap.exists()) {
        const data = snap.data() as Record<string, any>;
        const mapping: Record<string, string> = {};
        const rentals = new Set<string>();
        for (const [name, meta] of Object.entries(data)) {
          if (!meta || typeof meta !== 'object' || !meta.dong) continue;
          if (meta.txKey) mapping[name] = meta.txKey;
          if (meta.isPublicRental) rentals.add(name);
        }
        setNameMapping(mapping);
        setPublicRentalSet(rentals);
      } else {
        setNameMapping({});
      }
    }).catch(() => {
      clearTimeout(firestoreTimeout);
      setNameMapping({});
    });
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
      // Track view (fire-and-forget, non-blocking)
      fetch('/api/report-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: selectedReport.id, userEmail: user?.email }),
      }).catch(() => {}); // silently ignore errors
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
    <div className="min-h-screen bg-[#141C33] font-sans selection:bg-[#8D99AE]/20">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#1B2340]/90 backdrop-blur-xl border-b border-[#1E2A45] sticky top-0 z-40 transition-all duration-300">
        <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16 h-14 sm:h-16 flex justify-between items-center">
          {/* Left: Pill Tabs + Branding */}
          <div className="flex items-center gap-3">
            <div className="inline-flex bg-[#0E1730] rounded-full p-1 gap-0.5">
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
                      ? 'bg-[#1B2340] text-[#EDF2F4] shadow-sm'
                      : 'text-[#6B7394] hover:text-[#8D99AE]'
                  }`}
                >
                  <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <span className="text-[17px] text-[#6B7394] font-medium hidden sm:inline">by <span className="font-extrabold text-[#EDF2F4]">임장크루</span></span>
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
              <h2 className="text-[22px] sm:text-[28px] md:text-[36px] font-extrabold text-[#EDF2F4] tracking-tight">
                동탄 아파트 탐색
              </h2>
              <span suppressHydrationWarning className="inline-flex items-center gap-1.5 bg-[#141C33] text-[#8D99AE] text-[12px] sm:text-[13px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
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
            <p className="text-[13px] sm:text-[15px] text-[#6B7394] font-medium">
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
                    ? 'bg-[#EDF2F4] text-[#EDF2F4] shadow-md'
                    : 'bg-[#0E1730] text-[#6B7394] hover:bg-[#1E2A45]'
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
                        ? 'text-[#EDF2F4] shadow-md'
                        : 'bg-[#0E1730] text-[#8D99AE] hover:bg-[#1E2A45]'
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
              <div className="mb-6 bg-[#1B2340] rounded-2xl border border-[#1E2A45] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] sm:text-[18px] font-extrabold text-[#EDF2F4]">{dongInfo.name}</h3>
                  <p className="text-[12px] sm:text-[13px] text-[#6B7394] mt-0.5 line-clamp-2">{dongInfo.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <div className="text-[16px] sm:text-[18px] font-extrabold text-[#EDF2F4]">{dongAptCounts[selectedDong] || 0}</div>
                    <div className="text-[10px] text-[#6B7394] font-bold">아파트</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[16px] sm:text-[18px] font-extrabold text-[#8D99AE]">{dongReportCounts[selectedDong] || 0}</div>
                    <div className="text-[10px] text-[#6B7394] font-bold">리포트</div>
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
                          <h3 className="text-[18px] font-extrabold text-[#EDF2F4]">{dongName}</h3>
                          <span className="text-[12px] text-[#6B7394] font-bold bg-[#0E1730] px-2 py-0.5 rounded-full">{apts.length}개</span>
                          {(dongReportCounts[dongName] || 0) > 0 && (
                            <span className="text-[10px] font-bold bg-[#f0fdf4] text-[#03c75a] px-2 py-0.5 rounded-full">✅ 현장 검증 {dongReportCounts[dongName]}건</span>
                          )}
                          <button 
                            onClick={() => setSelectedDong(dongName)}
                            className="ml-auto text-[12px] font-bold text-[#8D99AE] hover:underline"
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
                              className={`bg-[#1B2340] rounded-2xl border border-[#1E2A45] p-5 transition-all duration-200 group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-[#8D99AE]/30 ${
                                !report && !txSummary ? 'opacity-70' : ''
                              }`}
                            >
                              {/* 상단: 이름 + 뱃지 */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[15px] font-extrabold text-[#EDF2F4] truncate group-hover:text-[#8D99AE] transition-colors">{apt.name}</h4>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {apt.householdCount && <span className="text-[11px] text-[#6B7394]">{apt.householdCount.toLocaleString()}세대</span>}
                                    {apt.yearBuilt && <span className="text-[11px] text-[#6B7394]">· {apt.yearBuilt}년</span>}
                                    {apt.brand && <span className="text-[11px] text-[#6B7394]">· {apt.brand}</span>}
                                  </div>
                                </div>
                                {report && (
                                  <div className="shrink-0 ml-2">
                                    <span className="text-[10px] font-bold bg-[#f0fdf4] text-[#03c75a] px-2 py-0.5 rounded-md">✅ 현장 검증</span>
                                  </div>
                                )}
                                {!report && publicRentalSet.has(apt.name) && (
                                  <div className="shrink-0 ml-2">
                                    <span className="text-[10px] font-bold bg-[#0E1730] text-[#6B7394] px-2 py-0.5 rounded-md">🏠 공공임대</span>
                                  </div>
                                )}
                              </div>

                              {/* 실거래가 요약 (정적 데이터) + 스파크라인 */}
                              {txSummary ? (
                                <div className="bg-[#141C33] rounded-xl px-3 py-2 mt-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-[#6B7394]">최근</span>
                                      <span className="text-[14px] font-extrabold text-[#EDF2F4]">{txSummary.latestPriceEok}</span>
                                      <span className="text-[11px] font-bold text-[#8D99AE]">{txSummary.latestArea}평</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {txSummary.recent && txSummary.recent.length >= 2 && (
                                        <Sparkline data={[...txSummary.recent].reverse().map(r => {
                                          const match = r.priceEok.match(/(\d+)억([\d,]*)/);
                                          if (!match) return 0;
                                          return parseInt(match[1]) * 10000 + parseInt((match[2] || '0').replace(/,/g, ''));
                                        })} width={48} height={16} />
                                      )}
                                      <span className="text-[10px] text-[#6B7394]">{txSummary.txCount}건</span>
                                    </div>
                                  </div>
                                  {txSummary.txCount >= 2 && (
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                                      <span className="text-[#6B7394] font-bold">최고 <span className="text-[#EDF2F4]">{txSummary.maxPriceEok}</span></span>
                                      <span className="text-[#6B7394] font-bold">최저 <span className="text-[#EDF2F4]">{txSummary.minPriceEok}</span></span>
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
                                <div className="text-[11px] text-[#2A3558] mt-2">거래 내역 없음</div>
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
                <h2 className="text-[22px] sm:text-[28px] font-extrabold tracking-tight text-[#EDF2F4] mb-0.5 sm:mb-1">동탄 커뮤니티</h2>
                <p className="text-[13px] sm:text-[15px] text-[#6B7394] font-medium">주민들의 이야기 · 리뷰 · 소식</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => user ? setShowReviewModal(true) : alert('로그인 후 리뷰를 작성할 수 있습니다.')}
                  className="px-3 py-2 bg-[#0E1730] text-[#8D99AE] rounded-xl text-[12px] font-bold flex items-center gap-1.5 hover:bg-[#1E2A45] active:scale-[0.97] transition-all"
                >
                  <Star size={13} />
                  리뷰
                </button>
                <button
                  onClick={() => user ? setShowCompose(true) : alert('로그인 후 글을 작성할 수 있습니다.')}
                  className="px-3 py-2 bg-[#EDF2F4] text-[#EDF2F4] rounded-xl text-[12px] font-bold flex items-center gap-1.5 hover:bg-[#333d4b] active:scale-[0.97] transition-all"
                >
                  <PenLine size={13} />
                  글쓰기
                </button>
              </div>
            </div>

            {/* Profile & Verification Bar */}
            {user && userProfile && (
              <div className="bg-[#1B2340] rounded-2xl border border-[#1E2A45] p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#EDF2F4]">{getDisplayName(userProfile)}</span>
                  {userProfile.verifiedApartment && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#141C33] text-[#8D99AE] px-2 py-0.5 rounded-md">
                      <ShieldCheck size={11} /> {userProfile.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowVerify(true)}
                  className="text-[12px] font-bold text-[#8D99AE] bg-[#141C33] px-3 py-1.5 rounded-lg hover:bg-[#d4e9ff] transition-colors flex items-center gap-1"
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
                  <div key={news.id} onClick={() => router.push(`/lounge/${news.id}`)} className="bg-[#1B2340] rounded-2xl border border-[#1E2A45] px-5 py-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-[16px] font-bold text-[#EDF2F4] leading-snug flex-1">{news.title}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#6B7394]">{news.author} · {news.meta}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[12px] text-[#6B7394]"><Heart size={12} /> {news.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {newsFeed.length > 3 && (
                  <button
                    onClick={() => setActiveTab('lounge')}
                    className="text-[13px] font-bold text-[#8D99AE] hover:underline text-center py-2"
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
                  <div key={review.id} className="bg-[#1B2340] rounded-2xl border border-[#1E2A45] p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-bold text-[#EDF2F4] shrink-0">{review.author}</span>
                        {review.verifiedApartment && review.verificationLevel === 'registry_verified' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#141C33] text-[#8D99AE] px-2 py-0.5 rounded-md shrink-0">
                            <ShieldCheck size={11} /> {review.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                          </span>
                        ) : review.verifiedApartment ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#0E1730] text-[#6B7394] px-2 py-0.5 rounded-md shrink-0">
                            <Shield size={11} /> {review.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-[#6B7394] shrink-0 ml-2">{review.createdAt}</span>
                    </div>
                    <h4 className="text-[15px] font-extrabold text-[#EDF2F4] mb-2 truncate">{review.apartmentName}</h4>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#1E2A45]'} />
                      ))}
                      <span className="text-[12px] font-bold text-[#6B7394] ml-1">{review.rating}.0</span>
                    </div>
                    <p className="text-[14px] text-[#8D99AE] leading-relaxed mb-3">{review.content}</p>
                    {review.photoURL && (
                      <div className="w-full h-48 rounded-xl overflow-hidden mb-3">
                        <img src={review.photoURL} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => dashboardFacade.incrementReviewLike(review.id)}
                        className="flex items-center gap-1 text-[12px] font-bold text-[#6B7394] hover:text-[#EF233C] transition-colors"
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
                          className="flex items-center gap-1 text-[11px] font-bold text-[#6B7394] hover:text-[#EF233C] transition-colors"
                        >
                          <Trash2 size={13} /> 삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : newsFeed.length === 0 && (
              <div className="bg-[#1B2340] rounded-2xl border border-[#1E2A45] p-12 text-center">
                <MessageSquare size={40} className="mx-auto mb-4 text-[#2A3558]" />
                <p className="text-[15px] font-bold text-[#8D99AE] mb-2">아직 소식이 없습니다</p>
                <p className="text-[13px] text-[#6B7394] mb-4">첫 번째 글이나 리뷰를 남겨보세요!</p>
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
              <h2 className="text-[28px] font-extrabold tracking-tight text-[#EDF2F4] mb-1">실시간 동탄라운지</h2>
              <p className="text-[15px] text-[#6B7394] font-medium">동탄 주민들의 솔직한 이야기</p>
            </div>
          </div>

          {/* Profile & Verification Bar */}
          {user && userProfile && (
            <div className="bg-[#1B2340] rounded-2xl border border-[#1E2A45] p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-[#EDF2F4]">{getDisplayName(userProfile)}</span>
                {userProfile.verifiedApartment && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#141C33] text-[#8D99AE] px-2 py-0.5 rounded-md">
                    <ShieldCheck size={11} /> {userProfile.verifiedApartment.replace(/\[.*?\]\s*/, '')}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowVerify(true)}
                className="text-[12px] font-bold text-[#8D99AE] bg-[#141C33] px-3 py-1.5 rounded-lg hover:bg-[#d4e9ff] transition-colors flex items-center gap-1"
              >
                <Building2 size={13} />
                {userProfile?.verifiedApartment ? '변경' : '아파트 인증'}
              </button>
            </div>
          )}

          {/* Feed */}
          <div className="flex flex-col gap-3">
            {newsFeed.length === 0 ? (
              <div className="bg-[#1B2340] rounded-2xl p-12 text-center border border-[#1E2A45]">
                <MessageSquare size={40} className="mx-auto mb-4 text-[#2A3558]" />
                <p className="text-[15px] font-bold text-[#8D99AE]">아직 글이 없습니다</p>
              </div>
            ) : (
              newsFeed.map((news) => (
                <div key={news.id} onClick={() => router.push(`/lounge/${news.id}`)} className="bg-[#1B2340] rounded-2xl border border-[#1E2A45] px-5 py-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-[16px] font-bold text-[#EDF2F4] leading-snug flex-1">{news.title}</h3>
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
                    <span className="text-[13px] text-[#6B7394]">{news.author} · {news.meta}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[12px] text-[#6B7394]"><Heart size={12} /> {news.likes || 0}</span>
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
              className="fixed bottom-6 right-6 w-14 h-14 bg-[#8D99AE] hover:bg-[#1b6de8] text-[#EDF2F4] rounded-full shadow-lg shadow-[#8D99AE]/30 flex items-center justify-center transition-all active:scale-95 z-20"
            >
              <PenLine size={22} />
            </button>
          )}

          {/* Compose Modal */}
          {showCompose && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
              <div className="relative w-full sm:max-w-lg bg-[#1B2340] rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-extrabold text-[#EDF2F4]">익명 글쓰기</h2>
                  <button onClick={() => setShowCompose(false)} className="w-8 h-8 rounded-full bg-[#0E1730] flex items-center justify-center hover:bg-[#1E2A45] transition-colors">
                    <X size={16} className="text-[#8D99AE]" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {['부동산', '교통', '교육', '문화', '자유'].map((cat) => (
                    <button key={cat} onClick={() => setPostCategory(cat)} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${postCategory === cat ? 'bg-[#EDF2F4] text-[#EDF2F4] border-[#EDF2F4]' : 'bg-[#1B2340] text-[#8D99AE] border-[#2A3558] hover:border-[#8D99AE]'}`}>{cat}</button>
                  ))}
                </div>
                <textarea value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="동탄 이야기를 자유롭게 나눠보세요..." rows={3} className="w-full bg-[#141C33] border border-[#2A3558] rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[#8D99AE] focus:bg-[#1B2340] transition-colors resize-none focus:ring-4 focus:ring-[#8D99AE]/10 mb-4" autoFocus />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6B7394]">🎭 {userProfile ? getDisplayName(userProfile) : '익명'}</span>
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
                    className="flex items-center gap-2 px-6 py-3 bg-[#8D99AE] hover:bg-[#1b6de8] disabled:bg-[#2A3558] text-[#EDF2F4] rounded-xl font-bold text-[14px] transition-all active:scale-95"
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
              <div className="relative w-full sm:max-w-lg bg-[#1B2340] rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-extrabold text-[#EDF2F4]">🏠 아파트 인증</h2>
                  <button onClick={() => setShowVerify(false)} className="w-8 h-8 rounded-full bg-[#0E1730] flex items-center justify-center hover:bg-[#1E2A45] transition-colors">
                    <X size={16} className="text-[#8D99AE]" />
                  </button>
                </div>
                <p className="text-[14px] font-bold text-[#EDF2F4] mb-3">내 아파트를 선택해주세요</p>
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                  {Array.from(new Set(dongtanApartments.map(apt => apt.match(/\[(.*?)\]/)?.[1]).filter(Boolean))).map(dong => (
                    <button key={dong} onClick={() => { setVerifyDong(dong as string); setVerifyApt(''); }} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${verifyDong === dong ? 'bg-[#EDF2F4] text-[#EDF2F4] border-[#EDF2F4]' : 'bg-[#1B2340] text-[#8D99AE] border-[#2A3558] hover:border-[#8D99AE]'}`}>{dong}</button>
                  ))}
                </div>
                {verifyDong && (
                  <div className="bg-[#141C33] border border-[#2A3558] rounded-xl overflow-hidden max-h-48 overflow-y-auto p-2 mb-5">
                    {dongtanApartments.filter(apt => apt.includes(`[${verifyDong}]`)).map(apt => (
                      <button key={apt} onClick={() => setVerifyApt(apt)} className={`w-full text-left px-4 py-3 text-[14px] font-medium rounded-lg transition-colors ${verifyApt === apt ? 'bg-[#141C33] text-[#8D99AE] font-bold' : 'text-[#EDF2F4] hover:bg-[#0E1730]'}`}>{apt}</button>
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
                  className="w-full py-4 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:bg-[#2A3558] disabled:text-[#6B7394] bg-[#EDF2F4] text-[#EDF2F4] flex items-center justify-center gap-2"
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
            <h2 className="text-[28px] font-extrabold tracking-tight text-[#EDF2F4] mb-1">아파트 추천</h2>
            <p className="text-[15px] text-[#6B7394] font-medium">동탄 맞춤 아파트 추천 & 분석</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-full h-[180px] sm:h-[200px] bg-gradient-to-br from-[#8D99AE] to-[#2b72d6] rounded-3xl p-5 sm:p-8 flex flex-col justify-end text-[#EDF2F4] relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#1B2340]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-[#1B2340]/20 transition-colors"></div>
              <h3 className="text-[18px] sm:text-[24px] font-extrabold mb-1 relative z-10">우리 아파트 탈탈 털어드림!</h3>
              <p className="text-[#EDF2F4]/80 text-[12px] sm:text-[14px] relative z-10">장점부터 숨기고 싶은 단점까지 속 시원하게 분석 신청하기</p>
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-[#1B2340] text-[#8D99AE] w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold shadow-lg shadow-black/10">&rarr;</div>
            </div>

            {/* ── 7대 투자 권역 ── */}
            <div>
              <h3 className="text-[18px] font-extrabold text-[#EDF2F4] mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#8D99AE]" />
                7대 투자 권역
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ZONES.map(zone => (
                  <div
                    key={zone.id}
                    onClick={() => router.push(`/zone/${zone.id}`)}
                    className="bg-[#1B2340] rounded-2xl border border-[#1E2A45] p-5 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-[15px] font-extrabold text-[#EDF2F4] group-hover:text-[#8D99AE] transition-colors">{zone.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#6B7394] bg-[#0E1730] px-2 py-0.5 rounded-md inline-block mb-2">{zone.dongLabel}</span>
                    <p className="text-[13px] text-[#8D99AE] leading-relaxed line-clamp-2">{zone.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            {kpis.map(kpi => (
              <div key={kpi.id} className="bg-[#1B2340] p-6 rounded-3xl border border-[#1E2A45] shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[13px] text-[#8D99AE] font-bold mb-3">{kpi.title}</h3>
                <div className="text-[24px] font-extrabold text-[#EDF2F4]">{kpi.mainValue}</div>
                {kpi.subValue && <p className="text-[12px] text-[#6B7394] font-medium mt-1">{kpi.subValue}</p>}
              </div>
            ))}



            {/* Ad Banner */}
            <div className="w-full bg-[#0E1730] border border-[#1E2A45] rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <span className="bg-[#EDF2F4] text-[#EDF2F4] text-[11px] font-bold px-2 py-0.5 rounded mb-2">AD</span>
              <h3 className="text-[18px] font-bold text-[#EDF2F4] mb-1">여기에 광고 배너가 표시됩니다</h3>
              <p className="text-[#6B7394] text-[14px]">광고 구좌 (e.g., 부동산 플랫폼 배너, 인테리어 광고 등)</p>
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
