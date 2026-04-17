'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, MapPin, X, Building, Info, Map as MapIcon, ShieldAlert, ImagePlus, Star, Zap, RotateCcw, Save } from 'lucide-react';
import { useDashboardData, dashboardFacade, ReportSections } from '@/lib/DashboardFacade';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

const DRAFT_KEY = 'dtdls_report_draft';
const AUTO_SAVE_INTERVAL = 30_000; // 30s

// Rating emoji map
const RATING_EMOJIS = ['😡', '😟', '😐', '🙂', '🤩'] as const;
const RATING_LABELS = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'] as const;
const RATING_COLORS = ['#f04452', '#ff6b35', '#ffc233', '#36b37e', '#3182f6'] as const;

// Auto grade map
function computeAutoGrade(sections: ReportSections): { grade: string; score: number; label: string; color: string } {
  const ratings: number[] = [];
  const infra = sections.infra;
  const eco = sections.ecosystem;
  const loc = sections.location;
  if (infra.gateRating) ratings.push(infra.gateRating);
  if (infra.landscapeRating) ratings.push(infra.landscapeRating);
  if (infra.parkingRating) ratings.push(infra.parkingRating);
  if (infra.maintenanceRating) ratings.push(infra.maintenanceRating);
  if (eco.communityRating) ratings.push(eco.communityRating);
  if (eco.schoolRating) ratings.push(eco.schoolRating);
  if (eco.commerceRating) ratings.push(eco.commerceRating);
  if (loc.trafficRating) ratings.push(loc.trafficRating);
  if (loc.developmentRating) ratings.push(loc.developmentRating);

  if (ratings.length === 0) return { grade: '-', score: 0, label: '평가 미입력', color: '#8b95a1' };

  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const score = Math.round(avg * 20); // 0~100

  if (avg >= 4.5) return { grade: 'S', score, label: '프리미엄 최상급', color: '#3182f6' };
  if (avg >= 3.5) return { grade: 'A', score, label: '우수 단지', color: '#36b37e' };
  if (avg >= 2.5) return { grade: 'B', score, label: '평균 수준', color: '#ffc233' };
  if (avg >= 1.5) return { grade: 'C', score, label: '개선 필요', color: '#ff6b35' };
  return { grade: 'D', score, label: '주의 필요', color: '#f04452' };
}

