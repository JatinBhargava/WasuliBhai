import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

export function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 6 },
  label: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
