import { MessageSquare, Eye, Heart, PenLine } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebaseAdmin';
import LoungeHeader from '@/components/LoungeHeader'; // We will extract the header
import LoungeComposeClient from '@/components/LoungeComposeClient';
import { Post } from '@/lib/DashboardFacade'; // assuming this type exists or we fetch manually

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
      let rawPosts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || 0,
      }));
      
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

          <div className="flex flex-col gap-3">
            {posts.length === 0 ? (
              <div className="bg-transparent rounded-2xl p-12 text-center border border-dashed border-[#d1d6db]">
                <MessageSquare size={40} className="mx-auto mb-4 text-[#d1d6db]" />
                <p className="text-[15px] font-bold text-[#4e5968]">아직 글이 없습니다</p>
              </div>
            ) : (
              posts.map((news) => (
                <Link key={news.id} href={`/lounge/${news.id}`} scroll={false} className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 hover:bg-[#f9fafb] transition-colors cursor-pointer block">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          (news.category === '동탄 임장/분석' || news.category === '임장기') ? 'bg-[#e8f8f0] text-[#00a06c]' :
                          (news.category === '부동산 고민상담' || news.category === '부동산 기초') ? 'bg-[#ffe8e8] text-[#f04452]' :
                          (news.category === '동탄 청약/대출' || news.category === '정책자금 대출') ? 'bg-[#e8f3ff] text-[#3182f6]' :
                          (news.category === '동탄 교통/상권' || news.category === '인프라') ? 'bg-[#f4e8ff] text-[#9b51e0]' :
                          'bg-[#f2f4f6] text-[#4e5968]'
                        }`}>
                          {news.category === '임장기' ? '동탄 임장/분석' : 
                           news.category === '부동산 기초' ? '부동산 고민상담' :
                           news.category === '정책자금 대출' ? '동탄 청약/대출' :
                           news.category === '인프라' ? '동탄 교통/상권' : 
                           (news.category || '기타')}
                        </span>
                      </div>
                      {/* SEO-friendly H2 headings for post titles in loops */}
                      <h2 className="text-[18px] font-extrabold text-[#191f28] leading-snug line-clamp-1">{news.title}</h2>
                      {news.content && (
                        <p className="text-[14px] text-[#4e5968] leading-[1.6] line-clamp-2 mt-1">
                          {news.content
                            .replace(/!\[.*?\]\(.*?\)/g, '')
                            .replace(/\[.*?\]\(.*?\)/g, '')
                            .replace(/[#*~_\-`(]/g, '')
                            .replace(/\s+/g, ' ')
                            .replace(/https?:\/\/[^\s]+/g, '')
                            .trim()}
                        </p>
                      )}
                    </div>
                    {/* Extract and display first image as thumbnail if exists */}
                    {(() => {
                      const match = news.content?.match(/!\[.*?\]\((.*?)\)/);
                      if (match && match[1]) {
                        return (
                          <div className="w-[84px] h-[84px] shrink-0 rounded-xl overflow-hidden border border-[#f2f4f6] mt-1 hidden sm:block">
                            <img src={match[1]} className="w-full h-full object-cover" alt="thumbnail" loading="lazy" />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f2f4f6] pt-3 mt-3">
                    <span className="text-[13px] text-[#8b95a1] font-medium">
                      {[news.author, news.meta?.split('·')[0]?.trim()].filter(Boolean).join(' · ')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[12px] text-[#8b95a1]"><Eye size={14} /> {news.views || 0}</span>
                      <span className="flex items-center gap-1 text-[12px] text-[#8b95a1]"><Heart size={14} /> {news.likes || 0}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

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
