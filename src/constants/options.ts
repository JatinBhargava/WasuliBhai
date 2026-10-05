import { SERVICES } from '@/constants/services';
import type { BillingCycle, Category, ReminderOffset } from '@/types/subscription';

export const CATEGORIES: Category[] = [
  'Entertainment',
  'Music',
  'Productivity',
  'Cloud',
  'Utilities',
  'Health',
  'News',
  'Gaming',
  'Education',
  'Other',
];

export const CYCLES: { value: BillingCycle; label: string; short: string }[] = [
  { value: 'weekly', label: 'Weekly', short: 'wk' },
  { value: 'monthly', label: 'Monthly', short: 'mo' },
  { value: 'quarterly', label: 'Quarterly', short: 'qtr' },
  { value: 'yearly', label: 'Yearly', short: 'yr' },
];

export const REMINDERS: { value: ReminderOffset; label: string }[] = [
  { value: null, label: 'Off' },
  { value: 0, label: 'Same day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
];

export const SWATCHES = [
  '#E50914',
  '#1DB954',
  '#5B5BD6',
  '#F59E0B',
  '#0EA5E9',
  '#EC4899',
  '#10B981',
  '#8B5CF6',
  '#F97316',
  '#64748B',
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY'];

/** Quick-add chips on the add screen. Prices vary by plan, so only name/category/colour are filled. */
export const PRESETS = SERVICES.filter((s) => s.preset).map(({ name, category, color }) => ({ name, category, color }));
