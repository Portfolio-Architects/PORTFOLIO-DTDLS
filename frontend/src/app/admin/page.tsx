'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Building, Save, Search, Check, X, AlertTriangle, ChevronDown, ChevronRight,
  Home, Link2, FileText, Plus, Trash2, MapPin, PlusCircle, Edit
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, onSnapshot, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { TX_SUMMARY } from '@/lib/transaction-summary';
import { DONGS } from '@/lib/dongs';
import { FULL_DONG_DATA } from '@/lib/dong-apartments';
import { ScoutingReport } from '@/lib/types/scoutingReport';

const FIRESTORE_DOC = 'settings/apartmentMeta';
const dongNames = DONGS.map(d => d.name).sort((a, b) => a.localeCompare(b, 'ko'));

// ── Auto-suggest TX key matching ──
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
function stripPrefix(n: string) {
  for (const p of LOCATION_PREFIXES) if (n.startsWith(p) && n.length > p.length) return n.slice(p.length);
  return n;
}
function autoSuggest(aptName: string): string | null {
  const norm = normalizeAptName(aptName);
  const keys = Object.keys(TX_SUMMARY);
  if (keys.includes(norm)) return norm;
  const stripped = stripPrefix(norm);
  if (stripped !== norm && keys.includes(stripped)) return stripped;
  for (const k of keys) if (stripPrefix(k) === stripped) return k;
  return null;
}

// ── Types ──
export interface AptMeta {
  dong: string;
  txKey?: string;
  maxFloor?: number;
  isPublicRental?: boolean;
  householdCount?: number;
  yearBuilt?: string;
  brand?: string;
  ticker?: string; // Ticker from Google Sheets
}
type MetaMap = Record<string, AptMeta>;

