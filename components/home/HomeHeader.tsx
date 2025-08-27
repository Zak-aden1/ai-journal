import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';

interface HomeHeaderProps {
  userName: string;
  contextualGreeting: string;
}

export function HomeHeader({ userName, contextualGreeting }: HomeHeaderProps) {
  const { theme } = useTheme();
  const { showTipToast } = useToast();
  const styles = createStyles(theme);

  return (
    <View style={styles.header}>
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingTitle}>Hey {userName}</Text>
        <Text style={styles.greetingSubtitle}>
          {contextualGreeting}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => showTipToast()}
          activeOpacity={0.7}
        >
          <Text style={styles.quickActionIcon}>💡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl || theme.spacing.xl * 1.5,
    marginBottom: theme.spacing.lg,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginTop: theme.spacing.xs,
    maxWidth: '90%',
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 20,
  },
});