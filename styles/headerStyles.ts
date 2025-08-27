import { StyleSheet } from 'react-native';

export const createHeaderStyles = (theme: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  avatarInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  avatarVitalityText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  avatarMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: theme.colors.line,
  },
  quickActionIcon: {
    fontSize: 16,
  },
});