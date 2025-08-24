import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WeeklyReviewModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Review</Text>
      <Text style={styles.body}>This is a stub. Reflect on your week and celebrate wins!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  body: { marginTop: 8, fontSize: 14, color: '#334155' },
});


