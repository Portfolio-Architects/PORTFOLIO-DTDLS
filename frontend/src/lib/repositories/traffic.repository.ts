/**
 * @module traffic.repository
 * @description Data Access Layer for 'daily_stats' Firestore collection.
 * Architecture Layer: Repository
 */
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from 'firebase/firestore';
import { logger } from '@/lib/services/logger';

/**
 * Gets today's date in YYYY-MM-DD format strictly.
 */
function getTodayStr(): string {
  const d = new Date();
  d.setHours(d.getHours() + 9); // KST Timezone adjustment approximation
  return d.toISOString().split('T')[0];
}

export async function incrementWebsiteVisit(): Promise<void> {
  try {
    await fetch('/api/traffic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'websiteVisit' })
    });
  } catch (e) {
    logger.error('TrafficRepository.incrementWebsiteVisit', 'Update failed', undefined, e);
  }
}

export async function incrementContentView(contentId: string, title: string, type: 'lounge' | 'report'): Promise<void> {
  try {
    await fetch('/api/traffic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'contentView', contentId, title, type })
    });
  } catch (e) {
    logger.error('TrafficRepository.incrementContentView', 'Update failed', { contentId, type }, e);
  }
}

export interface DailyStat {
  date: string;
  websiteVisits: number;
}

export interface ContentView {
  id: string; // contentId
  title: string;
  type: string;
  views: number;
}

/**
 * Fetches the daily web visit stats.
 */
export async function getDailyVisitStats(): Promise<DailyStat[]> {
  try {
    const snap = await getDocs(collection(db, 'daily_stats'));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        date: d.id,
        websiteVisits: data.websiteVisits || 0
      };
    });
  } catch (e) {
    logger.error('TrafficRepository.getDailyVisitStats', 'Fetch failed', undefined, e);
    return [];
  }
}

/**
 * Fetches content views for a specific date.
 */
export async function getDailyContentViews(dateStr: string): Promise<ContentView[]> {
  try {
    const snap = await getDocs(collection(db, `daily_stats/${dateStr}/content_views`));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || '알 수 없음',
        type: data.type || 'unknown',
        views: data.views || 0
      };
    }).sort((a, b) => b.views - a.views); // sort highest views first
  } catch (e) {
    logger.error('TrafficRepository.getDailyContentViews', 'Fetch failed', { dateStr }, e);
    return [];
  }
}
