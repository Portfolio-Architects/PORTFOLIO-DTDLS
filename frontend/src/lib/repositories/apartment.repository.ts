/**
 * @module apartment.repository
 * @description Data Access Layer for Dongtan apartment list.
 * Architecture Layer: Repository (data access)
 * 
 * Uses /api/apartments (FULL_DONG_DATA) as single source of truth
 * for all apartment lists: 동네리뷰 선택, 입주민 인증, 임장기 작성 등
 */
import { logger } from '@/lib/services/logger';

/**
 * Fetches full apartment list from /api/apartments (FULL_DONG_DATA).
 * Returns in "[법정동] 아파트명" format for WriteReviewModal, resident verification, etc.
 */
export async function fetchApartmentNames(): Promise<string[]> {
  try {
    const response = await fetch('/api/apartments', {
      next: { revalidate: 86400 }, // cache 24h
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const dongData: Record<string, string[]> = await response.json();
    
    const apartments: string[] = [];
    for (const [dong, apts] of Object.entries(dongData)) {
      if (dong === '기타') continue; // skip '기타' entry
      for (const apt of apts) {
        apartments.push(`[${dong}] ${apt}`);
      }
    }
    
    apartments.sort();
    logger.info('ApartmentRepository.fetch', `Loaded ${apartments.length} apartments from FULL_DONG_DATA`);
    return apartments;
  } catch (error) {
    logger.warn('ApartmentRepository.fetch', '/api/apartments failed', undefined, error);
    return [];
  }
}
