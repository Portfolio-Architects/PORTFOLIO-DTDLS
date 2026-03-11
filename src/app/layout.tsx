import type { Metadata } from 'next';
import { PieChart, LayoutDashboard, Building2, Newspaper, MessageSquare, Search, Bell } from 'lucide-react';
import './globals.css';
import MapProvider from '@/components/map/MapProvider';

export const metadata: Metadata = {
  title: 'Dongtan Data Labs | 동탄 데이터 허브',
  description: '동탄 지역의 최신 실거래가, 학군, 상권 혼잡도 데이터를 한눈에 확인하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <MapProvider>
          {children}
        </MapProvider>
      </body>
    </html>
  );
}
