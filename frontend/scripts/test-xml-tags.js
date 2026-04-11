const url = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent?serviceKey=4611c02045e69b5e6c0bf50b9ecbee6de92e7ee0351eb8a7d529253340f755ff&LAWD_CD=41597&DEAL_YMD=202511&pageNo=1&numOfRows=10';
fetch(url).then(r => r.text()).then(txt => {
    const items = txt.match(/<item>([\s\S]*?)<\/item>/g);
    if(items && items.length > 0) console.log(items[1]);
});
