import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HabitSchedule } from '@/lib/db';
import { HabitTemplate, HabitCategory } from './UnifiedHabitTemplates';

export interface ScheduleOption {
  key: string;
  label: string;
  days: string[];
  isDaily: boolean;
  description?: string;
}

export interface TimeOption {
  key: string;
  label: string;
  description: string;
  emoji?: string;
}

// Predefined schedule patterns
export const SCHEDULE_PATTERNS: ScheduleOption[] = [
  {
    key: 'daily',
    label: 'Daily',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    isDaily: true,
    description: 'Every day of the week'
  },
  {
    key: 'weekdays',
    label: 'Weekdays',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    isDaily: false,
    description: 'Monday through Friday'
  },
  {
    key: 'weekends',
    label: 'Weekends',
    days: ['sat', 'sun'],
    isDaily: false,
    description: 'Saturday and Sunday'
  },
  {
    key: 'mwf',
    label: '3x/week',
    days: ['mon', 'wed', 'fri'],
    isDaily: false,
    description: 'Monday, Wednesday, Friday'
  },
  {
    key: 'tth',
    label: '2x/week',
    days: ['tue', 'thu'],
    isDaily: false,
    description: 'Tuesday and Thursday'
  }
];

// Time of day options
export const TIME_OPTIONS: TimeOption[] = [
  {
    key: 'morning',
    label: 'Morning',
    description: '6-11 AM',
    emoji: '🌅'
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
    description: '12-5 PM',
    emoji: '☀️'
  },
  {
    key: 'evening',
    label: 'Evening',
    description: '6-9 PM',
    emoji: '🌆'
  },
  {
    key: 'anytime',
    label: 'Anytime',
    description: 'Flexible',
    emoji: '⏰'
  }
];

interface ProgressiveSchedulePickerProps {
  habitName?: string;
  currentSchedule?: HabitSchedule;
  suggestedSchedule?: HabitSchedule;
  category?: HabitCategory;
  mode?: 'simple' | 'advanced';
  compact?: boolean;
  onScheduleChange: (schedule: HabitSchedule) => void;
  style?: any;
}

