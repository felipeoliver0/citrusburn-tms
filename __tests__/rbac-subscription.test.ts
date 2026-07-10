import { describe, it, expect } from 'vitest';
import { getRoleRedirect } from '@/lib/rbac';
import { hasActiveSubscription, isSubscriptionRequired, getTrialEndDate } from '@/lib/subscription';

describe('getRoleRedirect', () => {
  it('redirects drivers away from dashboard', () => {
    expect(getRoleRedirect('DRIVER', '/dashboard')).toBe('/driver');
  });

  it('redirects drivers away from loadboard', () => {
    expect(getRoleRedirect('DRIVER', '/loadboard')).toBe('/driver');
  });

  it('blocks brokers from fleet', () => {
    expect(getRoleRedirect('BROKER', '/fleet')).toBe('/dashboard');
  });

  it('blocks non-admins from admin panel', () => {
    expect(getRoleRedirect('CARRIER', '/admin/users')).toBe('/dashboard');
  });

  it('allows admin access to admin panel', () => {
    expect(getRoleRedirect('ADMIN', '/admin/users')).toBeNull();
  });

  it('allows carrier access to loadboard', () => {
    expect(getRoleRedirect('CARRIER', '/loadboard')).toBeNull();
  });
});

describe('subscription', () => {
  it('requires subscription for carriers only when billing is enforced', () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    expect(isSubscriptionRequired('CARRIER')).toBe(false);
    process.env.STRIPE_SECRET_KEY = original;
  });

  it('grants access during active trial', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(
      hasActiveSubscription({
        role: 'CARRIER',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: future,
        subscriptionEndsAt: null,
      })
    ).toBe(true);
  });

  it('denies access after expired trial', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(
      hasActiveSubscription({
        role: 'CARRIER',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: past,
        subscriptionEndsAt: null,
      })
    ).toBe(false);
  });

  it('brokers always have access', () => {
    expect(
      hasActiveSubscription({
        role: 'BROKER',
        subscriptionStatus: 'NONE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      })
    ).toBe(true);
  });

  it('getTrialEndDate returns 14 days from now', () => {
    const trial = getTrialEndDate();
    const diff = trial.getTime() - Date.now();
    expect(diff).toBeGreaterThan(13 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(15 * 24 * 60 * 60 * 1000);
  });
});
