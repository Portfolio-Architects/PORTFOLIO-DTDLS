import { MessageSquare, Eye, Heart, PenLine } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebaseAdmin';
import LoungeHeader from '@/components/LoungeHeader'; // We will extract the header
import LoungeComposeClient from '@/components/LoungeComposeClient';
import { Post } from '@/lib/DashboardFacade'; // assuming this type exists or we fetch manually

export const revalidate = 60; // SSR Data revalidation every 60 seconds

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function LoungePage({ searchParams }: Props) {
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : '전체';
  let posts: any[] = [];
  
  try {
    if (adminDb) {
      const snap = await adminDb.collection('posts').orderBy('createdAt', 'desc').limit(100).get();
      let rawPosts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis() || 0,
      }));
      
      if (currentTab !== '전체') {
        rawPosts = rawPosts.filter((p: any) => p.category === currentTab);
      }
      
      posts = rawPosts;
    }
  } catch (error) {
    console.error('Failed to fetch lounge posts server-side', error);
  }

  return (
    <div className="min-h-screen bg-[#f2f4f6] font-sans selection:bg-[#3182f6]/20">
      <a href="#main-content" className="skip-to-content">내용으로 건너뛰기</a>
      
      {/* Extract Header from DashboardClient into a shared component to keep UI synced */}
      <LoungeHeader activeTab="lounge" />

      <main id="main-content" className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16 pt-3 sm:pt-4 md:pt-5 pb-[100px] sm:pb-8 animate-in fade-in duration-500">
        <section>
          <div className="flex justify-between items-start mb-4 w-full">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#191f28] mb-1">실시간 동탄 커뮤니티</h1>
              <p className="text-[15px] text-[#8b95a1] font-medium">동탄 주민들의 솔직한 이야기</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {['전체', '임장기', '부동산 기초', '정책자금 대출', '인프라'].map((cat) => (
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

          <div className="flex flex-col gap-3">
            {posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#e5e8eb]">
                <MessageSquare size={40} className="mx-auto mb-4 text-[#d1d6db]" />
                <p className="text-[15px] font-bold text-[#4e5968]">아직 글이 없습니다</p>
              </div>
            ) : (
              posts.map((news) => (
                <Link key={news.id} href={`/lounge/${news.id}`} className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 hover:shadow-md transition-shadow cursor-pointer block">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          news.category === '임장기' ? 'bg-[#e8f8f0] text-[#00a06c]' :
                          news.category === '부동산 기초' ? 'bg-[#ffe8e8] text-[#f04452]' :
                          news.category === '정책자금 대출' ? 'bg-[#e8f3ff] text-[#3182f6]' :
                          news.category === '인프라' ? 'bg-[#f4e8ff] text-[#9b51e0]' :
                          'bg-[#f2f4f6] text-[#4e5968]'
                        }`}>
                          {news.category || '기타'}
                        </span>
                      </div>
                      {/* SEO-friendly H2 headings for post titles in loops */}
                      <h2 className="text-[17px] font-extrabold text-[#191f28] leading-snug line-clamp-1">{news.title}</h2>
                      {news.content && (
                        <p className="text-[14px] text-[#4e5968] leading-relaxed line-clamp-2 mt-1">{news.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f2f4f6] pt-3 mt-3">
                    <span className="text-[13px] text-[#8b95a1] font-medium">{news.author} · {news.meta?.split('·')[0]?.trim()}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[12px] text-[#8b95a1]"><Eye size={14} /> {news.views || 0}</span>
                      <span className="flex items-center gap-1 text-[12px] text-[#8b95a1]"><Heart size={14} /> {news.likes || 0}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <LoungeComposeClient />
        </section>
      </main>
    </div>
  );
}
