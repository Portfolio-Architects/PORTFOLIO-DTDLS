import type { Metadata } from 'next';
import { PieChart, LayoutDashboard, Building2, Newspaper, MessageSquare, Search, Bell } from 'lucide-react';
import './globals.css';
import MapProvider from '@/components/map/MapProvider';
import FloatingUserBar from '@/components/FloatingUserBar';
import OfflineBanner from '@/components/OfflineBanner';

export const metadata: Metadata = {
  title: '임장크루 | 동탄 아파트 임장 커뮤니티',
  description: '포장 싹 뺀 진짜 동네 아파트 리뷰. 임장기와 실시간 동탄 소식을 한눈에 확인하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <OfflineBanner />
        <MapProvider>
          <FloatingUserBar />
          {children}
        </MapProvider>
      </body>
    </html>
  );
}
