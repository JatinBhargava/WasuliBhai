import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Settings, Subscription } from '@/types/subscription';

const SUBSCRIPTIONS_KEY = 'wasulibhai:subscriptions:v1';
const SETTINGS_KEY = 'wasulibhai:settings:v1';

export const DEFAULT_SETTINGS: Settings = { currency: 'INR', remindersEnabled: true };

export async function loadData(): Promise<{ subscriptions: Subscription[]; settings: Settings }> {
  const [subsRaw, settingsRaw] = await Promise.all([
    AsyncStorage.getItem(SUBSCRIPTIONS_KEY),
    AsyncStorage.getItem(SETTINGS_KEY),
  ]);
  return {
    subscriptions: subsRaw ? (JSON.parse(subsRaw) as Subscription[]) : [],
    settings: { ...DEFAULT_SETTINGS, ...(settingsRaw ? (JSON.parse(settingsRaw) as Partial<Settings>) : {}) },
  };
}

export function saveSubscriptions(subscriptions: Subscription[]) {
  return AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
}

export function saveSettings(settings: Settings) {
  return AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
