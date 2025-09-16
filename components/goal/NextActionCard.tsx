import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  title: string;
  subtitle?: string;
  estimatedMinutes?: number;
  accentColor?: string;
  onComplete: () => void;
  onSnooze?: () => void;
  onReschedule?: () => void;
};

export function NextActionCard({ title, subtitle, estimatedMinutes, accentColor, onComplete, onSnooze, onReschedule }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme, accentColor);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.badge}>Next Up</Text>
        {estimatedMinutes ? (
          <Text style={styles.mins}>{estimatedMinutes} min</Text>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onComplete} accessibilityRole="button">
          <Text style={styles.primaryText}>Do now</Text>
        </TouchableOpacity>
        {onSnooze && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onSnooze} accessibilityRole="button">
            <Text style={styles.secondaryText}>Snooze</Text>
          </TouchableOpacity>
        )}
        {onReschedule && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onReschedule} accessibilityRole="button">
            <Text style={styles.secondaryText}>Reschedule</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any, accent?: string) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: (accent || theme.colors.primary),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  mins: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primaryBtn: {
    backgroundColor: accent || theme.colors.interactive.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 20,
  },
  primaryText: {
    color: theme.colors.text.inverse,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: theme.colors.background.tertiary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 18,
  },
  secondaryText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});

