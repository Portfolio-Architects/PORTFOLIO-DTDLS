import type { Metadata, Viewport } from 'next';
import { PieChart, LayoutDashboard, Building2, Newspaper, MessageSquare, Search, Bell } from 'lucide-react';
import './globals.css';
import FloatingUserBar from '@/components/FloatingUserBar';
import OfflineBanner from '@/components/OfflineBanner';

export const metadata: Metadata = {
  title: 'D-VIEW | 동탄 아파트 가치분석',
  description: 'D-VIEW — 동탄 179개 아파트의 실거래가·인프라·현장 검증 사진을 한눈에.',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#3182f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <FloatingUserBar />
        {children}
      </body>
    </html>
  );
}
