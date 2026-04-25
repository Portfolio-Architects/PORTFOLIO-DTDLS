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

/**
 * Verifies that the requester is an authenticated Admin.
 * Bypasses checks if in Development mode.
 * 
 * @param request NextRequest
 * @returns Boolean representing authorization status.
 */
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  try {
    const decodedToken = await verifyAuthHeader(request);

    // Development mode bypass via MOCK_ADMIN_UID (Requires actual auth token to be valid)
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_ADMIN_UID) {
      if (decodedToken.uid === process.env.MOCK_ADMIN_UID) {
        return true;
      }
    }

    return decodedToken.admin === true;
  } catch (error) {
    console.error('Admin Verification Error:', error);
    return false;
  }
}

// Force Turbopack recompile
