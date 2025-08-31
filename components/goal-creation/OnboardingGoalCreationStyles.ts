import { StyleSheet } from 'react-native';

export const createOnboardingStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  form: {
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputValid: {
    borderColor: '#22C55E',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  placeholderTextColor: 'rgba(255,255,255,0.5)',
  
  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  categoryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  
  // Habits
  habitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  habitChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  habitChipSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  habitChipText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  habitChipTextSelected: {
    color: '#0F172A',
    fontWeight: '500',
  },
  
  // Custom habit input
  customHabitContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  customHabitInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#0F172A',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
  },
  selectedHabitText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  removeHabitButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeHabitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  
  // Modal navigation (not used in onboarding)
  modalNavigation: {
    display: 'none',
  },
  nextButton: {
    display: 'none',
  },
  nextButtonText: {
    display: 'none',
  },
  nextButtonDisabled: {
    display: 'none',
  },
  nextButtonTextDisabled: {
    display: 'none',
  },
  backButton: {
    display: 'none',
  },
  backButtonText: {
    display: 'none',
  },
  
  // Enhanced habit selection styles
  selectedHabitCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  selectedHabitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schedulePreviewText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  setScheduleButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  setScheduleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
});