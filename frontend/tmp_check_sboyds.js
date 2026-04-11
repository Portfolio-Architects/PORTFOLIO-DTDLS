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
  if (doc.sheetsByTitle['SBOYDS']) {
    const sheet = doc.sheetsByTitle['SBOYDS'];
    const rows = await sheet.getRows();
    const names = new Set();
    for (const r of rows) {
      if (r.get('상호명')) {
        let name = r.get('상호명');
        // simplify name
        if (name.includes('올리브영')) names.add('올리브영');
        else if (name.includes('다이소')) names.add('다이소');
        else if (name.includes('맥도날드')) names.add('맥도날드');
        else if (name.includes('이마트') || name.includes('홈플러스') || name.includes('롯데마트') || name.includes('하나로마트') || name.includes('노브랜드') || name.includes('코스트코')) names.add('대형마트');
        else names.add(name);
      }
    }
    console.log("Types of amenities found:", Array.from(names));
  }
}
main().catch(console.error);
