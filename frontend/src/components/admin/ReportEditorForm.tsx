'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Trash2, CheckCircle2, ArrowUpDown } from 'lucide-react';
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
    distanceToIndeokwon: string;
    distanceToTram: string;
    academyDensity: string;
    restaurantDensity: string;
  };
  isPremium: boolean;
  premiumContent: string;
};

// 동탄2 신도시 아파트 데이터베이스 (가나다순 정렬)
const FALLBACK_DONG_DATA: Record<string, string[]> = {
  '능동': ['동탄2 능동 자이', '동탄2 능동 푸르지오', '동탄 능동 호반베르디움'],
  '목동 (중동탄)': ['e편한세상 동탄', '동탄 금강펜테리움 4차', '동탄 한신더휴', '동탄2 금강펜테리움 센트럴파크', '동탄2 호반베르디움 센트럴포레', '힐스테이트 동탄'],
  '반송동': ['동탄2 반송 대방노블랜드', '동탄2 반송 우미린', '동탄2 반송 자이 더 비전', '동탄2 반송동 호반베르디움', '반송동 금강펜테리움'],
  '산척동 (호수공원)': ['동탄 금강펜테리움 센트럴파크 2차', '동탄 더샵 레이크에듀타운', '동탄 반도유보라 아이비파크 10.0', '동탄2 산척 호반베르디움', '동탄호수공원 우미린'],
  '석우동': ['동탄2 석우동 중흥S-클래스', '동탄2 석우동 호반베르디움', '석우동 금강펜테리움'],
  '송동 (남동탄/호수공원)': ['동탄 부영 3단지', '동탄 부영 4단지', '동탄린스트라우스더레이크', '동탄호수공원 아이파크', '우미린 스트라우스 더 레이크'],
  '신동': ['동탄2 신동 금강펜테리움', '동탄2 신동 호반베르디움', '동탄2 신동 푸르지오'],
  '여울동 (동탄역)': ['동탄역 대방 엘리움', '동탄역 반도유보라 아이비파크 5.0', '동탄역 반도유보라 아이비파크 6.0', '동탄역 반도유보라 아이비파크 7.0', '동탄역 반도유보라 아이비파크 8.0', '동탄역 롯데캐슬', '동탄역 예미지 시그너스', '동탄역 파라곤'],
  '영천동 (북동탄)': ['동탄 파크자이', '동탄역 더샵센트럴시티 2차', '동탄역 센트럴푸르지오', '동탄역 푸르지오시티', '영천동 금강펜테리움'],
  '장지동': ['동탄2 장지 금강펜테리움', '동탄2 장지동 호반베르디움', '장지동 우미린'],
  '청계동 (시범단지)': ['동탄 시범 예미지', '동탄 시범 호반베르디움', '동탄 시범대원 칸타빌', '동탄역 시범더샵 센트럴시티', '동탄역 시범우남 퍼스트빌', '동탄역 시범한화 꿈에그린 프레스티지'],
  '기타': ['직접 입력']
};

// Predefined categories for images (Exterior/Public spaces + Scouting essentials)
const IMAGE_CATEGORY_GROUPS: { group: string; items: string[] }[] = [
  { group: '🏢 단지 전경', items: ['단지 전경 (메인)', '단지 전경 (항공/드론)', '단지 조감도'] },
  { group: '🚪 문주·출입구', items: ['정문 (메인게이트)', '후문/측문', '차량 출입구', '보행자 출입구', '보안실', '기타'] },
  { group: '🌿 조경·외부', items: ['중앙 조경', '산책로/보행로', '수경시설 (분수/연못)', '놀이터', '운동기구/트랙', '정원/화단', '단지 내 어린이집', '분리수거장/쓰레기'] },
  { group: '🅿 주차장', items: ['지하주차장 입구', '지하주차장 내부', '주차장 바닥/도색', '지상 주차', 'EV 충전기'] },
  { group: '🏋️ 커뮤니티 시설', items: ['커뮤니티 외관/입구', '피트니스센터 (헬스장)', '골프연습장', '실내 수영장', '키즈카페/놀이방', '독서실/스터디룸', '사우나/찜질방', '경로당/주민회의실', '게스트하우스', '공용 화장실', '기타 커뮤니티'] },
  { group: '🏠 동별·세대', items: ['동 외관', '엘리베이터/로비', '복도/계단', '택배함/무인택배'] },
  { group: '🪟 실내 (세대 내부)', items: ['거실/리빙', '주방', '욕실/화장실', '발코니/베란다', '현관', '조망/뷰 (창문)', '채광/향 (일조량)'] },
  { group: '🏙️ 주변 환경', items: ['역세권/교통 접근성', '통학로/학교', '주변 상권', '공원', '소음 환경 (도로)', '관리사무소', '단지 내 상가', '기타'] },
];

