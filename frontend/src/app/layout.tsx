import type { Metadata, Viewport } from 'next';
import { PieChart, LayoutDashboard, Building2, Newspaper, MessageSquare, Search, Bell } from 'lucide-react';
import './globals.css';
import FloatingUserBar from '@/components/FloatingUserBar';
import OfflineBanner from '@/components/OfflineBanner';

export const metadata: Metadata = {
  title: 'DSQ | 동탄구 아파트 가치 측정 플랫폼',
  description: 'Dongtan Spatial Quant — 동탄구 179개 아파트의 실거래가·인프라·임장 리포트를 한눈에.',
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
