import React, { useState } from 'react';
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { HabitSchedule } from '@/lib/db';

interface HabitCreationModalProps {
  visible: boolean;
  onClose: () => void;
  initialGoalId?: string | null;
}


export function HabitCreationModal({ visible, onClose, initialGoalId }: HabitCreationModalProps) {
  const { theme } = useTheme();
  const { addHabit, goalsWithIds } = useAppStore();
  
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialGoalId ?? null);
  const [isStandalone, setIsStandalone] = useState(initialGoalId === null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Scheduling state
  const [isDaily, setIsDaily] = useState(true);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  const [timeType, setTimeType] = useState<'anytime' | 'morning' | 'afternoon' | 'evening' | 'specific'>('anytime');
  const [specificTime, setSpecificTime] = useState('09:00');
  
  // Time picker modal state
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [selectedTimeDate, setSelectedTimeDate] = useState(new Date());
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Day format conversion utilities
  const convertToShortDayFormat = (fullDays: string[]): string[] => {
    const dayMap: Record<string, string> = {
      'Monday': 'mon',
      'Tuesday': 'tue', 
      'Wednesday': 'wed',
      'Thursday': 'thu',
      'Friday': 'fri',
      'Saturday': 'sat',
      'Sunday': 'sun'
    };
    return fullDays.map(day => dayMap[day]).filter(Boolean);
  };

  // Time preset definitions
  const timePresets = [
    { key: 'morning', label: 'Morning', time: '08:00' },
    { key: 'lunch', label: 'Lunch', time: '12:00' },
    { key: 'afternoon', label: 'Afternoon', time: '15:00' },
    { key: 'evening', label: 'Evening', time: '18:00' },
  ];

  // Time picker handlers
  const showTimePicker = () => {
    setIsTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setIsTimePickerVisible(false);
  };

  const handleTimeConfirm = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setSpecificTime(`${hours}:${minutes}`);
    setTimeType('specific');
    hideTimePicker();
  };

  const handlePresetTime = (preset: typeof timePresets[0]) => {
    setSpecificTime(preset.time);
    setTimeType(preset.key as any);
  };

  // Day pattern helpers
  const setWeekdays = () => {
    setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    setIsDaily(false);
  };

  const setWeekends = () => {
    setSelectedDays(['Saturday', 'Sunday']);
    setIsDaily(false);
  };

  const setAllDays = () => {
    setIsDaily(true);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Schedule preview helper
  const getSchedulePreview = (): string => {
    const dayText = isDaily ? 'Every day' : 
      selectedDays.length === 0 ? 'No days selected' :
      selectedDays.length === 7 ? 'Every day' :
      selectedDays.length === 5 && selectedDays.every(d => !['Saturday', 'Sunday'].includes(d)) ? 'Weekdays' :
      selectedDays.length === 2 && selectedDays.every(d => ['Saturday', 'Sunday'].includes(d)) ? 'Weekends' :
      `Every ${selectedDays.map(d => d.slice(0, 3)).join(', ')}`;

    const timeText = timeType === 'anytime' ? '' :
      timeType === 'morning' ? ' in the morning' :
      timeType === 'afternoon' ? ' in the afternoon' :
      timeType === 'evening' ? ' in the evening' :
      timeType === 'specific' ? ` at ${specificTime}` : '';

    return `${dayText}${timeText}`;
  };

  // Use real goals data from store
  const availableGoals = goalsWithIds;

  const styles = createStyles(theme);

  const resetForm = () => {
    setHabitTitle('');
    setHabitDescription('');
    setSelectedGoalId(initialGoalId ?? null);
    setIsStandalone(initialGoalId === null);
    setIsSaving(false);
    setIsDaily(true);
    setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    setTimeType('anytime');
    setSpecificTime('09:00');
    setIsTimePickerVisible(false);
    setSelectedTimeDate(new Date());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!habitTitle.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    setIsSaving(true);
    try {
      const goalId = isStandalone ? null : selectedGoalId;
      
      // Build schedule object
      const schedule: HabitSchedule = {
        isDaily,
        daysOfWeek: isDaily ? convertToShortDayFormat(daysOfWeek) : convertToShortDayFormat(selectedDays),
        timeType,
        specificTime: timeType === 'specific' ? specificTime : undefined
      };
      
      await addHabit(goalId, habitTitle.trim(), schedule);
      
      Alert.alert('Success', 'Habit created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
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
            
            <Text style={styles.title}>New Habit</Text>
            
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
              <Text style={styles.label}>Description (Optional)</Text>
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
              <Text style={styles.label}>Link to Goal</Text>
              <Text style={styles.helperText}>
                Choose a goal this habit supports, or keep it as a standalone habit
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
                    <Text style={styles.goalEmoji}>🌟</Text>
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
              {availableGoals.map((goal) => (
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
              
              {/* Scheduling Section */}
              <View style={styles.section}>
                <Text style={styles.label}>When do you want to do this habit?</Text>
                <Text style={styles.helperText}>
                  Set up a schedule to help you stay consistent
                </Text>

                {/* Day Pattern Presets */}
                <Text style={styles.subLabel}>Which days?</Text>
                <View style={styles.dayPresetsContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.dayPresetButton,
                      isDaily && styles.dayPresetButtonSelected
                    ]}
                    onPress={setAllDays}
                  >
                    <Text style={[
                      styles.dayPresetText,
                      isDaily && styles.dayPresetTextSelected
                    ]}>
                      Every Day
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.dayPresetButton,
                      !isDaily && selectedDays.length === 5 && 
                      selectedDays.every(d => !['Saturday', 'Sunday'].includes(d)) && 
                      styles.dayPresetButtonSelected
                    ]}
                    onPress={setWeekdays}
                  >
                    <Text style={[
                      styles.dayPresetText,
                      !isDaily && selectedDays.length === 5 && 
                      selectedDays.every(d => !['Saturday', 'Sunday'].includes(d)) && 
                      styles.dayPresetTextSelected
                    ]}>
                      Weekdays
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.dayPresetButton,
                      !isDaily && selectedDays.length === 2 && 
                      selectedDays.every(d => ['Saturday', 'Sunday'].includes(d)) && 
                      styles.dayPresetButtonSelected
                    ]}
                    onPress={setWeekends}
                  >
                    <Text style={[
                      styles.dayPresetText,
                      !isDaily && selectedDays.length === 2 && 
                      selectedDays.every(d => ['Saturday', 'Sunday'].includes(d)) && 
                      styles.dayPresetTextSelected
                    ]}>
                      Weekends
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Individual Day Selection */}
                <View style={styles.daysGrid}>
                  {daysOfWeek.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCircle,
                        (isDaily || selectedDays.includes(day)) && styles.dayCircleSelected
                      ]}
                      onPress={() => {
                        if (isDaily) {
                          // If switching from daily, deselect all except this day
                          setIsDaily(false);
                          setSelectedDays([day]);
                        } else {
                          toggleDay(day);
                        }
                      }}
                    >
                      <Text style={[
                        styles.dayCircleText,
                        (isDaily || selectedDays.includes(day)) && styles.dayCircleTextSelected
                      ]}>
                        {day.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Time Selection */}
                <Text style={styles.subLabel}>When?</Text>
                
                {/* Anytime Option */}
                <TouchableOpacity 
                  style={[
                    styles.timePresetButton,
                    timeType === 'anytime' && styles.timePresetButtonSelected
                  ]}
                  onPress={() => setTimeType('anytime')}
                >
                  <Text style={[
                    styles.timePresetText,
                    timeType === 'anytime' && styles.timePresetTextSelected
                  ]}>
                    Anytime
                  </Text>
                </TouchableOpacity>

                {/* Time Preset Buttons */}
                <View style={styles.timePresetsContainer}>
                  {timePresets.map((preset) => (
                    <TouchableOpacity
                      key={preset.key}
                      style={[
                        styles.timePresetButton,
                        timeType === preset.key && styles.timePresetButtonSelected
                      ]}
                      onPress={() => handlePresetTime(preset)}
                    >
                      <Text style={[
                        styles.timePresetText,
                        timeType === preset.key && styles.timePresetTextSelected
                      ]}>
                        {preset.label}
                      </Text>
                      <Text style={[
                        styles.timePresetTime,
                        timeType === preset.key && styles.timePresetTimeSelected
                      ]}>
                        {preset.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Time Button */}
                <TouchableOpacity 
                  style={[
                    styles.customTimeButton,
                    timeType === 'specific' && styles.customTimeButtonSelected
                  ]}
                  onPress={showTimePicker}
                >
                  <Text style={[
                    styles.customTimeButtonText,
                    timeType === 'specific' && styles.customTimeButtonTextSelected
                  ]}>
                    {timeType === 'specific' ? `Custom Time: ${specificTime}` : 'Choose Custom Time'}
                  </Text>
                  <Text style={styles.customTimeHint}>Tap to open time picker</Text>
                </TouchableOpacity>

                {/* Enhanced Schedule Preview */}
                <View style={styles.enhancedSchedulePreview}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewIcon}>📅</Text>
                    <Text style={styles.previewTitle}>Your Schedule</Text>
                  </View>
                  
                  <View style={styles.previewContent}>
                    <Text style={styles.previewMainText}>
                      {getSchedulePreview()}
                    </Text>
                    
                    {/* Visual day indicators */}
                    {!isDaily && selectedDays.length > 0 && (
                      <View style={styles.previewDaysRow}>
                        {daysOfWeek.map((day) => (
                          <View
                            key={day}
                            style={[
                              styles.previewDayIndicator,
                              selectedDays.includes(day) && styles.previewDayIndicatorActive
                            ]}
                          >
                            <Text style={[
                              styles.previewDayText,
                              selectedDays.includes(day) && styles.previewDayTextActive
                            ]}>
                              {day.charAt(0)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {isDaily && (
                      <View style={styles.previewDaysRow}>
                        {daysOfWeek.map((day) => (
                          <View key={day} style={[styles.previewDayIndicator, styles.previewDayIndicatorActive]}>
                            <Text style={[styles.previewDayText, styles.previewDayTextActive]}>
                              {day.charAt(0)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Future Features Preview */}
            <View style={styles.section}>
              <Text style={styles.previewLabel}>Coming Soon</Text>
              <View style={styles.previewFeatures}>
                <Text style={styles.previewFeature}>📅 Scheduling & Reminders</Text>
                <Text style={styles.previewFeature}>🔥 Difficulty & Duration</Text>
                <Text style={styles.previewFeature}>🎨 Custom Icons</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Time Picker Modal */}
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={hideTimePicker}
          date={selectedTimeDate}
        />
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
  
  // Scheduling styles
  scheduleTypeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius,
    padding: 4,
  },
  scheduleTypeOption: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius - 2,
    alignItems: 'center',
  },
  scheduleTypeOptionSelected: {
    backgroundColor: theme.colors.interactive.primary,
  },
  scheduleTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  scheduleTypeTextSelected: {
    color: 'white',
  },
  
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dayChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  dayChipSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  dayChipTextSelected: {
    color: 'white',
  },
  
  timeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  timeOption: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    minWidth: 80,
  },
  timeOptionSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  timeOptionTextSelected: {
    color: 'white',
  },
  
  timeInputContainer: {
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.line,
    textAlign: 'center',
    width: 100,
    marginBottom: theme.spacing.xs,
  },
  timeInputHint: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  
  // Schedule preview styles
  schedulePreview: {
    backgroundColor: theme.colors.interactive.primary + '15',
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary + '30',
  },
  schedulePreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  schedulePreviewText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.interactive.primary,
    fontStyle: 'italic',
  },
  
  // Enhanced time selection styles
  subLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  timePresetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  timePresetButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  timePresetButtonSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  timePresetText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  timePresetTextSelected: {
    color: 'white',
  },
  timePresetTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  timePresetTimeSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  customTimeButton: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  customTimeButtonSelected: {
    backgroundColor: theme.colors.interactive.primary + '15',
    borderColor: theme.colors.interactive.primary,
  },
  customTimeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  customTimeButtonTextSelected: {
    color: theme.colors.interactive.primary,
  },
  customTimeHint: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Enhanced day selection styles
  dayPresetsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  dayPresetButton: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  dayPresetButtonSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  dayPresetText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  dayPresetTextSelected: {
    color: 'white',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  dayCircleText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  dayCircleTextSelected: {
    color: 'white',
  },
  
  // Enhanced schedule preview styles
  enhancedSchedulePreview: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary + '30',
    shadowColor: theme.colors.interactive.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  previewIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  previewContent: {
    gap: theme.spacing.md,
  },
  previewMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  previewDaysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  previewDayIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDayIndicatorActive: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  previewDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  previewDayTextActive: {
    color: 'white',
  },
});