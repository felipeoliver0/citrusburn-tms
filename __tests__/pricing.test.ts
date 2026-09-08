import { describe, it, expect } from 'vitest';
import { getSuggestedRate } from '@/lib/pricing';

describe('getSuggestedRate', () => {
  it('returns 0 for invalid distance', () => {
    expect(getSuggestedRate(0)).toBe(0);
    expect(getSuggestedRate(-10)).toBe(0);
  });

  it('calculates short haul rates', () => {
    const rate = getSuggestedRate(50);
    expect(rate).toBeGreaterThan(150);
    expect(rate).toBeLessThan(500);
  });

  it('calculates long haul rates lower per mile', () => {
    const short = getSuggestedRate(100);
    const long = getSuggestedRate(1500);
    expect(long).toBeGreaterThan(short);
    expect(long / 1500).toBeLessThan(short / 100);
  });
});

