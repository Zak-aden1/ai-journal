import React from 'react';
import { Pressable, Text, ViewStyle, StyleSheet } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.base, selected ? styles.selected : styles.unselected, style]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selected: { backgroundColor: '#22C55E' },
  unselected: { backgroundColor: '#E5E7EB' },
  text: { fontSize: 14 },
  textSelected: { color: '#0F172A', fontWeight: '600' },
  textUnselected: { color: '#0F172A' },
});


