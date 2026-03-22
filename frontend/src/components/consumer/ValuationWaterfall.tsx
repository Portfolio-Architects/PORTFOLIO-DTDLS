'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from 'recharts';
import type { PremiumScores } from '@/lib/utils/scoring';
import { getValuationBreakdown, calculatePUR, AREA_CONFIG } from '@/lib/utils/valuation';
import { ShieldCheck, TrendingUp, Percent } from 'lucide-react';

interface Props {
  scores: PremiumScores;
  price84Man: number; // 84㎡ 기준 매매가 (만원)
}

function formatEok(man: number): string {
  const eok = Math.floor(man / 10000);
  const rem = man % 10000;
  if (eok === 0) return `${man.toLocaleString()}만`;
  if (rem === 0) return `${eok}억`;
  return `${eok}억${rem.toLocaleString()}`;
}

export default function ValuationWaterfall({ scores, price84Man }: Props) {
  const breakdown = getValuationBreakdown(scores, price84Man);
  const valuation = calculatePUR(price84Man, scores.totalScore ?? breakdown.totalScore);

  // 폭포수 차트 데이터: 각 항목별 기여분 + 총점
  const chartData = [
    ...breakdown.items.map(item => ({
      name: item.name,
      value: item.contribution,
      color: item.color,
      isTotal: false,
    })),
    {
      name: '종합',
      value: breakdown.totalScore,
      color: '#191f28',
      isTotal: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e5e8eb] animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e5e8eb]">
        <div>
          <h2 className="text-[18px] font-extrabold text-[#191f28] flex items-center gap-2">
            <TrendingUp size={20} className="text-[#3182f6]"/>
            밸류에이션 분석
          </h2>
          <p className="text-[13px] text-[#8b95a1] mt-0.5">PUR·임대수익률·항목별 기여도 투명 공개</p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* PUR + Yield Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f9fafb] border border-[#e5e8eb] rounded-2xl p-4 text-center">
            <div className="text-[12px] font-extrabold text-[#8b95a1] mb-1">PUR (가격대비효용)</div>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-[28px] font-extrabold leading-none" style={{ color: valuation.purColor }}>
                {valuation.pur}
              </span>
            </div>
            <div className="inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold" style={{ backgroundColor: `${valuation.purColor}15`, color: valuation.purColor }}>
              {valuation.purGrade}등급 · {valuation.pur <= 100 ? '가성비 우수' : '프리미엄 가격'}
            </div>
            <p className="text-[10px] text-[#8b95a1] mt-2">낮을수록 가성비 우수 (가격÷효용점수)</p>
          </div>
          <div className="bg-[#f9fafb] border border-[#e5e8eb] rounded-2xl p-4 text-center">
            <div className="text-[12px] font-extrabold text-[#8b95a1] mb-1">추정 임대수익률</div>
            <div className="flex items-end justify-center gap-0.5 mb-1">
              <span className="text-[28px] font-extrabold leading-none" style={{ color: valuation.yieldColor }}>
                {valuation.estimatedYield}
              </span>
              <span className="text-[14px] font-bold text-[#8b95a1] mb-0.5">%</span>
            </div>
            <div className="inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold" style={{ backgroundColor: `${valuation.yieldColor}15`, color: valuation.yieldColor }}>
              {valuation.yieldGrade}등급
            </div>
            <p className="text-[10px] text-[#8b95a1] mt-2">전세가율 62% · 전환율 4.5% 기준 추정</p>
          </div>
        </div>

        {/* 기준 가격 */}
        <div className="bg-[#f9fafb] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#3182f6]">84㎡ 기준 매매가</span>
          <span className="text-[16px] font-extrabold text-[#191f28]">{formatEok(price84Man)}</span>
        </div>

        {/* 폭포수 차트 */}
        <div>
          <h3 className="text-[14px] font-extrabold text-[#191f28] mb-3">점수 산출 항목별 기여도</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#3182f6', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b95a1', fontSize: 10 }} axisLine={false} tickLine={false} width={32} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, fontWeight: 700 }}
                  formatter={(value: any, name: any, entry: any) => {
                    const d = entry.payload;
                    if (d.isTotal) return [`${value}점 (종합)`, ''];
                    return [`${value}점 (가중치 ${Math.round((d.rawWeight || 0) * 100)}%)`, ''];
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={entry.isTotal ? 1 : 0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상세 테이블 */}
        <div className="bg-[#f9fafb] rounded-xl p-4 border border-[#e5e8eb]">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[#8b95a1] border-b border-[#e5e8eb]">
                <th className="py-2 text-left font-extrabold">영역</th>
                <th className="py-2 text-right font-extrabold">원 점수</th>
                <th className="py-2 text-right font-extrabold">가중치</th>
                <th className="py-2 text-right font-extrabold">기여분</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.items.map(item => (
                <tr key={item.name} className="border-b border-[#f2f4f6]">
                  <td className="py-2 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </td>
                  <td className="py-2 text-right text-[#3182f6] font-bold">{item.rawScore}점</td>
                  <td className="py-2 text-right text-[#8b95a1]">{Math.round(item.weight * 100)}%</td>
                  <td className="py-2 text-right font-extrabold" style={{ color: item.color }}>{item.contribution}점</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#191f28]">
                <td className="py-2 font-extrabold text-[#191f28]">종합 점수</td>
                <td colSpan={2}></td>
                <td className="py-2 text-right font-extrabold text-[16px] text-[#191f28]">{breakdown.totalScore}점</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 알고리즘 투명성 안내 */}
        <div className="flex items-start gap-2 px-1">
          <ShieldCheck size={14} className="text-[#03c75a] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#8b95a1] leading-relaxed">
            이 분석은 공개 알고리즘에 의해 산출됩니다. 학군(초등·중학교 거리, 학원 밀집도), 교통(GTX·인덕원선·트램), 주거쾌적(주차·건폐율·용적률), 단지경쟁력(세대수·브랜드·연식), 생활인프라(음식점·카페)의 5개 영역 가중 평균입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