export default function AdminDashboard() {
  // ── State ──
  const [meta, setMeta] = useState<MetaMap>({});
  const [initialMeta, setInitialMeta] = useState<MetaMap>({}); // To track changes for sync
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'unmatched'|'public'|'private'|'reported'>('all');
  const [expandedDongs, setExpandedDongs] = useState<Set<string>>(new Set());
  const [expandedApts, setExpandedApts] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  
  // Scouting reports
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [reportsByApt, setReportsByApt] = useState<Record<string, ScoutingReport[]>>({});
  
  // Add apartment form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAptName, setNewAptName] = useState('');
  const [newAptDong, setNewAptDong] = useState(dongNames[0]);
  // Rename
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  // Deletes tracking for sync
  const [deletedApts, setDeletedApts] = useState<Set<string>>(new Set());

  const txKeys = useMemo(() => Object.keys(TX_SUMMARY).sort(), []);

  // ── Load Scouting Reports ──
  useEffect(() => {
    const q = query(collection(db, 'scoutingReports'));
    const unsub = onSnapshot(q, snap => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ScoutingReport));
      setReports(fetched);
      const byApt: Record<string, ScoutingReport[]> = {};
      fetched.forEach(r => {
        if (!byApt[r.apartmentName]) byApt[r.apartmentName] = [];
        byApt[r.apartmentName].push(r);
      });
      setReportsByApt(byApt);
    });
    return () => unsub();
  }, []);

  // ── Load from Google Sheets (Single Source of Truth) ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/apartments-by-dong');
        if (!res.ok) throw new Error('Failed to fetch from sheets');
        const data = await res.json();
        const sheetMap: MetaMap = {};
        
        // Parse the grouped byDong data
        if (data.byDong) {
          for (const [dong, apts] of Object.entries(data.byDong)) {
            (apts as any[]).forEach(apt => {
              sheetMap[apt.name] = {
                dong: apt.dong,
                txKey: apt.txKey || autoSuggest(apt.name) || undefined,
                maxFloor: apt.maxFloor || 0,
                isPublicRental: apt.isPublicRental || false,
                householdCount: apt.householdCount,
                yearBuilt: apt.yearBuilt,
                brand: apt.brand,
                ticker: apt.ticker, // Crucial for Write API
              };
            });
          }
        }
        setMeta(sheetMap);
        setInitialMeta(JSON.parse(JSON.stringify(sheetMap))); // Deep copy for diffing
        setLoaded(true);
      } catch (e) {
        console.error('Failed to load sheets:', e);
        setLoaded(true);
      }
    })();
  }, []);

  // ── Actions ──
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Calculate diffs for Google Sheets
      const syncPayload: { updates: any[], adds: any[], deletes: string[] } = {
        updates: [],
        adds: [],
        deletes: Array.from(deletedApts)
      };

      for (const [name, currentM] of Object.entries(meta)) {
        const initialM = initialMeta[name];
        if (!initialM) {
          // This is a new apartment (added)
          syncPayload.adds.push({
            name,
            dong: currentM.dong,
            txKey: currentM.txKey,
          });
        } else {
          // Compare fields for updates
          const updates: Record<string, string|number|boolean> = {};
          if (currentM.dong !== initialM.dong) updates['동'] = currentM.dong;
          if (currentM.txKey !== initialM.txKey) updates['txKey'] = currentM.txKey || '';
          if (currentM.maxFloor !== initialM.maxFloor) updates['최고층'] = currentM.maxFloor || '';
          if (currentM.isPublicRental !== initialM.isPublicRental) updates['공공임대'] = currentM.isPublicRental ? 'Y' : 'N';
          // NOTE: renamed apartment checking via old name (since exact name match fails if renamed)
          // Actually, if we rename, the key changes. Wait, `name` is the key. 
          // Re-evaluate: rename function deletes old name and creates new name.
          // The old name will NOT be in `meta`, so it's not checked here. It was caught by initialMeta diff? No, the code below handles it.
          // Wait, if it's renamed, `targetRow` won't find it if it searches by name. BUT we have `ticker`!
          // Since `currentM.ticker` matches `initialM.ticker`, let's just use ticker.
          
          if (Object.keys(updates).length > 0) {
            syncPayload.updates.push({
              ticker: currentM.ticker,
              name: name,
              updates
            });
          }
        }
      }

      // Check for renames (apartments that exist in meta but the name key doesn't match initialMeta, AND they have a ticker)
      // Wait, the loop above already covered them as "adds" if the key (newName) isn't in initialMeta!
      // But if it's a rename, it's NOT an "add". It should be an "update" on the '아파트명' column identified by `ticker`.
      
      // Let's refine the diffing logic explicitly for renames:
      // Loop over current meta to find renames (where current `ticker` matches an initial, but `name` differs)
      const currentTickers = new Map<string, string>(); // ticker -> newName
      for (const [newName, m] of Object.entries(meta)) {
        if (m.ticker) currentTickers.set(m.ticker, newName);
      }

      // Re-build diffs perfectly using ticker as ID
      syncPayload.updates = [];
      syncPayload.adds = [];
      syncPayload.deletes = [];

      // Detect deletions and updates for existing items
      for (const [oldName, initialM] of Object.entries(initialMeta)) {
        if (initialM.ticker) {
          const newName = currentTickers.get(initialM.ticker);
          if (!newName) {
            // Deleted entirely
            syncPayload.deletes.push(oldName);
          } else {
            // Updated
            const currentM = meta[newName];
            const updates: Record<string, string|number|boolean> = {};
            if (newName !== oldName) updates['아파트명'] = newName;
            if (currentM.dong !== initialM.dong) updates['동'] = currentM.dong;
            if (currentM.txKey !== initialM.txKey) updates['txKey'] = currentM.txKey || '';
            if (currentM.maxFloor !== initialM.maxFloor) updates['최고층'] = currentM.maxFloor || '';
            if (currentM.isPublicRental !== initialM.isPublicRental) updates['공공임대'] = currentM.isPublicRental ? 'Y' : 'N';

            if (Object.keys(updates).length > 0) {
              syncPayload.updates.push({ ticker: initialM.ticker, updates });
            }
          }
        }
      }

      // Detect pure Adds (no ticker)
      for (const [newName, currentM] of Object.entries(meta)) {
        if (!currentM.ticker) {
          syncPayload.adds.push({
            name: newName,
            dong: currentM.dong,
            txKey: currentM.txKey || ''
          });
        }
      }

      // 2. Send to Google Sheets API
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

      // 3. Keep Firestore caching for fast dashboard loading? Yes.
      const clean: Record<string, Record<string, unknown>> = {};
      for (const [name, m] of Object.entries(meta)) {
        const entry: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(m)) {
          if (v !== undefined && v !== null && v !== '') entry[k] = v;
        }
        if (entry.dong) clean[name] = entry;
      }
      await setDoc(doc(db, FIRESTORE_DOC), clean);

      // Re-sync initial state to current state
      setInitialMeta(JSON.parse(JSON.stringify(meta)));
      setDeletedApts(new Set());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error('Save failed:', e);
      alert('저장에 실패했습니다: ' + e.message);
    }
    setSaving(false);
  };

  const updateMeta = useCallback((aptName: string, patch: Partial<AptMeta>) => {
    setMeta(prev => ({
      ...prev,
      [aptName]: { ...(prev[aptName] || { dong: '' }), ...patch },
    }));
  }, []);

  const deleteApt = useCallback((aptName: string) => {
    if (!confirm(`"${aptName}" 아파트를 삭제하시겠습니까?`)) return;
    setDeletedApts(prev => { const next = new Set(prev); next.add(aptName); return next; });
    setMeta(prev => { const next = { ...prev }; delete next[aptName]; return next; });
  }, []);

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

  const renameApt = useCallback(async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) { setEditingName(null); return; }
    if (meta[trimmed]) { alert('이미 존재하는 아파트 이름입니다.'); return; }
    setMeta(prev => {
      const next = { ...prev };
      next[trimmed] = { ...next[oldName] };
      delete next[oldName];
      return next;
    });
    setEditingName(null);
    try {
      const q = query(collection(db, 'scoutingReports'), where('apartmentName', '==', oldName));
      const snap = await getDocs(q);
      const updates = snap.docs.map(d => updateDoc(d.ref, { apartmentName: trimmed }));
      if (updates.length > 0) await Promise.all(updates);
    } catch (e) {
      console.error('Failed to update scouting reports:', e);
    }
  }, [meta]);

  const addApartment = useCallback(() => {
    const name = newAptName.trim();
    if (!name) return alert('아파트 이름을 입력하세요.');
    if (meta[name]) return alert('이미 존재하는 아파트입니다.');
    setMeta(prev => ({
      ...prev,
      [name]: { dong: newAptDong, txKey: autoSuggest(name) || undefined },
    }));
    setNewAptName('');
    setShowAddForm(false);
  }, [newAptName, newAptDong, meta]);

  const toggleDong = useCallback((dong: string) => {
    setExpandedDongs(prev => {
      const next = new Set(prev); next.has(dong) ? next.delete(dong) : next.add(dong); return next;
    });
  }, []);

  const toggleApt = useCallback((apt: string) => {
    setExpandedApts(prev => {
      const next = new Set(prev); next.has(apt) ? next.delete(apt) : next.add(apt); return next;
    });
  }, []);

  // ── Computed Data ──
  const aptsByDong = useMemo(() => {
    const result: Record<string, { name: string; meta: AptMeta }[]> = {};
    for (const [name, m] of Object.entries(meta)) {
      const dong = m.dong || '미분류';
      if (!result[dong]) result[dong] = [];
      result[dong].push({ name, meta: m });
    }
    for (const dong of Object.keys(result)) {
      result[dong].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return result;
  }, [meta]);

  const allAptNames = useMemo(() => Object.keys(meta), [meta]);
  const reportedApts = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => set.add(r.apartmentName));
    return set;
  }, [reports]);

  const stats = useMemo(() => {
    let mapped = 0, unmapped = 0, publicR = 0, reported = 0;
    for (const name of allAptNames) {
      const m = meta[name];
      if (m?.isPublicRental) publicR++;
      if (m?.txKey && TX_SUMMARY[m.txKey as keyof typeof TX_SUMMARY]) mapped++;
      else unmapped++;
      if (reportedApts.has(name)) reported++;
    }
    return { total: allAptNames.length, mapped, unmapped, publicR, reported, totalReports: reports.length };
  }, [meta, allAptNames, reportedApts, reports]);

  const filteredDongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(aptsByDong)
      .map(([dong, apts]) => {
        let f = apts;
        if (q) f = f.filter(a => a.name.toLowerCase().includes(q) || dong.toLowerCase().includes(q));
        if (filter === 'unmatched') f = f.filter(a => !a.meta.txKey);
        if (filter === 'public') f = f.filter(a => a.meta.isPublicRental);
        if (filter === 'private') f = f.filter(a => !a.meta.isPublicRental);
        if (filter === 'reported') f = f.filter(a => reportedApts.has(a.name));
        return [dong, f] as const;
      })
      .filter(([, a]) => a.length > 0)
      .sort(([a], [b]) => a.localeCompare(b, 'ko'));
  }, [search, filter, aptsByDong, reportedApts]);

  if (!loaded) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-8 h-8 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">아파트 · 임장기 관리</h1>
          <p className="text-[#4e5968] text-[14px]">단지 기본정보 · 실거래 매핑 · 프리미엄 임장기 통합 관리</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-[#3182f6] bg-[#e8f3ff] hover:bg-[#3182f6] hover:text-white transition-all text-[13px]">
            <Plus size={16}/> 아파트 추가
          </button>
          <Link href="/admin/write-report"
            className="flex items-center gap-2 bg-[#3182f6] hover:bg-[#2b72d6] text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-sm text-[13px]">
            <PlusCircle size={16} /> 임장기 작성
          </Link>
        </div>
      </div>

      {/* Add Apartment Form */}
      {showAddForm && (
        <div className="bg-[#e8f3ff] rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-3 items-end animate-in slide-in-from-top duration-200">
          <div className="flex-1 min-w-0">
            <label className="text-[12px] font-bold text-[#3182f6] mb-1 block">아파트 이름</label>
            <input type="text" value={newAptName} onChange={e => setNewAptName(e.target.value)}
              placeholder="예: 동탄역 힐스테이트 2차"
              className="w-full px-3 py-2.5 border border-[#3182f6]/30 rounded-xl text-[14px] outline-none focus:border-[#3182f6] bg-white" />
          </div>
          <div className="shrink-0">
            <label className="text-[12px] font-bold text-[#3182f6] mb-1 block">동</label>
            <select value={newAptDong} onChange={e => setNewAptDong(e.target.value)}
              className="px-3 py-2.5 border border-[#3182f6]/30 rounded-xl text-[14px] bg-white outline-none focus:border-[#3182f6]">
              {dongNames.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={addApartment} className="px-4 py-2.5 bg-[#3182f6] text-white rounded-xl text-[13px] font-bold hover:bg-[#2b72d6] transition-colors">추가</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 bg-white text-[#8b95a1] rounded-xl text-[13px] font-bold hover:bg-[#f2f4f6] transition-colors">취소</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: '전체 단지', value: stats.total, color: '#3182f6', bg: '#e8f3ff', icon: Building, fk: 'all' as const },
          { label: '매핑 완료', value: stats.mapped, color: '#03c75a', bg: '#f0fdf4', icon: Check, fk: 'all' as const },
          { label: '미매핑', value: stats.unmapped, color: '#f04452', bg: '#ffebec', icon: AlertTriangle, fk: 'unmatched' as const },
          { label: '임장기', value: stats.totalReports, color: '#ff8a3d', bg: '#fff4e6', icon: FileText, fk: 'reported' as const },
          { label: '임장완료', value: stats.reported, color: '#ff6b2c', bg: '#fff4e6', icon: MapPin, fk: 'reported' as const },
          { label: '공공임대', value: stats.publicR, color: '#8b95a1', bg: '#f2f4f6', icon: Home, fk: 'public' as const },
        ].map(s => (
          <div key={s.label} onClick={() => setFilter(s.fk)}
            className={`bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:shadow-md transition-all ${
              filter === s.fk && s.fk !== 'all' ? 'border-[#3182f6] ring-2 ring-[#3182f6]/10' : 'border-[#e5e8eb]'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: s.bg, color: s.color }}><s.icon size={14}/></div>
              <span className="text-[11px] font-bold text-[#8b95a1]">{s.label}</span>
            </div>
            <div className="text-[26px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b95a1]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="아파트명 또는 동 이름으로 검색..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#e5e8eb] rounded-xl text-[14px] outline-none focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10 transition-all" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {([['all','전체'],['unmatched','미매핑'],['reported','임장완료'],['public','공공임대'],['private','일반분양']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                filter === key ? 'bg-[#191f28] text-white' : 'bg-white border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Apartment List by Dong */}
      <div className="flex flex-col gap-3">
        {filteredDongs.map(([dong, apts]) => {
          const isExpanded = expandedDongs.has(dong) || search.trim().length > 0 || filter !== 'all';
          const dongMapped = apts.filter(a => !!a.meta.txKey).length;
          const dongReported = apts.filter(a => reportedApts.has(a.name)).length;

          return (
            <div key={dong} className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
              <button onClick={() => toggleDong(dong)}
                className="w-full px-4 sm:px-6 py-4 flex items-center gap-3 hover:bg-[#f9fafb] transition-colors">
                {isExpanded ? <ChevronDown size={18} className="text-[#8b95a1] shrink-0"/> : <ChevronRight size={18} className="text-[#8b95a1] shrink-0"/>}
                <h3 className="text-[15px] font-extrabold text-[#191f28]">{dong}</h3>
                <span className="text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-full">{apts.length}개</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  dongMapped === apts.length ? 'bg-[#f0fdf4] text-[#03c75a]' : dongMapped > 0 ? 'bg-[#fff4e6] text-[#ff8a3d]' : 'bg-[#f2f4f6] text-[#8b95a1]'
                }`}>TX {dongMapped}/{apts.length}</span>
                {dongReported > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fff4e6] text-[#ff8a3d]">📝 {dongReported}</span>}
              </button>

              {isExpanded && (
                <div className="border-t border-[#e5e8eb] divide-y divide-[#f2f4f6]">
                  {apts.map(({ name, meta: m }) => {
                    const hasValidTx = m.txKey && TX_SUMMARY[m.txKey as keyof typeof TX_SUMMARY];
                    const suggested = !m.txKey ? autoSuggest(name) : null;
                    const aptReports = reportsByApt[name] || [];
                    const isAptExpanded = expandedApts.has(name);

                    return (
                      <div key={name} className={`${m.isPublicRental ? 'bg-[#f9fafb]' : !hasValidTx ? 'bg-[#fffbf5]' : ''}`}>
                        {/* Apartment Unit Header */}
                        <div className="px-4 sm:px-6 py-3 cursor-pointer hover:bg-[#f6f8fa] transition-colors"
                          onClick={() => toggleApt(name)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            {hasValidTx ? <Check size={14} className="text-[#03c75a] shrink-0"/> : <AlertTriangle size={14} className="text-[#f04452] shrink-0"/>}
                            
                            {editingName === name ? (
                              <input type="text" autoFocus value={editNameValue}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setEditNameValue(e.target.value)}
                                onBlur={() => renameApt(name, editNameValue)}
                                onKeyDown={e => { if (e.key === 'Enter') renameApt(name, editNameValue); if (e.key === 'Escape') setEditingName(null); }}
                                className="text-[13px] sm:text-[14px] font-bold text-[#191f28] px-2 py-0.5 border border-[#3182f6] rounded-lg outline-none bg-[#e8f3ff] min-w-[150px]" />
                            ) : (
                              <span className="text-[13px] sm:text-[14px] font-bold text-[#191f28] hover:underline decoration-dotted decoration-[#8b95a1] cursor-text"
                                onDoubleClick={e => { e.stopPropagation(); setEditingName(name); setEditNameValue(name); }}>{name}</span>
                            )}

                            {m.isPublicRental && <span className="text-[10px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-full">🏠 공공임대</span>}
                            {m.householdCount && <span className="text-[10px] text-[#8b95a1]">{m.householdCount}세대</span>}
                            {m.yearBuilt && <span className="text-[10px] text-[#8b95a1]">· {m.yearBuilt}년</span>}
                            
                            {/* Report badge */}
                            {aptReports.length > 0 && (
                              <span className="text-[10px] font-bold bg-[#fff4e6] text-[#ff8a3d] px-2 py-0.5 rounded-full flex items-center gap-1">
                                📝 임장기 {aptReports.length}건
                              </span>
                            )}

                            <span className="ml-auto text-[#8b95a1] shrink-0">
                              {isAptExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </span>
                          </div>
                        </div>

                        {/* Apartment Expanded Content */}
                        {isAptExpanded && (
                          <div className="px-4 sm:px-6 pb-4 space-y-3 border-t border-[#f2f4f6] bg-[#fafbfc]">
                            {/* Controls row — always visible */}
                              <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-3">
                                {/* Dong Selector */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <MapPin size={13} className="text-[#8b95a1]"/>
                                  <select value={m.dong} onChange={e => updateMeta(name, { dong: e.target.value })}
                                    className="px-2 py-1.5 border border-[#e5e8eb] rounded-lg text-[12px] font-bold outline-none focus:border-[#3182f6] bg-white text-[#191f28]">
                                    {dongNames.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                                {/* TX Key */}
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <Link2 size={13} className="text-[#8b95a1] shrink-0"/>
                                  <input type="text" value={m.txKey || ''} onChange={e => updateMeta(name, { txKey: e.target.value })}
                                    placeholder="TX 키" list={`tx-${name}`}
                                    className={`flex-1 min-w-0 px-2.5 py-1.5 border rounded-lg text-[12px] font-mono outline-none transition-all focus:border-[#3182f6] ${
                                      hasValidTx ? 'border-[#03c75a] bg-[#f0fdf4]' : m.txKey ? 'border-[#f04452] bg-[#ffebec]' : 'border-[#e5e8eb]'
                                    }`} />
                                  <datalist id={`tx-${name}`}>{txKeys.slice(0,30).map(k => <option key={k} value={k}/>)}</datalist>
                                  {suggested && !m.txKey && (
                                    <button onClick={() => updateMeta(name, { txKey: suggested })}
                                      className="shrink-0 px-2 py-1 bg-[#e8f3ff] text-[#3182f6] rounded text-[10px] font-bold hover:bg-[#3182f6] hover:text-white transition-colors">자동</button>
                                  )}
                                </div>
                                {/* Max Floor */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Building size={13} className="text-[#8b95a1]"/>
                                  <input type="number" min={0} max={99} value={m.maxFloor || ''}
                                    onChange={e => updateMeta(name, { maxFloor: parseInt(e.target.value) || 0 })}
                                    placeholder="—" className={`w-[56px] text-center px-2 py-1.5 border rounded-lg text-[12px] font-bold outline-none transition-all focus:border-[#3182f6] ${
                                      (m.maxFloor || 0) > 0 ? 'border-[#03c75a] bg-[#f0fdf4] text-[#03c75a]' : 'border-[#e5e8eb]'
                                    }`} />
                                  <span className="text-[11px] text-[#8b95a1]">층</span>
                                </div>
                                {/* Public Rental Toggle */}
                                <button onClick={() => updateMeta(name, { isPublicRental: !m.isPublicRental })}
                                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                    m.isPublicRental ? 'bg-[#191f28] text-white' : 'bg-white border border-[#e5e8eb] text-[#8b95a1] hover:bg-[#f2f4f6]'
                                  }`}>
                                  <Home size={12}/> 공공임대
                                </button>
                                {/* Rename + Delete */}
                                <button onClick={(e) => { e.stopPropagation(); setEditingName(name); setEditNameValue(name); }}
                                  className="shrink-0 p-1.5 text-[#8b95a1] hover:text-[#3182f6] transition-colors" title="이름 수정">
                                  <Edit size={14}/>
                                </button>
                                <button onClick={() => deleteApt(name)}
                                  className="shrink-0 p-1.5 text-[#8b95a1] hover:text-[#f04452] transition-colors" title="삭제">
                                  <Trash2 size={14}/>
                                </button>
                              </div>

                            {/* Scouting Reports for this apartment */}
                            {aptReports.length > 0 ? (
                              <div className="space-y-2 pt-2">
                                <p className="text-[11px] font-bold text-[#8b95a1] uppercase tracking-wider">임장기</p>
                                {aptReports.map(report => (
                                  <div key={report.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e5e8eb] hover:shadow-sm transition-all">
                                    {(report.thumbnailUrl || report.images?.[0]?.url) && (
                                      <img src={report.thumbnailUrl || report.images?.[0]?.url || ''} alt=""
                                        className="report-thumb-wrap" />
                                    )}
                                    {!(report.thumbnailUrl || report.images?.[0]?.url) && (
                                      <div className="report-thumb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d6db' }}>
                                        <FileText size={18}/>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      {report.premiumScores && (
                                        <p className="text-[12px] text-[#3182f6] font-semibold flex items-center gap-1">
                                          프리미엄 지수: <span className="text-[14px] font-bold">{report.premiumScores.totalPremiumScore}</span>점
                                        </p>
                                      )}
                                      <div className="text-[11px] text-[#8b95a1] flex items-center gap-2">
                                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                        <span>·</span>
                                        <span>지표 {Object.keys(report.metrics).length}개</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Link href={`/admin/edit-report/${report.id}`}
                                        className="px-2.5 py-1.5 bg-white border border-[#e5e8eb] hover:bg-[#f2f4f6] text-[#8b95a1] hover:text-[#191f28] rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1">
                                        <Edit size={12}/> 수정
                                      </Link>
                                      <button onClick={() => handleDeleteReport(report.id!, report.apartmentName)}
                                        className="px-2.5 py-1.5 bg-white border border-[#e5e8eb] hover:bg-[#ffebec] hover:border-[#ffebec] hover:text-[#f04452] text-[#8b95a1] rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1">
                                        <Trash2 size={12}/> 삭제
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="pt-2">
                                <div className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl border border-dashed border-[#e5e8eb]">
                                  <span className="text-[12px] text-[#8b95a1]">아직 작성된 임장기가 없습니다</span>
                                  <Link href={`/admin/write-report?apt=${encodeURIComponent(name)}&dong=${encodeURIComponent(m.dong)}`}
                                    className="text-[11px] font-bold text-[#3182f6] hover:underline flex items-center gap-1">
                                    <PlusCircle size={12}/> 임장기 작성
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Orphaned TX Keys */}
      <div className="mt-8 bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-[#f9fafb] border-b border-[#e5e8eb]">
          <h3 className="font-bold text-[14px] text-[#191f28]">매핑되지 않은 TX 키</h3>
          <p className="text-[11px] text-[#8b95a1]">실거래 데이터에 있지만 아파트 목록에 연결 안 된 키</p>
        </div>
        <div className="px-4 sm:px-6 py-4 flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
          {(() => {
            const used = new Set(Object.values(meta).map(m => m.txKey).filter(Boolean));
            return txKeys.filter(k => !used.has(k)).map(k => (
              <span key={k} className="bg-[#f2f4f6] text-[#4e5968] text-[11px] font-mono px-2.5 py-1 rounded-lg">{k}</span>
              ));
            })()}
          </div>
        </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 md:left-[240px] right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-[#e5e8eb] px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <span className="text-[13px] text-[#8b95a1] font-medium">{stats.total}개 단지 · {stats.mapped} 매핑 · 📝 {stats.totalReports} 임장기</span>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-[14px] ${
            saved ? 'bg-[#03c75a] text-white shadow-lg shadow-[#03c75a]/20' : 'bg-[#3182f6] hover:bg-[#2b72d6] text-white shadow-lg shadow-[#3182f6]/20'
          } disabled:opacity-60`}>
          <Save size={16}/>
          {saving ? '저장 중...' : saved ? '저장 완료!' : '저장하기'}
        </button>
      </div>

      {/* Bottom padding for floating bar */}
      <div className="h-20" />
    </div>
  );
}
