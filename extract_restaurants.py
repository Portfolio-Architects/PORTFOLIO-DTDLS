"""
🔧 동탄2 신도시 음식점/카페 데이터 추출 스크립트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

소상공인시장진흥공단 상가 CSV에서 동탄 지역의 음식점/카페 좌표를 추출합니다.
결과 CSV를 Google Sheets 'restaurants' 탭에 붙여넣으세요.

📌 시트 이름: restaurants
📌 헤더(A1:F1): 상호명 | 위도 | 경도 | 업종소분류 | 행정동 | 주소

사용법: python extract_restaurants.py
"""
import csv
import os
from collections import Counter

CSV_PATH = r'C:\Users\ocs56\OneDrive\바탕 화면\소상공인시장진흥공단_상가(상권)정보_경기_202512.csv'
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dongtan_restaurants.csv')

# 화성시 동탄 관련 행정동
DONGTAN_DONGS = ['동탄', '오산', '능동', '송동', '반송동', '산척동', '석우동', '신동',
                 '영천동', '장지동', '청계동', '목동', '여울동']

def is_dongtan(row):
    return '화성' in row[14] and any(kw in row[16] for kw in DONGTAN_DONGS)

def classify(mid, sub):
    """음식 중분류/소분류 → 우리 카테고리"""
    if '카페' in sub or '커피' in sub or ('비알코올' in mid and '카페' in sub):
        return '카페'
    if '빵' in sub or '도넛' in sub:
        return '베이커리'
    if '아이스크림' in sub or '빙수' in sub:
        return '디저트'
    # 나머지는 중분류명 그대로
    return mid.strip()

def main():
    rows_out = []
    cat_counter = Counter()

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            if len(row) < 39 or not is_dongtan(row):
                continue
            major = row[4]   # 상권업종대분류명
            mid = row[6]     # 상권업종중분류명
            sub = row[8]     # 상권업종소분류명
            if major != '음식':
                continue
            name = row[1]
            lat = row[38]
            lng = row[37]
            dong = row[16]
            addr = row[31]
            if not lat or not lng:
                continue

            category = classify(mid, sub)
            cat_counter[category] += 1
            rows_out.append([name, lat, lng, category, dong, addr])

    # Write output CSV
    with open(OUT_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['상호명', '위도', '경도', '업종소분류', '행정동', '주소'])
        for r in rows_out:
            writer.writerow(r)

    print("=" * 50)
    print("✅ 추출 완료!")
    print(f"📁 출력 파일: {OUT_PATH}")
    print(f"📊 총 {len(rows_out):,}개 행")
    print()
    print("카테고리별 분포:")
    for cat, cnt in cat_counter.most_common():
        print(f"  {cat}: {cnt:,}개")
    print()
    print("━" * 50)
    print("📌 Google Sheets에 붙여넣기:")
    print(f"   시트 탭 이름: restaurants")
    print(f"   헤더(A1~F1): 상호명 | 위도 | 경도 | 업종소분류 | 행정동 | 주소")
    print("━" * 50)

if __name__ == '__main__':
    main()
