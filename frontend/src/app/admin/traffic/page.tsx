'use client';

import { useState, useMemo, useTransition } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Eye, Heart, BarChart2, ExternalLink, CreditCard, Activity, CalendarDays } from 'lucide-react';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDailyContentViews, ContentView } from '@/lib/repositories/traffic.repository';

interface TrafficRow {
  name: string;
  dong: string;
  viewCount: number;
  likes: number;
}

const fetchAnalyticsData = async () => {
  const idToken = await auth.currentUser?.getIdToken();
  const gaRes = await fetch('/api/admin/analytics', {
    headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
  });
  const gaJson = await gaRes.json();
  
  const metaRes = await fetch('/api/dashboard-init');
  const metaData = await metaRes.json();
  const aptMeta = metaData.apartmentMeta || {};

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

  const aptViewSnap = await getDocs(collection(db, 'apartmentViews')).catch(() => null);
  if (aptViewSnap) {
    aptViewSnap.docs.forEach(d => {
      viewMap[d.id] = (viewMap[d.id] || 0) + (d.data().count || 0);
    });
  }

  const rows = Object.keys(aptMeta).map(name => ({
    name,
    dong: (aptMeta[name] as Record<string, unknown>)?.dong || '',
    viewCount: viewMap[name] || 0,
    likes: likeMap[name] || 0,
  }));

  return {
    gaData: gaJson.data || [],
    trafficData: rows as TrafficRow[]
  };
};

