import type { Metadata, Viewport } from 'next';
import { PieChart, LayoutDashboard, Building2, Newspaper, MessageSquare, Search, Bell } from 'lucide-react';
import './globals.css';
import OfflineBanner from '@/components/OfflineBanner';
import SiteTracker from '@/components/SiteTracker';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import CustomA2HSModal from '@/components/pwa/CustomA2HSModal';

export const metadata: Metadata = {
  metadataBase: new URL('https://dongtanview.com'),
  title: 'D-VIEW | 동탄 아파트 가치분석',
  description: 'D-VIEW — 동탄 179개 아파트의 실거래가·인프라·현장 검증 사진을 한눈에.',

  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png'
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: '4Fp0CzvSfTUPesN1rF0KFxF5YNSVLa_eSUfNKgKNEQs',
  },
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
        {/* 🔧 Register PWA Service Worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
              });
            });
          }
        `}} />
        <PWAProvider>
          <OfflineBanner />
          <SiteTracker />
          {children}
          <CustomA2HSModal />
        </PWAProvider>
      </body>
    </html>
  );
}
