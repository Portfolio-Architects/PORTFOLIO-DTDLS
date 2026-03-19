'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building, Save, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { APARTMENTS_BY_DONG } from '@/lib/apartment-data';

const FIRESTORE_DOC = 'settings/apartmentFloors';

interface FloorData {
  [aptName: string]: number; // 아파트명 → 최고 층수
}

export default function FloorSettingsPage() {
  const [floorData, setFloorData] = useState<FloorData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedDongs, setExpandedDongs] = useState<Set<string>>(new Set());

  // Firestore에서 기존 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, FIRESTORE_DOC));
        if (snap.exists()) {
          setFloorData(snap.data() as FloorData);
        }
      } catch (e) {
        console.error('Failed to load floor data:', e);
      }
    })();
  }, []);

  // 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, FIRESTORE_DOC), floorData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save:', e);
      alert('저장에 실패했습니다.');
    }
    setSaving(false);
  };

  const handleFloorChange = (aptName: string, value: string) => {
    const num = parseInt(value) || 0;
    setFloorData(prev => ({ ...prev, [aptName]: num }));
  };

  const toggleDong = (dong: string) => {
    setExpandedDongs(prev => {
      const next = new Set(prev);
      if (next.has(dong)) next.delete(dong);
      else next.add(dong);
      return next;
    });
  };

  // 검색 필터
  const filteredDongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return Object.entries(APARTMENTS_BY_DONG);
    return Object.entries(APARTMENTS_BY_DONG)
      .map(([dong, apts]) => [dong, apts.filter(a => a.name.toLowerCase().includes(q) || dong.toLowerCase().includes(q))] as const)
      .filter(([, apts]) => apts.length > 0);
  }, [search]);

  // 입력 완료 통계
  const totalApts = Object.values(APARTMENTS_BY_DONG).flat().length;
  const filledCount = Object.values(floorData).filter(v => v > 0).length;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">
            아파트 최고 층수 관리
          </h1>
          <p className="text-[#4e5968] text-[15px]">
            산점도 차트의 저층/중층/고층 분류에 사용됩니다
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm ${
            saved
              ? 'bg-[#03c75a] text-white'
              : 'bg-[#3182f6] hover:bg-[#2b72d6] text-white'
          } disabled:opacity-60`}
        >
          <Save size={18} />
          {saving ? '저장 중...' : saved ? '저장 완료!' : '저장하기'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-[#8b95a1]">
            <div className="p-2 bg-[#e8f3ff] rounded-lg text-[#3182f6]"><Building size={20}/></div>
            <h3 className="font-bold text-[14px]">전체 아파트</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#191f28]">
            {totalApts}<span className="text-[18px] text-[#8b95a1] ml-1 font-semibold">개</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-[#8b95a1]">
            <div className="p-2 bg-[#f0fdf4] rounded-lg text-[#03c75a]"><Building size={20}/></div>
            <h3 className="font-bold text-[14px]">입력 완료</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#03c75a]">
            {filledCount}<span className="text-[18px] text-[#8b95a1] ml-1 font-semibold">개</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-[#8b95a1]">
            <div className="p-2 bg-[#fff4e6] rounded-lg text-[#ff8a3d]"><Building size={20}/></div>
            <h3 className="font-bold text-[14px]">미입력</h3>
          </div>
          <div className="text-[32px] font-extrabold text-[#ff8a3d]">
            {totalApts - filledCount}<span className="text-[18px] text-[#8b95a1] ml-1 font-semibold">개</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b95a1]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="아파트 이름 또는 동 이름으로 검색..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#e5e8eb] rounded-xl text-[14px] outline-none focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10 transition-all"
        />
      </div>

      {/* Apartment List by Dong */}
      <div className="flex flex-col gap-3">
        {filteredDongs.map(([dong, apts]) => {
          const isExpanded = expandedDongs.has(dong) || search.trim().length > 0;
          const dongFilled = apts.filter(a => (floorData[a.name] || 0) > 0).length;

          return (
            <div key={dong} className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
              <button
                onClick={() => toggleDong(dong)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f9fafb] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={18} className="text-[#8b95a1]" /> : <ChevronRight size={18} className="text-[#8b95a1]" />}
                  <h3 className="text-[16px] font-extrabold text-[#191f28]">{dong}</h3>
                  <span className="text-[12px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-full">
                    {apts.length}개
                  </span>
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                    dongFilled === apts.length
                      ? 'bg-[#f0fdf4] text-[#03c75a]'
                      : dongFilled > 0
                        ? 'bg-[#fff4e6] text-[#ff8a3d]'
                        : 'bg-[#f2f4f6] text-[#8b95a1]'
                  }`}>
                    {dongFilled}/{apts.length} 입력
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#e5e8eb] divide-y divide-[#f2f4f6]">
                  {apts.map(apt => (
                    <div key={apt.name} className="px-6 py-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-[14px] font-bold text-[#191f28] truncate block">{apt.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8b95a1]">
                          {apt.householdCount && <span>{apt.householdCount.toLocaleString()}세대</span>}
                          {apt.yearBuilt && <span>· {apt.yearBuilt}년</span>}
                          {apt.brand && <span>· {apt.brand}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={floorData[apt.name] || ''}
                          onChange={e => handleFloorChange(apt.name, e.target.value)}
                          placeholder="—"
                          className={`w-[72px] text-center px-3 py-2 border rounded-lg text-[14px] font-bold outline-none transition-all focus:border-[#3182f6] focus:ring-4 focus:ring-[#3182f6]/10 ${
                            (floorData[apt.name] || 0) > 0
                              ? 'border-[#03c75a] bg-[#f0fdf4] text-[#03c75a]'
                              : 'border-[#e5e8eb] bg-white text-[#191f28]'
                          }`}
                        />
                        <span className="text-[12px] text-[#8b95a1] font-bold">층</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
