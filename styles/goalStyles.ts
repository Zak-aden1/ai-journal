import { StyleSheet } from 'react-native';

export const createGoalStyles = (theme: any) => StyleSheet.create({
  // Daily Focus Section
  dailyFocusContainer: {
    marginBottom: theme.spacing.lg,
  },
  dailyFocusCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 24,
    padding: theme.spacing.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  dailyFocusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dailyFocusGoal: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  dailyFocusCount: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // Progress visualization styles
  progressContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressRingFill: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: 'transparent',
  },
  progressText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  
  // Secondary Goals
  secondaryGoalsContainer: {
    marginBottom: theme.spacing.lg,
  },
  secondaryGoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  secondaryGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  secondaryGoalCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: 4,
    minWidth: 140,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  secondaryGoalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  secondaryGoalStats: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  expandIcon: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});