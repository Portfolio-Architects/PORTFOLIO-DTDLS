'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, setDoc, query, collection, onSnapshot, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { TX_SUMMARY } from '@/lib/transaction-summary';
import { DONGS } from '@/lib/dongs';
import {
  Building, Save, Home, Link2, ChevronLeft, MapPin,
  ImagePlus, Trash2, ArrowUpDown
} from 'lucide-react';
import { ScoutingReport, ImageMeta } from '@/lib/types/scoutingReport';
import { uploadImage, createScoutingReport, updateScoutingReport } from '@/lib/services/reportService';
import { extractCapturedDate } from '@/lib/utils/exif';
import { getPremiumScoresAction } from '@/app/actions/scoring';

const FIRESTORE_DOC = 'settings/apartmentMeta';
const dongNames = DONGS.map(d => d.name).sort((a, b) => a.localeCompare(b, 'ko'));
const txKeys = Object.keys(TX_SUMMARY).sort();

// ── Image Category Groups (from ReportEditorForm) ──
const IMAGE_CATEGORY_GROUPS: { group: string; items: string[] }[] = [
  { group: '🏢 단지 전경', items: ['단지 전경 (메인)', '단지 전경 (항공/드론)', '단지 조감도', '기타'] },
  { group: '🚪 문주·출입구', items: ['정문 (메인게이트)', '후문/측문', '차량 출입구', '보행자 출입구', '보안실', '기타'] },
  { group: '🌿 조경·외부', items: ['중앙 조경', '산책로/보행로', '수경시설 (분수/연못)', '놀이터', '운동기구/트랙', '정원/화단', '야외 카페', '경로당', '단지 내 어린이집', '분리수거장/쓰레기', '단지 내 상가', '기타'] },
  { group: '🅿 주차장', items: ['지하주차장 입구', '지하주차장 내부', '주차장 바닥/도색', '지상 주차', 'EV 충전기', '기타'] },
  { group: '🏋️ 커뮤니티', items: ['커뮤니티 외관/입구', '피트니스센터 (헬스장)', '골프연습장', '실내 수영장', '키즈카페/놀이방', '독서실/스터디룸', '사우나/찜질방', '기타 커뮤니티'] },
  { group: '🏠 동별·세대', items: ['동 외관', '엘리베이터/로비', '복도/계단', '택배함/무인택배', '기타'] },
  { group: '🪟 실내', items: ['거실/리빙', '주방', '욕실/화장실', '발코니/베란다', '현관', '조망/뷰 (창문)', '채광/향 (일조량)', '기타'] },
  { group: '🏙️ 주변 환경', items: ['역세권/교통 접근성', '통학로/학교', '주변 상권', '공원', '소음 환경 (도로)', '어린이집', '유치원', '기타'] },
];

// ── Auto-suggest TX key matching ──
const LOCATION_PREFIXES = [
  '숲속마을동탄','푸른마을동탄','나루마을동탄',
  '동탄역시범','동탄시범다은마을','동탄시범한빛마을','동탄시범나루마을',
  '시범다은마을','시범한빛마을','시범나루마을','시범',
  '반탄솔빛마을','솔빛마을','예당마을','새강마을',
  '동탄2신도시','동탄신도시','동탄숲속마을','동탄푸른마을','동탄나루마을',
  '동탄호수공원역','동탄호수공원','동탄호수','동탄역',
  '화성동탄2','능동역','호수공원역','동탄2','동탄',
];
const NAME_SUFFIXES = ['역', '2단지', '1단지', '3단지', '4단지', '5단지', '단지'];

function normalizeAptName(name: string): string {
  return name.replace(/\[.*?\]\s*/g, '').replace(/\s+/g, '').replace(/[()（）]/g, '').trim();
}
function stripPrefix(n: string) {
  for (const p of LOCATION_PREFIXES) if (n.startsWith(p) && n.length > p.length) return n.slice(p.length);
  return n;
}
function stripSuffix(n: string) {
  for (const s of NAME_SUFFIXES) if (n.endsWith(s) && n.length > s.length) return n.slice(0, -s.length);
  return n;
}
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}
function autoSuggest(aptName: string): string | null {
  const norm = normalizeAptName(aptName);
  const keys = Object.keys(TX_SUMMARY);
  if (!norm || norm.length < 2) return null;
  if (keys.includes(norm)) return norm;
  const stripped = stripPrefix(norm);
  if (stripped !== norm && keys.includes(stripped)) return stripped;
  for (const k of keys) if (stripPrefix(k) === stripped) return k;
  const suffixStripped = stripSuffix(norm);
  if (suffixStripped !== norm && keys.includes(suffixStripped)) return suffixStripped;
  for (const k of keys) if (stripSuffix(k) === suffixStripped) return k;
  const bothStripped = stripSuffix(stripped);
  if (bothStripped !== stripped) {
    for (const k of keys) if (stripSuffix(stripPrefix(k)) === bothStripped) return k;
  }
  const containMatches = keys.filter(k => norm.includes(k) || k.includes(norm));
  if (containMatches.length === 1) return containMatches[0];
  if (containMatches.length > 1) {
    containMatches.sort((a, b) => Math.abs(a.length - norm.length) - Math.abs(b.length - norm.length));
    return containMatches[0];
  }
  const threshold = Math.max(2, Math.floor(norm.length * 0.25));
  let bestKey: string | null = null;
  let bestDist = Infinity;
  for (const k of keys) {
    const dist = editDistance(norm, k);
    if (dist < bestDist && dist <= threshold) { bestDist = dist; bestKey = k; }
  }
  return bestKey;
}

// ── Types ──
interface AptMeta {
  dong: string;
  txKey?: string;
  minFloor?: number;
  maxFloor?: number;
  isPublicRental?: boolean;
  householdCount?: number;
  yearBuilt?: string;
  brand?: string;
  ticker?: string;
  far?: number;
  bcr?: number;
  parkingCount?: number;
  parkingPerHousehold?: number;
  coordinates?: string;
  // 입지 분석
  distanceToElementary?: number;
  distanceToMiddle?: number;
  distanceToHigh?: number;
  distanceToSubway?: number;
  distanceToIndeokwon?: number;
  distanceToTram?: number;
  distanceToStarbucks?: number;
  starbucksName?: string;
  starbucksAddress?: string;
  starbucksCoordinates?: string;
  distanceToMcDonalds?: number;
  mcdonaldsName?: string;
  mcdonaldsAddress?: string;
  mcdonaldsCoordinates?: string;
  distanceToOliveYoung?: number;
  oliveYoungName?: string;
  oliveYoungAddress?: string;
  oliveYoungCoordinates?: string;
  distanceToDaiso?: number;
  daisoName?: string;
  daisoAddress?: string;
  daisoCoordinates?: string;
  distanceToSupermarket?: number;
  supermarketName?: string;
  supermarketAddress?: string;
  supermarketCoordinates?: string;
  academyDensity?: number;
  restaurantDensity?: number;
}

interface PhotoItem {
  file?: File;
  previewUrl?: string;
  url: string;
  caption: string;
  locationTag: string;
  isPremium: boolean;
  capturedAt?: string;
}

