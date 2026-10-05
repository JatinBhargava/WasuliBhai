import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: { fontSize: 14, color: colors.text, fontWeight: '500' },
  selectedLabel: { color: colors.white },
});