const CAPTION_TEMPLATES: Record<string, string[]> = {
  '단지 전경 (메인)': ['단지 정면 전경 — 세대수 약 N세대, 동간 거리 양호', '단지 진입로에서 바라본 외관 조감'],
  '정문 (메인게이트)': ['정문 문주 — 차량 2차선 진입, 보행자 분리 확인', '정문 야간 조명 및 CCTV 설치 상태'],
  '중앙 조경': ['중앙 광장 조경 — 소나무/단풍나무 식재, 정리 양호', '수경시설(분수/연못) 가동 상태 확인'],
  '산책로/보행로': ['단지 내 산책로 — 폭 약 2m, 야간 조명 있음'],
  '놀이터': ['중앙 놀이터 — 미끄럼틀, 그네, 모래놀이 시설 구비', '바닥 우레탄 포장, 안전펜스 있음'],
  '지하주차장 내부': ['주차 구획 폭 약 2.5m — 여유 있는 편, 기둥 간섭 적음', '지하 보행 통로 — 엘리베이터 연결, 밝기 양호'],
  '지하주차장 입구': ['지하주차장 입구 — 층고 약 2.3m, 대형SUV 진입 가능'],
  '커뮤니티 외관/입구': ['커뮤니티센터 외관 — GX룸, 독서실, 카페 운영 중'],
  '피트니스센터 (헬스장)': ['피트니스센터 — 24시간 운영, 러닝머신/웨이트 구비'],
  '골프연습장': ['골프연습장 — 스크린골프 N타석, 레슨 가능 여부 확인'],
  '키즈카페/놀이방': ['키즈카페 — 영유아 전용, 안전매트 포장, 운영시간 확인'],
  '독서실/스터디룸': ['독서실 — 좌석 N석, 운영시간 확인'],
  '조망/뷰 (창문)': ['고층부(25F+) — 호수공원/산 방향 파노라마 뷰', '중층부(10~15F) — 동간 간섭 여부 확인', '저층부(3~5F) — 조경 뷰, 프라이버시 확인'],
  '채광/향 (일조량)': ['남향 거실 오후 2시 기준 일조량 체크', '동간 거리에 따른 그림자 영향 — 겨울철 기준'],
  '역세권/교통 접근성': ['GTX-A/SRT역 도보 동선 — 정문 기준 실측 N분', '버스정류장 위치 및 노선 확인 — 강남직행 여부'],
  '통학로/학교': ['배정 초등학교 통학로 — 횡단보도/스쿨존 안전성', '중학교 배정 현황 — 선호 학교 배정 확률'],
  '주변 상권': ['대형마트/쇼핑몰 — 도보/차량 접근 시간', '카페/음식점 도보 생활권 범위'],
  '소음 환경 (도로)': ['대로변 소음 — 도로 방면 동 기준 체감 소음 수준', '단지 내부 소음 — 놀이터/상가 인접 동 체감'],
  '분리수거장/쓰레기': ['분리수거장 — 밀폐형, 악취 관리 양호, 청소 상태 깔끔'],
  '단지 내 상가': ['단지 내 상가 — 편의점, 세탁소, 부동산 입점', '상가 2층 학원가 밀집 확인'],
};

interface ReportEditorFormProps {
  initialData?: FormValues | null;
  reportId?: string;
}

