'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building, Save, Search, Check, X, AlertTriangle, ChevronDown, ChevronRight, Home, Link2, FileText } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { APARTMENTS_BY_DONG } from '@/lib/apartment-data';
import { TX_SUMMARY } from '@/lib/transaction-summary';

const FIRESTORE_DOC = 'settings/apartmentMeta';

// Matching logic for auto-suggest
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

interface AptMeta {
  txKey?: string;
  maxFloor?: number;
  isPublicRental?: boolean;
}
type MetaMap = Record<string, AptMeta>;

export default function ApartmentManagementPage() {
  const [meta, setMeta] = useState<MetaMap>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'unmatched'|'public'|'private'|'reported'>('all');
  const [expandedDongs, setExpandedDongs] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [reportedApts, setReportedApts] = useState<Set<string>>(new Set());
  const [reportMetrics, setReportMetrics] = useState<Record<string, { far?: number; bcr?: number; parking?: number; yearBuilt?: number; households?: number; subway?: number }>>({});

  const txKeys = useMemo(() => Object.keys(TX_SUMMARY).sort(), []);
  const allApts = useMemo(() => Object.values(APARTMENTS_BY_DONG).flat(), []);

  // Load scouting reports to know which apts have field reports
  useEffect(() => {
    const q = query(collection(db, 'scoutingReports'));
    const unsub = onSnapshot(q, snap => {
      const names = new Set<string>();
      const metrics: Record<string, { far?: number; bcr?: number; parking?: number; yearBuilt?: number; households?: number; subway?: number }> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.apartmentName) {
          names.add(data.apartmentName);
          const m = data.metrics;
          if (m) {
            metrics[data.apartmentName] = {
              far: m.far || undefined,
              bcr: m.bcr || undefined,
              parking: m.parkingPerHousehold || undefined,
              yearBuilt: m.yearBuilt || undefined,
              households: m.householdCount || undefined,
              subway: m.distanceToSubway || undefined,
            };
          }
        }
      });
      setReportedApts(names);
      setReportMetrics(metrics);
    });
    return () => unsub();
  }, []);

  // Load + migrate from old schemas
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, FIRESTORE_DOC));
        if (snap.exists()) {
          setMeta(snap.data() as MetaMap);
          setLoaded(true);
          return;
        }
        // Migrate from old separate docs
        const initial: MetaMap = {};
        const [mappingSnap, floorSnap] = await Promise.all([
          getDoc(doc(db, 'settings/nameMapping')),
          getDoc(doc(db, 'settings/apartmentFloors')),
        ]);
        const oldMapping = mappingSnap.exists() ? mappingSnap.data() as Record<string,string> : {};
        const oldFloors = floorSnap.exists() ? floorSnap.data() as Record<string,number> : {};

        for (const apt of allApts) {
          const m: AptMeta = {};
          if (oldMapping[apt.name]) m.txKey = oldMapping[apt.name];
          else {
            const suggested = autoSuggest(apt.name);
            if (suggested) m.txKey = suggested;
          }
          if (oldFloors[apt.name]) m.maxFloor = oldFloors[apt.name];
          initial[apt.name] = m;
        }
        setMeta(initial);
        setLoaded(true);
      } catch (e) {
        console.error('Failed to load:', e);
        setLoaded(true);
      }
    })();
  }, [allApts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, FIRESTORE_DOC), meta);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      alert('저장에 실패했습니다.');
    }
    setSaving(false);
  };

  const updateMeta = (aptName: string, patch: Partial<AptMeta>) => {
    setMeta(prev => ({
      ...prev,
      [aptName]: { ...(prev[aptName] || {}), ...patch },
    }));
  };

  const toggleDong = (dong: string) => {
    setExpandedDongs(prev => {
      const next = new Set(prev); next.has(dong) ? next.delete(dong) : next.add(dong); return next;
    });
  };

  // Stats
  const stats = useMemo(() => {
    let mapped = 0, unmapped = 0, publicR = 0, reported = 0;
    for (const apt of allApts) {
      const m = meta[apt.name];
      if (m?.isPublicRental) publicR++;
      if (m?.txKey && TX_SUMMARY[m.txKey as keyof typeof TX_SUMMARY]) mapped++;
      else unmapped++;
      if (reportedApts.has(apt.name)) reported++;
    }
    return { total: allApts.length, mapped, unmapped, publicR, reported };
  }, [meta, allApts, reportedApts]);

  // Filter + search
  const filteredDongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(APARTMENTS_BY_DONG)
      .map(([dong, apts]) => {
        let f = apts;
        if (q) f = f.filter(a => a.name.toLowerCase().includes(q) || dong.toLowerCase().includes(q));
        if (filter === 'unmatched') f = f.filter(a => !meta[a.name]?.txKey);
        if (filter === 'public') f = f.filter(a => meta[a.name]?.isPublicRental);
        if (filter === 'private') f = f.filter(a => !meta[a.name]?.isPublicRental);
        if (filter === 'reported') f = f.filter(a => reportedApts.has(a.name));
        return [dong, f] as const;
      })
      .filter(([, a]) => a.length > 0);
  }, [search, filter, meta]);

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
          <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">아파트 관리</h1>
          <p className="text-[#4e5968] text-[14px]">실거래 매핑 · 최고층 · 공공임대 구분</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm shrink-0 ${
            saved ? 'bg-[#03c75a] text-white' : 'bg-[#3182f6] hover:bg-[#2b72d6] text-white'
          } disabled:opacity-60`}>
          <Save size={18} />
          {saving ? '저장 중...' : saved ? '저장 완료!' : '저장하기'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: '전체', value: stats.total, color: '#3182f6', bg: '#e8f3ff', icon: Building, filterKey: 'all' as const },
          { label: '매핑 완료', value: stats.mapped, color: '#03c75a', bg: '#f0fdf4', icon: Check, filterKey: 'all' as const },
          { label: '미매핑', value: stats.unmapped, color: '#f04452', bg: '#ffebec', icon: AlertTriangle, filterKey: 'unmatched' as const },
          { label: '임장완료', value: stats.reported, color: '#ff8a3d', bg: '#fff4e6', icon: FileText, filterKey: 'reported' as const },
          { label: '공공임대', value: stats.publicR, color: '#8b95a1', bg: '#f2f4f6', icon: Home, filterKey: 'public' as const },
        ].map(s => (
          <div key={s.label} onClick={() => setFilter(s.filterKey)}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e5e8eb] shadow-sm cursor-pointer hover:border-[${s.color}] transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: s.bg, color: s.color }}><s.icon size={16}/></div>
              <span className="text-[12px] font-bold text-[#8b95a1]">{s.label}</span>
            </div>
            <div className="text-[28px] sm:text-[32px] font-extrabold" style={{ color: s.color }}>
              {s.value}
            </div>
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
          const dongMapped = apts.filter(a => !!meta[a.name]?.txKey).length;
          const dongPublic = apts.filter(a => !!meta[a.name]?.isPublicRental).length;

          return (
            <div key={dong} className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
              <button onClick={() => toggleDong(dong)}
                className="w-full px-4 sm:px-6 py-4 flex items-center gap-3 hover:bg-[#f9fafb] transition-colors">
                {isExpanded ? <ChevronDown size={18} className="text-[#8b95a1] shrink-0"/> : <ChevronRight size={18} className="text-[#8b95a1] shrink-0"/>}
                <h3 className="text-[15px] font-extrabold text-[#191f28]">{dong}</h3>
                <span className="text-[11px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-full">{apts.length}개</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  dongMapped === apts.length ? 'bg-[#f0fdf4] text-[#03c75a]' : dongMapped > 0 ? 'bg-[#fff4e6] text-[#ff8a3d]' : 'bg-[#f2f4f6] text-[#8b95a1]'
                }`}>{dongMapped}/{apts.length}</span>
                {dongPublic > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f2f4f6] text-[#8b95a1]">🏠 {dongPublic}</span>}
              </button>

              {isExpanded && (
                <div className="border-t border-[#e5e8eb] divide-y divide-[#f2f4f6]">
                  {apts.map(apt => {
                    const m = meta[apt.name] || {};
                    const hasValidTx = m.txKey && TX_SUMMARY[m.txKey as keyof typeof TX_SUMMARY];
                    const suggested = !m.txKey ? autoSuggest(apt.name) : null;

                    return (
                      <div key={apt.name} className={`px-4 sm:px-6 py-3 space-y-2 ${m.isPublicRental ? 'bg-[#f9fafb]' : !hasValidTx ? 'bg-[#fffbf5]' : ''}`}>
                        {/* Row 1: Name + badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {hasValidTx ? <Check size={14} className="text-[#03c75a] shrink-0"/> : <AlertTriangle size={14} className="text-[#f04452] shrink-0"/>}
                          <span className="text-[13px] sm:text-[14px] font-bold text-[#191f28]">{apt.name}</span>
                          {m.isPublicRental && <span className="text-[10px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-full">🏠 공공임대</span>}
                          {reportedApts.has(apt.name) && <span className="text-[10px] font-bold bg-[#fff4e6] text-[#ff8a3d] px-2 py-0.5 rounded-full">📝 임장완료</span>}
                          {apt.householdCount && <span className="text-[10px] text-[#8b95a1]">{apt.householdCount}세대</span>}
                        </div>

                        {/* Row 1.5: Scouting report metrics */}
                        {reportMetrics[apt.name] && (() => {
                          const rm = reportMetrics[apt.name];
                          return (
                            <div className="flex items-center gap-2 flex-wrap ml-5 -mt-1">
                              {rm.yearBuilt && <span className="text-[10px] bg-[#f2f4f6] text-[#4e5968] px-1.5 py-0.5 rounded">{rm.yearBuilt}년</span>}
                              {rm.households && <span className="text-[10px] bg-[#f2f4f6] text-[#4e5968] px-1.5 py-0.5 rounded">{rm.households}세대</span>}
                              {rm.far && <span className="text-[10px] bg-[#f2f4f6] text-[#4e5968] px-1.5 py-0.5 rounded">용적률 {rm.far}%</span>}
                              {rm.bcr && <span className="text-[10px] bg-[#f2f4f6] text-[#4e5968] px-1.5 py-0.5 rounded">건폐율 {rm.bcr}%</span>}
                              {rm.parking && <span className="text-[10px] bg-[#f2f4f6] text-[#4e5968] px-1.5 py-0.5 rounded">주차 {rm.parking}대</span>}
                              {rm.subway && <span className="text-[10px] bg-[#f2f4f6] text-[#4e5968] px-1.5 py-0.5 rounded">역 {rm.subway}m</span>}
                            </div>
                          );
                        })()}

                        {/* Row 2: Controls */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          {/* TX Key */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <Link2 size={13} className="text-[#8b95a1] shrink-0"/>
                            <input type="text" value={m.txKey || ''} onChange={e => updateMeta(apt.name, { txKey: e.target.value })}
                              placeholder="TX 키" list={`tx-${apt.name}`}
                              className={`flex-1 min-w-0 px-2.5 py-1.5 border rounded-lg text-[12px] font-mono outline-none transition-all focus:border-[#3182f6] ${
                                hasValidTx ? 'border-[#03c75a] bg-[#f0fdf4]' : m.txKey ? 'border-[#f04452] bg-[#ffebec]' : 'border-[#e5e8eb]'
                              }`} />
                            <datalist id={`tx-${apt.name}`}>{txKeys.slice(0,30).map(k => <option key={k} value={k}/>)}</datalist>
                            {suggested && !m.txKey && (
                              <button onClick={() => updateMeta(apt.name, { txKey: suggested })}
                                className="shrink-0 px-2 py-1 bg-[#e8f3ff] text-[#3182f6] rounded text-[10px] font-bold hover:bg-[#3182f6] hover:text-white transition-colors">자동</button>
                            )}
                          </div>

                          {/* Max Floor */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Building size={13} className="text-[#8b95a1]"/>
                            <input type="number" min={0} max={99} value={m.maxFloor || ''}
                              onChange={e => updateMeta(apt.name, { maxFloor: parseInt(e.target.value) || 0 })}
                              placeholder="—" className={`w-[56px] text-center px-2 py-1.5 border rounded-lg text-[12px] font-bold outline-none transition-all focus:border-[#3182f6] ${
                                (m.maxFloor || 0) > 0 ? 'border-[#03c75a] bg-[#f0fdf4] text-[#03c75a]' : 'border-[#e5e8eb]'
                              }`} />
                            <span className="text-[11px] text-[#8b95a1]">층</span>
                          </div>

                          {/* Public Rental Toggle */}
                          <button onClick={() => updateMeta(apt.name, { isPublicRental: !m.isPublicRental })}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              m.isPublicRental
                                ? 'bg-[#191f28] text-white'
                                : 'bg-white border border-[#e5e8eb] text-[#8b95a1] hover:bg-[#f2f4f6]'
                            }`}>
                            <Home size={12}/>
                            공공임대
                          </button>
                        </div>
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
    </div>
  );
}
