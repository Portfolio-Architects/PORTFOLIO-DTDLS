'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, setDoc, query, collection, onSnapshot, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { TX_SUMMARY } from '@/lib/transaction-summary';
import { DONGS } from '@/lib/dongs';
import { Building, Save, Home, Link2, ChevronLeft, MapPin } from 'lucide-react';
import { ScoutingReport } from '@/lib/types/scoutingReport';
import ReportEditorForm from '@/components/admin/ReportEditorForm';

const FIRESTORE_DOC = 'settings/apartmentMeta';
const dongNames = DONGS.map(d => d.name).sort((a, b) => a.localeCompare(b, 'ko'));
const txKeys = Object.keys(TX_SUMMARY).sort();

function normalizeAptName(name: string): string {
  return name.replace(/\[.*?\]\s*/g, '').replace(/\s+/g, '').replace(/[()（）]/g, '').trim();
}

const LOCATION_PREFIXES = [
  '숲속마을동탄','푸른마을동탄','나루마을동탄',
  '동탄역시범','동탄시범다은마을','동탄시범한빛마을','동탄시범나루마을',
  '시범다은마을','시범한빛마을','시범나루마을','시범',
  '반탄솔빛마을','솔빛마을','예당마을','새강마을',
  '동탄2신도시','동탄신도시','동탄숲속마을','동탄푸른마을','동탄나루마을',
  '동탄호수공원역','동탄호수공원','동탄호수','동탄역',
  '화성동탄2','능동역','호수공원역','동탄2','동탄',
];

// 단지명 끝에 붙는 접미사 — 실거래 DB와 단지명이 다를 때 제거하여 비교
const NAME_SUFFIXES = ['역', '2단지', '1단지', '3단지', '4단지', '5단지', '단지'];

function stripPrefix(n: string) {
  for (const p of LOCATION_PREFIXES) if (n.startsWith(p) && n.length > p.length) return n.slice(p.length);
  return n;
}

function stripSuffix(n: string) {
  for (const s of NAME_SUFFIXES) if (n.endsWith(s) && n.length > s.length) return n.slice(0, -s.length);
  return n;
}

/** 레벤슈타인 편집 거리 (간단 구현) */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}

function autoSuggest(aptName: string): string | null {
  const norm = normalizeAptName(aptName);
  const keys = Object.keys(TX_SUMMARY);
  if (!norm || norm.length < 2) return null;

  // 1. 정확 일치
  if (keys.includes(norm)) return norm;

  // 2. 접두사 제거 후 정확 일치
  const stripped = stripPrefix(norm);
  if (stripped !== norm && keys.includes(stripped)) return stripped;
  for (const k of keys) if (stripPrefix(k) === stripped) return k;

  // 3. 접미사 제거 후 매칭 (힐스테이트동탄역 → 힐스테이트동탄)
  const suffixStripped = stripSuffix(norm);
  if (suffixStripped !== norm && keys.includes(suffixStripped)) return suffixStripped;
  // TX키에서도 접미사를 제거하여 비교
  for (const k of keys) if (stripSuffix(k) === suffixStripped) return k;
  // 양쪽 모두 접두사+접미사 제거
  const bothStripped = stripSuffix(stripped);
  if (bothStripped !== stripped) {
    for (const k of keys) if (stripSuffix(stripPrefix(k)) === bothStripped) return k;
  }

  // 4. 부분 문자열 포함 (norm이 TX키를 포함하거나, TX키가 norm을 포함)
  const containMatches = keys.filter(k => norm.includes(k) || k.includes(norm));
  if (containMatches.length === 1) return containMatches[0];
  if (containMatches.length > 1) {
    // 길이가 가장 가까운 것 선택
    containMatches.sort((a, b) => Math.abs(a.length - norm.length) - Math.abs(b.length - norm.length));
    return containMatches[0];
  }

  // 5. 편집 거리가 충분히 가까운 후보 (이름의 20% 이내 차이)
  const threshold = Math.max(2, Math.floor(norm.length * 0.25));
  let bestKey: string | null = null;
  let bestDist = Infinity;
  for (const k of keys) {
    const dist = editDistance(norm, k);
    if (dist < bestDist && dist <= threshold) {
      bestDist = dist;
      bestKey = k;
    }
  }
  return bestKey;
}

interface AptMeta {
  dong: string;
  txKey?: string;
  maxFloor?: number;
  isPublicRental?: boolean;
  householdCount?: number;
  yearBuilt?: string;
  brand?: string;
  ticker?: string;
}

