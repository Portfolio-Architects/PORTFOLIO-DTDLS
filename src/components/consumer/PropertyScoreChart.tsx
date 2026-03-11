'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { PremiumScores } from '@/lib/utils/scoring';
import { ShieldCheck } from 'lucide-react';

interface Props {
  scores: PremiumScores;
}

export default function PropertyScoreChart({ scores }: Props) {
  const data = [
    { subject: '육아·교육 타임세이브', A: scores.eduTimePremium, fullMark: 100 },
    { subject: '주차 쾌적성 지표', A: scores.stressFreeParking, fullMark: 100 },
    { subject: '직주근접 마찰비용 역산', A: scores.commuteFrictional, fullMark: 100 },
    { subject: '메가-단지 스케일', A: scores.megaScaleLiquidity, fullMark: 100 },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e5e8eb] animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e5e8eb]">
        <div>
          <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2">
            <ShieldCheck size={22} className="text-[#3182f6]"/> 
            프리미엄 지수 분석 (Premium Score)
          </h2>
          <p className="text-[13px] text-[#8b95a1] mt-1">객관적 데이터 기반 다중공선성을 통제한 4대 핵심 지표</p>
        </div>
        
        {/* Total Score Badge */}
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] px-5 py-3 rounded-2xl flex flex-col items-center">
            <span className="text-[11px] font-bold text-[#03c75a] mb-0.5">Total Premium</span>
            <span className="text-[28px] font-extrabold text-[#191f28] leading-none">{scores.totalPremiumScore}<span className="text-[14px] text-[#4e5968] font-bold ml-1">점</span></span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        
        {/* Radar Chart */}
        <div className="w-full md:w-1/2 h-[320px] bg-[#f9fafb] rounded-2xl flex items-center justify-center p-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e5e8eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#4e5968', fontSize: 12, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#8b95a1', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                itemStyle={{ color: '#3182f6', fontWeight: 'bold' }}
              />
              <Radar name="단지 점수" dataKey="A" stroke="#3182f6" fill="#3182f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Score Cards */}
        <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
           {[
             { title: '교육 환경', score: scores.eduTimePremium, desc: '학교·학원가 접근성' },
             { title: '주차 쾌적성', score: scores.stressFreeParking, desc: '주차공간 및 단지 밀집도' },
             { title: '교통 편의', score: scores.commuteFrictional, desc: '지하철·GTX 중심지 접근' },
             { title: '단지 스케일', score: scores.megaScaleLiquidity, desc: '세대수 규모 프리미엄' }
           ].map((item, idx) => (
             <div key={idx} className="bg-[#f9fafb] border border-[#e5e8eb] p-4 rounded-2xl hover:border-[#3182f6]/30 transition-colors">
               <h4 className="text-[12px] text-[#8b95a1] font-bold mb-1">{item.title}</h4>
               <div className="flex items-end gap-1 mb-2">
                 <span className="text-[22px] font-extrabold text-[#191f28] leading-none">{item.score}</span>
                 <span className="text-[13px] font-bold text-[#8b95a1] mb-0.5">점</span>
               </div>
               <p className="text-[11px] text-[#4e5968] font-medium leading-tight">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
