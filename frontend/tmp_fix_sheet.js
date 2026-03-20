require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_ID = '1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE';

async function fixSheet() {
  try {
    const formattedKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '');
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['apartments'];
    if (!sheet) throw new Error("apartments sheet not found");

    await sheet.loadCells('A1:M1'); // Load only the first row where everything is
    
    // We expect 13 columns
    const columns = [];
    for (let c = 0; c < 13; c++) {
      const cell = sheet.getCell(0, c);
      const val = cell.value;
      if (typeof val === 'string' && val.includes('\n')) {
        columns.push(val.split('\n'));
      } else {
        columns.push([]); // Empty or uncorrupted
      }
    }

    // If A1 has multiple lines, it means corruption exists.
    if (columns[0].length > 1) {
      console.log(`Detected corrupted sheet. A1 has ${columns[0].length} lines. Transposing and fixing...`);
      
      const transposed = [];
      const numRows = columns[0].length;
      
      for (let r = 0; r < numRows; r++) {
        const row = [];
        for (let c = 0; c < 13; c++) {
          row.push((columns[c] && columns[c][r]) ? columns[c][r].trim() : "");
        }
        transposed.push(row);
      }

      // Clear the sheet
      console.log('Clearing sheet...');
      await sheet.clear();
      
      console.log('Writing headers...');
      await sheet.setHeaderRow(transposed[0]); // First row is headers
      
      console.log(`Adding ${transposed.length - 1} rows...`);
      // Add the rest
      const rowsToAdd = transposed.slice(1).map(rowArray => {
        const obj = {};
        for(let c=0; c<13; c++) {
          obj[transposed[0][c]] = rowArray[c];
        }
        return obj;
      });
      await sheet.addRows(rowsToAdd);
      
      console.log('Fix complete!');
    } else {
      console.log('Sheet does not seem to have the multi-line A1 corruption.');
    }
  } catch(e) {
    console.error(e);
  }
}

fixSheet();
