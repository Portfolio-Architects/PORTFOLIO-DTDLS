require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BUILDING_API_KEY || '4611c02045e69b5e6c0bf50b9ecbee6de92e7ee0351eb8a7d529253340f755ff';
const LAWD_CD = '41590'; // Hwaseong
const DEAL_YMD = '202401';

const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent?serviceKey=${encodeURIComponent(API_KEY)}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${DEAL_YMD}&pageNo=1&numOfRows=5`;

fetch(url)
  .then(res => res.text())
  .then(text => console.log("RENT API:", text.substring(0, 300)))
  .catch(err => console.error(err));
