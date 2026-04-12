import { MessageSquare, Eye, Heart, PenLine } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebaseAdmin';
import LoungeHeader from '@/components/LoungeHeader';
import LoungeComposeClient from '@/components/LoungeComposeClient';
import LoungeFeedClient from '@/components/LoungeFeedClient';


export const revalidate = 60; // SSR Data revalidation every 60 seconds

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoungePage(props: Props) {
  const searchParams = await props.searchParams;
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : '전체';
  let posts: any[] = [];
  
  const CATEGORY_MAP: Record<string, string[]> = {
    '전체': ['전체'],
    '동탄 임장/분석': ['동탄 임장/분석', '임장기'],
    '부동산 고민상담': ['부동산 고민상담', '부동산 기초'],
    '동탄 청약/대출': ['동탄 청약/대출', '정책자금 대출'],
    '동탄 교통/상권': ['동탄 교통/상권', '인프라']
  };
  
  try {
    if (adminDb) {
      const snap = await adminDb.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
      let rawPosts = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          category: data.category || '',
          author: data.authorName || data.author || '익명',
          meta: data.meta || '',
          views: data.views || 0,
          likes: data.likes || 0,
          createdAt: data.createdAt?.toMillis() || 0,
        };
      });
      
      if (currentTab !== '전체') {
        const allowedCategories = CATEGORY_MAP[currentTab] || [currentTab];
        rawPosts = rawPosts.filter((p: any) => allowedCategories.includes(p.category));
      }
      
      posts = rawPosts;
    }
  } catch (error) {
    console.error('Failed to fetch lounge posts server-side', error);
  }

  return (
    <main id="main-content" className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 pb-[100px] sm:pb-12 animate-in fade-in duration-500">
      
      {/* 3-Column Grid Layout for Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR: Categories */}
        <aside className="md:col-span-3 lg:col-span-3 hidden md:block">
          <div className="sticky top-[100px]">
            <h2 className="text-[14px] font-extrabold text-[#191f28] mb-4 px-2">게시판 카테고리</h2>
            <div className="flex flex-col gap-1">
              {['전체', '동탄 임장/분석', '부동산 고민상담', '동탄 청약/대출', '동탄 교통/상권'].map((cat) => (
                <Link 
                  key={cat} 
                  href={cat === '전체' ? '/lounge' : `/lounge?tab=${encodeURIComponent(cat)}`}
                  className={`px-4 py-3 rounded-xl text-[15px] font-bold transition-all ${
                    currentTab === cat ? 'bg-[#f2f4f6] text-[#191f28]' : 'text-[#4e5968] hover:bg-[#f9fafb]'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: Main Feed */}
        <section className="md:col-span-9 lg:col-span-6 w-full max-w-[600px] mx-auto md:mx-0">
          <div className="mb-6 md:hidden">
            <h1 className="text-[24px] font-extrabold tracking-tight text-[#191f28] mb-1">실시간 동탄 커뮤니티</h1>
            <p className="text-[14px] text-[#8b95a1] font-medium mb-4">동탄 주민들의 솔직한 이야기</p>
            {/* Mobile Horizontal Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['전체', '동탄 임장/분석', '부동산 고민상담', '동탄 청약/대출', '동탄 교통/상권'].map((cat) => (
                <Link 
                  key={cat} 
                  href={cat === '전체' ? '/lounge' : `/lounge?tab=${encodeURIComponent(cat)}`}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
                    currentTab === cat ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <LoungeFeedClient initialPosts={posts} currentTab={currentTab} />

          <LoungeComposeClient currentCategory={currentTab === '전체' ? '동탄 임장/분석' : currentTab} />
        </section>

        {/* RIGHT SIDEBAR: Placeholder for Popular Posts / Widgets */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-[100px] bg-white rounded-2xl border border-[#e5e8eb] p-5">
            <h2 className="text-[14px] font-extrabold text-[#191f28] mb-4 flex items-center gap-1">
              <span className="text-[#f04452]">🔥</span> 주간 인기글
            </h2>
            <p className="text-[13px] text-[#8b95a1] leading-relaxed">
              최근 일주일 동안 동탄 주민들이 가장 많이 본 인기글이 곧 제공될 예정입니다.
            </p>
          </div>
        </aside>

      </div>
    </main>
  );
}
