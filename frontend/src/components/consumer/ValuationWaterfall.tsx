'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from 'recharts';
import type { PremiumScores } from '@/lib/utils/scoring';
import { getValuationBreakdown, AREA_CONFIG } from '@/lib/utils/valuation';
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
    <div className="flex flex-col gap-6 pt-6 mt-6 border-t border-border animate-in fade-in duration-500">
        {/* 기준 가격 */}
        <div className="bg-toss-blue-light rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-[13px] font-bold text-toss-blue">84㎡ 기준 매매가</span>
          <span className="text-[16px] font-extrabold text-primary">{formatEok(price84Man)}</span>
        </div>

        {/* 폭포수 차트 */}
        <div>
          <h3 className="text-[14px] font-extrabold text-primary mb-3">점수 산출 항목별 기여도</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#4e5968', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b95a1', fontSize: 10 }} axisLine={false} tickLine={false} width={32} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13, fontWeight: 700 }}
                  // @ts-expect-error recharts type match
                  formatter={(value: number | string | undefined, name: string | undefined, entry: Record<string, unknown>) => {
                    const d = entry.payload as Record<string, unknown>;
                    if (d.isTotal) return [`${value}점 (종합)`, ''];
                    return [`${value}점 (가중치 ${Math.round(((d.rawWeight as number) || 0) * 100)}%)`, ''];
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={entry.isTotal ? 1 : 0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상세 테이블 */}
        <div className="bg-body rounded-xl p-4 border border-border">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-tertiary border-b border-border">
                <th className="py-2 text-left font-extrabold">영역</th>
                <th className="py-2 text-right font-extrabold">원 점수</th>
                <th className="py-2 text-right font-extrabold">가중치</th>
                <th className="py-2 text-right font-extrabold">기여분</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.items.map(item => (
                <tr key={item.name} className="border-b border-body">
                  <td className="py-2 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </td>
                  <td className="py-2 text-right text-secondary font-bold">{item.rawScore}점</td>
                  <td className="py-2 text-right text-tertiary">{Math.round(item.weight * 100)}%</td>
                  <td className="py-2 text-right font-extrabold" style={{ color: item.color }}>{item.contribution}점</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#191f28]">
                <td className="py-2 font-extrabold text-primary">종합 점수</td>
                <td colSpan={2}></td>
                <td className="py-2 text-right font-extrabold text-[16px] text-primary">{breakdown.totalScore}점</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 알고리즘 투명성 안내 */}
        <div className="flex items-start gap-2 px-1">
          <ShieldCheck size={14} className="text-toss-green mt-0.5 shrink-0" />
          <p className="text-[11px] text-tertiary leading-relaxed">
            이 분석은 공개 알고리즘에 의해 산출됩니다. 학군(초등·중학교 거리, 학원 밀집도), 교통(GTX·인덕원선·트램), 주거쾌적(주차·건폐율·용적률), 단지경쟁력(세대수·브랜드·연식), 생활인프라(음식점·카페)의 5개 영역 가중 평균입니다.
          </p>
        </div>
    </div>
  );
}
