'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function EduBubbleChart() {
  const northData = [
    { area: '북동탄', name: '영수입시학원', x: 1, y: 85, z: 25 },
    { area: '북동탄', name: '예체능', x: 1, y: 40, z: 15 },
    { area: '북동탄', name: '단과학원', x: 1, y: 60, z: 10 },
  ];

  const southData = [
    { area: '남동탄', name: '대형 입시학원', x: 2, y: 70, z: 35 },
    { area: '남동탄', name: '예체능', x: 2, y: 55, z: 20 },
    { area: '남동탄', name: '어학원', x: 2, y: 30, z: 25 },
  ];

  const formatXAxis = (tickItem: number) => {
    if (tickItem === 1) return '북동탄';
    if (tickItem === 2) return '남동탄';
    return '';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#191f28]/90 p-3 rounded-lg text-white border-none shadow-lg text-sm">
          <p className="font-bold mb-1">{data.area} ({data.name})</p>
          <p className="text-[#d1d6db]">밀집도 지수: <span className="text-white font-semibold">{data.z}</span></p>
          <p className="text-[#d1d6db]">평균 수강단가: <span className="text-white font-semibold">{data.y}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[300px] p-2">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="상권 구역" 
            domain={[0, 3]} 
            tickFormatter={formatXAxis}
            tickCount={4}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8b95a1', fontSize: 13 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="평균 수강 단가" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8b95a1', fontSize: 13 }}
            domain={[0, 100]}
          />
          <ZAxis type="number" dataKey="z" range={[200, 1500]} name="밀집도" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#d1d6db' }} />
          <Scatter name="북동탄 (카림상권)" data={northData} fill="#3182f6" fillOpacity={0.6} stroke="#3182f6" strokeWidth={2} isAnimationActive={false} />
          <Scatter name="남동탄 (호수공원 주변)" data={southData} fill="#f04452" fillOpacity={0.6} stroke="#f04452" strokeWidth={2} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
