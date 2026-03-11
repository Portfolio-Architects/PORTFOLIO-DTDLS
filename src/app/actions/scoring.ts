'use server';

import { calculatePremiumScores } from '@/lib/utils/scoring';
import { ObjectiveMetrics } from '@/lib/types/scoutingReport';

/**
 * Server Action to calculate premium scores on the backend.
 * Ensures the scoring algorithm is never exposed to the client bundle.
 */
export async function getPremiumScoresAction(metrics: ObjectiveMetrics) {
  // Add an artificial delay to simulate heavy backend processing if needed
  // await new Promise(resolve => setTimeout(resolve, 500));
  
  return calculatePremiumScores(metrics);
}