export function ProgressiveSchedulePicker({
  habitName,
  currentSchedule,
  suggestedSchedule,
  category,
  mode = 'simple',
  compact = false,
  onScheduleChange,
  style
}: ProgressiveSchedulePickerProps) {
  const [localSchedule, setLocalSchedule] = useState<HabitSchedule>(
    currentSchedule || suggestedSchedule || {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'anytime',
      specificTime: undefined,
      reminder: false
    }
  );

  const styles = createScheduleStyles();

  const updateSchedule = (updates: Partial<HabitSchedule>) => {
    const newSchedule = { ...localSchedule, ...updates };
    setLocalSchedule(newSchedule);
    onScheduleChange(newSchedule);
  };

  const handleFrequencyChange = (option: ScheduleOption) => {
    updateSchedule({
      isDaily: option.isDaily,
      daysOfWeek: option.days
    });
  };

  const handleTimeChange = (option: TimeOption) => {
    updateSchedule({
      timeType: option.key as any
    });
  };

  // Get current frequency option
  const getCurrentFrequencyOption = (): ScheduleOption | null => {
    return SCHEDULE_PATTERNS.find(option => {
      if (localSchedule.isDaily !== option.isDaily) return false;
      if (!localSchedule.daysOfWeek) return false;

      const sortedCurrent = [...localSchedule.daysOfWeek].sort();
      const sortedOption = [...option.days].sort();

      return JSON.stringify(sortedCurrent) === JSON.stringify(sortedOption);
    }) || null;
  };

  // Get current time option
  const getCurrentTimeOption = (): TimeOption => {
    return TIME_OPTIONS.find(option => option.key === localSchedule.timeType) || TIME_OPTIONS[3];
  };

  // Get smart suggestions based on category
  const getSmartSuggestions = (): { frequency?: ScheduleOption; time?: TimeOption } => {
    if (!category) return {};

    const categoryDefaults: Record<HabitCategory, { frequency: string; time: string }> = {
      health: { frequency: 'daily', time: 'morning' },
      learning: { frequency: 'daily', time: 'evening' },
      career: { frequency: 'weekdays', time: 'morning' },
      personal: { frequency: 'daily', time: 'evening' },
      finance: { frequency: 'mwf', time: 'afternoon' },
      relationships: { frequency: 'weekends', time: 'afternoon' },
      creative: { frequency: 'mwf', time: 'evening' }
    };

    const defaults = categoryDefaults[category];
    return {
      frequency: SCHEDULE_PATTERNS.find(p => p.key === defaults.frequency),
      time: TIME_OPTIONS.find(t => t.key === defaults.time)
    };
  };

  const smartSuggestions = getSmartSuggestions();
  const currentFrequency = getCurrentFrequencyOption();
  const currentTime = getCurrentTimeOption();

  if (compact) {
    return (
      <View style={[styles.container, styles.compactContainer, style]}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>
            ⏰ Schedule{habitName ? ` for "${habitName}"` : ''}
          </Text>
        </View>

        {/* Compact Frequency Selection */}
        <View style={styles.compactSection}>
          <Text style={styles.compactSectionLabel}>How often:</Text>
          <View style={styles.compactOptions}>
            {SCHEDULE_PATTERNS.slice(0, 3).map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.compactOption,
                  currentFrequency?.key === option.key && styles.compactOptionSelected
                ]}
                onPress={() => handleFrequencyChange(option)}
              >
                <Text style={[
                  styles.compactOptionText,
                  currentFrequency?.key === option.key && styles.compactOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Compact Time Selection */}
        <View style={styles.compactSection}>
          <Text style={styles.compactSectionLabel}>When:</Text>
          <View style={styles.compactOptions}>
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.compactOption,
                  currentTime.key === option.key && styles.compactOptionSelected
                ]}
                onPress={() => handleTimeChange(option)}
              >
                <Text style={[
                  styles.compactOptionText,
                  currentTime.key === option.key && styles.compactOptionTextSelected
                ]}>
                  {option.emoji} {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Compact Schedule Summary */}
        <View style={styles.compactSummary}>
          <Text style={styles.compactSummaryText}>
            {getScheduleSummary(localSchedule)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          ⏰ When will you do{habitName ? ` "${habitName}"` : ' this habit'}?
        </Text>
        {smartSuggestions.frequency && (
          <Text style={styles.subtitle}>
            💡 {category} habits typically work well {smartSuggestions.frequency.label.toLowerCase()}
            {smartSuggestions.time && ` in the ${smartSuggestions.time.label.toLowerCase()}`}
          </Text>
        )}
      </View>

      {/* Frequency Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>How often:</Text>
        <View style={styles.frequencyGrid}>
          {SCHEDULE_PATTERNS.slice(0, mode === 'simple' ? 3 : 5).map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.frequencyOption,
                currentFrequency?.key === option.key && styles.frequencyOptionSelected,
                smartSuggestions.frequency?.key === option.key && styles.frequencyOptionSuggested
              ]}
              onPress={() => handleFrequencyChange(option)}
            >
              <Text style={[
                styles.frequencyLabel,
                currentFrequency?.key === option.key && styles.frequencyLabelSelected
              ]}>
                {option.label}
              </Text>
              {option.description && (
                <Text style={[
                  styles.frequencyDescription,
                  currentFrequency?.key === option.key && styles.frequencyDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              )}
              {smartSuggestions.frequency?.key === option.key && !currentFrequency && (
                <Text style={styles.suggestionBadge}>Suggested</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Time of day:</Text>
        <View style={styles.timeGrid}>
          {TIME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.timeOption,
                currentTime.key === option.key && styles.timeOptionSelected,
                smartSuggestions.time?.key === option.key && styles.timeOptionSuggested
              ]}
              onPress={() => handleTimeChange(option)}
            >
              <Text style={[
                styles.timeLabel,
                currentTime.key === option.key && styles.timeLabelSelected
              ]}>
                {option.emoji} {option.label}
              </Text>
              <Text style={[
                styles.timeDescription,
                currentTime.key === option.key && styles.timeDescriptionSelected
              ]}>
                {option.description}
              </Text>
              {smartSuggestions.time?.key === option.key && currentTime.key !== option.key && (
                <Text style={styles.suggestionBadge}>Suggested</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Schedule Preview */}
      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Your schedule:</Text>
        <Text style={styles.previewText}>
          {getScheduleSummary(localSchedule)}
        </Text>
        {habitName && (
          <Text style={styles.previewExample}>
            You&apos;ll do &quot;{habitName}&quot; {getScheduleSummary(localSchedule).toLowerCase()}
          </Text>
        )}
      </View>

      <Text style={styles.footnote}>
        You can change this later if needed
      </Text>
    </View>
  );
}

