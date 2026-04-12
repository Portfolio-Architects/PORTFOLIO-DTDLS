#!/usr/bin/env node
/**
 * 🔄 국토부 실거래가 API → Firestore 동기화
 * 
 * 사용법: node scripts/fetch-transactions.js
 * 
 * 국토부 실거래가 공공데이터 API에서 동탄구(화성시) 최신 거래 데이터를 가져와
 * Firestore 'transactions' 컬렉션에 upsert합니다.
 * 
 * 환경변수:
 *   BUILDING_API_KEY — 공공데이터포털 인증키
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch, query, orderBy, limit, getDocs } = require('firebase/firestore');
const { HttpsProxyAgent } = require('https-proxy-agent');
const axios = require('axios');

const API_KEY = process.env.BUILDING_API_KEY || '';
const LAWD_CD = '41590'; // 화성시 (동탄 지역은 코드 내에서 필터링)
const DONGTAN_DONGS = ['반송동', '능동', '청계동', '영천동', '오산동', '신동', '목동', '산척동', '장지동', '송동', '방교동', '금곡동'];
const API_BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

// Firebase config (public)
const firebaseConfig = {
  apiKey: "AIzaSyBv05nu9B8iVqDr68y8itgsDzg31aAuyf8",
  authDomain: "portfolio-dtdls.firebaseapp.com",
  projectId: "portfolio-dtdls",
  storageBucket: "portfolio-dtdls.firebasestorage.app",
  messagingSenderId: "294879479843",
  appId: "1:294879479843:web:721124e99a10cdc9d04996",
};

function formatPriceEok(priceMan) {
  const eok = Math.floor(priceMan / 10000);
  const remainder = priceMan % 10000;
  if (eok === 0) return `${priceMan.toLocaleString()}만`;
  if (remainder === 0) return `${eok}억`;
  return `${eok}억${remainder.toLocaleString()}`;
}

async function main() {
  if (!API_KEY) {
    console.error('❌ BUILDING_API_KEY 환경변수가 설정되지 않았습니다.');
    console.error('   공공데이터포털에서 발급받은 인증키를 설정해주세요.');
    process.exit(1);
  }

  console.log('📡 국토부 실거래가 API에서 데이터 수집 중...');

  const app = initializeApp(firebaseConfig, 'fetch-tx');
  const db = getFirestore(app);
  const collRef = collection(db, 'transactions');

  // 1. Firestore에서 최신 거래 날짜 확인
  const latestQ = query(collRef, orderBy('contractDate', 'desc'), limit(1));
  const latestSnap = await getDocs(latestQ);
  let latestYm = '';
  if (!latestSnap.empty) {
    latestYm = latestSnap.docs[0].data().contractYm || '';
  }
  console.log(`   최신 Firestore 데이터: ${latestYm || '없음'}`);

  // 2. 동기화할 월 결정
  const now = new Date();
  const currentYm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthsToSync = new Set();

  if (latestYm) monthsToSync.add(latestYm); // 최신 월 재동기화
  monthsToSync.add(currentYm);               // 현재 월

  // 월초면 전월도 포함 (국토부 데이터 지연 대응)
  if (now.getDate() <= 20) {
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    monthsToSync.add(`${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  }

  console.log(`   동기화 대상: ${Array.from(monthsToSync).sort().join(', ')}`);

  // 3. 국토부 API 호출
  let totalNew = 0;
  const syncLog = [];

  for (const ym of Array.from(monthsToSync).sort()) {
    let page = 1;
    let totalCount = 0;
    const monthRecords = [];

    console.log(`\n📅 ${ym} 처리 중...`);

    do {
      const url = `${API_BASE}?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${ym}&pageNo=${page}&numOfRows=1000`;

      const agent = process.env.PROXY_URL ? new HttpsProxyAgent(process.env.PROXY_URL) : undefined;
      let text = '';
      try {
        const res = await axios.get(url, { httpAgent: agent, httpsAgent: agent, proxy: false });
        text = res.data;
      } catch (err) {
        const status = err.response ? err.response.status : (err.code || 'Unknown');
        syncLog.push(`${ym} page ${page}: HTTP ${status}`);
        console.error(`   ❌ HTTP ${status} - ${err.message}`);
        break;
      }

      // 에러 응답 체크
      const errMatch = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
      if (errMatch && !text.includes('<item>')) {
        console.error(`   ❌ API 에러: ${errMatch[1]}`);
        syncLog.push(`${ym}: API 에러 - ${errMatch[1]}`);
        break;
      }

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

        const aptName = get('aptNm');
        const priceStr = get('dealAmount').replace(/,/g, '').trim();
        const price = parseInt(priceStr, 10) || 0;
        const area = parseFloat(get('excluUseAr')) || 0;
        const contractDay = get('dealDay').padStart(2, '0');
        const floor = parseInt(get('floor'), 10) || 0;
        const dong = get('umdNm');

        // 🔥 치명적 버그 수정: 동탄 권역 속하는 동 이름만 메모리 필터링
        if (!DONGTAN_DONGS.some(d => dong.includes(d))) continue;

        monthRecords.push({
          sigungu: `경기도 화성시 동탄구 ${dong}`,
          dong,
          aptName,
          area,
          areaPyeong: Math.round(area / 3.3058 * 10) / 10,
          contractYm: ym,
          contractDay,
          contractDate: `${ym}${contractDay}`,
          price,
          floor,
          buyer: get('buyerGbn'),
          seller: get('slerGbn'),
          buildYear: parseInt(get('buildYear'), 10) || 0,
          roadName: get('roadNm'),
          cancelDate: get('cdealDay') || '',
          dealType: get('cdealType') || get('dealingGbn') || '',
          agentLocation: get('estateAgentSggNm'),
          registrationDate: get('rgstDate'),
          housingType: '',
          source: 'govt_api',
          _key: `${aptName}_${ym}_${contractDay}_${area}_${price}_${floor}`,
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
      syncLog.push(`${ym}: ${written}건 동기화`);
      console.log(`   ✅ ${written}건 동기화 완료`);
    } else {
      syncLog.push(`${ym}: 0건`);
      console.log(`   ⏭️  0건`);
    }
  }

  console.log(`\n🎉 총 ${totalNew}건 Firestore 동기화 완료`);
  syncLog.forEach(l => console.log(`   ${l}`));

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 동기화 실패:', err.message);
  process.exit(1);
});
