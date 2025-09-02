import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { createOnboardingStyles } from '@/components/goal-creation/OnboardingGoalCreationStyles';
import { SUGGESTED_HABITS } from '@/components/goal-creation/GoalCreationFlow';
import { SchedulingSection } from '@/components/scheduling/SchedulingSection';
import { HabitSchedule } from '@/lib/db';

export default function HabitSelectionStep() {
  const { data, addHabit, removeHabit, setStep, setHabitSchedule } = useOnboardingStore();
  const styles = createOnboardingStyles();

  // Modal state for scheduling
  const [schedulingModalVisible, setSchedulingModalVisible] = useState(false);
  const [currentHabitForScheduling, setCurrentHabitForScheduling] = useState<string | null>(null);

  const suggestedHabits = data.goalCategory ? SUGGESTED_HABITS[data.goalCategory] : [];
  const [customHabit, setCustomHabit] = React.useState('');

  const toggleHabit = (habit: string) => {
    if (data.selectedHabits.includes(habit)) {
      removeHabit(habit);
    } else {
      addHabit(habit);
    }
  };

  const addCustomHabit = () => {
    const habit = customHabit.trim();
    
    // Validate habit input to prevent corrupted/dummy habits
    const isValidHabit = habit && 
      habit.length >= 3 && 
      habit.length <= 80 &&
      !/^(.)\1{4,}/.test(habit) && // Reject strings with 5+ repeated characters
      !/^[^a-zA-Z0-9\s]+$/.test(habit) && // Must contain some letters/numbers
      !data.selectedHabits.includes(habit);
    
    if (isValidHabit) {
      addHabit(habit);
      setCustomHabit('');
    } else if (habit && habit.length < 3) {
      // Optional: Show feedback for too-short habits
      console.warn('Habit name too short');
    }
  };

  // Scheduling handlers
  const openSchedulingModal = (habit: string) => {
    setCurrentHabitForScheduling(habit);
    setSchedulingModalVisible(true);
  };

  const closeSchedulingModal = () => {
    setSchedulingModalVisible(false);
    setCurrentHabitForScheduling(null);
  };

  const handleScheduleChange = (schedule: HabitSchedule) => {
    if (currentHabitForScheduling) {
      setHabitSchedule(currentHabitForScheduling, schedule);
    }
  };

  // Get schedule preview for a habit
  const getSchedulePreview = (habit: string): string => {
    const schedule = data.habitSchedules[habit];
    if (!schedule) return 'Tap to set schedule';
    
    const dayText = schedule.isDaily ? 'Daily' : 
      schedule.daysOfWeek.length === 5 && 
      !schedule.daysOfWeek.includes('sat') && !schedule.daysOfWeek.includes('sun') ? 'Weekdays' :
      schedule.daysOfWeek.length === 2 && 
      schedule.daysOfWeek.includes('sat') && schedule.daysOfWeek.includes('sun') ? 'Weekends' :
      `${schedule.daysOfWeek.length} days`;

    const timeText = schedule.timeType === 'anytime' ? '' :
      schedule.timeType === 'morning' ? ' • Morning' :
      schedule.timeType === 'afternoon' ? ' • Afternoon' :
      schedule.timeType === 'evening' ? ' • Evening' :
      schedule.timeType === 'specific' ? ` • ${schedule.specificTime}` : '';

    return `${dayText}${timeText}`;
  };

  const handleContinue = () => {
    setStep(4); // Advance to Your Why step
  };

  const canContinue = data.goalTitle.trim().length >= 3; // Basic validation

  return (
    <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header as any}>
          <Text style={styles.title as any}>Add some habits</Text>
          <Text style={styles.subtitle as any}>
            Choose habits that will help you achieve &quot;{data.goalTitle}&quot;
          </Text>
        </View>

        <View style={styles.form as any}>
          {/* Suggested Habits */}
          {suggestedHabits.length > 0 && (
            <View style={styles.field as any}>
              <Text style={styles.label as any}>Suggested habits</Text>
              <View style={styles.habitsContainer as any}>
                {suggestedHabits.map((habit) => (
                  <TouchableOpacity
                    key={habit}
                    style={[
                      styles.habitChip as any,
                      data.selectedHabits.includes(habit) && (styles.habitChipSelected as any)
                    ]}
                    onPress={() => toggleHabit(habit)}
                  >
                    <Text style={[
                      styles.habitChipText as any,
                      data.selectedHabits.includes(habit) && (styles.habitChipTextSelected as any)
                    ]}>
                      {habit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Custom Habit Input */}
          <View style={styles.field as any}>
            <Text style={styles.label as any}>Add your own habit</Text>
            <View style={styles.customHabitContainer as any}>
              <TextInput
                style={styles.input as any}
                placeholder="e.g., Practice piano for 20 minutes"
                placeholderTextColor={'#999'}
                value={customHabit}
                onChangeText={setCustomHabit}
                maxLength={80}
                onSubmitEditing={addCustomHabit}
                autoCorrect={false}
                autoCapitalize="sentences"
                autoComplete="off"
                spellCheck={false}
              />
              <TouchableOpacity 
                style={styles.addButton as any}
                onPress={addCustomHabit}
                disabled={!customHabit.trim()}
              >
                <Text style={styles.addButtonText as any}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selected Habits with Scheduling */}
          {data.selectedHabits.length > 0 && (
            <View style={styles.field as any}>
              <Text style={styles.label as any}>Selected habits ({data.selectedHabits.length})</Text>
              <Text style={styles.helperText as any}>Tap &quot;Set Schedule&quot; to customize when you&apos;ll do each habit</Text>
              <View style={styles.selectedHabitsContainer as any}>
                {data.selectedHabits.map((habit) => (
                  <View key={habit} style={styles.selectedHabitCard as any}>
                    {/* Habit Header */}
                    <View style={styles.selectedHabitHeader as any}>
                      <Text style={styles.selectedHabitText as any}>{habit}</Text>
                      <TouchableOpacity 
                        onPress={() => toggleHabit(habit)}
                        style={styles.removeHabitButton as any}
                      >
                        <Text style={styles.removeHabitButtonText as any}>×</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Schedule Info */}
                    <View style={styles.scheduleInfo as any}>
                      <Text style={styles.schedulePreviewText as any}>
                        {getSchedulePreview(habit)}
                      </Text>
                      <TouchableOpacity
                        style={styles.setScheduleButton as any}
                        onPress={() => openSchedulingModal(habit)}
                      >
                        <Text style={styles.setScheduleButtonText as any}>
                          {data.habitSchedules[habit] ? 'Edit' : 'Set Schedule'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.modalNavigation as any}>
          <TouchableOpacity
            onPress={handleContinue}
            style={[styles.nextButton as any, !canContinue && (styles.nextButtonDisabled as any)]}
            disabled={!canContinue}
          >
            <Text style={[styles.nextButtonText as any, !canContinue && (styles.nextButtonTextDisabled as any)]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Scheduling Modal */}
      <Modal
        visible={schedulingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSchedulingModal}
      >
        <View style={styles.modalContainer as any}>
          <View style={styles.modalHeader as any}>
            <TouchableOpacity onPress={closeSchedulingModal}>
              <Text style={styles.modalCloseText as any}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle as any}>
              Schedule: {currentHabitForScheduling}
            </Text>
            <TouchableOpacity onPress={closeSchedulingModal}>
              <Text style={styles.modalDoneText as any}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent as any}>
            {currentHabitForScheduling && (
              <SchedulingSection
                schedule={data.habitSchedules[currentHabitForScheduling]}
                onScheduleChange={handleScheduleChange}
                compact={true}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </OnboardingContainer>
  );
}