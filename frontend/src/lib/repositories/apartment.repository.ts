/**
 * @module apartment.repository
 * @description Data Access Layer for MOLIT public real estate API.
 * Architecture Layer: Repository (external API data access)
 * 
 * Rationale: XML parsing and API-specific logic are isolated here,
 * keeping the service layer API-agnostic.
 */
import { MOLIT_API_CONFIG, FALLBACK_APARTMENTS } from '@/lib/config/api.config';
import { logger } from '@/lib/services/logger';

/**
 * Fetches apartment names from the MOLIT Real Estate Open API.
 * Falls back to a curated list if the API is unavailable.
 * @returns Array of apartment name strings in "[법정동] 아파트명" format
 */
export async function fetchApartmentNames(): Promise<string[]> {
  const { serviceKey, lawdCode, dealYearMonth, baseUrl, timeoutMs, numOfRows } = MOLIT_API_CONFIG;
  const url = `${baseUrl}?serviceKey=${serviceKey}&pageNo=1&numOfRows=${numOfRows}&LAWD_CD=${lawdCode}&DEAL_YMD=${dealYearMonth}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');

    if (items.length === 0) {
      throw new Error('API returned no items (Auth Error or Ratelimit).');
    }

    const aptSet = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      const aptNmNode = items[i].getElementsByTagName('aptNm')[0];
      const dongNode = items[i].getElementsByTagName('umdNm')[0];

      if (aptNmNode && dongNode) {
        const aptNm = aptNmNode.textContent?.trim();
        const dongNm = dongNode.textContent?.trim() || '';
        if (aptNm) aptSet.add(`[${dongNm}] ${aptNm}`);
      }
    }

    const apartments = Array.from(aptSet).sort();
    logger.info('ApartmentRepository.fetch', `Fetched ${apartments.length} apartments from MOLIT API`);
    return apartments;
  } catch (error) {
    clearTimeout(timeoutId);
    logger.warn('ApartmentRepository.fetch', 'MOLIT API failed, using fallback', undefined, error);
    return [...FALLBACK_APARTMENTS];
  }
}
