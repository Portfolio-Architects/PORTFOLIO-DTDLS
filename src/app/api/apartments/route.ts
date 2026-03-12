import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// 동탄2 신도시 아파트 전체 데이터 (나무위키, 네이버부동산 등 공개자료 기반 종합)
const FULL_DONG_DATA: Record<string, string[]> = {
  '능동': [
    '동탄2 A97BL 능동마을 금강펜테리움',
    '동탄2 A98BL 능동마을 호반베르디움',
    '동탄2 A99BL 능동마을 제일풍경채',
    '화성동탄2 능동마을 모아미래도',
    '화성동탄2 LH 23단지',
  ].sort(),
  '목동': [
    'e편한세상 동탄',
    'e편한세상 동탄 파크아너스',
    '동탄 금강펜테리움 4차',
    '동탄 파크릭스',
    '동탄 한신더휴',
    '동탄2 호반베르디움 센트럴포레',
    '힐스테이트 동탄',
    '화성동탄2 LH 40단지',
  ].sort(),
  '반송동': [
    '동탄2 A56BL 반송마을 금강펜테리움',
    '동탄2 A55BL 반송마을 호반베르디움',
    '동탄2 반송동 대방노블랜드',
    '동탄2 반송동 우미린',
    '동탄2 반송동 자이 더 비전',
    '동탄2 반송동 중흥S-클래스',
  ].sort(),
  '산척동': [
    '동탄 금강펜테리움 센트럴파크 2차',
    '동탄 더샵 레이크에듀타운',
    '동탄 반도유보라 아이비파크 10.0',
    '동탄2 하우스디 더 레이크',
    '호반써밋 동탄',
    '동탄신도시 금강펜테리움 6차 센트럴파크',
  ].sort(),
  '석우동': [
    '동탄2 석우동 중흥S-클래스',
    '동탄2 석우동 금강펜테리움',
    '동탄2 석우동 호반베르디움',
    '동탄2 석우동 이수건설',
  ].sort(),
  '송동': [
    '더 레이크시티 부영 1단지',
    '더 레이크시티 부영 2단지',
    '동탄 더 레이크 팰리스',
    '동탄린스트라우스더레이크',
    '동탄호수공원 아이파크',
    '동탄호수공원역 레이크시티',
    '우미린 스트라우스 더 레이크',
    '한화 포레나 동탄호수',
    '호수공원역 센트럴시티',
    '호수공원역 센트리체',
    '동탄 레이크 자연& 푸르지오',
    '동탄 레이크파크 자연& e편한세상',
  ].sort(),
  '신동': [
    '동탄2 A81BL 신동마을 금강펜테리움',
    '동탄2 A82BL 신동마을 호반베르디움',
    '동탄2 A83BL 신동마을 푸르지오',
    '동탄2 A84BL 신동마을 대방노블랜드',
    '동탄 숨마 데시앙',
  ].sort(),
  '여울동': [
    '동탄역 반도유보라 아이비파크 2.0',
    '동탄역 반도유보라 아이비파크 5.0',
    '동탄역 반도유보라 아이비파크 6.0',
    '동탄역 반도유보라 아이비파크 7.0',
    '동탄역 반도유보라 아이비파크 8.0',
    '동탄역 롯데캐슬',
    '동탄역 롯데캐슬 알바트로스',
    '동탄역 예미지 시그너스',
    '동탄역 파라곤',
    '동탄역 푸르지오',
    '동탄역 센트럴 자이',
    '동탄 파크 자이',
    '동탄 파크 푸르지오',
    '동탄역 대원칸타빌 포레지움',
    '동탄역 대방디엠시티 더 센텀',
    '동탄역 대방엘리움 더 시그니처',
    '힐스테이트 동탄역',
  ].sort(),
  '영천동': [
    '동탄2 A4-2BL LH 2단지',
    '동탄2 A6BL 영천마을 금강펜테리움',
    '동탄2 A7BL 영천마을 호반베르디움',
    '동탄2 A8BL 영천마을 대방노블랜드',
    '동탄2 A9BL 영천마을 한신더휴',
    '동탄2 A10BL 영천마을 신동아파밀리에',
    '동탄2 A11BL 영천마을 금호어울림',
    '동탄역 더샵 센트럴시티 2차',
    '동탄역 센트럴 푸르지오',
    '동탄역 푸르지오시티',
    '동탄 파크자이',
    '동탄 그웬 160',
    '동탄2 영천마을 중흥S-클래스',
    '동탄2 영천마을 코오롱하늘채',
    '동탄2 영천마을 경남아너스빌',
    '동탄2 영천마을 보미리즌빌',
    '제일풍경채 에듀&파크',
    '동탄2 영천마을 모아미래도',
    '동탄2 영천마을 서해그랑블',
  ].sort(),
  '장지동': [
    '동탄2 A70BL 장지마을 금강펜테리움',
    '동탄2 A71BL 장지마을 호반베르디움',
    '동탄2 A72BL 장지마을 우미린',
    '동탄2 A73BL 장지마을 대보하우스토리',
    '동탄2 장지마을 금호어울림',
  ].sort(),
  '청계동': [
    'KCC스위첸 동탄',
    '동탄 시범 예미지',
    '동탄 시범 호반베르디움',
    '동탄 시범대원 칸타빌',
    '동탄역 더 힐',
    '동탄역 모아미래도',
    '동탄역 시범 더샵 센트럴시티',
    '동탄역 시범 반도유보라 아이비파크 1.0',
    '동탄역 시범 반도유보라 아이비파크 4.0',
    '동탄역 시범 신안인스빌리베라 1차',
    '동탄역 시범 신안인스빌리베라 2차',
    '동탄역 시범 우남퍼스트빌',
    '동탄역 시범 한화 꿈에그린 프레스티지',
    '동탄역 시범 호반써밋',
    '동탄역 호반베르디움 더클래스',
    '휴먼시아 청계마을 1단지',
    '휴먼시아 청계마을 2단지',
  ].sort(),
  '기타': ['직접 입력'],
};

// POST: Seed/Update apartment data in Firestore
export async function POST() {
  try {
    await setDoc(doc(db, 'config', 'dongData'), {
      data: FULL_DONG_DATA,
      updatedAt: new Date().toISOString(),
      source: 'manual-seed-v2',
    });

    // Count total
    let total = 0;
    for (const apts of Object.values(FULL_DONG_DATA)) {
      total += apts.length;
    }

    return NextResponse.json({
      success: true,
      message: `${Object.keys(FULL_DONG_DATA).length}개 행정동, ${total}개 아파트가 Firestore에 저장되었습니다.`,
      summary: Object.entries(FULL_DONG_DATA).map(([dong, apts]) => `${dong}: ${apts.length}개`),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Fetch apartment data from Firestore (for the admin form)
export async function GET() {
  try {
    const snap = await getDoc(doc(db, 'config', 'dongData'));
    if (snap.exists()) {
      return NextResponse.json(snap.data().data, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
      });
    }
    // If no Firestore data, return the hardcoded fallback
    return NextResponse.json(FULL_DONG_DATA);
  } catch (error) {
    console.error('Failed to fetch dong data from Firestore:', error);
    return NextResponse.json(FULL_DONG_DATA);
  }
}
