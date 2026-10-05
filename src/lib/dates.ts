import type { BillingCycle } from '@/types/subscription';

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD` (no timezone shift, unlike toISOString). */
export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Adds months, clamping to the month's last day (Jan 31 + 1 month = Feb 28/29). */
function addMonthsClamped(anchor: Date, months: number): Date {
  const target = new Date(anchor.getFullYear(), anchor.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(anchor.getDate(), lastDay));
  return target;
}

const MONTHS_PER_CYCLE: Record<Exclude<BillingCycle, 'weekly'>, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/** The nth billing date (n = 0 is the start date). */
export function nthBillingDate(start: Date, cycle: BillingCycle, n: number): Date {
  if (cycle === 'weekly') {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * n);
  }
  return addMonthsClamped(start, MONTHS_PER_CYCLE[cycle] * n);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * First billing date on or after `from`, plus its index (which equals the number of
 * payments already made before it).
 */
export function nextBilling(
  startISO: string,
  cycle: BillingCycle,
  from: Date = startOfToday(),
): { date: Date; index: number } {
  const start = parseISODate(startISO);
  if (start >= from) return { date: start, index: 0 };

  let n: number;
  if (cycle === 'weekly') {
    n = Math.ceil(daysBetween(start, from) / 7);
  } else {
    const months =
      (from.getFullYear() - start.getFullYear()) * 12 + (from.getMonth() - start.getMonth());
    n = Math.floor(months / MONTHS_PER_CYCLE[cycle]);
  }
  while (nthBillingDate(start, cycle, n) < from) n++;
  return { date: nthBillingDate(start, cycle, n), index: n };
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relativeDays(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${-days} days ago`;
  return `In ${days} days`;
}
