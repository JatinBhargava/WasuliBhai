import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Chip } from '@/components/Chip';
import { CATEGORIES, CYCLES, PRESETS, REMINDERS, SWATCHES } from '@/constants/options';
import { colors, radius, spacing } from '@/constants/theme';
import { formatDate, parseISODate, startOfToday, toISODate } from '@/lib/dates';
import { parseAmount } from '@/lib/money';
import type { SubscriptionInput } from '@/types/subscription';

interface Props {
  /** Pre-filled values; anything missing falls back to the defaults. */
  initial?: Partial<SubscriptionInput>;
  currency: string;
  submitLabel: string;
  showPresets?: boolean;
  onSubmit: (input: SubscriptionInput) => void;
  /** Extra content rendered below the save button (e.g. pause/delete on the edit screen). */
  footer?: ReactNode;
}

const EMPTY: SubscriptionInput = {
  name: '',
  amount: 0,
  cycle: 'monthly',
  startDate: toISODate(startOfToday()),
  category: 'Entertainment',
  color: SWATCHES[2],
  notes: '',
  remindDaysBefore: 1,
  active: true,
};

export function SubscriptionForm({ initial, currency, submitLabel, showPresets, onSubmit, footer }: Props) {
  const [form, setForm] = useState<SubscriptionInput>({ ...EMPTY, ...initial });
  const [amountText, setAmountText] = useState(initial?.amount ? String(initial.amount) : '');
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

  const set = <K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const amount = parseAmount(amountText);
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Enter a name';
    if (Number.isNaN(amount) || amount <= 0) next.amount = 'Enter a valid amount, e.g. 199 or 9.99';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ ...form, name: form.name.trim(), notes: form.notes.trim(), amount });
  };

  const startDate = parseISODate(form.startDate);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {showPresets && (
          <Section label="Quick add">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {PRESETS.map((p) => (
                <Chip
                  key={p.name}
                  label={p.name}
                  selected={form.name === p.name}
                  onPress={() => setForm((prev) => ({ ...prev, ...p }))}
                />
              ))}
            </ScrollView>
          </Section>
        )}

        <Section label="Name" error={errors.name}>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t) => set('name', t)}
            placeholder="e.g. Netflix"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
          />
        </Section>

        <Section label={`Amount (${currency})`} error={errors.amount}>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </Section>

        <Section label="Billing cycle">
          <View style={styles.segment}>
            {CYCLES.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => set('cycle', c.value)}
                style={[styles.segmentItem, form.cycle === c.value && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, form.cycle === c.value && styles.segmentTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section label="First billing date">
          {Platform.OS === 'ios' ? (
            <View style={styles.iosDate}>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="compact"
                accentColor={colors.primary}
                onValueChange={(_, date) => set('startDate', toISODate(date))}
              />
            </View>
          ) : Platform.OS === 'android' ? (
            <>
              <Pressable style={styles.input} onPress={() => setShowAndroidPicker(true)}>
                <Text style={styles.inputText}>{formatDate(startDate)}</Text>
              </Pressable>
              {showAndroidPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  onValueChange={(_, date) => {
                    setShowAndroidPicker(false);
                    set('startDate', toISODate(date));
                  }}
                  onDismiss={() => setShowAndroidPicker(false)}
                />
              )}
            </>
          ) : (
            <TextInput
              style={styles.input}
              defaultValue={form.startDate}
              placeholder="YYYY-MM-DD"
              onChangeText={(t) => /^\d{4}-\d{2}-\d{2}$/.test(t) && set('startDate', t)}
            />
          )}
          <Text style={styles.hint}>Future renewals are calculated from this date.</Text>
        </Section>

        <Section label="Category">
          <View style={styles.wrap}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} selected={form.category === c} onPress={() => set('category', c)} />
            ))}
          </View>
        </Section>

        <Section label="Colour">
          <View style={styles.wrap}>
            {SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => set('color', c)}
                accessibilityLabel={`Colour ${c}`}
                style={[styles.swatch, { backgroundColor: c }, form.color === c && styles.swatchActive]}
              />
            ))}
          </View>
        </Section>

        <Section label="Reminder">
          <View style={styles.wrap}>
            {REMINDERS.map((r) => (
              <Chip
                key={String(r.value)}
                label={r.label}
                selected={form.remindDaysBefore === r.value}
                onPress={() => set('remindDaysBefore', r.value)}
              />
            ))}
          </View>
        </Section>

        <Section label="Notes">
          <TextInput
            style={[styles.input, styles.notes]}
            value={form.notes}
            onChangeText={(t) => set('notes', t)}
            placeholder="Plan, account email, payment card…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </Section>

        <Pressable style={({ pressed }) => [styles.submit, pressed && { opacity: 0.85 }]} onPress={submit}>
          <Text style={styles.submitText}>{submitLabel}</Text>
        </Pressable>

        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48, gap: spacing.lg },
  section: { gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputText: { fontSize: 16, color: colors.text },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: colors.textMuted },
  error: { fontSize: 13, color: colors.danger },
  iosDate: { alignItems: 'flex-start' },
  row: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 14, fontWeight: '500', color: colors.text },
  segmentTextActive: { color: colors.white },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.text },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
