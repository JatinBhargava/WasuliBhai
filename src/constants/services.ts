import type { Category } from '@/types/subscription';

export interface KnownService {
  name: string;
  category: Category;
  color: string;
  /** Patterns that identify this service in an SMS or email. Empty = never auto-detected. */
  match: RegExp[];
  /** Shown as a quick-add chip on the add screen. */
  preset?: boolean;
}

/**
 * Order matters for detection: specific services come before the app stores, so an
 * Apple receipt for iCloud+ is detected as iCloud+, not as "App Store".
 */
export const SERVICES: KnownService[] = [
  { name: 'Netflix', category: 'Entertainment', color: '#E50914', match: [/netflix/i], preset: true },
  { name: 'Spotify', category: 'Music', color: '#1DB954', match: [/spotify/i], preset: true },
  { name: 'YouTube Premium', category: 'Entertainment', color: '#F97316', match: [/youtube/i], preset: true },
  { name: 'Amazon Prime', category: 'Entertainment', color: '#0EA5E9', match: [/amazon\s*prime|prime\s*video/i], preset: true },
  { name: 'JioHotstar', category: 'Entertainment', color: '#5B5BD6', match: [/hotstar|disney\s*\+/i], preset: true },
  { name: 'iCloud+', category: 'Cloud', color: '#64748B', match: [/icloud/i], preset: true },
  { name: 'Google One', category: 'Cloud', color: '#10B981', match: [/google\s*one/i], preset: true },
  { name: 'ChatGPT Plus', category: 'Productivity', color: '#8B5CF6', match: [/chatgpt|openai/i], preset: true },
  { name: 'Gym', category: 'Health', color: '#EC4899', match: [], preset: true },
  { name: 'Mobile plan', category: 'Utilities', color: '#F59E0B', match: [], preset: true },
  { name: 'Apple Music', category: 'Music', color: '#EC4899', match: [/apple\s*music/i] },
  { name: 'Apple TV+', category: 'Entertainment', color: '#64748B', match: [/apple\s*tv/i] },
  { name: 'Apple One', category: 'Entertainment', color: '#64748B', match: [/apple\s*one/i] },
  { name: 'ZEE5', category: 'Entertainment', color: '#8B5CF6', match: [/zee\s*5/i] },
  { name: 'SonyLIV', category: 'Entertainment', color: '#F59E0B', match: [/sony\s*liv/i] },
  { name: 'Tata Play', category: 'Entertainment', color: '#8B5CF6', match: [/tata\s*play|tata\s*sky/i] },
  { name: 'Audible', category: 'Entertainment', color: '#F59E0B', match: [/audible/i] },
  { name: 'Kindle Unlimited', category: 'Education', color: '#F59E0B', match: [/kindle/i] },
  { name: 'Duolingo', category: 'Education', color: '#10B981', match: [/duolingo/i] },
  { name: 'Microsoft 365', category: 'Productivity', color: '#0EA5E9', match: [/microsoft\s*365|office\s*365/i] },
  { name: 'Adobe', category: 'Productivity', color: '#E50914', match: [/adobe/i] },
  { name: 'Canva', category: 'Productivity', color: '#0EA5E9', match: [/canva/i] },
  { name: 'Notion', category: 'Productivity', color: '#64748B', match: [/notion/i] },
  { name: 'LinkedIn Premium', category: 'Productivity', color: '#0EA5E9', match: [/linkedin/i] },
  { name: 'GitHub', category: 'Productivity', color: '#64748B', match: [/github/i] },
  { name: 'Figma', category: 'Productivity', color: '#8B5CF6', match: [/figma/i] },
  { name: 'Claude', category: 'Productivity', color: '#F97316', match: [/anthropic|claude\.ai/i] },
  { name: 'Dropbox', category: 'Cloud', color: '#0EA5E9', match: [/dropbox/i] },
  { name: 'Swiggy One', category: 'Other', color: '#F97316', match: [/swiggy\s*one/i] },
  { name: 'Zomato Gold', category: 'Other', color: '#E50914', match: [/zomato\s*gold/i] },
  { name: 'Times Prime', category: 'Other', color: '#64748B', match: [/times\s*prime/i] },
  { name: 'Cult.fit', category: 'Health', color: '#EC4899', match: [/cult\.?\s*fit/i] },
  { name: 'Xbox Game Pass', category: 'Gaming', color: '#10B981', match: [/xbox/i] },
  { name: 'PlayStation Plus', category: 'Gaming', color: '#5B5BD6', match: [/playstation|\bpsn\b/i] },
  { name: 'Airtel', category: 'Utilities', color: '#E50914', match: [/airtel/i] },
  { name: 'Jio', category: 'Utilities', color: '#0EA5E9', match: [/\bjio\b/i] },
  { name: 'Vi (Vodafone Idea)', category: 'Utilities', color: '#F59E0B', match: [/vodafone/i] },
  // App stores last: only used when no specific service was recognised.
  { name: 'Google Play', category: 'Other', color: '#10B981', match: [/google\s*play/i] },
  { name: 'App Store', category: 'Other', color: '#64748B', match: [/apple\.com\/bill|app\s*store|\bapple\b/i] },
];

export function findService(text: string): KnownService | undefined {
  return SERVICES.find((s) => s.match.some((re) => re.test(text)));
}
