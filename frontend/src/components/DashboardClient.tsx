'use client';

import { ArrowUp, Building, MapPin, Map as MapIcon, Compass, MessageSquare, Heart, X, FileText,
  LayoutDashboard, UserCircle, Star, Link2, Trash2, LogOut,
  Home, PenLine, Send, Edit3, Shield, ShieldCheck, Building2, Check, Pencil, ChevronDown, Eye } from 'lucide-react';
import { logger } from '@/lib/services/logger';
import Image from 'next/image';

import { useDashboardData, dashboardFacade, CommentData, FieldReportData, UserReview } from '@/lib/DashboardFacade';
import ApartmentCard from '@/components/ApartmentCard';
import DongFilterBar from '@/components/DongFilterBar';
import FloatingUserBar from '@/components/FloatingUserBar';
import dynamic from 'next/dynamic';

// Heavy components — loaded on demand (saves ~200KB initial JS)
const FieldReportModal = dynamic(() => import('@/components/ApartmentModal').then(m => ({ default: m.FieldReportModal })), { ssr: false });
const WriteReviewModal = dynamic(() => import('@/components/WriteReviewModal'), { ssr: false });
import { DONGS, getDongByName, getDongColor, getAllDongNames } from '@/lib/dongs';
import { ZONES } from '@/lib/zones';
import { buildInitialApartments, type DongApartment } from '@/lib/dong-apartments';

interface StaticApartment { name: string; dong: string; householdCount?: number; yearBuilt?: string; brand?: string; }
import { TX_SUMMARY, type AptTxSummary } from '@/lib/transaction-summary';
import { isSameApartment, normalizeAptName, findTxKey, getDisplayAptName } from '@/lib/utils/apartmentMapping';
import * as PurchaseRepo from '@/lib/repositories/purchase.repository';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import * as UserRepo from '@/lib/repositories/user.repository';
import type { UserProfile } from '@/lib/types/user.types';
import { getDisplayName } from '@/lib/types/user.types';
import { FixedSizeList } from 'react-window';

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
}


