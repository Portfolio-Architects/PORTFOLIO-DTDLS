'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft, MapPin, AlertCircle, CheckCircle2, X, Building, Car, Info, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { useDashboardData, dashboardFacade, ReportSections } from '@/lib/DashboardFacade';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function WriteFieldReport() {
  const router = useRouter();
  const { dongtanApartments } = useDashboardData();
  const [user, setUser] = useState<User | null>(null);

  // Wizard State (1 to 6)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Photo State
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

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

  const updateSectionState = (section: keyof ReportSections, field: string, value: string) => {
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

  const handleImageChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFiles(prev => ({ ...prev, [key]: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (key: string) => {
    setImageFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
    setImagePreviews(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await dashboardFacade.addFieldReport(reportAptName, sections, null, user.uid, imageFiles);
      alert("🔥 프로 임장기가 성공적으로 등록되었습니다!");
      router.push('/');
    } catch (error) {
       console.error("Submission failed", error);
       alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper component for SoCar style photo dropzone
  const PhotoDropzone = ({ label, apiKey, placeholder, required }: { label: string, apiKey: string, placeholder: string, required?: boolean }) => {
    const preview = imagePreviews[apiKey];
    return (
      <div className="mt-3">
        <label className="block text-[13px] font-bold text-[#4e5968] mb-2">{label} {required && <span className="text-[#f04452]">*</span>}</label>
        {!preview ? (
          <div className="relative border-2 border-dashed border-[#d1d6db] rounded-xl bg-[#f9fafb] hover:bg-[#f2f4f6] transition-colors cursor-pointer group flex flex-col items-center justify-center py-6 px-4 text-center">
            <input type="file" accept="image/*" onChange={handleImageChange(apiKey)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Camera size={20} className="text-[#3182f6]" />
            </div>
            <p className="text-[14px] font-bold text-[#191f28]">{placeholder}</p>
          </div>
        ) : (
           <div className="relative rounded-xl overflow-hidden border border-[#e5e8eb] shadow-sm aspect-video">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => handleRemoveImage(apiKey)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                title="사진 삭제"
              >
                <X size={14} />
              </button>
           </div>
        )}
      </div>
    );
  };

  const TextInput = ({ section, field, label, placeholder, isTextarea = false }: { section: keyof ReportSections, field: string, label: string, placeholder: string, isTextarea?: boolean }) => {
    const value = (sections[section] as any)[field] || '';
    return (
      <div className="mb-5">
        <label className="block text-[14px] font-bold text-[#191f28] mb-2">{label}</label>
        {isTextarea ? (
          <textarea 
            placeholder={placeholder} value={value} onChange={(e) => updateSectionState(section, field, e.target.value)} rows={3}
            className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#3182f6]/10" 
          />
        ) : (
          <input 
            type="text" placeholder={placeholder} value={value} onChange={(e) => updateSectionState(section, field, e.target.value)}
            className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors focus:ring-4 focus:ring-[#3182f6]/10" 
          />
        )}
      </div>
    );
  }

  const SelectInput = ({ section, field, label, options }: { section: keyof ReportSections, field: string, label: string, options: {value: string, label: string}[] }) => {
    const value = (sections[section] as any)[field] || '';
    return (
      <div className="mb-5">
        <label className="block text-[14px] font-bold text-[#191f28] mb-2">{label}</label>
        <select 
          value={value} 
          onChange={(e) => updateSectionState(section, field, e.target.value)}
          className={`w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors cursor-pointer appearance-none ${value ? 'text-[#191f28] font-medium' : 'text-[#8b95a1]'}`}
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

  return (
    <div className="min-h-screen bg-[#f2f4f6] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 border-b border-[#e5e8eb] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handlePrevStep} className="text-[#191f28] hover:bg-[#f2f4f6] p-1.5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-[17px] font-bold text-[#191f28]">현장 임장기 작성</h1>
        </div>
        <div className="text-[12px] font-bold text-[#8b95a1] bg-[#f9fafb] px-3 py-1 rounded-full border border-[#e5e8eb]">
          단계 {step} <span className="text-[#d1d6db]">/ 6</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#e5e8eb] h-1.5">
        <div className="bg-[#3182f6] h-full transition-all duration-300 ease-out rounded-r-full" style={{ width: `${(step / 6) * 100}%` }} />
      </div>

      <main className="max-w-xl mx-auto p-4 md:p-6 mt-2">
        
        {/* Step 1: Region & Apartment Map */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 px-1">
              <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2">어떤 단지를<br/>다녀오셨나요?</h2>
              <p className="text-[14px] text-[#4e5968]">사는 동네를 먼저 고른 뒤, 단지를 골라주세요.</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8eb]">
              <label className="block text-[14px] font-bold text-[#191f28] mb-3 flex items-center gap-1.5"><MapPin size={16} className="text-[#3182f6]" /> 다녀오신 아파트를 선택해주세요</label>
              {dongtanApartments.length === 0 ? (
                <div className="bg-[#f2f4f6] rounded-xl p-8 flex flex-col items-center justify-center text-center animate-pulse border border-[#e5e8eb]"><div className="w-8 h-8 rounded-full border-2 border-[#3182f6] border-t-transparent animate-spin mb-3"></div><p className="text-[14px] font-bold text-[#4e5968]">단지 목록 가져오는 중...</p></div>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar mb-3">
                    {availableDongs.map(dong => (
                      <button key={dong} onClick={() => { setSelectedDong(dong); setReportAptName(''); }} className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold transition-all border ${selectedDong === dong ? 'bg-[#191f28] text-white border-[#191f28]' : 'bg-white text-[#4e5968] border-[#d1d6db] hover:border-[#3182f6]'}`}>{dong}</button>
                    ))}
                  </div>
                  {selectedDong && (
                    <div className="bg-[#f9fafb] border border-[#d1d6db] rounded-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar p-2">
                      {filteredApts.map(apt => (
                        <button key={apt} onClick={() => setReportAptName(apt)} className={`w-full text-left px-4 py-3 text-[14px] font-medium rounded-lg transition-colors ${reportAptName === apt ? 'bg-[#e8f3ff] text-[#3182f6] font-bold text[15px]' : 'text-[#191f28] hover:bg-[#f2f4f6]'}`}>{apt}</button>
                      ))}
                    </div>
                  )}
                  {!selectedDong && <div className="bg-[#f9fafb] border border-dashed border-[#d1d6db] rounded-xl p-4 text-center text-[13px] text-[#8b95a1]">위에서 <strong>'동네 명'</strong>을 골라주세요.</div>}
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Specs */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
              <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2">단지의 기본 정보를<br/>입력해주세요</h2>
              <p className="text-[14px] text-[#4e5968]">{reportAptName}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e8eb]">
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

        {/* Step 3: Physical Infrastructure (Photos) */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><Building className="text-[#3182f6]"/> 단지 내부 살펴보기</h2>
               <p className="text-[14px] text-[#4e5968]">단지의 첫인상과 인프라를 촬영해주세요.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e8eb] flex flex-col gap-8">
               <div>
                 <TextInput section="infra" field="gateText" label="진입로 및 정문 (Gate)" placeholder="차량 진출입이 편한가요? 문주의 규모는 어떤가요?" isTextarea />
                 <PhotoDropzone label="📸 정문 도보 출입구 인증" apiKey="gateImg" placeholder="정문 사진 업로드" />
               </div>
               <div>
                 <TextInput section="infra" field="landscapeText" label="조경 및 지형 (Landscaping)" placeholder="지상엔 차가 아예 없나요? 경사(언덕)는 어떻게 극복했나요?" isTextarea />
                 <PhotoDropzone label="📸 중앙 광장 및 주요 식재 인증" apiKey="landscapeImg" placeholder="광장/정원 사진 업로드" />
               </div>
               <div>
                 <TextInput section="infra" field="parkingText" label="지하 보행 및 주차장 (Parking)" placeholder="택배차량이 진입 가능하게 층고가 높나요? 주차 공간은 넓나요?" isTextarea />
                 <PhotoDropzone label="📸 지하 주차장 입구/내부 인증" apiKey="parkingImg" placeholder="주차장 사진 업로드" />
               </div>
               <div>
                 <TextInput section="infra" field="maintenanceText" label="현관 및 분리수거장 (Maintenance)" placeholder="분리수거장은 깔끔한가요? 로비 보안은 철저한가요?" isTextarea />
                 <PhotoDropzone label="📸 분리수거장 또는 로비 인증" apiKey="maintenanceImg" placeholder="공용부 사진 업로드" />
               </div>
            </div>
          </div>
        )}

        {/* Step 4: Ecosystem */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><Info className="text-[#03c75a]"/> 주변 생활 편의시설</h2>
               <p className="text-[14px] text-[#4e5968]">커뮤니티와 학군, 골목 상권을 평가해주세요.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e8eb] flex flex-col gap-8">
               <div>
                 <TextInput section="ecosystem" field="communityText" label="커뮤니티 센터 (Community)" placeholder="골프장, 수영장, 조식 서비스 등 눈에 띄는 시설이 있나요?" isTextarea />
                 <PhotoDropzone label="📸 커뮤니티 전면부/안내도 인증" apiKey="communityImg" placeholder="커뮤니티 사진 업로드" />
               </div>
               <div>
                 <TextInput section="ecosystem" field="schoolText" label="학군 및 통학로 (School)" placeholder="가까운 초등학교까지 도로를 건너야 하나요? (초품아 여부)" isTextarea />
                 <PhotoDropzone label="📸 단지에서 학교 가는 길 인증" apiKey="schoolImg" placeholder="통학로 사진 업로드" />
               </div>
               <div>
                 <TextInput section="ecosystem" field="commerceText" label="동네 상권 (Commerce)" placeholder="단지 내 상가에 학원이나 병원이 잘 갖춰져 있나요?" isTextarea />
                 <PhotoDropzone label="📸 단지 인접 상권 전경 인증" apiKey="commerceImg" placeholder="상가 사진 업로드" />
               </div>
            </div>
          </div>
        )}

        {/* Step 5: Location */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><MapIcon className="text-[#a46cfd]"/> 교통과 거시 입지</h2>
               <p className="text-[14px] text-[#4e5968]">강남 출퇴근과 대형 호재들을 짚어주세요.</p>
            </div>
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e8eb]">
               <TextInput section="location" field="trafficText" label="교통망 접근성" placeholder="지하철역 도보 소요 시간, 강남(GBD)까지 실 소요시간 등" isTextarea />
               <TextInput section="location" field="developmentText" label="주요 개발 호재" placeholder="GTX 신설, 인근 정비 사업 등 (확정되지 않은 썰은 주의해주세요!)" isTextarea />
            </div>
          </div>
        )}

        {/* Step 6: Assessment */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 px-1">
               <h2 className="text-[24px] font-extrabold text-[#191f28] leading-tight mb-2 flex gap-2 items-center"><ShieldAlert className="text-[#f04452]"/> 최종 분석 및 평가</h2>
               <p className="text-[14px] text-[#4e5968]">현장 데이터를 바탕으로 매수 타당성을 평가합니다.</p>
            </div>
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e8eb]">
               <TextInput section="assessment" field="alphaDriver" label="이 단지만의 강력한 장점 (Alpha Driver)" placeholder="압도적 조경, 핵심 학군 등 가격이 오를 수밖에 없는 구조적 우위 요소" isTextarea />
               <TextInput section="assessment" field="systemicRisk" label="아쉬운 단점과 위험 (Vulnerability)" placeholder="과도한 언덕 지형, 구축의 평면 한계, 향후 인근 대규모 분양 물량 등 약점" isTextarea />
               <TextInput section="assessment" field="synthesis" label="종합 매수 타당성 결론" placeholder="장단점을 종합해 봤을 때, 현재 가격에 매수할 메리트가 있나요?" isTextarea />
               <TextInput section="assessment" field="probability" label="확률론적 가격 상승 전망" placeholder="예: 향후 12개월 내 교통 호재가 반영되어 현재 호가 대비 10% 상승할 확률 80%" isTextarea />
            </div>
          </div>
        )}

      </main>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#e5e8eb] shadow-lg flex gap-3 z-20">
        {step > 1 && (
           <button onClick={handlePrevStep} className="w-1/3 py-4 rounded-xl font-bold bg-[#f2f4f6] text-[#4e5968] active:bg-[#e5e8eb] transition-colors">
              이전
           </button>
        )}
        {step < 6 ? (
           <button onClick={handleNextStep} className="flex-1 py-4 rounded-xl font-bold bg-[#3182f6] text-white active:scale-[0.98] transition-transform">
              다음 단계로
           </button>
        ) : (
           <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 rounded-xl font-bold bg-[#191f28] text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              {isSubmitting ? '서버에 저장 중...' : '🔥 최종 제출하기'}
           </button>
        )}
      </div>

    </div>
  );
}
