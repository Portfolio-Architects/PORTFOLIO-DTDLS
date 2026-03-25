'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Heart, BarChart2, ExternalLink, CreditCard } from 'lucide-react';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

interface TrafficRow {
  name: string;
  dong: string;
  viewCount: number;
  likes: number;
}

export default function TrafficPage() {
  const [trafficData, setTrafficData] = useState<TrafficRow[]>([]);
  const [trafficSort, setTrafficSort] = useState<'viewCount' | 'likes'>('viewCount');
  const [selectedDong, setSelectedDong] = useState<string>('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch meta for apartment list
        const metaRes = await fetch('/api/dashboard-init');
        const metaData = await metaRes.json();
        const aptMeta = metaData.apartmentMeta || {};

        // Gather viewCount from scoutingReports
        const snap = await getDocs(collection(db, 'scoutingReports'));
        const viewMap: Record<string, number> = {};
        const likeMap: Record<string, number> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          const apt = data.apartmentName as string;
          if (!apt) return;
          viewMap[apt] = (viewMap[apt] || 0) + (data.viewCount || 0);
          likeMap[apt] = (likeMap[apt] || 0) + (data.likes || 0);
        });

        // Also check apartmentViews collection
        const aptViewSnap = await getDocs(collection(db, 'apartmentViews')).catch(() => null);
        if (aptViewSnap) {
          aptViewSnap.docs.forEach(d => {
            viewMap[d.id] = (viewMap[d.id] || 0) + (d.data().count || 0);
          });
        }

        // Merge with apartment list
        const rows = Object.keys(aptMeta).map(name => ({
          name,
          dong: (aptMeta[name] as any)?.dong || '',
          viewCount: viewMap[name] || 0,
          likes: likeMap[name] || 0,
        }));
        setTrafficData(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleReset = async () => {
    if (!confirm('경고: 정말 모든 단지의 조회수와 관심 기록을 0으로 초기화하시겠습니까?')) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Reset scoutingReports
      const snap = await getDocs(collection(db, 'scoutingReports'));
      snap.docs.forEach(d => {
        batch.update(d.ref, { viewCount: 0, likes: 0 });
      });

      // 2. Delete apartmentViews documents
      const aptViewSnap = await getDocs(collection(db, 'apartmentViews')).catch(() => null);
      if (aptViewSnap) {
        aptViewSnap.docs.forEach(d => batch.delete(d.ref));
      }

      await batch.commit();

      // Reset local state
      setTrafficData(prev => prev.map(r => ({ ...r, viewCount: 0, likes: 0 })));
      alert('모든 트래픽 데이터가 초기화되었습니다.');
    } catch (e: any) {
      console.error(e);
      alert('초기화 중 오류 발생: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const dongs = useMemo(() => Array.from(new Set(trafficData.map(r => r.dong))).filter(Boolean).sort(), [trafficData]);

  const sortedData = useMemo(() => {
    let base = trafficData;
    if (selectedDong !== '전체') {
      base = base.filter(r => r.dong === selectedDong);
    }
    return [...base].sort((a, b) => b[trafficSort] - a[trafficSort]);
  }, [trafficData, trafficSort, selectedDong]);

  const maxViews = Math.max(...sortedData.map(r => r.viewCount), 1);
  const maxLikes = Math.max(...sortedData.map(r => r.likes), 1);
  const totalViews = sortedData.reduce((s, r) => s + r.viewCount, 0);
  const totalLikes = sortedData.reduce((s, r) => s + r.likes, 0);

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">트래픽 분석</h1>
          <p className="text-[#4e5968] text-[14px]">임장 리포트 기반 조회수 · 관심 수 집계</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleReset} className="px-3 py-2 text-[12px] font-bold text-[#f04452] bg-[#ffebec] hover:bg-[#f04452] hover:text-white rounded-lg transition-colors shadow-sm">
            데이터 전체 초기화
          </button>
          <div className="flex gap-1.5 border-l border-[#e5e8eb] pl-4">
            {(['viewCount', 'likes'] as const).map(k => (
              <button key={k} onClick={() => setTrafficSort(k)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                  trafficSort === k ? 'bg-[#191f28] text-white shadow-sm' : 'bg-white border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'
                }`}>
                {k === 'viewCount' ? <><Eye size={14}/> 조회수</> : <><Heart size={14}/> 관심</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dong Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setSelectedDong('전체')} 
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${selectedDong === '전체' ? 'bg-[#3182f6] text-white shadow-sm' : 'bg-white border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'}`}>
          전체
        </button>
        {dongs.map(dong => (
          <button key={dong} onClick={() => setSelectedDong(dong)} 
            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${selectedDong === dong ? 'bg-[#3182f6] text-white shadow-sm' : 'bg-white border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'}`}>
            {dong}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#e8f3ff] text-[#3182f6]"><BarChart2 size={14}/></div>
            <span className="text-[11px] font-bold text-[#8b95a1]">선택 단지</span>
          </div>
          <div className="text-[26px] font-extrabold text-[#3182f6]">{sortedData.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#e8f3ff] text-[#3182f6]"><Eye size={14}/></div>
            <span className="text-[11px] font-bold text-[#8b95a1]">총 조회수</span>
          </div>
          <div className="text-[26px] font-extrabold text-[#3182f6]">{totalViews.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#ffebec] text-[#f04452]"><Heart size={14}/></div>
            <span className="text-[11px] font-bold text-[#8b95a1]">총 관심</span>
          </div>
          <div className="text-[26px] font-extrabold text-[#f04452]">{totalLikes.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e5e8eb] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#fff4e6] text-[#ff8a3d]"><Eye size={14}/></div>
            <span className="text-[11px] font-bold text-[#8b95a1]">활성 단지</span>
          </div>
          <div className="text-[26px] font-extrabold text-[#ff8a3d]">{sortedData.filter(r => r.viewCount > 0 || r.likes > 0).length}</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e8eb]">
              <tr className="text-[#8b95a1] text-xs font-bold">
                <th className="py-3 pl-4 text-left w-8">#</th>
                <th className="py-3 text-left">아파트명</th>
                <th className="py-3 text-left text-[#8b95a1]">동</th>
                <th className="py-3 pr-4 text-right text-[#3182f6]"><span className="flex items-center justify-end gap-1"><Eye size={12}/>조회수</span></th>
                <th className="py-3 pr-4 text-right text-[#f04452]"><span className="flex items-center justify-end gap-1"><Heart size={12}/>관심</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {sortedData.map((row, i) => (
                <tr key={row.name} className={`hover:bg-[#f9fafb] transition-colors ${i < 3 ? 'bg-[#fffbf5]' : ''}`}>
                  <td className="py-3 pl-4 text-center">
                    <span className={`text-xs font-extrabold ${i === 0 ? 'text-[#f59e0b]' : i === 1 ? 'text-[#8b95a1]' : i === 2 ? 'text-[#cd7c2f]' : 'text-[#d1d6db]'}`}>{i + 1}</span>
                  </td>
                  <td className="py-3 font-bold text-[#191f28] text-[13px]">{row.name}</td>
                  <td className="py-3 text-xs text-[#8b95a1]">{row.dong}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#3182f6] rounded-full" style={{ width: `${(row.viewCount / maxViews) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#3182f6] tabular-nums w-8 text-right">{row.viewCount}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#f04452] rounded-full" style={{ width: `${(row.likes / maxLikes) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#f04452] tabular-nums w-8 text-right">{row.likes}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trafficData.every(r => r.viewCount === 0 && r.likes === 0) && (
            <div className="py-12 text-center text-[#8b95a1] text-sm">임장 리포트가 있는 단지에서만 조회수가 집계됩니다.</div>
          )}
        </div>
      )}

      {/* ─── 비용 모니터링 ─── */}
      <div className="mt-10 bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8">
        <h2 className="text-[16px] font-bold text-[#191f28] mb-2 flex items-center gap-2">
          <CreditCard size={18} className="text-[#8b95a1]" />
          비용 모니터링
        </h2>
        <p className="text-[13px] text-[#8b95a1] mb-6">과금 서비스 콘솔 바로가기 · 무료 한도 초과 시 비용이 발생합니다.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Google Maps */}
          <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer"
            className="block p-5 rounded-xl border border-[#e5e8eb] hover:border-[#3182f6] hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#e8f3ff] rounded-xl flex items-center justify-center text-[18px]">🗺️</div>
              <div>
                <div className="text-[14px] font-bold text-[#191f28] group-hover:text-[#3182f6] transition-colors flex items-center gap-1">
                  Google Maps API <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-[#8b95a1]">Cloud Billing</div>
              </div>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-[#8b95a1]">무료 크레딧</span><span className="font-bold text-[#03c75a]">$200/월</span></div>
              <div className="flex justify-between"><span className="text-[#8b95a1]">Places API</span><span className="font-bold text-[#4e5968]">$17/1K건</span></div>
              <div className="flex justify-between"><span className="text-[#8b95a1]">Geocoding</span><span className="font-bold text-[#4e5968]">$5/1K건</span></div>
            </div>
          </a>

          {/* Firebase */}
          <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer"
            className="block p-5 rounded-xl border border-[#e5e8eb] hover:border-[#ff8a3d] hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#fff4e6] rounded-xl flex items-center justify-center text-[18px]">🔥</div>
              <div>
                <div className="text-[14px] font-bold text-[#191f28] group-hover:text-[#ff8a3d] transition-colors flex items-center gap-1">
                  Firebase <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-[#8b95a1]">Firestore + Storage</div>
              </div>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-[#8b95a1]">Firestore 읽기</span><span className="font-bold text-[#03c75a]">50K/일 무료</span></div>
              <div className="flex justify-between"><span className="text-[#8b95a1]">Firestore 쓰기</span><span className="font-bold text-[#03c75a]">20K/일 무료</span></div>
              <div className="flex justify-between"><span className="text-[#8b95a1]">Storage</span><span className="font-bold text-[#03c75a]">5GB + 1GB/일</span></div>
            </div>
          </a>

          {/* Vercel */}
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
            className="block p-5 rounded-xl border border-[#e5e8eb] hover:border-[#191f28] hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#f2f4f6] rounded-xl flex items-center justify-center text-[18px]">▲</div>
              <div>
                <div className="text-[14px] font-bold text-[#191f28] group-hover:text-[#000] transition-colors flex items-center gap-1">
                  Vercel <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-[#8b95a1]">Serverless + Bandwidth</div>
              </div>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-[#8b95a1]">대역폭</span><span className="font-bold text-[#03c75a]">100GB/월 무료</span></div>
              <div className="flex justify-between"><span className="text-[#8b95a1]">서버리스</span><span className="font-bold text-[#03c75a]">100hr/월 무료</span></div>
              <div className="flex justify-between"><span className="text-[#8b95a1]">Pro 플랜</span><span className="font-bold text-[#4e5968]">$20/월</span></div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
