'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function LifestyleRadarChart() {
  const data = [
    { time: '오전 10시', 롯데백화점: 40, 동탄호수공원: 20 },
    { time: '낮 12시', 롯데백화점: 85, 동탄호수공원: 50 },
    { time: '오후 3시', 롯데백화점: 95, 동탄호수공원: 70 },
    { time: '오후 6시', 롯데백화점: 80, 동탄호수공원: 95 },
    { time: '오후 9시', 롯데백화점: 40, 동탄호수공원: 85 },
    { time: '심야', 롯데백화점: 0, 동탄호수공원: 40 },
  ];

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center p-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(0,0,0,0.05)" />
          <PolarAngleAxis 
            dataKey="time" 
            tick={{ fill: '#4e5968', fontSize: 13, fontFamily: 'sans-serif' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(25, 31, 40, 0.9)', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#8b95a1', marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} iconType="circle" />
          <Radar 
            name="롯데백화점 동탄점" 
            dataKey="롯데백화점" 
            stroke="#3182f6" 
            strokeWidth={3}
            fill="#3182f6" 
            fillOpacity={0.2} 
            isAnimationActive={false}
          />
          <Radar 
            name="동탄호수공원" 
            dataKey="동탄호수공원" 
            stroke="#03c75a" 
            strokeWidth={3}
            fill="#03c75a" 
            fillOpacity={0.2} 
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
