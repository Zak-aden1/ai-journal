import { StyleSheet } from 'react-native';

export const createModalStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  inputValid: {
    borderColor: theme.colors.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  placeholderTextColor: theme.colors.text.muted,
  
  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Habits
  habitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  habitChip: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  habitChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  habitChipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  habitChipTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  
  // Custom habit input
  customHabitContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  customHabitInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Selected habits
  selectedHabitsContainer: {
    gap: 8,
  },
  selectedHabit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    padding: 12,
  },
  selectedHabitText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  removeHabitButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeHabitButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  
  // Modal navigation
  modalNavigation: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.tertiary,
    marginTop: 'auto',
  },
  nextButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonTextDisabled: {
    color: theme.colors.text.muted,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  backButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});