export default function ReportEditorForm({ initialData = null, reportId }: ReportEditorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiCategories, setApiCategories] = useState<{
    academyCategories?: Record<string, number>;
    restaurantDensity?: number;
    restaurantCategories?: Record<string, number>;
    nearestSchoolNames?: { elementary?: string; middle?: string; high?: string };
    nearestStationName?: string;
  }>({});
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
          if (Object.keys(data).length > 1) {
            // 동이름 가나다순 정렬
            const sorted: Record<string, string[]> = {};
            Object.keys(data).sort((a, b) => a.localeCompare(b, 'ko')).forEach(k => {
              sorted[k] = (data[k] as string[]).sort((a: string, b: string) => a.localeCompare(b, 'ko'));
            });
            setDongData(sorted);
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
  const { register, control, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    defaultValues: initialData || {
      dong: '',
      apartmentName: '',
      metrics: {
        brand: '',
        householdCount: '',
        far: '',
        bcr: '',
        parkingPerHousehold: '',
        yearBuilt: '',
        distanceToElementary: '',
        distanceToMiddle: '',
        distanceToHigh: '',
        distanceToSubway: '',
        distanceToIndeokwon: '',
        distanceToTram: '',
        academyDensity: '',
        restaurantDensity: ''
      },
      images: [],
      isPremium: true
    }
  });

  // If initialData is loaded asynchronously or changed
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      // Preserve existing category data so editing doesn't drop them
      const m = initialData.metrics as any;
      if (m) {
        setApiCategories(prev => ({
          ...prev,
          ...(m.academyCategories ? { academyCategories: m.academyCategories } : {}),
          ...(m.restaurantCategories ? { restaurantCategories: m.restaurantCategories } : {}),
          ...(m.restaurantDensity ? { restaurantDensity: m.restaurantDensity } : {}),
          ...(m.nearestSchoolNames ? { nearestSchoolNames: m.nearestSchoolNames } : {}),
          ...(m.nearestStationName ? { nearestStationName: m.nearestStationName } : {}),
        }));
      }
      // Pre-populate uploaded file keys from existing images
      if (initialData.images) {
        for (const img of initialData.images) {
          if (img.url) {
            // Extract decoded filename from Firebase Storage URL
            try {
              const decoded = decodeURIComponent(img.url);
              const match = decoded.match(/\/([^/?]+)\?/);
              if (match) uploadedFileKeys.current.add(match[1]);
            } catch { /* ignore */ }
          }
          if (img.file) {
            uploadedFileKeys.current.add(img.file.name);
          }
        }
      }
      // Auto-fetch location scores if categories are missing
      const hasCategories = m?.academyCategories && Object.keys(m.academyCategories).length > 0;
      if (!hasCategories && initialData.apartmentName) {
        (async () => {
          try {
            const res = await fetch(`/api/location-scores?apartment=${encodeURIComponent(initialData.apartmentName)}`);
            if (!res.ok) return;
            const loc = await res.json();
            if (loc.distanceToElementary != null) setValue('metrics.distanceToElementary', String(loc.distanceToElementary));
            if (loc.distanceToMiddle != null) setValue('metrics.distanceToMiddle', String(loc.distanceToMiddle));
            if (loc.distanceToHigh != null) setValue('metrics.distanceToHigh', String(loc.distanceToHigh));
            if (loc.distanceToSubway != null) setValue('metrics.distanceToSubway', String(loc.distanceToSubway));
            if (loc.distanceToIndeokwon != null) setValue('metrics.distanceToIndeokwon', String(loc.distanceToIndeokwon));
            if (loc.distanceToTram != null) setValue('metrics.distanceToTram', String(loc.distanceToTram));
            if (loc.academyDensity != null) setValue('metrics.academyDensity', String(loc.academyDensity));
            if (loc.restaurantDensity != null) setValue('metrics.restaurantDensity', String(loc.restaurantDensity));
            const bld = loc.buildingInfo;
            if (bld) {
              if (bld.brand) setValue('metrics.brand', bld.brand);
              if (bld.householdCount) setValue('metrics.householdCount', String(bld.householdCount));
              if (bld.yearBuilt) setValue('metrics.yearBuilt', String(bld.yearBuilt));
              if (bld.far) setValue('metrics.far', String(bld.far));
              if (bld.bcr) setValue('metrics.bcr', String(bld.bcr));
              if (bld.parkingPerHousehold) setValue('metrics.parkingPerHousehold', String(bld.parkingPerHousehold));
            }
            setApiCategories({
              academyCategories: loc.academyCategories || {},
              restaurantDensity: loc.restaurantDensity,
              restaurantCategories: loc.restaurantCategories || {},
              nearestSchoolNames: {
                elementary: loc.nearestSchools?.elementary?.name,
                middle: loc.nearestSchools?.middle?.name,
                high: loc.nearestSchools?.high?.name,
              },
              nearestStationName: loc.nearestStation?.name,
            });
          } catch { /* silent fail */ }
        })();
      }
    }
  }, [initialData, reset]);

  const { fields: imageFields, append: appendImage, remove: removeImage, update: updateImage, replace: replaceImages } = useFieldArray({
    control,
    name: "images"
  });

  // Auto-sort images by category group order
  const sortByCategory = () => {
    const currentImages = getValues('images'); // Read LIVE form values, not stale field refs
    const categoryOrder = IMAGE_CATEGORY_GROUPS.flatMap(g => g.items);
    const sorted = [...currentImages].sort((a, b) => {
      const ai = categoryOrder.indexOf(a.locationTag);
      const bi = categoryOrder.indexOf(b.locationTag);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    replaceImages(sorted);
  };

  // Watch the 'dong' field to dynamically update the apartment list
  const selectedDong = useWatch({ control, name: 'dong' }) || Object.keys(dongData)[0];
  const availableApartments = dongData[selectedDong] || [];

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const uploadedFileKeys = useRef<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{done: number, total: number} | null>(null);

  const handleImageSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadedFileKeys.current.has(file.name)) {
        alert('이미 업로드된 사진입니다.');
        e.target.value = '';
        return;
      }
      uploadedFileKeys.current.add(file.name);
      const previewUrl = URL.createObjectURL(file);
      const currentVal = imageFields[index];
      updateImage(index, { ...currentVal, file, previewUrl });
    }
    e.target.value = '';
  };

  // Batch upload: create one block per file — with ref-based duplicate detection (filename only)
  const handleBatchFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) return;

    const unique: File[] = [];
    let dupCount = 0;
    for (const f of fileArr) {
      if (uploadedFileKeys.current.has(f.name)) {
        dupCount++;
      } else {
        uploadedFileKeys.current.add(f.name);
        unique.push(f);
      }
    }
    if (dupCount > 0) alert(`중복 사진 ${dupCount}장이 제외되었습니다.`);
    if (unique.length === 0) return;

    unique.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      appendImage({ file, previewUrl, url: '', caption: '', locationTag: '', isPremium: false });
    });
  };

  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleBatchFiles(e.dataTransfer.files);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (!auth.currentUser) {
        throw new Error("로그인이 필요합니다.");
      }

      // 1. Upload Images to Firebase Storage
      const uploadedImages: {url: string, caption: string, locationTag: string, isPremium: boolean}[] = [];
      const imagesToProcess = data.images.filter(img => img.file || img.url);
      const totalImages = imagesToProcess.length;
      let uploadedCount = 0;
      setUploadProgress({ done: 0, total: totalImages });

      // Parallel batch upload (3 at a time)
      const BATCH_SIZE = 3;
      for (let i = 0; i < imagesToProcess.length; i += BATCH_SIZE) {
        const batch = imagesToProcess.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (img) => {
            let finalUrl = img.url;
            if (img.file) {
              finalUrl = await uploadImage(img.file, 'report_images');
            }
            return finalUrl ? { url: finalUrl, caption: img.caption || '', locationTag: img.locationTag || '', isPremium: img.isPremium } : null;
          })
        );
        results.forEach(r => { if (r) uploadedImages.push(r); });
        uploadedCount += batch.length;
        setUploadProgress({ done: uploadedCount, total: totalImages });
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
        distanceToIndeokwon: Number(data.metrics.distanceToIndeokwon),
        distanceToTram: Number(data.metrics.distanceToTram),
        academyDensity: Number(data.metrics.academyDensity),
        ...(apiCategories.academyCategories ? { academyCategories: apiCategories.academyCategories } : {}),
        ...(Number(data.metrics.restaurantDensity) || apiCategories.restaurantDensity ? { restaurantDensity: Number(data.metrics.restaurantDensity) || apiCategories.restaurantDensity } : {}),
        ...(apiCategories.restaurantCategories ? { restaurantCategories: apiCategories.restaurantCategories } : {}),
        ...(apiCategories.nearestSchoolNames ? { nearestSchoolNames: apiCategories.nearestSchoolNames } : {}),
        ...(apiCategories.nearestStationName ? { nearestStationName: apiCategories.nearestStationName } : {}),
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
      setUploadProgress(null);
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
        <option value="" disabled>선택하세요</option>
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
            <label className="block text-[14px] font-bold text-[#4e5968] mb-2">법정동 선택 <span className="text-[#f04452]">*</span></label>
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white text-[#4e5968] shadow-sm flex items-center justify-center text-[12px]">2</span>
            객관적 지표 통계
          </h3>
          <button
            type="button"
            disabled={isCalculating}
            onClick={async () => {
              const aptName = getValues('apartmentName');
              if (!aptName) { alert('먼저 아파트를 선택해주세요.'); return; }
              setIsCalculating(true);
              try {
                const res = await fetch(`/api/location-scores?apartment=${encodeURIComponent(aptName)}`);
                if (!res.ok) {
                  alert('좌표 데이터를 찾을 수 없습니다.');
                  return;
                }
                const loc = await res.json();

                // 위치 거리
                if (loc.distanceToElementary != null) setValue('metrics.distanceToElementary', String(loc.distanceToElementary));
                if (loc.distanceToMiddle != null) setValue('metrics.distanceToMiddle', String(loc.distanceToMiddle));
                if (loc.distanceToHigh != null) setValue('metrics.distanceToHigh', String(loc.distanceToHigh));
                if (loc.distanceToSubway != null) setValue('metrics.distanceToSubway', String(loc.distanceToSubway));
                if (loc.academyDensity != null) setValue('metrics.academyDensity', String(loc.academyDensity));
                if (loc.restaurantDensity != null) setValue('metrics.restaurantDensity', String(loc.restaurantDensity));

                // Save category data for Firestore
                setApiCategories({
                  academyCategories: loc.academyCategories || {},
                  restaurantDensity: loc.restaurantDensity,
                  restaurantCategories: loc.restaurantCategories || {},
                  nearestSchoolNames: {
                    elementary: loc.nearestSchools?.elementary?.name,
                    middle: loc.nearestSchools?.middle?.name,
                    high: loc.nearestSchools?.high?.name,
                  },
                  nearestStationName: loc.nearestStation?.name,
                });

                // 건물 정보 (시트 C~H열)
                const bld = loc.buildingInfo;
                if (bld) {
                  if (bld.brand) setValue('metrics.brand', bld.brand);
                  if (bld.householdCount) setValue('metrics.householdCount', String(bld.householdCount));
                  if (bld.yearBuilt) setValue('metrics.yearBuilt', String(bld.yearBuilt));
                  if (bld.far) setValue('metrics.far', String(bld.far));
                  if (bld.bcr) setValue('metrics.bcr', String(bld.bcr));
                  if (bld.parkingPerHousehold) setValue('metrics.parkingPerHousehold', String(bld.parkingPerHousehold));
                }

                  // 교통 (인덕원선, 트램)
                  if (loc.distanceToIndeokwon != null) setValue('metrics.distanceToIndeokwon', String(loc.distanceToIndeokwon));
                  if (loc.distanceToTram != null) setValue('metrics.distanceToTram', String(loc.distanceToTram));

                  const bldMsg = bld?.householdCount
                    ? `\n\n🏢 건물\n시공사: ${bld.brand ?? '-'}\n세대수: ${bld.householdCount}\n준공: ${bld.yearBuilt ?? '-'}\n용적률: ${bld.far ?? '-'}%\n건폐율: ${bld.bcr ?? '-'}%\n주차: ${bld.parkingPerHousehold ?? '-'}대/세대`
                    : '\n\n⚠️ 건물 정보 없음 (시트 C~H열 입력 필요)';
                  const catEntries = Object.entries(loc.academyCategories || {}).sort(([,a], [,b]) => (b as number) - (a as number));
                  const catMsg = catEntries.length > 0 ? `\n\n📚 학원 ${loc.academyDensity}개 (1km)\n${catEntries.map(([c, n]) => `  ${c}: ${n}개`).join('\n')}` : `\n\n📚 학원: ${loc.academyDensity}개`;
                  const restEntries = Object.entries(loc.restaurantCategories || {}).sort(([,a], [,b]) => (b as number) - (a as number));
                  const restMsg = restEntries.length > 0 ? `\n\n🍽️ 음식점·카페 ${loc.restaurantDensity}개 (1km)\n${restEntries.map(([c, n]) => `  ${c}: ${n}개`).join('\n')}` : '';
                  const transitMsg = `\n\n🚇 교통\nGTX-A/SRT: ${loc.nearestStation?.name || '-'} (${loc.distanceToSubway ?? '-'}m)${loc.distanceToIndeokwon != null ? `\n인덕원선: ${loc.nearestIndeokwon?.name || '-'} (${loc.distanceToIndeokwon}m)` : ''}${loc.distanceToTram != null ? `\n트램: ${loc.nearestTram?.name || '-'} (${loc.distanceToTram}m)` : ''}`;
                  alert(`✅ 자동 출력 완료!\n📍 학교\n초등: ${loc.nearestSchools?.elementary?.name || '-'} (${loc.distanceToElementary ?? '-'}m)\n중학: ${loc.nearestSchools?.middle?.name || '-'} (${loc.distanceToMiddle ?? '-'}m)\n고등: ${loc.nearestSchools?.high?.name || '-'} (${loc.distanceToHigh ?? '-'}m)${transitMsg}${catMsg}${restMsg}${bldMsg}`);
              } catch (e) {
                alert('자동 출력 중 오류가 발생했습니다.');
                console.error(e);
              } finally {
                setIsCalculating(false);
              }
            }}
            className="px-5 py-2.5 bg-[#e8f3ff] hover:bg-[#d0e8ff] text-[#3182f6] font-bold text-[13px] rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isCalculating ? (
              <><div className="w-4 h-4 border-2 border-[#3182f6] border-t-transparent rounded-full animate-spin" /> 불러오는 중...</>
            ) : (
              <>📍 단지 정보 자동 출력</>
            )}
          </button>
        </div>
        <p className="text-[14px] text-[#4e5968] mb-6">입력하신 실제 데이터는 소비자 대상 팩트 프리미엄 지표로 자동 가공되어 표시됩니다.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mb-4">
          <div>
            <label className="block text-[13px] font-bold text-[#4e5968] mb-1 pl-0.5">대표 시공사 (브랜드)</label>
            <input
              {...register('metrics.brand')}
              placeholder="예: 현대건설"
              className="w-full bg-[#f9fafb] border border-[#e5e8eb] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors"
            />
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2 mb-4">
          <NumberInput name="metrics.distanceToSubway" label="GTX-A/SRT 거리" placeholder="예: 500" unit="m" />
          <NumberInput name="metrics.distanceToIndeokwon" label="동탄인덕원선 거리" placeholder="예: 800" unit="m" />
          <NumberInput name="metrics.distanceToTram" label="동탄트램 거리" placeholder="예: 300" unit="m" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <NumberInput name="metrics.academyDensity" label="반경 1km 이내 학원 개수 (학군 밀집도)" placeholder="예: 120" unit="개" />
          <NumberInput name="metrics.restaurantDensity" label="반경 1km 이내 음식점·카페 개수" placeholder="예: 472" unit="개" />
        </div>

        {/* Category Breakdown Panels — always visible */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Academy Categories */}
          <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
            <div className="text-[13px] font-bold text-[#03c75a] mb-2">학원 카테고리 ({apiCategories.academyCategories ? Object.values(apiCategories.academyCategories).reduce((a, b) => a + b, 0) : 0}개)</div>
            <div className="space-y-1">
              {apiCategories.academyCategories && Object.keys(apiCategories.academyCategories).length > 0 ? (
                Object.entries(apiCategories.academyCategories)
                  .sort(([,a], [,b]) => b - a)
                  .map(([cat, cnt]) => (
                    <div key={cat} className="flex justify-between text-[12px] py-0.5 px-1">
                      <span className="text-[#4e5968] truncate mr-2">{cat}</span>
                      <span className="font-bold text-[#03c75a] shrink-0">{cnt}개</span>
                    </div>
                  ))
              ) : (
                <p className="text-[11px] text-[#8b95a1] italic">단지 정보 불러오기 후 자동 표시됩니다</p>
              )}
            </div>
          </div>
          {/* Restaurant Categories */}
          <div className="bg-[#fffbeb] rounded-xl p-4 border border-[#fde68a]">
            <div className="text-[13px] font-bold text-[#f59e0b] mb-2">음식점·카페 ({apiCategories.restaurantCategories ? Object.values(apiCategories.restaurantCategories).reduce((a, b) => a + b, 0) : 0}개)</div>
            <div className="space-y-1">
              {apiCategories.restaurantCategories && Object.keys(apiCategories.restaurantCategories).length > 0 ? (
                Object.entries(apiCategories.restaurantCategories)
                  .sort(([,a], [,b]) => b - a)
                  .map(([cat, cnt]) => (
                    <div key={cat} className="flex justify-between text-[12px] py-0.5 px-1">
                      <span className="text-[#4e5968] truncate mr-2">{cat}</span>
                      <span className="font-bold text-[#f59e0b] shrink-0">{cnt}개</span>
                    </div>
                  ))
              ) : (
                <p className="text-[11px] text-[#8b95a1] italic">단지 정보 불러오기 후 자동 표시됩니다</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dynamic Images Array */}
      <section className="mb-12">
        <h3 className="text-[18px] font-bold text-[#191f28] mb-6 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#f2f4f6] text-[#4e5968] flex items-center justify-center text-[12px]">3</span>
          현장 사진 데이터베이스
          <span className="text-[12px] font-medium text-[#8b95a1] ml-auto">{imageFields.length}장</span>
        </h3>

        {/* Batch Drop Zone */}
        <div
          className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#3182f6] bg-[#e8f3ff] scale-[1.01]'
              : 'border-[#d1d6db] bg-[#f9fafb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDropZone}
          onClick={() => batchInputRef.current?.click()}
        >
          <input ref={batchInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleBatchFiles(e.target.files); e.target.value = ''; }} />
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
            <ImagePlus size={22} className="text-[#3182f6]" />
          </div>
          <p className="text-[15px] font-bold text-[#191f28] mb-1">
            {isDragging ? '여기에 놓으세요!' : '사진을 한번에 여러 장 추가'}
          </p>
          <p className="text-[12px] text-[#8b95a1]">드래그하거나 클릭하여 여러 사진을 선택한 후 카테고리를 직접 지정해주세요</p>
        </div>

        {/* Sort Button */}
        {imageFields.length >= 2 && (
          <button
            type="button"
            onClick={sortByCategory}
            className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e8eb] rounded-xl text-[13px] font-bold text-[#4e5968] hover:bg-[#f9fafb] hover:border-[#3182f6] hover:text-[#3182f6] transition-all shadow-sm"
          >
            <ArrowUpDown size={14} />
            카테고리별 자동 정렬
            <span className="text-[11px] text-[#8b95a1] font-medium">({imageFields.length}장)</span>
          </button>
        )}

        <div className="space-y-4 mb-6">
          {imageFields.map((field, index) => (
            <div key={field.id} className="flex flex-col md:flex-row gap-4 p-4 border border-[#e5e8eb] rounded-2xl bg-white shadow-sm hover:border-[#3182f6] transition-colors group relative">

              
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
                  {/* Category Picker — 2-level popover */}
                  {(() => {
                    const currentTag = field.locationTag;
                    const currentGroup = IMAGE_CATEGORY_GROUPS.find(g => g.items.includes(currentTag));
                    return (
                      <div className="relative w-[220px]">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`cat-popover-${index}`);
                            if (el) el.classList.toggle('hidden');
                          }}
                          className="w-full px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] font-bold text-left cursor-pointer hover:border-[#3182f6] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-colors text-[#191f28] flex items-center justify-between"
                        >
                          <span className="truncate">{currentTag || '카테고리 선택'}</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 ml-1 text-[#8b95a1]"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                        </button>
                        <div
                          id={`cat-popover-${index}`}
                          className="hidden absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-[#e5e8eb] w-[380px] max-h-[280px] overflow-hidden"
                        >
                          {/* Group tabs — horizontal scroll */}
                          <div className="flex gap-1 p-2 overflow-x-auto border-b border-[#f2f4f6] bg-[#fafbfc]">
                            {IMAGE_CATEGORY_GROUPS.map((g, gIdx) => (
                              <button
                                key={g.group}
                                type="button"
                                onClick={() => {
                                  // Show this group's items
                                  const container = document.getElementById(`cat-popover-${index}`);
                                  if (!container) return;
                                  container.querySelectorAll('[data-cat-group]').forEach(el => el.classList.add('hidden'));
                                  container.querySelector(`[data-cat-group="${gIdx}"]`)?.classList.remove('hidden');
                                  container.querySelectorAll('[data-cat-tab]').forEach(el => {
                                    el.classList.remove('bg-[#191f28]', 'text-white');
                                    el.classList.add('bg-[#f2f4f6]', 'text-[#4e5968]');
                                  });
                                  container.querySelector(`[data-cat-tab="${gIdx}"]`)?.classList.remove('bg-[#f2f4f6]', 'text-[#4e5968]');
                                  container.querySelector(`[data-cat-tab="${gIdx}"]`)?.classList.add('bg-[#191f28]', 'text-white');
                                }}
                                data-cat-tab={gIdx}
                                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  (currentGroup === g || (!currentGroup && gIdx === 0))
                                    ? 'bg-[#191f28] text-white'
                                    : 'bg-[#f2f4f6] text-[#4e5968] hover:bg-[#e5e8eb]'
                                }`}
                              >
                                {g.group.replace(/[^\w가-힣·\s]/g, '').trim()}
                              </button>
                            ))}
                          </div>
                          {/* Items per group */}
                          {IMAGE_CATEGORY_GROUPS.map((g, gIdx) => (
                            <div
                              key={g.group}
                              data-cat-group={gIdx}
                              className={`p-2 flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto ${
                                (currentGroup === g || (!currentGroup && gIdx === 0)) ? '' : 'hidden'
                              }`}
                            >
                              {g.items.map(item => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => {
                                    const currentVal = imageFields[index];
                                    updateImage(index, { ...currentVal, locationTag: item });
                                    document.getElementById(`cat-popover-${index}`)?.classList.add('hidden');
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                    currentTag === item
                                      ? 'bg-[#e8f3ff] text-[#3182f6] border-[#3182f6] font-bold'
                                      : 'bg-white text-[#4e5968] border-[#e5e8eb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
                                  }`}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <input
                    {...register(`images.${index}.caption`)}
                    className="flex-1 px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none placeholder-[#b0b8c1]"
                    placeholder={CAPTION_TEMPLATES[field.locationTag]?.[0] || '사진 설명 캡션을 입력하세요'}
                  />
                </div>
                {/* Caption Template Chips */}
                {CAPTION_TEMPLATES[field.locationTag] && (
                  <div className="flex flex-wrap gap-1.5">
                    {CAPTION_TEMPLATES[field.locationTag].map((tmpl, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => {
                          const currentVal = imageFields[index];
                          updateImage(index, { ...currentVal, caption: tmpl });
                        }}
                        className="px-2.5 py-1 bg-[#f2f4f6] hover:bg-[#e8f3ff] hover:text-[#3182f6] border border-[#e5e8eb] hover:border-[#3182f6] rounded-lg text-[11px] text-[#4e5968] font-medium transition-all truncate max-w-[240px]"
                        title={tmpl}
                      >
                        📝 {tmpl}
                      </button>
                    ))}
                  </div>
                )}
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
          onClick={() => appendImage({ url: '', caption: '', locationTag: '', isPremium: false })}
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
          className="px-8 py-3 font-bold text-white bg-[#3182f6] hover:bg-[#2b72d6] active:bg-[#1b64da] rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 min-w-[180px] justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {uploadProgress ? (
                <span className="text-[13px]">{uploadProgress.done}/{uploadProgress.total}장 업로드 중...</span>
              ) : (
                <span className="text-[13px]">저장 중...</span>
              )}
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              {reportId ? '수정 완료하기' : '최종 발행하기'}
            </>
          )}
        </button>
      </div>

    </form>
  );
}
