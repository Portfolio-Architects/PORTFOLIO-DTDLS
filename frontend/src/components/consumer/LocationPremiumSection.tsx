import React from 'react';
import { PremiumScores } from '@/lib/utils/scoring';
import { GraduationCap, Train, TreePine, Building2, Coffee, Trophy } from 'lucide-react';

interface Props {
  scores: PremiumScores | undefined;
}

export default function LocationPremiumSection({ scores }: Props) {
  if (!scores) return null;

  const metrics = [
    { key: 'education', label: '학군 (교육)', icon: GraduationCap, color: '#3182f6', bg: '#e8f3ff', score: scores.education },
    { key: 'transport', label: '교통 (접근성)', icon: Train, color: '#f5535e', bg: '#feeaec', score: scores.transport },
    { key: 'livingComfort', label: '주거 쾌적성', icon: TreePine, color: '#03c75a', bg: '#e5f9ed', score: scores.livingComfort },
    { key: 'complex', label: '단지 경쟁력', icon: Building2, color: '#8a40ff', bg: '#f3ebff', score: scores.complex },
    { key: 'lifestyle', label: '생활 인프라', icon: Coffee, color: '#ff8a3d', bg: '#fff4e6', score: scores.lifestyle },
  ];

  // Radar/Bar hybrid or simple elegant progress bars:
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[16px] font-bold text-[#191f28]">입지 프리미엄 분석</h3>
      </div>

      <div className="bg-white border border-[#e5e8eb] shadow-sm rounded-2xl p-5">
        {/* Total Score Banner */}
        <div className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#f59e0b]">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#8b95a1] mb-0.5">입지 종합 점수</div>
              <div className="text-[16px] font-extrabold text-[#191f28]">
                {scores.totalScore >= 80 ? '최상위권 프리미엄' : scores.totalScore >= 60 ? '우수 프리미엄' : '표준 입지'}
              </div>
            </div>
          </div>
          <div className="text-[32px] font-extrabold tracking-tighter" style={{ color: scores.totalScore >= 80 ? '#3182f6' : '#191f28' }}>
            {scores.totalScore}<span className="text-[16px] text-[#8b95a1] font-bold ml-1">점</span>
          </div>
        </div>

        {/* Detailed Progress Bars */}
        <div className="space-y-4">
          {metrics.map((m) => (
            <div key={m.key}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded flex items-center justify-center" style={{ backgroundColor: m.bg, color: m.color }}>
                    <m.icon size={12} />
                  </div>
                  <span className="text-[13px] font-bold text-[#4e5968]">{m.label}</span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: m.score >= 80 ? m.color : '#4e5968' }}>
                  {m.score}점
                </span>
              </div>
              <div className="w-full h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${m.score || 0}%`, backgroundColor: m.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
