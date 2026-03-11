'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, MapPin, Star, AlertCircle, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { useDashboardData, dashboardFacade } from '@/lib/DashboardFacade';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function WriteFieldReport() {
  const router = useRouter();
  const { dongtanApartments } = useDashboardData();
  const [user, setUser] = useState<User | null>(null);

  // Wizard State
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Info State
  const [selectedDong, setSelectedDong] = useState<string>('');
  const [reportAptName, setReportAptName] = useState('');
  const [reportPros, setReportPros] = useState('');
  const [reportCons, setReportCons] = useState('');
  const [reportRating, setReportRating] = useState(5);

  // Step 2: Evidence State (Photo)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Region Derived State
  const availableDongs = Array.from(new Set(dongtanApartments.map(apt => apt.match(/\[(.*?)\]/)?.[1]).filter(Boolean))) as string[];
  const filteredApts = dongtanApartments.filter(apt => apt.includes(`[${selectedDong}]`));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("로그인이 필요한 페이지입니다.");
        router.push('/');
      } else if (!dashboardFacade.isAdmin(currentUser.email)) {
        alert("관리자 전용 기능입니다.");
        router.push('/');
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleNextStep = () => {
    if (!reportAptName.trim() || !reportPros.trim() || !reportCons.trim()) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }
    setStep(2);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!user) return;
    // Enforce photo for SoCar-like strictness
    if (!imageFile) {
      alert("현장 신뢰도를 위해 최소 1장의 현장 사진(인증샷)을 첨부해주세요.");
      return;
    }

    setIsSubmitting(true);
    // Note: Since Storage might still be blocked, the Facade will handle the upload.
    // If upload fails in Facade, it might throw or gracefully fallback depending on implementation.
    // Currently, addFieldReport doesn't take an image parameter, so we need to update it.
    try {
      await dashboardFacade.addFieldReport(reportAptName, reportPros, reportCons, reportRating, user.uid, imageFile);
      alert("🔥 임장기가 성공적으로 등록되었습니다!");
      router.push('/');
    } catch (error) {
       console.error("Submission failed", error);
       alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null; // Or a loading spinner

  return (
    <div className="min-h-screen bg-[#f2f4f6] pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 border-b border-[#e5e8eb] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 1 ? router.back() : setStep(1)} className="text-[#191f28] hover:bg-[#f2f4f6] p-1.5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[18px] font-bold text-[#191f28]">현장 임장기 작성</h1>
        </div>
        <div className="text-[13px] font-bold text-[#8b95a1] bg-[#f9fafb] px-3 py-1 rounded-full">
          {step} / 2 단계
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#e5e8eb] h-1">
        <div 
          className="bg-[#3182f6] h-full transition-all duration-300 ease-out" 
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      <main className="max-w-xl mx-auto p-4 md:p-6 mt-4">
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2">어떤 단지를<br/>다녀오셨나요?</h2>
              <p className="text-[14px] text-[#4e5968]">생생한 현장의 목소리를 들려주세요.</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb] flex flex-col gap-6">
              
              {/* Layout: Region-Based Apartment Selection */}
              <div>
                <label className="block text-[14px] font-bold text-[#191f28] mb-3 flex items-center gap-1.5">
                  <MapPin size={16} className="text-[#3182f6]" /> 다녀오신 아파트를 선택해주세요 (필수)
                </label>
                
                {dongtanApartments.length === 0 ? (
                  <div className="bg-[#f2f4f6] rounded-xl p-8 flex flex-col items-center justify-center text-center animate-pulse border border-[#e5e8eb] mb-2">
                    <div className="w-8 h-8 rounded-full border-2 border-[#3182f6] border-t-transparent animate-spin mb-3"></div>
                    <p className="text-[14px] font-bold text-[#4e5968]">우리 동네 단지 목록을<br/>가져오고 있어요...</p>
                    <p className="text-[12px] text-[#8b95a1] mt-1">조금만 기다려주세요!</p>
                  </div>
                ) : (
                  <>
                    {/* 1. Dong Selector (Horizontal Scroll) */}
                    <div className="mb-4">
                      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {availableDongs.map(dong => (
                          <button
                            key={dong}
                            onClick={() => {
                              setSelectedDong(dong);
                              setReportAptName(''); // Reset apt on dong change
                            }}
                            className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold transition-all border ${
                              selectedDong === dong 
                                ? 'bg-[#191f28] text-white border-[#191f28] shadow-md' 
                                : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6] hover:text-[#3182f6]'
                            }`}
                          >
                            {dong}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Apartment Selector (Vertical List) */}
                    {selectedDong && (
                      <div className="bg-[#f9fafb] border border-[#d1d6db] rounded-xl overflow-hidden mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {filteredApts.length > 0 ? (
                          <ul className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                            {filteredApts.map(apt => (
                              <li key={apt}>
                                <button
                                  onClick={() => setReportAptName(apt)}
                                  className={`w-full text-left px-4 py-3 text-[14px] font-medium rounded-lg transition-colors ${
                                    reportAptName === apt
                                      ? 'bg-[#e8f3ff] text-[#3182f6] font-bold'
                                      : 'text-[#191f28] hover:bg-[#f2f4f6]'
                                  }`}
                                >
                                  {apt}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-6 text-center text-[#8b95a1] text-[13px]">이 동네에는 아직 등록된 단지가 없어요.</div>
                        )}
                      </div>
                    )}

                    {!selectedDong && (
                      <div className="bg-[#f9fafb] border border-dashed border-[#d1d6db] rounded-xl p-4 text-center text-[13px] text-[#8b95a1] mb-2">
                        위에서 먼저 <strong>'동네 이름'</strong>을 골라주세요!
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-start gap-1.5 mt-3 bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0]">
                  <CheckCircle2 size={16} className="text-[#03c75a] mt-0.5 shrink-0" />
                  <p className="text-[13px] text-[#03c75a] font-bold leading-snug">
                    정확한 정보를 위해 지도에 등록된 실제 아파트 이름만 선택할 수 있어요.
                  </p>
                </div>
              </div>

              {/* Pros */}
              <div>
                <label className="block text-[14px] font-bold text-[#191f28] mb-2">👍 가장 만족스러웠던 점 (필수)</label>
                <textarea 
                  placeholder="교통, 학군, 상권, 조경 등 단지의 특장점을 자세히 적어주세요." 
                  value={reportPros} 
                  onChange={(e) => setReportPros(e.target.value)} 
                  rows={4} 
                  className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3.5 text-[14px] outline-none focus:border-[#03c75a] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#03c75a]/10" 
                />
              </div>

              {/* Cons */}
              <div>
                <label className="block text-[14px] font-bold text-[#191f28] mb-2">👎 아쉽거나 주의할 점 (필수)</label>
                <textarea 
                  placeholder="소음, 주차난, 언덕 등 객관적인 아쉬운 점을 남겨주세요." 
                  value={reportCons} 
                  onChange={(e) => setReportCons(e.target.value)} 
                  rows={4} 
                  className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3.5 text-[14px] outline-none focus:border-[#f04452] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#f04452]/10" 
                />
              </div>

              {/* Rating */}
              <div className="pt-2 border-t border-[#f2f4f6]">
                <label className="block text-[14px] font-bold text-[#191f28] mb-3 flex items-center gap-1.5">
                  <Star size={16} className="text-[#ffc107] fill-[#ffc107]" /> 단지 총평 (추천도)
                </label>
                <div className="flex items-center justify-between bg-[#f9fafb] p-3 rounded-xl border border-[#e5e8eb]">
                  <span className="text-[13px] font-semibold text-[#8b95a1]">별점을 선택해주세요</span>
                  <select 
                    value={reportRating} 
                    onChange={(e) => setReportRating(Number(e.target.value))} 
                    className="bg-white border border-[#d1d6db] rounded-lg px-3 py-2 text-[14px] font-bold outline-none cursor-pointer text-[#191f28]"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5점 (강력 추천)</option>
                    <option value={4}>⭐⭐⭐⭐ 4점 (추천)</option>
                    <option value={3}>⭐⭐⭐ 3점 (보통)</option>
                    <option value={2}>⭐⭐ 2점 (글쎄요)</option>
                    <option value={1}>⭐ 1점 (비추천)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Sticky Bottom Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#e5e8eb] z-20 md:static md:bg-transparent md:border-t-0 md:p-0 md:mt-6">
              <button 
                onClick={handleNextStep}
                className="w-full bg-[#3182f6] hover:bg-[#1b64da] text-white text-[16px] font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-[#3182f6]/20"
              >
                다음: 현장 인증하기
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="mb-8">
              <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2">현장 인증 사진을<br/>등록해주세요 📸</h2>
              <p className="text-[14px] text-[#4e5968]">신뢰도 높은 정보를 위해 진짜 다녀온 사진이 필요해요.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb]">
              
              <div className="flex items-start gap-2.5 mb-6 bg-[#fff5f5] p-3.5 rounded-xl border border-[#ffebec]">
                  <AlertCircle size={18} className="text-[#f04452] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[13px] font-bold text-[#f04452] mb-1">인증 가이드라인</h4>
                    <p className="text-[12px] text-[#4e5968] leading-relaxed">
                      단지 정문, 조경, 놀이터, 주차장 등 <b>직접 찍은 현장 사진</b>을 1장 이상 꼭 첨부해주세요. (인터넷 펌 사진은 무통보 삭제될 수 있습니다.)
                    </p>
                  </div>
              </div>

              {/* Photo Upload Area */}
              {!imagePreview ? (
                <div className="relative border-2 border-dashed border-[#d1d6db] rounded-2xl bg-[#f9fafb] hover:bg-[#f2f4f6] transition-colors cursor-pointer group flex flex-col items-center justify-center py-16 px-4 text-center">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera size={28} className="text-[#3182f6]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#191f28] mb-1">여기를 눌러 사진 올리기</h3>
                  <p className="text-[13px] text-[#8b95a1]">또는 앨범에서 사진을 선택하세요.</p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-[#e5e8eb] shadow-sm">
                  <img src={imagePreview} alt="Preview" className="w-full h-auto aspect-video object-cover" />
                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/50 to-transparent flex justify-between items-center">
                    <span className="text-white text-[12px] font-bold px-2 py-1 bg-black/30 rounded-full backdrop-blur-sm">현장 인증 완료 📸</span>
                    <button 
                      onClick={handleRemoveImage}
                      className="w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#e5e8eb] z-20 md:static md:bg-transparent md:border-t-0 md:p-0 md:mt-6 flex flex-col gap-3">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !imageFile}
                className="w-full bg-[#191f28] hover:bg-black text-white text-[16px] font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-black/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? '데이터 안전하게 등록 중...' : '🔥 이대로 임장기 완벽 등록!'}
              </button>
              
              <p className="text-center text-[11px] text-[#8b95a1] md:hidden">등록 시 <span className="underline">커뮤니티 이용규칙</span>에 동의하는 것으로 간주됩니다.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
