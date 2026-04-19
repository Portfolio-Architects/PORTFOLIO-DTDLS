import { parseCsvLine, SHEET_ID, SHEET_TABS } from './src/lib/constants';
import fs from 'fs';

async function fetchCsv(sheetName) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&headers=1`;
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${sheetName}`);
  const text = await res.text();
  return text.split('\n').filter(l => l.trim());
}

async function run() {
  const lines = await fetchCsv(SHEET_TABS.APARTMENTS);
  console.log(`Apartments: ${lines.length} lines`);
  const headers = parseCsvLine(lines[0]);
  console.log('Headers:', headers);
}
run();
