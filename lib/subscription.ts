export type SubscriptionStatus = 'NONE' | 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

export interface SubscriptionUser {
  role: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
}

/** Stripe billing is enforced only when STRIPE_SECRET_KEY is configured. */
export function isBillingEnforced(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function isSubscriptionRequired(role: string): boolean {
  return role === 'CARRIER' && isBillingEnforced();
}

export function hasActiveSubscription(user: SubscriptionUser): boolean {
  if (user.role !== 'CARRIER') return true;

  if (user.subscriptionStatus === 'ACTIVE') return true;

  if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt && user.trialEndsAt > new Date()) {
    return true;
  }

  return false;
}

export function getTrialEndDate(): Date {
  const trial = new Date();
  trial.setDate(trial.getDate() + 14);
  return trial;
}
