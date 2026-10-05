import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';
import { SubscriptionsProvider } from '@/context/SubscriptionsContext';

export default function RootLayout() {
  return (
    <SubscriptionsProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'WasuliBhai' }} />
        <Stack.Screen name="add" options={{ title: 'New subscription', presentation: 'modal' }} />
        <Stack.Screen name="subscription/[id]" options={{ title: 'Subscription' }} />
        <Stack.Screen name="import" options={{ title: 'Find subscriptions' }} />
        <Stack.Screen name="insights" options={{ title: 'Insights' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </SubscriptionsProvider>
  );
}
