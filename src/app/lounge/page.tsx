'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, MessageSquare } from 'lucide-react';
import { useDashboardData, dashboardFacade } from '@/lib/DashboardFacade';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * /lounge - 실시간 동탄라운지 전체 피드 페이지
 * Architecture Layer: Route/Controller (View only, delegates to DashboardFacade)
 */
export default function LoungePage() {
  const router = useRouter();
  const { newsFeed } = useDashboardData();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleLike = (postId: string) => {
    dashboardFacade.incrementLike(postId);
  };

  return (
    <div className="min-h-screen bg-[#f2f4f6]">
      {/* Sticky Header */}
      <header className="bg-white sticky top-0 z-10 border-b border-[#e5e8eb] px-4 py-3.5 flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-[#191f28] hover:bg-[#f2f4f6] p-1.5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-[#191f28]">실시간 동탄라운지</h1>
        <span className="text-[12px] text-[#8b95a1] font-bold bg-[#f2f4f6] px-2 py-0.5 rounded-full">{newsFeed.length}개 글</span>
      </header>

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {newsFeed.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#e5e8eb]">
            <MessageSquare size={40} className="mx-auto mb-4 text-[#d1d6db]" />
            <p className="text-[15px] font-bold text-[#4e5968]">아직 글이 없습니다</p>
            <p className="text-[13px] text-[#8b95a1] mt-1">라운지에 첫 글을 작성해보세요</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {newsFeed.map((news) => (
              <li
                key={news.id}
                className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-[16px] font-bold text-[#191f28] leading-snug mb-2">{news.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#8b95a1]">{news.author} · {news.meta}</span>
                  <button
                    onClick={() => handleLike(news.id)}
                    className="flex items-center gap-1 text-[#8b95a1] hover:text-[#f04452] transition-colors"
                  >
                    <Heart size={14} />
                    <span className="text-[12px] font-bold">{news.likes || 0}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
