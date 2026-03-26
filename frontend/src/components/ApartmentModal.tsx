'use client';

import { useState, useRef, useMemo } from 'react';
import {
  MapPin, X, TrendingUp, Camera, Maximize2,
  MessageSquare, UserCircle, CheckCircle2, Building, Info, ShieldAlert, Radar, ChevronDown
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
  floor: number;
  buildYear: number;
  dealType: string;
}
/** GalleryGrid — Horizontal Category-based Scroll for quick point-catching */
function GalleryGrid({ images, tags, tagLabels, onImageClick }: {
  images: {url: string; caption?: string; locationTag?: string; isPremium?: boolean; capturedAt?: string}[];
  tags: string[];
  tagLabels: Record<string, string>;
  onImageClick: (url: string) => void;
}) {
  const categories = tags.filter(t => t !== '전체');
  
  const groupedImages: Record<string, typeof images> = {};
  categories.forEach(tag => {
    groupedImages[tag] = images.filter(img => (img.locationTag || '기타') === tag);
  });

  return (
    <div className="flex flex-col gap-8 mt-2">
      {categories.map(tag => {
        const categoryImages = groupedImages[tag];
        if (!categoryImages || categoryImages.length === 0) return null;
        
        const label = tagLabels[tag] || tag;
        
        return (
          <div key={tag} className="flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[15px] font-extrabold text-[#191f28] flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-[#3182f6] rounded-full inline-block"></span>
                {label}
              </h3>
              <span className="text-[12px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-md">
                {categoryImages.length}장
              </span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x shrink-0 w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categoryImages.map((img, i) => (
                <div
                  key={i}
                  className="relative shrink-0 w-[240px] md:w-[280px] aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group border border-[#e5e8eb] shadow-sm snap-start"
                  onClick={() => onImageClick(img.url)}
                >
                  <Image
                    src={img.url}
                    alt={img.caption || img.locationTag || `Photo ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 240px, 280px"
                    className="object-cover bg-[#f2f4f6]"
                  />
                  {(img.caption || img.isPremium || img.capturedAt) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3.5 pt-8">
                      <div className="flex flex-col gap-1.5">
                        {img.isPremium && (
                          <span className="w-fit text-[9px] font-bold bg-[#ffc107] text-[#191f28] px-1.5 py-0.5 rounded-md">★ PRO</span>
                        )}
                        {img.caption && (
                          <p className="text-[12px] font-medium text-white line-clamp-2 leading-snug">{img.caption}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {img.capturedAt && (
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                      {img.capturedAt}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-8 text-[#8b95a1] text-[13px]">등록된 갤러리 사진이 없습니다.</div>
      )}
    </div>
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
  const [priceTypeFilter, setPriceTypeFilter] = useState<string>('ALL');
  const [hoveredDot, setHoveredDot] = useState<{ x: number; y: number; data: any } | null>(null);
  const [showPriceHelp, setShowPriceHelp] = useState(false);
  const [txFilterArea, setTxFilterArea] = useState<string>('ALL');
  const [txFilterFloor, setTxFilterFloor] = useState<string>('ALL');
  const [txFilterDealType, setTxFilterDealType] = useState<string>('ALL');
  const [txSort, setTxSort] = useState<{key: string, dir: 'asc'|'desc'}>({key: 'date', dir: 'desc'});
  const [activeDropdown, setActiveDropdown] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState('sec-summary');

  const handleTxSort = (key: string) => {
    setTxSort(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
  };
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
    return t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : String(tx.area);
  }))).sort();
  // 고유 유형 목록
  const dealTypes = Array.from(new Set(transactions.map(tx => tx.dealType))).sort();
  // 층 구간 (아파트별 최고층 기준 3등분)
  const floors = transactions.map(tx => Number(tx.floor)).filter(f => !Number.isNaN(f));
  const maxFloor = Math.max(...floors, 1);
  const lowCut = Math.floor(maxFloor / 3);
  const midCut = Math.floor(maxFloor * 2 / 3);
  const floorTiers = [
    { key: 'ALL', label: '전체' },
    { key: 'LOW', label: `저층(1~${lowCut}F)` },
    { key: 'MID', label: `중층(${lowCut + 1}~${midCut}F)` },
    { key: 'HIGH', label: `고층(${midCut + 1}F~)` },
  ];

  const chipClass = (active: boolean) => `w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
    active ? 'bg-[#e8f3ff] text-[#3182f6]' : 'bg-transparent text-[#4e5968] hover:bg-[#f2f4f6]'
  }`;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (txFilterArea !== 'ALL') {
        const norm = normalizeAptName(tx.aptName);
        const t = typeMap[norm]?.[String(tx.area)];
        const label = t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : String(tx.area);
        if (label !== txFilterArea) return false;
      }
      if (txFilterFloor !== 'ALL') {
        const f = Number(tx.floor);
        const allFloors = transactions.map(tt => Number(tt.floor)).filter(ff => !Number.isNaN(ff));
        const mxF = Math.max(...allFloors, 1);
        const lc = Math.floor(mxF / 3);
        const mc = Math.floor(mxF * 2 / 3);
        if (txFilterFloor === 'LOW' && f > lc) return false;
        if (txFilterFloor === 'MID' && (f <= lc || f > mc)) return false;
        if (txFilterFloor === 'HIGH' && f <= mc) return false;
      }
      if (txFilterDealType !== 'ALL' && tx.dealType !== txFilterDealType) return false;
      return true;
    });
  }, [transactions, txFilterArea, txFilterFloor, txFilterDealType, typeMap, areaUnit]);

  const sortedFilteredTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let cmp = 0;
      if (txSort.key === 'date') {
        const aDate = parseInt(a.contractYm) * 100 + (parseInt(a.contractDay) || 15);
        const bDate = parseInt(b.contractYm) * 100 + (parseInt(b.contractDay) || 15);
        cmp = aDate - bDate;
      } else if (txSort.key === 'price') {
        cmp = a.price - b.price;
      } else if (txSort.key === 'area') {
        cmp = a.area - b.area;
      } else if (txSort.key === 'floor') {
        const af = Number(a.floor) || 0;
        const bf = Number(b.floor) || 0;
        cmp = af - bf;
      } else if (txSort.key === 'type') {
        cmp = (a.dealType || '').localeCompare(b.dealType || '');
      }
      return txSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filteredTransactions, txSort]);

  const content = (
    <>
      {/* Hero Section — Layout: 40% table / 60% chart */}
          <div className={`bg-white w-full flex flex-col md:flex-row p-4 ${inline ? 'md:p-6' : 'md:p-10'} gap-4 md:gap-8 ${inline ? '' : 'rounded-t-3xl'} shrink-0 pt-4 md:pt-8 ${inline ? 'border-b border-[#f2f4f6]' : 'border-b border-[#e5e8eb]'}`}>
            
            {/* Left: 실거래가 전체 리스트 — mobile: 2번째, desktop: 1번째 (40%) */}
            <div className="w-full md:w-[40%] shrink-0 order-2 md:order-1 flex flex-col">
              {transactions.length > 0 ? (
                <div className="bg-[#f9fafb] rounded-2xl p-4 ring-1 ring-black/5 h-full flex flex-col">
                  {/* 필터 영역 */}
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h4 className="text-sm font-bold text-[#8b95a1] flex items-center gap-1.5 shrink-0">
                      <TrendingUp size={16} className="text-[#03c75a]" />
                      <span className="flex items-center gap-1.5">실거래가 내역 <span className="text-sm font-medium ml-0.5">총 {filteredTransactions.length.toLocaleString()}건</span></span>
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-md">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3182f6]" />
                      <span>최근 1개월</span>
                    </div>
                  </div>
                  
                  {/* 팝업 오버레이 닫기용 투명 배경 - 레이아웃 간섭(Layout Shift) 방지를 위해 독립 배치 */}
                  {activeDropdown && (
                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                  )}
                  <div className="overflow-y-auto max-h-[460px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#f9fafb] z-50">
                        {(() => {
                          const renderSortIcon = (key: string, hasFilter: boolean = false) => (
                            <div className={`p-1 -m-1 rounded cursor-pointer flex items-center justify-center transition-colors ${activeDropdown === key ? 'bg-[#e5e8eb]' : 'hover:bg-[#e5e8eb]'}`} onClick={(e) => {
                              e.stopPropagation();
                              if (hasFilter) {
                                setActiveDropdown(activeDropdown === key ? null : key);
                              } else {
                                handleTxSort(key);
                              }
                            }}>
                              <ChevronDown size={14} className={`transition-transform duration-200 ${(txSort.key === key && !hasFilter) ? 'text-[#191f28] ' + (txSort.dir === 'asc' ? 'rotate-180' : '') : (activeDropdown === key ? 'text-[#191f28]' : 'text-[#d1d6db] group-hover:text-[#8b95a1]')}`} />
                            </div>
                          );
                          return (
                            <tr className="border-b border-[#e5e8eb] text-[#8b95a1]">
                              <th className="py-3 text-center font-bold rounded-tl-lg">
                                <div className="flex items-center justify-center gap-1 w-full relative">
                                  <span>거래일</span>
                                </div>
                              </th>
                              <th className="py-3 text-center font-bold w-[25%]">
                                <div className="flex items-center justify-center gap-1 w-full">
                                  <span>금액</span>
                                </div>
                              </th>
                              <th className="py-3 text-center font-bold w-[18%] group hover:bg-[#f2f4f6] transition-colors relative">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="cursor-pointer" onClick={() => handleTxSort('area')}>{areaUnit === 'm2' ? 'm²' : '평'}</span>
                                  {renderSortIcon('area', true)}
                                </div>
                                {activeDropdown === 'area' && (
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white ring-1 ring-black/5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 flex flex-col min-w-[150px] font-normal z-50 text-left" onClick={e => e.stopPropagation()}>
                                    <div className="text-[11px] font-bold text-[#8b95a1] mb-2 px-3 pt-1">타입 필터</div>
                                    <div className="flex flex-col items-stretch max-h-[250px] overflow-y-auto custom-scrollbar">
                                      <button className={chipClass(txFilterArea === 'ALL')} onClick={() => {setTxFilterArea('ALL'); setActiveDropdown(null);}}>전체보기</button>
                                      {areaTypes.map(a => (
                                        <button key={a} className={chipClass(txFilterArea === a)} onClick={() => {setTxFilterArea(a); setActiveDropdown(null);}}>{a}</button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </th>
                              <th className="py-3 text-center font-bold w-[15%] group hover:bg-[#f2f4f6] transition-colors relative">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="cursor-pointer" onClick={() => handleTxSort('floor')}>층</span>
                                  {renderSortIcon('floor', true)}
                                </div>
                                {activeDropdown === 'floor' && (
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white ring-1 ring-black/5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 flex flex-col min-w-[150px] font-normal z-50 text-left" onClick={e => e.stopPropagation()}>
                                    <div className="text-[11px] font-bold text-[#8b95a1] mb-2 px-3 pt-1">층수 필터</div>
                                    <div className="flex flex-col items-stretch max-h-[250px] overflow-y-auto custom-scrollbar">
                                      {floorTiers.map(ft => (
                                        <button key={ft.key} className={chipClass(txFilterFloor === ft.key)} onClick={() => {setTxFilterFloor(ft.key); setActiveDropdown(null);}}>{ft.label}</button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </th>
                              <th className="py-3 pr-2 text-right font-bold w-[18%] group hover:bg-[#f2f4f6] transition-colors rounded-tr-lg relative">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="cursor-pointer" onClick={() => handleTxSort('type')}>유형</span>
                                  {renderSortIcon('type', true)}
                                </div>
                                {activeDropdown === 'type' && (
                                  <div className="absolute top-full right-0 mt-2 bg-white ring-1 ring-black/5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 flex flex-col min-w-[150px] font-normal z-50 text-left" onClick={e => e.stopPropagation()}>
                                    <div className="text-[11px] font-bold text-[#8b95a1] mb-2 px-3 pt-1">거래 유형</div>
                                    <div className="flex flex-col items-stretch max-h-[250px] overflow-y-auto custom-scrollbar">
                                      <button className={chipClass(txFilterDealType === 'ALL')} onClick={() => {setTxFilterDealType('ALL'); setActiveDropdown(null);}}>전체보기</button>
                                      {dealTypes.map(dt => (
                                        <button key={dt} className={chipClass(txFilterDealType === dt)} onClick={() => {setTxFilterDealType(dt); setActiveDropdown(null);}}>{dt}</button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </th>
                            </tr>
                          );
                        })()}
                      </thead>
                      <tbody>
                        {(() => {
                          return sortedFilteredTransactions.map((tx, idx) => {
                            const txDate = new Date(parseInt(tx.contractYm.slice(0, 4)), parseInt(tx.contractYm.slice(4)) - 1, parseInt(tx.contractDay) || 15);
                            const now = new Date();
                            const isRecent = txDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                            const norm = normalizeAptName(tx.aptName);
                            const t = typeMap[norm]?.[String(tx.area)];
                            const label = t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : null;
                            const badgeEl = (() => {
                              if (!label) return <span className="text-xs">{tx.areaPyeong}평</span>;
                              const [tc, bgc] = getBadgeColorClasses(label);
                              return <span className={`font-bold ${tc} ${bgc} px-1.5 py-0.5 rounded text-xs`} title={`${tx.areaPyeong}평`}>{label}</span>;
                            })();
                            return (
                              <tr key={idx} className={`border-b border-[#f2f4f6] hover:bg-white/60 transition-colors ${isRecent ? 'bg-[#f0f7ff]' : ''}`}>
                                <td className={`py-3 pl-2 whitespace-nowrap flex items-center h-full ${isRecent ? 'text-[#191f28] font-bold' : 'text-[#4e5968]'}`}>
                                  {isRecent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3182f6] mr-1.5" />}
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
                   if (floor >= midCut) return '#FF6B6B'; // 고층 = 다홍/빨강
                   if (floor >= lowCut) return '#3182f6'; // 중층 = 파랑
                   return '#20C997'; // 저층 = 민트/청록 (보색 대비 강화)
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
                         {(() => {
                           const roundedAvg = Math.round(latestAvg * 100) / 100;
                           const eok = Math.floor(roundedAvg);
                           const rem = Math.round((roundedAvg % 1) * 10000);
                           return `${eok >= 1 ? `${eok}억` : ''}${rem > 0 ? rem.toLocaleString() : ''}`;
                         })()}
                       </span>
                       <span className="text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-1 rounded-lg">
                         최근 1개월 평균
                       </span>
                     </div>
                     <div className="h-[300px] relative">
                       <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                                   {item?.highAvg && <div style={{ color: '#FF6B6B', fontSize: 12, fontWeight: 700 }}>고층 {item.highAvg.toFixed(2)}억</div>}
                                   {item?.midAvg && <div style={{ color: '#3182f6', fontSize: 12, fontWeight: 700 }}>중층 {item.midAvg.toFixed(2)}억</div>}
                                   {item?.lowAvg && <div style={{ color: '#20C997', fontSize: 12, fontWeight: 700 }}>저층 {item.lowAvg.toFixed(2)}억</div>}
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
                           <Line type="monotone" dataKey="lowAvg" yAxisId="price" stroke="#20C997" strokeWidth={2} strokeDasharray="2 3" dot={false} activeDot={false} connectNulls isAnimationActive={false} />
                           {/* 중층 월별 평균선 — 점선 */}
                           <Line type="monotone" dataKey="midAvg" yAxisId="price" stroke="#3182f6" strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={false} connectNulls isAnimationActive={false} />
                           {/* 고층 월별 평균선 — 실선 */}
                           <Line type="monotone" dataKey="highAvg" yAxisId="price" stroke="#FF6B6B" strokeWidth={2} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
                           {/* 산점도 — 층수별 색상 */}
                           <Customized
                             component={(rechartProps: any) => {
                               const { xAxisMap, yAxisMap } = rechartProps;
                               if (!xAxisMap || !yAxisMap) return null;
                                const xAx = Object.values((rechartProps as any).xAxisMap || {})[0] as any;
                                const yAx = Object.values((rechartProps as any).yAxisMap || {})[0] as any;
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
                       <span className="flex items-center gap-1.5"><span className="w-6 border-t-[1.5px] border-dotted border-[#20C997]"/>저층 (1~{lowCut - 1}F)</span>
                       <span className="flex items-center gap-1.5"><span className="w-6 border-t-[1.5px] border-dashed border-[#3182f6]"/>중층 ({lowCut}~{midCut - 1}F)</span>
                       <span className="flex items-center gap-1.5"><span className="w-6 h-[1.5px] bg-[#FF6B6B] rounded"/>고층 ({midCut}F~)</span>
                       <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-[#e5e8eb] rounded-sm"/>거래량</span>
                     </div>
                   </div>
                 );
               })()}
            </div>

          </div>

          {/* ── 평형별 최근 거래가 + 기간별 평균 ── */}
          {transactions.length > 0 && (() => {
            const now = new Date();
            const aptNorm = normalizeAptName(report.apartmentName);

            // 1) 평형별 최근 거래가 그룹핑
            const byArea = new Map<string, { label: string; price: string; rawPrice: number; count: number; latestYm: number; area: number; floor: number; supplyPyeong?: number }>();
            transactions.forEach(tx => {
              const key = String(tx.area);
              const typeData = typeMap[aptNorm]?.[key];
              const typeName = typeData ? (areaUnit === 'm2' ? typeData.typeM2 : (typeData.typePyeong || typeData.typeM2)) : undefined;
              const label = typeName || `${tx.areaPyeong}평`;
              
              let supplyPyeong: number | undefined;
              if (typeData?.typeM2) {
                const supplyM2Match = typeData.typeM2.match(/\d+(\.\d+)?/);
                if (supplyM2Match) supplyPyeong = parseFloat(supplyM2Match[0]) * 0.3025;
              }

              const ym = parseInt(tx.contractYm);
              const existing = byArea.get(key);
              if (!existing || ym > existing.latestYm) {
                byArea.set(key, { label, price: tx.priceEok, rawPrice: tx.price, count: (existing?.count || 0) + 1, latestYm: ym, area: tx.area, floor: tx.floor, supplyPyeong });
              } else {
                existing.count++;
              }
            });
            const areaCards = Array.from(byArea.values())
              .sort((a, b) => {
                const numA = parseInt(a.label.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.label.match(/\d+/)?.[0] || '0');
                if (numA !== numB) return numA - numB;
                return a.label.localeCompare(b.label);
              });

            // 2) 타입 필터 칩 목록 구성
            const typeFilters: { key: string; label: string; area: number }[] = [
              { key: 'ALL', label: '단지 전체', area: 0 },
              ...areaCards.map(c => ({ key: String(c.area), label: c.label, area: c.area })),
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

            const getYm = (monthsAgo: number) => {
              const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
              return d.getFullYear() * 100 + (d.getMonth() + 1);
            };

            // Filter transactions by type if selected
            const baseTx = priceTypeFilter === 'ALL'
              ? transactions
              : transactions.filter(tx => String(tx.area) === priceTypeFilter);

            // Calculate supply pyeong for a transaction
            const getTxSupplyPyeong = (tx: TransactionRecord) => {
              const key = String(tx.area);
              const typeData = typeMap[aptNorm]?.[key];
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

            const periodData = periods.map(p => {
              const cutoffYm = p.months >= 9999 ? 0 : getYm(p.months);
              const filtered = baseTx.filter(tx => parseInt(tx.contractYm) >= cutoffYm);
              const rawAvgPrice = filtered.length > 0 ? filtered.reduce((s, t) => s + t.price, 0) / filtered.length : 0;
              const avgPrice = Math.round(rawAvgPrice / 100) * 100;
              
              // 변동률 전체기간(overallAvgPrice) 기준
              const trendPct = overallAvgPrice > 0 && p.months < 9999 
                ? ((avgPrice - overallAvgPrice) / overallAvgPrice * 100) 
                : null;
              const perPyeong = avgPrice > 0 && avgAreaPyeong > 0
                ? Math.round(avgPrice / avgAreaPyeong)
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
                {/* --- 평형별 최근 거래가 --- */}
                <h5 className="text-[13px] font-bold text-[#8b95a1] mb-3 flex items-center gap-1.5 mt-2">
                  평형별 최근 거래가
                </h5>
                <div className="flex flex-nowrap gap-3 overflow-x-auto pb-4 px-4 md:px-10 -mx-4 md:-mx-10 custom-scrollbar items-stretch p-1">
                  {areaCards.map((c, i) => {
                    const [tc, bgc] = getBadgeColorClasses(c.label);
                    // Use supplyPyeong if available, fallback to approx
                    const pyeong = c.supplyPyeong || (c.area * 0.3025 * 1.33);
                    const perPyeongMan = pyeong > 0 ? Math.round(c.rawPrice / pyeong) : 0;
                    const perPyeongStr = perPyeongMan >= 10000
                      ? `${Math.floor(perPyeongMan / 10000)}억${Math.round(perPyeongMan % 10000) > 0 ? Math.round(perPyeongMan % 10000).toLocaleString() : ''}`
                      : `${perPyeongMan.toLocaleString()}만`;
                    return (
                      <div key={i} className="flex flex-col bg-[#f9fafb] rounded-xl px-5 py-4 ring-1 ring-black/5 hover:ring-[#3182f6]/30 transition-all shrink-0 w-[135px] h-auto">
                        <div className={`text-[12px] font-bold ${tc} ${bgc} inline-block px-2 py-0.5 rounded-md mb-2 w-fit`}>{c.label}</div>
                        <div className="text-[17px] font-extrabold text-[#191f28] leading-tight">{c.price}</div>
                        {perPyeongMan > 0 && <div className="text-[12px] font-bold text-[#4e5968] mt-1">{perPyeongStr}<span className="text-[#8b95a1] font-medium">/평</span></div>}
                        <div className="text-[11px] text-[#8b95a1] mt-1">{c.floor}층</div>
                      </div>
                    );
                  })}
                </div>

                {/* --- 기간별 단지 평균 테이블 --- */}
                {periodData.length > 0 && (
                  <div className="mt-2 border-t border-[#e5e8eb] pt-4">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <h5 className="text-[13px] font-bold text-[#8b95a1] flex items-center gap-1.5">기간별 평균가격
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowPriceHelp((prev: boolean) => !prev); }}
                          className="w-4 h-4 rounded-full bg-[#d1d6db] hover:bg-[#8b95a1] text-[9px] font-extrabold text-white inline-flex items-center justify-center transition-colors leading-none flex-shrink-0"
                          aria-label="기준 설명"
                        >?</button>
                      </h5>
                      {showPriceHelp && (
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={() => setShowPriceHelp(false)} />
                          <div className="absolute left-4 top-12 z-[9999] w-[260px] bg-[#1e293b] text-white text-[11px] leading-relaxed rounded-xl px-4 py-3 shadow-2xl">
                            <div className="font-bold mb-1.5">📊 기간별 평균가격이란?</div>
                            <p className="text-white/80">각 기간 내 실거래된 모든 매매가의 <span className="text-white font-bold">산술 평균</span>입니다.</p>
                            <p className="text-white/80 mt-1">100만 원 단위로 반올림하여 표시합니다.</p>
                            <p className="text-white/50 mt-1.5 text-[10px]">예: "1개월" = 최근 1개월간 거래된 가격의 평균</p>
                          </div>
                        </>
                      )}
                      <span className="text-[10px] text-[#8b95a1] ml-auto">공급 {avgAreaPyeong.toFixed(1)}평 기준</span>
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
                          <tr className="border-b border-[#e5e8eb] text-[#8b95a1] text-[11px] font-bold bg-[#f9fafb]">
                            <th className="py-2.5 px-3 text-left w-[80px]">구분</th>
                            {periodData.map(p => (
                              <th key={`th-${p.key}`} className="py-2.5 px-3 text-right whitespace-nowrap">{p.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-3 text-[12px] font-bold text-[#4e5968] bg-[#f9fafb]/50">평균가격</td>
                            {periodData.map(p => (
                              <td key={`price-${p.key}`} className="py-3 px-3 text-right">
                                <span className="text-[13px] font-extrabold text-[#191f28]">{p.avgPriceEok}</span>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-3 text-[12px] font-bold text-[#4e5968] bg-[#f9fafb]/50">평당가격</td>
                            {periodData.map(p => (
                              <td key={`perpyeong-${p.key}`} className="py-3 px-3 text-right">
                                <span className="text-[12px] font-bold text-[#4e5968]">{p.perPyeongEok}<span className="text-[10px] text-[#8b95a1] font-medium">/평</span></span>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-3 text-[12px] font-bold text-[#4e5968] bg-[#f9fafb]/50">거래건수</td>
                            {periodData.map(p => (
                              <td key={`count-${p.key}`} className="py-3 px-3 text-right">
                                <span className="text-[12px] font-medium text-[#8b95a1]">{p.count}건</span>
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

          {/* Sticky Section Nav — stub이면 숨김 */}
          {!isStub && (
          <nav className="sticky top-0 z-[60] bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] px-4 md:px-8 pt-3 pb-0 shadow-sm shadow-[#191f28]/5">
            <div className="flex gap-6 overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full relative">
              {['단지 기본정보', '단지 입지정보', '밸류에이션 분석', '현장 검증 사진', '아파트 이야기'].map((label, idx) => {
                const ids = ['sec-summary', 'sec-infra-metrics', 'sec-valuation', 'sec-photos', 'sec-comments'];
                const isActive = activeTab === ids[idx];
                return (
                  <button
                    key={ids[idx]}
                    onClick={() => scrollToSection(ids[idx])}
                    className={`relative shrink-0 pb-3 text-[14px] font-bold transition-all duration-200 outline-none ${
                       isActive ? 'text-[#191f28]' : 'text-[#8b95a1] hover:text-[#191f28]'
                    }`}
                  >
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#191f28] rounded-t-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
          )}

          {/* Magazine Content Wrapper — stub이면 숨김 */}
          {!isStub && (
          <div className={`${inline ? 'px-2 py-2 md:px-6 md:py-4' : 'px-2 py-2 md:px-3 md:py-3'} flex flex-col gap-8 w-full`}>

            {/* 1. 단지 기본 명세 (Specs) */}
            {report.metrics && (
              <div id="sec-specs" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb]">
                 <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3">
                   <Building size={18} className="text-[#3182f6]"/> 단지 기본정보
                 </h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">단지명 / 시공사</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.apartmentName} <span className="text-[13px] text-[#4e5968] font-medium ml-1">{report.metrics.brand ? `(${report.metrics.brand})` : ''}</span></p>
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
                            return <>{year}년 {month}월 <span className="text-[13px] text-[#3182f6] font-medium ml-0.5">({ageStr})</span></>;
                          }
                          
                          const year = parseInt(ybStr);
                          const age = currentYear - year + 1;
                          return <>{year}년 <span className="text-[13px] text-[#3182f6] font-medium ml-0.5">({age}년차)</span></>;
                        })() : '-'}
                      </p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">규모 (세대/층)</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.metrics.householdCount ? `${report.metrics.householdCount}세대` : '-'} <span className="text-[#8b95a1] text-[13px] font-medium ml-0.5 whitespace-nowrap">/ {report.metrics.maxFloor ? `최고 ${report.metrics.maxFloor}층` : '-'}</span></p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">용적률 / 건폐율</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.metrics.far ? `${report.metrics.far}%` : '-'} <span className="text-[#8b95a1] text-[13px] font-medium ml-1 whitespace-nowrap">/ {report.metrics.bcr ? `${report.metrics.bcr}%` : '-'}</span></p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">주차대수 (세대당)</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.metrics.parkingCount ? `${report.metrics.parkingCount}대` : '-'} <span className="text-[#8b95a1] text-[13px] font-medium ml-0.5 whitespace-nowrap">/ {report.metrics.parkingPerHousehold ? `${report.metrics.parkingPerHousehold}대` : '-'}</span></p>
                    </div>
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb] md:col-span-2">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">단지 위치 (지도 보기)</p>
                      {report.metrics.coordinates ? (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.metrics.coordinates)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-[#3182f6] font-medium mt-0.5 tracking-tight truncate hover:underline flex items-center gap-1"
                          title="구글 지도에서 보기"
                        >
                          <MapPin size={12} />
                          {report.metrics.coordinates}
                        </a>
                      ) : (
                        <p className="text-[13px] text-[#4e5968] mt-0.5 tracking-tight truncate">-</p>
                      )}
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
            {/* Location Infrastructure Info — Enhanced with categories + raw data */}
            {report.metrics && (report.metrics.distanceToElementary || report.metrics.distanceToSubway || report.metrics.academyDensity) && (
              <div className="flex flex-col w-full">
                <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2 mb-5 border-b border-[#e5e8eb] pb-3">
                  <MapPin size={18} className="text-[#3182f6]"/> 단지 입지정보
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.metrics.distanceToElementary > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-[#e5e8eb] hover:border-[#3182f6]/30 transition-colors">
                      <div className="text-[14px] font-bold text-[#4e5968] mb-2 flex items-center justify-between">
                        <span>초등학교</span>

                      </div>
                      <div className="mt-1">
                        <span className="text-[26px] font-extrabold text-[#191f28] tracking-tight">{report.metrics.distanceToElementary}</span>
                        <span className="text-[14px] font-semibold text-[#8b95a1] ml-1">m</span>
                      </div>
                      {report.metrics.nearestSchoolNames?.elementary && (
                        <div className="text-[13px] font-medium text-[#4e5968] mt-2 truncate bg-white rounded-lg px-2.5 py-1.5 border border-[#f2f4f6]">
                          {report.metrics.nearestSchoolNames.elementary}
                        </div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToMiddle > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-[#e5e8eb] hover:border-[#3182f6]/30 transition-colors">
                      <div className="text-[14px] font-bold text-[#4e5968] mb-2 flex items-center justify-between">
                        <span>중학교</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[26px] font-extrabold text-[#191f28] tracking-tight">{report.metrics.distanceToMiddle}</span>
                        <span className="text-[14px] font-semibold text-[#8b95a1] ml-1">m</span>
                      </div>
                      {report.metrics.nearestSchoolNames?.middle && (
                        <div className="text-[13px] font-medium text-[#4e5968] mt-2 truncate bg-white rounded-lg px-2.5 py-1.5 border border-[#f2f4f6]">
                          {report.metrics.nearestSchoolNames.middle}
                        </div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToHigh > 0 && (
                    <div className="bg-[#f9fafb] rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-[#e5e8eb] hover:border-[#3182f6]/30 transition-colors">
                      <div className="text-[14px] font-bold text-[#4e5968] mb-2 flex items-center justify-between">
                        <span>고등학교</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[26px] font-extrabold text-[#191f28] tracking-tight">{report.metrics.distanceToHigh}</span>
                        <span className="text-[14px] font-semibold text-[#8b95a1] ml-1">m</span>
                      </div>
                      {report.metrics.nearestSchoolNames?.high && (
                        <div className="text-[13px] font-medium text-[#4e5968] mt-2 truncate bg-white rounded-lg px-2.5 py-1.5 border border-[#f2f4f6]">
                          {report.metrics.nearestSchoolNames.high}
                        </div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToSubway > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-[#bfdbfe] hover:border-[#3182f6]/40 transition-colors">
                      <div className="text-[14px] font-bold text-[#3182f6] mb-2 flex items-center justify-between">
                        <span>GTX-A/SRT</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[26px] font-extrabold text-[#3182f6] tracking-tight">{report.metrics.distanceToSubway}</span>
                        <span className="text-[14px] font-semibold text-[#3182f6]/70 ml-1">m</span>
                      </div>
                      {report.metrics.nearestStationName && (
                        <div className="text-[13px] font-medium text-[#3182f6]/90 mt-2 truncate bg-white rounded-lg px-2.5 py-1.5 border border-[#bfdbfe]">
                          {report.metrics.nearestStationName}
                        </div>
                      )}
                    </div>
                  )}
                  {report.metrics.distanceToIndeokwon != null && report.metrics.distanceToIndeokwon > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-[#bfdbfe] hover:border-[#3182f6]/40 transition-colors">
                      <div className="text-[14px] font-bold text-[#3182f6] mb-2 flex items-center justify-between">
                        <span>인덕원선</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[26px] font-extrabold text-[#3182f6] tracking-tight">{report.metrics.distanceToIndeokwon}</span>
                        <span className="text-[14px] font-semibold text-[#3182f6]/70 ml-1">m</span>
                      </div>
                    </div>
                  )}
                  {report.metrics.distanceToTram != null && report.metrics.distanceToTram > 0 && (
                    <div className="bg-[#e8f3ff] rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-[#bfdbfe] hover:border-[#3182f6]/40 transition-colors">
                      <div className="text-[14px] font-bold text-[#3182f6] mb-2 flex items-center justify-between">
                        <span>동탄트램</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[26px] font-extrabold text-[#3182f6] tracking-tight">{report.metrics.distanceToTram}</span>
                        <span className="text-[14px] font-semibold text-[#3182f6]/70 ml-1">m</span>
                      </div>
                    </div>
                  )}
                  {/* Academy Density with Category Breakdown */}
                  {report.metrics.academyDensity > 0 && (
                    <div className="bg-[#f0fdf4] rounded-2xl p-4 md:p-5 flex flex-col justify-between col-span-1 border border-[#bbf7d0] hover:border-[#03c75a]/40 transition-colors">
                      <div className="text-[14px] font-bold text-[#03c75a] mb-2 flex items-center justify-between">
                        <span>학원 (500m 반경)</span>
                      </div>
                      <div className="mt-1 mb-3">
                        <span className="text-[26px] font-extrabold text-[#03c75a] tracking-tight">{report.metrics.academyDensity}</span>
                        <span className="text-[14px] font-semibold text-[#03c75a]/70 ml-1">개</span>
                      </div>
                      {report.metrics.academyCategories && Object.keys(report.metrics.academyCategories).length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-auto">
                          {Object.entries(report.metrics.academyCategories)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([cat, cnt]) => (
                              <div key={cat} className="flex justify-between items-center bg-white rounded-lg px-2.5 py-1.5 border border-[#bbf7d0]">
                                <span className="text-[12px] text-[#4e5968] font-medium truncate mr-2">{cat}</span>
                                <span className="font-extrabold text-[12px] text-[#03c75a] shrink-0">{cnt as number}개</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Restaurant/Cafe Density with Category Breakdown */}
                  {report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0 && (
                    <div className="bg-[#fffbeb] rounded-2xl p-4 md:p-5 flex flex-col justify-between col-span-1 border border-[#fde68a] hover:border-[#f59e0b]/40 transition-colors">
                      <div className="text-[14px] font-bold text-[#f59e0b] mb-2 flex items-center justify-between">
                        <span>음식점·카페 (500m)</span>
                      </div>
                      <div className="mt-1 mb-3">
                        <span className="text-[26px] font-extrabold text-[#f59e0b] tracking-tight">{report.metrics.restaurantDensity}</span>
                        <span className="text-[14px] font-semibold text-[#f59e0b]/70 ml-1">개</span>
                      </div>
                      {report.metrics.restaurantCategories && Object.keys(report.metrics.restaurantCategories).length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-auto">
                          {Object.entries(report.metrics.restaurantCategories)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([cat, cnt]) => (
                              <div key={cat} className="flex justify-between items-center bg-white rounded-lg px-2.5 py-1.5 border border-[#fde68a]">
                                <span className="text-[12px] text-[#4e5968] font-medium truncate mr-2">{cat}</span>
                                <span className="font-extrabold text-[12px] text-[#f59e0b] shrink-0">{cnt as number}개</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>


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
          </div>

            {/* 밸류에이션 리포트 (P/U Ratio & PER) */}
            {transactions.length > 0 && (
              <div id="sec-valuation" className="mb-2 scroll-mt-14 scroll-mb-6">
                <AdvancedValuationMetrics report={report} transactions={sortedFilteredTransactions} />
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
                        {(!!report.scoutingDate || !!report.createdAt) && (
                          <span className="text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-1 rounded-md">
                            촬영일자: {report.scoutingDate 
                              ? String(report.scoutingDate).replace(/-/g, '.')
                              : new Date(report.createdAt as string | number).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').slice(0, -1)}
                          </span>
                        )}
                        <span className="text-[13px] font-bold text-[#8b95a1]">{report.images.length}장</span>
                      </div>
                    </summary>

                    {/* Category Filter Chips */}
                    <GalleryGrid images={report.images} tags={allTags} tagLabels={IMAGE_TAG_LABELS} onImageClick={setFullscreenImage} />
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
          )}
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

