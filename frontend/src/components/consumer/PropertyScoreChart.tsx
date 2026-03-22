'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { PremiumScores } from '@/lib/utils/scoring';
import { ShieldCheck } from 'lucide-react';

interface Props {
  scores: PremiumScores;
}

const AREAS = [
  { key: 'education', label: '학군', desc: '초등·중학교 거리, 학원 밀집도' },
  { key: 'transport', label: '교통', desc: 'GTX·인덕원선·트램 역 거리' },
  { key: 'livingComfort', label: '주거쾌적', desc: '주차·건폐율·용적률' },
  { key: 'complex', label: '단지경쟁력', desc: '세대수·브랜드·연식' },
  { key: 'lifestyle', label: '생활인프라', desc: '음식점·카페 밀집도' },
] as const;

function getScoreColor(score: number): string {
  if (score >= 80) return '#03c75a';
  if (score >= 60) return '#8D99AE';
  if (score >= 40) return '#f59e0b';
  return '#EF233C';
}

function getGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 90) return { grade: 'S', label: '최상위', color: '#03c75a' };
  if (score >= 80) return { grade: 'A', label: '우수', color: '#36b37e' };
  if (score >= 65) return { grade: 'B+', label: '양호', color: '#8D99AE' };
  if (score >= 50) return { grade: 'B', label: '보통', color: '#f59e0b' };
  if (score >= 35) return { grade: 'C', label: '미흡', color: '#ff8b3d' };
  return { grade: 'D', label: '부족', color: '#EF233C' };
}

export default function PropertyScoreChart({ scores }: Props) {
  // Support both new and legacy field names
  const s = {
    education: scores.education ?? scores.eduTimePremium ?? 0,
    transport: scores.transport ?? scores.commuteFrictional ?? 0,
    livingComfort: scores.livingComfort ?? scores.stressFreeParking ?? 0,
    complex: scores.complex ?? scores.megaScaleLiquidity ?? 0,
    lifestyle: scores.lifestyle ?? 0,
    totalScore: scores.totalScore ?? scores.totalPremiumScore ?? 0,
  };

  const grade = getGrade(s.totalScore);

  const data = AREAS.map(area => ({
    subject: area.label,
    A: s[area.key],
    fullMark: 100,
  }));

  return (
    <div className="bg-[#1B2340] rounded-2xl shadow-sm border border-[#1E2A45] animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1E2A45]">
        <div>
          <h2 className="text-[18px] font-bold text-[#EDF2F4] flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#8D99AE]"/>
            아파트 프리미엄 분석
          </h2>
          <p className="text-[13px] text-[#6B7394] mt-0.5">학군·교통·쾌적·경쟁력·생활 5대 핵심 지표</p>
        </div>

        {/* Total Score Badge */}
        <div className="px-4 py-2.5 rounded-2xl flex flex-col items-center border" style={{ backgroundColor: `${grade.color}10`, borderColor: `${grade.color}30` }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-extrabold" style={{ color: grade.color }}>{grade.grade}</span>
            <span className="text-[10px] font-bold text-[#6B7394]">{grade.label}</span>
          </div>
          <span className="text-[26px] font-extrabold text-[#EDF2F4] leading-none">
            {s.totalScore}<span className="text-[13px] text-[#8D99AE] font-bold ml-0.5">점</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-3">
        {/* Radar Chart */}
        <div className="w-full h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#1E2A45" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#8D99AE', fontSize: 13, fontWeight: 700 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold', fontSize: '13px' }}
                itemStyle={{ color: '#8D99AE', fontWeight: 'bold' }}
                formatter={(value: any) => [`${value}점`, '']}
              />
              <Radar name="단지 점수" dataKey="A" stroke="#8D99AE" fill="#8D99AE" fillOpacity={0.5} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Cards — 5 columns */}
        <div className="grid grid-cols-5 gap-2 px-4 pb-4">
          {AREAS.map((area) => {
            const val = s[area.key];
            const color = getScoreColor(val);
            return (
              <div key={area.key} className="bg-[#141C33] border border-[#1E2A45] p-3 rounded-2xl hover:border-[#8D99AE]/30 transition-colors text-center">
                <h4 className="text-[13px] text-[#6B7394] font-bold mb-1 truncate">{area.label}</h4>
                <div className="flex items-end justify-center gap-0.5 mb-1">
                  <span className="text-[22px] font-extrabold leading-none" style={{ color }}>{val}</span>
                  <span className="text-[11px] font-bold text-[#6B7394] mb-0.5">점</span>
                </div>
                <p className="text-[11px] text-[#8D99AE] font-medium leading-tight">{area.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
