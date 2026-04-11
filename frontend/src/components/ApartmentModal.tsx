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
  deposit?: number;
  monthlyRent?: number;
  floor: number;
  buildYear: number;
  dealType: string;
  reqGb?: string;
  rnuYn?: string;
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
  const [txFilterDealType, setTxFilterDealType] = useState<string>('ALL');
  const [txSort, setTxSort] = useState<{key: string, dir: 'asc'|'desc'}>({key: 'date', dir: 'desc'});
  const [activeDropdown, setActiveDropdown] = useState<'floor' | 'type' | null>(null);
  const [activeTab, setActiveTab] = useState('sec-summary');

  // 차트 매매/전월세 토글
  const [chartType, setChartType] = useState<'sale' | 'jeonse'>('sale');
  const [periodDealType, setPeriodDealType] = useState<'sale' | 'jeonse'>('sale');

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
    return t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : (areaUnit === 'm2' ? `${tx.area}m²` : `${tx.areaPyeong}평`);
  }))).sort();
  // 고유 유형 목록
  const dealTypes = Array.from(new Set(transactions.map(tx => tx.dealType))).sort();

  const chipClass = (active: boolean) => `w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
    active ? 'bg-[#e8f3ff] text-[#3182f6]' : 'bg-transparent text-[#4e5968] hover:bg-[#f2f4f6]'
  }`;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 차트 토글 연동 필터
      if (chartType === 'sale' && (tx.dealType === '전세' || tx.dealType === '월세')) return false;
      if (chartType === 'jeonse' && tx.dealType !== '전세' && tx.dealType !== '월세') return false;
      if (txFilterArea !== 'ALL') {
        const norm = normalizeAptName(tx.aptName);
        const t = typeMap[norm]?.[String(tx.area)];
        const label = t ? (areaUnit === 'm2' ? t.typeM2 : (t.typePyeong || t.typeM2)) : (areaUnit === 'm2' ? `${tx.area}m²` : `${tx.areaPyeong}평`);
        if (label !== txFilterArea) return false;
      }
      if (txFilterDealType !== 'ALL' && tx.dealType !== txFilterDealType) return false;
      return true;
    });
  }, [transactions, txFilterArea, txFilterDealType, typeMap, areaUnit, chartType]);

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
                  
                  {/* 좌우 스와이프 힌트 (모바일 전용) */}
                  <div className="md:hidden flex items-center justify-end px-1 pb-2">
                    <span className="flex items-center gap-1 text-[#8b95a1] bg-[#f2f4f6] px-2 py-1 rounded-md text-[11px] font-bold">
                      <ArrowLeftRight size={12} className="animate-pulse" />
                      표를 좌우로 넘겨서 확인하세요
                    </span>
                  </div>
                  
                  {/* 팝업 오버레이 닫기용 투명 배경 - 레이아웃 간섭(Layout Shift) 방지를 위해 독립 배치 */}
                  {activeDropdown && (
                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                  )}
                  <div className="flex-1 relative min-h-[400px] md:min-h-0">
                    <div className="absolute inset-0 overflow-x-auto overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs md:text-sm">
                      <thead className="sticky top-0 bg-[#f9fafb] z-50">
                        {(() => {
                          const renderSortIcon = (key: string, hasFilter: boolean = false) => (
                            <div className={`p-0.5 rounded cursor-pointer flex items-center justify-center transition-colors ${activeDropdown === key ? 'bg-[#e5e8eb]' : 'hover:bg-[#e5e8eb]'}`} onClick={(e) => {
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
                              <th className="py-2.5 text-center font-bold rounded-tl-lg">
                                <div className="flex items-center justify-center gap-0.5 w-full relative">
                                  <span>계약일</span>
                                </div>
                              </th>
                              <th className="py-2.5 text-center font-bold w-[25%]">
                                <div className="flex items-center justify-center gap-0.5 w-full">
                                  <span>금액</span>
                                </div>
                              </th>
                              <th className="py-2.5 text-center font-bold w-[16%] group hover:bg-[#f2f4f6] transition-colors relative">
                                <div className="flex items-center justify-center gap-0.5">
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
                              <th className="py-2.5 text-center font-bold w-[13%] group hover:bg-[#f2f4f6] transition-colors relative">
                                <div className="flex items-center justify-center gap-0.5 cursor-pointer" onClick={() => handleTxSort('floor')}>
                                  <span>층</span>
                                  {renderSortIcon('floor', false)}
                                </div>
                              </th>
                              <th className="py-2.5 pr-2 text-right font-bold w-[22%] group hover:bg-[#f2f4f6] transition-colors rounded-tr-lg relative">
                                <div className="flex items-center justify-end gap-0.5 tracking-tight">
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
                              if (!label) return <span className="text-[10px] md:text-xs">{areaUnit === 'm2' ? `${tx.area}m²` : `${tx.areaPyeong}평`}</span>;
                              const [tc, bgc] = getBadgeColorClasses(label);
                              return <span className={`font-bold ${tc} ${bgc} px-1.5 py-0.5 rounded text-[10px] md:text-xs`} title={areaUnit === 'm2' ? `${tx.areaPyeong}평` : `${tx.area}m²`}>{label}</span>;
                            })();
                            return (
                              <tr key={idx} className={`border-b border-[#f2f4f6] hover:bg-white/60 transition-colors ${isRecent ? 'bg-[#f0f7ff]' : ''}`}>
                                <td className={`py-2.5 pl-1 md:pl-2 whitespace-nowrap align-middle tracking-tight ${isRecent ? 'text-[#191f28] font-bold' : 'text-[#4e5968]'}`}>
                                  <div className="flex items-center w-full">
                                    {isRecent ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3182f6] mr-1 shrink-0" /> : <span className="inline-block w-1.5 h-1.5 mr-1 shrink-0" />}
                                    <span>{tx.contractYm.slice(2,4)}.{tx.contractYm.slice(4)}.{tx.contractDay}</span>
                                  </div>
                                </td>
                                <td className={`py-2.5 pr-1 text-right font-extrabold align-middle whitespace-nowrap tracking-tighter ${isRecent ? 'text-[#3182f6]' : 'text-[#191f28]'}`}>{tx.priceEok}</td>
                                <td className="py-2.5 text-center align-middle">{badgeEl}</td>
                                <td className="py-2.5 text-center text-[#4e5968] align-middle">{tx.floor}</td>
                                <td className="py-2.5 pr-1 md:pr-2 text-right align-middle text-[#8b95a1] w-[22%]">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="whitespace-nowrap truncate">{tx.dealType}</span>
                                    {(tx.reqGb || tx.rnuYn === '사용') && (
                                      <div className="flex items-center gap-0.5">
                                        {tx.reqGb === '신규' && (
                                          <span className="shrink-0 whitespace-nowrap text-[9px] md:text-[10px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-1 py-0.5 rounded leading-none">신규</span>
                                        )}
                                        {tx.rnuYn === '사용' ? (
                                          <span className="shrink-0 whitespace-nowrap text-[9px] md:text-[10px] font-bold bg-[#f0fdf4] text-[#03c75a] px-1 py-0.5 rounded leading-none">청구권</span>
                                        ) : (
                                          tx.reqGb === '갱신' && (
                                            <span className="shrink-0 whitespace-nowrap text-[9px] md:text-[10px] font-bold bg-[#e8f3ff] text-[#3182f6] px-1 py-0.5 rounded leading-none">재계약</span>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                    </div>
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
               <div className="flex items-center justify-between mb-3 w-full">
                 <div className="flex items-center gap-2">
                   <span className="bg-[#3182f6] text-white text-sm font-bold px-3 py-1 rounded-full">{report.dong || '동탄'}</span>
                 </div>
                 {/* 전역 마스터 스위치 */}
                 <div className="bg-[#f2f4f6] p-0.5 rounded-xl flex items-center shadow-inner">
                   <button onClick={() => setChartType('sale')} className={`px-4 py-1 rounded-lg text-[13px] font-bold transition-all ${chartType === 'sale' ? 'bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-[#8b95a1] hover:text-[#4e5968]'}`}>매매</button>
                   <button onClick={() => setChartType('jeonse')} className={`px-4 py-1 rounded-lg text-[13px] font-bold transition-all ${chartType === 'jeonse' ? 'bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-[#8b95a1] hover:text-[#4e5968]'}`}>전월세</button>
                 </div>
               </div>
               <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-2 text-[#191f28] flex items-center gap-2">
                 {report.apartmentName}
                 <a 
                   href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.apartmentName + (report.apartmentName.includes('아파트') ? '' : ' 아파트'))}`}
                   target="_blank" rel="noopener noreferrer"
                   className="text-[#3182f6] hover:bg-[#e8f3ff] p-1.5 md:p-2 rounded-full transition-colors group flex shrink-0 items-center justify-center -ml-1 md:ml-0"
                   title="구글 지도에서 아파트 위치 보기"
                 >
                   <MapPin className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                 </a>
               </h1>

               {/* 매매가/전세가 추이 차트 — 산점도(층수별) + 거래량 막대 + 이동평균선 */}
               {transactions.length > 0 && (() => {
                 const relevantTxs = transactions.filter(tx => 
                   chartType === 'sale' 
                     ? (tx.dealType !== '전세' && tx.dealType !== '월세') 
                     : (tx.dealType === '전세' || tx.dealType === '월세')
                 );

                 if (relevantTxs.length === 0) {
                   return (
                     <div className="bg-[#f9fafb] rounded-2xl p-8 flex items-center justify-center ring-1 ring-black/5 mt-4 min-h-[300px]">
                       <span className="text-[#8b95a1] text-sm font-bold">해당 유형의 거래 기록이 없습니다</span>
                     </div>
                   );
                 }

                 const rawData = relevantTxs.map((tx) => {
                   let rawPrice = tx.price;
                   // 월세 -> 전세 환산 공식 (전월세전환율 약 5.5% 가정)
                   if (chartType === 'jeonse') {
                     rawPrice = (tx.deposit || 0) + Math.round((tx.monthlyRent || 0) * 12 / 0.055);
                   }

                   let priceEokNum = rawPrice / 10000;
                   if (priceEokNum > 100) priceEokNum = rawPrice / 100000000;
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

                 // 단일 색상
                 const getFloorColor = (floor: number) => '#3182f6';

                 // 월별 평균 + 거래량
                 const byMonthTier = new Map<number, { all: number[] }>();
                 scatterData.forEach(d => {
                   if (!byMonthTier.has(d.yearMonth)) byMonthTier.set(d.yearMonth, { all: [] });
                   const bucket = byMonthTier.get(d.yearMonth)!;
                   bucket.all.push(d.price);
                 });
                 const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 1000) / 1000 : undefined;
                 const monthlyData = Array.from(byMonthTier.entries())
                   .map(([ym, buckets]) => ({
                     ts: new Date(Math.floor(ym / 100), (ym % 100) - 1, 15).getTime(),
                     monthAvg: avg(buckets.all)!,
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

                 // 1M, 3M, 6M, 1Y 기준 모멘텀 계산 (차트 기간 필터와 무관하게 전체 rawData 기준)
                 const getRecentAvgByMonths = (months: number) => {
                   const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
                   const cutoffYm = cutoffDate.getFullYear() * 100 + (cutoffDate.getMonth() + 1);
                   const filtered = rawData.filter(d => d.yearMonth >= cutoffYm);
                   if (filtered.length === 0) return 0;
                   
                   // 이상치(급매/오류) 제거 후 평균
                   const sorted = [...filtered].sort((a,b) => a.price - b.price);
                   const q1 = sorted[Math.floor(sorted.length * 0.05)]?.price || 0;
                   const q3 = sorted[Math.floor(sorted.length * 0.95)]?.price || 10;
                   const iqr = q3 - q1;
                   const valid = sorted.filter(d => d.price >= q1 - iqr * 3 && d.price <= q3 + iqr * 3);
                   if (valid.length === 0) return 0;
                   return valid.reduce((acc, d) => acc + d.price, 0) / valid.length;
                 };

                 const momentum = {
                 m1: getRecentAvgByMonths(1),
                 m3: getRecentAvgByMonths(3),
                 m6: getRecentAvgByMonths(6),
                 y1: getRecentAvgByMonths(12),
                   y3: getRecentAvgByMonths(36)
                  };

                 const formatAvgPriceEok = (avg: number) => {
                   if (!avg) return '-';
                   const roundedAvg = Math.round(avg * 100) / 100;
                   const eok = Math.floor(roundedAvg);
                   const rem = Math.round((roundedAvg % 1) * 10000);
                   return `${eok >= 1 ? `${eok}억` : ''}${rem > 0 ? rem.toLocaleString() : (eok > 0 ? '' : '0')}`;
                 };

                 return (
                   <div className="mt-4 bg-white rounded-2xl p-5 ring-1 ring-black/5 flex-1">
                      <div className="flex items-center justify-between mb-3 w-full">
                        <h4 className="text-[14px] font-extrabold text-[#191f28] flex items-center gap-1.5 shrink-0">
                          <TrendingUp size={15} className="text-[#3182f6]" /> {chartType === 'sale' ? '매매가 추이' : '전월세 추이'}
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-0.5 bg-[#f2f4f6] p-0.5 rounded-lg shadow-inner">
                            {(['6M','1Y','3Y','ALL'] as const).map(tf => (
                              <button key={tf} onClick={() => setChartTimeframe(tf)}
                                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                  chartTimeframe === tf ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:bg-[#e5e8eb]'
                                }`}>{tf}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                     <div className="grid grid-cols-5 divide-x divide-[#e5e8eb] w-full mb-5 bg-[#f9fafb] py-3 rounded-xl border border-[#e5e8eb] overflow-x-auto scrollbar-hide">
                       <div className="flex flex-col px-3 sm:px-4">
                         <span className="text-[11px] font-bold text-[#8b95a1] mb-0.5 whitespace-nowrap">1개월 평균</span>
                         <span className="text-[16px] font-extrabold text-[#191f28] whitespace-nowrap">{formatAvgPriceEok(momentum.m1)}</span>
                       </div>
                       <div className="flex flex-col px-3 sm:px-4">
                         <span className="text-[11px] font-bold text-[#8b95a1] mb-0.5 whitespace-nowrap">3개월 평균</span>
                         <span className="text-[16px] font-extrabold text-[#191f28] whitespace-nowrap">{formatAvgPriceEok(momentum.m3)}</span>
                       </div>
                       <div className="flex flex-col px-3 sm:px-4">
                         <span className="text-[11px] font-bold text-[#8b95a1] mb-0.5 whitespace-nowrap">6개월 평균</span>
                         <span className="text-[16px] font-extrabold text-[#4e5968] whitespace-nowrap">{formatAvgPriceEok(momentum.m6)}</span>
                       </div>
                       <div className="flex flex-col px-3 sm:px-4">
                         <span className="text-[11px] font-bold text-[#8b95a1] mb-0.5 whitespace-nowrap">1년 평균</span>
                         <span className="text-[16px] font-extrabold text-[#4e5968] whitespace-nowrap">{formatAvgPriceEok(momentum.y1)}</span>
                       </div>
                       <div className="flex flex-col px-3 sm:px-4">
                         <span className="text-[11px] font-bold text-[#8b95a1] mb-0.5 whitespace-nowrap">3년 평균</span>
                         <span className="text-[16px] font-extrabold text-[#4e5968] whitespace-nowrap">{formatAvgPriceEok(momentum.y3)}</span>
                       </div>
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
                                 <div style={{ background: '#ffffff', borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #f2f4f6' }}>
                                   <div style={{ color: '#8b95a1', fontSize: 11, marginBottom: 4 }}>
                                     {new Date(item?.ts).getFullYear()}.{String(new Date(item?.ts).getMonth()+1).padStart(2,'0')}월
                                   </div>
                                   {item?.monthAvg && <div style={{ color: '#191f28', fontSize: 12, fontWeight: 700 }}>평균 {item.monthAvg.toFixed(2)}억</div>}
                                   {vol != null && <div style={{ color: '#8b95a1', fontSize: 11, marginTop: 2 }}>거래 {vol}건</div>}
                                 </div>
                               );
                             }}
                             cursor={{ stroke: '#d1d6db', strokeWidth: 1, strokeDasharray: '3 3' }}
                           />
                           {/* 가격 밴드 (P5~P95) - 배경이 탁해 보여 유저 요청으로 삭제 */}
                           {/* 거래량 막대그래프 */}
                           <Bar dataKey="volume" yAxisId="volume" fill="#e5e8eb" radius={[2, 2, 0, 0]} maxBarSize={12} opacity={0.6} isAnimationActive={false} />
                           {/* 월별 평균선 — 실선 */}
                           <Line type="monotone" dataKey="monthAvg" yAxisId="price" stroke="#3182f6" strokeWidth={2} dot={false} activeDot={false} connectNulls isAnimationActive={false} />
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
                             background: '#ffffff', borderRadius: 10, padding: '10px 14px', border: '1px solid #f2f4f6',
                             boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                             pointerEvents: 'none', zIndex: 10, whiteSpace: 'nowrap',
                           }}>
                             <div style={{ color: '#8b95a1', fontSize: 11, marginBottom: 4 }}>{d.fullDate}</div>
                             <div style={{ color: '#191f28', fontSize: 16, fontWeight: 800, marginBottom: 3 }}>
                               {d.priceEok || `${d.price.toFixed(2)}억`}
                             </div>
                             <div style={{ color: '#8b95a1', fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
                               {typeName ? <span style={{ color: '#3182f6', fontWeight: 600 }}>{typeName}</span> : <span>{areaUnit === 'm2' ? `${d.rawArea}m²` : `${d.area}평`}</span>}
                               <span>·</span><span style={{ color: getFloorColor(d.floor) }}>{d.floor}층</span>
                               {d.dealType && <><span>·</span><span>{d.dealType}</span></>}
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                     {/* 범례 */}
                     <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 mt-2 px-1 text-[12px] sm:text-[13px] font-bold text-[#8b95a1]">
                       <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="w-5 sm:w-6 h-[1.5px] bg-[#3182f6] rounded"/>평균가</span>
                       <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="w-3.5 h-3.5 bg-[#e5e8eb] rounded-sm"/>거래량</span>
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

            const getYm = (monthsAgo: number) => {
              const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
              return d.getFullYear() * 100 + (d.getMonth() + 1);
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
                {/* --- 기간별 단지 평균 테이블 --- */}
                {periodData.length > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
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
                            <th className="py-2.5 px-3 text-left w-[80px]">구분</th>
                            {periodData.map(p => (
                              <th key={`th-${p.key}`} className="py-2.5 px-3 text-right whitespace-nowrap">{p.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-3 text-[13px] font-bold text-[#4e5968] bg-[#f9fafb]/50">평균가격</td>
                            {periodData.map(p => (
                              <td key={`price-${p.key}`} className="py-3 px-3 text-right">
                                <span className="text-[14px] font-extrabold text-[#191f28]">{p.avgPriceEok}</span>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-3 text-[13px] font-bold text-[#4e5968] bg-[#f9fafb]/50">평당가격</td>
                            {periodData.map(p => (
                              <td key={`perpyeong-${p.key}`} className="py-3 px-3 text-right">
                                <span className="text-[13px] font-bold text-[#4e5968]">{p.perPyeongEok}<span className="text-[11px] text-[#8b95a1] font-medium">/평</span></span>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-[#f2f4f6] hover:bg-[#f8faff] transition-colors">
                            <td className="py-3 px-3 text-[13px] font-bold text-[#4e5968] bg-[#f9fafb]/50">거래건수</td>
                            {periodData.map(p => (
                              <td key={`count-${p.key}`} className="py-3 px-3 text-right">
                                <span className="text-[13px] font-medium text-[#8b95a1]">{p.count}건</span>
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
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e8eb]">
                      <p className="text-[12px] text-[#8b95a1] font-bold mb-1">단지명 / 시공사</p>
                      <p className="text-[15px] text-[#191f28] font-bold">{report.apartmentName} {report.metrics.brand && <span className="block text-[13px] text-[#4e5968] font-medium mt-0.5">({report.metrics.brand})</span>}</p>
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
                    <div className="grid grid-cols-3 gap-2.5">
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
                          <div key={school.label} className={`${s.bg} rounded-2xl p-4 flex flex-col border ${s.border} hover:shadow-md transition-all duration-200 group`}>
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[13px] font-bold text-[#4e5968]">
                                {school.label}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
                            </div>
                            <div className="flex items-baseline gap-0.5">
                              <span className={`text-[28px] font-black ${s.text} tracking-tight tabular-nums leading-none`}>{(school.dist! / 1000).toFixed(2)}</span>
                              <span className={`text-[13px] font-semibold ${s.text} opacity-60 ml-0.5`}>km</span>
                            </div>
                            {school.name && (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name + ' 화성시')}`}
                                target="_blank" rel="noopener noreferrer"
                                className={`text-[12px] flex items-center justify-center gap-1 font-semibold ${s.text} mt-2.5 ${s.badge} rounded-lg px-2.5 py-1.5 text-center hover:opacity-80 transition-opacity`}
                                title={`${school.name} 구글 지도에서 보기`}
                              >
                                <MapPin size={12} className="shrink-0" />
                                <span className="truncate">{school.name}</span>
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
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { label: report.metrics.nearestStationLine || 'GTX-A / SRT', dist: report.metrics.distanceToSubway, name: report.metrics.nearestStationName, coords: report.metrics.nearestStationCoords, color: '#3182f6', bgFrom: '#eef6ff', bgTo: '#dbeafe' },
                        { label: report.metrics.nearestIndeokwonLine || '인덕원선', dist: report.metrics.distanceToIndeokwon, name: report.metrics.nearestIndeokwonStationName, coords: report.metrics.nearestIndeokwonCoords, color: '#7c3aed', bgFrom: '#f5f3ff', bgTo: '#ede9fe' },
                        { label: report.metrics.nearestTramLine || '동탄트램', dist: report.metrics.distanceToTram, name: report.metrics.nearestTramStationName, coords: report.metrics.nearestTramCoords, color: '#0891b2', bgFrom: '#ecfeff', bgTo: '#cffafe' },
                      ].filter(s => s.dist != null && s.dist > 0).map(station => (
                        <div key={station.label}
                          className="rounded-2xl p-4 flex flex-col border hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${station.bgFrom}, ${station.bgTo})`,
                            borderColor: `${station.color}25`,
                          }}>
                          {/* Subtle gradient accent bar */}
                          <div className="absolute top-0 left-0 right-0 h-[3px] opacity-80" style={{ background: `linear-gradient(90deg, ${station.color}, ${station.color}60)` }} />
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[13px] font-bold" style={{ color: station.color }}>
                              {station.label}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[28px] font-black tracking-tight tabular-nums leading-none" style={{ color: station.color }}>{(station.dist! / 1000).toFixed(2)}</span>
                            <span className="text-[13px] font-semibold opacity-50 ml-0.5" style={{ color: station.color }}>km</span>
                          </div>
                          {station.name && (
                            <a 
                              href={station.coords ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.coords)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.name + (station.name.includes('정거장') ? ' 동탄' : ' 역'))}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[12px] flex items-center justify-center gap-1 font-semibold mt-2.5 rounded-lg px-2.5 py-1.5 text-center bg-white/80 backdrop-blur-sm hover:opacity-80 transition-opacity"
                              style={{ color: station.color, border: `1px solid ${station.color}20` }}
                              title={`${station.name} 구글 지도에서 보기`}
                            >
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">{station.name}</span>
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
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Academy Density */}
                      {report.metrics.academyDensity > 0 && (
                        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]/50 rounded-2xl p-4 md:p-5 flex flex-col border border-[#bbf7d0] hover:shadow-md transition-all duration-200 relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#22c55e] to-[#22c55e]/40" />
                          <div className="text-[13px] font-bold text-[#15803d] mb-2">
                            학원 · 500m 반경
                          </div>
                          <div className="flex items-baseline gap-0.5 mb-3">
                            <span className="text-[30px] font-black text-[#15803d] tracking-tight tabular-nums leading-none">{report.metrics.academyDensity}</span>
                            <span className="text-[13px] font-semibold text-[#15803d]/60 ml-0.5">개</span>
                          </div>
                          {report.metrics.academyCategories && Object.keys(report.metrics.academyCategories).length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-auto">
                              {Object.entries(report.metrics.academyCategories)
                                .sort(([,a], [,b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([cat, cnt]) => (
                                  <div key={cat} className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-[#bbf7d0]/60">
                                    <span className="text-[12px] text-[#4e5968] font-medium truncate mr-2">{cat}</span>
                                    <span className="font-extrabold text-[12px] text-[#15803d] shrink-0 tabular-nums">{cnt as number}개</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Restaurant/Cafe Density */}
                      {report.metrics.restaurantDensity != null && report.metrics.restaurantDensity > 0 && (
                        <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]/50 rounded-2xl p-4 md:p-5 flex flex-col border border-[#fde68a] hover:shadow-md transition-all duration-200 relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f59e0b] to-[#f59e0b]/40" />
                          <div className="text-[13px] font-bold text-[#b45309] mb-2">
                            음식점 · 카페 · 500m
                          </div>
                          <div className="flex items-baseline gap-0.5 mb-3">
                            <span className="text-[30px] font-black text-[#b45309] tracking-tight tabular-nums leading-none">{report.metrics.restaurantDensity}</span>
                            <span className="text-[13px] font-semibold text-[#b45309]/60 ml-0.5">개</span>
                          </div>
                          {report.metrics.restaurantCategories && Object.keys(report.metrics.restaurantCategories).length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-auto">
                              {Object.entries(report.metrics.restaurantCategories)
                                .sort(([,a], [,b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([cat, cnt]) => (
                                  <div key={cat} className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-[#fde68a]/60">
                                    <span className="text-[12px] text-[#4e5968] font-medium truncate mr-2">{cat}</span>
                                    <span className="font-extrabold text-[12px] text-[#b45309] shrink-0 tabular-nums">{cnt as number}개</span>
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

