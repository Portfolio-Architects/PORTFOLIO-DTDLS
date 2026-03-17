import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payment/confirm
 * 
 * Server-side payment confirmation endpoint.
 * Receives paymentKey, orderId, amount from client after user completes payment,
 * then confirms the payment with TossPayments API using the secret key.
 * On success, creates a purchase record in Firestore.
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount, userId, reportId } = await request.json();

    // Validate required fields
    if (!paymentKey || !orderId || !amount || !userId || !reportId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Validate amount matches expected price
    if (amount !== 5000) {
      return NextResponse.json(
        { error: '결제 금액이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // Confirm payment with TossPayments API
    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
    if (!secretKey) {
      console.error('TOSS_PAYMENTS_SECRET_KEY is not set');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    const confirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.error('TossPayments confirm failed:', errorData);
      return NextResponse.json(
        { error: errorData.message || '결제 승인에 실패했습니다.' },
        { status: confirmResponse.status }
      );
    }

    // Payment confirmed — save purchase record to Firestore
    // Using Firebase Admin SDK for server-side
    const { adminDb } = await import('@/lib/firebaseAdmin');
    
    if (!adminDb) {
      console.error('Firebase Admin not initialized');
      return NextResponse.json(
        { error: '서버 설정 오류입니다. (DB 연결 실패)' },
        { status: 500 }
      );
    }

    await adminDb.collection('purchases').add({
      userId,
      reportId,
      orderId,
      paymentKey,
      amount,
      status: 'DONE',
      purchasedAt: new Date(),
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
