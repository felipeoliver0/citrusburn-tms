import { describe, it, expect } from 'vitest';
import { getSuggestedRate, getRateBadge } from '@/lib/pricing';

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

describe('getRateBadge', () => {
  it('returns null when suggested rate is 0', () => {
    expect(getRateBadge(1000, 0)).toBeNull();
  });

  it('returns Great Deal badge when price is 5%+ above suggested', () => {
    const badge = getRateBadge(1100, 1000);
    expect(badge).not.toBeNull();
    expect(badge?.label).toContain('Great Deal');
  });

  it('returns null when price is at or below suggested', () => {
    expect(getRateBadge(1000, 1000)).toBeNull();
    expect(getRateBadge(900, 1000)).toBeNull();
  });
});
