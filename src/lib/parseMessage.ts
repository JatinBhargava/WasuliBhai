import { findService } from '@/constants/services';
import { startOfToday, toISODate } from '@/lib/dates';
import type { BillingCycle, Category } from '@/types/subscription';

/** A subscription guessed from a bank SMS or receipt email. The user reviews it before saving. */
export interface DetectedCharge {
  name: string | null;
  amount: number | null;
  /** ISO code of the currency written in the message, if any. */
  currency: string | null;
  cycle: BillingCycle;
  cycleDetected: boolean;
  /** Charge date as `YYYY-MM-DD`; today when none was found. */
  date: string;
  dateDetected: boolean;
  category: Category;
  color: string;
  /** Whether the text mentions autopay / mandate / subscription / renewal wording. */
  looksRecurring: boolean;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

const CURRENCY_CODES: Record<string, string> = {
  '₹': 'INR', rs: 'INR', 'rs.': 'INR', inr: 'INR',
  $: 'USD', usd: 'USD', '€': 'EUR', eur: 'EUR', '£': 'GBP', gbp: 'GBP', aed: 'AED', sgd: 'SGD',
};

const RECURRING_RE =
  /auto\s*-?\s*pay|e-?\s*mandate|mandate|standing instruction|\bSI\b|recurring|subscription|renew|membership|auto\s*-?\s*debit/i;

/** Words that mean a nearby number or date is not the charge itself. */
const BALANCE_BEFORE = /(bal(ance)?|avl|available|limit)[\s:.]*$/i;
const NOT_CHARGE_DATE_BEFORE = /(till|until|upto|up to|expir\w*|valid\w*|end\w*)[\s:.]*$/i;

const SKIP_NAME = /^(your|you|a\/?c|ac|account|card|bank|the|rs\.?|inr|upi|vpa|mobile|beneficiary)\b/i;

function findAmount(text: string): { amount: number; currency: string } | null {
  const re = /(₹|\$|€|£|\b(?:rs\.?|inr|usd|eur|gbp|aed|sgd)\b)\s*([\d,]+(?:\.\d{1,2})?)/gi;
  for (const m of text.matchAll(re)) {
    if (BALANCE_BEFORE.test(text.slice(Math.max(0, m.index - 25), m.index))) continue;
    const amount = Number(m[2].replace(/,/g, ''));
    if (amount > 0) return { amount, currency: CURRENCY_CODES[m[1].toLowerCase()] ?? 'INR' };
  }
  return null;
}

function validDate(y: number, m: number, d: number): Date | null {
  if (y < 100) y += 2000;
  const date = new Date(y, m, d);
  const ok = date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
  return ok && y >= 2000 && y <= 2100 ? date : null;
}

function findDate(text: string): Date | null {
  const candidates: { index: number; date: Date | null }[] = [];
  const collect = (re: RegExp, toDate: (m: RegExpMatchArray) => Date | null) => {
    for (const m of text.matchAll(re)) candidates.push({ index: m.index ?? 0, date: toDate(m) });
  };
  const month = (s: string) => MONTHS.indexOf(s.slice(0, 3).toLowerCase());

  // 05-Oct-26, 5 Oct 2026, 05/Oct/2026
  collect(new RegExp(`\\b(\\d{1,2})[-/. ]?(${MONTH_RE})[a-z]*[-/., ]*(\\d{4}|\\d{2})\\b`, 'gi'), (m) =>
    validDate(Number(m[3]), month(m[2]), Number(m[1])),
  );
  // Oct 5, 2026
  collect(new RegExp(`\\b(${MONTH_RE})[a-z]*\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'gi'), (m) =>
    validDate(Number(m[3]), month(m[1]), Number(m[2])),
  );
  // 2026-10-05
  collect(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m) => validDate(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  // 05-10-2026 / 05/10/26: day first (Indian format) unless that is impossible.
  collect(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})\b/g, (m) => {
    const [a, b, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return b > 12 ? validDate(y, a - 1, b) : validDate(y, b - 1, a);
  });

  candidates.sort((x, y) => x.index - y.index);
  for (const c of candidates) {
    if (!c.date) continue;
    if (NOT_CHARGE_DATE_BEFORE.test(text.slice(Math.max(0, c.index - 15), c.index))) continue;
    return c.date;
  }
  return null;
}

function findCycle(text: string): BillingCycle | null {
  const frequency = text.match(/frequency\s*[:-]?\s*(\w+)/i)?.[1].toLowerCase();
  if (frequency?.startsWith('week')) return 'weekly';
  if (frequency?.startsWith('month')) return 'monthly';
  if (frequency?.startsWith('quarter')) return 'quarterly';
  if (frequency?.startsWith('year') || frequency?.startsWith('annual')) return 'yearly';

  if (/\bweekly\b|per week|every week|\/\s*wk\b/i.test(text)) return 'weekly';
  if (/quarterly|every 3 months|\b3[- ]months?\b/i.test(text)) return 'quarterly';
  if (/\byearly\b|annual|per year|every year|\/\s*(yr|year)\b|\b12[- ]months?\b/i.test(text)) return 'yearly';
  if (/monthly|per month|every month|\/\s*mo(nth)?\b|\b1[- ]month\b/i.test(text)) return 'monthly';
  return null;
}

function cleanName(raw: string): string | null {
  const name = raw.replace(/[\s.\-_]+$/, '').trim();
  if (name.length < 2 || SKIP_NAME.test(name) || /^\d+$/.test(name)) return null;
  // Bank SMS shout merchant names ("NETFLIX COM"); make them readable.
  const titled = name === name.toUpperCase() ? name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : name;
  return titled.slice(0, 40);
}

/** Best-effort merchant name for services not in the catalogue. */
function findMerchant(text: string): string | null {
  const stop = String.raw`(?=\s+(?:for|of|on|via|with|from|is|has|at|ref|upi|amt|amount|rs|inr|dated|w\.?e\.?f)\b|[.,;:\n(|]|$)`;
  const name = String.raw`([A-Za-z][\w&'\- ]{1,40}?)`;
  const patterns = [
    new RegExp(String.raw`\b(?:merchant(?:\s*name)?|payee(?:\s*name)?|info)\s*[:\-]\s*${name}${stop}`, 'i'),
    new RegExp(String.raw`\b(?:in favou?r of|towards)\s+${name}${stop}`, 'i'),
    new RegExp(String.raw`\b(?:mandate|autopay|subscription)\b(?:[^.\n]|\.(?=\S))*?\bfor\s+${name}${stop}`, 'i'),
    new RegExp(String.raw`\bat\s+${name}${stop}`, 'i'),
  ];
  for (const re of patterns) {
    const cleaned = cleanName(text.match(re)?.[1] ?? '');
    if (cleaned) return cleaned;
  }
  // UPI handle such as "abcfitness@ybl" -> "Abcfitness"
  const vpa = text.match(/\b([a-z][a-z0-9]{2,})(?:[.\-_][a-z0-9]+)*@[a-z]{2,}\b/i)?.[1];
  return vpa ? cleanName(vpa.charAt(0).toUpperCase() + vpa.slice(1).toLowerCase()) : null;
}

export function parseCharge(text: string): DetectedCharge | null {
  const found = findAmount(text);
  if (!found) return null;
  const service = findService(text);
  const cycle = findCycle(text);
  const date = findDate(text);
  return {
    name: service?.name ?? findMerchant(text),
    amount: found.amount,
    currency: found.currency,
    cycle: cycle ?? 'monthly',
    cycleDetected: cycle !== null,
    date: toISODate(date ?? startOfToday()),
    dateDetected: date !== null,
    category: service?.category ?? 'Other',
    color: service?.color ?? '#64748B',
    looksRecurring: RECURRING_RE.test(text),
  };
}

/**
 * Parses pasted text. Several SMS separated by blank lines become separate charges;
 * otherwise (e.g. an email, which has blank lines inside it) the whole text is one charge.
 */
export function parseMessages(text: string): DetectedCharge[] {
  const chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length > 1) {
    const parsed = chunks.map(parseCharge);
    if (parsed.filter(Boolean).length >= 2 && parsed.every((p) => p === null || p.name !== null)) {
      return parsed.filter((p): p is DetectedCharge => p !== null);
    }
  }
  const whole = parseCharge(text);
  return whole ? [whole] : [];
}
