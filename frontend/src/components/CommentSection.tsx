'use client';

import { MessageSquare, UserCircle } from 'lucide-react';
import type { CommentData } from '@/lib/DashboardFacade';
import type { User } from 'firebase/auth';

interface CommentSectionProps {
  comments: CommentData[];
  commentInput: string;
  onCommentChange: (text: string) => void;
  onSubmitComment: () => void;
  user: User | null;
  isUnlocked: boolean;
}

export default function CommentSection({
  comments,
  commentInput,
  onCommentChange,
  onSubmitComment,
  user,
  isUnlocked,
}: CommentSectionProps) {
  return (
    <div id="sec-comments" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-14">
      <h2 className="text-[20px] font-bold text-[#191f28] flex items-center gap-2 mb-6 border-b border-[#e5e8eb] pb-3">
        <MessageSquare size={20} className="text-[#3182f6]"/> 
        아파트 이야기 <span className="text-[#3182f6] text-[16px] ml-1">{comments.length}</span>
      </h2>
      
      <div className="flex flex-col gap-6">
        {/* Input Area */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={user ? "임장기에 대한 생각이나 궁금한 점을 남겨주세요." : "로그인 후 댓글을 남길 수 있습니다."}
            disabled={!user}
            className="flex-1 border border-[#e5e8eb] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3182f6]/20 focus:border-[#3182f6] disabled:bg-[#f2f4f6]"
            value={commentInput}
            onChange={(e) => onCommentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmitComment();
            }}
          />
          <button 
            onClick={onSubmitComment}
            disabled={!user || !commentInput.trim()}
            className="bg-[#3182f6] text-white px-5 rounded-xl font-bold text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            등록
          </button>
        </div>

        {/* Comment List */}
        <div className="flex flex-col gap-4 mt-2">
          {comments.length > 0 ? (
            <>
              {/* 최신 1개 댓글은 무료 공개 */}
              {comments.slice(0, 1).map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}

              {/* 나머지 댓글: 결제 사용자만 */}
              {comments.length > 1 && (
                isUnlocked ? (
                  comments.slice(1).map(comment => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))
                ) : (
                  <div className="relative">
                    <div className="blur-sm opacity-40 pointer-events-none">
                      {comments.slice(1, 3).map(comment => (
                        <div key={comment.id} className="flex gap-3 bg-[#f9fafb] p-4 rounded-2xl border border-[#e5e8eb] mb-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-[#e5e8eb] shadow-sm flex items-center justify-center shrink-0">
                            <UserCircle size={16} className="text-[#8b95a1]" />
                          </div>
                          <div className="flex-1">
                            <div className="h-3 bg-[#e5e8eb] rounded w-20 mb-2" />
                            <div className="h-3 bg-[#e5e8eb] rounded w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white border border-[#e5e8eb] rounded-2xl px-6 py-4 text-center shadow-lg">
                        <p className="text-[14px] font-bold text-[#191f28] mb-1">🔒 {comments.length - 1}개의 이야기가 더 있습니다</p>
                        <p className="text-[12px] text-[#8b95a1]">프리미엄 구독으로 모든 이야기를 확인하세요</p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </>
          ) : (
            <div className="text-center py-10 text-[#8b95a1] text-[14px]">
              아직 작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Single comment item */
function CommentItem({ comment }: { comment: CommentData }) {
  return (
    <div className="flex gap-3 bg-[#f9fafb] p-4 rounded-2xl border border-[#e5e8eb]">
      <div className="w-8 h-8 rounded-full bg-white border border-[#e5e8eb] shadow-sm flex items-center justify-center shrink-0">
        <UserCircle size={16} className="text-[#8b95a1]" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-[14px] text-[#191f28]">{comment.author}</span>
          <span className="text-[12px] text-[#8b95a1]">{comment.createdAt}</span>
        </div>
        <p className="text-[14px] text-[#4e5968] leading-relaxed break-all whitespace-pre-wrap">{comment.text}</p>
      </div>
    </div>
  );
}
