require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// --- 주의 사항 (반드시 읽어주세요) ---
// 1. Firebase Console (프로젝트 설정 -> 서비스 계정 -> 새 비공개 키 생성) 에서
//    다운로드 받은 JSON 파일(serviceAccountKey.json)을 이 파일과 같은 경로(frontend 폴더 최상단)에 위치시켜 주세요.
// 2. 아래 variables.TARGET_USER_EMAIL 에 어드민 권한을 줄 계정의 이메일을 넣어주세요.
// ------------------------------------

const TARGET_USER_EMAIL = 'ocs5672@gmail.com'; // 👈 여기에 대표님 구글 구글계정(이메일) 입력

// 서비스 계정 키 불러오기
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.error('❌ 에러: serviceAccountKey.json 파일이 frontend 폴더 최상단에 없습니다.');
  console.error('Firebase Console에서 다운로드 받아 추가해 주세요.');
  process.exit(1);
}

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ---------------------------------------------------------
// 실행 로직
// ---------------------------------------------------------
async function grantAdminRole() {
  console.log(`⏳ [${TARGET_USER_EMAIL}] 계정에 Admin 권한 부여 중...`);

  try {
    // 1. 이메일로 사용자 찾기
    const user = await admin.auth().getUserByEmail(TARGET_USER_EMAIL);

    // 2. 해당 유저에게 Custom Claim 부여 (role: 'admin')
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // 3. 확인용 현재 Claim 가져오기
    const updatedUser = await admin.auth().getUser(user.uid);

    console.log('✅ 성공! Admin 권한이 성공적으로 부여되었습니다.');
    console.log('--------------------------------------------------');
    console.log(`이메일: ${updatedUser.email}`);
    console.log(`UID: ${updatedUser.uid}`);
    console.log(`현재 Claims:`, updatedUser.customClaims);
    console.log('--------------------------------------------------');
    console.log('💡 안내: 클라이언트(브라우저)에서 해당 계정으로 새로고침(또는 재로그인) 해야 권한이 업데이트됩니다.');

    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ 에러: 이메일(${TARGET_USER_EMAIL})과 일치하는 사용자를 찾을 수 없습니다. 먼저 브라우저에서 해당 계정으로 1회 이상 로그인해 주셔야 합니다.`);
    } else {
      console.error('❌ 권한 부여 실패:', error);
    }
    process.exit(1);
  }
}

grantAdminRole();
