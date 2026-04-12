'use client';

import { useState, useEffect, useRef } from 'react';
import { PenLine, X, ShieldCheck, Building2, ImagePlus, Loader2 } from 'lucide-react';
import { auth, googleProvider, storage } from '@/lib/firebaseConfig';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { dashboardFacade, UserReview } from '@/lib/DashboardFacade';
import * as UserRepo from '@/lib/repositories/user.repository';
import type { UserProfile } from '@/lib/types/user.types';
import { getDisplayName } from '@/lib/types/user.types';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/config/admin.config';
import { compressImage } from '@/lib/utils/imageCompression';

interface Props {
  currentCategory?: string;
}

export default function LoungeComposeClient({ currentCategory = '동탄 임장/분석' }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const MARKDOWN_TEMPLATE = `## 대주제 (작성해주세요)

여기에 내용을 작성해주세요...

### 소주제 (선택사항)

- 상세 내용을 입력하세요
- 상세 내용을 입력하세요`;

  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('동탄 임장/분석');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const compressedFile = await compressImage(file);
      // 1. Storage Reference with unique name
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `lounge_images/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const storageRef = ref(storage, fileName);

      // 2. Upload
      await uploadBytes(storageRef, compressedFile);

      // 3. Get URL
      const url = await getDownloadURL(storageRef);

      // 4. Inject Markdown into textarea at cursor position
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const mdImage = `\n![이미지](${url})\n`;
        const newText = postContent.substring(0, start) + mdImage + postContent.substring(end);
        setPostContent(newText);
        
        // Timeout to set focus back to textarea
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + mdImage.length, start + mdImage.length);
        }, 10);
      } else {
        setPostContent(prev => prev + `\n![이미지](${url})\n`);
      }
    } catch (error) {
      console.error('Image upload failed', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await UserRepo.getOrCreateProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const isUserAdmin = isAdmin(user?.email);
  const displayAuthorName = isUserAdmin ? '매니저' : (userProfile ? getDisplayName(userProfile) : '익명');
  const displayApartment = isUserAdmin ? '마스터' : (userProfile?.verifiedApartment?.replace(/\[.*?\]\s*/, '') || '');

  return (
    <>
      {(user && (userProfile || isUserAdmin)) && (
        <div className="bg-white rounded-2xl border border-[#e5e8eb] p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#191f28]">{displayAuthorName}</span>
            {displayApartment && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${isUserAdmin ? 'bg-[#191f28] text-[#ffffff]' : 'bg-[#e8f3ff] text-[#3182f6]'}`}>
                <ShieldCheck size={11} /> {displayApartment}
              </span>
            )}
          </div>
          <button
            onClick={() => { /* TODO: open verify modal */ }}
            className={`text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isUserAdmin ? 'text-[#8b95a1] bg-[#f2f4f6] hover:bg-[#e5e8eb]' : 'text-[#3182f6] bg-[#e8f3ff] hover:bg-[#d4e9ff]'}`}
          >
            <Building2 size={13} />
            {displayApartment ? '변경' : '아파트 인증'}
          </button>
        </div>
      )}

      {user ? (
        <button
          onClick={() => {
            setPostCategory(currentCategory);
            setShowCompose(true);
            if (isUserAdmin && !postContent) {
              setPostContent(MARKDOWN_TEMPLATE);
            }
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#3182f6] hover:bg-[#1b6de8] text-white rounded-full shadow-lg shadow-[#3182f6]/30 flex items-center justify-center transition-all active:scale-95 z-20"
        >
          <PenLine size={22} />
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#191f28] hover:bg-[#333d4b] text-white rounded-full shadow-lg shadow-[#191f28]/30 flex items-center justify-center transition-all active:scale-95 z-20"
        >
          <PenLine size={22} />
        </button>
      )}

      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
          <div className="relative w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-extrabold text-[#191f28]">커뮤니티 글쓰기</h2>
              <button onClick={() => setShowCompose(false)} className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center hover:bg-[#e5e8eb] transition-colors">
                <X size={16} className="text-[#4e5968]" />
              </button>
            </div>
            

            <div className="flex gap-2 mb-4 overflow-x-auto">
              {['동탄 임장/분석', '부동산 고민상담', '동탄 청약/대출', '동탄 교통/상권'].map((cat) => (
                <button key={cat} onClick={() => setPostCategory(cat)} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all ${postCategory === cat ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{cat}</button>
              ))}
            </div>
            <input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="검색에 노출될 확실한 글 제목을 입력하세요" className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3.5 text-[15px] font-bold outline-none focus:border-[#3182f6] focus:bg-white transition-colors mb-2" autoFocus />
            <textarea 
              ref={textareaRef}
              value={postContent} 
              onChange={(e) => setPostContent(e.target.value)} 
              placeholder={isUserAdmin ? "동탄 이야기를 자유롭게 나눠보세요... 마크다운 문법을 사용하여 구조적인 글을 작성해보세요." : "동탄 이야기를 자유롭게 나눠보세요... 글을 작성해보세요."} 
              rows={12} 
              className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#3182f6]/10 mb-4" 
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-[12px] text-[#8b95a1] hidden sm:inline-block">🎭 {displayAuthorName}</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-[#4e5968] hover:text-[#3182f6] hover:bg-[#f2f4f6] transition-colors px-3 py-2 rounded-lg disabled:opacity-50 border border-[#e5e8eb]"
                  title="이미지 업로드"
                >
                  {isUploadingImage ? <Loader2 size={16} className="animate-spin text-[#3182f6]" /> : <ImagePlus size={16} />}
                  <span>사진 첨부</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <button
                onClick={async () => {
                  if (!user || !postTitle.trim()) return;
                  setIsSubmitting(true);
                  try {
                    await dashboardFacade.addPost(postTitle.trim(), postContent.trim(), postCategory, user.uid, undefined, user.email);
                    setPostTitle(''); setPostContent(''); setPostCategory('임장기'); setShowCompose(false);
                    // Refresh the route to show the new post from the server component
                    router.refresh();
                  } catch { alert('글 작성에 실패했습니다.'); }
                  finally { setIsSubmitting(false); }
                }}
                disabled={isSubmitting || !postTitle.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#3182f6] hover:bg-[#1b6de8] disabled:bg-[#d1d6db] text-white rounded-xl font-bold text-[14px] transition-all active:scale-95"
              >
                {isSubmitting ? '작성 중...' : '작성 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
