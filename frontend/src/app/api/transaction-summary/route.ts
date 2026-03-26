import { NextResponse } from 'next/server';

export const runtime = 'edge';
import { TX_SUMMARY } from '@/lib/transaction-summary';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(TX_SUMMARY);
}
