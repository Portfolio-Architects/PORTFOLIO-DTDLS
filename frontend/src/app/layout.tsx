import type { Metadata, Viewport } from 'next';
import { PieChart, LayoutDashboard, Building2, Newspaper, MessageSquare, Search, Bell } from 'lucide-react';
import './globals.css';
import FloatingUserBar from '@/components/FloatingUserBar';
import OfflineBanner from '@/components/OfflineBanner';
import SiteTracker from '@/components/SiteTracker';

export const metadata: Metadata = {
  title: 'D-VIEW | 동탄 아파트 가치분석',
  description: 'D-VIEW — 동탄 179개 아파트의 실거래가·인프라·현장 검증 사진을 한눈에.',

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
        {/* 🔧 SW/Cache Auto-Cleanup — zombie service worker 제거 */}
        <script dangerouslySetInnerHTML={{ __html: `
          if('serviceWorker' in navigator){
            navigator.serviceWorker.getRegistrations().then(function(regs){
              regs.forEach(function(r){r.unregister()});
            });
          }
          if('caches' in window){
            caches.keys().then(function(keys){
              keys.forEach(function(k){caches.delete(k)});
            });
          }
        `}} />
        <OfflineBanner />
        <FloatingUserBar />
        <SiteTracker />
        {children}
      </body>
    </html>
  );
}
