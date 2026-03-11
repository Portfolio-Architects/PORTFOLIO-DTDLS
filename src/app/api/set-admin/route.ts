import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin 이 초기화되지 않았습니다. serviceAccountKey.json을 확인하세요.' }, 
        { status: 500 }
      );
    }

    const { email, secretKey } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '이메일을 제공해야 합니다.' }, { status: 400 });
    }

    // 이메일로 Firebase 사용자 찾기
    const user = await adminAuth.getUserByEmail(email);
    
    // admin = true 클레임 부여
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });

    return NextResponse.json({ 
      success: true,
      message: `성공! [${email}] 계정에 Admin 권한이 성공적으로 부여되었습니다. 변경사항을 적용하려면 브라우저에서 해당 계정을 로그아웃 후 다시 로그인하세요.`,
      uid: user.uid
    });

  } catch (error: any) {
    console.error('Error setting admin claim:', error);
    
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: '일치하는 사용자를 찾을 수 없습니다. 먼저 브라우저에서 구글 로그인으로 계정을 생성해야 합니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
