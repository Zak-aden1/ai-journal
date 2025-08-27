import { StyleSheet } from 'react-native';

export const createBaseStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  dataSubtitle: {
    fontSize: 13,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  manageLink: {
    fontSize: 14,
    color: theme.colors.interactive.primary,
    fontWeight: '500',
  },
});