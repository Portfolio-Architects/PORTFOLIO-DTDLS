const { normalizeAptName, HARDCODED_MAPPING, findTxKey } = require('./frontend/src/lib/utils/apartmentMapping.ts');
const txMap = {
  "동탄숲속마을자연앤경남아너스빌1115-0": { price: 100 }
};

console.log('norm:', normalizeAptName('능동역 센트럴 경남아너스빌'));
console.log('hardcoded:', HARDCODED_MAPPING[normalizeAptName('능동역 센트럴 경남아너스빌')]);
console.log('found:', findTxKey('능동역 센트럴 경남아너스빌', txMap));