export default function TrafficPage() {
  const { mutate } = useSWRConfig();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'daily' | 'cumulative'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useSWR('analytics-data', fetchAnalyticsData, {
    revalidateOnFocus: false,
    onSuccess: (data) => {
      if (data.gaData && data.gaData.length > 0 && !selectedDate) {
        setSelectedDate(data.gaData[data.gaData.length - 1].date);
      }
    }
  });

  const gaData = analyticsData?.gaData || [];
  const trafficData = analyticsData?.trafficData || [];

  const { data: contentViews = [] } = useSWR(
    selectedDate ? ['content-views', selectedDate] : null, 
    ([_, date]) => getDailyContentViews(date as string),
    { revalidateOnFocus: false }
  );
  
  const [trafficSort, setTrafficSort] = useState<'viewCount' | 'likes'>('viewCount');
  const [selectedDong, setSelectedDong] = useState<string>('전체');
  
  const loading = isAnalyticsLoading && (!analyticsData); // Show loading only on initial fetch

  const handleReset = async () => {
    if (!confirm('경고: 정말 모든 단지의 누적 조회수와 관심 기록을 0으로 초기화하시겠습니까?\n(일자별 로그는 삭제되지 않습니다)')) return;
    
    const previousData = analyticsData;
    mutate('analytics-data', {
      ...analyticsData,
      trafficData: trafficData.map(r => ({ ...r, viewCount: 0, likes: 0 }))
    }, false);

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
      alert('누적 트래픽 데이터가 초기화되었습니다.');
    } catch (e: unknown) {
      console.error(e);
      mutate('analytics-data', previousData, false);
      alert('초기화 중 오류 발생: ' + (e as Error).message);
    }
  };

  const handleTabChange = (tab: 'daily' | 'cumulative') => startTransition(() => setActiveTab(tab));
  const handleDateChange = (date: string) => startTransition(() => setSelectedDate(date));
  const handleDongChange = (dong: string) => startTransition(() => setSelectedDong(dong));
  const handleSortChange = (sort: 'viewCount' | 'likes') => startTransition(() => setTrafficSort(sort));

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
    <div className={`animate-in fade-in duration-300 pb-20 transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight mb-2">트래픽 분석</h1>
          <p className="text-secondary text-[14px]">웹 사이트 및 임장 리포트 트래픽 지표</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-body p-1 rounded-xl mb-8 w-fit">
        <button 
          onClick={() => handleTabChange('daily')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-bold transition-all ${activeTab === 'daily' ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}
        >
          <Activity size={16} /> 구글 애널리틱스 (GA4)
        </button>
        <button 
          onClick={() => handleTabChange('cumulative')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-bold transition-all ${activeTab === 'cumulative' ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}
        >
          <BarChart2 size={16} /> 누적 아파트 지표
        </button>
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-toss-blue border-t-transparent rounded-full animate-spin" /></div>}

      {/* ─── 일자별 트래픽 탭 (Daily Tab) ─── */}
      {!loading && activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
            <h2 className="text-[16px] font-bold text-primary mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-toss-blue" /> 구글 애널리틱스 트래픽 (순수 방문자)
              </div>
              <span className="text-[12px] font-medium text-tertiary bg-body px-2 py-1 rounded-md">
                과도한 봇(Bot) 및 내부 개발자 트래픽이 자동 필터링됩니다.
              </span>
            </h2>
            <div className="h-[280px] w-full mt-6">
              {gaData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-tertiary">구글 애널리틱스 데이터를 불러오는 중이거나 아직 기록이 없습니다.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={gaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      allowDecimals={false}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#8b95a1', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f2f4f6' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#8b95a1', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Bar dataKey="activeUsers" name="순수 방문자 수" fill="#3182f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="pageViews" name="페이지 뷰" fill="#ff8a3d" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Daily Content Views Section */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-[16px] font-bold text-primary flex items-center gap-2">
                <CalendarDays size={18} className="text-[#ff8a3d]" /> 
                일자별 콘텐츠 콘텐츠 조회수
              </h2>
              <select 
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="bg-body text-secondary font-bold text-[14px] px-4 py-2 rounded-xl outline-none"
              >
                {[...gaData].reverse().map(s => (
                  <option key={s.date} value={s.date}>{s.date}</option>
                ))}
              </select>
            </div>

            {contentViews.length === 0 ? (
              <div className="py-12 text-center text-tertiary">해당 일자에 조회된 콘텐츠가 없습니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-body border-b border-border">
                  <tr className="text-tertiary text-xs font-bold">
                    <th className="py-3 pl-4 text-left w-8">#</th>
                    <th className="py-3 text-left w-16">구분</th>
                    <th className="py-3 text-left">콘텐츠 명</th>
                    <th className="py-3 pr-4 text-right text-toss-blue">조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {contentViews.map((c, i) => (
                    <tr key={c.id} className="hover:bg-body transition-colors">
                      <td className="py-3 pl-4 text-center">
                        <span className={`text-xs font-extrabold ${i < 3 ? 'text-[#f59e0b]' : 'text-tertiary'}`}>{i + 1}</span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${c.type === 'report' ? 'bg-[#ffebec] text-toss-red' : 'bg-toss-blue-light text-toss-blue'}`}>
                          {c.type === 'report' ? '리포트' : '라운지'}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-primary text-[13px] line-clamp-1">{c.title}</td>
                      <td className="py-3 pr-4 text-right font-bold text-toss-blue">{c.views}</td>
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
              <button onClick={() => handleDongChange('전체')} 
                className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${selectedDong === '전체' ? 'bg-toss-blue text-surface shadow-sm' : 'bg-surface border border-border text-secondary hover:bg-body'}`}>
                전체
              </button>
              {dongs.map(dong => (
                <button key={dong} onClick={() => handleDongChange(dong)} 
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${selectedDong === dong ? 'bg-toss-blue text-surface shadow-sm' : 'bg-surface border border-border text-secondary hover:bg-body'}`}>
                  {dong}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="px-3 py-2 text-[12px] font-bold text-toss-red bg-[#ffebec] hover:bg-toss-red hover:text-surface rounded-lg transition-colors shadow-sm whitespace-nowrap">
                데이터 전체 초기화
              </button>
              <div className="flex gap-1.5 border-l border-border pl-4">
                {(['viewCount', 'likes'] as const).map(k => (
                  <button key={k} onClick={() => handleSortChange(k)}
                    className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all ${
                      trafficSort === k ? 'bg-primary text-surface shadow-sm' : 'bg-surface border border-border text-secondary hover:bg-body'
                    }`}>
                    {k === 'viewCount' ? <><Eye size={14}/> 조회순</> : <><Heart size={14}/> 관심순</>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-toss-blue-light text-toss-blue"><BarChart2 size={14}/></div>
                <span className="text-[11px] font-bold text-tertiary">선택 단지</span>
              </div>
              <div className="text-[26px] font-extrabold text-toss-blue">{sortedData.length}</div>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-toss-blue-light text-toss-blue"><Eye size={14}/></div>
                <span className="text-[11px] font-bold text-tertiary">총 조회수</span>
              </div>
              <div className="text-[26px] font-extrabold text-toss-blue">{totalViews.toLocaleString()}</div>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#ffebec] text-toss-red"><Heart size={14}/></div>
                <span className="text-[11px] font-bold text-tertiary">총 관심</span>
              </div>
              <div className="text-[26px] font-extrabold text-toss-red">{totalLikes.toLocaleString()}</div>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#fff4e6] text-[#ff8a3d]"><Eye size={14}/></div>
                <span className="text-[11px] font-bold text-tertiary">활성 단지</span>
              </div>
              <div className="text-[26px] font-extrabold text-[#ff8a3d]">{sortedData.filter(r => r.viewCount > 0 || r.likes > 0).length}</div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-body border-b border-border">
                <tr className="text-tertiary text-xs font-bold">
                  <th className="py-3 pl-4 text-left w-8">#</th>
                  <th className="py-3 text-left">아파트명</th>
                  <th className="py-3 text-left text-tertiary">동</th>
                  <th className="py-3 pr-4 text-right text-toss-blue">조회수</th>
                  <th className="py-3 pr-4 text-right text-toss-red">관심</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {sortedData.map((row, i) => (
                  <tr key={row.name} className={`hover:bg-body transition-colors ${i < 3 ? 'bg-[#fffbf5]' : ''}`}>
                    <td className="py-3 pl-4 text-center">
                      <span className={`text-xs font-extrabold ${i === 0 ? 'text-[#f59e0b]' : i === 1 ? 'text-tertiary' : i === 2 ? 'text-[#cd7c2f]' : 'text-toss-gray'}`}>{i + 1}</span>
                    </td>
                    <td className="py-3 font-bold text-primary text-[13px]">{row.name}</td>
                    <td className="py-3 text-xs text-tertiary">{row.dong}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 sm:w-20 h-1.5 bg-body rounded-full overflow-hidden">
                          <div className="h-full bg-toss-blue rounded-full" style={{ width: `${(row.viewCount / maxViews) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-toss-blue tabular-nums w-8 text-right">{row.viewCount}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 sm:w-20 h-1.5 bg-body rounded-full overflow-hidden">
                          <div className="h-full bg-toss-red rounded-full" style={{ width: `${(row.likes / maxLikes) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-toss-red tabular-nums w-8 text-right">{row.likes}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trafficData.every(r => r.viewCount === 0 && r.likes === 0) && (
              <div className="py-12 text-center text-tertiary text-sm">임장 리포트가 있는 단지에서만 조회수가 집계됩니다.</div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
