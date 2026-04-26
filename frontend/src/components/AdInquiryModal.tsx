'use client';

import { useState } from 'react';
import { X, Send, Building2, User, MessageSquare } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

interface AdInquiryModalProps {
  onClose: () => void;
}

export default function AdInquiryModal({ onClose }: AdInquiryModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactInfo.trim() || !message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'adInquiries'), {
        companyName: companyName.trim(),
        contactInfo: contactInfo.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-body">
          <div className="flex items-center gap-2">
            <Building2 className="text-toss-blue" size={20} />
            <h2 className="text-[18px] font-extrabold text-primary tracking-tight">
              광고 및 제휴 문의
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-body rounded-full transition-colors">
            <X size={20} className="text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 custom-scrollbar">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-toss-blue-light text-toss-blue rounded-full flex items-center justify-center mb-4">
                <Send size={32} />
              </div>
              <h3 className="text-[20px] font-extrabold text-primary mb-2">접수 완료되었습니다!</h3>
              <p className="text-[15px] text-secondary leading-relaxed">
                제안해주셔서 감사합니다.<br />
                내용 확인 후 기재해주신 연락처로<br />
                빠르게 회신 드리겠습니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <p className="text-[14px] text-secondary leading-relaxed mb-1">
                D-VIEW의 프리미엄 유저들에게 귀사의 브랜드를 각인시킬 수 있는 기회를 놓치지 마세요.
              </p>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-primary flex items-center gap-1.5">
                  <Building2 size={14} className="text-tertiary" />
                  회사명 / 담당자명 <span className="text-[#ff3b30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예) 디뷰 / 김디뷰"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-body border border-border rounded-xl text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-toss-blue focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-primary flex items-center gap-1.5">
                  <User size={14} className="text-tertiary" />
                  연락처 / 이메일 <span className="text-[#ff3b30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="회신 받으실 연락처를 남겨주세요."
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-4 py-3 bg-body border border-border rounded-xl text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-toss-blue focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-primary flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-tertiary" />
                  제안 내용 <span className="text-[#ff3b30]">*</span>
                </label>
                <textarea
                  required
                  placeholder="간단한 제안 내용이나 목적을 적어주세요."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-body border border-border rounded-xl text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-toss-blue focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !companyName.trim() || !contactInfo.trim() || !message.trim()}
                  className="w-full bg-toss-blue hover:bg-[#1b64da] disabled:bg-toss-gray text-surface text-[15px] font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      제안서 보내기
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
