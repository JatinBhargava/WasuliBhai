import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { HeaderButton } from '@/components/HeaderButton';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { colors, radius, spacing } from '@/constants/theme';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { daysBetween, nextBilling, startOfToday } from '@/lib/dates';
import { formatMoney, monthlyCost, totalMonthly } from '@/lib/money';
import type { Subscription } from '@/types/subscription';

type SortKey = 'due' | 'price' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'due', label: 'Next due' },
  { key: 'price', label: 'Price' },
  { key: 'name', label: 'Name' },
];

const nextDueTime = (s: Subscription) => nextBilling(s.startDate, s.cycle).date.getTime();

export default function HomeScreen() {
  const { loaded, loadError, retryLoad, subscriptions, settings } = useSubscriptions();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('due');

  const active = subscriptions.filter((s) => s.active);
  const monthly = totalMonthly(subscriptions);
  const today = startOfToday();
  const dueThisWeek = active.filter((s) => daysBetween(today, nextBilling(s.startDate, s.cycle).date) <= 7);

  const categories = useMemo(
    () => [...new Set(subscriptions.map((s) => s.category))].sort(),
    [subscriptions],
  );

  const visible = useMemo(() => {
    const list = subscriptions.filter((s) => !category || s.category === category);
    const compare: Record<SortKey, (a: Subscription, b: Subscription) => number> = {
      due: (a, b) => nextDueTime(a) - nextDueTime(b),
      price: (a, b) => monthlyCost(b) - monthlyCost(a),
      name: (a, b) => a.name.localeCompare(b.name),
    };
    // Paused subscriptions always sink to the bottom.
    return list.sort((a, b) => Number(b.active) - Number(a.active) || compare[sort](a, b));
  }, [subscriptions, category, sort]);

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Couldn’t load your subscriptions</Text>
        <Text style={styles.emptyText}>Your data is safe and hasn’t been changed.</Text>
        <Pressable onPress={retryLoad} style={[styles.fab, styles.retry]}>
          <Text style={styles.fabText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderButton label="Insights" onPress={() => router.push('/insights')} />,
          headerRight: () => <HeaderButton label="Settings" onPress={() => router.push('/settings')} />,
        }}
      />

      <FlatList
        data={visible}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 96 }]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <SubscriptionCard
            subscription={item}
            currency={settings.currency}
            onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Monthly spend</Text>
              <Text style={styles.summaryValue}>{formatMoney(monthly, settings.currency, true)}</Text>
              <Text style={styles.summaryMeta}>
                {formatMoney(monthly * 12, settings.currency, true)} a year · {active.length} active
              </Text>
              {dueThisWeek.length > 0 && (
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillText}>
                    {dueThisWeek.length} renewal{dueThisWeek.length > 1 ? 's' : ''} in the next 7 days
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => router.push('/import')}
              style={({ pressed }) => [styles.findRow, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.findText}>
                <Text style={styles.findTitle}>Find your subscriptions</Text>
                <Text style={styles.findHint}>From your app store, bank SMS or receipt emails</Text>
              </View>
              <Text style={styles.findChevron}>›</Text>
            </Pressable>

            {subscriptions.length > 0 && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
                  {categories.map((c) => (
                    <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
                  ))}
                </ScrollView>
                <View style={styles.sortRow}>
                  <Text style={styles.sortLabel}>Sort</Text>
                  {SORTS.map((s) => (
                    <Pressable key={s.key} onPress={() => setSort(s.key)} hitSlop={6}>
                      <Text style={[styles.sortItem, sort === s.key && styles.sortItemActive]}>{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptyText}>
              Add Netflix, Spotify, your gym or anything that charges you regularly and see what it costs you.
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => router.push('/add')}
        accessibilityLabel="Add subscription"
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 20 }, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.fabText}>+  Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  retry: { position: 'relative', right: 0, marginTop: spacing.lg },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  header: { gap: spacing.md, marginBottom: spacing.md },
  summary: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.xl, gap: 4 },
  summaryLabel: { color: colors.white, opacity: 0.8, fontSize: 14, fontWeight: '500' },
  summaryValue: { color: colors.white, fontSize: 40, fontWeight: '800' },
  summaryMeta: { color: colors.white, opacity: 0.85, fontSize: 14 },
  summaryPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryPillText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  findRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  findText: { flex: 1, gap: 2 },
  findTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  findHint: { fontSize: 13, color: colors.textMuted },
  findChevron: { fontSize: 26, color: colors.textMuted, paddingHorizontal: spacing.sm },
  chips: { gap: spacing.sm },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  sortLabel: { fontSize: 13, color: colors.textMuted },
  sortItem: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  sortItemActive: { color: colors.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
