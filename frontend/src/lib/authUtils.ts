import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

/**
 * Extracts and verifies the Firebase ID Token from the Authorization header.
 * Basic Header syntax expected: "Bearer <token>"
 * 
 * @param request NextRequest
 * @returns DecodedIdToken if valid, throws error otherwise.
 */
export async function verifyAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split('Bearer ')[1];
  
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  // Verify token
  return await adminAuth.verifyIdToken(token);
}
