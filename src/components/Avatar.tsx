import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 3 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: colors.white, fontWeight: '700' },
});
