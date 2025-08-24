import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';

interface HabitEditModalProps {
  visible: boolean;
  onClose: () => void;
  habitId: string | null;
}

interface ScheduleOption {
  id: string;
  label: string;
  description: string;
}

const SCHEDULE_OPTIONS: ScheduleOption[] = [
  { id: 'daily', label: 'Daily', description: 'Every day' },
  { id: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
  { id: 'weekends', label: 'Weekends', description: 'Saturday and Sunday' },
  { id: 'custom', label: 'Custom', description: 'Choose specific days' },
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export function HabitEditModal({ visible, onClose, habitId }: HabitEditModalProps) {
  const { theme } = useTheme();
  const { 
    goalsWithIds, 
    standaloneHabits, 
    habitsWithIds, 
    updateHabitGoalAssignment,
    refreshStandaloneHabits,
    refreshHabitsForGoal 
  } = useAppStore();
  
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState('daily');
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const styles = createStyles(theme);

  // Find the current habit data
  const currentHabit = React.useMemo(() => {
    if (!habitId) return null;
    
    // Check standalone habits
    const standaloneHabit = standaloneHabits.find(h => h.id === habitId);
    if (standaloneHabit) {
      return { ...standaloneHabit, goalId: null };
    }
    
    // Check goal habits
    for (const goalId of Object.keys(habitsWithIds)) {
      const habit = habitsWithIds[goalId]?.find(h => h.id === habitId);
      if (habit) {
        return { ...habit, goalId };
      }
    }
    
    return null;
  }, [habitId, standaloneHabits, habitsWithIds]);

  // Reset form when habit changes
  useEffect(() => {
    if (currentHabit) {
      setHabitTitle(currentHabit.title);
      setHabitDescription(''); // TODO: Add description to habit data model
      setSelectedGoalId(currentHabit.goalId);
      setIsStandalone(currentHabit.goalId === null);
      // TODO: Load scheduling data from habit when we add it to the model
      setSelectedSchedule('daily');
      setSelectedTime('08:00');
      setReminderEnabled(true);
    }
  }, [currentHabit]);

  const resetForm = () => {
    setHabitTitle('');
    setHabitDescription('');
    setSelectedGoalId(null);
    setIsStandalone(false);
    setSelectedSchedule('daily');
    setSelectedTime('08:00');
    setReminderEnabled(true);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!habitId || !currentHabit) return;
    
    if (!habitTitle.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    setIsSaving(true);
    try {
      // Handle goal reassignment if changed
      const newGoalId = isStandalone ? null : selectedGoalId;
      if (newGoalId !== currentHabit.goalId) {
        await updateHabitGoalAssignment(habitId, newGoalId);
        
        // Refresh both old and new goal habits
        if (currentHabit.goalId) {
          await refreshHabitsForGoal(currentHabit.goalId);
        }
        if (newGoalId) {
          await refreshHabitsForGoal(newGoalId);
        }
        await refreshStandaloneHabits();
      }
      
      // TODO: Update habit title and other properties when we add them to the data model
      // For now, we only handle goal reassignment
      
      Alert.alert('Success', 'Habit updated successfully!');
      handleClose();
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalSelection = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsStandalone(false);
  };

  const handleStandaloneToggle = () => {
    setIsStandalone(true);
    setSelectedGoalId(null);
  };

  if (!currentHabit) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose}
              disabled={isSaving}
              style={styles.headerButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>Edit Habit</Text>
            
            <TouchableOpacity 
              onPress={handleSave}
              disabled={!habitTitle.trim() || isSaving}
              style={[
                styles.headerButton,
                styles.saveButton,
                (!habitTitle.trim() || isSaving) && styles.saveButtonDisabled
              ]}
            >
              <Text style={[
                styles.saveText,
                (!habitTitle.trim() || isSaving) && styles.saveTextDisabled
              ]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Habit Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Habit Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Read for 30 minutes"
                value={habitTitle}
                onChangeText={setHabitTitle}
                autoFocus
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details about your habit..."
                value={habitDescription}
                onChangeText={setHabitDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>

            {/* Goal Assignment */}
            <View style={styles.section}>
              <Text style={styles.label}>Goal Assignment</Text>
              <Text style={styles.helperText}>
                Change which goal this habit supports
              </Text>

              {/* Standalone Option */}
              <TouchableOpacity 
                style={[
                  styles.goalOption,
                  isStandalone && styles.goalOptionSelected
                ]}
                onPress={handleStandaloneToggle}
              >
                <View style={styles.goalOptionContent}>
                  <View style={styles.goalIcon}>
                    <Text style={styles.goalEmoji}>⭐</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>Standalone Habit</Text>
                    <Text style={styles.goalSubtitle}>General wellness habit</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioButton,
                  isStandalone && styles.radioButtonSelected
                ]}>
                  {isStandalone && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>

              {/* Goal Options */}
              {goalsWithIds.map((goal) => (
                <TouchableOpacity 
                  key={goal.id}
                  style={[
                    styles.goalOption,
                    selectedGoalId === goal.id && !isStandalone && styles.goalOptionSelected
                  ]}
                  onPress={() => handleGoalSelection(goal.id)}
                >
                  <View style={styles.goalOptionContent}>
                    <View style={styles.goalIcon}>
                      <Text style={styles.goalEmoji}>🎯</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalSubtitle}>Active goal</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedGoalId === goal.id && !isStandalone && styles.radioButtonSelected
                  ]}>
                    {selectedGoalId === goal.id && !isStandalone && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Scheduling Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Schedule</Text>
              <Text style={styles.helperText}>When do you want to do this habit?</Text>
              
              {/* Schedule Frequency */}
              <Text style={styles.subLabel}>Frequency</Text>
              {SCHEDULE_OPTIONS.map((option) => (
                <TouchableOpacity 
                  key={option.id}
                  style={[
                    styles.scheduleOption,
                    selectedSchedule === option.id && styles.scheduleOptionSelected
                  ]}
                  onPress={() => setSelectedSchedule(option.id)}
                >
                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleLabel}>{option.label}</Text>
                    <Text style={styles.scheduleDescription}>{option.description}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedSchedule === option.id && styles.radioButtonSelected
                  ]}>
                    {selectedSchedule === option.id && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Time Selection */}
              <Text style={styles.subLabel}>Preferred Time</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.timeSelector}
              >
                {TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      selectedTime === time && styles.timeOptionSelected
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[
                      styles.timeText,
                      selectedTime === time && styles.timeTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Reminder Toggle */}
              <View style={styles.reminderSection}>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderLabel}>Reminder Notifications</Text>
                  <Text style={styles.reminderDescription}>
                    Get notified at your preferred time
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    reminderEnabled && styles.toggleActive
                  ]}
                  onPress={() => setReminderEnabled(!reminderEnabled)}
                >
                  <View style={[
                    styles.toggleThumb,
                    reminderEnabled && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Coming Soon Preview */}
            <View style={styles.section}>
              <Text style={styles.previewLabel}>Coming Soon</Text>
              <View style={styles.previewFeatures}>
                <Text style={styles.previewFeature}>🔄 Habit Templates</Text>
                <Text style={styles.previewFeature}>📊 Performance Analytics</Text>
                <Text style={styles.previewFeature}>🎯 Difficulty Adjustment</Text>
                <Text style={styles.previewFeature}>🔗 Habit Dependencies</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  headerButton: {
    paddingVertical: theme.spacing.sm,
    minWidth: 60,
  },
  cancelText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: theme.colors.interactive.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: theme.colors.text.muted,
  },
  form: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  goalOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalOptionSelected: {
    borderColor: theme.colors.interactive.primary,
    backgroundColor: theme.colors.interactive.primary + '10',
  },
  goalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  goalEmoji: {
    fontSize: 18,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.interactive.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.interactive.primary,
  },
  scheduleOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleOptionSelected: {
    borderColor: theme.colors.interactive.primary,
    backgroundColor: theme.colors.interactive.primary + '10',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  scheduleDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  timeSelector: {
    marginBottom: theme.spacing.md,
  },
  timeOption: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  timeOptionSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  timeTextSelected: {
    color: theme.colors.text.inverse,
  },
  reminderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  reminderDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: theme.colors.interactive.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  previewFeatures: {
    backgroundColor: theme.colors.background.secondary + '50',
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  previewFeature: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.xs,
  },
});