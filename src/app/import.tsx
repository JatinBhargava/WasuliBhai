import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { CYCLES } from '@/constants/options';
import { colors, radius, spacing } from '@/constants/theme';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { formatDate, parseISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { parseMessages, type DetectedCharge } from '@/lib/parseMessage';

const STORES = [
  { os: 'ios', label: 'App Store subscriptions', url: 'https://apps.apple.com/account/subscriptions' },
  { os: 'android', label: 'Google Play subscriptions', url: 'https://play.google.com/store/account/subscriptions' },
];

const EXAMPLE = 'e.g. Rs.649.00 debited from A/c XX1234 on 05-10-26 towards NETFLIX for UPI AutoPay mandate.';

export default function ImportScreen() {
  const { subscriptions, settings } = useSubscriptions();
  const [text, setText] = useState('');
  const [results, setResults] = useState<DetectedCharge[] | null>(null);

  const stores = STORES.filter((s) => Platform.OS === 'web' || s.os === Platform.OS);
  const tracked = new Set(subscriptions.map((s) => s.name.trim().toLowerCase()));

  const openStore = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert('Could not open the store', url));

  const pasteFromClipboard = async () => {
    const clip = await Clipboard.getStringAsync();
    if (!clip.trim()) {
      Alert.alert('Clipboard is empty', 'Copy an SMS or email first, then tap Paste.');
      return;
    }
    setText(clip);
    setResults(parseMessages(clip));
  };

  const review = (c: DetectedCharge) =>
    router.push({
      pathname: '/add',
      params: {
        name: c.name ?? '',
        amount: c.amount ? String(c.amount) : '',
        cycle: c.cycle,
        startDate: c.date,
        category: c.category,
        color: c.color,
      },
    });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>1. Check your app store</Text>
          <Text style={styles.hint}>
            Everything billed through the store is listed there. Open it, then add each one here.
          </Text>
          {stores.map((s) => (
            <Pressable key={s.os} style={[styles.button, styles.secondary]} onPress={() => openStore(s.url)}>
              <Text style={styles.secondaryText}>Open {s.label}</Text>
            </Pressable>
          ))}
          <Text style={styles.tip}>
            Tip: for UPI AutoPay, open Google Pay, PhonePe or Paytm and look for “AutoPay” or “Mandates” to see
            every active one.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>2. Paste an SMS or email</Text>
          <Text style={styles.hint}>
            Copy a bank SMS (AutoPay, mandate, card debit) or a receipt email. Paste several SMS separated by a
            blank line to add them in one go.
          </Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={(t) => {
              setText(t);
              setResults(null);
            }}
            placeholder={EXAMPLE}
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <View style={styles.row}>
            <Pressable style={[styles.button, styles.secondary, styles.flex]} onPress={pasteFromClipboard}>
              <Text style={styles.secondaryText}>Paste from clipboard</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.primary, styles.flex, !text.trim() && styles.disabled]}
              disabled={!text.trim()}
              onPress={() => setResults(parseMessages(text))}
            >
              <Text style={styles.primaryText}>Find subscriptions</Text>
            </Pressable>
          </View>
        </View>

        {results?.length === 0 && (
          <Text style={styles.empty}>No amount found in that text. Make sure it includes the charged amount.</Text>
        )}

        {results?.map((c, i) => {
          const cycle = CYCLES.find((x) => x.value === c.cycle);
          const notes = [
            c.name && tracked.has(c.name.toLowerCase()) && 'Already tracked',
            !c.name && 'Merchant not recognised',
            !c.cycleDetected && 'Billing cycle guessed',
            !c.dateDetected && 'No date found, using today',
            !c.looksRecurring && 'May be a one-off payment',
            c.currency && c.currency !== settings.currency && `Charged in ${c.currency}, app shows ${settings.currency}`,
          ].filter(Boolean) as string[];

          return (
            <View key={i} style={styles.result}>
              <View style={styles.resultHeader}>
                <Avatar name={c.name ?? '?'} color={c.color} />
                <View style={styles.flex}>
                  <Text style={styles.resultName}>{c.name ?? 'Unknown merchant'}</Text>
                  <Text style={styles.hint}>
                    {c.amount !== null ? formatMoney(c.amount, c.currency ?? settings.currency) : '—'} ·{' '}
                    {cycle?.label} · {formatDate(parseISODate(c.date))}
                  </Text>
                </View>
              </View>
              {notes.length > 0 && (
                <View style={styles.notes}>
                  {notes.map((n) => (
                    <Text key={n} style={styles.note}>
                      • {n}
                    </Text>
                  ))}
                </View>
              )}
              <Pressable style={[styles.button, styles.primary]} onPress={() => review(c)}>
                <Text style={styles.primaryText}>Review & add</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  tip: { fontSize: 13, color: colors.text, lineHeight: 18, marginTop: spacing.xs },
  input: {
    minHeight: 120,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  button: { borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: spacing.md, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  secondary: { backgroundColor: colors.primarySoft },
  secondaryText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  result: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultName: { fontSize: 16, fontWeight: '700', color: colors.text },
  notes: { backgroundColor: colors.warningSoft, borderRadius: radius.sm, padding: spacing.sm, gap: 2 },
  note: { fontSize: 13, color: colors.warning },
});
