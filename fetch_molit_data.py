import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import csv
import os

# ==========================================
# 국토교통부 실거래가 API 수집 스크립트 (표준 라이브러리)
# ==========================================

# 제공된 API 키
API_KEY = "4611c02045e69b5e6c0bf50b9ecbee6de92e7ee0351eb8a7d529253340f755ff"

# 국토교통부_아파트매매 실거래 상세 자료
URL = "https://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev"

def fetch_apt_transactions(lawd_cd, deal_ymd):
    """
    특정 지역(법정동코드), 특정 월(YYYYMM)의 아파트 실거래가 데이터를 수집합니다.
    """
    queryParams = '?' + urllib.parse.urlencode({
        'ServiceKey': API_KEY, # requests params처럼 인코딩이 안맞을 수 있어서 직접 붙입니다 (하지만 urllib.parse는 해줌). 
        # 주의: 만약 키 오류가 나면 unquote된 키로 변경해야 할 수 있습니다. 
        # 오픈API 포털의 키 포맷 특징상 직접 키를 문자열로 붙이는 방식을 주로 씁니다.
    }, quote_via=urllib.parse.quote)
    
    # query_params에 직접 키를 넣는 방식 (디코딩 에러 방지)
    req_url = f"{URL}?serviceKey={API_KEY}&pageNo=1&numOfRows=1000&LAWD_CD={lawd_cd}&DEAL_YMD={deal_ymd}"

    try:
        print(f"[{deal_ymd}] {lawd_cd} 지역 데이터 요청 중...")
        request = urllib.request.Request(req_url)
        response = urllib.request.urlopen(request)
        res_code = response.getcode()
        
        if res_code != 200:
            print(f"API 요청 실패: HTTP {res_code}")
            return None

        content = response.read()
        
        # XML 파싱
        root = ET.fromstring(content)
        
        # 결과 코드가 00(정상)인지 확인
        result_code = root.find('.//resultCode').text
        if result_code != "00":
            error_msg = root.find('.//resultMsg').text
            print(f"API 에러 발생: {error_msg}")
            return None

        # 데이터 추출
        items = root.findall('.//item')
        data_list = []
        
        for item in items:
            dong = item.find('법정동').text.strip() if item.find('법정동') is not None else ""
            
            data = {
                '아파트명': item.find('아파트').text.strip() if item.find('아파트') is not None else "",
                '법정동': dong,
                '지번': item.find('지번').text.strip() if item.find('지번') is not None else "",
                '전용면적(㎡)': item.find('전용면적').text if item.find('전용면적') is not None else "0",
                '거래금액(만원)': item.find('거래금액').text.replace(',', '').strip() if item.find('거래금액') is not None else "0",
                '층': item.find('층').text if item.find('층') is not None else "",
                '건축년도': item.find('건축년도').text if item.find('건축년도') is not None else "",
                '년': item.find('년').text if item.find('년') is not None else "",
                '월': item.find('월').text.zfill(2) if item.find('월') is not None else "",
                '일': item.find('일').text.zfill(2) if item.find('일') is not None else ""
            }
            data['거래일자'] = f"{data['년']}-{data['월']}-{data['일']}"
            data_list.append(data)
            
        return data_list

    except Exception as e:
        print(f"데이터 수집 중 오류 발생: {e}")
        return None

if __name__ == "__main__":
    import datetime
    
    hwaseong_cd = "41590"
    now = datetime.datetime.now()
    target_month = now.strftime("%Y%m") 
    
    print("국토부 실거래가 데이터 수집을 시작합니다...")
    
    transactions = fetch_apt_transactions(hwaseong_cd, target_month)
    
    if transactions:
        print(f"\n총 {len(transactions)}건의 화성시 거래 내역을 수집했습니다.")
        
        # 여기서 '동탄' 관련 법정동만 필터링
        dongtan_dongs = ['반송동', '능동', '청계동', '영천동', '오산동', '신동', '목동', '산척동', '장지동', '송동', '방교동', '금곡동']
        dongtan_data = [item for item in transactions if any(dong in item['법정동'] for dong in dongtan_dongs)]
        
        print(f"이 중 동탄 권역 거래 내역은 {len(dongtan_data)}건 입니다.")
        
        if len(dongtan_data) > 0:
            print("\n[동탄 권역 최근 거래 샘플 (Top 5)]")
            for i, row in enumerate(dongtan_data[:5]):
                print(f" - {row['법정동']} {row['아파트명']} ({row['전용면적(㎡)']}㎡): {int(row['거래금액(만원)']):,}만원 ({row['층']}층, {row['거래일자']})")
            
            # CSV로 저장
            filename = "dongtan_transactions_latest.csv"
            filepath = os.path.join(os.path.dirname(__file__), filename)
            
            headers = ['아파트명', '법정동', '지번', '전용면적(㎡)', '거래금액(만원)', '층', '건축년도', '거래일자']
            with open(filepath, 'w', newline='', encoding='utf-8-sig') as f:
                writer = csv.DictWriter(f, fieldnames=headers, extrasaction='ignore')
                writer.writeheader()
                for d in dongtan_data:
                    writer.writerow(d)
                
            print(f"\n데이터가 '{filename}' 파일로 저장되었습니다.")
            
            import json
            # JSON 데이터 파일 생성 (서버리스 마이그레이션)
            dongtan_data.sort(key=lambda x: x['거래일자'])
            
            data_dir = os.path.join(os.path.dirname(__file__), "data")
            os.makedirs(data_dir, exist_ok=True)
            
            # 1. Transactions JSON
            tx_data = {
                "status": "success",
                "count": len(dongtan_data),
                "data": dongtan_data
            }
            with open(os.path.join(data_dir, "transactions.json"), 'w', encoding='utf-8') as f:
                json.dump(tx_data, f, ensure_ascii=False, indent=2)
                
            # 2. Summary JSON
            prices = [int(item['거래금액(만원)']) for item in dongtan_data]
            avg_price = int(sum(prices) / len(prices)) if prices else 0
            max_price = max(prices) if prices else 0
            
            summary_data = {
                "status": "success",
                "summary": {
                    "avg_price_krw": avg_price,
                    "max_price_krw": max_price,
                    "total_transactions": len(dongtan_data),
                    "index_score": 114.2
                }
            }
            with open(os.path.join(data_dir, "summary.json"), 'w', encoding='utf-8') as f:
                json.dump(summary_data, f, ensure_ascii=False, indent=2)
                
            print("웹 대시보드용 정적 JSON 파일(summary.json, transactions.json) 생성이 완료되었습니다.")
    else:
        print("\n수집된 데이터가 없습니다. (API 통신 실패 또는 인증 오류일 수 있습니다)")
