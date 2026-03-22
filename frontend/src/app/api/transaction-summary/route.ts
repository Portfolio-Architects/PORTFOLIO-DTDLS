import { NextResponse } from 'next/server';
import { TX_SUMMARY } from '@/lib/transaction-summary';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(TX_SUMMARY);
}
