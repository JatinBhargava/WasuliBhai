import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { CYCLES } from '@/constants/options';
import { colors, radius, spacing } from '@/constants/theme';
import { daysBetween, nextBilling, relativeDays, startOfToday } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { Subscription } from '@/types/subscription';

interface Props {
  subscription: Subscription;
  currency: string;
  onPress: () => void;
}

export function SubscriptionCard({ subscription: sub, currency, onPress }: Props) {
  const cycle = CYCLES.find((c) => c.value === sub.cycle);
  const days = daysBetween(startOfToday(), nextBilling(sub.startDate, sub.cycle).date);
  const dueSoon = sub.active && days <= 3;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, !sub.active && styles.paused, pressed && styles.pressed]}
    >
      <Avatar name={sub.name} color={sub.color} />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {sub.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {sub.category} · {cycle?.label}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>
          {formatMoney(sub.amount, currency)}
          <Text style={styles.per}>/{cycle?.short}</Text>
        </Text>
        {sub.active ? (
          <View style={[styles.badge, dueSoon && styles.badgeSoon]}>
            <Text style={[styles.badgeText, dueSoon && styles.badgeTextSoon]}>{relativeDays(days)}</Text>
          </View>
        ) : (
          <Text style={styles.meta}>Paused</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  paused: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  middle: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 16, fontWeight: '700', color: colors.text },
  per: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  badge: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  badgeSoon: { backgroundColor: colors.warningSoft },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  badgeTextSoon: { color: colors.warning },
});