export default function DashboardClient({ initialDashboardData }: { initialDashboardData?: any }) {
  const router = useRouter();
  const { kpis, newsFeed, fieldReports, userReviews, dongtanApartments, adBanner } = useDashboardData();
  const [selectedReport, setSelectedReport] = useState<FieldReportData | null>(null);
  const [fullReportData, setFullReportData] = useState<FieldReportData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  // Comments State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<string, CommentData[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  // Transaction summary — direct static import (no API fetch needed)
  const txSummaryData: Record<string, AptTxSummary> = TX_SUMMARY;

  // Tab state
  const [activeTab, setActiveTab] = useState<'imjang' | 'lounge' | 'recommend'>('imjang');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Dong filter state
  const [selectedDong, setSelectedDong] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 80);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [listSort, setListSort] = useState<'views' | 'likes' | 'name'>('views');

  const [listHeight, setListHeight] = useState(600);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHeight = () => {
        if (window.innerWidth >= 768) {
          setListHeight(Math.max(400, window.innerHeight - 128 - 65)); // 100vh - 8rem(128px) - filterBar(65px)
        } else {
          setListHeight(600);
        }
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);

  // Mobile modal: only open when user explicitly taps an apartment
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  // Track explicit user selection to prevent auto-select override
  const userHasSelected = useRef(false);

  // Favorites state
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});

  // Apartment data — 구글 시트 자동 동기화 (정적 데이터는 폴백)
  const [sheetApartments, setSheetApartments] = useState(buildInitialApartments);
  useEffect(() => {
    fetch('/api/apartments-by-dong')
      .then(r => r.json())
      .then(data => {
        if (data.byDong && Object.keys(data.byDong).length > 0) {
          // Apply display name overriding dynamically from the mapping
          const updatedByDong = Object.fromEntries(
            Object.entries(data.byDong).map(([dong, apts]) => {
              const mappedApts = (apts as DongApartment[]).map(a => ({ ...a, name: getDisplayAptName(a.name) }));
              // Deduplicate by name: keep the one with more valid data
              const dedupedMap = new Map<string, DongApartment>();
              for (const a of mappedApts) {
                const existing = dedupedMap.get(a.name);
                if (!existing || (a.lat !== 0 && existing.lat === 0) || (a.householdCount && !existing.householdCount)) {
                  dedupedMap.set(a.name, a);
                }
              }
              return [dong, Array.from(dedupedMap.values())];
            })
          );
          setSheetApartments(updatedByDong);
        }
      })
      .catch((err) => { logger.warn('Dashboard', 'Failed to fetch apartments, falling back to static', {}, err); }); // 실패 시 정적 폴백 유지
  }, []);

  // 거래내역, 평/면적 토글 상태
  const [typeMap, setTypeMap] = useState<Record<string, Record<string, { typeM2: string; typePyeong: string }>>>({});
  const [areaUnit, setAreaUnit] = useState<'m2' | 'pyeong'>('m2');

  // Name mapping + public rental
  const [nameMapping, setNameMapping] = useState<Record<string, string> | undefined>(undefined);
  const [publicRentalSet, setPublicRentalSet] = useState<Set<string>>(new Set());

  // Consolidated dashboard init — replaces 3 separate API calls + 1 Firestore read
  useEffect(() => {
    if (initialDashboardData) {
      if (initialDashboardData.favoriteCounts) setFavoriteCounts(initialDashboardData.favoriteCounts);
      if (initialDashboardData.typeMap) {
        const map: Record<string, Record<string, { typeM2: string; typePyeong: string }>> = {};
        for (const e of initialDashboardData.typeMap) {
          const key = normalizeAptName(e.aptName);
          if (!map[key]) map[key] = {};
          const normalizedArea = String(Number(e.area));
          map[key][normalizedArea] = { typeM2: e.typeM2, typePyeong: e.typePyeong };
        }
        setTypeMap(map);
      }
      if (initialDashboardData.apartmentMeta) {
        const mapping: Record<string, string> = {};
        const rentals = new Set<string>();
        for (const [name, meta] of Object.entries(initialDashboardData.apartmentMeta)) {
          if (!meta || typeof meta !== 'object' || !(meta as Record<string, unknown>).dong) continue;
          if ((meta as Record<string, string>).txKey) mapping[name] = (meta as Record<string, string>).txKey;
          if ((meta as Record<string, unknown>).isPublicRental) rentals.add(name);
        }
        setNameMapping(mapping);
        setPublicRentalSet(rentals);
      } else {
        setNameMapping({});
      }
      return;
    }

    const initTimeout = setTimeout(() => {
      setNameMapping(prev => prev === undefined ? {} : prev);
    }, 5000);

    fetch('/api/dashboard-init').then(r => r.json()).then(data => {
      clearTimeout(initTimeout);

      // Favorite counts
      if (data.favoriteCounts) setFavoriteCounts(data.favoriteCounts);

      // Type map
      if (data.typeMap) {
        const map: Record<string, Record<string, { typeM2: string; typePyeong: string }>> = {};
        for (const e of data.typeMap) {
          const key = normalizeAptName(e.aptName);
          if (!map[key]) map[key] = {};
          const normalizedArea = String(Number(e.area));
          map[key][normalizedArea] = { typeM2: e.typeM2, typePyeong: e.typePyeong };
        }
        setTypeMap(map);
      }

      // Apartment meta (name mapping + public rental)
      if (data.apartmentMeta) {
        const mapping: Record<string, string> = {};
        const rentals = new Set<string>();
        for (const [name, meta] of Object.entries(data.apartmentMeta)) {
          if (!meta || typeof meta !== 'object' || !(meta as Record<string, unknown>).dong) continue;
          if ((meta as Record<string, string>).txKey) mapping[name] = (meta as Record<string, string>).txKey;
          if ((meta as Record<string, unknown>).isPublicRental) rentals.add(name);
        }
        setNameMapping(mapping);
        setPublicRentalSet(rentals);
      } else {
        setNameMapping({});
      }
    }).catch(() => {
      clearTimeout(initTimeout);
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

  // Fetch user favorites when auth changes
  useEffect(() => {
    if (user) {
      user.getIdToken().then(idToken => {
        fetch(`/api/favorite?userId=${user.uid}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        }).then(r => r.json()).then(data => {
          if (data.favorites) setUserFavorites(new Set(data.favorites));
        }).catch((err) => { logger.warn('Dashboard', 'Failed to fetch favorites', { userId: user.uid }, err); });
      }).catch(err => logger.warn('Dashboard', 'Auth token fetch failed', {}, err));
    } else {
      setUserFavorites(new Set());
    }
  }, [user]);

  // Toggle favorite handler
  const handleToggleFavorite = async (aptName: string) => {
    if (!user) {
      // Trigger login
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('@/lib/firebaseConfig');
      try { await signInWithPopup(auth, googleProvider); } catch { /* cancelled */ }
      return;
    }
    // Optimistic update
    const wasFavorited = userFavorites.has(aptName);
    setUserFavorites(prev => {
      const next = new Set(prev);
      wasFavorited ? next.delete(aptName) : next.add(aptName);
      return next;
    });
    setFavoriteCounts(prev => ({
      ...prev,
      [aptName]: Math.max(0, (prev[aptName] || 0) + (wasFavorited ? -1 : 1))
    }));
    // Server sync
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/favorite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ aptName }),
      });
      if (!res.ok) throw new Error('API failed');
    } catch {
      // Revert on failure
      setUserFavorites(prev => {
        const next = new Set(prev);
        wasFavorited ? next.add(aptName) : next.delete(aptName);
        return next;
      });
      setFavoriteCounts(prev => ({
        ...prev,
        [aptName]: Math.max(0, (prev[aptName] || 0) + (wasFavorited ? 1 : -1))
      }));
    }
  };

  // Auto-select first apartment as default for desktop detail panel
  // Skip on mobile (<768px) to prevent the full-screen modal from auto-opening
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    // Skip if user has explicitly clicked an apartment
    if (userHasSelected.current) return;
    if (selectedReport) return;
    const allApts = Object.values(sheetApartments).flat();
    if (allApts.length === 0) return;
    // Don't auto-select until viewCount data is loaded (prevents wrong-apartment flash)
    const hasViewData = fieldReports.some(r => (r.viewCount || 0) > 0);
    if (!hasViewData) return;
    // Apply same sorting as visible list (default: 조회수)
    const sorted = [...allApts].sort((a, b) => {
      const aReport = fieldReports.find(r => isSameApartment(r.apartmentName, a.name, nameMapping));
      const bReport = fieldReports.find(r => isSameApartment(r.apartmentName, b.name, nameMapping));
      const diff = (bReport?.viewCount || 0) - (aReport?.viewCount || 0);
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ko');
    });
    const first = sorted[0];
    const report = fieldReports.find(r => isSameApartment(r.apartmentName, first.name, nameMapping));
    if (report) {
      setSelectedReport(report);
    } else {
      setSelectedReport({
        id: `stub-${normalizeAptName(first.name)}`,
        apartmentName: first.name,
        dong: first.dong,
        author: '',
        likes: 0,
        commentCount: 0,
        createdAt: null,
        metrics: first as any,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldReports]);

  // Type map is now loaded via /api/dashboard-init above

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

    // Find raw google sheet entry to check for explicit txKey
    const rawApt = Object.values(sheetApartments).flat().find(a => isSameApartment(a.name, selectedReport.apartmentName, nameMapping));
    
    // findTxKey로 JSON 파일명 결정 (접두사 자동 strip), Google Sheets explicit txKey 최우선
    const txKey = (rawApt as any)?.txKey || findTxKey(selectedReport.apartmentName, txSummaryData, nameMapping);
    const fileKey = txKey || normalizeAptName(selectedReport.apartmentName);

    // 캐시를 방지하기 위해 쿼리스트링(v=Date.now()) 추가
    fetch(`/tx-data/${encodeURIComponent(fileKey)}.json?v=${Date.now()}`)
      .then(res => res.ok ? res.json() : [])
      .then((records: { contractYm: string; contractDay: string; price: number; deposit?: number; monthlyRent?: number; area: number; areaPyeong: number; floor: number; dealType?: string; reqGb?: string; rnuYn?: string }[]) => {
        const mapped: TransactionRecord[] = records.map((r, i) => {
          let eokStr = '';
          if (r.dealType === '전세' || r.dealType === '월세') {
             eokStr = formatPriceEok(r.deposit || 0);
             if (r.dealType === '월세' && r.monthlyRent) {
               eokStr += ` / ${r.monthlyRent}만`;
             }
          } else {
             eokStr = formatPriceEok(r.price);
          }
          return {
            no: i + 1,
            sigungu: '', dong: '', aptName: fileKey,
            area: r.area, areaPyeong: r.areaPyeong,
            contractYm: r.contractYm, contractDay: r.contractDay,
            contractDate: `${r.contractYm}${String(r.contractDay).padStart(2, '0')}`,
            price: r.price, priceEok: eokStr,
            deposit: r.deposit || 0, monthlyRent: r.monthlyRent || 0,
            floor: r.floor, buyer: '', seller: '',
            buildYear: 0, roadName: '', cancelDate: r.cancelDate || '',
            dealType: r.dealType || '', agentLocation: '',
            registrationDate: '-', housingType: '',
            reqGb: r.reqGb || '', rnuYn: r.rnuYn || ''
          };
        });
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
      const trackView = () => {
        fetch('/api/report-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId: selectedReport.id, userEmail: user?.email }),
        }).catch((err) => { logger.error('Dashboard', 'View tracking failed', { reportId: selectedReport.id }, err); }); // silently ignore errors
      };

      if (user) {
        user.getIdTokenResult().then(idTokenResult => {
          // 관리자 권한(admin claim)이 있으면 조회수 집계를 건너뜀
          if (!idTokenResult.claims.admin) trackView();
        }).catch(() => trackView());
      } else {
        trackView();
      }
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

  // Count apartments per dong (from Google Sheet), excluding public rentals
  const dongAptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(sheetApartments).forEach(([dong, apts]) => { 
      counts[dong] = apts.filter(a => !publicRentalSet.has(a.name)).length; 
    });
    return counts;
  }, [sheetApartments, publicRentalSet]);

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

  // Resolve selected report with fallback metrics from sheetApartments if missing (e.g. from Firestore)
  const resolvedReport = useMemo(() => {
    if (!selectedReport) return null;
    const raw = fullReportData || selectedReport;
    if (raw.metrics) return raw;
    const fallback = Object.values(sheetApartments).flat().find(a => isSameApartment(a.name, raw.apartmentName, nameMapping));
    return { ...raw, metrics: fallback as any };
  }, [selectedReport, fullReportData, sheetApartments]);

  return (
    <div className="min-h-screen bg-[#f2f4f6] font-sans selection:bg-[#3182f6]/20">
      
      {/* a11y: Skip to Content */}
      <a href="#main-content" className="skip-to-content">내용으로 건너뛰기</a>

      {/* Dynamic Minimal Sticky Header */}
      <div 
        className={`fixed top-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-b border-[#e5e8eb] shadow-sm z-50 transition-transform duration-300 flex items-center justify-between px-3 md:px-10 lg:px-16 h-[52px] ${
          isScrolled ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <span className="font-extrabold text-[#191f28] tracking-tight text-[15px] flex items-center gap-2">
           <img src="/d-view-icon.png" alt="D-VIEW" className="w-[22px] h-[22px] rounded-md" />
           <span className="text-[#3182f6]">D-VIEW</span>
           <span className="text-[#b0b8c1] font-normal text-[13px]">|</span>
           <span className="text-[#4e5968] font-semibold text-[14px]">동탄 아파트 가치 분석</span>
        </span>
        <div className="flex items-center -mr-1">
          <FloatingUserBar />
        </div>
      </div>
      
      {/* Main Header — Logo + Nav integrated */}
      <header className="bg-white border-b border-[#e5e8eb] relative z-40" role="banner">
        <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16">
          {/* Top row: Brand + UserBar */}
          <div className="flex items-center justify-between pt-5 pb-3 sm:pt-6 sm:pb-4">
            <div className="flex items-center gap-3">
              <img src="/d-view-icon.png" alt="D-VIEW" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shadow-sm ring-1 ring-black/5" />
              <div className="flex flex-col mt-0.5">
                <h1 className="text-[18px] sm:text-[21px] font-extrabold text-[#191f28] tracking-tight leading-tight">
                  동탄 아파트 가치 분석
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 mt-1">
                  <span className="px-1.5 py-[2px] bg-[#e8f3ff] text-[#3182f6] rounded-[5px] text-[10px] sm:text-[11px] font-bold tracking-tight">
                    DATA LAB
                  </span>
                  <span className="text-[12px] sm:text-[13px] font-semibold text-[#505967] tracking-tight">
                    실시간 실거래·임장 리포트
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 평/면적 토글 */}
              <div className="hidden sm:inline-flex bg-[#f2f4f6] rounded-full p-0.5 gap-0.5">
                <button
                  onClick={() => setAreaUnit('m2')}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                    areaUnit === 'm2' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
                  }`}
                >
                  m²
                </button>
                <button
                  onClick={() => setAreaUnit('pyeong')}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-bold transition-all duration-200 ${
                    areaUnit === 'pyeong' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
                  }`}
                >
                  평
                </button>
              </div>
              <div className="hidden sm:block">
                <FloatingUserBar />
              </div>
            </div>
          </div>
          {/* Bottom row: Tab navigation */}
          <nav aria-label="메인 네비게이션" className="flex items-center gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('imjang')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-bold transition-all duration-200 border-b-2 ${
                activeTab === 'imjang'
                  ? 'border-[#3182f6] text-[#3182f6]'
                  : 'border-transparent text-[#8b95a1] hover:text-[#4e5968] hover:border-[#d1d5db]'
              }`}
            >
              <Compass size={14} strokeWidth={activeTab === 'imjang' ? 2.5 : 1.5} />
              <span>단지 분석</span>
            </button>
            <button
              onClick={() => { router.push('/lounge'); }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-bold transition-all duration-200 border-b-2 border-transparent text-[#8b95a1] hover:text-[#4e5968] hover:border-[#d1d5db]`}
            >
              <MessageSquare size={14} strokeWidth={1.5} />
              <span>커뮤니티</span>
            </button>
            <button
              onClick={() => setActiveTab('recommend')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[13px] font-bold transition-all duration-200 border-b-2 ${
                activeTab === 'recommend'
                  ? 'border-[#3182f6] text-[#3182f6]'
                  : 'border-transparent text-[#8b95a1] hover:text-[#4e5968] hover:border-[#d1d5db]'
              }`}
            >
              <Home size={16} className={`transition-transform duration-200 ${activeTab === 'recommend' ? 'text-[#3182f6]' : 'text-[#8b95a1] group-hover:-translate-y-0.5'}`} />
              <span>아파트 검색</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16 pt-3 sm:pt-4 md:pt-5 pb-[100px] sm:pb-8 animate-in fade-in duration-500">

        {/* ═══ TAB 1: 단지 분석 ═══ */}
        {mounted && activeTab === 'imjang' && (
        <section>
          {/* 1. Section Header — removed, now in main header */}

          {/* ── 마스터-디테일 레이아웃 ── */}
          <div className="flex flex-col md:flex-row md:bg-white md:rounded-2xl md:border md:border-[#e5e8eb] md:shadow-sm">
            {/* LEFT: 아파트 리스트 (1/3) */}
            <div className="w-full md:w-[380px] md:shrink-0 md:sticky md:top-16 md:self-start md:h-[calc(100vh-8rem)] md:border-r md:border-[#e5e8eb] flex flex-col overflow-hidden bg-white rounded-2xl md:rounded-l-2xl md:rounded-r-none">
          {(() => {
            // 전체: 모든 아파트 플랫 리스트 / 특정 동: 해당 동만
            const rawApts = selectedDong 
              ? (sheetApartments[selectedDong] || [])
              : Object.values(sheetApartments).flat();
              
            const allApts = rawApts.filter(a => !publicRentalSet.has(a.name));

            // 정렬 로직
            const sorted = [...allApts].sort((a, b) => {
              if (listSort === 'views') {
                const aReport = fieldReports.find(r => isSameApartment(r.apartmentName, a.name, nameMapping));
                const bReport = fieldReports.find(r => isSameApartment(r.apartmentName, b.name, nameMapping));
                const diff = (bReport?.viewCount || 0) - (aReport?.viewCount || 0);
                return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ko');
              }
              if (listSort === 'likes') {
                const diff = (favoriteCounts[b.name] || 0) - (favoriteCounts[a.name] || 0);
                return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ko');
              }
              // 'name' — 가나다순
              return a.name.localeCompare(b.name, 'ko');
            });

            return (
              <>
                {/* 아파트 리스트 */}
                <div className="bg-white md:rounded-none md:border-0 border border-[#e5e8eb] overflow-hidden flex-1 flex flex-col">
                  {/* 통합 필터 바 — 리스트 상단에 고정 */}
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#f2f4f6] px-3 py-2.5">
                    <DongFilterBar
                      selectedDong={selectedDong}
                      onSelectDong={setSelectedDong}
                      totalAptCount={Object.values(sheetApartments).flat().filter(a => !publicRentalSet.has(a.name)).length}
                      dongAptCounts={dongAptCounts}
                      dongReportCounts={dongReportCounts}
                      listSort={listSort}
                      onSortChange={setListSort}
                    />
                  </div>
                  <FixedSizeList
                    height={typeof window !== 'undefined' && window.innerWidth >= 768 ? listHeight : sorted.length * 82}
                    itemCount={sorted.length}
                    itemSize={82}
                    width="100%"
                    overscanCount={5}
                  >
                    {({ index, style }: { index: number; style: React.CSSProperties }) => {
                      const apt = sorted[index];
                      const txKey = apt.txKey || findTxKey(apt.name, txSummaryData, nameMapping);
                      const txSummary = txKey ? txSummaryData[txKey] : undefined;
                      const report = fieldReports.find(r => isSameApartment(r.apartmentName, apt.name, nameMapping));
                      return (
                        <div style={style}>
                          <ApartmentCard
                            key={apt.name}
                            apt={apt}
                            txSummary={txSummary}
                            report={report}
                            isPublicRental={publicRentalSet.has(apt.name)}
                            rank={index + 1}
                            isSelected={!!(selectedReport && isSameApartment(selectedReport.apartmentName, apt.name, nameMapping))}
                            isFavorited={userFavorites.has(apt.name)}
                            favoriteCount={Math.max(userFavorites.has(apt.name) ? 1 : 0, favoriteCounts[apt.name] || 0)}
                            onToggleFavorite={() => handleToggleFavorite(apt.name)}
                            onClick={() => {
                              userHasSelected.current = true;
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
                              // Open mobile modal on explicit tap
                              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                setMobileModalOpen(true);
                              }
                            }}
                            typeMap={typeMap}
                            areaUnit={areaUnit}
                          />
                        </div>
                      );
                    }}
                  </FixedSizeList>
                </div>
              </>
            );
          })()}
            </div>

            {/* RIGHT: 인라인 디테일 패널 (2/3, 데스크톱 전용) */}
            <div className="hidden md:block flex-1 md:sticky md:top-16 md:self-start md:h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden rounded-tr-2xl rounded-br-2xl custom-scrollbar">
              {resolvedReport ? (
                <FieldReportModal 
                  report={resolvedReport} 
                  onClose={() => setSelectedReport(null)} 
                  comments={commentsData[selectedReport!.id] || []}
                  commentInput={commentInput[selectedReport!.id] || ''}
                  onCommentChange={(text) => setCommentInput(prev => ({ ...prev, [selectedReport!.id]: text }))}
                  onSubmitComment={() => handleSubmitComment(selectedReport!.id)}
                  user={user}
                  transactions={modalTransactions}
                  typeMap={typeMap}
                  areaUnit={areaUnit}
                  isLoadingDetail={isLoadingDetail}
                  isPurchased={purchasedReportIds.includes(selectedReport!.id)}
                  isAdmin={dashboardFacade.isAdmin(user?.email)}
                  onPurchaseComplete={() => {
                    if (user) {
                      PurchaseRepo.getUserPurchasedReportIds(user.uid).then(setPurchasedReportIds);
                    }
                  }}
                  inline
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-[#f9fafb]">
                  <div className="text-center">
                    <Building className="mx-auto mb-3 text-[#d1d6db]" size={40} />
                    <p className="text-[14px] font-bold text-[#8b95a1]">좌측에서 아파트를 선택하세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>


        </section>
        )}

        {/* 모바일 풀스크린 모달 (md 미만에서만 표시, 사용자 클릭 시에만) */}
        {resolvedReport && mobileModalOpen && (
          <div className="fixed inset-0 z-50 bg-white overflow-y-auto md:hidden animate-in slide-in-from-bottom duration-300">
            <FieldReportModal
              report={resolvedReport}
              onClose={() => { setSelectedReport(null); setMobileModalOpen(false); }}
              comments={commentsData[selectedReport!.id] || []}
              commentInput={commentInput[selectedReport!.id] || ''}
              onCommentChange={(text) => setCommentInput(prev => ({ ...prev, [selectedReport!.id]: text }))}
              onSubmitComment={() => handleSubmitComment(selectedReport!.id)}
              user={user}
              transactions={modalTransactions}
              typeMap={typeMap}
              isLoadingDetail={isLoadingDetail}
              isPurchased={purchasedReportIds.includes(selectedReport!.id)}
              isAdmin={dashboardFacade.isAdmin(user?.email)}
              onPurchaseComplete={() => {
                if (user) {
                  PurchaseRepo.getUserPurchasedReportIds(user.uid).then(setPurchasedReportIds);
                }
              }}
            />
          </div>
        )}

        {/* ═══ TAB 2: 라운지 제거됨 (별도 페이지로 이동) ═══ */}

        {/* ═══ TAB 3: 아파트 추천 ═══ */}
        {activeTab === 'recommend' && (
        <section>
          <div className="flex justify-between items-start mb-8 w-full">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-tight text-[#191f28] mb-1">아파트 추천</h2>
              <p className="text-[15px] text-[#8b95a1] font-medium">동탄 맞춤 아파트 추천 & 분석</p>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="w-full h-[180px] sm:h-[200px] bg-gradient-to-br from-[#3182f6] to-[#2b72d6] rounded-3xl p-5 sm:p-8 flex flex-col justify-end text-white relative overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#3182f6]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-white/20 transition-colors"></div>
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





      
      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed z-50 bottom-24 sm:bottom-8 right-4 sm:right-8 bg-white text-[#3182f6] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#e5e8eb] w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#f8f9fa] hover:scale-105 active:scale-95 ${
          isScrolled ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
        aria-label="맨 위로 이동"
        title="맨 위로 이동"
      >
        <ArrowUp size={22} strokeWidth={2.5} />
      </button>

      {showReviewModal && user && (
        <WriteReviewModal onClose={() => setShowReviewModal(false)} userUid={user.uid} />
      )}

      {/* 모바일 전용 하단 플로팅 네비게이션 독 */}
      <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-[32px] px-3 py-2.5 flex items-center justify-between border border-[#e5e8eb] w-[92%] max-w-[360px]">
        {/* 면적 토글 (좌측) */}
        <div className="flex flex-col items-center justify-center pl-1 shrink-0">
          <div className="flex flex-col bg-[#f2f4f6] rounded-[14px] p-0.5 gap-0.5 min-w-[32px] shadow-inner">
            <button
              onClick={() => setAreaUnit('m2')}
              className={`px-1 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 leading-none ${
                areaUnit === 'm2' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
              }`}
            >
              m²
            </button>
            <button
              onClick={() => setAreaUnit('pyeong')}
              className={`px-1 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 leading-none ${
                areaUnit === 'pyeong' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'
              }`}
            >
              평
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-[1px] h-9 bg-[#e5e8eb] mx-2 shrink-0" />

        {/* 우측 3개 탭 */}
        <div className="flex items-center justify-between flex-1 gap-1">
          {[
            { id: 'imjang' as const, label: '단지 분석', icon: Compass },
            { id: 'lounge' as const, label: '커뮤니티', icon: MessageSquare },
            { id: 'recommend' as const, label: '아파트 검색', icon: Home },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-full min-h-[50px] rounded-[22px] transition-all duration-300 relative ${
                  isActive ? 'text-[#3182f6]' : 'text-[#8b95a1] hover:text-[#4e5968]'
                }`}
              >
                {isActive && (
                   <div className="absolute inset-0 bg-[#3182f6]/10 rounded-[22px] transition-opacity" />
                )}
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1 relative z-10" />
                <span className="text-[10px] font-bold tracking-wide relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
