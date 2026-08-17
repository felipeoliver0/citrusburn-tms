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

export function getRateBadge(offeredPrice: number, suggestedRate: number) {
  if (suggestedRate === 0) return null;
  const ratio = offeredPrice / suggestedRate;
  if (ratio >= 1.05) {
    return { label: '🔥 Great Deal', color: 'bg-green-100 text-green-700 border-green-200' };
  }
  if (ratio < 0.90) {
    return { label: '⚠️ Below Market', color: 'bg-red-100 text-red-700 border-red-200' };
  }
  if (ratio >= 0.90 && ratio < 1.05) {
    return { label: 'Fair Rate', color: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
  return null;
}

/** @deprecated Use getSuggestedRate */
export const getSmartRate = getSuggestedRate;
