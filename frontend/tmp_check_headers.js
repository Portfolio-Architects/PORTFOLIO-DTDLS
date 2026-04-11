const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function main() {
  const sa = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf-8'));
  const serviceAccountAuth = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const doc = new GoogleSpreadsheet('1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE', serviceAccountAuth);
  await doc.loadInfo();
  console.log("Found tabs:", Object.keys(doc.sheetsByTitle));
  if (doc.sheetsByTitle['apartments']) {
    const sheet = doc.sheetsByTitle['apartments'];
    await sheet.loadHeaderRow();
    console.log("Apartment Headers:\n", sheet.headerValues.join(', '));
  } else {
    console.log("No 'apartments' tab found");
  }
}

main().catch(console.error);
