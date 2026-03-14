'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Heart, Send, Shield, ShieldCheck, MessageSquare, Trash2 } from 'lucide-react';
import { db, auth } from '@/lib/firebaseConfig';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, increment, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as UserRepo from '@/lib/repositories/user.repository';
import type { UserProfile } from '@/lib/types/user.types';
import { getDisplayName } from '@/lib/types/user.types';
import { isAdmin as checkAdmin } from '@/lib/config/admin.config';

interface PostComment {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

/**
 * /lounge/[id] — Post detail page with comments
 */
export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Fetch post
  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (snap.exists()) {
        const data = snap.data();
        setPost({
          id: snap.id,
          title: data.title,
          category: data.category,
          author: data.authorName || '익명',
          likes: data.likes || 0,
          authorUid: data.authorUid || null,
          verifiedApartment: data.verifiedApartment,
          verificationLevel: data.verificationLevel,
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('ko-KR') : '방금 전',
        });
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
        <h1 className="text-[17px] font-bold text-[#191f28] flex-1 line-clamp-1">라운지 글</h1>
        {(user?.uid === post?.authorUid || checkAdmin(user?.email)) && (
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
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Post Card */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-bold text-white bg-[#191f28] px-2 py-0.5 rounded-md">{post.category}</span>
          </div>
          <h2 className="text-[20px] font-extrabold text-[#191f28] leading-snug mt-3 mb-4">{post.title}</h2>
          <div className="flex items-center justify-between border-t border-[#f2f4f6] pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-bold text-[#4e5968]">{post.author}</span>
              <VerificationBadge apartment={post.verifiedApartment} level={post.verificationLevel} />
              <span className="text-[12px] text-[#8b95a1]">{post.createdAt}</span>
            </div>
            <button onClick={handleLike} className="flex items-center gap-1.5 text-[#8b95a1] hover:text-[#f04452] transition-colors">
              <Heart size={16} />
              <span className="text-[13px] font-bold">{post.likes}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#f2f4f6] flex items-center gap-2">
            <MessageSquare size={16} className="text-[#3182f6]" />
            <span className="text-[15px] font-bold text-[#191f28]">댓글 {comments.length}</span>
          </div>

          {comments.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[14px] text-[#8b95a1]">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
            </div>
          ) : (
            <ul>
              {comments.map((c) => (
                <li key={c.id} className="px-5 py-4 border-b border-[#f2f4f6] last:border-0">
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
              placeholder="댓글을 입력하세요..."
              className="flex-1 bg-[#f2f4f6] rounded-xl px-4 py-3 text-[14px] outline-none focus:bg-[#e5e8eb] transition-colors"
            />
            <button
              onClick={handleComment}
              disabled={isSending || !commentText.trim()}
              className="w-10 h-10 bg-[#3182f6] disabled:bg-[#d1d6db] rounded-xl flex items-center justify-center text-white transition-colors active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
