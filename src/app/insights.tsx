import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { colors, radius, spacing } from '@/constants/theme';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { daysBetween, nextBilling, nthBillingDate, parseISODate, relativeDays, startOfToday } from '@/lib/dates';
import { formatMoney, monthlyCost, totalMonthly } from '@/lib/money';
import type { Subscription } from '@/types/subscription';

const WINDOW_DAYS = 30;

export default function InsightsScreen() {
  const { subscriptions, settings } = useSubscriptions();
  const currency = settings.currency;
  const active = subscriptions.filter((s) => s.active);
  const monthly = totalMonthly(subscriptions);
  const today = startOfToday();

  // Every charge in the next 30 days (a weekly plan can bill several times).
  const upcoming: { sub: Subscription; days: number }[] = [];
  for (const sub of active) {
    const start = parseISODate(sub.startDate);
    for (let n = nextBilling(sub.startDate, sub.cycle).index; ; n++) {
      const days = daysBetween(today, nthBillingDate(start, sub.cycle, n));
      if (days > WINDOW_DAYS) break;
      upcoming.push({ sub, days });
    }
  }
  upcoming.sort((a, b) => a.days - b.days);
  const upcomingTotal = upcoming.reduce((sum, u) => sum + u.sub.amount, 0);

  const byCategory = Object.entries(
    active.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + monthlyCost(s);
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxCategory = byCategory[0]?.[1] ?? 0;

  const priciest = [...active].sort((a, b) => monthlyCost(b) - monthlyCost(a)).slice(0, 5);

  if (active.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Add an active subscription to see insights.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.tiles}>
        <Tile label="Per month" value={formatMoney(monthly, currency, true)} />
        <Tile label="Per year" value={formatMoney(monthly * 12, currency, true)} />
        <Tile label="Per day" value={formatMoney(monthly / 30.44, currency)} />
      </View>

      <Card title={`Due in the next ${WINDOW_DAYS} days`} trailing={formatMoney(upcomingTotal, currency)}>
        {upcoming.length === 0 ? (
          <Text style={styles.muted}>Nothing due.</Text>
        ) : (
          upcoming.map(({ sub, days }, i) => (
            <Pressable
              key={`${sub.id}-${i}`}
              style={styles.row}
              onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: sub.id } })}
            >
              <Avatar name={sub.name} color={sub.color} size={32} />
              <Text style={styles.rowName} numberOfLines={1}>
                {sub.name}
              </Text>
              <Text style={styles.rowMeta}>{relativeDays(days)}</Text>
              <Text style={styles.rowValue}>{formatMoney(sub.amount, currency)}</Text>
            </Pressable>
          ))
        )}
      </Card>

      <Card title="Monthly spend by category">
        {byCategory.map(([category, value]) => (
          <View key={category} style={styles.barRow} accessibilityLabel={`${category}: ${formatMoney(value, currency)} per month`}>
            <View style={styles.barLabels}>
              <Text style={styles.barName}>{category}</Text>
              <Text style={styles.barValue}>
                {formatMoney(value, currency)} · {Math.round((value / monthly) * 100)}%
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(value / maxCategory) * 100}%` }]} />
            </View>
          </View>
        ))}
      </Card>

      <Card title="Most expensive (monthly)">
        {priciest.map((sub, i) => (
          <View key={sub.id} style={styles.row}>
            <Text style={styles.rank}>{i + 1}</Text>
            <Avatar name={sub.name} color={sub.color} size={32} />
            <Text style={styles.rowName} numberOfLines={1}>
              {sub.name}
            </Text>
            <Text style={styles.rowValue}>{formatMoney(monthlyCost(sub), currency)}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function Card({ title, trailing, children }: { title: string; trailing?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {trailing && <Text style={styles.cardTrailing}>{trailing}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  muted: { color: colors.textMuted, fontSize: 14 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tileLabel: { fontSize: 12, color: colors.textMuted },
  tileValue: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardTrailing: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { width: 16, fontSize: 14, fontWeight: '700', color: colors.textMuted },
  rowName: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  rowMeta: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 15, fontWeight: '600', color: colors.text, minWidth: 64, textAlign: 'right' },
  barRow: { gap: 6 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barName: { fontSize: 14, color: colors.text, fontWeight: '500' },
  barValue: { fontSize: 13, color: colors.textMuted },
  barTrack: { height: 10, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
});
