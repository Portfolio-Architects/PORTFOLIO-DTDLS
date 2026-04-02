const https = require('https');
const fs = require('fs');
https.get('https://docs.google.com/spreadsheets/d/1rKMt-B2FdN5nGaxaU0y2Pqv1WqnEv1AGnY7XXE7pCEE/gviz/tq?tqx=out:csv&sheet=TYPE_MAP', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    fs.writeFileSync('test_csv.csv', data);
    console.log("DONE CSV");
  });
}).on('error', (e) => {
  console.error("Error", e);
});
