'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, MessageSquare, PenLine, X, Send, Shield, ShieldCheck, Building2, Pencil, Check } from 'lucide-react';
import { useDashboardData, dashboardFacade } from '@/lib/DashboardFacade';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as UserRepo from '@/lib/repositories/user.repository';
import type { UserProfile } from '@/lib/types/user.types';
import { isValidNickname } from '@/lib/services/nickname.service';

const CATEGORIES = ['부동산', '교통', '교육', '문화', '자유'];

/**
 * /lounge - 실시간 동탄라운지 전체 피드 페이지
 * 로그인한 사용자는 익명으로 글을 작성 가능 + 아파트 인증 시스템
 */
export default function LoungePage() {
  const router = useRouter();
  const { newsFeed, dongtanApartments } = useDashboardData();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('자유');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification state
  const [showVerify, setShowVerify] = useState(false);
  const [selectedDong, setSelectedDong] = useState('');
  const [selectedApt, setSelectedApt] = useState('');

  // Nickname edit state
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profile = await UserRepo.getOrCreateProfile(u.uid);
        setUserProfile(profile);
      }
    });
    return () => unsub();
  }, []);

  const handleLike = (postId: string) => {
    dashboardFacade.incrementLike(postId);
  };

  const handleSubmit = async () => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    if (!postTitle.trim()) { alert('내용을 입력해주세요.'); return; }
    setIsSubmitting(true);
    try {
      await dashboardFacade.addPost(postTitle.trim(), postCategory, user.uid);
      setPostTitle('');
      setPostCategory('자유');
      setShowCompose(false);
    } catch { alert('글 작성에 실패했습니다.'); }
    finally { setIsSubmitting(false); }
  };

  const handleVerify = async () => {
    if (!user || !selectedApt) return;
    try {
      await UserRepo.setApartmentVerification(user.uid, selectedApt, 'self_declared');
      setUserProfile(prev => prev ? { ...prev, verifiedApartment: selectedApt, verificationLevel: 'self_declared' } : null);
      setShowVerify(false);
      alert('🏠 아파트 인증이 완료되었습니다!');
    } catch { alert('인증 실패'); }
  };

  const availableDongs = Array.from(
    new Set(dongtanApartments.map(apt => apt.match(/\[(.*?)\]/)?.[1]).filter(Boolean))
  ) as string[];
  const filteredApts = dongtanApartments.filter(apt => apt.includes(`[${selectedDong}]`));

  /** Renders a verification badge */
  const VerificationBadge = ({ apartment, level }: { apartment?: string; level?: string }) => {
    if (!apartment || !level) return null;
    const shortName = apartment.replace(/\[.*?\]\s*/, '');
    if (level === 'registry_verified') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e8f3ff] text-[#3182f6] px-2 py-0.5 rounded-md">
          <ShieldCheck size={11} /> {shortName}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-md">
        <Shield size={11} /> {shortName}
      </span>
    );
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

      {/* My Profile & Verification Status Bar */}
      {user && userProfile && (
        <div className="bg-white border-b border-[#e5e8eb] px-4 py-3 flex flex-col gap-2">
          {/* Nickname row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditingNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nicknameInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if ([...val].length <= 3) setNicknameInput(val);
                    }}
                    maxLength={6}
                    placeholder="3글자"
                    className="w-20 bg-[#f9fafb] border border-[#3182f6] rounded-lg px-2 py-1 text-[14px] font-bold text-[#191f28] outline-none focus:ring-2 focus:ring-[#3182f6]/20 text-center"
                    autoFocus
                  />
                  <span className={`text-[11px] font-bold ${[...nicknameInput].length === 3 ? 'text-[#03c75a]' : 'text-[#f04452]'}`}>
                    {[...nicknameInput].length}/3
                  </span>
                  <button
                    onClick={async () => {
                      if (!isValidNickname(nicknameInput)) { alert('닉네임은 정확히 3글자여야 합니다.'); return; }
                      await UserRepo.updateNickname(user.uid, nicknameInput);
                      setUserProfile(prev => prev ? { ...prev, nickname: nicknameInput } : null);
                      setIsEditingNickname(false);
                    }}
                    disabled={[...nicknameInput].length !== 3}
                    className="w-7 h-7 rounded-full bg-[#3182f6] disabled:bg-[#d1d6db] flex items-center justify-center text-white transition-colors"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-[15px] font-extrabold text-[#191f28]">{userProfile.nickname}</span>
                  <button
                    onClick={() => { setNicknameInput(userProfile.nickname || ''); setIsEditingNickname(true); }}
                    className="w-6 h-6 rounded-full bg-[#f2f4f6] hover:bg-[#e5e8eb] flex items-center justify-center transition-colors"
                  >
                    <Pencil size={11} className="text-[#8b95a1]" />
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setShowVerify(true)}
              className="text-[12px] font-bold text-[#3182f6] bg-[#e8f3ff] px-3 py-1.5 rounded-lg hover:bg-[#d4e9ff] transition-colors flex items-center gap-1"
            >
              <Building2 size={13} />
              {userProfile?.verifiedApartment ? '변경' : '아파트 인증'}
            </button>
          </div>
          {/* Verification row */}
          {userProfile?.verifiedApartment ? (
            <div className="flex items-center gap-2">
              <VerificationBadge apartment={userProfile.verifiedApartment} level={userProfile.verificationLevel} />
              {userProfile.verificationLevel === 'self_declared' && (
                <span className="text-[11px] text-[#8b95a1]">자가선언 · <span className="text-[#3182f6] font-bold cursor-pointer hover:underline">등기부 인증하기</span></span>
              )}
            </div>
          ) : (
            <span className="text-[12px] text-[#8b95a1]">아파트 인증을 하면 글에 뱃지가 표시됩니다</span>
          )}
        </div>
      )}

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
              <li key={news.id} className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 hover:shadow-md transition-shadow">
                <h3 className="text-[16px] font-bold text-[#191f28] leading-snug mb-2">{news.title}</h3>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] text-[#8b95a1]">{news.author}</span>
                    <VerificationBadge apartment={news.verifiedApartment} level={news.verificationLevel} />
                    <span className="text-[12px] text-[#d1d6db]">·</span>
                    <span className="text-[12px] text-[#8b95a1]">{news.meta}</span>
                  </div>
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
      {user && !showCompose && !showVerify && (
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold text-[#191f28]">익명 글쓰기</h2>
              <button onClick={() => setShowCompose(false)} className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e5e8eb] transition-colors">
                <X size={16} className="text-[#4e5968]" />
              </button>
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setPostCategory(cat)} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${postCategory === cat ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{cat}</button>
              ))}
            </div>
            <textarea value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="동탄 이야기를 자유롭게 나눠보세요..." rows={3} className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#3182f6]/10 mb-4" autoFocus />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#8b95a1]">🎭 익명</span>
                {userProfile?.verifiedApartment && (
                  <VerificationBadge apartment={userProfile.verifiedApartment} level={userProfile.verificationLevel} />
                )}
              </div>
              <button onClick={handleSubmit} disabled={isSubmitting || !postTitle.trim()} className="flex items-center gap-2 px-6 py-3 bg-[#3182f6] hover:bg-[#1b6de8] disabled:bg-[#d1d6db] text-white rounded-xl font-bold text-[14px] transition-all active:scale-95">
                <Send size={14} />
                {isSubmitting ? '게시 중...' : '게시하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apartment Verification Modal */}
      {showVerify && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVerify(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold text-[#191f28]">🏠 아파트 인증</h2>
              <button onClick={() => setShowVerify(false)} className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e5e8eb] transition-colors">
                <X size={16} className="text-[#4e5968]" />
              </button>
            </div>

            {/* Verification Level Info */}
            <div className="bg-[#f9fafb] rounded-2xl p-4 mb-5 border border-[#e5e8eb]">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-md"><Shield size={11} /> 자가선언</span>
                <span className="text-[12px] text-[#8b95a1]">아파트 선택만으로 인증</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-[#e8f3ff] text-[#3182f6] px-2 py-0.5 rounded-md"><ShieldCheck size={11} /> 등기부 인증</span>
                <span className="text-[12px] text-[#8b95a1]">등기부등본으로 소유 확인 (준비중)</span>
              </div>
            </div>

            {/* Dong selector */}
            <p className="text-[14px] font-bold text-[#191f28] mb-3">내 아파트를 선택해주세요</p>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
              {availableDongs.map(dong => (
                <button key={dong} onClick={() => { setSelectedDong(dong); setSelectedApt(''); }} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${selectedDong === dong ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{dong}</button>
              ))}
            </div>

            {/* Apt list */}
            {selectedDong && (
              <div className="bg-[#f9fafb] border border-[#d1d6db] rounded-xl overflow-hidden max-h-48 overflow-y-auto p-2 mb-5">
                {filteredApts.map(apt => (
                  <button key={apt} onClick={() => setSelectedApt(apt)} className={`w-full text-left px-4 py-3 text-[14px] font-medium rounded-lg transition-colors ${selectedApt === apt ? 'bg-[#e8f3ff] text-[#3182f6] font-bold' : 'text-[#191f28] hover:bg-[#f2f4f6]'}`}>{apt}</button>
                ))}
              </div>
            )}

            {!selectedDong && (
              <div className="bg-[#f9fafb] border border-dashed border-[#d1d6db] rounded-xl p-4 text-center text-[13px] text-[#8b95a1] mb-5">위에서 <strong>동네</strong>를 선택해주세요</div>
            )}

            {/* Submit */}
            <button
              onClick={handleVerify}
              disabled={!selectedApt}
              className="w-full py-4 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:bg-[#d1d6db] disabled:text-[#8b95a1] bg-[#191f28] text-white flex items-center justify-center gap-2"
            >
              <Shield size={16} />
              자가선언 인증하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
