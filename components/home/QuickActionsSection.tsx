import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

interface QuickActionsSectionProps {
  actions: QuickAction[];
  title?: string;
}

export function QuickActionsSection({ 
  actions, 
  title = "Quick Actions" 
}: QuickActionsSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionCard,
              action.color && { borderLeftColor: action.color }
            ]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.actionContent}>
              <View style={[
                styles.actionIcon,
                action.color && { backgroundColor: action.color + '20' }
              ]}>
                <Text style={styles.actionEmoji}>{action.icon}</Text>
              </View>
              
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                {action.subtitle && (
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.actionArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  actionsGrid: {
    gap: theme.spacing.sm,
  },
  actionCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  actionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  actionArrow: {
    padding: theme.spacing.sm,
  },
  arrowText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});