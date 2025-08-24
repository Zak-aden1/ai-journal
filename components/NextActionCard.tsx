import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface Suggestion {
  action: string;
  goal: string;
  reason: string;
}

interface Props {
  s: Suggestion | null;
  onDo: () => void;
  onSwap: () => void;
  onLater: () => void;
}

export function NextActionCard({ s, onDo, onSwap, onLater }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Use dummy data if no suggestion
  const suggestion = s || {
    action: "Take 5 deep breaths",
    goal: "your energy",
    reason: "A quick reset to center yourself and boost focus"
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Next Action</Text>
        </View>
        <Text style={styles.goal}>{suggestion.goal}</Text>
      </View>
      
      <Text style={styles.action}>{suggestion.action}</Text>
      <Text style={styles.reason}>{suggestion.reason}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={onDo}>
          <Text style={styles.primaryButtonText}>Do it now</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onSwap}>
            <Text style={styles.secondaryButtonText}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onLater}>
            <Text style={styles.secondaryButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
  },
  badgeText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goal: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  action: {
    ...theme.type.section,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  reason: {
    ...theme.type.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  actions: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});