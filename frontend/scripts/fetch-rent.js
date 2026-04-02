#!/usr/bin/env node
/**
 * 🔄 국토부 전월세 실거래가 API → Firestore 동기화
 * 
 * 사용법: node scripts/fetch-rent.js
 * 
 * 국토부 전월세 실거래가 공공데이터 API에서 동탄구(화성시) 최신 전월세 거래 데이터를 가져와
 * Firestore 'transactions' 컬렉션에 upsert합니다.
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, query, orderBy, limit, getDocs, where } = require('firebase/firestore');

const API_KEY = process.env.BUILDING_API_KEY || '4611c02045e69b5e6c0bf50b9ecbee6de92e7ee0351eb8a7d529253340f755ff';
const LAWD_CD = '41597'; // 동탄구
const API_BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';

// Firebase config (public)
const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
  storageBucket: "portfolio-dtdls.firebasestorage.app",
  messagingSenderId: "294879479843",
  appId: "1:294879479843:web:721124e99a10cdc9d04996",
};

const DONGTAN_DONGS = ['반송동', '능동', '청계동', '영천동', '오산동', '신동', '목동', '산척동', '장지동', '송동', '방교동', '금곡동'];

async function main() {
  if (!API_KEY) {
    console.error('❌ BUILDING_API_KEY 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  console.log('📡 국토부 전월세 API에서 데이터 수집 중...');
  const app = initializeApp(firebaseConfig, 'fetch-rent');
  const db = getFirestore(app);
  const collRef = collection(db, 'transactions');

  // 1. 최신 전월세 데이터 연월 대신 고정 6개월치 스캔 (인덱스 에러 회피)
  const now = new Date();
  const monthsToSync = new Set();
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsToSync.add(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  console.log(`   동기화 대상 월: ${Array.from(monthsToSync).sort().join(', ')}`);

  // 3. API 호출
  let totalNew = 0;
  const syncLog = [];

  for (const ym of Array.from(monthsToSync).sort()) {
    let page = 1;
    let totalCount = 0;
    const monthRecords = [];

    console.log(`\n📅 ${ym} 전월세 처리 중...`);

    do {
      const url = `${API_BASE}?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${ym}&pageNo=${page}&numOfRows=1000`;

      const res = await fetch(url);
      if (!res.ok) {
        console.error(`   ❌ HTTP ${res.status}`);
        break;
      }

      const text = await res.text();

      // 에러 응답 체크
      const errMatch = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
      if (errMatch && !text.includes('<item>')) {
        console.error(`   ❌ API 에러: ${errMatch[1]} (아직 인증키가 동기화되지 않았을 수 있습니다.)`);
        break;
      }

      // XML 파싱 (정규식 활용)
      const totalMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
      totalCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;
      if (totalCount === 0) break;

      const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const itemXml of items) {
        const tagMap = new Map();
        const tagRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
        let tagMatch;
        while ((tagMatch = tagRegex.exec(itemXml)) !== null) {
          tagMap.set(tagMatch[1], tagMatch[2].trim());
        }
        const get = (tag) => tagMap.get(tag) || '';

        const dong = get('umdNm');
        
        // 동탄 지역 필터링
        if (!DONGTAN_DONGS.some(d => dong.includes(d))) continue;

        const aptName = get('aptNm');
        const depositStr = get('deposit').replace(/,/g, '').trim();
        const monthlyRentStr = get('monthlyRent') ? get('monthlyRent').replace(/,/g, '').trim() : '0';
        
        const deposit = parseInt(depositStr, 10) || 0;
        const monthlyRent = parseInt(monthlyRentStr, 10) || 0;
        const dealType = monthlyRent > 0 ? '월세' : '전세';

        const area = parseFloat(get('excluUseAr')) || 0;
        const contractDay = get('dealDay').padStart(2, '0');
        const floor = parseInt(get('floor'), 10) || 0;

        monthRecords.push({
          sigungu: `경기도 화성시 동탄구 ${dong}`,
          dong,
          aptName,
          area,
          areaPyeong: Math.round(area / 3.3058 * 10) / 10,
          contractYm: ym,
          contractDay,
          contractDate: `${ym}${contractDay}`,
          price: deposit, // 전세 보증금을 기준 가격으로 저장 (UI 매매 호환성)
          deposit: deposit,
          monthlyRent: monthlyRent,
          floor,
          buildYear: parseInt(get('buildYear'), 10) || 0,
          dealType: dealType,
          source: 'govt_api_rent',
          _key: `RENT_${aptName}_${ym}_${contractDay}_${area}_${deposit}_${floor}`,
        });
      }

      page++;
    } while (monthRecords.length < totalCount);

    // 4. Firestore에 배치 쓰기
    if (monthRecords.length > 0) {
      const BATCH_SIZE = 500;
      let written = 0;
      for (let i = 0; i < monthRecords.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const slice = monthRecords.slice(i, i + BATCH_SIZE);
        for (const r of slice) {
          batch.set(doc(collRef, r._key), r, { merge: true });
        }
        await batch.commit();
        written += slice.length;
      }
      totalNew += written;
      console.log(`   ✅ ${written}건 (동탄지역 전월세) 동기화 완료`);
    } else {
      console.log(`   ⏭️  0건 (동탄지역 전월세 없음)`);
    }
  }

  console.log(`\n🎉 총 ${totalNew}건 전월세 Firestore 동기화 완료`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 동기화 실패:', err.message);
  process.exit(1);
});
