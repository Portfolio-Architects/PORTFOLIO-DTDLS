const https = require('https');

const SHEET_ID = '1XpA-TjYhC2zNymWqXQ6eD85w-tYJ7p4cRksHnF0I0b0';
const SHEET_TABS = { APARTMENTS: 'apartments' };

const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TABS.APARTMENTS)}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const lines = data.split('\n');
    console.log('--- HEADERS ---');
    console.log(lines[0]);
    console.log('--- FIRST ROW ---');
    console.log(lines[1]);
  });
});