export default function ApartmentInfoPage() {
  const router = useRouter();
  const params = useParams();
  const originalName = decodeURIComponent(params.name as string);

  const [meta, setMeta] = useState<AptMeta | null>(null);
  const [initialMeta, setInitialMeta] = useState<AptMeta | null>(null);
  const [aptName, setAptName] = useState(originalName);
  
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const suggestedTxKey = useMemo(() => {
    return !meta?.txKey ? autoSuggest(originalName) : null;
  }, [meta?.txKey, originalName]);

  // Load from Sheets
  useEffect(() => {
    let isMounted = true;
    const loadFromSheets = async () => {
      try {
        const res = await fetch('/api/apartments-by-dong');
        if (!res.ok) throw new Error('Failed to fetch from sheets');
        const data = await res.json();
        
        let foundMeta: AptMeta | null = null;
        if (data.byDong) {
          for (const [dong, apts] of Object.entries(data.byDong)) {
            const foundApt = (apts as any[]).find(a => a.name === originalName);
            if (foundApt) {
              foundMeta = {
                dong: foundApt.dong,
                txKey: foundApt.txKey || undefined,
                maxFloor: foundApt.maxFloor || 0,
                isPublicRental: foundApt.isPublicRental || false,
                householdCount: foundApt.householdCount,
                yearBuilt: foundApt.yearBuilt,
                brand: foundApt.brand,
                ticker: foundApt.ticker,
              };
              break;
            }
          }
        }
        
        if (isMounted) {
          if (foundMeta) {
            setMeta(foundMeta);
            setInitialMeta(JSON.parse(JSON.stringify(foundMeta)));
          } else {
            // Not found in Sheets? Initialize empty/default
            const fallback: AptMeta = { dong: '기타', maxFloor: 0, isPublicRental: false };
            setMeta(fallback);
            setInitialMeta(fallback);
          }
          setLoaded(true);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoaded(true);
      }
    };
    loadFromSheets();
    return () => { isMounted = false; };
  }, [originalName]);

  // Load Scouting Reports
  useEffect(() => {
    if (!originalName) return;
    const q = query(collection(db, 'scoutingReports'), where('apartmentName', '==', originalName));
    const unsub = onSnapshot(q, snap => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScoutingReport));
      // Sort by newest
      fetched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReports(fetched);
    });
    return () => unsub();
  }, [originalName]);

  const handleSave = async () => {
    if (!meta || !initialMeta) return;
    setSaving(true);
    try {
      const syncPayload: { updates: any[], adds: any[], deletes: string[] } = {
        updates: [],
        adds: [],
        deletes: []
      };

      const newName = aptName.trim();
      if (!newName) throw new Error('아파트 이름을 입력해주세요.');

      if (!initialMeta.ticker) {
        // This is a newly added apartment that didn't have a ticker, but usually this page is for existing ones.
        // If it somehow doesn't have a ticker, treat as 'add'
        syncPayload.adds.push({
          name: newName,
          dong: meta.dong,
          txKey: meta.txKey || ''
        });
      } else {
        // Existing apartment update
        const updates: Record<string, string|number|boolean> = {};
        if (newName !== originalName) updates['아파트명'] = newName;
        if (meta.dong !== initialMeta.dong) updates['동'] = meta.dong;
        if (meta.txKey !== initialMeta.txKey) updates['txKey'] = meta.txKey || '';
        if (meta.maxFloor !== initialMeta.maxFloor) updates['최고층'] = meta.maxFloor || '';
        if (meta.isPublicRental !== initialMeta.isPublicRental) updates['공공임대'] = meta.isPublicRental ? 'Y' : 'N';
        
        if (Object.keys(updates).length > 0) {
          syncPayload.updates.push({
            ticker: initialMeta.ticker,
            updates
          });
        }
      }

      // 1. Save to Google Sheets API
      if (syncPayload.updates.length > 0 || syncPayload.adds.length > 0 || syncPayload.deletes.length > 0) {
        const syncRes = await fetch('/api/apartments-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload)
        });
        if (!syncRes.ok) {
          const errData = await syncRes.json();
          throw new Error('Google Sheets Sync Failed: ' + errData.error);
        }
      }

      // 2. Update Firestore Cache for this apartment
      // Since FIRESTORE_DOC is a map of ALL apartments, we merged update to it
      const resMeta = await fetch('/api/apartments-by-dong');
      if (resMeta.ok) {
         const data = await resMeta.json();
         const clean: Record<string, Record<string, unknown>> = {};
         for (const [dong, apts] of Object.entries(data.byDong || {})) {
           (apts as any[]).forEach(a => {
             const entry: Record<string, unknown> = {};
             if(a.dong) entry['dong'] = a.dong;
             if(a.txKey) entry['txKey'] = a.txKey;
             if(a.maxFloor) entry['maxFloor'] = a.maxFloor;
             if(a.isPublicRental) entry['isPublicRental'] = a.isPublicRental;
             if(a.householdCount) entry['householdCount'] = a.householdCount;
             if(a.yearBuilt) entry['yearBuilt'] = a.yearBuilt;
             if(a.brand) entry['brand'] = a.brand;
             if(a.ticker) entry['ticker'] = a.ticker;
             clean[a.name] = entry;
           });
         }
         // Specifically replace the one we just edited to bypass latency
         delete clean[originalName];
         clean[newName] = {
           dong: meta.dong,
           txKey: meta.txKey,
           maxFloor: meta.maxFloor,
           isPublicRental: meta.isPublicRental,
           ticker: initialMeta.ticker // retain
         };
         await setDoc(doc(db, FIRESTORE_DOC), clean);
      }

      // 3. If renamed, update scouting reports' apartmentName field
      if (newName !== originalName) {
        const q = query(collection(db, 'scoutingReports'), where('apartmentName', '==', originalName));
        const snap = await getDocs(q);
        const reportUpdates = snap.docs.map(d => updateDoc(d.ref, { apartmentName: newName }));
        if (reportUpdates.length > 0) await Promise.all(reportUpdates);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // Redirect if name changed
      if (newName !== originalName) {
        router.replace(`/admin/apartments/${encodeURIComponent(newName)}`);
      } else {
        setInitialMeta(JSON.parse(JSON.stringify(meta)));
      }

    } catch (e: any) {
      console.error('Save failed:', e);
      alert('저장에 실패했습니다: ' + e.message);
    }
    setSaving(false);
  };

  if (!loaded) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-8 h-8 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      {/* Back button & Header */}
      <div className="mb-6">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-[#8b95a1] hover:text-[#3182f6] text-[14px] font-bold mb-4 transition-colors">
          <ChevronLeft size={16} /> 대시보드로 돌아가기
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191f28] tracking-tight">{originalName}</h1>
        <p className="text-[#4e5968] text-[14px] mt-2">단지 기본 정보 및 임장기 데이터를 관리합니다.</p>
      </div>

      {/* Meta Editor Form */}
      {meta && (
        <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8 mb-8">
          <h2 className="text-[16px] font-bold text-[#191f28] mb-5 border-b border-[#f2f4f6] pb-3">단지 기본 정보 (Meta)</h2>
          
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
                <label className="text-[13px] font-bold text-[#4e5968] flex items-center gap-1">
                  <Link2 size={14}/> TX 키 (실거래가 연동)
                </label>
                {suggestedTxKey && !meta?.txKey && (
                  <button onClick={() => setMeta({ ...meta, txKey: suggestedTxKey })}
                    className="px-2 py-0.5 bg-[#e8f3ff] text-[#3182f6] hover:bg-[#3182f6] hover:text-white rounded text-[11px] font-bold transition-colors">
                    자동 추천: {suggestedTxKey}
                  </button>
                )}
              </div>
              <input type="text" value={meta.txKey || ''} onChange={e => setMeta({ ...meta, txKey: e.target.value })}
                list="tx-keys" placeholder="예: 동탄역호반써밋"
                className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white font-mono" />
              <datalist id="tx-keys">{txKeys.slice(0, 30).map(k => <option key={k} value={k}/>)}</datalist>
            </div>

            <div>
              <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 flex items-center gap-1"><Building size={14}/> 최고층</label>
              <div className="relative">
                <input type="number" min={0} max={99} value={meta.maxFloor || ''} onChange={e => setMeta({ ...meta, maxFloor: parseInt(e.target.value) || 0 })}
                  placeholder="예: 35"
                  className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] outline-none focus:border-[#3182f6] focus:bg-white font-bold" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b95a1] font-bold text-[14px]">층</span>
              </div>
            </div>

            <div className="flex flex-col justify-end pb-1">
              <button type="button" onClick={() => setMeta({ ...meta, isPublicRental: !meta.isPublicRental })}
                className={`flex items-center justify-center gap-2 h-[48px] rounded-xl text-[14px] font-bold transition-all border ${
                  meta.isPublicRental ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'
                }`}>
                <Home size={16}/> 공공임대 단지 설정
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-[14px] ${
                saved ? 'bg-[#03c75a] text-white shadow-lg shadow-[#03c75a]/20' : 'bg-[#3182f6] hover:bg-[#2b72d6] text-white shadow-lg shadow-[#3182f6]/20'
              } disabled:opacity-60`}>
              <Save size={16}/>
              {saving ? '저장 중...' : saved ? '저장 완료!' : '기본 정보 저장'}
            </button>
          </div>
        </div>
      )}

      {/* Report Editor Section */}
      <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8">
        <div className="mb-5 border-b border-[#f2f4f6] pb-3">
          <h2 className="text-[16px] font-bold text-[#191f28]">임장기 상세 기록</h2>
          <p className="text-[13px] text-[#8b95a1] font-medium mt-1">이 단지의 세부 지표 및 현장 사진을 작성하고 관리합니다.</p>
        </div>

        <div className="-mx-5 md:-mx-8">
          <ReportEditorForm 
            key={reports.length > 0 ? reports[0].id : 'new'}
            initialData={reports.length > 0 ? (reports[0] as any) : null}
            reportId={reports.length > 0 ? reports[0].id : undefined}
            lockedMeta={{ dong: meta?.dong || '미지정', apartmentName: originalName }} 
            onSuccess={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </div>
    </div>
  );
}
