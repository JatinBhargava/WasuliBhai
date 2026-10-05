import { router, useLocalSearchParams } from 'expo-router';

import { SubscriptionForm } from '@/components/SubscriptionForm';
import { CATEGORIES, CYCLES } from '@/constants/options';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import type { SubscriptionInput } from '@/types/subscription';

type Params = Partial<Record<'name' | 'amount' | 'cycle' | 'startDate' | 'category' | 'color', string>>;

/** Turns route params (e.g. from the import screen) into form values, ignoring anything invalid. */
function initialFromParams(p: Params): Partial<SubscriptionInput> {
  const initial: Partial<SubscriptionInput> = {};
  if (p.name) initial.name = p.name;
  if (p.amount && Number(p.amount) > 0) initial.amount = Number(p.amount);
  const cycle = CYCLES.find((c) => c.value === p.cycle);
  if (cycle) initial.cycle = cycle.value;
  if (p.startDate && /^\d{4}-\d{2}-\d{2}$/.test(p.startDate)) initial.startDate = p.startDate;
  const category = CATEGORIES.find((c) => c === p.category);
  if (category) initial.category = category;
  if (p.color && /^#[0-9a-f]{6}$/i.test(p.color)) initial.color = p.color;
  return initial;
}

export default function AddScreen() {
  const { addSubscription, settings } = useSubscriptions();
  const params = useLocalSearchParams<Params>();
  const initial = initialFromParams(params);

  return (
    <SubscriptionForm
      initial={initial}
      currency={settings.currency}
      submitLabel="Add subscription"
      showPresets={!initial.name}
      onSubmit={(input) => {
        addSubscription(input);
        router.back();
      }}
    />
  );
}
