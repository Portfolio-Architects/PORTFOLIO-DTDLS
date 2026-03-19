'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link2, Save, Search, Check, X, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { APARTMENTS_BY_DONG } from '@/lib/apartment-data';
import { TX_SUMMARY } from '@/lib/transaction-summary';

const FIRESTORE_DOC = 'settings/nameMapping';

// Current matching logic (mirrored from apartmentMapping.ts for auto-suggest)
function normalizeAptName(name: string): string {
  return name.replace(/\[.*?\]\s*/g, '').replace(/\s+/g, '').replace(/[()（）]/g, '').trim();
}
const LOCATION_PREFIXES = [
  '숲속마을동탄', '푸른마을동탄', '나루마을동탄',
  '동탄역시범', '동탄시범다은마을', '동탄시범한빛마을', '동탄시범나루마을',
  '시범다은마을', '시범한빛마을', '시범나루마을', '시범',
  '반탄솔빛마을', '솔빛마을', '예당마을', '새강마을',
  '동탄2신도시', '동탄신도시', '동탄숲속마을', '동탄푸른마을', '동탄나루마을',
  '동탄호수공원역', '동탄호수공원', '동탄호수', '동탄역',
  '화성동탄2', '능동역', '호수공원역',
  '동탄2', '동탄',
];
function stripPrefix(norm: string) {
  for (const p of LOCATION_PREFIXES) {
    if (norm.startsWith(p) && norm.length > p.length) return norm.slice(p.length);
  }
  return norm;
}

function autoSuggest(aptName: string): string | null {
  const norm = normalizeAptName(aptName);
  const txKeys = Object.keys(TX_SUMMARY);
  if (txKeys.includes(norm)) return norm;
  const stripped = stripPrefix(norm);
  if (stripped !== norm && txKeys.includes(stripped)) return stripped;
  for (const key of txKeys) { if (stripPrefix(key) === stripped) return key; }
  return null;
}

interface MappingData {
  [aptName: string]: string; // 아파트명 → TX_SUMMARY 키
}

