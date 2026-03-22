'use client';

import { 
  Building, MapPin, Map as MapIcon, Compass, MessageSquare, Heart, X, FileText,
  LayoutDashboard, UserCircle, Star, Link2, Trash2, LogOut,
  Home, PenLine, Send, Edit3, Shield, ShieldCheck, Building2, Check, Pencil
} from 'lucide-react';
import Image from 'next/image';

import { useDashboardData, dashboardFacade, CommentData, FieldReportData, UserReview } from '@/lib/DashboardFacade';
import WriteReviewModal from '@/components/WriteReviewModal';
import ApartmentCard from '@/components/ApartmentCard';
import DongFilterBar from '@/components/DongFilterBar';
import { FieldReportModal } from '@/components/ApartmentModal';
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
    <div className="min-h-screen bg-[#f2f4f6] font-sans selection:bg-[#3182f6]/20">
      
      {/* a11y: Skip to Content */}
      <a href="#main-content" className="skip-to-content">내용으로 건너뛰기</a>

      {/* Top Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#e5e8eb] sticky top-0 z-40 transition-all duration-300" role="banner">
        <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16 h-14 sm:h-16 flex justify-between items-center">
          {/* Left: Pill Tabs + Branding */}
          <div className="flex items-center gap-3">
            <nav aria-label="메인 네비게이션">
            <div className="inline-flex bg-[#f2f4f6] rounded-full p-1 gap-0.5" role="tablist">
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
            </nav>
            <span className="text-[17px] text-[#8b95a1] font-medium hidden sm:inline">by <span className="font-extrabold text-[#191f28]">임장크루</span></span>
          </div>
          {/* User bar is now handled by FloatingUserBar in layout.tsx */}
          </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16 py-5 sm:py-8 md:py-12 animate-in fade-in duration-500">

        {/* ═══ TAB 1: 임장기 ═══ */}
        {mounted && activeTab === 'imjang' && (
        <section>
          {/* 1. Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <h1 className="text-[22px] sm:text-[28px] md:text-[36px] font-extrabold text-[#191f28] tracking-tight">
                동탄 아파트 탐색
              </h1>
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

          <DongFilterBar
            selectedDong={selectedDong}
            onSelectDong={setSelectedDong}
            totalAptCount={Object.values(sheetApartments).flat().length}
            dongAptCounts={dongAptCounts}
            dongReportCounts={dongReportCounts}
          />

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
                          {(dongReportCounts[dongName] || 0) > 0 && (
                            <span className="text-[10px] font-bold bg-[#f0fdf4] text-[#03c75a] px-2 py-0.5 rounded-full">✅ 현장 검증 {dongReportCounts[dongName]}건</span>
                          )}
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
                            <ApartmentCard
                              key={apt.name}
                              apt={apt}
                              txSummary={txSummary}
                              report={report}
                              isPublicRental={publicRentalSet.has(apt.name)}
                              onClick={() => {
                                if (report) {
                                  setSelectedReport(report);
                                } else {
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
                            />
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

            {/* ── 7대 투자 권역 ── */}
            <div>
              <h3 className="text-[18px] font-extrabold text-[#191f28] mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#3182f6]" />
                7대 투자 권역
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ZONES.map(zone => (
                  <div
                    key={zone.id}
                    onClick={() => router.push(`/zone/${zone.id}`)}
                    className="bg-white rounded-2xl border border-[#e5e8eb] p-5 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-[15px] font-extrabold text-[#191f28] group-hover:text-[#3182f6] transition-colors">{zone.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-md inline-block mb-2">{zone.dongLabel}</span>
                    <p className="text-[13px] text-[#4e5968] leading-relaxed line-clamp-2">{zone.description}</p>
                  </div>
                ))}
              </div>
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
