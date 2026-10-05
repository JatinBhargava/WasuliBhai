import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { CURRENCIES } from '@/constants/options';
import { colors, radius, spacing } from '@/constants/theme';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { ensurePermission, remindersSupported } from '@/lib/reminders';

export default function SettingsScreen() {
  const { settings, updateSettings, subscriptions, clearAll } = useSubscriptions();

  const toggleReminders = async (enabled: boolean) => {
    if (enabled && !(await ensurePermission())) {
      Alert.alert('Notifications blocked', 'Allow notifications for WasuliBhai in your phone settings to get renewal reminders.');
      return;
    }
    updateSettings({ remindersEnabled: enabled });
  };

  const exportData = () =>
    Share.share({ message: JSON.stringify({ settings, subscriptions }, null, 2) }).catch(console.warn);

  const confirmClear = () =>
    Alert.alert('Delete all subscriptions?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: clearAll },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Currency</Text>
        <Text style={styles.hint}>Used to display all amounts.</Text>
        <View style={styles.wrap}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={settings.currency === c} onPress={() => updateSettings({ currency: c })} />
          ))}
        </View>
      </View>

      <View style={[styles.card, styles.switchRow]}>
        <View style={styles.flex}>
          <Text style={styles.title}>Renewal reminders</Text>
          <Text style={styles.hint}>
            {remindersSupported
              ? 'Notifies you at 9:00 AM before each renewal, using the reminder set on each subscription.'
              : 'Not available in Expo Go on Android. Use a development build (npx expo run:android) to get reminders.'}
          </Text>
        </View>
        <Switch
          disabled={!remindersSupported}
          value={remindersSupported && settings.remindersEnabled}
          onValueChange={toggleReminders}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Your data</Text>
        <Text style={styles.hint}>
          {subscriptions.length} subscription{subscriptions.length === 1 ? '' : 's'} stored only on this device.
        </Text>
        <Pressable style={[styles.button, styles.secondary]} onPress={exportData}>
          <Text style={styles.secondaryText}>Export as JSON</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.danger]} onPress={confirmClear}>
          <Text style={styles.dangerText}>Delete all subscriptions</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  flex: { flex: 1, gap: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  button: { borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xs },
  secondary: { backgroundColor: colors.primarySoft },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  danger: { backgroundColor: colors.dangerSoft },
  dangerText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
