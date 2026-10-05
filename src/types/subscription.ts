export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type Category =
  | 'Entertainment'
  | 'Music'
  | 'Productivity'
  | 'Cloud'
  | 'Utilities'
  | 'Health'
  | 'News'
  | 'Gaming'
  | 'Education'
  | 'Other';

/** Days before renewal to remind; null means no reminder. */
export type ReminderOffset = 0 | 1 | 3 | 7 | null;

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  /** First billing date as local `YYYY-MM-DD`. Later renewals are derived from it. */
  startDate: string;
  category: Category;
  color: string;
  notes: string;
  remindDaysBefore: ReminderOffset;
  active: boolean;
  createdAt: string;
}

export type SubscriptionInput = Omit<Subscription, 'id' | 'createdAt'>;

export interface Settings {
  currency: string;
  remindersEnabled: boolean;
}
