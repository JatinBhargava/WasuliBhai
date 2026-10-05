import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { SubscriptionForm } from '@/components/SubscriptionForm';
import { colors, radius, spacing } from '@/constants/theme';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { daysBetween, formatDate, nextBilling, relativeDays, startOfToday } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

export default function SubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSubscription, updateSubscription, deleteSubscription, toggleActive, settings } = useSubscriptions();
  const sub = getSubscription(id);

  if (!sub) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This subscription no longer exists.</Text>
      </View>
    );
  }

  const { id: _id, createdAt: _createdAt, ...input } = sub;
  const next = nextBilling(sub.startDate, sub.cycle);
  const days = daysBetween(startOfToday(), next.date);

  const confirmDelete = () =>
    Alert.alert('Delete subscription?', `${sub.name} will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSubscription(sub.id);
          router.back();
        },
      },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: sub.name }} />
      <SubscriptionForm
        key={sub.id}
        initial={input}
        currency={settings.currency}
        submitLabel="Save changes"
        onSubmit={(updated) => {
          updateSubscription(sub.id, { ...updated, active: sub.active });
          router.back();
        }}
        footer={
          <View style={styles.footer}>
            <View style={styles.stats}>
              <Stat
                label="Next renewal"
                value={sub.active ? formatDate(next.date) : 'Paused'}
                sub={sub.active ? relativeDays(days) : undefined}
              />
              <Stat
                label="Paid so far (est.)"
                value={formatMoney(sub.amount * next.index, settings.currency)}
                sub={`${next.index} payment${next.index === 1 ? '' : 's'}`}
              />
            </View>
            <Pressable style={[styles.action, styles.secondary]} onPress={() => toggleActive(sub.id)}>
              <Text style={styles.secondaryText}>{sub.active ? 'Pause tracking' : 'Resume tracking'}</Text>
            </Pressable>
            <Pressable style={[styles.action, styles.danger]} onPress={confirmDelete}>
              <Text style={styles.dangerText}>Delete subscription</Text>
            </Pressable>
          </View>
        }
      />
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  missingText: { color: colors.textMuted, fontSize: 15 },
  footer: { gap: spacing.md, marginTop: spacing.lg },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  statSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  action: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  secondary: { backgroundColor: colors.primarySoft },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  danger: { backgroundColor: colors.dangerSoft },
  dangerText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
