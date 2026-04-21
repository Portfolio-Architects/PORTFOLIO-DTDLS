import json

with open('public/tx-data/_index.json', 'r', encoding='utf-8') as f:
    index = json.load(f)

for apt in index:
    if "대원칸타빌" in apt or "모아미래도" in apt:
        with open(f'public/tx-data/{apt}.json', 'r', encoding='utf-8') as f:
            txs = json.load(f)
        
        years = {}
        for t in txs:
            y = t.get('contractYm', '')[:4]
            dtype = t.get('dealType') or '매매'
            if y not in years:
                years[y] = {}
            years[y][dtype] = years[y].get(dtype, 0) + 1

        print("Apt:", apt)
        for y, counts in sorted(years.items()):
            print(f"{y}: {counts}")
        print("---")
