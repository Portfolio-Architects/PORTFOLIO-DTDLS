'use client';

import { 
  Building, MapPin, Map as MapIcon, Info, Users, AlertCircle, ShieldAlert,
  Car, BookOpen, Clock, Tag, X, FileText, CheckCircle2, TrendingUp, Radar,
  MessageSquare, Heart, Compass, LayoutDashboard, Camera, UserCircle, Star, Maximize2, Link2, Trash2, Text, LogOut,
  Home, PenLine, Send, Edit3
} from 'lucide-react';
import MainChart from '@/components/MainChart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import EduBubbleChart from '@/components/EduBubbleChart';
import LifestyleRadarChart from '@/components/LifestyleRadarChart';
import PropertyScoreChart from '@/components/consumer/PropertyScoreChart';
import { useDashboardData, dashboardFacade, CommentData, FieldReportData, UserReview } from '@/lib/DashboardFacade';
import WriteReviewModal from '@/components/WriteReviewModal';
import { ZONES, dongToZoneId, getZoneById, getDongsForZone, getAllDongs, getZoneColorForDong, ZoneInfo } from '@/lib/zones';
import { isSameApartment, normalizeAptName } from '@/lib/utils/apartmentMapping';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

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

export function FieldReportModal({ 
  report, 
  onClose,
  comments,
  commentInput,
  onCommentChange,
  onSubmitComment,
  user,
  transactions,
  typeMap
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
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const s = report.sections;
  const coverImage = report.imageUrl || s?.infra?.gateImg || s?.infra?.landscapeImg || s?.ecosystem?.communityImg;
  const rating = report.premiumScores?.totalPremiumScore ? Math.max(1, Math.round(report.premiumScores.totalPremiumScore / 20)) : (report.rating || 5);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-[#191f28]/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`relative bg-[#f2f4f6] w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-[1200px] max-h-[90vh] rounded-3xl'} flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [&::-webkit-scrollbar]:hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5`}>
          <button onClick={onClose} className="sticky top-4 z-20 ml-auto mr-4 mt-4 -mb-14 bg-[#191f28]/80 hover:bg-[#191f28] text-white w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors shadow-lg shrink-0">
            <X size={20} />
          </button>

          {/* Hero Section */}
          <div className="bg-white w-full flex flex-col md:flex-row p-6 md:p-10 gap-6 md:gap-8 rounded-t-3xl shrink-0 pt-4 md:pt-8 border-b border-[#e5e8eb]">
            
            {/* Left: 실거래가 전체 리스트 */}
            <div className="w-full md:w-[50%] shrink-0">
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

            {/* Right: Title + Chart */}
            <div className="w-full md:w-[50%] flex flex-col">
               <div className="flex items-center gap-2 mb-3">
                 <span className="bg-[#3182f6] text-white text-[13px] font-bold px-3 py-1 rounded-full">{report.dong || '동탄'}</span>
               </div>
               <h1 className="text-[28px] md:text-[36px] font-extrabold leading-tight tracking-tight mb-4 text-[#191f28]">{report.apartmentName}</h1>
               
               <div className="flex items-center gap-3 pb-4 border-b border-[#e5e8eb] text-[#4e5968]">
                 <span className="text-[14px] font-bold">by 임장크루</span>
                 <span className="text-[13px] opacity-60">·</span>
                 <span className="text-[13px]">{report.createdAt}</span>
               </div>

               {/* 매매가 추이 차트 (주식 스타일) */}
               {transactions.length > 0 && (() => {
                 const chartData = [...transactions]
                   .reverse()
                   .map((tx, idx) => ({
                     date: `${tx.contractYm.slice(0,4)}.${tx.contractYm.slice(4)}.${tx.contractDay}`,
                     price: Math.round(tx.price / 100) / 100,
                     area: tx.areaPyeong,
                     floor: tx.floor,
                     priceEok: tx.priceEok,
                     idx,
                   }));
                 const prices = chartData.map(d => d.price);
                 const minPrice = Math.floor(Math.min(...prices) * 10) / 10;
                 const maxPrice = Math.ceil(Math.max(...prices) * 10) / 10;
                 const margin = (maxPrice - minPrice) * 0.15 || 0.5;
                 return (
                   <div className="mt-4 bg-[#1a1a2e] rounded-2xl p-4 ring-1 ring-white/10 flex-1">
                     <h4 className="text-[12px] font-bold text-[#8b95a1] mb-2 flex items-center gap-1.5">
                       <TrendingUp size={13} className="text-[#03c75a]" />
                       매매가 추이
                       <span className="ml-auto text-[10px] text-[#555]">{chartData.length}건</span>
                     </h4>
                     <div className="h-[220px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                           <defs>
                             <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#03c75a" stopOpacity={0.35}/>
                               <stop offset="95%" stopColor="#03c75a" stopOpacity={0.02}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
                           <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                           <YAxis domain={[minPrice - margin, maxPrice + margin]} tick={{ fill: '#777', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}억`} />
                           <RechartsTooltip
                             contentStyle={{ backgroundColor: '#191f28', borderRadius: '10px', border: '1px solid #333', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                             labelStyle={{ color: '#8b95a1', fontSize: '10px' }}
                             formatter={(value: any) => [`${value}억`, '매매가']}
                             cursor={{ stroke: '#03c75a', strokeWidth: 1, strokeDasharray: '4 4' }}
                           />
                           <Area type="monotone" dataKey="price" stroke="#03c75a" strokeWidth={2.5} fill="url(#priceGrad)" dot={false} activeDot={{ r: 5, fill: '#03c75a', stroke: '#fff', strokeWidth: 2 }} />
                         </AreaChart>
                       </ResponsiveContainer>
                     </div>
                   </div>
                 );
               })()}
            </div>

          </div>

          {/* Magazine Content Wrapper */}
          <div className="px-6 py-8 md:p-12 flex flex-col gap-10 max-w-[1000px] mx-auto w-full">

            {/* 0. Premium Score Analysis (If Available, outside of legacy toggle) */}
            {report.premiumScores && (
              <div className="mb-2">
                 <PropertyScoreChart scores={report.premiumScores} />
              </div>
            )}

            {/* New Schema (Premium CMS): Render dynamic images if available */}
            {report.images && report.images.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                 <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3">
                   <Camera size={20} className="text-[#3182f6]"/> 현장 프리미엄 사진 브리핑
                 </h2>
                 <div className="flex flex-col gap-12">
                   {report.images.map((img, i) => (
                     <div key={i} className="flex flex-col md:flex-row gap-8 pt-8 first:pt-0 first:border-0 border-t border-[#f2f4f6]">
                       <div 
                         className="w-full md:w-[400px] lg:w-[480px] h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shrink-0 cursor-pointer group relative shadow-sm"
                         onClick={() => setFullscreenImage(img.url)}
                       >
                         <img src={img.url} alt={img.locationTag} className="w-full h-full object-cover bg-[#f2f4f6] group-hover:scale-105 transition-transform duration-500" />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                           <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                         </div>
                       </div>
                       <div className="flex-1 flex flex-col justify-center">
                         <div className="flex items-center gap-2 mb-4">
                           <h4 className="text-[16px] font-bold text-[#191f28] bg-[#f8f9fa] border border-[#e5e8eb] px-4 py-1.5 rounded-lg">
                             {img.locationTag}
                           </h4>
                           {img.isPremium && (
                             <span className="text-[10px] font-bold bg-[#191f28] text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                               <Star size={10} className="fill-[#ffc107] text-[#ffc107]" /> PREMIUM
                             </span>
                           )}
                         </div>
                         <p className="text-[16px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{img.caption || '상세 설명이 등록되지 않았습니다.'}</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

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
              // Advanced Template Render
              <>
                {/* 1. 요약 브리프 */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Text size={20} className="text-[#3182f6]"/> 요약 브리프</h2>
                   <div className="flex flex-col gap-4">
                     <div className="bg-[#f0fdf4] p-5 rounded-2xl border border-[#bbf7d0]">
                       <h3 className="text-[15px] font-extrabold text-[#03c75a] mb-2 flex items-center gap-1.5"><CheckCircle2 size={18}/> 이 단지의 핵심 장점</h3>
                       <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{s.assessment.alphaDriver || '내용 없음'}</p>
                     </div>
                     <div className="bg-[#fff5f5] p-5 rounded-2xl border border-[#ffebec]">
                       <h3 className="text-[15px] font-extrabold text-[#f04452] mb-2 flex items-center gap-1.5"><AlertCircle size={18}/> 주의할 단점</h3>
                       <p className="text-[15px] text-[#191f28] leading-relaxed whitespace-pre-wrap">{s.assessment.systemicRisk || '내용 없음'}</p>
                     </div>
                   </div>
                </div>

                {/* 2. 단지 기본 명세 (Specs) */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
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
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Camera size={20} className="text-[#3182f6]"/> 현장 인프라 둘러보기</h2>
                   <div className="flex flex-col gap-8">
                      {/* Gate */}
                      {(s.infra.gateText || s.infra.gateImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.infra.gateImg && <img src={s.infra.gateImg} alt="진입로/문주" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">진입로 및 정문</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.gateText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Landscaping */}
                      {(s.infra.landscapeText || s.infra.landscapeImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.infra.landscapeImg && <img src={s.infra.landscapeImg} alt="조경/지형" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">단지 조경 및 지형</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.landscapeText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                      {/* Parking & Maintenance ... (Skip strict layout for brevity, just render them similarly) */}
                       {(s.infra.parkingText || s.infra.parkingImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.infra.parkingImg && <img src={s.infra.parkingImg} alt="지하주차장" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f2f4f6] inline-block px-3 py-1 rounded-lg">지하주차장 인프라</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.infra.parkingText || '사진만 제공됨'}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 4. Ecosystem */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                   <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3"><Info size={20} className="text-[#3182f6]"/> 생활 편의시설 및 거시 입지</h2>
                   <div className="flex flex-col gap-8">
                      {(s.ecosystem.schoolText || s.ecosystem.schoolImg) && (
                        <div className="flex flex-col md:flex-row gap-6">
                          {s.ecosystem.schoolImg && <img src={s.ecosystem.schoolImg} alt="학군" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f8f9fa] border border-[#e5e8eb] inline-block px-3 py-1 rounded-lg">학군 및 통학로</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.ecosystem.schoolText}</p>
                          </div>
                        </div>
                      )}
                      {(s.ecosystem.commerceText || s.ecosystem.commerceImg) && (
                        <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-[#f2f4f6]">
                          {s.ecosystem.commerceImg && <img src={s.ecosystem.commerceImg} alt="상권" className="w-full md:w-[280px] h-[200px] rounded-2xl object-cover shadow-sm bg-[#f2f4f6]" />}
                          <div>
                            <h4 className="text-[15px] font-bold text-[#191f28] mb-2 bg-[#f8f9fa] border border-[#e5e8eb] inline-block px-3 py-1 rounded-lg">동네 상권</h4>
                            <p className="text-[15px] text-[#4e5968] leading-relaxed whitespace-pre-wrap">{s.ecosystem.commerceText}</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                 {/* 5. 최종 결론 */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
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
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
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
  const [isWriting, setIsWriting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('교통');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FieldReportData | null>(null);
  
  // Comments State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<string, CommentData[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  // Tab state
  const [activeTab, setActiveTab] = useState<'imjang' | 'lounge' | 'recommend'>('imjang');

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Dong filter state
  const [selectedDong, setSelectedDong] = useState<string | null>(null);

  // Transaction data
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>([]);
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
        // Fetch or create their anonymous profile immediately upon login
        const profile = await dashboardFacade.getUserProfile(currentUser.uid);
        setAnonProfile(profile);
      } else {
        setAnonProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch transaction data from Google Sheet
  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(data => {
        if (data.records) setAllTransactions(data.records);
      })
      .catch(err => console.warn('실거래가 로딩 실패:', err));

    // Fetch type map
    fetch('/api/type-map')
      .then(r => r.json())
      .then(data => {
        if (data.entries) {
          const map: Record<string, Record<string, string>> = {};
          for (const e of data.entries) {
            const key = normalizeAptName(e.aptName);
            if (!map[key]) map[key] = {};
            map[key][e.area] = e.typeName;
          }
          setTypeMap(map);
        }
      })
      .catch(err => console.warn('타입맵 로딩 실패:', err));
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

  const handleOpenWriteModal = () => {
    if (!user) {
      alert("로그인이 필요한 기능입니다.");
      handleLogin();
      return;
    }
    setIsWriting(true);
  };

  const handleLikeClick = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!user) { alert("로그인 후 좋아요를 누를 수 있습니다!"); return; }
    dashboardFacade.incrementLike(postId);
  };

  const handleReportLikeClick = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!user) { alert("로그인 후 좋아요를 누를 수 있습니다!"); return; }
    dashboardFacade.incrementFieldReportLike(reportId);
  };

  const handleToggleComments = (reportId: string) => {
    const isExpanding = !expandedComments[reportId];
    setExpandedComments(prev => ({ ...prev, [reportId]: isExpanding }));

    if (isExpanding && !commentsData[reportId]) {
      // Subscribe to comments
      dashboardFacade.listenToComments(reportId, (comments) => {
        setCommentsData(prev => ({ ...prev, [reportId]: comments }));
      });
    }
  };

  const handleSubmitComment = async (reportId: string) => {
    if (!user) { alert("로그인 후 댓글을 남길 수 있습니다."); handleLogin(); return; }
    const text = commentInput[reportId];
    if (!text?.trim()) return;

    await dashboardFacade.addFieldReportComment(reportId, text, user.uid);
    setCommentInput(prev => ({ ...prev, [reportId]: '' }));
  };

  const handleSubmitPost = async () => {
    if (!postTitle.trim() || !user) return;
    setIsSubmitting(true);
    await dashboardFacade.addPost(postTitle, postCategory, user.uid, imageFile || undefined);
    setPostTitle('');
    setImageFile(null);
    setIsWriting(false);
    setIsSubmitting(false);
  };

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
        <div className="w-full max-w-[2000px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32 h-16 flex justify-between items-center">
          {/* Left: Pill Tabs + Branding */}
          <div className="flex items-center gap-3">
            <div className="inline-flex bg-[#f2f4f6] rounded-full p-1 gap-0.5">
              {[
                { id: 'imjang' as const, label: '임장기', icon: Compass },
                { id: 'lounge' as const, label: '라운지', icon: MessageSquare },
                { id: 'recommend' as const, label: '추천', icon: Home },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-[#191f28] shadow-sm'
                      : 'text-[#8b95a1] hover:text-[#4e5968]'
                  }`}
                >
                  <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-[17px] text-[#8b95a1] font-medium hidden sm:inline">by <span className="font-extrabold text-[#191f28]">임장크루</span></span>
          </div>
          {/* User bar is now handled by FloatingUserBar in layout.tsx */}
          </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-500">

        {/* ═══ TAB 1: 임장기 ═══ */}
        {activeTab === 'imjang' && (
        <section>
          {/* 1. Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#191f28] tracking-tight">
                프리미엄 임장기
              </h2>
              <span className="inline-flex items-center gap-1.5 bg-[#e8f3ff] text-[#3182f6] text-[13px] font-bold px-3 py-1 rounded-full shrink-0">
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
                <Clock size={18} className="text-[#f59e0b]" />
                {selectedDong ? '필터 결과' : '임장 리포트'}
                <span className="text-[13px] font-bold text-[#8b95a1] ml-1">{filteredReports.length}개</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map(report => {
                  const txs = allTransactions.filter(tx => isSameApartment(report.apartmentName, tx.aptName));
                  const chartData = [...txs].reverse().slice(-20).map(tx => ({
                    price: Math.round(tx.price / 100) / 100,
                  }));
                  return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col md:flex-row"
                  >
                    {/* Left: Photo */}
                    <div className="w-full md:w-[240px] h-[180px] md:h-auto bg-[#f2f4f6] overflow-hidden relative shrink-0">
                      {report.imageUrl ? (
                        <img src={report.imageUrl} alt={report.apartmentName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

                      {/* 최근 실거래 + 미니 차트 */}
                      <div className="flex items-end gap-4">
                        {txs.length > 0 && (
                          <div className="flex-1 min-w-0">
                            <table className="w-full text-[11px]">
                              <tbody>
                                {txs.slice(0, 3).map((tx, idx) => {
                                  const norm = normalizeAptName(tx.aptName);
                                  const t = typeMap[norm]?.[String(tx.area)];
                                  return (
                                    <tr key={idx} className="border-b border-[#f2f4f6] last:border-0">
                                      <td className="py-1 text-[#8b95a1]">{tx.contractYm.slice(2,4)}.{tx.contractYm.slice(4)}.{tx.contractDay}</td>
                                      <td className="py-1 text-right font-extrabold text-[#191f28]">{tx.priceEok}</td>
                                      <td className="py-1 text-right text-[#3182f6] font-bold">{t || `${tx.areaPyeong}평`}</td>
                                      <td className="py-1 text-right text-[#8b95a1]">{tx.floor}층</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {chartData.length > 2 && (
                          <div className="w-[100px] h-[50px] shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                <defs>
                                  <linearGradient id={`miniGrad-${report.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#03c75a" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#03c75a" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="price" stroke="#03c75a" strokeWidth={1.5} fill={`url(#miniGrad-${report.id})`} dot={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ZONES.map(zone => {
                const count = zoneReportCounts[zone.id] || 0;
                return (
                  <div
                    key={zone.id}
                    onClick={() => router.push(`/zone/${zone.id}`)}
                    className="bg-white rounded-2xl border border-[#e5e8eb] p-4 md:p-5 flex gap-4 items-start cursor-pointer hover:shadow-lg hover:border-transparent hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-[15px] font-extrabold text-[#191f28] truncate">{zone.name}</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: zone.color + '18', color: zone.color }}>{zone.dongLabel}</span>
                      </div>
                      <p className="text-[12px] text-[#8b95a1] leading-relaxed line-clamp-2 mb-2.5">{zone.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#4e5968]">{count}개 단지 리뷰</span>
                        <span className="text-[12px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: zone.color }}>보기 →</span>
                      </div>
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
                    {/* Header: author + level badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#191f28]">{review.author}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f2f4f6] text-[#4e5968]">
                          {review.authorBadge} {review.authorLevel}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8b95a1]">{review.createdAt}</span>
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

                    {/* Like button */}
                    <button
                      onClick={() => dashboardFacade.incrementReviewLike(review.id)}
                      className="flex items-center gap-1 text-[12px] font-bold text-[#8b95a1] hover:text-[#f04452] transition-colors"
                    >
                      <Heart size={14} />
                      {review.likes || 0}
                    </button>
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
          <div className="flex flex-col gap-3">
            {newsFeed.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#e5e8eb]">
                <MessageSquare size={40} className="mx-auto mb-4 text-[#d1d6db]" />
                <p className="text-[15px] font-bold text-[#4e5968]">아직 글이 없습니다</p>
              </div>
            ) : (
              newsFeed.map((news) => (
                <div key={news.id} onClick={() => router.push(`/lounge/${news.id}`)} className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="text-[16px] font-bold text-[#191f28] leading-snug mb-2">{news.title}</h3>
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
              onClick={() => router.push('/lounge')}
              className="fixed bottom-6 right-6 w-14 h-14 bg-[#3182f6] hover:bg-[#1b6de8] text-white rounded-full shadow-lg shadow-[#3182f6]/30 flex items-center justify-center transition-all active:scale-95 z-20"
            >
              <PenLine size={22} />
            </button>
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
            {/* Promo Banner */}
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
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
          comments={commentsData[selectedReport.id] || []}
          commentInput={commentInput[selectedReport.id] || ''}
          onCommentChange={(text) => setCommentInput(prev => ({ ...prev, [selectedReport.id]: text }))}
          onSubmitComment={() => handleSubmitComment(selectedReport.id)}
          user={user}
          transactions={allTransactions.filter(tx => isSameApartment(selectedReport.apartmentName, tx.aptName))}
          typeMap={typeMap}
        />
      )}



      {showReviewModal && user && (
        <WriteReviewModal onClose={() => setShowReviewModal(false)} userUid={user.uid} />
      )}

    </div>
  );
}
