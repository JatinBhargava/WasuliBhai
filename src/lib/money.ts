import type { BillingCycle, Subscription } from '@/types/subscription';

const MONTHLY_FACTOR: Record<BillingCycle, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export function monthlyCost(sub: Pick<Subscription, 'amount' | 'cycle'>): number {
  return sub.amount * MONTHLY_FACTOR[sub.cycle];
}

export function totalMonthly(subs: Subscription[]): number {
  return subs.filter((s) => s.active).reduce((sum, s) => sum + monthlyCost(s), 0);
}

export function formatMoney(amount: number, currency: string, compact = false): string {
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: compact || Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(compact ? 0 : 2)}`;
  }
}

/** Parses user-typed amounts like "1,299.50". Returns NaN when invalid. */
export function parseAmount(text: string): number {
  const cleaned = text.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}
