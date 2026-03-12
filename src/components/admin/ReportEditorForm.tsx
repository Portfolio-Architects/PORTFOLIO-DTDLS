'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';
import { uploadImage, createScoutingReport, updateScoutingReport } from '@/lib/services/reportService';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { getPremiumScoresAction } from '@/app/actions/scoring';

// Basic Types for the form matching our Firestore Schema
type FormValues = {
  dong: string;
  apartmentName: string;
  thumbnailUrl: string;
  images: { file?: File; previewUrl?: string; url: string; caption: string; locationTag: string; isPremium: boolean }[];
  metrics: {
    brand: string;
    householdCount: string;
    far: string; // 용적률
    bcr: string; // 건폐율
    parkingPerHousehold: string; // 세대당 주차대수
    yearBuilt: string; // 준공연도
    distanceToElementary: string;
    distanceToMiddle: string;
    distanceToHigh: string;
    distanceToSubway: string;
    academyDensity: string;
  };
  isPremium: boolean;
  premiumContent: string;
};

// Fallback Database for when API is unavailable
const FALLBACK_DONG_DATA: Record<string, string[]> = {
  '여울동 (동탄역)': ['동탄역 롯데캐슬', '동탄역 반도유보라 아이비파크 6.0', '동탄역 반도유보라 아이비파크 7.0', '동탄역 반도유보라 아이비파크 8.0', '동탄역 파라곤', '동탄역 예미지 시그너스'],
  '청계동 (시범단지)': ['동탄역 시범더샵 센트럴시티', '동탄역 시범한화 꿈에그린 프레스티지', '동탄역 시범우남 퍼스트빌', '동탄 시범대원 칸타빌', '동탄 시범 예미지', '동탄 시범 호반베르디움'],
  '목동 (중동탄)': ['힐스테이트 동탄', '동탄2 호반베르디움 센트럴포레', 'e편한세상 동탄', '동탄 금강펜테리움 4차', '동탄 한신더휴'],
  '송동 (남동탄/호수공원)': ['동탄린스트라우스더레이크', '동탄호수공원 아이파크', '동탄 부영 3단지', '동탄 부영 4단지', '우미린 스트라우스 더 레이크'],
  '산척동 (호수공원)': ['동탄 더샵 레이크에듀타운', '동탄 금강펜테리움 센트럴파크 2차', '동탄 반도유보라 아이비파크 10.0'],
  '영천동 (북동탄)': ['동탄역 센트럴푸르지오', '동탄 파크자이', '동탄역 더샵센트럴시티 2차', '동탄역 푸르지오시티'],
  '장지동': ['직접 입력'],
  '신동': ['직접 입력'],
  '석우동': ['직접 입력'],
  '반송동': ['직접 입력'],
  '능동': ['직접 입력'],
  '기타': ['직접 입력']
};

// Predefined categories for images (Exterior/Public spaces only)
const IMAGE_CATEGORIES = [
  '메인 (단지 전경)',
  '문주 (정문/출입구)',
  '조경 (산책로/수경시설)',
  '놀이터 (어린이 놀이시설)',
  '커뮤니티 (외관/입구)',
  '지하주차장',
  '단지 내 상가',
  '분리수거장 및 기타',
];

interface ReportEditorFormProps {
  initialData?: FormValues | null;
  reportId?: string;
}

