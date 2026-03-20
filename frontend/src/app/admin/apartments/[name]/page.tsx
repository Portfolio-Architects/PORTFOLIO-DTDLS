'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, setDoc, query, collection, onSnapshot, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { TX_SUMMARY } from '@/lib/transaction-summary';
import { DONGS } from '@/lib/dongs';
import { Building, Save, Home, Link2, FileText, ChevronLeft, MapPin, Edit, Trash2, PlusCircle } from 'lucide-react';
import { ScoutingReport } from '@/lib/types/scoutingReport';
import Link from 'next/link';
import ReportEditorForm from '@/components/admin/ReportEditorForm';

const FIRESTORE_DOC = 'settings/apartmentMeta';
const dongNames = DONGS.map(d => d.name).sort((a, b) => a.localeCompare(b, 'ko'));
const txKeys = Object.keys(TX_SUMMARY).sort();

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
  const [isWriting, setIsWriting] = useState(false);

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

  const handleDeleteReport = async (id: string, name: string) => {
    if (window.confirm(`정말로 '${name}' 임장기를 삭제하시겠습니까?`)) {
      try {
        await deleteDoc(doc(db, 'scoutingReports', id));
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
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
              <label className="text-[13px] font-bold text-[#4e5968] mb-1.5 flex items-center gap-1"><Link2 size={14}/> TX 키 (실거래가 연동)</label>
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

      {/* Reports Section */}
      <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8">
        <div className="flex items-center justify-between mb-5 border-b border-[#f2f4f6] pb-3">
          <h2 className="text-[16px] font-bold text-[#191f28] flex items-center gap-2">
            임장기 데이터 
            <span className="bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-full text-[12px]">{reports.length}</span>
          </h2>
          {!isWriting && (
            <button onClick={() => setIsWriting(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f3ff] text-[#3182f6] hover:bg-[#3182f6] hover:text-white rounded-lg text-[12px] font-bold transition-colors">
              <PlusCircle size={14}/> 새 임장기 작성
            </button>
          )}
        </div>

        {isWriting ? (
          <div className="-mx-5 md:-mx-8">
            <ReportEditorForm 
              lockedMeta={{ dong: meta?.dong || '미지정', apartmentName: originalName }} 
              onCancel={() => setIsWriting(false)} 
            />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className="flex items-center gap-4 p-4 bg-[#f9fafb] rounded-xl border border-[#e5e8eb] hover:shadow-sm transition-all hover:bg-white group cursor-default">
                {(report.thumbnailUrl || report.images?.[0]?.url) ? (
                  <img src={report.thumbnailUrl || report.images?.[0]?.url || ''} alt=""
                    className="w-[80px] h-[60px] object-cover rounded-lg border border-[#e5e8eb] shrink-0" />
                ) : (
                  <div className="w-[80px] h-[60px] bg-[#f2f4f6] rounded-lg border border-[#e5e8eb] flex items-center justify-center shrink-0 text-[#d1d6db]">
                    <FileText size={20}/>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {report.premiumScores && (
                    <p className="text-[13px] text-[#3182f6] font-bold flex items-center gap-1 mb-1">
                      프리미엄 지수: <span className="text-[15px] font-extrabold">{report.premiumScores.totalPremiumScore}</span>점
                    </p>
                  )}
                  <div className="text-[11px] text-[#8b95a1] flex items-center gap-2 font-medium">
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>시공사: {report.metrics?.brand || '-'}</span>
                    <span>·</span>
                    <span>총 {Object.keys(report.metrics).length}개 지표 확보</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/edit-report/${report.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e8eb] text-[#4e5968] hover:border-[#3182f6] hover:text-[#3182f6] rounded-lg text-[12px] font-bold shadow-sm transition-all">
                    <Edit size={14}/> 지표 및 사진 수정
                  </Link>
                  <button onClick={() => handleDeleteReport(report.id!, report.apartmentName)}
                    className="flex items-center justify-center w-9 h-9 bg-white border border-[#e5e8eb] text-[#8b95a1] hover:bg-[#ffebec] hover:text-[#f04452] hover:border-[#ffebec] rounded-lg shadow-sm transition-all">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-[#f9fafb] rounded-xl border border-dashed border-[#e5e8eb]">
            <p className="text-[14px] text-[#8b95a1] font-medium mb-3">등록된 임장기가 없습니다.</p>
            <button onClick={() => setIsWriting(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e5e8eb] rounded-xl text-[13px] font-bold text-[#4e5968] hover:border-[#3182f6] hover:text-[#3182f6] shadow-sm transition-all">
              <PlusCircle size={16}/> 첫 임장기 등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
