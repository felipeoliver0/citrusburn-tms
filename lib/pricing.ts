/**
 * Heuristic rate calculator for loadboard price suggestions.
 * Uses distance tiers — not ML/AI.
 */
export function getSuggestedRate(distance: number): number {
  if (!distance || distance <= 0) return 0;

  let rate = 150; // Base pickup fee

  if (distance < 100) {
    rate += distance * 1.5;
  } else if (distance < 500) {
    rate += distance * 1.25;
  } else if (distance < 1000) {
    rate += distance * 1.0;
  } else {
    rate += distance * 0.85;
  }

  return Math.round(rate);
}



/** @deprecated Use getSuggestedRate */
export const getSmartRate = getSuggestedRate;