export default function WriteFieldReport() {
  const router = useRouter();
  const { dongtanApartments } = useDashboardData();
  const [user, setUser] = useState<User | null>(null);

  // Wizard State (1 to 6)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{done: number, total: number} | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Step 1: Info State
  const [selectedDong, setSelectedDong] = useState<string>('');
  const [reportAptName, setReportAptName] = useState('');

  // 6-step deep structured state
  const [sections, setSections] = useState<ReportSections>({
    specs: { builtYear: '', scale: '', farBuild: '', parkingRatio: '' },
    infra: { gateText: '', landscapeText: '', parkingText: '', maintenanceText: '' },
    ecosystem: { communityText: '', schoolText: '', commerceText: '' },
    location: { trafficText: '', developmentText: '' },
    assessment: { alphaDriver: '', systemicRisk: '', synthesis: '', probability: '' }
  });

  // Photo State — multi-image per key
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string[]>>({});

  // Region Derived State
  const availableDongs = Array.from(new Set(dongtanApartments.map(apt => apt.match(/\[(.*?)\]/)?.[1]).filter(Boolean))) as string[];
  const filteredApts = dongtanApartments.filter(apt => apt.includes(`[${selectedDong}]`));

  // -- Auth guard --
  useEffect(() => {
    // Dev mode: skip auth entirely
    if (process.env.NODE_ENV === 'development') {
      setUser({ uid: 'dev-user', email: 'dev@localhost' } as User);
      return;
    }

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

  // -- Draft Recovery Check --
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setShowDraftModal(true);
      }
    } catch { /* noop */ }
  }, []);

  const restoreDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.step) setStep(draft.step);
        if (draft.selectedDong) setSelectedDong(draft.selectedDong);
        if (draft.reportAptName) setReportAptName(draft.reportAptName);
        if (draft.sections) setSections(draft.sections);
        // Note: imageFiles/imagePreviews can't be restored from localStorage (File objects not serializable)
      }
    } catch { /* noop */ }
    setShowDraftModal(false);
  }, []);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
    setShowDraftModal(false);
  }, []);

  // -- Auto Save --
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const draft = { step, selectedDong, reportAptName, sections, savedAt: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      } catch { /* noop */ }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [step, selectedDong, reportAptName, sections]);

  const updateSectionState = (section: keyof ReportSections, field: string, value: string | number) => {
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && !reportAptName) {
      alert("단지를 선택해주세요.");
      return;
    }
    setStep(s => s + 1);
  };

  const handlePrevStep = () => {
    if (step === 1) router.back();
    else setStep(s => s - 1);
  };

  // -- Multi Image Handling --
  const handleMultiImageChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allNew = Array.from(e.target.files);
      // Dedup inside functional update to always use latest state
      setImageFiles(prev => {
        const existing = prev[key] || [];
        const existingSet = new Set(existing.map(f => `${f.name}__${f.size}`));
        const unique = allNew.filter(f => !existingSet.has(`${f.name}__${f.size}`));
        const dupCount = allNew.length - unique.length;
        if (dupCount > 0) setTimeout(() => alert(`중복 사진 ${dupCount}장이 제외되었습니다.`), 0);
        if (unique.length === 0) return prev;
        // Also update previews
        const newPreviews = unique.map(file => URL.createObjectURL(file));
        setImagePreviews(p => ({ ...p, [key]: [...(p[key] || []), ...newPreviews] }));
        return { ...prev, [key]: [...existing, ...unique] };
      });
    }
    e.target.value = '';
  };

  const handleRemoveImage = (key: string, index: number) => {
    setImageFiles(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
    setImagePreviews(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setUploadProgress(null);
    try {
      // Build array of all image entries with category tags
      const imageEntries: {file: File, category: string}[] = [];
      Object.entries(imageFiles).forEach(([key, files]) => {
        files.forEach(file => imageEntries.push({ file, category: key }));
      });

      // Set auto grade
      const gradeInfo = computeAutoGrade(sections);
      const finalSections = {
        ...sections,
        assessment: { ...sections.assessment, autoGrade: gradeInfo.grade }
      };

      const totalImages = imageEntries.length;
      if (totalImages > 0) {
        setUploadProgress({ done: 0, total: totalImages });
      }

      await dashboardFacade.addFieldReport(
        reportAptName,
        finalSections,
        null,
        user.uid,
        imageEntries,
        (done, total) => setUploadProgress({ done, total })
      );
      localStorage.removeItem(DRAFT_KEY);
      alert(`🔥 프로 임장기가 성공적으로 등록되었습니다! (${totalImages}장 업로드)`);
      router.push('/');
    } catch (error) {
       console.error("Submission failed", error);
       alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  // ── Reusable Components ────────────────────────────

  // Emoji Rating Component
  const EmojiRating = ({ section, field, label }: { section: keyof ReportSections, field: string, label: string }) => {
    const value = Number((sections[section] as Record<string, string | number>)[field]) || 0;
    return (
      <div className="mb-4">
        <label className="block text-[13px] font-bold text-[#4e5968] mb-2">{label}</label>
        <div className="flex items-center gap-1.5">
          {RATING_EMOJIS.map((emoji, idx) => {
            const rating = idx + 1;
            const isSelected = value === rating;
            return (
              <button
                key={rating}
                type="button"
                onClick={() => updateSectionState(section, field, isSelected ? 0 : rating)}
                className="relative group flex flex-col items-center"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[22px] transition-all duration-200 ${
                  isSelected 
                    ? 'scale-125 shadow-lg ring-2' 
                    : value > 0 && value !== rating 
                      ? 'opacity-30 hover:opacity-60 hover:scale-105' 
                      : 'opacity-50 hover:opacity-80 hover:scale-110'
                }`}
                  style={{
                    backgroundColor: isSelected ? `${RATING_COLORS[idx]}15` : 'transparent',
                    boxShadow: isSelected ? `0 0 0 2px ${RATING_COLORS[idx]}` : 'none',
                  }}
                >
                  {emoji}
                </div>
                <span className={`text-[10px] font-bold mt-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                  style={{ color: RATING_COLORS[idx] }}
                >
                  {RATING_LABELS[idx]}
                </span>
              </button>
            );
          })}
          {value > 0 && (
            <div className="ml-2 px-2.5 py-1 rounded-full text-[12px] font-extrabold text-white"
              style={{ backgroundColor: RATING_COLORS[value - 1] }}
            >
              {value}/5
            </div>
          )}
        </div>
      </div>
    );
  };

  // Multi Photo Dropzone Component
  const MultiPhotoDropzone = ({ label, apiKey, placeholder }: { label: string, apiKey: string, placeholder: string }) => {
    const previews = imagePreviews[apiKey] || [];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const allNew = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (allNew.length === 0) return;
        setImageFiles(prev => {
          const existing = prev[apiKey] || [];
          const existingSet = new Set(existing.map(f => `${f.name}__${f.size}`));
          const unique = allNew.filter(f => !existingSet.has(`${f.name}__${f.size}`));
          const dupCount = allNew.length - unique.length;
          if (dupCount > 0) setTimeout(() => alert(`중복 사진 ${dupCount}장이 제외되었습니다.`), 0);
          if (unique.length === 0) return prev;
          const newPreviews = unique.map(file => URL.createObjectURL(file));
          setImagePreviews(p => ({ ...p, [apiKey]: [...(p[apiKey] || []), ...newPreviews] }));
          return { ...prev, [apiKey]: [...existing, ...unique] };
        });
      }
    };

    return (
      <div className="mt-3">
        <label className="block text-[13px] font-bold text-[#4e5968] mb-2">{label}</label>

        {/* Grid of existing previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden border border-[#e5e8eb] shadow-sm aspect-square group">
                <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleRemoveImage(apiKey, idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-[#f04452] backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                  title="사진 삭제"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <span className="text-[10px] text-white font-bold">{idx + 1}/{previews.length}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add more photos zone */}
        <div 
          className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer group flex flex-col items-center justify-center py-5 px-4 text-center ${
            isDragging 
              ? 'border-[#3182f6] bg-[#e8f3ff] scale-[1.02]' 
              : 'border-[#d1d6db] bg-[#f9fafb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            multiple 
            capture="environment"
            onChange={handleMultiImageChange(apiKey)} 
            className="hidden" 
          />
          <div className="w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            {isDragging ? <ImagePlus size={18} className="text-[#3182f6]" /> : <Camera size={18} className="text-[#3182f6]" />}
          </div>
          <p className="text-[13px] font-bold text-[#191f28]">
            {previews.length > 0 ? '사진 더 추가하기' : placeholder}
          </p>
          <p className="text-[11px] text-[#8b95a1] mt-0.5">터치하여 촬영 / 여러 장 선택 가능</p>
        </div>
      </div>
    );
  };

  const TextInput = ({ section, field, label, placeholder, isTextarea = false }: { section: keyof ReportSections, field: string, label: string, placeholder: string, isTextarea?: boolean }) => {
    const value = String((sections[section] as Record<string, string | number>)[field] || "");
    return (
      <div className="mb-4">
        <label className="block text-[13px] font-bold text-[#191f28] mb-1.5">{label}</label>
        {isTextarea ? (
          <textarea 
            placeholder={placeholder} value={value} onChange={(e) => updateSectionState(section, field, e.target.value)} rows={2}
            className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#3182f6]/10" 
          />
        ) : (
          <input 
            type="text" placeholder={placeholder} value={value} onChange={(e) => updateSectionState(section, field, e.target.value)}
            className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors focus:ring-4 focus:ring-[#3182f6]/10" 
          />
        )}
      </div>
    );
  }

  const SelectInput = ({ section, field, label, options }: { section: keyof ReportSections, field: string, label: string, options: {value: string, label: string}[] }) => {
    const value = String((sections[section] as Record<string, string | number>)[field] || "");
    return (
      <div className="mb-4">
        <label className="block text-[13px] font-bold text-[#191f28] mb-1.5">{label}</label>
        <select 
          value={value} 
          onChange={(e) => updateSectionState(section, field, e.target.value)}
          className={`w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors cursor-pointer appearance-none ${value ? 'text-[#191f28] font-medium' : 'text-[#8b95a1]'}`}
        >
          <option value="" disabled>선택해주세요</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="text-[#191f28]">{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (!user) return null;

  const gradeInfo = computeAutoGrade(sections);

  return (
    <div className="min-h-screen bg-[#f2f4f6] pb-24">
      {/* Draft Recovery Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-[#e8f3ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={22} className="text-[#3182f6]" />
            </div>
            <h3 className="text-[18px] font-extrabold text-[#191f28] text-center mb-2">작성 중인 임장기가 있어요</h3>
            <p className="text-[14px] text-[#4e5968] text-center mb-6">이전에 작성하던 내용을 이어서 작성하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={clearDraft} className="flex-1 py-3 rounded-xl font-bold bg-[#f2f4f6] text-[#4e5968] active:bg-[#e5e8eb] transition-colors text-[14px]">
                새로 작성
              </button>
              <button onClick={restoreDraft} className="flex-1 py-3 rounded-xl font-bold bg-[#3182f6] text-white active:scale-[0.98] transition-transform text-[14px]">
                이어서 작성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white sticky top-0 z-10 border-b border-[#e5e8eb] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handlePrevStep} className="text-[#191f28] hover:bg-[#f2f4f6] p-1.5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[16px] font-bold text-[#191f28]">현장 임장기 작성</h1>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <div className="flex items-center gap-1 text-[11px] text-[#36b37e] font-bold">
              <Save size={12} />
              {lastSaved}
            </div>
          )}
          <div className="text-[12px] font-bold text-[#8b95a1] bg-[#f9fafb] px-3 py-1 rounded-full border border-[#e5e8eb]">
            {step} <span className="text-[#d1d6db]">/ 6</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#e5e8eb] h-1.5">
        <div className="bg-[#3182f6] h-full transition-all duration-300 ease-out rounded-r-full" style={{ width: `${(step / 6) * 100}%` }} />
      </div>

      <main className="max-w-xl mx-auto p-4 md:p-6 mt-2">
        
        {/* ── Step 1: Region & Apartment ── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 px-1">
              <h2 className="text-[22px] font-extrabold text-[#191f28] leading-tight mb-2">어떤 단지를<br/>다녀오셨나요?</h2>
              <p className="text-[13px] text-[#4e5968]">사는 동네를 먼저 고른 뒤, 단지를 골라주세요.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb]">
              <label className="block text-[13px] font-bold text-[#191f28] mb-3 flex items-center gap-1.5"><MapPin size={15} className="text-[#3182f6]" /> 다녀오신 아파트를 선택해주세요</label>
              {dongtanApartments.length === 0 ? (
                <div className="bg-[#f2f4f6] rounded-xl p-8 flex flex-col items-center justify-center text-center animate-pulse border border-[#e5e8eb]"><div className="w-8 h-8 rounded-full border-2 border-[#3182f6] border-t-transparent animate-spin mb-3"></div><p className="text-[13px] font-bold text-[#4e5968]">단지 목록 가져오는 중...</p></div>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar mb-3">
                    {availableDongs.map(dong => (
                      <button key={dong} onClick={() => { setSelectedDong(dong); setReportAptName(''); }} className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all border ${selectedDong === dong ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{dong}</button>
                    ))}
                  </div>
                  {selectedDong && (
                    <div className="bg-[#f9fafb] border border-[#d1d6db] rounded-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar p-2">
                      {filteredApts.map(apt => (
                        <button key={apt} onClick={() => setReportAptName(apt)} className={`w-full text-left px-4 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${reportAptName === apt ? 'bg-[#e8f3ff] text-[#3182f6] font-bold' : 'text-[#191f28] hover:bg-[#f2f4f6]'}`}>{apt}</button>
                      ))}
                    </div>
                  )}
                  {!selectedDong && <div className="bg-[#f9fafb] border border-dashed border-[#d1d6db] rounded-xl p-4 text-center text-[12px] text-[#8b95a1]">위에서 <strong>'동네 명'</strong>을 골라주세요.</div>}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Specs ── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
              <h2 className="text-[22px] font-extrabold text-[#191f28] leading-tight mb-2">단지의 기본 정보를<br/>입력해주세요</h2>
              <p className="text-[13px] text-[#4e5968]">{reportAptName}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb]">
               <SelectInput section="specs" field="builtYear" label="준공 연월 (연차)" options={[
                 { value: "신축 (5년 이내)", label: "신축 (5년 이내)" },
                 { value: "준신축 (5~10년)", label: "준신축 (5~10년)" },
                 { value: "구축 (10~20년)", label: "구축 (10~20년)" },
                 { value: "노후 (20년 이상)", label: "노후 (20년 이상)" },
                 { value: "재건축/리모델링 대상", label: "재건축/리모델링 대상" }
               ]} />
               <SelectInput section="specs" field="scale" label="규모 (세대수/동수)" options={[
                 { value: "소단지 (500세대 미만)", label: "소단지 (500세대 미만)" },
                 { value: "중형단지 (500~1,000세대)", label: "중형단지 (500~1,000세대)" },
                 { value: "대단지 (1,000~2,000세대)", label: "대단지 (1,000~2,000세대)" },
                 { value: "매머드급 (2,000세대 이상)", label: "매머드급 (2,000세대 이상)" }
               ]} />
               <SelectInput section="specs" field="farBuild" label="용적률 / 건폐율 (쾌적성)" options={[
                 { value: "매우 쾌적 (동간 거리 넓음)", label: "매우 쾌적 (동간 거리 넓음)" },
                 { value: "쾌적 (표준적인 동간 거리)", label: "쾌적 (표준적인 동간 거리)" },
                 { value: "보통 (일반적인 수준)", label: "보통 (일반적인 수준)" },
                 { value: "다소 답답 (동간 거리 좁음)", label: "다소 답답 (동간 거리 좁음)" }
               ]} />
               <SelectInput section="specs" field="parkingRatio" label="세대당 주차 대수 (지하 비율)" options={[
                 { value: "주차 지옥 (1.0대 미만)", label: "주차 지옥 (1.0대 미만)" },
                 { value: "다소 혼잡 (1.0~1.2대)", label: "다소 혼잡 (1.0~1.2대)" },
                 { value: "보통 (1.2~1.4대)", label: "보통 (1.2~1.4대)" },
                 { value: "여유 (1.5대 이상)", label: "여유 (1.5대 이상)" },
                 { value: "매우 여유 (2.0대 이상)", label: "매우 여유 (2.0대 이상)" }
               ]} />
            </div>
          </div>
        )}

        {/* ── Step 3: Physical Infrastructure (Ratings + Multi-Photos) ── */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[22px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><Building className="text-[#3182f6]"/> 단지 내부 살펴보기</h2>
               <p className="text-[13px] text-[#4e5968]">이모지를 눌러 빠르게 점수를 매기고, 사진을 여러 장 찍어주세요.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb] flex flex-col gap-6">
               {/* Gate */}
               <div className="pb-5 border-b border-[#f2f4f6]">
                 <EmojiRating section="infra" field="gateRating" label="🚪 진입로 및 정문" />
                 <TextInput section="infra" field="gateText" label="" placeholder="차량 진출입이 편한가요? 문주의 규모는?" isTextarea />
                 <MultiPhotoDropzone label="📸 정문 사진" apiKey="gateImg" placeholder="정문 사진 촬영/선택" />
               </div>
               {/* Landscape */}
               <div className="pb-5 border-b border-[#f2f4f6]">
                 <EmojiRating section="infra" field="landscapeRating" label="🌳 조경 및 지형" />
                 <TextInput section="infra" field="landscapeText" label="" placeholder="지상 차량 유무, 경사(언덕) 처리는?" isTextarea />
                 <MultiPhotoDropzone label="📸 조경/광장 사진" apiKey="landscapeImg" placeholder="조경 사진 촬영/선택" />
               </div>
               {/* Parking */}
               <div className="pb-5 border-b border-[#f2f4f6]">
                 <EmojiRating section="infra" field="parkingRating" label="🅿️ 지하 주차장" />
                 <TextInput section="infra" field="parkingText" label="" placeholder="택배차량 진입 가능 층고? 주차 공간 넓이?" isTextarea />
                 <MultiPhotoDropzone label="📸 주차장 사진" apiKey="parkingImg" placeholder="주차장 사진 촬영/선택" />
               </div>
               {/* Maintenance */}
               <div>
                 <EmojiRating section="infra" field="maintenanceRating" label="🧹 현관 및 분리수거장" />
                 <TextInput section="infra" field="maintenanceText" label="" placeholder="분리수거장 청결도? 로비 보안 수준?" isTextarea />
                 <MultiPhotoDropzone label="📸 공용부 사진" apiKey="maintenanceImg" placeholder="공용부 사진 촬영/선택" />
               </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Ecosystem ── */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[22px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><Info className="text-[#03c75a]"/> 주변 생활 편의시설</h2>
               <p className="text-[13px] text-[#4e5968]">커뮤니티, 학군, 상권을 이모지로 빠르게 평가해주세요.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb] flex flex-col gap-6">
               <div className="pb-5 border-b border-[#f2f4f6]">
                 <EmojiRating section="ecosystem" field="communityRating" label="🏊 커뮤니티 센터" />
                 <TextInput section="ecosystem" field="communityText" label="" placeholder="골프장, 수영장, 조식 서비스 등 눈에 띄는 시설?" isTextarea />
                 <MultiPhotoDropzone label="📸 커뮤니티 사진" apiKey="communityImg" placeholder="커뮤니티 사진 촬영/선택" />
               </div>
               <div className="pb-5 border-b border-[#f2f4f6]">
                 <EmojiRating section="ecosystem" field="schoolRating" label="🎒 학군 및 통학로" />
                 <TextInput section="ecosystem" field="schoolText" label="" placeholder="초등학교까지 도로 횡단 여부? 초품아?" isTextarea />
                 <MultiPhotoDropzone label="📸 통학로 사진" apiKey="schoolImg" placeholder="통학로 사진 촬영/선택" />
               </div>
               <div>
                 <EmojiRating section="ecosystem" field="commerceRating" label="🏪 동네 상권" />
                 <TextInput section="ecosystem" field="commerceText" label="" placeholder="단지 내 상가에 학원이나 병원이 갖춰져 있나요?" isTextarea />
                 <MultiPhotoDropzone label="📸 상권 사진" apiKey="commerceImg" placeholder="상가 사진 촬영/선택" />
               </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Location ── */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[22px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><MapIcon className="text-[#a46cfd]"/> 교통과 거시 입지</h2>
               <p className="text-[13px] text-[#4e5968]">강남 출퇴근과 대형 호재를 평가해주세요.</p>
            </div>
             <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb] flex flex-col gap-6">
               <div className="pb-5 border-b border-[#f2f4f6]">
                 <EmojiRating section="location" field="trafficRating" label="🚇 교통망 접근성" />
                 <TextInput section="location" field="trafficText" label="" placeholder="GTX-A/SRT역 도보 시간, 강남(GBD)까지 실소요시간 등" isTextarea />
               </div>
               <div>
                 <EmojiRating section="location" field="developmentRating" label="🏗️ 주요 개발 호재" />
                 <TextInput section="location" field="developmentText" label="" placeholder="GTX 신설, 정비 사업 등 (확정되지 않은 썰은 주의!)" isTextarea />
               </div>
             </div>
          </div>
        )}

        {/* ── Step 6: Assessment + Auto Grade ── */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[22px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><ShieldAlert className="text-[#f04452]"/> 최종 평가</h2>
               <p className="text-[13px] text-[#4e5968]">현장에서 느낀 장단점을 정리해주세요.</p>
            </div>

            {/* Auto-Generated Grade Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb] mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-[#3182f6]" />
                <p className="text-[13px] font-bold text-[#4e5968]">이모지 평가 기반 자동 산출 등급</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[28px] font-black text-white shadow-lg"
                  style={{ backgroundColor: gradeInfo.color }}
                >
                  {gradeInfo.grade}
                </div>
                <div>
                  <p className="text-[18px] font-extrabold text-[#191f28]">{gradeInfo.label}</p>
                  <p className="text-[13px] text-[#8b95a1]">종합 점수 {gradeInfo.score}점 / 100점</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb]">
               <TextInput section="assessment" field="alphaDriver" label="💎 이 단지의 핵심 장점" placeholder="예: 남향 위주, 초품아, 조경이 아파트 중 최고 등" isTextarea />
               <TextInput section="assessment" field="systemicRisk" label="⚠️ 주의할 단점" placeholder="예: 언덕 지형, 주차 부족, 향후 대규모 분양 예정 등" isTextarea />
               <TextInput section="assessment" field="synthesis" label="📊 종합 결론" placeholder="장단점을 종합해봤을 때, 이 단지 살 만한가요?" isTextarea />
               <TextInput section="assessment" field="probability" label="📈 향후 가격 전망" placeholder="예: 1년 내 가격이 오를 것 같다 / 보합세 / 하락 위험 등" isTextarea />
            </div>
          </div>
        )}

      </main>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#e5e8eb] shadow-lg flex gap-3 z-20">
        {step > 1 && (
           <button onClick={handlePrevStep} className="w-1/3 py-3.5 rounded-xl font-bold bg-[#f2f4f6] text-[#4e5968] active:bg-[#e5e8eb] transition-colors text-[14px]">
              이전
           </button>
        )}
        <button
          type="button"
          onClick={() => {
            try {
              const draft = { step, selectedDong, reportAptName, sections, savedAt: Date.now() };
              localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
              setLastSaved(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
              alert('✅ 임시 저장되었습니다!');
            } catch {
              alert('임시 저장에 실패했습니다.');
            }
          }}
          className="py-3.5 px-4 rounded-xl font-bold bg-[#f2f4f6] text-[#4e5968] active:bg-[#e5e8eb] transition-colors text-[14px]"
        >
          💾 저장
        </button>
        {step < 6 ? (
           <button onClick={handleNextStep} className="flex-1 py-3.5 rounded-xl font-bold bg-[#3182f6] text-white active:scale-[0.98] transition-transform text-[14px]">
              다음 단계로
           </button>
        ) : (
           <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3.5 rounded-xl font-bold bg-[#191f28] text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-[14px]">
               {isSubmitting ? (uploadProgress ? `📤 ${uploadProgress.done}/${uploadProgress.total}장 업로드 중...` : '서버에 저장 중...') : '🔥 최종 제출하기'}
           </button>
        )}
      </div>

    </div>
  );
}
