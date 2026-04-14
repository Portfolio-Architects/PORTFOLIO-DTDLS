'use client';

import { useState } from 'react';
import LoungeFeedClient from '@/components/LoungeFeedClient';
import LoungeComposeClient from '@/components/LoungeComposeClient';

// Same Post interface needed for initial posts typing
interface Post {
  id: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  category: string;
  author: string;
  meta: string;
  views: number;
  likes: number;
  createdAt: number;
}

export default function LoungeContainerClient({ initialPosts }: { initialPosts: Post[] }) {
  const [currentTab, setCurrentTab] = useState('전체');

  const categories = ['전체', '동탄 임장/분석', '부동산 고민상담', '동탄 청약/대출', '동탄 교통/상권'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* LEFT SIDEBAR: Categories */}
      <aside className="md:col-span-3 lg:col-span-3 hidden md:block">
        <div className="sticky top-[100px]">
          <h2 className="text-[14px] font-extrabold text-[#191f28] mb-4 px-2">게시판 카테고리</h2>
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setCurrentTab(cat)}
                className={`text-left px-4 py-3 rounded-xl text-[15px] font-bold transition-all ${
                  currentTab === cat ? 'bg-[#f2f4f6] text-[#191f28]' : 'text-[#4e5968] hover:bg-[#f9fafb]'
                }`}
              >
                {cat}
              </button>
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
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setCurrentTab(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${
                  currentTab === cat ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <LoungeFeedClient initialPosts={initialPosts} currentTab={currentTab} />

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
  );
}
