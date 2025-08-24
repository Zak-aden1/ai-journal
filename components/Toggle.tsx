import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

type Props = {
  label: string;
  sublabel?: string;
  on: boolean;
  onToggle: () => void;
};

export function Toggle({ label, sublabel, on, onToggle }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
      <Switch value={on} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
  },
  label: { fontSize: 16, color: '#0F172A', fontWeight: '600' },
  sublabel: { fontSize: 12, color: '#334155', marginTop: 4 },
});


