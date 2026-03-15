'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { PremiumScores } from '@/lib/utils/scoring';
import { ShieldCheck } from 'lucide-react';

interface Props {
  scores: PremiumScores;
}

export default function PropertyScoreChart({ scores }: Props) {
  const data = [
    { subject: '교육 환경', A: scores.eduTimePremium, fullMark: 100 },
    { subject: '주차 쾌적성', A: scores.stressFreeParking, fullMark: 100 },
    { subject: '교통 편의', A: scores.commuteFrictional, fullMark: 100 },
    { subject: '단지 규모', A: scores.megaScaleLiquidity, fullMark: 100 },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e5e8eb] animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e5e8eb]">
        <div>
          <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#3182f6]"/> 
            아파트 프리미엄 분석
          </h2>
          <p className="text-[12px] text-[#8b95a1] mt-0.5">교육·교통·주차·규모 4가지 핵심 지표</p>
        </div>
        
        {/* Total Score Badge */}
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-2.5 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] font-bold text-[#03c75a] mb-0.5">종합 점수</span>
            <span className="text-[26px] font-extrabold text-[#191f28] leading-none">{scores.totalPremiumScore}<span className="text-[13px] text-[#4e5968] font-bold ml-0.5">점</span></span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-3">
        
        {/* Radar Chart — full width, edge-to-edge */}
        <div className="w-full h-[280px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#e5e8eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4e5968', fontSize: 12, fontWeight: 'bold' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                itemStyle={{ color: '#3182f6', fontWeight: 'bold' }}
              />
              <Radar name="단지 점수" dataKey="A" stroke="#3182f6" fill="#3182f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Cards — single row */}
        <div className="grid grid-cols-4 gap-2.5 px-4 pb-4">
           {[
             { title: '교육 환경', score: scores.eduTimePremium, desc: '학교·학원가까지 거리' },
             { title: '주차 쾌적성', score: scores.stressFreeParking, desc: '주차 대수와 동 간격' },
             { title: '교통 편의', score: scores.commuteFrictional, desc: 'GTX-A/SRT역까지 거리' },
             { title: '단지 규모', score: scores.megaScaleLiquidity, desc: '세대수가 많을수록 유리' }
           ].map((item, idx) => (
             <div key={idx} className="bg-[#f9fafb] border border-[#e5e8eb] p-4 rounded-2xl hover:border-[#3182f6]/30 transition-colors text-center">
               <h4 className="text-[12px] text-[#8b95a1] font-bold mb-1">{item.title}</h4>
               <div className="flex items-end justify-center gap-0.5 mb-1.5">
                 <span className="text-[22px] font-extrabold text-[#191f28] leading-none">{item.score}</span>
                 <span className="text-[12px] font-bold text-[#8b95a1] mb-0.5">점</span>
               </div>
               <p className="text-[10px] text-[#4e5968] font-medium leading-tight">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
