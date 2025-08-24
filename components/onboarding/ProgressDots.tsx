import React from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

interface Props {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>Step {current} of {total}</Text>
      <View style={styles.dotsContainer}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < current ? styles.dotActive : styles.dotInactive,
              i === current - 1 ? styles.dotCurrent : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotCurrent: {
    transform: [{ scale: 1.2 }],
  },
});