export default function ReportEditorForm({ initialData = null, reportId }: ReportEditorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dongData, setDongData] = useState<Record<string, string[]>>(FALLBACK_DONG_DATA);
  const [isLoadingApts, setIsLoadingApts] = useState(true);
  const router = useRouter();

  // Fetch apartment list from MOLIT API on mount
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const res = await fetch('/api/apartments');
        if (res.ok) {
          const data = await res.json();
          if (Object.keys(data).length > 1) { // More than just '기타'
            setDongData(data);
          }
        }
      } catch (err) {
        console.warn('아파트 목록 API 호출 실패, 기본 데이터 사용:', err);
      } finally {
        setIsLoadingApts(false);
      }
    };
    fetchApartments();
  }, []);

  // Initialize React Hook Form
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: initialData || {
      dong: Object.keys(FALLBACK_DONG_DATA)[0],
      apartmentName: FALLBACK_DONG_DATA[Object.keys(FALLBACK_DONG_DATA)[0]][0],
      metrics: {
        brand: '롯데캐슬',
        householdCount: '',
        far: '',
        bcr: '',
        parkingPerHousehold: '',
        yearBuilt: '',
        distanceToElementary: '',
        distanceToMiddle: '',
        distanceToHigh: '',
        distanceToSubway: '',
        academyDensity: ''
      },
      images: [
        { url: '', caption: '', locationTag: '메인 (단지 전경)', isPremium: false }
      ],
      isPremium: true
    }
  });

  // If initialData is loaded asynchronously or changed
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const { fields: imageFields, append: appendImage, remove: removeImage, update: updateImage } = useFieldArray({
    control,
    name: "images"
  });

  // Watch the 'dong' field to dynamically update the apartment list
  const selectedDong = useWatch({ control, name: 'dong' }) || Object.keys(dongData)[0];
  const availableApartments = dongData[selectedDong] || [];

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleImageSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      const currentVal = imageFields[index];
      updateImage(index, { ...currentVal, file, previewUrl });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (!auth.currentUser) {
        throw new Error("로그인이 필요합니다.");
      }

      // 1. Upload Images to Firebase Storage
      const uploadedImages = [];
      for (const img of data.images) {
        let finalUrl = img.url;
        if (img.file) {
          finalUrl = await uploadImage(img.file, 'report_images');
        }
        
        if (finalUrl) { // Only keep blocks that have an image URL
          uploadedImages.push({
            url: finalUrl,
            caption: img.caption || '',
            locationTag: img.locationTag || '',
            isPremium: img.isPremium
          });
        }
      }

      if (uploadedImages.length === 0) {
        throw new Error("최소 1개 이상의 현장 사진을 업로드해주세요.");
      }

      // 2. Prepare Firestore Document
      const metricsPayload = {
        brand: data.metrics.brand,
        householdCount: Number(data.metrics.householdCount),
        far: Number(data.metrics.far),
        bcr: Number(data.metrics.bcr),
        parkingPerHousehold: Number(data.metrics.parkingPerHousehold),
        yearBuilt: Number(data.metrics.yearBuilt),
        distanceToElementary: Number(data.metrics.distanceToElementary),
        distanceToMiddle: Number(data.metrics.distanceToMiddle),
        distanceToHigh: Number(data.metrics.distanceToHigh),
        distanceToSubway: Number(data.metrics.distanceToSubway),
        academyDensity: Number(data.metrics.academyDensity),
      };

      const premiumScores = await getPremiumScoresAction(metricsPayload);

      const reportData = {
        dong: data.dong,
        apartmentName: data.apartmentName,
        thumbnailUrl: data.thumbnailUrl || uploadedImages[0].url,
        images: uploadedImages,
        metrics: metricsPayload,
        premiumScores,
        isPremium: data.isPremium,
        premiumContent: data.premiumContent || '',
        authorUid: auth.currentUser.uid
      };

      // 3. Save or Update in Firestore
      if (reportId) {
        await updateScoutingReport(reportId, reportData);
        alert("데이터가 성공적으로 수정되었습니다!");
      } else {
        await createScoutingReport(reportData);
        alert("데이터가 성공적으로 발행 및 저장되었습니다!");
      }
      
      router.push('/admin'); // Redirect to dashboard
    } catch (error: any) {
      console.error(error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const NumberInput = ({ name, label, placeholder, unit }: { name: any, label: string, placeholder: string, unit: string }) => (
    <div className="mb-4">
      <label className="block text-[14px] font-bold text-[#4e5968] mb-2">{label}</label>
      <div className="relative">
        <input 
          type="number"
          step="0.01"
          {...register(name, { required: true })}
          className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-all placeholder-[#b0b8c1]"
          placeholder={placeholder}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b95a1] font-bold text-[14px]">{unit}</span>
      </div>
    </div>
  );

  const SelectInput = ({ name, label, options }: { name: any, label: string, options: string[] }) => (
    <div className={label ? "mb-4" : ""}>
      {label && <label className="block text-[14px] font-bold text-[#4e5968] mb-2">{label}</label>}
      <select 
        {...register(name, { required: true })}
        className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-all appearance-none cursor-pointer"
      >
        {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      {/* 1. Basic Info Section */}
      <section className="mb-12">
        <h3 className="text-[18px] font-bold text-[#191f28] mb-6 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#f2f4f6] text-[#4e5968] flex items-center justify-center text-[12px]">1</span>
          기본 정보
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[14px] font-bold text-[#4e5968] mb-2">행정동 / 권역 선택 <span className="text-[#f04452]">*</span></label>
            <SelectInput 
              name="dong" 
              label="" 
              options={isLoadingApts ? ['불러오는 중...'] : Object.keys(dongData)} 
            />
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[#4e5968] mb-2">물건(아파트) 이름 <span className="text-[#f04452]">*</span></label>
            {selectedDong === '기타' ? (
              <input 
                {...register('apartmentName', { required: true })}
                className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e8eb] rounded-xl text-[15px] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-all placeholder-[#b0b8c1]"
                placeholder="직접 단지명을 입력하세요"
              />
            ) : (
              <SelectInput 
                name="apartmentName" 
                label="" 
                options={availableApartments} 
              />
            )}
            <p className="text-[12px] text-[#8b95a1] font-medium mt-2">* 동을 먼저 선택하면 해당 지역의 주요 아파트 목록이 연동됩니다.</p>
          </div>
        </div>
      </section>

      {/* 2. Objective Metrics Section */}
      <section className="mb-12 bg-[#f9fafb] -mx-6 md:-mx-8 px-6 md:px-8 py-8 border-y border-[#e5e8eb]">
        <h3 className="text-[18px] font-bold text-[#191f28] mb-6 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white text-[#4e5968] shadow-sm flex items-center justify-center text-[12px]">2</span>
          객관적 지표 통계
        </h3>
        <p className="text-[14px] text-[#4e5968] mb-6">입력하신 실제 데이터는 소비자 대상 팩트 프리미엄 지표로 자동 가공되어 표시됩니다.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mb-4">
          <SelectInput 
            name="metrics.brand" 
            label="대표 시공사 (브랜드)" 
            options={['래미안', '자이', '디에이치', '아크로', '롯데캐슬', '푸르지오', '힐스테이트', '아이파크', 'e편한세상', '더샵', '포레나', '기타']} 
          />
          <NumberInput name="metrics.householdCount" label="총 세대수 (단지 규모)" placeholder="예: 1200" unit="세대" />
          <NumberInput name="metrics.yearBuilt" label="준공 연월 (연식 계산용)" placeholder="예: 2018" unit="년" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mb-4">
          <NumberInput name="metrics.far" label="용적률 (단지가 얼마나 밀집되어 있는지)" placeholder="예: 215" unit="%" />
          <NumberInput name="metrics.bcr" label="건폐율 (동간 거리가 얼마나 쾌적한지)" placeholder="예: 15" unit="%" />
          <NumberInput name="metrics.parkingPerHousehold" label="세대당 주차대수" placeholder="예: 1.45" unit="대" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mb-4">
          <NumberInput name="metrics.distanceToElementary" label="초등학교 통학거리 (초품아 여부)" placeholder="예: 300" unit="m" />
          <NumberInput name="metrics.distanceToMiddle" label="중학교 통학거리" placeholder="예: 800" unit="m" />
          <NumberInput name="metrics.distanceToHigh" label="고등학교 통학거리" placeholder="예: 1200" unit="m" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <NumberInput name="metrics.distanceToSubway" label="지하철역(SRT/GTX)까지의 거리" placeholder="예: 500" unit="m" />
          <NumberInput name="metrics.academyDensity" label="반경 1km 이내 학원 개수 (학군 밀집도)" placeholder="예: 120" unit="개" />
        </div>
      </section>

      {/* 3. Dynamic Images Array */}
      <section className="mb-12">
        <h3 className="text-[18px] font-bold text-[#191f28] mb-6 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#f2f4f6] text-[#4e5968] flex items-center justify-center text-[12px]">3</span>
          현장 사진 데이터베이스
        </h3>

        <div className="space-y-4 mb-6">
          {imageFields.map((field, index) => (
            <div key={field.id} className="flex flex-col md:flex-row gap-4 p-4 border border-[#e5e8eb] rounded-2xl bg-white shadow-sm hover:border-[#3182f6] transition-colors group relative">
              <div className="cursor-grab active:cursor-grabbing p-2 mt-1 hidden md:block text-[#b0b8c1] group-hover:text-[#4e5968]">
                <GripVertical size={20} />
              </div>
              
              {/* Real File Input for Drag&Drop / Click */}
              <input 
                type="file" 
                accept="image/*"
                className="hidden"
                ref={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                onChange={(e) => handleImageSelect(index, e)}
              />

              <div 
                className="w-full md:w-[150px] h-[100px] bg-[#f9fafb] border-2 border-dashed border-[#d1d6db] rounded-xl flex flex-col items-center justify-center text-[#8b95a1] cursor-pointer hover:bg-[#f2f4f6] hover:text-[#3182f6] transition-colors overflow-hidden group/img relative"
                onClick={() => fileInputRefs.current[index]?.click()}
              >
                {(field.previewUrl || field.url) ? (
                  <>
                    <img src={field.previewUrl || field.url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <span className="text-white text-[11px] font-bold">변경하기</span>
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus size={24} className="mb-1" />
                    <span className="text-[11px] font-semibold">이미지 추가</span>
                  </>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <select
                    {...register(`images.${index}.locationTag`)}
                    className="w-[180px] px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] font-bold focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none cursor-pointer text-[#191f28]"
                  >
                    {IMAGE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    {...register(`images.${index}.caption`)}
                    className="flex-1 px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none placeholder-[#b0b8c1]"
                    placeholder="사진 설명 캡션을 입력하세요"
                  />
                </div>
                <div className="flex items-center gap-3 w-full">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register(`images.${index}.isPremium`)} className="w-4 h-4 rounded text-[#3182f6] focus:ring-[#3182f6] border-[#d1d6db]" />
                    <span className="text-[13px] font-semibold text-[#4e5968]">유료(프리미엄) 멤버 전용 숨김 처리</span>
                  </label>
                  
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="ml-auto text-[#8b95a1] hover:text-[#f04452] p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={() => appendImage({ url: '', caption: '', locationTag: '메인 (단지 전경)', isPremium: false })}
          className="w-full py-4 border-2 border-dashed border-[#d1d6db] rounded-2xl text-[#4e5968] font-bold text-[14px] hover:bg-[#f9fafb] hover:text-[#3182f6] hover:border-[#3182f6] transition-all flex items-center justify-center gap-2"
        >
          <ImagePlus size={18} /> 사진 블록(Block) 추가
        </button>
      </section>

      {/* 4. Publishing & Save */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[240px] bg-white/90 backdrop-blur-md p-4 border-t border-[#e5e8eb] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex justify-end gap-3 z-50">
        <button type="button" className="px-6 py-3 font-bold text-[#4e5968] bg-[#f2f4f6] hover:bg-[#e5e8eb] rounded-xl transition-colors">
          임시 저장
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-8 py-3 font-bold text-white bg-[#3182f6] hover:bg-[#2b72d6] active:bg-[#1b64da] rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <CheckCircle2 size={18} />
          )}
          {reportId ? '수정 완료하기' : '최종 발행하기'}
        </button>
      </div>

    </form>
  );
}
