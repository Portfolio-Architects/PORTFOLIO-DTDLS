/**
 * @module report.repository
 * @description Data Access Layer for 'scoutingReports' Firestore collection.
 * Architecture Layer: Repository (CRUD only, no business logic)
 */
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import type { FieldReportData } from '@/lib/types/report.types';

/**
 * Listens to the 'scoutingReports' collection in real-time.
 * Maps only lightweight fields needed for list cards.
 * Heavy fields (sections, images) are loaded on-demand via getFullReport().
 * @param callback - Invoked with the latest reports array on each change
 * @returns Unsubscribe function
 */
export function listenToReports(callback: (reports: FieldReportData[]) => void): () => void {
  const q = query(collection(db, 'scoutingReports'), orderBy('viewCount', 'desc'), limit(30));

  const mapSnapshot = (snapshot: any): FieldReportData[] => {
    const reports: FieldReportData[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      reports.push({
        id: docSnap.id,
        dong: data.dong || '오산동 (동탄역)',
        apartmentName: data.apartmentName,
        premiumScores: data.premiumScores,
        premiumContent: data.premiumContent,
        pros: data.premiumContent || '포장 싹 뺀 진짜 동네 아파트 리뷰',
        cons: '',
        rating: 5,
        author: '데이터 랩스',
        likes: data.likes || 0,
        viewCount: data.viewCount || 0,
        commentCount: data.commentCount || 0,
        imageUrl: data.thumbnailUrl || data.imageUrl,
        metrics: data.metrics,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전',
      });
    });
    return reports;
  };

  return onSnapshot(q, (snapshot) => {
    callback(mapSnapshot(snapshot));
  }, (error) => {
    console.error('[ReportRepo] onSnapshot error, falling back to unordered query:', error.message);
    // Fallback: query without orderBy (no index needed)
    const fallbackQ = query(collection(db, 'scoutingReports'), limit(30));
    onSnapshot(fallbackQ, (fallbackSnapshot) => {
      callback(mapSnapshot(fallbackSnapshot));
    }, (fallbackError) => {
      console.error('[ReportRepo] Fallback also failed:', fallbackError.message);
      callback([]);
    });
  });
}

/**
 * Fetches a single report's full data (including sections & images) on demand.
 * Used when opening the detail modal — avoids loading heavy data for all 30 reports upfront.
 * @param reportId - The Firestore document ID
 * @returns Full report data, or null if not found
 */
export async function getFullReport(reportId: string): Promise<FieldReportData | null> {
  const docRef = doc(db, 'scoutingReports', reportId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    dong: data.dong || '오산동 (동탄역)',
    apartmentName: data.apartmentName,
    sections: data.sections || undefined,
    premiumScores: data.premiumScores,
    premiumContent: data.premiumContent,
    pros: data.premiumContent || '포장 싹 뺀 진짜 동네 아파트 리뷰',
    cons: '',
    rating: 5,
    author: '데이터 랩스',
    likes: data.likes || 0,
    viewCount: data.viewCount || 0,
    commentCount: data.commentCount || 0,
    imageUrl: data.thumbnailUrl || data.imageUrl,
    images: data.images || [],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전',
  };
}

/**
 * Increments the like counter on a field report.
 * @param reportId - The Firestore document ID
 * @throws FirestoreError if update fails
 */
export async function incrementReportLike(reportId: string): Promise<void> {
  const reportRef = doc(db, 'field_reports', reportId);
  await updateDoc(reportRef, { likes: increment(1) });
}
