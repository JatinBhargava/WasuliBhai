import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ensurePermission, setupNotifications, syncReminders } from '@/lib/reminders';
import { DEFAULT_SETTINGS, loadData, saveSettings, saveSubscriptions } from '@/lib/storage';
import type { Settings, Subscription, SubscriptionInput } from '@/types/subscription';

interface SubscriptionsContextValue {
  loaded: boolean;
  /** Stored data could not be read. Nothing is saved until a retry succeeds, so it is never overwritten. */
  loadError: boolean;
  retryLoad: () => void;
  subscriptions: Subscription[];
  settings: Settings;
  getSubscription: (id: string) => Subscription | undefined;
  addSubscription: (input: SubscriptionInput) => void;
  updateSubscription: (id: string, input: SubscriptionInput) => void;
  deleteSubscription: (id: string) => void;
  toggleActive: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  clearAll: () => void;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const load = useCallback(() => {
    loadData()
      .then((data) => {
        setSubscriptions(data.subscriptions);
        setSettings(data.settings);
        setLoaded(true);
      })
      .catch((error) => {
        console.warn(error);
        setLoadError(true);
      });
  }, []);

  useEffect(() => {
    setupNotifications().catch(console.warn);
    load();
  }, [load]);

  // Persist only after a successful load so the empty defaults never overwrite stored data.
  useEffect(() => {
    if (!loaded) return;
    saveSubscriptions(subscriptions).catch(console.warn);
  }, [loaded, subscriptions]);

  useEffect(() => {
    if (!loaded) return;
    saveSettings(settings).catch(console.warn);
  }, [loaded, settings]);

  useEffect(() => {
    if (!loaded) return;
    syncReminders(subscriptions, settings).catch(console.warn);
  }, [loaded, subscriptions, settings]);

  const requestRemindersIfNeeded = useCallback(
    (input: SubscriptionInput) => {
      if (input.remindDaysBefore !== null && settings.remindersEnabled) {
        // Re-sync once granted, since the effect above may have run before permission existed.
        ensurePermission()
          .then((granted) => {
            if (granted) setSubscriptions((prev) => [...prev]);
          })
          .catch(console.warn);
      }
    },
    [settings.remindersEnabled],
  );

  const addSubscription = useCallback(
    (input: SubscriptionInput) => {
      const sub: Subscription = { ...input, id: newId(), createdAt: new Date().toISOString() };
      setSubscriptions((prev) => [...prev, sub]);
      requestRemindersIfNeeded(input);
    },
    [requestRemindersIfNeeded],
  );

  const updateSubscription = useCallback(
    (id: string, input: SubscriptionInput) => {
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...input } : s)));
      requestRemindersIfNeeded(input);
    },
    [requestRemindersIfNeeded],
  );

  const deleteSubscription = useCallback((id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleActive = useCallback((id: string) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearAll = useCallback(() => setSubscriptions([]), []);

  const value = useMemo<SubscriptionsContextValue>(
    () => ({
      loaded,
      loadError,
      retryLoad: () => {
        setLoadError(false);
        load();
      },
      subscriptions,
      settings,
      getSubscription: (id) => subscriptions.find((s) => s.id === id),
      addSubscription,
      updateSubscription,
      deleteSubscription,
      toggleActive,
      updateSettings,
      clearAll,
    }),
    [
      loaded,
      loadError,
      load,
      subscriptions,
      settings,
      addSubscription,
      updateSubscription,
      deleteSubscription,
      toggleActive,
      updateSettings,
      clearAll,
    ],
  );

  return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>;
}

export function useSubscriptions() {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) throw new Error('useSubscriptions must be used inside SubscriptionsProvider');
  return ctx;
}