export default function NameMappingPage() {
  const [mapping, setMapping] = useState<MappingData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unmatched' | 'matched'>('all');
  const [expandedDongs, setExpandedDongs] = useState<Set<string>>(new Set());
  const [txSearch, setTxSearch] = useState<Record<string, string>>({}); // per-apt TX key search

  const txKeys = useMemo(() => Object.keys(TX_SUMMARY).sort(), []);
  const allApts = useMemo(() => Object.values(APARTMENTS_BY_DONG).flat(), []);

  // Load from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, FIRESTORE_DOC));
        if (snap.exists()) {
          setMapping(snap.data() as MappingData);
        } else {
          // Auto-suggest initial mappings
          const initial: MappingData = {};
          for (const apt of allApts) {
            const suggested = autoSuggest(apt.name);
            if (suggested) initial[apt.name] = suggested;
          }
          setMapping(initial);
        }
      } catch (e) {
        console.error('Failed to load mapping:', e);
      }
    })();
  }, [allApts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, FIRESTORE_DOC), mapping);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save:', e);
      alert('저장에 실패했습니다.');
    }
    setSaving(false);
  };

  const setMappingForApt = (aptName: string, txKey: string) => {
    setMapping(prev => {
      if (!txKey) {
        const next = { ...prev };
        delete next[aptName];
        return next;
      }
      return { ...prev, [aptName]: txKey };
    });
  };

  const toggleDong = (dong: string) => {
    setExpandedDongs(prev => {
      const next = new Set(prev);
      if (next.has(dong)) next.delete(dong); else next.add(dong);
      return next;
    });
  };

  // Stats
  const matchedCount = allApts.filter(a => mapping[a.name] && TX_SUMMARY[mapping[a.name] as keyof typeof TX_SUMMARY]).length;
  const unmatchedCount = allApts.length - matchedCount;

  // Filter and search
  const filteredDongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(APARTMENTS_BY_DONG)
      .map(([dong, apts]) => {
        let filtered = apts;
        if (q) filtered = filtered.filter(a => a.name.toLowerCase().includes(q) || dong.toLowerCase().includes(q));
        if (filter === 'unmatched') filtered = filtered.filter(a => !mapping[a.name]);
        if (filter === 'matched') filtered = filtered.filter(a => !!mapping[a.name]);
        return [dong, filtered] as const;
      })
      .filter(([, apts]) => apts.length > 0);
  }, [search, filter, mapping]);

  // Get filtered TX keys for dropdown search
  const getFilteredTxKeys = (aptName: string) => {
    const q = (txSearch[aptName] || '').toLowerCase();
    if (!q) return txKeys.slice(0, 30);
    return txKeys.filter(k => k.toLowerCase().includes(q)).slice(0, 30);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">
            아파트 이름 매핑
          </h1>
          <p className="text-[#4e5968] text-[15px]">
            정적 아파트 목록 ↔ 실거래 데이터 키를 수동으로 연결합니다
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm ${
            saved ? 'bg-[#03c75a] text-white' : 'bg-[#3182f6] hover:bg-[#2b72d6] text-white'
          } disabled:opacity-60`}
        >
          <Save size={18} />
          {saving ? '저장 중...' : saved ? '저장 완료!' : '저장하기'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#e8f3ff] rounded-lg text-[#3182f6]"><Link2 size={20}/></div>
            <h3 className="font-bold text-[14px] text-[#8b95a1]">전체 아파트</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#191f28]">
            {allApts.length}<span className="text-[18px] text-[#8b95a1] ml-1">개</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm cursor-pointer hover:border-[#03c75a] transition-colors" onClick={() => setFilter(filter === 'matched' ? 'all' : 'matched')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#f0fdf4] rounded-lg text-[#03c75a]"><Check size={20}/></div>
            <h3 className="font-bold text-[14px] text-[#8b95a1]">매핑 완료</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#03c75a]">
            {matchedCount}<span className="text-[18px] text-[#8b95a1] ml-1">개</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm cursor-pointer hover:border-[#f04452] transition-colors" onClick={() => setFilter(filter === 'unmatched' ? 'all' : 'unmatched')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#ffebec] rounded-lg text-[#f04452]"><AlertTriangle size={20}/></div>
            <h3 className="font-bold text-[14px] text-[#8b95a1]">미매핑</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#f04452]">
            {unmatchedCount}<span className="text-[18px] text-[#8b95a1] ml-1">개</span>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b95a1]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="아파트명 또는 동 이름으로 검색..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#e5e8eb] rounded-xl text-[14px] outline-none focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10 transition-all"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all', 'unmatched', 'matched'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                filter === f 
                  ? 'bg-[#191f28] text-white' 
                  : 'bg-white border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'
              }`}
            >
              {f === 'all' ? '전체' : f === 'unmatched' ? '미매핑만' : '매핑됨만'}
            </button>
          ))}
        </div>
      </div>

      {/* Mapping Table by Dong */}
      <div className="flex flex-col gap-3">
        {filteredDongs.map(([dong, apts]) => {
          const isExpanded = expandedDongs.has(dong) || search.trim().length > 0 || filter !== 'all';
          const dongMatched = apts.filter(a => !!mapping[a.name]).length;

          return (
            <div key={dong} className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
              <button
                onClick={() => toggleDong(dong)}
                className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-[#f9fafb] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={18} className="text-[#8b95a1]" /> : <ChevronRight size={18} className="text-[#8b95a1]" />}
                  <h3 className="text-[16px] font-extrabold text-[#191f28]">{dong}</h3>
                  <span className="text-[12px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-full">{apts.length}개</span>
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                    dongMatched === apts.length ? 'bg-[#f0fdf4] text-[#03c75a]'
                    : dongMatched > 0 ? 'bg-[#fff4e6] text-[#ff8a3d]'
                    : 'bg-[#ffebec] text-[#f04452]'
                  }`}>
                    {dongMatched}/{apts.length}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#e5e8eb] divide-y divide-[#f2f4f6]">
                  {apts.map(apt => {
                    const currentKey = mapping[apt.name];
                    const isValid = currentKey && TX_SUMMARY[currentKey as keyof typeof TX_SUMMARY];
                    const suggested = autoSuggest(apt.name);

                    return (
                      <div key={apt.name} className={`px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-2 ${!currentKey ? 'bg-[#fffbf5]' : ''}`}>
                        {/* Left: apartment name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isValid ? (
                              <Check size={16} className="text-[#03c75a] shrink-0" />
                            ) : (
                              <AlertTriangle size={16} className="text-[#f04452] shrink-0" />
                            )}
                            <span className="text-[14px] font-bold text-[#191f28] truncate">{apt.name}</span>
                          </div>
                          <span className="text-[11px] text-[#8b95a1] ml-6">
                            norm: {normalizeAptName(apt.name)}
                          </span>
                        </div>

                        {/* Right: TX key selector */}
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[300px] md:min-w-[400px]">
                          <span className="text-[12px] text-[#8b95a1]">→</span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={currentKey || ''}
                              onChange={e => {
                                setMappingForApt(apt.name, e.target.value);
                                setTxSearch(prev => ({ ...prev, [apt.name]: e.target.value }));
                              }}
                              onFocus={() => setTxSearch(prev => ({ ...prev, [apt.name]: currentKey || '' }))}
                              placeholder="TX 키를 입력하거나 선택..."
                              className={`w-full px-3 py-2 border rounded-lg text-[13px] font-mono outline-none transition-all focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10 ${
                                isValid ? 'border-[#03c75a] bg-[#f0fdf4]'
                                : currentKey ? 'border-[#f04452] bg-[#ffebec]'
                                : 'border-[#e5e8eb] bg-white'
                              }`}
                              list={`txkeys-${apt.name}`}
                            />
                            <datalist id={`txkeys-${apt.name}`}>
                              {getFilteredTxKeys(apt.name).map(k => (
                                <option key={k} value={k} />
                              ))}
                            </datalist>
                          </div>

                          {/* Auto-suggest button */}
                          {suggested && !currentKey && (
                            <button
                              onClick={() => setMappingForApt(apt.name, suggested)}
                              className="shrink-0 px-2.5 py-1.5 bg-[#e8f3ff] text-[#3182f6] rounded-lg text-[11px] font-bold hover:bg-[#3182f6] hover:text-white transition-colors"
                              title={`자동 추천: ${suggested}`}
                            >
                              자동
                            </button>
                          )}

                          {/* Clear button */}
                          {currentKey && (
                            <button
                              onClick={() => setMappingForApt(apt.name, '')}
                              className="shrink-0 p-1.5 text-[#8b95a1] hover:text-[#f04452] transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
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

      {/* Orphaned TX keys */}
      <div className="mt-10 bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#f9fafb] border-b border-[#e5e8eb]">
          <h3 className="font-bold text-[#191f28]">매핑되지 않은 TX 키</h3>
          <p className="text-[12px] text-[#8b95a1]">실거래 데이터에는 있지만 아파트 목록에 연결되지 않은 키</p>
        </div>
        <div className="px-6 py-4 flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
          {(() => {
            const usedKeys = new Set(Object.values(mapping));
            return txKeys
              .filter(k => !usedKeys.has(k))
              .map(k => (
                <span key={k} className="bg-[#f2f4f6] text-[#4e5968] text-[12px] font-mono px-3 py-1.5 rounded-lg">
                  {k}
                </span>
              ));
          })()}
        </div>
      </div>
    </div>
  );
}
