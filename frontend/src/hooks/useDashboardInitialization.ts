import { useState, useEffect, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { dashboardFacade, FieldReportData, CommentData } from '@/lib/DashboardFacade';
import * as UserRepo from '@/lib/repositories/user.repository';
import * as PurchaseRepo from '@/lib/repositories/purchase.repository';
import type { UserProfile } from '@/lib/types/user.types';
import { logger } from '@/lib/services/logger';
import { buildInitialApartments, type DongApartment } from '@/lib/dong-apartments';
import { TX_SUMMARY, type AptTxSummary } from '@/lib/transaction-summary';
import { normalizeAptName, findTxKey, isSameApartment, getDisplayAptName, HARDCODED_MAPPING } from '@/lib/utils/apartmentMapping';

export interface TransactionRecord {
  no: number;
  sigungu: string;
  dong: string;
  aptName: string;
  area: number;
  areaPyeong: number;
  contractYm: string;
  contractDay: string;
  contractDate: string;
  price: number;
  priceEok: string;
  deposit?: number;
  monthlyRent?: number;
  floor: number;
  buyer: string;
  seller: string;
  buildYear: number;
  roadName: string;
  cancelDate: string;
  dealType: string;
  agentLocation: string;
  registrationDate: string;
  housingType: string;
  reqGb: string;
  rnuYn: string;
}

interface RawTransactionRecord {
  dealType?: string;
  deposit?: number;
  monthlyRent?: number;
  price: number;
  area: number;
  areaPyeong: number;
  contractYm: string;
  contractDay: string | number;
  floor: number;
  cancelDate?: string;
  reqGb?: string;
  rnuYn?: string;
}

export interface DashboardInitialData {
  typeMap?: { aptName: string; area: number | string; typeM2: string; typePyeong: string }[];
  apartmentMeta?: Record<string, { dong?: string; txKey?: string; isPublicRental?: boolean }>;
  favoriteCounts?: Record<string, number>;
}

export function useDashboardInitialization(initialDashboardData?: DashboardInitialData) {
  // === 1. Auth & Profiles ===
  const [user, setUser] = useState<User | null>(null);
  const [anonProfile, setAnonProfile] = useState<{nickname: string; frontName?: string; photoURL?: string} | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [purchasedReportIds, setPurchasedReportIds] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await dashboardFacade.getUserProfile(currentUser.uid);
        setAnonProfile(profile);
        const up = await UserRepo.getOrCreateProfile(currentUser.uid);
        setUserProfile(up);
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

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Login failed", error); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } 
    catch (error) { console.error("Logout failed", error); }
  };

  const refreshPurchasedReports = async () => {
    if (user) {
      const ids = await PurchaseRepo.getUserPurchasedReportIds(user.uid);
      setPurchasedReportIds(ids);
    }
  };

  // === 2. Metadata & Global Store ===
  const [sheetApartments, setSheetApartments] = useState<Record<string, DongApartment[]>>(buildInitialApartments());
  const [typeMap, setTypeMap] = useState<Record<string, Record<string, { typeM2: string; typePyeong: string }>>>({});
  const [nameMapping, setNameMapping] = useState<Record<string, string> | undefined>(undefined);
  const [publicRentalSet, setPublicRentalSet] = useState<Set<string>>(new Set());

  // Fetch sheet apartments
  useEffect(() => {
    let unmounted = false;
    fetch('/api/apartments-by-dong')
      .then(r => r.json())
      .then(data => {
        if (!unmounted && data.byDong && Object.keys(data.byDong).length > 0) {
          const updatedByDong = Object.fromEntries(
            Object.entries(data.byDong).map(([dong, apts]) => {
              const mappedApts = (apts as DongApartment[]).map(a => ({ ...a, name: getDisplayAptName(a.name) }));
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
      .catch((err) => { logger.warn('Dashboard', 'Failed to fetch apartments', {}, err); });

      return () => { unmounted = true; };
  }, []);

  // Fetch init map (or use SSR props)
  useEffect(() => {
    if (initialDashboardData) {
      if (initialDashboardData.typeMap) {
        const map: Record<string, Record<string, { typeM2: string; typePyeong: string }>> = {};
        for (const e of initialDashboardData.typeMap) {
          const key = normalizeAptName(e.aptName);
          if (!map[key]) map[key] = {};
          map[key][String(Number(e.area))] = { typeM2: e.typeM2, typePyeong: e.typePyeong };
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

    let unmounted = false;
    fetch('/api/dashboard-init').then(r => r.json()).then(data => {
      if (unmounted) return;
      if (data.typeMap) {
        const map: Record<string, Record<string, { typeM2: string; typePyeong: string }>> = {};
        for (const e of data.typeMap) {
          const key = normalizeAptName(e.aptName);
          if (!map[key]) map[key] = {};
          map[key][String(Number(e.area))] = { typeM2: e.typeM2, typePyeong: e.typePyeong };
        }
        setTypeMap(map);
      }
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
    }).catch(() => !unmounted && setNameMapping({}));
    return () => { unmounted = true; };
  }, [initialDashboardData]);

  // === 3. Favorites ===
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>(initialDashboardData?.favoriteCounts || {});

  useEffect(() => {
    let unmounted = false;
    if (user) {
      user.getIdToken().then(idToken => {
        fetch(`/api/favorite?userId=${user.uid}`, { headers: { 'Authorization': `Bearer ${idToken}` } })
          .then(r => r.json())
          .then(data => { if (!unmounted && data.favorites) setUserFavorites(new Set(data.favorites)); })
          .catch(err => logger.warn('Dashboard', 'Failed to fetch favorites', {}, err));
      }).catch(err => logger.warn('Dashboard', 'Auth token fetch failed', {}, err));
    } else {
      setUserFavorites(new Set());
    }
    return () => { unmounted = true; };
  }, [user]);

  const handleToggleFavorite = async (aptName: string) => {
    if (!user) {
      handleLogin();
      return;
    }
    const wasFavorited = userFavorites.has(aptName);
    setUserFavorites(prev => {
      const next = new Set(prev);
      wasFavorited ? next.delete(aptName) : next.add(aptName);
      return next;
    });
    setFavoriteCounts(prev => ({ ...prev, [aptName]: Math.max(0, (prev[aptName] || 0) + (wasFavorited ? -1 : 1)) }));
    
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ aptName }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setUserFavorites(prev => {
        const next = new Set(prev);
        wasFavorited ? next.add(aptName) : next.delete(aptName);
        return next;
      });
      setFavoriteCounts(prev => ({ ...prev, [aptName]: Math.max(0, (prev[aptName] || 0) + (wasFavorited ? 1 : -1)) }));
    }
  };

  // === 4. Transactions Data & Report Details ===
  const txSummaryData: Record<string, AptTxSummary> = TX_SUMMARY;
  const [selectedReport, setSelectedReport] = useState<FieldReportData | null>(null);
  const [fullReportData, setFullReportData] = useState<FieldReportData | null>(null);
  const [modalTransactions, setModalTransactions] = useState<TransactionRecord[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isTxLoading, setIsTxLoading] = useState(false);

  const formatPriceEok = (priceMan: number) => {
    const eok = Math.floor(priceMan / 10000);
    const remainder = priceMan % 10000;
    if (eok === 0) return `${priceMan.toLocaleString()}만`;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억${remainder.toLocaleString()}`;
  };

  useEffect(() => {
    if (!selectedReport) { setModalTransactions([]); return; }
    
    let unmounted = false;
    setIsTxLoading(true);
    const rawApt = Object.values(sheetApartments).flat().find(a => isSameApartment(a.name, selectedReport.apartmentName, nameMapping));
    const overrideKey = HARDCODED_MAPPING[normalizeAptName(selectedReport.apartmentName)];
    const txKey = overrideKey || (rawApt as { txKey?: string })?.txKey || findTxKey(selectedReport.apartmentName, txSummaryData, nameMapping);
    const fileKey = txKey || normalizeAptName(selectedReport.apartmentName);

    fetch(`/tx-data/${encodeURIComponent(fileKey)}.json?v=${Date.now()}`)
      .then(res => res.ok ? res.json() : [])
      .then(records => {
        if (unmounted) return;
        const mapped: TransactionRecord[] = records.map((r: RawTransactionRecord, i: number) => {
          let eokStr = '';
          if (r.dealType === '전세' || r.dealType === '월세') {
             eokStr = formatPriceEok(r.deposit || 0);
             if (r.dealType === '월세' && r.monthlyRent) eokStr += ` / ${r.monthlyRent}만`;
          } else {
             eokStr = formatPriceEok(r.price);
          }
          return {
            no: i + 1, sigungu: '', dong: '', aptName: fileKey,
            area: r.area, areaPyeong: r.areaPyeong,
            contractYm: r.contractYm, contractDay: r.contractDay,
            contractDate: `${r.contractYm}${String(r.contractDay).padStart(2, '0')}`,
            price: r.price, priceEok: eokStr,
            deposit: r.deposit || 0, monthlyRent: r.monthlyRent || 0,
            floor: r.floor, buyer: '', seller: '', buildYear: 0, roadName: '',
            cancelDate: r.cancelDate || '', dealType: r.dealType || '',
            agentLocation: '', registrationDate: '-', housingType: '',
            reqGb: r.reqGb || '', rnuYn: r.rnuYn || ''
          };
        });
        setModalTransactions(mapped);
      })
      .catch(err => console.warn('TX fetch err:', err))
      .finally(() => { if (!unmounted) setIsTxLoading(false); });

    // Fetch Full Report & View count
    const isStubReport = selectedReport.id.startsWith('stub-');
    if (!isStubReport) {
      setIsLoadingDetail(true);
      dashboardFacade.getFullReport(selectedReport.id).then((data) => {
        if (!unmounted) {
          setFullReportData(data);
          setIsLoadingDetail(false);
        }
      }).catch(() => { if (!unmounted) setIsLoadingDetail(false); });

      const trackView = () => {
        fetch('/api/report-view', { method: 'POST', body: JSON.stringify({ reportId: selectedReport.id, userEmail: user?.email }) }).catch(() => {});
      };

      if (user) {
        user.getIdTokenResult().then(idTokenResult => {
          if (!idTokenResult.claims.admin) trackView();
        }).catch(() => trackView());
      } else {
        trackView();
      }
    } else {
      setFullReportData(null);
    }
    
    return () => { unmounted = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport]);

  // === 5. Comments ===
  const [commentsData, setCommentsData] = useState<Record<string, CommentData[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedReport && !selectedReport.id.startsWith('stub-') && !commentsData[selectedReport.id]) {
      const unsubscribe = dashboardFacade.listenToComments(selectedReport.id, (comments) => {
        setCommentsData(prev => ({ ...prev, [selectedReport.id]: comments }));
      });
      return () => unsubscribe();
    }
  }, [selectedReport]);

  const handleSubmitComment = async (reportId: string) => {
    if (!user) { alert("로그인 후 댓글을 남길 수 있습니다."); handleLogin(); return; }
    const text = commentInput[reportId];
    if (!text?.trim()) return;

    await dashboardFacade.addFieldReportComment(reportId, text, user.uid);
    setCommentInput(prev => ({ ...prev, [reportId]: '' }));
  };

  // Combine properties safely
  const resolvedReport = useMemo(() => {
    if (!selectedReport) return null;
    const raw = fullReportData || selectedReport;
    const fallback = Object.values(sheetApartments).flat().find(a => isSameApartment(a.name, raw.apartmentName, nameMapping)) as any;
    
    // 안전한 병합: DB에 저장된 metrics에 누락된 값이 있다면 최신 구글 시트 데이터(fallback)로 채움
    let mergedMetrics = { ...fallback };
    if (raw.metrics) {
      for (const [k, v] of Object.entries(raw.metrics)) {
        if (v !== undefined && v !== null && v !== '') {
          mergedMetrics[k] = v;
        }
      }
    }
    
    return { ...raw, metrics: mergedMetrics as unknown as import('@/lib/types/scoutingReport').ObjectiveMetrics };
  }, [selectedReport, fullReportData, sheetApartments, nameMapping]);

  return {
    auth: { user, userProfile, anonProfile, purchasedReportIds, handleLogin, handleLogout, refreshPurchasedReports },
    data: { sheetApartments, typeMap, nameMapping, publicRentalSet, txSummaryData },
    favorites: { userFavorites, favoriteCounts, handleToggleFavorite },
    reports: { 
      selectedReport, setSelectedReport, resolvedReport, fullReportData, isLoadingDetail 
    },
    tx: { modalTransactions, isTxLoading },
    comments: { commentsData, commentInput, setCommentInput, handleSubmitComment }
  };
}