// Helper function to generate schedule summary
function getScheduleSummary(schedule: HabitSchedule): string {
  const dayText = schedule.isDaily ? 'Every day' :
    !schedule.daysOfWeek || schedule.daysOfWeek.length === 0 ? 'No days selected' :
    schedule.daysOfWeek.length === 7 ? 'Every day' :
    schedule.daysOfWeek.length === 5 &&
    ['mon', 'tue', 'wed', 'thu', 'fri'].every(d => schedule.daysOfWeek!.includes(d)) ? 'Weekdays' :
    schedule.daysOfWeek.length === 2 &&
    ['sat', 'sun'].every(d => schedule.daysOfWeek!.includes(d)) ? 'Weekends' :
    `${schedule.daysOfWeek.length}x per week`;

  const timeText = schedule.timeType === 'anytime' ? '' :
    schedule.timeType === 'morning' ? ' in the morning' :
    schedule.timeType === 'afternoon' ? ' in the afternoon' :
    schedule.timeType === 'evening' ? ' in the evening' :
    schedule.specificTime ? ` at ${schedule.specificTime}` : '';

  return `${dayText}${timeText}`;
}

// Hook for using schedule picker
export function useSchedulePicker(
  initialSchedule?: HabitSchedule,
  category?: HabitCategory
): [HabitSchedule, (schedule: HabitSchedule) => void] {
  const [schedule, setSchedule] = useState<HabitSchedule>(
    initialSchedule || {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'anytime',
      specificTime: undefined,
      reminder: false
    }
  );

  return [schedule, setSchedule];
}

const createScheduleStyles = () => StyleSheet.create({
  container: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)'
  },
  compactContainer: {
    padding: 8
  },

  // Header
  header: {
    marginBottom: 12
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 16
  },

  // Sections
  section: {
    marginBottom: 12
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6
  },

  // Frequency Options
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    marginVertical: -3
  },
  frequencyOption: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: '30%',
    alignItems: 'center',
    marginHorizontal: 3,
    marginVertical: 3
  },
  frequencyOptionSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e'
  },
  frequencyOptionSuggested: {
    borderColor: '#fbbf24',
    borderWidth: 2
  },
  frequencyLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2
  },
  frequencyLabelSelected: {
    color: '#FFFFFF'
  },
  frequencyDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textAlign: 'center'
  },
  frequencyDescriptionSelected: {
    color: 'rgba(255,255,255,0.9)'
  },

  // Time Options
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    marginVertical: -3
  },
  timeOption: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    marginHorizontal: 3,
    marginVertical: 3,
    minWidth: '22%'
  },
  timeOptionSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e'
  },
  timeOptionSuggested: {
    borderColor: '#fbbf24',
    borderWidth: 2
  },
  timeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2
  },
  timeLabelSelected: {
    color: '#FFFFFF'
  },
  timeDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textAlign: 'center'
  },
  timeDescriptionSelected: {
    color: 'rgba(255,255,255,0.9)'
  },

  // Suggestion badge
  suggestionBadge: {
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2
  },

  // Preview
  preview: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  previewExample: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic'
  },

  footnote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center'
  },

  // Compact styles
  compactHeader: {
    marginBottom: 8
  },
  compactTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  compactSection: {
    marginBottom: 8
  },
  compactSectionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4
  },
  compactOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
    marginVertical: -2
  },
  compactOption: {
    marginHorizontal: 2,
    marginVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  compactOptionSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e'
  },
  compactOptionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600'
  },
  compactOptionTextSelected: {
    color: '#FFFFFF'
  },
  compactSummary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center'
  },
  compactSummaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600'
  }
});