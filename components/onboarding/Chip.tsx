import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected
      ]}>
      <Text style={[
        styles.text,
        selected ? styles.textSelected : styles.textUnselected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  chipUnselected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  textSelected: {
    color: '#0F172A',
  },
  textUnselected: {
    color: '#FFFFFF',
  },
});
