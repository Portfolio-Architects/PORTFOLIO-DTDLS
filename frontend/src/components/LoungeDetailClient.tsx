'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, Send, Shield, ShieldCheck, MessageSquare, Trash2, Eye, Edit2, ImagePlus, Loader2 } from 'lucide-react';
import { db, auth, storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, increment, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as UserRepo from '@/lib/repositories/user.repository';
import type { UserProfile } from '@/lib/types/user.types';
import { getDisplayName } from '@/lib/types/user.types';
import { isAdmin as checkAdmin } from '@/lib/config/admin.config';
import { compressImage } from '@/lib/utils/imageCompression';
import { dashboardFacade } from '@/lib/DashboardFacade';

interface PostComment {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export default function LoungeDetailClient({ postId, initialPost }: { postId: string, initialPost?: any }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [post, setPost] = useState<Record<string, any> | null>(() => {
    if (initialPost) {
      return {
        ...initialPost,
        createdAt: initialPost.createdAt ? new Date(initialPost.createdAt).toLocaleDateString('ko-KR') : '방금 전'
      };
    }
    return null;
  });
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(!initialPost);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth
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

  // Fetch post and Track View
  useEffect(() => {
    if (!postId) return;
    
    // View Tracking
    let viewIncremented = false;

    const fetchPost = async () => {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (snap.exists()) {
        const data = snap.data();
        setPost({
          id: snap.id,
          title: data.title,
          category: data.category,
          content: data.content || '',
          author: data.authorName || '익명',
          likes: data.likes || 0,
          views: data.views || 0,
          authorUid: data.authorUid || null,
          verifiedApartment: data.verifiedApartment,
          verificationLevel: data.verificationLevel,
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('ko-KR') : '방금 전',
        });
        
        // Track View Server side once
        if (!viewIncremented) {
          viewIncremented = true;
          try {
            if (localStorage.getItem('dview_is_admin') !== 'true') {
              await dashboardFacade.incrementPostView(postId, data.title);
            }
            // Optionally update UI view count locally immediately
            setPost((p: any) => p ? { ...p, views: (p.views || 0) + 1 } : p);
          } catch (e) {
            console.error('View tracking failed', e);
          }
        }
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  // Listen to comments
  useEffect(() => {
    if (!postId) return;
    const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: PostComment[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          text: data.text,
          authorName: data.authorName || '익명',
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('ko-KR') : '방금 전',
        });
      });
      setComments(list);
    });
    return () => unsub();
  }, [postId]);

  const handleLike = async () => {
    if (!postId) return;
    await updateDoc(doc(db, 'posts', postId), { likes: increment(1) });
    setPost((prev: any) => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : prev);
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || !userProfile) return;
    setIsSending(true);
    try {
      const displayName = getDisplayName(userProfile);
      await addDoc(collection(db, `posts/${postId}/comments`), {
        text: commentText.trim(),
        authorName: displayName,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
      setCommentText('');
    } catch {
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!postId || !editTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'posts', postId), {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        updatedAt: serverTimestamp(),
      });
      setPost((prev: any) => prev ? { ...prev, title: editTitle.trim(), content: editContent.trim(), category: editCategory } : prev);
      setIsEditing(false);
    } catch (e) {
      alert('수정에 실패했습니다.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `lounge_images/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const mdImage = `\n![이미지](${url})\n`;
        const newText = editContent.substring(0, start) + mdImage + editContent.substring(end);
        setEditContent(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + mdImage.length, start + mdImage.length);
        }, 10);
      } else {
        setEditContent(prev => prev + `\n![이미지](${url})\n`);
      }
    } catch (error) {
      console.error('Image upload failed', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /** Verification badge */
  const VerificationBadge = ({ apartment, level }: { apartment?: string; level?: string }) => {
    if (!apartment || !level) return null;
    const shortName = apartment.replace(/\[.*?\]\s*/, '');
    if (level === 'registry_verified') {
      return <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#e8f3ff] text-[#3182f6] px-2 py-0.5 rounded-md"><ShieldCheck size={11} /> {shortName}</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#f2f4f6] text-[#8b95a1] px-2 py-0.5 rounded-md"><Shield size={11} /> {shortName}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f4f6] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#3182f6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f2f4f6] flex flex-col items-center justify-center gap-4">
        <p className="text-[16px] font-bold text-[#4e5968]">글을 찾을 수 없습니다</p>
        <button onClick={() => router.push('/lounge')} className="text-[#3182f6] font-bold">← 라운지로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f6]">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 border-b border-[#e5e8eb] px-4 py-3.5 flex items-center gap-3">
        <button onClick={() => router.push('/lounge')} className="text-[#191f28] hover:bg-[#f2f4f6] p-1.5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-[#191f28] flex-1 line-clamp-1">
          {post?.category === '임장기' ? '동탄 임장/분석' : 
           post?.category === '부동산 기초' ? '부동산 고민상담' :
           post?.category === '정책자금 대출' ? '동탄 청약/대출' :
           post?.category === '인프라' ? '동탄 교통/상권' : 
           String(post?.category || "라운지")}
        </h1>
        {(user?.uid === post?.authorUid || checkAdmin(user?.email)) && (
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                onClick={() => {
                  setEditTitle(post?.title || '');
                  setEditContent(post?.content || '');
                  setEditCategory(post?.category || '동탄 임장/분석');
                  setIsEditing(true);
                }}
                className="p-2 rounded-full hover:bg-[#f2f4f6] text-[#adb5bd] hover:text-[#3182f6] transition-colors"
                title="수정"
              >
                <Edit2 size={18} />
              </button>
            )}
            <button
              onClick={async () => {
                if (!confirm('이 글을 삭제하시겠습니까?')) return;
                try {
                  await deleteDoc(doc(db, 'posts', postId));
                  router.push('/lounge');
                } catch {
                  alert('삭제에 실패했습니다.');
                }
              }}
              className="p-2 rounded-full hover:bg-[#fff0f0] text-[#adb5bd] hover:text-[#ff6b6b] transition-colors"
              title="삭제"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="bg-white rounded-2xl border border-[#e5e8eb] p-6 mb-6 shadow-sm">
          {isEditing ? (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex gap-2 mb-2 overflow-x-auto">
                {['동탄 임장/분석', '부동산 고민상담', '동탄 청약/대출', '동탄 교통/상권'].map((cat) => (
                  <button key={cat} onClick={() => setEditCategory(cat)} className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${editCategory === cat ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{cat}</button>
                ))}
              </div>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3 text-[16px] font-bold outline-none focus:border-[#3182f6]"
                placeholder="제목"
              />
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={12}
                className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#3182f6] resize-none whitespace-pre-wrap"
                placeholder="내용"
              />
              <div className="flex items-center justify-between mt-2">
                <div>
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
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#4e5968] rounded-xl text-[14px] font-bold transition-colors">취소</button>
                  <button onClick={handleSaveEdit} className="px-5 py-2.5 bg-[#3182f6] hover:bg-[#1b6de8] text-white rounded-xl text-[14px] font-bold transition-colors shadow-md shadow-[#3182f6]/20">저장</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${
                  (post?.category === '동탄 임장/분석' || post?.category === '임장기') ? 'bg-[#e8f8f0] text-[#00a06c]' :
                  (post?.category === '부동산 고민상담' || post?.category === '부동산 기초' || post?.category === '부동산') ? 'bg-[#ffe8e8] text-[#f04452]' :
                  (post?.category === '동탄 청약/대출' || post?.category === '정책자금 대출') ? 'bg-[#e8f3ff] text-[#3182f6]' :
                  (post?.category === '동탄 교통/상권' || post?.category === '인프라' || post?.category === '교통') ? 'bg-[#f4e8ff] text-[#9b51e0]' :
                  'bg-[#f2f4f6] text-[#4e5968]'
                }`}>
                  {post?.category === '임장기' ? '동탄 임장/분석' : 
                   post?.category === '부동산 기초' ? '부동산 고민상담' :
                   post?.category === '정책자금 대출' ? '동탄 청약/대출' :
                   post?.category === '인프라' ? '동탄 교통/상권' : 
                   String(post?.category || "자유")}
                </span>
                <span className="text-[13px] text-[#8b95a1] ml-auto">{String(post?.createdAt || "")}</span>
              </div>
              <h1 className="text-[20px] font-extrabold text-[#191f28] leading-snug mt-2 mb-4">{String(post?.title || "")}</h1>
              
              {post?.content && (
                <article className="text-[#4e5968] text-[15px] leading-[1.65] break-keep [&>h2]:text-[18px] [&>h2]:font-extrabold [&>h2]:text-[#191f28] [&>h2]:mt-7 [&>h2]:mb-2.5 [&>h3]:text-[16px] [&>h3]:font-bold [&>h3]:text-[#191f28] [&>h3]:mt-5 [&>h3]:mb-1.5 [&>p]:mb-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-2 [&_li]:pl-1 [&_li]:mb-0.5 [&_li>p]:inline [&_p]:whitespace-pre-wrap [&_li]:whitespace-pre-wrap marker:text-[#8b95a1] [&_img]:rounded-xl [&_img]:border [&_img]:border-[#e5e8eb] [&_img]:my-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {String(post.content).replace(/\n{3,}/g, '\n\n')}
                  </ReactMarkdown>
                </article>
              )}
            </>
          )}

          <div className="flex items-center justify-between border-t border-[#f2f4f6] pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-bold text-[#4e5968]">{String(post?.author || "")}</span>
              <VerificationBadge apartment={String(post?.verifiedApartment || "")} level={String(post?.verificationLevel || "")} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[#8b95a1]">
                <Eye size={16} />
                <span className="text-[13px] font-bold">{Number(post?.views || 0)}</span>
              </div>
              <button onClick={handleLike} className="flex items-center gap-1.5 text-[#8b95a1] hover:text-[#f04452] transition-colors">
                <Heart size={16} />
                <span className="text-[13px] font-bold">{Number(post?.likes || 0)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#f2f4f6] flex items-center gap-2">
            <MessageSquare size={16} className="text-[#3182f6]" />
            <span className="text-[15px] font-bold text-[#191f28]">댓글 {comments.length}</span>
          </div>

          {comments.length === 0 ? (
            <div className="px-5 py-8 text-center bg-[#f9fafb]">
              <p className="text-[14px] text-[#8b95a1]">이웃의 첫 번째 댓글을 기다리고 있어요!</p>
            </div>
          ) : (
            <ul>
              {comments.map((c) => (
                <li key={c.id} className="px-5 py-4 border-b border-[#f2f4f6] last:border-0 hover:bg-[#f9fafb] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-bold text-[#191f28]">{c.authorName}</span>
                    <span className="text-[11px] text-[#8b95a1]">{c.createdAt}</span>
                  </div>
                  <p className="text-[14px] text-[#4e5968] leading-relaxed">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Comment Input Bar */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e8eb] px-4 py-3 z-20">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              placeholder="따뜻한 댓글을 남겨주세요..."
              className="flex-1 bg-[#f2f4f6] rounded-xl px-4 py-3 text-[14px] outline-none focus:bg-[#e5e8eb] transition-colors focus:ring-2 focus:ring-[#3182f6]/20"
            />
            <button
              onClick={handleComment}
              disabled={isSending || !commentText.trim()}
              className="w-10 h-10 bg-[#3182f6] disabled:bg-[#d1d6db] rounded-xl flex items-center justify-center text-white transition-colors active:scale-95 shadow-md shadow-[#3182f6]/20"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
