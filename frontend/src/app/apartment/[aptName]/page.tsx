import { Metadata } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import DashboardClient from '@/components/DashboardClient';
import { SHEET_ID, SHEET_TABS, parseCsvLine } from '@/lib/constants';

// --- SEO: Dynamic Metadata Generator ---
// Await the params Promise for Next.js 15+
export async function generateMetadata(props: { params: Promise<{ aptName: string }> }): Promise<Metadata> {
  const params = await props.params;
  const decodedName = decodeURIComponent(params.aptName);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dongtanview.com';
  
  return {
    title: `${decodedName} 실거래가/가치분석 - D-VIEW`,
    description: `동탄 ${decodedName} 아파트의 실거래가 추이, 주변 인프라, 전문가 임장 리포트를 확인하세요.`,
    openGraph: {
      title: `${decodedName} 실거래가 분석 - D-VIEW`,
      description: `동탄 ${decodedName} 지역의 객관적 가치 지표 및 실거래가 확인하기.`,
      url: `${baseUrl}/apartment/${encodeURIComponent(decodedName)}`,
      siteName: 'D-VIEW',
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${decodedName} 실거래가 분석 - D-VIEW`,
      description: `동탄 ${decodedName} 지역의 객관적 가치 지표 확인하기.`,
    }
  };
}

export const revalidate = 300;

async function getInitialData() {
  const result: {
    favoriteCounts: Record<string, number>;
    typeMap: { aptName: string; area: string; typeM2: string; typePyeong: string }[];
    apartmentMeta: Record<string, { dong?: string; txKey?: string; isPublicRental?: boolean }>;
  } = {
    favoriteCounts: {},
    typeMap: [],
    apartmentMeta: {},
  };

  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), ms))
    ]);

  try {
    if (adminDb) {
      const snap = await withTimeout(adminDb.collection('favoriteCounts').get(), 3000);
      snap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.count > 0) result.favoriteCounts[data.aptName || doc.id] = data.count;
      });
      const metaDoc = await withTimeout(adminDb.doc('settings/apartmentMeta').get(), 3000);
      if (metaDoc.exists) result.apartmentMeta = (metaDoc.data() || {}) as Record<string, { dong?: string; txKey?: string; isPublicRental?: boolean }>;
    }
  } catch (e) {
    console.warn('[Server] Firebase init error:', e);
  }

  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TABS.TYPE_MAP)}`;
    const res = await fetch(csvUrl, { next: { revalidate: 86400 } });
    if (res.ok) {
      const csvText = await res.text();
      const lines = csvText.split('\n').filter((l: string) => l.trim());
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 3) continue;
        const aptName = cols[1]?.trim();
        const area = cols[2]?.trim();
        const typeM2 = cols[3]?.trim() || '';
        const typePyeong = cols[5]?.trim() || '';
        if (aptName && area && (typeM2 || typePyeong)) {
          result.typeMap.push({ aptName, area, typeM2, typePyeong });
        }
      }
    }
  } catch (e) {}

  return result;
}

export default async function ApartmentPage(props: { params: Promise<{ aptName: string }> }) {
  const params = await props.params;
  const decodedName = decodeURIComponent(params.aptName);
  const initialData = await getInitialData();

  // Render the dashboard with the specific apartment pre-opened
  return <DashboardClient initialDashboardData={initialData} preselectedAptName={decodedName} />;
}
