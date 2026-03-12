'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, MessageSquare, PenLine, X, Send } from 'lucide-react';
import { useDashboardData, dashboardFacade } from '@/lib/DashboardFacade';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

const CATEGORIES = ['부동산', '교통', '교육', '문화', '자유'];

/**
 * /lounge - 실시간 동탄라운지 전체 피드 페이지
 * 로그인한 사용자는 익명으로 글을 작성할 수 있음
 */
export default function LoungePage() {
  const router = useRouter();
  const { newsFeed } = useDashboardData();
  const [user, setUser] = useState<User | null>(null);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('자유');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleLike = (postId: string) => {
    dashboardFacade.incrementLike(postId);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!postTitle.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dashboardFacade.addPost(postTitle.trim(), postCategory, user.uid);
      setPostTitle('');
      setPostCategory('자유');
      setShowCompose(false);
    } catch {
      alert('글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f6]">
      {/* Sticky Header */}
      <header className="bg-white sticky top-0 z-10 border-b border-[#e5e8eb] px-4 py-3.5 flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-[#191f28] hover:bg-[#f2f4f6] p-1.5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-[#191f28] flex-1">실시간 동탄라운지</h1>
        <span className="text-[12px] text-[#8b95a1] font-bold bg-[#f2f4f6] px-2 py-0.5 rounded-full">{newsFeed.length}개 글</span>
      </header>

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
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

      {/* Floating Write Button */}
      {user && !showCompose && (
        <button
          onClick={() => setShowCompose(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#3182f6] hover:bg-[#1b6de8] text-white rounded-full shadow-lg shadow-[#3182f6]/30 flex items-center justify-center transition-all active:scale-95 z-20"
        >
          <PenLine size={22} />
        </button>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCompose(false)} />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold text-[#191f28]">익명 글쓰기</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e5e8eb] transition-colors"
              >
                <X size={16} className="text-[#4e5968]" />
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPostCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
                    postCategory === cat
                      ? 'bg-[#191f28] text-white border-[#191f28]'
                      : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Input */}
            <textarea
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="동탄 이야기를 자유롭게 나눠보세요..."
              rows={3}
              className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#3182f6]/10 mb-4"
              autoFocus
            />

            {/* Info + Submit */}
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#8b95a1]">🎭 랜덤 닉네임으로 익명 게시됩니다</p>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !postTitle.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#3182f6] hover:bg-[#1b6de8] disabled:bg-[#d1d6db] text-white rounded-xl font-bold text-[14px] transition-all active:scale-95"
              >
                <Send size={14} />
                {isSubmitting ? '게시 중...' : '게시하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
