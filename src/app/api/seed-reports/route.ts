import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 임의의 동탄 아파트 5개에 대한 리얼리스틱한 임장기 데이터
const SAMPLE_REPORTS = [
  {
    dong: '청계동',
    apartmentName: '동탄역 시범더샵 센트럴시티',
    thumbnailUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', caption: '단지 전경. 40층 이상 초고층 타워로 구성된 랜드마크 단지. 동탄역에서 도보 5분 이내 초역세권.', locationTag: '메인 (단지 전경)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', caption: '정문 문주. 차량 진입 게이트와 보행자 전용 출입구가 완전 분리되어 있어 안전성이 높음.', locationTag: '문주 (정문/출입구)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80', caption: '단지 내 중앙공원. 산책로와 수경시설이 잘 꾸며져 있으며, 밤에는 조명이 들어와 분위기가 좋음.', locationTag: '조경 (산책로/수경시설)', isPremium: false },
    ],
    metrics: {
      brand: '더샵', householdCount: 2458, far: 249, bcr: 15,
      parkingPerHousehold: 1.52, yearBuilt: 2019,
      distanceToElementary: 200, distanceToMiddle: 500, distanceToHigh: 1200,
      distanceToSubway: 300, academyDensity: 150
    },
    premiumContent: '동탄 시범단지의 핵심. 더샵 브랜드의 프리미엄 관리가 돋보이며, 동탄역 초역세권으로 GTX-A 개통 수혜가 확실한 단지. 조경 수준이 동탄 내 최상위급이며 커뮤니티 시설(피트니스, 골프연습장, 독서실)이 매우 잘 갖춰져 있다. 다만 대단지 특성상 주차장에서 엘리베이터까지의 동선이 다소 긴 동이 있으니 동 배치 확인 필수.',
    isPremium: true,
    authorUid: 'system-seed',
  },
  {
    dong: '오산동',
    apartmentName: '동탄역 반도유보라 아이비파크 7.0',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', caption: '단지 전경. 동탄역 인근 대규모 주상복합 단지. 상업시설과 주거가 결합된 복합 생활 공간.', locationTag: '메인 (단지 전경)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', caption: '지하주차장. 주차 공간이 넓고 조명이 밝아 야간 안전도가 높음. 전기차 충전 인프라도 일부 구비.', locationTag: '지하주차장', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', caption: '어린이 놀이시설. 모래놀이터와 복합 놀이기구가 설치되어 있으나, 그늘막이 부족한 점은 아쉬움.', locationTag: '놀이터 (어린이 놀이시설)', isPremium: false },
    ],
    metrics: {
      brand: '아이파크', householdCount: 1876, far: 268, bcr: 18,
      parkingPerHousehold: 1.38, yearBuilt: 2020,
      distanceToElementary: 400, distanceToMiddle: 700, distanceToHigh: 1500,
      distanceToSubway: 250, academyDensity: 130
    },
    premiumContent: '동탄역 도보 3분 거리의 초역세권 주상복합. 반도유보라 시리즈 중 가장 최신 단지로, 내부 마감재 품질이 우수하다. 1층 상업시설(스타벅스, 편의점, 병원)이 입주민 생활 편의성을 극대화. 다만 주상복합 특성상 관리비가 일반 아파트 대비 15~20% 높고, 조경 면적이 상대적으로 부족한 편. GTX-A 개통 시 서울 접근성이 비약적으로 개선될 예정.',
    isPremium: true,
    authorUid: 'system-seed',
  },
  {
    dong: '송동',
    apartmentName: '동탄호수공원 아이파크',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', caption: '단지 전경. 동탄호수공원 바로 앞에 위치한 수변 뷰 프리미엄 단지. 호수 산책로 접근성 최고.', locationTag: '메인 (단지 전경)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', caption: '단지 조경. 호수공원과 연결되는 녹지 산책로가 잘 정비되어 있어 주거 쾌적성이 매우 높음.', locationTag: '조경 (산책로/수경시설)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', caption: '커뮤니티 시설 입구. 피트니스센터, 골프연습장, GX룸이 구비. 입주민 활용도가 높은 편.', locationTag: '커뮤니티 (외관/입구)', isPremium: false },
    ],
    metrics: {
      brand: '아이파크', householdCount: 1340, far: 199, bcr: 12,
      parkingPerHousehold: 1.61, yearBuilt: 2018,
      distanceToElementary: 350, distanceToMiddle: 800, distanceToHigh: 1300,
      distanceToSubway: 2500, academyDensity: 80
    },
    premiumContent: '동탄호수공원 도보 1분, 수변 뷰가 확보되는 로열동 프리미엄이 확실한 단지. 용적률 199%로 동간 거리가 넓어 채광과 통풍이 우수하며, 세대당 주차 1.61대로 주차 스트레스가 거의 없다. 최대 약점은 동탄역까지의 거리(차량 10분)이며, GTX-A 직접 수혜보다는 호수공원 생활권의 쾌적성으로 승부하는 단지. 실거주 만족도가 매우 높은 것으로 유명.',
    isPremium: true,
    authorUid: 'system-seed',
  },
  {
    dong: '영천동',
    apartmentName: '동탄역 센트럴푸르지오',
    thumbnailUrl: 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&q=80', caption: '단지 전경. 북동탄 랜드마크 대단지. 2,800세대 이상의 메머드급 규모로 자체 생활 인프라가 완비됨.', locationTag: '메인 (단지 전경)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', caption: '분리수거장. 지하에 위치하여 악취 문제 없음. 자동 분리수거 시스템이 도입되어 편의성이 높음.', locationTag: '분리수거장 및 기타', isPremium: false },
    ],
    metrics: {
      brand: '푸르지오', householdCount: 2856, far: 229, bcr: 16,
      parkingPerHousehold: 1.45, yearBuilt: 2019,
      distanceToElementary: 150, distanceToMiddle: 600, distanceToHigh: 900,
      distanceToSubway: 800, academyDensity: 145
    },
    premiumContent: '북동탄의 핵심 대단지. 초등학교가 단지 바로 옆(도보 2분)에 위치한 초품아 단지로, 자녀를 둔 가정에 최적화되어 있다. 푸르지오 브랜드 특유의 깔끔한 외관과 내부 마감이 돋보이며, 단지 내 상가에 소아과, 학원, 카페 등이 모두 입점해 있어 외출 없이 대부분의 생활이 가능. 동탄역까지 도보 12분으로 역세권의 경계선에 위치.',
    isPremium: true,
    authorUid: 'system-seed',
  },
  {
    dong: '목동',
    apartmentName: '힐스테이트 동탄',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&q=80', caption: '단지 전경. 중동탄의 조용한 주거 환경. 저층부 위주 구성으로 하늘이 트여 있어 개방감이 좋음.', locationTag: '메인 (단지 전경)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80', caption: '단지 내 상가. 편의점, 세탁소, 부동산 등 기본적인 생활 편의시설이 갖춰져 있음.', locationTag: '단지 내 상가', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', caption: '지하주차장 진입부. 경사가 완만하고 폭이 넓어 대형 SUV 진입도 수월함. LED 조명 교체 완료.', locationTag: '지하주차장', isPremium: false },
    ],
    metrics: {
      brand: '힐스테이트', householdCount: 980, far: 185, bcr: 13,
      parkingPerHousehold: 1.55, yearBuilt: 2017,
      distanceToElementary: 500, distanceToMiddle: 450, distanceToHigh: 800,
      distanceToSubway: 1800, academyDensity: 95
    },
    premiumContent: '중동탄의 숨은 실거주 만족 단지. 용적률 185%로 동탄 내에서도 매우 쾌적한 동간 거리를 자랑하고, 세대당 주차 1.55대로 여유롭다. 현대건설의 힐스테이트 브랜드답게 하자 관리가 잘 되며, 관리비도 합리적인 수준. 중학교가 도보 5분 거리로 학군 접근성이 좋으나, 동탄역까지는 대중교통으로 20분 소요되어 역세권이라 보기는 어렵다. 조용하고 안정적인 주거 환경을 원하는 실수요자에게 추천.',
    isPremium: true,
    authorUid: 'system-seed',
  },
  {
    dong: '산척동',
    apartmentName: '동탄 더샵 레이크에듀타운',
    thumbnailUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80',
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80', caption: '단지 전경. 동탄호수공원 인접 학군 특화 단지. 에듀타운이라는 이름답게 교육 인프라가 밀집됨.', locationTag: '메인 (단지 전경)', isPremium: false },
      { url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80', caption: '놀이터. 유럽풍 테마 놀이시설이 설치되어 있으며, 주변에 CCTV와 벤치가 배치되어 학부모들이 안심하고 아이를 놀게 할 수 있음.', locationTag: '놀이터 (어린이 놀이시설)', isPremium: false },
    ],
    metrics: {
      brand: '더샵', householdCount: 1560, far: 210, bcr: 14,
      parkingPerHousehold: 1.48, yearBuilt: 2020,
      distanceToElementary: 100, distanceToMiddle: 350, distanceToHigh: 700,
      distanceToSubway: 2200, academyDensity: 170
    },
    premiumContent: '동탄 최고의 학군 단지. 초등학교 도보 1분(초품아 중 최상위), 중학교 도보 5분, 고등학교 도보 10분이라는 압도적 교육 인프라. 반경 1km 내 학원 170개 이상 밀집. 더샵 브랜드의 고급 조경과 커뮤니티 시설이 잘 갖춰져 있으며, 동탄호수공원도 도보 10분 이내. 유일한 약점은 동탄역까지 차량 15분 소요. 교육 환경이 최우선인 가족에게 이 단지는 동탄의 정답.',
    isPremium: true,
    authorUid: 'system-seed',
  },
];

export async function POST() {
  try {
    const results = [];
    
    for (const report of SAMPLE_REPORTS) {
      const docRef = await addDoc(collection(db, 'scoutingReports'), {
        ...report,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      results.push({ id: docRef.id, name: report.apartmentName });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${results.length}개의 임장기가 성공적으로 생성되었습니다.`,
      reports: results 
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
