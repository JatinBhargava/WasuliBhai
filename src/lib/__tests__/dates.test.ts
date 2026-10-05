import { nextBilling, parseISODate, toISODate } from '@/lib/dates';
import type { BillingCycle } from '@/types/subscription';

describe('nextBilling', () => {
  const cases: [start: string, cycle: BillingCycle, from: string, date: string, index: number][] = [
    ['2026-01-31', 'monthly', '2026-02-10', '2026-02-28', 1], // clamps to month end
    ['2026-01-31', 'monthly', '2026-03-01', '2026-03-31', 2], // returns to the 31st
    ['2024-02-29', 'yearly', '2025-01-01', '2025-02-28', 1], // leap day in a non-leap year
    ['2024-02-29', 'yearly', '2028-02-01', '2028-02-29', 4],
    ['2026-10-05', 'monthly', '2026-10-05', '2026-10-05', 0], // due today
    ['2026-12-01', 'monthly', '2026-10-05', '2026-12-01', 0], // starts in the future
    ['2026-09-01', 'weekly', '2026-10-05', '2026-10-06', 5],
    ['2025-11-15', 'quarterly', '2026-10-05', '2026-11-15', 4],
    ['2025-10-20', 'monthly', '2026-10-05', '2026-10-20', 12],
  ];

  it.each(cases)('%s %s from %s -> %s (#%i)', (start, cycle, from, date, index) => {
    const next = nextBilling(start, cycle, parseISODate(from));
    expect(toISODate(next.date)).toBe(date);
    expect(next.index).toBe(index);
  });
});
