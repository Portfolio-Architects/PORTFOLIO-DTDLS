'use client';

import { useState, useRef } from 'react';
import { X, Star, Camera, Send } from 'lucide-react';
import { useDashboardData, dashboardFacade } from '@/lib/DashboardFacade';

interface WriteReviewModalProps {
  onClose: () => void;
  userUid: string;
}

export default function WriteReviewModal({ onClose, userUid }: WriteReviewModalProps) {
  const { dongtanApartments } = useDashboardData();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDong, setSelectedDong] = useState('');
  const [selectedApt, setSelectedApt] = useState('');
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const availableDongs = Array.from(
    new Set(dongtanApartments.map(apt => apt.match(/\[(.*?)\]/)?.[1]).filter(Boolean))
  ) as string[];
  const filteredApts = dongtanApartments.filter(apt => apt.includes(`[${selectedDong}]`));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedApt || rating === 0 || !content.trim()) return;
    setIsSubmitting(true);
    try {
      await dashboardFacade.addUserReview(selectedApt, rating, content, userUid, imageFile || undefined);
      onClose();
    } catch {
      // error handled in facade
    } finally {
      setIsSubmitting(false);
    }
  };

  const RATING_EMOJIS = ['😡', '😟', '😐', '🙂', '🤩'];
  const RATING_LABELS = ['별로', '아쉬움', '보통', '좋음', '최고'];
  const RATING_COLORS = ['#EF233C', '#ff6b35', '#ffc233', '#36b37e', '#8D99AE'];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md bg-[#1B2340] rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-extrabold text-[#EDF2F4]">
            {step === 1 ? '어떤 단지인가요?' : '리뷰 작성'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#0E1730] rounded-full transition-colors">
            <X size={20} className="text-[#6B7394]" />
          </button>
        </div>

        {/* Step 1: Select Apartment */}
        {step === 1 && (
          <div>
            {/* Dong chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
              {availableDongs.map(dong => (
                <button
                  key={dong}
                  onClick={() => { setSelectedDong(dong); setSelectedApt(''); }}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all border ${
                    selectedDong === dong
                      ? 'bg-[#EDF2F4] text-[#EDF2F4] border-[#EDF2F4]'
                      : 'bg-[#1B2340] text-[#8D99AE] border-[#2A3558] hover:border-[#8D99AE]'
                  }`}
                >
                  {dong}
                </button>
              ))}
            </div>

            {/* Apartment list */}
            {selectedDong ? (
              <div className="bg-[#141C33] border border-[#2A3558] rounded-xl overflow-hidden max-h-52 overflow-y-auto p-2">
                {filteredApts.map(apt => (
                  <button
                    key={apt}
                    onClick={() => setSelectedApt(apt)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
                      selectedApt === apt
                        ? 'bg-[#141C33] text-[#8D99AE] font-bold'
                        : 'text-[#EDF2F4] hover:bg-[#0E1730]'
                    }`}
                  >
                    {apt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-[#141C33] border border-dashed border-[#2A3558] rounded-xl p-8 text-center text-[13px] text-[#6B7394]">
                위에서 <strong>동 이름</strong>을 선택해주세요
              </div>
            )}

            {/* Next */}
            <button
              onClick={() => selectedApt && setStep(2)}
              disabled={!selectedApt}
              className={`w-full mt-4 py-3.5 rounded-xl font-bold text-[14px] transition-all ${
                selectedApt
                  ? 'bg-[#8D99AE] text-[#EDF2F4] active:scale-[0.98]'
                  : 'bg-[#0E1730] text-[#6B7394] cursor-not-allowed'
              }`}
            >
              다음
            </button>
          </div>
        )}

        {/* Step 2: Rating + Content */}
        {step === 2 && (
          <div>
            {/* Selected apt badge */}
            <div className="bg-[#0E1730] rounded-xl px-4 py-2.5 mb-5 text-[13px] font-bold text-[#8D99AE] truncate">
              📍 {selectedApt}
            </div>

            {/* Emoji Rating */}
            <div className="mb-5">
              <label className="block text-[13px] font-bold text-[#EDF2F4] mb-3">별점을 매겨주세요</label>
              <div className="flex items-center justify-center gap-3">
                {RATING_EMOJIS.map((emoji, idx) => {
                  const r = idx + 1;
                  const isSelected = rating === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRating(isSelected ? 0 : r)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-[24px] transition-all duration-200 ${
                          isSelected
                            ? 'scale-125 shadow-lg ring-2'
                            : rating > 0 && !isSelected
                              ? 'opacity-25 hover:opacity-60'
                              : 'opacity-50 hover:opacity-80 hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${RATING_COLORS[idx]}15` : 'transparent',
                          boxShadow: isSelected ? `0 0 0 2px ${RATING_COLORS[idx]}` : 'none',
                        }}
                      >
                        {emoji}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                        style={{ color: RATING_COLORS[idx] }}
                      >
                        {RATING_LABELS[idx]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-[13px] font-bold text-[#EDF2F4] mb-2">한줄평</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="이 단지에 대한 솔직한 한마디를 남겨주세요"
                rows={3}
                maxLength={200}
                className="w-full bg-[#141C33] border border-[#2A3558] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#8D99AE] focus:bg-[#1B2340] transition-colors resize-none focus:ring-4 focus:ring-[#8D99AE]/10"
              />
              <div className="text-right text-[11px] text-[#6B7394] mt-1">{content.length}/200</div>
            </div>

            {/* Optional Photo */}
            <div className="mb-5">
              <label className="block text-[13px] font-bold text-[#EDF2F4] mb-2">사진 (선택)</label>
              {imagePreview ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#1E2A45]">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-[#EDF2F4]"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0E1730] hover:bg-[#1E2A45] rounded-xl text-[13px] font-bold text-[#8D99AE] transition-colors"
                >
                  <Camera size={16} className="text-[#8D99AE]" />
                  사진 추가
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 rounded-xl font-bold bg-[#0E1730] text-[#8D99AE] active:bg-[#1E2A45] transition-colors text-[14px]"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || !content.trim()}
                className={`flex-1 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${
                  rating > 0 && content.trim()
                    ? 'bg-[#EDF2F4] text-[#EDF2F4] active:scale-[0.98]'
                    : 'bg-[#0E1730] text-[#6B7394] cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '저장 중...' : <><Send size={14} /> 리뷰 등록</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
