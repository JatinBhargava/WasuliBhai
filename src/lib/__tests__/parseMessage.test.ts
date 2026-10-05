import { parseMessages } from '@/lib/parseMessage';

const one = (text: string) => {
  const result = parseMessages(text);
  expect(result).toHaveLength(1);
  return result[0];
};

describe('parseMessages', () => {
  it('reads a UPI AutoPay debit and ignores the balance', () => {
    const c = one(
      'Rs.649.00 debited from A/c XX1234 on 05-10-26 towards NETFLIX for UPI AutoPay mandate. Avl Bal Rs.12,345.67.',
    );
    expect(c).toMatchObject({ name: 'Netflix', amount: 649, currency: 'INR', date: '2026-10-05', looksRecurring: true });
  });

  it('reads the mandate frequency and skips the "valid till" date', () => {
    const c = one('UPI AutoPay mandate of INR 119.00 for Spotify India created. Frequency: MONTHLY, valid till 31-Dec-2030.');
    expect(c).toMatchObject({ name: 'Spotify', amount: 119, cycle: 'monthly', cycleDetected: true, dateDetected: false });
  });

  it('falls back to the merchant name or UPI handle for unknown services', () => {
    expect(one('AutoPay of Rs.399 executed for CULTSPORT MEMBERSHIP on 03-Oct-2026.').name).toBe('Cultsport Membership');
    expect(one('Rs 999.00 debited via UPI AutoPay to abcfitness@ybl on 01/10/2026.').name).toBe('Abcfitness');
  });

  it('prefers the specific service over the app store in receipts', () => {
    const c = one('Receipt\n\nDATE\nOct 2, 2026\n\niCloud+ with 50 GB (Monthly)\nRenews Nov 2, 2026\n\nTotal ₹75.00');
    expect(c).toMatchObject({ name: 'iCloud+', amount: 75, date: '2026-10-02', category: 'Cloud' });
    expect(one('Your Google Play Order Receipt from Sep 28, 2026\n\nYouTube Premium\n₹149.00/month').name).toBe(
      'YouTube Premium',
    );
  });

  it('detects foreign currency and yearly billing', () => {
    expect(one('ChatGPT Plus subscription renewed. Amount: $240.00 per year. Billing date 2026-07-15.')).toMatchObject({
      currency: 'USD',
      amount: 240,
      cycle: 'yearly',
      date: '2026-07-15',
    });
  });

  it('splits several SMS separated by blank lines', () => {
    const result = parseMessages('Rs.649 debited towards NETFLIX on 05-10-26.\n\nRs 119 debited for Spotify autopay on 07-10-26.');
    expect(result.map((c) => c.name)).toEqual(['Netflix', 'Spotify']);
  });

  it('returns nothing when there is no amount', () => {
    expect(parseMessages('Your OTP for login is 123456. Do not share.')).toEqual([]);
  });
});
