import urllib.request
import csv
import json
import re

url = 'https://docs.google.com/spreadsheets/d/1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE/gviz/tq?tqx=out:csv&sheet=apartments'
response = urllib.request.urlopen(url)
lines = [l.decode('utf-8') for l in response.readlines()]
reader = csv.reader(lines)
headers = next(reader)
name_idx = headers.index('아파트명') if '아파트명' in headers else 1
txkey_idx = headers.index('txKey') if 'txKey' in headers else 12
hh_idx = headers.index('세대수') if '세대수' in headers else 7

sheet_apts = []
for row in reader:
    if len(row) > name_idx and row[name_idx]:
        name = row[name_idx]
        txkey = row[txkey_idx] if len(row) > txkey_idx and row[txkey_idx] else ''
        hh_str = row[hh_idx].replace(',', '') if len(row) > hh_idx else '0'
        hh = int(hh_str) if hh_str.isdigit() else 0
        norm_name = re.sub(r'\[.*?\]\s*', '', name).replace(' ', '').replace('(', '').replace(')', '')
        sheet_apts.append({'name': name, 'txkey': txkey or norm_name, 'hh': hh})

with open('public/tx-data/_index.json', 'r', encoding='utf-8') as f:
    tx_summary_keys = set(json.load(f))

missing = []
total_hh = 0
missing_hh = 0
for apt in sheet_apts:
    total_hh += apt['hh']
    if apt['txkey'] not in tx_summary_keys:
        missing.append(apt)
        missing_hh += apt['hh']

print(f'Sheet count: {len(sheet_apts)}')
print(f'TX_SUMMARY count: {len(tx_summary_keys)}')
print(f'Missing from TX_SUMMARY: {len(missing)}')
print(f'Total Households in Sheet: {total_hh}')
print(f'Households missing from TX_SUMMARY: {missing_hh}')
print('Missing items:')
for m in missing:
    print(f"  - {m['name']} (txkey: {m['txkey']}, hh: {m['hh']})")
