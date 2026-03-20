require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_ID = '1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE';

async function check() {
  const formattedKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '');
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['apartments'];
  const rows = await sheet.getRows();
  console.log('Total Rows:', rows.length);
  if (rows.length > 0) {
    const firstRow = rows[0].toObject();
    
    // Print the keys of the first row object to see what the headers actually are!
    console.log('--- HEADERS (Keys) ---');
    console.log(Object.keys(firstRow));
    
    // Print the values of the first row to see if the data is collapsed
    console.log('--- FIRST ROW VALUES ---');
    console.log(Object.values(firstRow).map(v => typeof v === 'string' ? v.substring(0, 50) + '...' : v));
  }
}
check();
