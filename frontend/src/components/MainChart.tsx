'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface Transaction {
  거래일자: string;
  '거래금액(만원)': number;
}

export default function MainChart() {
  const [data, setData] = useState<{ date: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/realestate/transactions');
        const json = await res.json();
        
        if (json.status === 'success' && json.data.length > 0) {
          const formattedData = json.data.map((tx: Transaction) => ({
            date: tx['거래일자'],
            price: tx['거래금액(만원)'],
          }));
          setData(formattedData);
        } else {
          throw new Error('Fallback needed');
        }
      } catch (error) {
        // Fallback mock data matching HTML version
        setData([
          { date: '1월 1일', price: 100000 },
          { date: '1월 5일', price: 120000 },
          { date: '1월 10일', price: 110000 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-[#8b95a1] font-medium animate-pulse">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="w-full h-full min-h-[300px] p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3182f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3182f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#8b95a1', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#8b95a1', fontSize: 12 }} 
            dx={-10}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(25, 31, 40, 0.9)', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#8b95a1', marginBottom: '4px' }}
            formatter={(value: any) => [`${Number(value).toLocaleString()} 만원`, '실거래가']}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#3182f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#3182f6' }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
