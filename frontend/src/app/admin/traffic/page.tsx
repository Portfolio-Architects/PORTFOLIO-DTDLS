'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, Heart, BarChart2, ExternalLink, CreditCard, Activity, CalendarDays } from 'lucide-react';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { getDailyVisitStats, getDailyContentViews, DailyStat, ContentView } from '@/lib/repositories/traffic.repository';

interface TrafficRow {
  name: string;
  dong: string;
  viewCount: number;
  likes: number;
}

export default function TrafficPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'cumulative'>('daily');
  
  // Daily Stats Data
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [contentViews, setContentViews] = useState<ContentView[]>([]);
  
  // Cumulative Data
  const [trafficData, setTrafficData] = useState<TrafficRow[]>([]);
  const [trafficSort, setTrafficSort] = useState<'viewCount' | 'likes'>('viewCount');
  const [selectedDong, setSelectedDong] = useState<string>('전체');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch Daily Stats
        const dStats = await getDailyVisitStats();
        // Sort by date ascending to show timeline correctly
        const sortedDStats = dStats.sort((a, b) => a.date.localeCompare(b.date));
        setDailyStats(sortedDStats);

        // Auto-select latest date if available
        if (sortedDStats.length > 0) {
          const latest = sortedDStats[sortedDStats.length - 1].date;
          setSelectedDate(latest);
        }

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

        // Also check apartmentViews collection (Legacy)
        const aptViewSnap = await getDocs(collection(db, 'apartmentViews')).catch(() => null);
        if (aptViewSnap) {
          aptViewSnap.docs.forEach(d => {
            viewMap[d.id] = (viewMap[d.id] || 0) + (d.data().count || 0);
          });
        }

        // Merge with apartment list
        const rows = Object.keys(aptMeta).map(name => ({
          name,
          dong: (aptMeta[name] as Record<string, unknown>)?.dong || '',
          viewCount: viewMap[name] || 0,
          likes: likeMap[name] || 0,
        }));
        setTrafficData(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch daily content views whenever selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      const views = await getDailyContentViews(selectedDate);
      setContentViews(views);
    })();
  }, [selectedDate]);

  const handleReset = async () => {
    if (!confirm('경고: 정말 모든 단지의 누적 조회수와 관심 기록을 0으로 초기화하시겠습니까?\n(일자별 로그는 삭제되지 않습니다)')) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const snap = await getDocs(collection(db, 'scoutingReports'));
      snap.docs.forEach(d => {
        batch.update(d.ref, { viewCount: 0, likes: 0 });
      });

      const aptViewSnap = await getDocs(collection(db, 'apartmentViews')).catch(() => null);
      if (aptViewSnap) {
        aptViewSnap.docs.forEach(d => batch.delete(d.ref));
      }

      await batch.commit();

      setTrafficData(prev => prev.map(r => ({ ...r, viewCount: 0, likes: 0 })));
      alert('누적 트래픽 데이터가 초기화되었습니다.');
    } catch (e: unknown) {
      console.error(e);
      alert('초기화 중 오류 발생: ' + (e as Error).message);
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
    <div className="animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">트래픽 분석</h1>
          <p className="text-[#4e5968] text-[14px]">웹 사이트 및 임장 리포트 트래픽 지표</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#f2f4f6] p-1 rounded-xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-bold transition-all ${activeTab === 'daily' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'}`}
        >
          <Activity size={16} /> 일자별 트래픽
        </button>
        <button 
          onClick={() => setActiveTab('cumulative')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-bold transition-all ${activeTab === 'cumulative' ? 'bg-white text-[#191f28] shadow-sm' : 'text-[#8b95a1] hover:text-[#4e5968]'}`}
        >
          <BarChart2 size={16} /> 누적 아파트 지표
        </button>
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#3182f6] border-t-transparent rounded-full animate-spin" /></div>}

      {/* ─── 일자별 트래픽 탭 (Daily Tab) ─── */}
      {!loading && activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-6">
            <h2 className="text-[16px] font-bold text-[#191f28] mb-6 flex items-center gap-2">
              <Activity size={18} className="text-[#3182f6]" /> 총 방문자 추이 (최근 일자)
            </h2>
            <div className="h-[280px] w-full">
              {dailyStats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#8b95a1]">오늘부터 기록이 시작됩니다.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3182f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3182f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e8eb" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8b95a1', fontSize: 12 }} 
                      tickFormatter={(val) => val.slice(5)} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8b95a1', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#8b95a1', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="websiteVisits" name="방문자 수" stroke="#3182f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Daily Content Views Section */}
          <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-[16px] font-bold text-[#191f28] flex items-center gap-2">
                <CalendarDays size={18} className="text-[#ff8a3d]" /> 
                일자별 콘텐츠 콘텐츠 조회수
              </h2>
              <select 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-[#f2f4f6] text-[#4e5968] font-bold text-[14px] px-4 py-2 rounded-xl outline-none"
              >
                {[...dailyStats].reverse().map(s => (
                  <option key={s.date} value={s.date}>{s.date}</option>
                ))}
              </select>
            </div>

            {contentViews.length === 0 ? (
              <div className="py-12 text-center text-[#8b95a1]">해당 일자에 조회된 콘텐츠가 없습니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#f9fafb] border-b border-[#e5e8eb]">
                  <tr className="text-[#8b95a1] text-xs font-bold">
                    <th className="py-3 pl-4 text-left w-8">#</th>
                    <th className="py-3 text-left w-16">구분</th>
                    <th className="py-3 text-left">콘텐츠 명</th>
                    <th className="py-3 pr-4 text-right text-[#3182f6]">조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {contentViews.map((c, i) => (
                    <tr key={c.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="py-3 pl-4 text-center">
                        <span className={`text-xs font-extrabold ${i < 3 ? 'text-[#f59e0b]' : 'text-[#8b95a1]'}`}>{i + 1}</span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${c.type === 'report' ? 'bg-[#ffebec] text-[#f04452]' : 'bg-[#e8f3ff] text-[#3182f6]'}`}>
                          {c.type === 'report' ? '리포트' : '라운지'}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-[#191f28] text-[13px] line-clamp-1">{c.title}</td>
                      <td className="py-3 pr-4 text-right font-bold text-[#3182f6]">{c.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── 누적 트래픽 탭 (Cumulative Tab) ─── */}
      {!loading && activeTab === 'cumulative' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            {/* Dong Tabs */}
            <div className="flex flex-wrap gap-2">
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

            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="px-3 py-2 text-[12px] font-bold text-[#f04452] bg-[#ffebec] hover:bg-[#f04452] hover:text-white rounded-lg transition-colors shadow-sm whitespace-nowrap">
                데이터 전체 초기화
              </button>
              <div className="flex gap-1.5 border-l border-[#e5e8eb] pl-4">
                {(['viewCount', 'likes'] as const).map(k => (
                  <button key={k} onClick={() => setTrafficSort(k)}
                    className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all ${
                      trafficSort === k ? 'bg-[#191f28] text-white shadow-sm' : 'bg-white border border-[#e5e8eb] text-[#4e5968] hover:bg-[#f2f4f6]'
                    }`}>
                    {k === 'viewCount' ? <><Eye size={14}/> 조회순</> : <><Heart size={14}/> 관심순</>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

          <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-[#f9fafb] border-b border-[#e5e8eb]">
                <tr className="text-[#8b95a1] text-xs font-bold">
                  <th className="py-3 pl-4 text-left w-8">#</th>
                  <th className="py-3 text-left">아파트명</th>
                  <th className="py-3 text-left text-[#8b95a1]">동</th>
                  <th className="py-3 pr-4 text-right text-[#3182f6]">조회수</th>
                  <th className="py-3 pr-4 text-right text-[#f04452]">관심</th>
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
                        <div className="w-16 sm:w-20 h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
                          <div className="h-full bg-[#3182f6] rounded-full" style={{ width: `${(row.viewCount / maxViews) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[#3182f6] tabular-nums w-8 text-right">{row.viewCount}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 sm:w-20 h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
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
        </div>
      )}

      {/* ─── 비용 모니터링 ─── */}
      <div className="mt-10 bg-white border border-[#e5e8eb] shadow-sm rounded-2xl p-5 md:p-8">
        <h2 className="text-[16px] font-bold text-[#191f28] mb-2 flex items-center gap-2">
          <CreditCard size={18} className="text-[#8b95a1]" />
          비용 모니터링
        </h2>
        <p className="text-[13px] text-[#8b95a1] mb-6">과금 서비스 콘솔 바로가기</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer"
            className="block p-5 rounded-xl border border-[#e5e8eb] hover:border-[#3182f6] transition-colors group">
            <div className="font-bold text-[#191f28] group-hover:text-[#3182f6] flex items-center gap-1 mb-1">
              Google Maps API <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
            </div>
            <div className="text-[12px] text-[#4e5968]">$200 무료/월</div>
          </a>
          <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer"
            className="block p-5 rounded-xl border border-[#e5e8eb] hover:border-[#ff8a3d] transition-colors group">
            <div className="font-bold text-[#191f28] group-hover:text-[#ff8a3d] flex items-center gap-1 mb-1">
              Firebase <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
            </div>
            <div className="text-[12px] text-[#4e5968]">50K 읽기 무료/일</div>
          </a>
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
            className="block p-5 rounded-xl border border-[#e5e8eb] hover:border-[#191f28] transition-colors group">
            <div className="font-bold text-[#191f28] flex items-center gap-1 mb-1">
              Vercel <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
            </div>
            <div className="text-[12px] text-[#4e5968]">100GB 대역폭 무료/월</div>
          </a>
        </div>
      </div>
    </div>
  );
}
