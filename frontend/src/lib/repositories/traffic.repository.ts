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

/**
 * Increments global website visits for today.
 */
export async function incrementWebsiteVisit(): Promise<void> {
  const today = getTodayStr();
  const ref = doc(db, 'daily_stats', today);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { websiteVisits: 1, date: today }, { merge: true });
    } else {
      await updateDoc(ref, { websiteVisits: increment(1) });
    }
  } catch (e) {
    logger.error('TrafficRepository.incrementWebsiteVisit', 'Update failed', { today }, e);
  }
}

/**
 * Increments views for a specific piece of content for today.
 */
export async function incrementContentView(contentId: string, title: string, type: 'lounge' | 'report'): Promise<void> {
  const today = getTodayStr();
  const contentRef = doc(db, `daily_stats/${today}/content_views`, contentId);
  try {
    // We use setDoc with merge to safely increment without checking if existence
    await setDoc(contentRef, {
      title,
      type,
      views: increment(1)
    }, { merge: true });
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
