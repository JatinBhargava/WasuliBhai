import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { formatMoney } from '@/lib/money';
import { formatDate, nextBilling, nthBillingDate, parseISODate } from '@/lib/dates';
import type { Settings, Subscription } from '@/types/subscription';

const CHANNEL_ID = 'renewals';
const REMIND_HOUR = 9;

/**
 * expo-notifications throws on import inside Expo Go on Android (SDK 53+), so reminders
 * there need a development build. Everywhere else the module is loaded lazily on first use.
 */
export const remindersSupported =
  Platform.OS === 'ios' || (Platform.OS === 'android' && !isRunningInExpoGo());

let notificationsModule: Promise<typeof import('expo-notifications')> | null = null;
const loadNotifications = () => (notificationsModule ??= import('expo-notifications'));

export async function setupNotifications() {
  if (!remindersSupported) return;
  const Notifications = await loadNotifications();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Renewal reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Asks for permission if not yet decided. Returns whether reminders can be delivered. */
export async function ensurePermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  const Notifications = await loadNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Reminder time for the next renewal whose reminder is still in the future. */
function nextReminder(sub: Subscription, now: Date): { fireAt: Date; renewal: Date } | null {
  if (sub.remindDaysBefore === null) return null;
  const start = parseISODate(sub.startDate);
  const { index } = nextBilling(sub.startDate, sub.cycle);
  // Today's reminder may already have passed, so also consider the following renewal.
  for (const n of [index, index + 1]) {
    const renewal = nthBillingDate(start, sub.cycle, n);
    const fireAt = new Date(renewal);
    fireAt.setDate(fireAt.getDate() - sub.remindDaysBefore);
    fireAt.setHours(REMIND_HOUR, 0, 0, 0);
    if (fireAt > now) return { fireAt, renewal };
  }
  return null;
}

function reminderTitle(sub: Subscription): string {
  if (sub.remindDaysBefore === 0) return `${sub.name} renews today`;
  if (sub.remindDaysBefore === 1) return `${sub.name} renews tomorrow`;
  return `${sub.name} renews in ${sub.remindDaysBefore} days`;
}

/**
 * Rebuilds every scheduled reminder from current data. Only the next renewal per
 * subscription is scheduled; this runs on every launch and change, so it rolls forward.
 */
export async function syncReminders(subscriptions: Subscription[], settings: Settings) {
  if (!remindersSupported) return;
  const Notifications = await loadNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.remindersEnabled) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const now = new Date();
  for (const sub of subscriptions) {
    if (!sub.active) continue;
    const reminder = nextReminder(sub, now);
    if (!reminder) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminderTitle(sub),
        body: `${formatMoney(sub.amount, settings.currency)} will be charged on ${formatDate(reminder.renewal)}.`,
        data: { subscriptionId: sub.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}