// ── Helper: Number input with unit ──
function NumField({ label, value, unit, placeholder, onChange }: {
  label: string; value: number | undefined; unit: string; placeholder: string;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 block">{label}</label>
      <div className="relative">
        <input type="number" step="any" min={0} value={value ?? ''} placeholder={placeholder}
          onChange={e => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white transition-all" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b95a1] text-[13px]">{unit}</span>
      </div>
    </div>
  );
}

export default function ApartmentInfoPage() {
  const router = useRouter();
  const params = useParams();
  const originalName = decodeURIComponent(params.name as string);

  // ── State ──
  const [meta, setMeta] = useState<AptMeta | null>(null);
  const [initialMeta, setInitialMeta] = useState<AptMeta | null>(null);
  const [aptName, setAptName] = useState(originalName);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{done: number; total: number} | null>(null);
  const uploadedFileKeys = useRef<Set<string>>(new Set());
  const batchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // API category data (for Firestore save)
  const [apiCategories, setApiCategories] = useState<{
    academyCategories?: Record<string, number>;
    restaurantCategories?: Record<string, number>;
    nearestSchoolNames?: { elementary?: string; middle?: string; high?: string };
    nearestStationName?: string;
    nearestStationLine?: string;
    nearestIndeokwonStationName?: string;
    nearestIndeokwonLine?: string;
    nearestTramStationName?: string;
    nearestTramLine?: string;
    nearestStationCoords?: string;
    nearestIndeokwonCoords?: string;
    nearestTramCoords?: string;
  }>({});

  const suggestedTxKey = useMemo(() => {
    return !meta?.txKey ? autoSuggest(originalName) : null;
  }, [meta?.txKey, originalName]);

  const existingReport = reports.length > 0 ? reports[0] : null;

  // ── Load Meta (Firestore first, Sheets fallback) ──
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      let firestoreLoaded = false;
      try {
        const metaDoc = await getDoc(doc(db, 'settings/apartmentMeta'));
        if (metaDoc.exists()) {
          const allMeta = metaDoc.data() as Record<string, unknown>;
          const m = allMeta[originalName] as Record<string, unknown> | undefined;
          if (m && typeof m === 'object' && m.dong) {
            const foundMeta: AptMeta = {
              dong: m.dong as string, txKey: (m.txKey as string) || autoSuggest(originalName) || undefined,
              minFloor: m.minFloor as number | undefined, maxFloor: m.maxFloor as number | undefined, isPublicRental: (m.isPublicRental as boolean) || false,
              householdCount: m.householdCount as number | undefined, yearBuilt: m.yearBuilt as string | undefined,
              brand: m.brand as string | undefined, ticker: m.ticker as string | undefined,
              far: m.far as number | undefined, bcr: m.bcr as number | undefined, parkingCount: m.parkingCount as number | undefined,
              parkingPerHousehold: m.parkingPerHousehold as number | undefined, coordinates: m.coordinates as string | undefined,
              // ★ Restore distance metrics from Firestore cache
              distanceToElementary: m.distanceToElementary as number | undefined,
              distanceToMiddle: m.distanceToMiddle as number | undefined,
              distanceToHigh: m.distanceToHigh as number | undefined,
              distanceToSubway: m.distanceToSubway as number | undefined,
              distanceToIndeokwon: m.distanceToIndeokwon as number | undefined,
              distanceToTram: m.distanceToTram as number | undefined,
              distanceToStarbucks: m.distanceToStarbucks as number | undefined,
              starbucksName: m.starbucksName as string | undefined,
              starbucksAddress: m.starbucksAddress as string | undefined,
              starbucksCoordinates: m.starbucksCoordinates as string | undefined,
              distanceToMcDonalds: m.distanceToMcDonalds as number | undefined,
              distanceToOliveYoung: m.distanceToOliveYoung as number | undefined,
              distanceToDaiso: m.distanceToDaiso as number | undefined,
              distanceToSupermarket: m.distanceToSupermarket as number | undefined,
              academyDensity: m.academyDensity as number | undefined,
              restaurantDensity: m.restaurantDensity as number | undefined,
            };
            if (isMounted) {
              setMeta(foundMeta);
              setInitialMeta(JSON.parse(JSON.stringify(foundMeta)));
              setLoaded(true);
              firestoreLoaded = true;
            }
          }
        }
      } catch (e) {
        console.warn('Firestore load failed, trying Sheets:', e);
      }
      try {
        const res = await fetch(`/api/apartments-by-dong?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Sheets fail');
        const data = await res.json();
        let sheetsMeta: AptMeta | null = null;
        if (data.byDong) {
          for (const [, apts] of Object.entries(data.byDong)) {
            const apt = (apts as { name: string; [key: string]: unknown }[]).find(a => a.name === originalName);
            if (apt) {
              sheetsMeta = {
                dong: (apt as Record<string, string | number | boolean>)?.dong as string, txKey: (apt as Record<string, string | number | boolean>)?.txKey as string | undefined, minFloor: (apt as Record<string, string | number | boolean>)?.minFloor as number | undefined, maxFloor: (apt as Record<string, string | number | boolean>)?.maxFloor as number | undefined, isPublicRental: (apt as Record<string, string | number | boolean>)?.isPublicRental || false, householdCount: (apt as Record<string, string | number | boolean>)?.householdCount,
                yearBuilt: (apt as Record<string, string | number | boolean>)?.yearBuilt, brand: (apt as Record<string, string | number | boolean>)?.brand, ticker: (apt as Record<string, string | number | boolean>)?.ticker,
                far: (apt as Record<string, string | number | boolean>)?.far, bcr: (apt as Record<string, string | number | boolean>)?.bcr, parkingCount: (apt as Record<string, string | number | boolean>)?.parkingCount,
                coordinates: (apt.lat && apt.lng) ? `${apt.lat}, ${apt.lng}` : undefined,
                starbucksName: (apt as Record<string, string | number | boolean>)?.starbucksName as string | undefined,
                starbucksAddress: (apt as Record<string, string | number | boolean>)?.starbucksAddress as string | undefined,
                starbucksCoordinates: (apt as Record<string, string | number | boolean>)?.starbucksCoordinates as string | undefined,
                oliveYoungName: (apt as Record<string, string | number | boolean>)?.oliveYoungName as string | undefined,
                oliveYoungAddress: (apt as Record<string, string | number | boolean>)?.oliveYoungAddress as string | undefined,
                oliveYoungCoordinates: (apt as Record<string, string | number | boolean>)?.oliveYoungCoordinates as string | undefined,
                daisoName: (apt as Record<string, string | number | boolean>)?.daisoName as string | undefined,
                daisoAddress: (apt as Record<string, string | number | boolean>)?.daisoAddress as string | undefined,
                daisoCoordinates: (apt as Record<string, string | number | boolean>)?.daisoCoordinates as string | undefined,
                mcdonaldsName: (apt as Record<string, string | number | boolean>)?.mcdonaldsName as string | undefined,
                mcdonaldsAddress: (apt as Record<string, string | number | boolean>)?.mcdonaldsAddress as string | undefined,
                mcdonaldsCoordinates: (apt as Record<string, string | number | boolean>)?.mcdonaldsCoordinates as string | undefined,
                supermarketName: (apt as Record<string, string | number | boolean>)?.supermarketName as string | undefined,
                supermarketAddress: (apt as Record<string, string | number | boolean>)?.supermarketAddress as string | undefined,
                supermarketCoordinates: (apt as Record<string, string | number | boolean>)?.supermarketCoordinates as string | undefined,
                distanceToStarbucks: (apt as Record<string, string | number | boolean>)?.distanceToStarbucks as number | undefined,
                distanceToOliveYoung: (apt as Record<string, string | number | boolean>)?.distanceToOliveYoung as number | undefined,
                distanceToDaiso: (apt as Record<string, string | number | boolean>)?.distanceToDaiso as number | undefined,
                distanceToMcDonalds: (apt as Record<string, string | number | boolean>)?.distanceToMcDonalds as number | undefined,
                distanceToSupermarket: (apt as Record<string, string | number | boolean>)?.distanceToSupermarket as number | undefined,
              };
              break;
            }
          }
        }
        if (isMounted && sheetsMeta) {
          // ★ Sheets only provides basic fields — MERGE into existing meta, never overwrite distance metrics
          setMeta(prev => {
            if (!prev) return sheetsMeta;
            return { ...prev, ...sheetsMeta, 
              // Preserve any already-loaded distance metrics (from Firestore or scoutingReport)
              distanceToElementary: prev.distanceToElementary ?? sheetsMeta!.distanceToElementary,
              distanceToMiddle: prev.distanceToMiddle ?? sheetsMeta!.distanceToMiddle,
              distanceToHigh: prev.distanceToHigh ?? sheetsMeta!.distanceToHigh,
              distanceToSubway: prev.distanceToSubway ?? sheetsMeta!.distanceToSubway,
              distanceToIndeokwon: prev.distanceToIndeokwon ?? sheetsMeta!.distanceToIndeokwon,
              distanceToTram: prev.distanceToTram ?? sheetsMeta!.distanceToTram,
              distanceToStarbucks: sheetsMeta!.distanceToStarbucks ?? prev.distanceToStarbucks,
              starbucksName: sheetsMeta!.starbucksName || prev.starbucksName,
              starbucksAddress: sheetsMeta!.starbucksAddress || prev.starbucksAddress,
              starbucksCoordinates: sheetsMeta!.starbucksCoordinates || prev.starbucksCoordinates,
              distanceToMcDonalds: sheetsMeta!.distanceToMcDonalds ?? prev.distanceToMcDonalds,
              mcdonaldsName: sheetsMeta!.mcdonaldsName || prev.mcdonaldsName,
              mcdonaldsAddress: sheetsMeta!.mcdonaldsAddress || prev.mcdonaldsAddress,
              mcdonaldsCoordinates: sheetsMeta!.mcdonaldsCoordinates || prev.mcdonaldsCoordinates,
              distanceToOliveYoung: sheetsMeta!.distanceToOliveYoung ?? prev.distanceToOliveYoung,
              oliveYoungName: sheetsMeta!.oliveYoungName || prev.oliveYoungName,
              oliveYoungAddress: sheetsMeta!.oliveYoungAddress || prev.oliveYoungAddress,
              oliveYoungCoordinates: sheetsMeta!.oliveYoungCoordinates || prev.oliveYoungCoordinates,
              distanceToDaiso: sheetsMeta!.distanceToDaiso ?? prev.distanceToDaiso,
              daisoName: sheetsMeta!.daisoName || prev.daisoName,
              daisoAddress: sheetsMeta!.daisoAddress || prev.daisoAddress,
              daisoCoordinates: sheetsMeta!.daisoCoordinates || prev.daisoCoordinates,
              distanceToSupermarket: sheetsMeta!.distanceToSupermarket ?? prev.distanceToSupermarket,
              supermarketName: sheetsMeta!.supermarketName || prev.supermarketName,
              supermarketAddress: sheetsMeta!.supermarketAddress || prev.supermarketAddress,
              supermarketCoordinates: sheetsMeta!.supermarketCoordinates || prev.supermarketCoordinates,
              academyDensity: prev.academyDensity ?? sheetsMeta!.academyDensity,
              restaurantDensity: prev.restaurantDensity ?? sheetsMeta!.restaurantDensity,
            };
          });
          setInitialMeta(prev => prev ? { ...prev, ...sheetsMeta } : JSON.parse(JSON.stringify(sheetsMeta)));
          setLoaded(true);
        } else if (isMounted && !firestoreLoaded) {
          setMeta({ dong: '기타', maxFloor: 0, isPublicRental: false });
          setInitialMeta({ dong: '기타' });
          setLoaded(true);
        }
      } catch (e) {
        if (isMounted && !firestoreLoaded) {
          setMeta({ dong: '기타', maxFloor: 0, isPublicRental: false });
          setInitialMeta({ dong: '기타' });
          setLoaded(true);
        }
      }
    };
    load();
    return () => { isMounted = false; };
  }, [originalName]);

  // ── Load Scouting Reports + populate metrics/photos from existing report ──
  useEffect(() => {
    if (!originalName) return;
    const q = query(collection(db, 'scoutingReports'), where('apartmentName', '==', originalName));
    const unsub = onSnapshot(q, snap => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScoutingReport));
      fetched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReports(fetched);

      // Populate photos from existing report safely (only initialize if empty)
      if (fetched.length > 0) {
        const r = fetched[0];
        if (r.images && r.images.length > 0) {
          setPhotos(prev => {
            if (prev.length > 0) return prev; // Prevent overwriting during active editing
            r.images.forEach(img => {
              try {
                const decoded = decodeURIComponent(img.url);
                const match = decoded.match(/\/([^/?]+)\?/);
                if (match) uploadedFileKeys.current.add(match[1]);
              } catch { /* ignore */ }
            });
            return r.images.map(img => ({
              url: img.url, caption: img.caption || '', locationTag: img.locationTag || '',
              isPremium: img.isPremium || false, capturedAt: img.capturedAt,
            }));
          });
        }
      }
    });
    return () => unsub();
  }, [originalName]);

  // ── Sync Scouting Report Metrics (Race Condition Fix) ──
  useEffect(() => {
    // Only attempt to merge after Google Sheets initial load is done to prevent complete overwrite
    if (!loaded || reports.length === 0) return;
    const r = reports[0];
    const m = r.metrics;
    if (m) {
      setMeta(prev => prev ? ({
        ...prev,
        distanceToElementary: prev.distanceToElementary ?? m.distanceToElementary,
        distanceToMiddle: prev.distanceToMiddle ?? m.distanceToMiddle,
        distanceToHigh: prev.distanceToHigh ?? m.distanceToHigh,
        distanceToSubway: prev.distanceToSubway ?? m.distanceToSubway,
        distanceToIndeokwon: prev.distanceToIndeokwon ?? m.distanceToIndeokwon,
        distanceToTram: prev.distanceToTram ?? m.distanceToTram,
        distanceToStarbucks: prev.distanceToStarbucks ?? m.distanceToStarbucks,
        starbucksName: prev.starbucksName ?? m.starbucksName,
        starbucksAddress: prev.starbucksAddress ?? m.starbucksAddress,
        starbucksCoordinates: prev.starbucksCoordinates ?? m.starbucksCoordinates,
        distanceToMcDonalds: prev.distanceToMcDonalds ?? m.distanceToMcDonalds,
        mcdonaldsName: prev.mcdonaldsName ?? m.mcdonaldsName,
        mcdonaldsAddress: prev.mcdonaldsAddress ?? m.mcdonaldsAddress,
        mcdonaldsCoordinates: prev.mcdonaldsCoordinates ?? m.mcdonaldsCoordinates,
        distanceToOliveYoung: prev.distanceToOliveYoung ?? m.distanceToOliveYoung,
        oliveYoungName: prev.oliveYoungName ?? m.oliveYoungName,
        oliveYoungAddress: prev.oliveYoungAddress ?? m.oliveYoungAddress,
        oliveYoungCoordinates: prev.oliveYoungCoordinates ?? m.oliveYoungCoordinates,
        distanceToDaiso: prev.distanceToDaiso ?? m.distanceToDaiso,
        daisoName: prev.daisoName ?? m.daisoName,
        daisoAddress: prev.daisoAddress ?? m.daisoAddress,
        daisoCoordinates: prev.daisoCoordinates ?? m.daisoCoordinates,
        distanceToSupermarket: prev.distanceToSupermarket ?? m.distanceToSupermarket,
        supermarketName: prev.supermarketName ?? m.supermarketName,
        supermarketAddress: prev.supermarketAddress ?? m.supermarketAddress,
        supermarketCoordinates: prev.supermarketCoordinates ?? m.supermarketCoordinates,
        academyDensity: prev.academyDensity ?? m.academyDensity,
        restaurantDensity: prev.restaurantDensity ?? (m as unknown as Record<string, number>).restaurantDensity,
        brand: prev.brand || m.brand,
        householdCount: prev.householdCount ?? m.householdCount,
        far: prev.far ?? m.far,
        bcr: prev.bcr ?? m.bcr,
        parkingPerHousehold: prev.parkingPerHousehold ?? m.parkingPerHousehold,
        minFloor: prev.minFloor ?? m.minFloor,
        yearBuilt: prev.yearBuilt || String(m.yearBuilt || ''),
      }) : prev);

      // Restore API categories
      if (typeof m === 'object' && m !== null) {
        setApiCategories(prev => {
          if (Object.keys(prev.academyCategories || {}).length > 0) return prev;
          return {
            ...prev,
            academyCategories: (m as Record<string, any>).academyCategories || {},
            restaurantCategories: (m as Record<string, any>).restaurantCategories || {},
            nearestSchoolNames: (m as Record<string, any>).nearestSchoolNames || {},
            nearestStationName: (m as Record<string, any>).nearestStationName,
            nearestStationLine: (m as Record<string, any>).nearestStationLine,
            nearestIndeokwonStationName: (m as Record<string, any>).nearestIndeokwonStationName,
            nearestIndeokwonLine: (m as Record<string, any>).nearestIndeokwonLine,
            nearestTramStationName: (m as Record<string, any>).nearestTramStationName,
            nearestTramLine: (m as Record<string, any>).nearestTramLine,
            nearestStationCoords: (m as Record<string, any>).nearestStationCoords,
            nearestIndeokwonCoords: (m as Record<string, any>).nearestIndeokwonCoords,
            nearestTramCoords: (m as Record<string, any>).nearestTramCoords,
          };
        });
      }
    }
  }, [loaded, reports]);

  // ── Photo handlers ──
  const handleBatchFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) return;
    const unique: File[] = [];
    let dupCount = 0;
    for (const f of fileArr) {
      if (uploadedFileKeys.current.has(f.name)) { dupCount++; }
      else { uploadedFileKeys.current.add(f.name); unique.push(f); }
    }
    if (dupCount > 0) alert(`중복 사진 ${dupCount}장이 제외되었습니다.`);
    if (unique.length === 0) return;
    const withDates = await Promise.all(
      unique.map(async file => {
        const previewUrl = URL.createObjectURL(file);
        const capturedAt = await extractCapturedDate(file) || undefined;
        return { file, previewUrl, url: '', caption: '', locationTag: '', isPremium: false, capturedAt } as PhotoItem;
      })
    );
    setPhotos(prev => [...prev, ...withDates]);
  }, []);

  const sortByCategory = useCallback(() => {
    const order = IMAGE_CATEGORY_GROUPS.flatMap(g => g.items);
    setPhotos(prev => [...prev].sort((a, b) => {
      const ai = order.indexOf(a.locationTag);
      const bi = order.indexOf(b.locationTag);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    }));
  }, []);

  // ── Auto-fetch location scores ──
  const handleAutoFetch = async () => {
    if (!meta) return;
    setIsCalculating(true);
    try {
      const res = await fetch(`/api/location-scores?apartment=${encodeURIComponent(originalName)}&refresh=1`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`좌표 데이터를 찾을 수 없습니다.\n\n💡 ${errData.hint || ''}`);
        return;
      }
      const loc = await res.json();
      const bld = loc.buildingInfo;
      // Compute parkingCount from ratio if available
      const pph = bld?.parkingPerHousehold;
      const hh = bld?.householdCount;
      const computedParkingCount = (pph && hh) ? Math.round(pph * hh) : undefined;
      // Format coordinates from API response
      const coordStr = loc.coordinates ? `${loc.coordinates.lat}, ${loc.coordinates.lng}` : undefined;
      setMeta(prev => prev ? ({
        ...prev,
        distanceToElementary: loc.distanceToElementary ?? prev.distanceToElementary,
        distanceToMiddle: loc.distanceToMiddle ?? prev.distanceToMiddle,
        distanceToHigh: loc.distanceToHigh ?? prev.distanceToHigh,
        distanceToSubway: loc.distanceToSubway ?? prev.distanceToSubway,
        distanceToIndeokwon: loc.distanceToIndeokwon ?? prev.distanceToIndeokwon,
        distanceToTram: loc.distanceToTram ?? prev.distanceToTram,
        distanceToStarbucks: loc.distanceToStarbucks ?? prev.distanceToStarbucks,
        distanceToMcDonalds: loc.distanceToMcDonalds ?? prev.distanceToMcDonalds,
        distanceToOliveYoung: loc.distanceToOliveYoung ?? prev.distanceToOliveYoung,
        distanceToDaiso: loc.distanceToDaiso ?? prev.distanceToDaiso,
        distanceToSupermarket: loc.distanceToSupermarket ?? prev.distanceToSupermarket,
        academyDensity: loc.academyDensity ?? prev.academyDensity,
        restaurantDensity: loc.restaurantDensity ?? prev.restaurantDensity,
        brand: bld?.brand || prev.brand,
        householdCount: bld?.householdCount || prev.householdCount,
        yearBuilt: bld?.yearBuilt ? String(bld.yearBuilt) : prev.yearBuilt,
        far: bld?.far || prev.far,
        bcr: bld?.bcr || prev.bcr,
        parkingPerHousehold: pph || prev.parkingPerHousehold,
        parkingCount: computedParkingCount || prev.parkingCount,
        coordinates: coordStr || prev.coordinates,
      }) : prev);
      setApiCategories({
        academyCategories: loc.academyCategories || {},
        restaurantCategories: loc.restaurantCategories || {},
        nearestSchoolNames: {
          elementary: loc.nearestSchools?.elementary?.name,
          middle: loc.nearestSchools?.middle?.name,
          high: loc.nearestSchools?.high?.name,
        },
        nearestStationName: loc.nearestStation?.name,
        nearestStationLine: loc.nearestStation?.line,
        nearestIndeokwonStationName: loc.nearestIndeokwon?.name,
        nearestIndeokwonLine: loc.nearestIndeokwon?.line,
        nearestTramStationName: loc.nearestTram?.name,
        nearestTramLine: loc.nearestTram?.line,
        nearestStationCoords: loc.nearestStation?.lat ? `${loc.nearestStation.lat},${loc.nearestStation.lng}` : undefined,
        nearestIndeokwonCoords: loc.nearestIndeokwon?.lat ? `${loc.nearestIndeokwon.lat},${loc.nearestIndeokwon.lng}` : undefined,
        nearestTramCoords: loc.nearestTram?.lat ? `${loc.nearestTram.lat},${loc.nearestTram.lng}` : undefined,
      });
      alert('✅ 자동 출력 완료!');
    } catch (e) {
      alert('자동 출력 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  // ── Unified Save ──
  const handleSave = async () => {
    if (!meta || !initialMeta) return;
    setSaving(true);
    try {
      const newName = aptName.trim();
      if (!newName) throw new Error('아파트 이름을 입력해주세요.');

      // 1. Google Sheets sync
      const syncPayload: { updates: Record<string, unknown>[]; adds: Record<string, unknown>[]; deletes: string[] } = { updates: [], adds: [], deletes: [] };
      if (!initialMeta.ticker) {
        syncPayload.adds.push({ name: newName, dong: meta.dong, txKey: meta.txKey || '' });
      } else {
        const updates: Record<string, string | number | boolean> = {};
        if (newName !== originalName) updates['아파트명'] = newName;
        if (meta.dong !== initialMeta.dong) updates['동'] = meta.dong;
        if (meta.txKey !== initialMeta.txKey) updates['txKey'] = meta.txKey || '';
        if (meta.minFloor !== initialMeta.minFloor) updates['최저층'] = meta.minFloor || '';
        if (meta.maxFloor !== initialMeta.maxFloor) updates['최고층'] = meta.maxFloor || '';
        if (meta.isPublicRental !== initialMeta.isPublicRental) updates['공공임대'] = meta.isPublicRental ? 'Y' : 'N';
        if (meta.householdCount !== initialMeta.householdCount) updates['세대수'] = meta.householdCount || '';
        if (meta.brand !== initialMeta.brand) updates['시공사'] = meta.brand || '';
        if (meta.far !== initialMeta.far) updates['용적률'] = meta.far || '';
        if (meta.bcr !== initialMeta.bcr) updates['건폐율'] = meta.bcr || '';
        if (meta.parkingCount !== initialMeta.parkingCount) updates['주차대수'] = meta.parkingCount || '';
        if (meta.yearBuilt !== initialMeta.yearBuilt) updates['사용승인'] = meta.yearBuilt || '';
        if (meta.coordinates !== initialMeta.coordinates) updates['좌표'] = meta.coordinates || '';
        if (Object.keys(updates).length > 0) {
          syncPayload.updates.push({ ticker: initialMeta.ticker, updates });
        }
      }
      if (syncPayload.updates.length > 0 || syncPayload.adds.length > 0) {
        const syncRes = await fetch('/api/apartments-sync', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload),
        });
        if (!syncRes.ok) {
          const errData = await syncRes.json();
          throw new Error('Google Sheets Sync Failed: ' + errData.error);
        }
      }

      // 2. Update Firestore meta cache
      try {
        const resMeta = await fetch(`/api/apartments-by-dong?t=${Date.now()}`, { cache: 'no-store' });
        if (resMeta.ok) {
          const data = await resMeta.json();
          const clean: Record<string, Record<string, unknown>> = {};
          for (const [, apts] of Object.entries(data.byDong || {})) {
            (apts as Record<string, unknown>[]).forEach(a => {
              const entry: Record<string, unknown> = {};
              if (a.dong) entry['dong'] = a.dong;
              if (a.txKey) entry['txKey'] = a.txKey;
              if (a.maxFloor) entry['maxFloor'] = a.maxFloor;
              if (a.isPublicRental) entry['isPublicRental'] = a.isPublicRental;
              if (a.householdCount) entry['householdCount'] = a.householdCount;
              if (a.yearBuilt) entry['yearBuilt'] = a.yearBuilt;
              if (a.brand) entry['brand'] = a.brand;
              if (a.ticker) entry['ticker'] = a.ticker;
              clean[a.name] = entry;
            });
          }
          delete clean[originalName];
          // ★ Save ALL fields including distance metrics to Firestore cache
          const metaToSave: Record<string, unknown> = {
            dong: meta.dong, txKey: meta.txKey, minFloor: meta.minFloor, maxFloor: meta.maxFloor,
            isPublicRental: meta.isPublicRental, ticker: initialMeta.ticker,
            householdCount: meta.householdCount, yearBuilt: meta.yearBuilt,
            brand: meta.brand, far: meta.far, bcr: meta.bcr,
            parkingCount: meta.parkingCount, parkingPerHousehold: meta.parkingPerHousehold,
            coordinates: meta.coordinates,
            // Distance metrics (교통/학군/앵커테넌트)
            distanceToElementary: meta.distanceToElementary ?? null,
            distanceToMiddle: meta.distanceToMiddle ?? null,
            distanceToHigh: meta.distanceToHigh ?? null,
            distanceToSubway: meta.distanceToSubway ?? null,
            distanceToIndeokwon: meta.distanceToIndeokwon ?? null,
            distanceToTram: meta.distanceToTram ?? null,
            distanceToStarbucks: meta.distanceToStarbucks ?? null,
            starbucksName: meta.starbucksName ?? null,
            starbucksAddress: meta.starbucksAddress ?? null,
            starbucksCoordinates: meta.starbucksCoordinates ?? null,
            distanceToMcDonalds: meta.distanceToMcDonalds ?? null,
            mcdonaldsName: meta.mcdonaldsName ?? null,
            mcdonaldsAddress: meta.mcdonaldsAddress ?? null,
            mcdonaldsCoordinates: meta.mcdonaldsCoordinates ?? null,
            distanceToOliveYoung: meta.distanceToOliveYoung ?? null,
            oliveYoungName: meta.oliveYoungName ?? null,
            oliveYoungAddress: meta.oliveYoungAddress ?? null,
            oliveYoungCoordinates: meta.oliveYoungCoordinates ?? null,
            distanceToDaiso: meta.distanceToDaiso ?? null,
            daisoName: meta.daisoName ?? null,
            daisoAddress: meta.daisoAddress ?? null,
            daisoCoordinates: meta.daisoCoordinates ?? null,
            distanceToSupermarket: meta.distanceToSupermarket ?? null,
            supermarketName: meta.supermarketName ?? null,
            supermarketAddress: meta.supermarketAddress ?? null,
            supermarketCoordinates: meta.supermarketCoordinates ?? null,
            academyDensity: meta.academyDensity ?? null,
            restaurantDensity: meta.restaurantDensity ?? null,
          };
          // Remove undefined keys to prevent Firestore serialization error
          const safeMeta = JSON.parse(JSON.stringify(metaToSave));
          clean[newName] = safeMeta;
          await setDoc(doc(db, FIRESTORE_DOC), clean);
        }
      } catch { /* Firestore cache update non-critical */ }

      // 3. Upload photos & save scouting report to Firestore
      // 무조건 scoutingReport 문서를 업데이트/생성해야 메트릭이 저장됨
      if (true) {
        const uploadedImages: ImageMeta[] = [];
        const imagesToUpload = photos.filter(p => p.file || p.url);
        const total = imagesToUpload.length;
        let done = 0;
        setUploadProgress({ done: 0, total });

        // Parallel batch upload (3 at a time)
        const BATCH_SIZE = 3;
        for (let i = 0; i < imagesToUpload.length; i += BATCH_SIZE) {
          const batch = imagesToUpload.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(
            batch.map(async img => {
              let finalUrl = img.url;
              if (img.file) finalUrl = await uploadImage(img.file, 'report_images');
              return finalUrl ? {
                url: finalUrl, caption: img.caption || '', locationTag: img.locationTag || '',
                isPremium: img.isPremium, capturedAt: img.capturedAt,
              } as ImageMeta : null;
            })
          );
          results.forEach(r => { if (r) uploadedImages.push(r); });
          done += batch.length;
          setUploadProgress({ done, total });
        }

        const metricsPayload = {
          brand: meta.brand || '', householdCount: meta.householdCount || 0,
          far: meta.far || 0, bcr: meta.bcr || 0,
          parkingCount: meta.parkingCount, parkingPerHousehold: meta.parkingPerHousehold || 0,
          minFloor: meta.minFloor, maxFloor: meta.maxFloor, coordinates: meta.coordinates,
          yearBuilt: Number(meta.yearBuilt) || 0,
          distanceToElementary: meta.distanceToElementary || 0,
          distanceToMiddle: meta.distanceToMiddle || 0,
          distanceToHigh: meta.distanceToHigh || 0,
          distanceToSubway: meta.distanceToSubway || 0,
          distanceToIndeokwon: meta.distanceToIndeokwon ?? null,
          distanceToTram: meta.distanceToTram ?? null,
          distanceToStarbucks: meta.distanceToStarbucks ?? null,
          starbucksName: meta.starbucksName ?? null,
          starbucksAddress: meta.starbucksAddress ?? null,
          starbucksCoordinates: meta.starbucksCoordinates ?? null,
          distanceToMcDonalds: meta.distanceToMcDonalds ?? null,
          mcdonaldsName: meta.mcdonaldsName ?? null,
          mcdonaldsAddress: meta.mcdonaldsAddress ?? null,
          mcdonaldsCoordinates: meta.mcdonaldsCoordinates ?? null,
          distanceToOliveYoung: meta.distanceToOliveYoung ?? null,
          oliveYoungName: meta.oliveYoungName ?? null,
          oliveYoungAddress: meta.oliveYoungAddress ?? null,
          oliveYoungCoordinates: meta.oliveYoungCoordinates ?? null,
          distanceToDaiso: meta.distanceToDaiso ?? null,
          daisoName: meta.daisoName ?? null,
          daisoAddress: meta.daisoAddress ?? null,
          daisoCoordinates: meta.daisoCoordinates ?? null,
          distanceToSupermarket: meta.distanceToSupermarket ?? null,
          supermarketName: meta.supermarketName ?? null,
          supermarketAddress: meta.supermarketAddress ?? null,
          supermarketCoordinates: meta.supermarketCoordinates ?? null,
          academyDensity: meta.academyDensity || 0,
          ...(apiCategories.academyCategories ? { academyCategories: apiCategories.academyCategories } : {}),
          ...(meta.restaurantDensity ? { restaurantDensity: meta.restaurantDensity } : {}),
          ...(apiCategories.restaurantCategories ? { restaurantCategories: apiCategories.restaurantCategories } : {}),
          ...(apiCategories.nearestSchoolNames ? { nearestSchoolNames: apiCategories.nearestSchoolNames } : {}),
          ...(apiCategories.nearestStationName ? { nearestStationName: apiCategories.nearestStationName } : {}),
          ...(apiCategories.nearestStationLine ? { nearestStationLine: apiCategories.nearestStationLine } : {}),
          ...(apiCategories.nearestIndeokwonStationName ? { nearestIndeokwonStationName: apiCategories.nearestIndeokwonStationName } : {}),
          ...(apiCategories.nearestIndeokwonLine ? { nearestIndeokwonLine: apiCategories.nearestIndeokwonLine } : {}),
          ...(apiCategories.nearestTramStationName ? { nearestTramStationName: apiCategories.nearestTramStationName } : {}),
          ...(apiCategories.nearestTramLine ? { nearestTramLine: apiCategories.nearestTramLine } : {}),
          ...(apiCategories.nearestStationCoords ? { nearestStationCoords: apiCategories.nearestStationCoords } : {}),
          ...(apiCategories.nearestIndeokwonCoords ? { nearestIndeokwonCoords: apiCategories.nearestIndeokwonCoords } : {}),
          ...(apiCategories.nearestTramCoords ? { nearestTramCoords: apiCategories.nearestTramCoords } : {}),
        };

        const safeMetricsPayload = JSON.parse(JSON.stringify(metricsPayload));
        const premiumScores = await getPremiumScoresAction(safeMetricsPayload);

        const reportData = {
          dong: meta.dong,
          apartmentName: newName,
          scoutingDate: new Date().toLocaleDateString('en-CA'),
          thumbnailUrl: uploadedImages[0]?.url || existingReport?.thumbnailUrl || '',
          images: uploadedImages,
          metrics: safeMetricsPayload,
          premiumScores,
          isPremium: existingReport?.isPremium ?? true,
          premiumContent: existingReport?.premiumContent || '',
          authorUid: auth.currentUser?.uid || 'ADMIN',
        };

        if (existingReport?.id) {
          await updateScoutingReport(existingReport.id, reportData);
        } else {
          await createScoutingReport(reportData);
        }
        setUploadProgress(null);
      }

      // 4. Rename reports if needed
      if (newName !== originalName) {
        const q = query(collection(db, 'scoutingReports'), where('apartmentName', '==', originalName));
        const snap = await getDocs(q);
        if (snap.docs.length > 0) {
          await Promise.all(snap.docs.map(d => updateDoc(d.ref, { apartmentName: newName })));
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (newName !== originalName) {
        router.replace(`/admin/apartments/${encodeURIComponent(newName)}`);
      } else {
        setInitialMeta(JSON.parse(JSON.stringify(meta)));
      }
    } catch (e: unknown) {
      console.error('Save failed:', e);
      alert('저장에 실패했습니다: ' + (e as Error).message);
    }
    setSaving(false);
  };

  // ── Render ──
  if (!loaded) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-8 h-8 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      {/* Back + Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-[#8b95a1] hover:text-[#3182f6] text-[14px] font-bold mb-4 transition-colors">
          <ChevronLeft size={16} /> 대시보드로 돌아가기
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191f28] tracking-tight">{originalName}</h1>
            <p className="text-[#4e5968] text-[14px] mt-2">단지 기본정보 · 입지분석 · 현장 사진을 통합 관리합니다.</p>
          </div>
          <button onClick={handleAutoFetch} disabled={isCalculating}
            className="px-5 py-2.5 bg-[#e8f3ff] hover:bg-[#d0e8ff] text-[#3182f6] font-bold text-[13px] rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shrink-0">
            {isCalculating ? (
              <><div className="w-4 h-4 border-2 border-[#3182f6] border-t-transparent rounded-full animate-spin" /> 불러오는 중...</>
            ) : '📍 단지 정보 자동 출력'}
          </button>
        </div>
      </div>

      {meta && (
        <div className="space-y-8">
          {/* ─── Section 1: 기본 정보 ─── */}
          <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8">
            <h2 className="text-[16px] font-bold text-[#191f28] mb-5 border-b border-[#f2f4f6] pb-3">① 기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 block">단지명 (이름 편집)</label>
                <input type="text" value={aptName} onChange={e => setAptName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white transition-all font-bold text-[#191f28]" />
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 flex items-center gap-1"><MapPin size={14}/> 법정동</label>
                <select value={meta.dong} onChange={e => setMeta({ ...meta, dong: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white popup-select">
                  {dongNames.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-bold text-[#4e5968] flex items-center gap-1"><Link2 size={14}/> TX 키</label>
                  {suggestedTxKey && !meta?.txKey && (
                    <button onClick={() => setMeta({ ...meta, txKey: suggestedTxKey })}
                      className="px-2 py-0.5 bg-[#e8f3ff] text-[#3182f6] hover:bg-[#3182f6] hover:text-white rounded text-[11px] font-bold transition-colors">
                      자동 추천: {suggestedTxKey}
                    </button>
                  )}
                </div>
                <input type="text" value={meta.isPublicRental ? '' : (meta.txKey || '')} 
                  onChange={e => setMeta({ ...meta, txKey: e.target.value })}
                  list="tx-keys" 
                  placeholder={meta.isPublicRental ? "공공임대는 실거래가(TX) 매핑 불가" : "예: 동탄역호반써밋"}
                  disabled={meta.isPublicRental}
                  className={`w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none font-mono transition-all ${
                    meta.isPublicRental ? 'opacity-60 cursor-not-allowed text-[#8b95a1]' : 'focus:border-[#3182f6] focus:bg-white'
                  }`} />
                {(() => {
                  const searchStr = (meta.txKey || '').trim().toLowerCase();
                  const filteredKeys = txKeys
                    .filter(k => searchStr ? k.toLowerCase().includes(searchStr) : (k.includes('동탄') || (meta.dong && k.includes(meta.dong))))
                    .slice(0, 100);
                  return <datalist id="tx-keys">{filteredKeys.map(k => <option key={k} value={k}/>)}</datalist>;
                })()}
              </div>
              <NumField label="최저층" value={meta.minFloor} unit="층" placeholder="15" onChange={v => setMeta({...meta, minFloor: v ? Math.round(v) : undefined})}/>
              <NumField label="최고층" value={meta.maxFloor} unit="층" placeholder="35" onChange={v => setMeta({...meta, maxFloor: v ? Math.round(v) : undefined})}/>
              <div className="flex flex-col justify-end pb-1">
                <button type="button" onClick={() => setMeta({ ...meta, isPublicRental: !meta.isPublicRental })}
                  className={`flex items-center justify-center gap-2 h-[48px] rounded-xl text-[14px] font-bold transition-all border ${
                    meta.isPublicRental ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'
                  }`}>
                  <Home size={16}/> 공공임대 단지 설정
                </button>
              </div>
            </div>

            {/* Extended meta */}
            <div className="mt-6 pt-5 border-t border-[#f2f4f6]">
              <h3 className="text-[14px] font-bold text-[#8b95a1] mb-4">📋 건물 상세</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NumField label="세대수" value={meta.householdCount} unit="세대" placeholder="1200" onChange={v => setMeta({...meta, householdCount: v ? Math.round(v) : undefined})}/>
                <div>
                  <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 block">시공사 (브랜드)</label>
                  <input type="text" value={meta.brand || ''} onChange={e => setMeta({ ...meta, brand: e.target.value || undefined })}
                    placeholder="예: 현대건설" className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white" />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 block">사용승인 (준공)</label>
                  <input type="text" value={meta.yearBuilt || ''} onChange={e => setMeta({ ...meta, yearBuilt: e.target.value || undefined })}
                    placeholder="예: 202012" className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white" />
                </div>
                <NumField label="용적률" value={meta.far} unit="%" placeholder="249.8" onChange={v => setMeta({...meta, far: v})}/>
                <NumField label="건폐율" value={meta.bcr} unit="%" placeholder="18.5" onChange={v => setMeta({...meta, bcr: v})}/>
                <NumField label="주차대수" value={meta.parkingCount} unit="대" placeholder="1580" onChange={v => setMeta({...meta, parkingCount: v ? Math.round(v) : undefined})}/>
                <NumField label="세대당 주차" value={meta.parkingPerHousehold} unit="대" placeholder="1.45" onChange={v => setMeta({...meta, parkingPerHousehold: v})}/>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 flex items-center gap-1"><MapPin size={14}/> 좌표 (위도, 경도)</label>
                  <input type="text" value={meta.coordinates || ''} onChange={e => setMeta({ ...meta, coordinates: e.target.value || undefined })}
                    placeholder="예: 37.2005, 127.0985" className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white font-mono" />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Section 2: 입지 분석 ─── */}
          <div className="bg-[#f9fafb] rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8">
            <h2 className="text-[16px] font-bold text-[#191f28] mb-5 border-b border-[#e5e8eb] pb-3">② 입지 분석</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <NumField label="초등학교 통학거리" value={meta.distanceToElementary} unit="m" placeholder="300" onChange={v => setMeta({...meta, distanceToElementary: v})}/>
              <NumField label="중학교 통학거리" value={meta.distanceToMiddle} unit="m" placeholder="800" onChange={v => setMeta({...meta, distanceToMiddle: v})}/>
              <NumField label="고등학교 통학거리" value={meta.distanceToHigh} unit="m" placeholder="1200" onChange={v => setMeta({...meta, distanceToHigh: v})}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <NumField label="GTX-A/SRT 거리" value={meta.distanceToSubway} unit="m" placeholder="500" onChange={v => setMeta({...meta, distanceToSubway: v})}/>
              <NumField label="동탄인덕원선 거리" value={meta.distanceToIndeokwon} unit="m" placeholder="800" onChange={v => setMeta({...meta, distanceToIndeokwon: v})}/>
              <NumField label="동탄트램 거리" value={meta.distanceToTram} unit="m" placeholder="300" onChange={v => setMeta({...meta, distanceToTram: v})}/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4]">
              <div>
                <label className="text-[13px] font-bold text-[#00704A] mb-1.5 flex items-center gap-1">스타벅스 지점명</label>
                <input type="text" value={meta.starbucksName || ''} onChange={e => setMeta({ ...meta, starbucksName: e.target.value || undefined })}
                  placeholder="예: 스타벅스 동탄역점" className="w-full px-4 py-3 bg-white border border-[#bbf7d0] rounded-xl text-[15px] outline-none focus:border-[#00704A] transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[13px] font-bold text-[#00704A] mb-1.5 flex items-center gap-1">스타벅스 주소 / 구글 맵 좌표</label>
                <div className="flex gap-2">
                  <input type="text" value={meta.starbucksAddress || ''} onChange={e => setMeta({ ...meta, starbucksAddress: e.target.value || undefined })}
                    placeholder="상세 주소" className="flex-1 px-4 py-3 bg-white border border-[#bbf7d0] rounded-xl text-[15px] outline-none focus:border-[#00704A] transition-all" />
                  <input type="text" value={meta.starbucksCoordinates || ''} onChange={e => setMeta({ ...meta, starbucksCoordinates: e.target.value || undefined })}
                    placeholder="좌표 (위도,경도)" className="w-44 px-4 py-3 bg-white border border-[#bbf7d0] rounded-xl text-[15px] outline-none focus:border-[#00704A] transition-all font-mono" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 rounded-xl border border-[#03c75a]/30 bg-[#03c75a]/5 text-[#03c75a]">
              <div>
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">올리브영 지점명</label>
                <input type="text" value={meta.oliveYoungName || ''} onChange={e => setMeta({ ...meta, oliveYoungName: e.target.value || undefined })}
                  placeholder="예: 올리브영 동탄역점" className="w-full px-4 py-3 bg-white border border-[#03c75a]/30 rounded-xl text-[15px] outline-none focus:border-[#03c75a] transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">올리브영 주소 / 좌표</label>
                <div className="flex gap-2">
                  <input type="text" value={meta.oliveYoungAddress || ''} onChange={e => setMeta({ ...meta, oliveYoungAddress: e.target.value || undefined })}
                    placeholder="상세 주소" className="flex-1 px-4 py-3 bg-white border border-[#03c75a]/30 rounded-xl text-[15px] outline-none focus:border-[#03c75a] transition-all text-[#191f28]" />
                  <input type="text" value={meta.oliveYoungCoordinates || ''} onChange={e => setMeta({ ...meta, oliveYoungCoordinates: e.target.value || undefined })}
                    placeholder="위도,경도" className="w-44 px-4 py-3 bg-white border border-[#03c75a]/30 rounded-xl text-[15px] outline-none focus:border-[#03c75a] transition-all font-mono text-[#191f28]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 text-[#EF4444]">
              <div>
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">다이소 지점명</label>
                <input type="text" value={meta.daisoName || ''} onChange={e => setMeta({ ...meta, daisoName: e.target.value || undefined })}
                  placeholder="예: 다이소 동탄역점" className="w-full px-4 py-3 bg-white border border-[#EF4444]/30 rounded-xl text-[15px] outline-none focus:border-[#EF4444] transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">다이소 주소 / 좌표</label>
                <div className="flex gap-2">
                  <input type="text" value={meta.daisoAddress || ''} onChange={e => setMeta({ ...meta, daisoAddress: e.target.value || undefined })}
                    placeholder="상세 주소" className="flex-1 px-4 py-3 bg-white border border-[#EF4444]/30 rounded-xl text-[15px] outline-none focus:border-[#EF4444] transition-all text-[#191f28]" />
                  <input type="text" value={meta.daisoCoordinates || ''} onChange={e => setMeta({ ...meta, daisoCoordinates: e.target.value || undefined })}
                    placeholder="위도,경도" className="w-44 px-4 py-3 bg-white border border-[#EF4444]/30 rounded-xl text-[15px] outline-none focus:border-[#EF4444] transition-all font-mono text-[#191f28]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/5 text-[#d97706]">
              <div>
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">대형마트 지점명</label>
                <input type="text" value={meta.supermarketName || ''} onChange={e => setMeta({ ...meta, supermarketName: e.target.value || undefined })}
                  placeholder="예: 이마트 동탄점" className="w-full px-4 py-3 bg-white border border-[#f59e0b]/40 rounded-xl text-[15px] outline-none focus:border-[#f59e0b] transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">대형마트 주소 / 좌표</label>
                <div className="flex gap-2">
                  <input type="text" value={meta.supermarketAddress || ''} onChange={e => setMeta({ ...meta, supermarketAddress: e.target.value || undefined })}
                    placeholder="상세 주소" className="flex-1 px-4 py-3 bg-white border border-[#f59e0b]/40 rounded-xl text-[15px] outline-none focus:border-[#f59e0b] transition-all text-[#191f28]" />
                  <input type="text" value={meta.supermarketCoordinates || ''} onChange={e => setMeta({ ...meta, supermarketCoordinates: e.target.value || undefined })}
                    placeholder="위도,경도" className="w-44 px-4 py-3 bg-white border border-[#f59e0b]/40 rounded-xl text-[15px] outline-none focus:border-[#f59e0b] transition-all font-mono text-[#191f28]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 rounded-xl border border-[#DA291C]/30 bg-[#DA291C]/5 text-[#DA291C]">
              <div>
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">맥도날드 지점명</label>
                <input type="text" value={meta.mcdonaldsName || ''} onChange={e => setMeta({ ...meta, mcdonaldsName: e.target.value || undefined })}
                  placeholder="예: 맥도날드 동탄점" className="w-full px-4 py-3 bg-white border border-[#DA291C]/30 rounded-xl text-[15px] outline-none focus:border-[#DA291C] transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[13px] font-bold mb-1.5 flex items-center gap-1">맥도날드 주소 / 좌표</label>
                <div className="flex gap-2">
                  <input type="text" value={meta.mcdonaldsAddress || ''} onChange={e => setMeta({ ...meta, mcdonaldsAddress: e.target.value || undefined })}
                    placeholder="상세 주소" className="flex-1 px-4 py-3 bg-white border border-[#DA291C]/30 rounded-xl text-[15px] outline-none focus:border-[#DA291C] transition-all text-[#191f28]" />
                  <input type="text" value={meta.mcdonaldsCoordinates || ''} onChange={e => setMeta({ ...meta, mcdonaldsCoordinates: e.target.value || undefined })}
                    placeholder="위도,경도" className="w-44 px-4 py-3 bg-white border border-[#DA291C]/30 rounded-xl text-[15px] outline-none focus:border-[#DA291C] transition-all font-mono text-[#191f28]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <NumField label="스타벅스" value={meta.distanceToStarbucks} unit="m" placeholder="250" onChange={v => setMeta({...meta, distanceToStarbucks: v})}/>
              <NumField label="올리브영" value={meta.distanceToOliveYoung} unit="m" placeholder="300" onChange={v => setMeta({...meta, distanceToOliveYoung: v})}/>
              <NumField label="다이소" value={meta.distanceToDaiso} unit="m" placeholder="400" onChange={v => setMeta({...meta, distanceToDaiso: v})}/>
              <NumField label="대형마트" value={meta.distanceToSupermarket} unit="m" placeholder="500" onChange={v => setMeta({...meta, distanceToSupermarket: v})}/>
              <NumField label="맥도날드" value={meta.distanceToMcDonalds} unit="m" placeholder="600" onChange={v => setMeta({...meta, distanceToMcDonalds: v})}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NumField label="학원 밀집도 (500m)" value={meta.academyDensity} unit="개" placeholder="120" onChange={v => setMeta({...meta, academyDensity: v})}/>
              <NumField label="음식점·카페 (500m)" value={meta.restaurantDensity} unit="개" placeholder="472" onChange={v => setMeta({...meta, restaurantDensity: v})}/>
            </div>

            {/* Category panels */}
            {(apiCategories.academyCategories || apiCategories.restaurantCategories) && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {apiCategories.academyCategories && Object.keys(apiCategories.academyCategories).length > 0 && (
                  <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
                    <div className="text-[13px] font-bold text-[#03c75a] mb-2">학원 카테고리 ({Object.values(apiCategories.academyCategories).reduce((a,b) => a+b, 0)}개)</div>
                    {Object.entries(apiCategories.academyCategories).sort(([,a],[,b]) => b-a).map(([cat,cnt]) => (
                      <div key={cat} className="flex justify-between text-[12px] py-0.5 px-1">
                        <span className="text-[#4e5968] truncate mr-2">{cat}</span>
                        <span className="font-bold text-[#03c75a] shrink-0">{cnt}개</span>
                      </div>
                    ))}
                  </div>
                )}
                {apiCategories.restaurantCategories && Object.keys(apiCategories.restaurantCategories).length > 0 && (
                  <div className="bg-[#fffbeb] rounded-xl p-4 border border-[#fde68a]">
                    <div className="text-[13px] font-bold text-[#f59e0b] mb-2">음식점·카페 ({Object.values(apiCategories.restaurantCategories).reduce((a,b) => a+b, 0)}개)</div>
                    {Object.entries(apiCategories.restaurantCategories).sort(([,a],[,b]) => b-a).map(([cat,cnt]) => (
                      <div key={cat} className="flex justify-between text-[12px] py-0.5 px-1">
                        <span className="text-[#4e5968] truncate mr-2">{cat}</span>
                        <span className="font-bold text-[#f59e0b] shrink-0">{cnt}개</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Section 3: 현장 사진 ─── */}
          <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8">
            <h2 className="text-[16px] font-bold text-[#191f28] mb-5 border-b border-[#f2f4f6] pb-3 flex items-center gap-2">
              ③ 현장 사진
              <span className="text-[12px] font-medium text-[#8b95a1] ml-auto">{photos.length}장</span>
              {photos.length > 0 && (
                <button type="button" onClick={() => {
                  if (confirm(`사진 ${photos.length}장을 전부 삭제합니다. 계속할까요?`)) {
                    setPhotos([]);
                    uploadedFileKeys.current.clear();
                  }
                }} className="px-3 py-1.5 bg-[#ffebec] text-[#f04452] rounded-lg text-[11px] font-bold hover:bg-[#f04452] hover:text-white transition-colors">
                  전체 삭제
                </button>
              )}
            </h2>

            {/* Drop Zone */}
            <div
              className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging ? 'border-[#3182f6] bg-[#e8f3ff] scale-[1.01]' : 'border-[#d1d6db] bg-[#f9fafb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
              }`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleBatchFiles(e.dataTransfer.files); }}
              onClick={() => batchInputRef.current?.click()}
            >
              <input ref={batchInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => { if (e.target.files) handleBatchFiles(e.target.files); e.target.value = ''; }} />
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
                <ImagePlus size={22} className="text-[#3182f6]" />
              </div>
              <p className="text-[15px] font-bold text-[#191f28] mb-1">
                {isDragging ? '여기에 놓으세요!' : '사진을 한번에 여러 장 추가'}
              </p>
              <p className="text-[12px] text-[#8b95a1]">드래그하거나 클릭하여 사진 선택 · EXIF 촬영일 자동 감지</p>
            </div>

            {/* Sort Button */}
            {photos.length >= 2 && (
              <button type="button" onClick={sortByCategory}
                className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e8eb] rounded-xl text-[13px] font-bold text-[#4e5968] hover:bg-[#f9fafb] hover:border-[#3182f6] hover:text-[#3182f6] transition-all shadow-sm">
                <ArrowUpDown size={14} /> 카테고리별 자동 정렬 <span className="text-[11px] text-[#8b95a1] font-medium">({photos.length}장)</span>
              </button>
            )}

            {/* Photo Cards */}
            <div className="space-y-4">
              {photos.map((photo, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border border-[#e5e8eb] rounded-2xl bg-white shadow-sm hover:border-[#3182f6] transition-colors group relative">
                  {/* Preview */}
                  <div className="w-full md:w-[150px] h-[100px] bg-[#f9fafb] border-2 border-dashed border-[#d1d6db] rounded-xl overflow-hidden relative shrink-0">
                    {(photo.previewUrl || photo.url) ? (
                      <>
                        <img src={photo.previewUrl || photo.url} alt="Preview" className="w-full h-full object-cover" />
                        {photo.capturedAt && (
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                            {photo.capturedAt}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8b95a1]">
                        <ImagePlus size={24} />
                      </div>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      {/* Category Picker — 2-level popover */}
                      {(() => {
                        const currentTag = photo.locationTag;
                        const currentGroup = IMAGE_CATEGORY_GROUPS.find(g => g.items.includes(currentTag));
                        return (
                          <div className="relative w-[220px]">
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`cat-popover-${index}`);
                                if (el) el.classList.toggle('hidden');
                              }}
                              className="w-full px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] font-bold text-left cursor-pointer hover:border-[#3182f6] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-colors text-[#191f28] flex items-center justify-between"
                            >
                              <span className="truncate">{currentTag || '카테고리 선택'}</span>
                              <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 ml-1 text-[#8b95a1]"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                            </button>
                            <div
                              id={`cat-popover-${index}`}
                              className="hidden absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-[#e5e8eb] w-[380px] md:w-[560px] max-h-[280px] overflow-hidden"
                            >
                              {/* Group tabs */}
                              <div className="flex gap-1 p-2 overflow-x-auto border-b border-[#f2f4f6] bg-[#fafbfc]">
                                {IMAGE_CATEGORY_GROUPS.map((g, gIdx) => (
                                  <button
                                    key={g.group}
                                    type="button"
                                    onClick={() => {
                                      const container = document.getElementById(`cat-popover-${index}`);
                                      if (!container) return;
                                      container.querySelectorAll('[data-cat-group]').forEach(el => el.classList.add('hidden'));
                                      container.querySelector(`[data-cat-group="${gIdx}"]`)?.classList.remove('hidden');
                                      container.querySelectorAll('[data-cat-tab]').forEach(el => {
                                        el.classList.remove('bg-[#191f28]', 'text-white');
                                        el.classList.add('bg-[#f2f4f6]', 'text-[#4e5968]');
                                      });
                                      container.querySelector(`[data-cat-tab="${gIdx}"]`)?.classList.remove('bg-[#f2f4f6]', 'text-[#4e5968]');
                                      container.querySelector(`[data-cat-tab="${gIdx}"]`)?.classList.add('bg-[#191f28]', 'text-white');
                                    }}
                                    data-cat-tab={gIdx}
                                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                      (currentGroup === g || (!currentGroup && gIdx === 0))
                                        ? 'bg-[#191f28] text-white'
                                        : 'bg-[#f2f4f6] text-[#4e5968] hover:bg-[#e5e8eb]'
                                    }`}
                                  >
                                    {g.group.replace(/[^\w가-힣·\s]/g, '').trim()}
                                  </button>
                                ))}
                              </div>
                              {/* Items per group */}
                              {IMAGE_CATEGORY_GROUPS.map((g, gIdx) => (
                                <div
                                  key={g.group}
                                  data-cat-group={gIdx}
                                  className={`p-2 flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto ${
                                    (currentGroup === g || (!currentGroup && gIdx === 0)) ? '' : 'hidden'
                                  }`}
                                >
                                  {g.items.map(item => (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...photos];
                                        updated[index] = { ...updated[index], locationTag: item };
                                        setPhotos(updated);
                                        document.getElementById(`cat-popover-${index}`)?.classList.add('hidden');
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                        currentTag === item
                                          ? 'bg-[#e8f3ff] text-[#3182f6] border-[#3182f6] font-bold'
                                          : 'bg-white text-[#4e5968] border-[#e5e8eb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
                                      }`}
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      <input type="text" value={photo.caption}
                        onChange={e => {
                          const updated = [...photos];
                          updated[index] = { ...updated[index], caption: e.target.value };
                          setPhotos(updated);
                        }}
                        placeholder="캡션 입력 (선택)"
                        className="flex-1 px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] outline-none focus:border-[#3182f6] transition-colors" />
                    </div>
                  </div>

                  {/* Delete */}
                  <button type="button" onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-[#f2f4f6] text-[#8b95a1] hover:bg-[#f04452] hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Floating Save Bar ─── */}
          <div className="fixed bottom-0 left-0 md:left-[240px] right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-[#e5e8eb] px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <span className="text-[13px] text-[#8b95a1] font-medium">
              {uploadProgress ? `📤 업로드 중... ${uploadProgress.done}/${uploadProgress.total}장` : `📸 ${photos.length}장 · ${meta.dong}`}
            </span>
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-[14px] ${
                saved ? 'bg-[#03c75a] text-white shadow-lg shadow-[#03c75a]/20' : 'bg-[#3182f6] hover:bg-[#2b72d6] text-white shadow-lg shadow-[#3182f6]/20'
              } disabled:opacity-60`}>
              <Save size={16}/>
              {saving ? '저장 중...' : saved ? '저장 완료!' : '통합 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
