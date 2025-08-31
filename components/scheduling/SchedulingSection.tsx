import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '@/hooks/useTheme';
import { HabitSchedule } from '@/lib/db';

interface SchedulingSectionProps {
  schedule?: HabitSchedule;
  onScheduleChange: (schedule: HabitSchedule) => void;
  compact?: boolean; // For onboarding use
}

export function SchedulingSection({ 
  schedule,
  onScheduleChange,
  compact = false 
}: SchedulingSectionProps) {
  const { theme } = useTheme();

  // Initialize state from props or defaults
  const [isDaily, setIsDaily] = useState(schedule?.isDaily ?? true);
  const [selectedDays, setSelectedDays] = useState<string[]>(
    schedule?.daysOfWeek ? 
    schedule.daysOfWeek.map(day => {
      const dayMap = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
      return dayMap[day] || day;
    }) :
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  );
  const [timeType, setTimeType] = useState<'anytime' | 'morning' | 'afternoon' | 'evening' | 'specific'>(
    schedule?.timeType === 'anytime' ? 'anytime' :
    schedule?.timeType === 'morning' ? 'morning' :
    schedule?.timeType === 'afternoon' ? 'afternoon' :
    schedule?.timeType === 'evening' ? 'evening' :
    schedule?.timeType === 'specific' ? 'specific' : 'anytime'
  );
  const [specificTime, setSpecificTime] = useState(schedule?.specificTime || '09:00');

  // Time picker state
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Day format conversion
  const convertToShortDayFormat = (fullDays: string[]): string[] => {
    const dayMap = {
      'Monday': 'mon', 'Tuesday': 'tue', 'Wednesday': 'wed',
      'Thursday': 'thu', 'Friday': 'fri', 'Saturday': 'sat', 'Sunday': 'sun'
    };
    return fullDays.map(day => dayMap[day]).filter(Boolean);
  };

  // Update parent with current schedule
  const updateSchedule = (updates: Partial<{
    isDaily: boolean;
    selectedDays: string[];
    timeType: typeof timeType;
    specificTime: string;
  }>) => {
    const newIsDaily = updates.isDaily ?? isDaily;
    const newSelectedDays = updates.selectedDays ?? selectedDays;
    const newTimeType = updates.timeType ?? timeType;
    const newSpecificTime = updates.specificTime ?? specificTime;

    const newSchedule: HabitSchedule = {
      isDaily: newIsDaily,
      daysOfWeek: convertToShortDayFormat(newIsDaily ? daysOfWeek : newSelectedDays),
      timeType: newTimeType,
      specificTime: newTimeType === 'specific' ? newSpecificTime : undefined
    };

    onScheduleChange(newSchedule);
  };

  // Time preset definitions
  const timePresets = [
    { key: 'morning', label: 'Morning', time: '08:00' },
    { key: 'lunch', label: 'Lunch', time: '12:00' },
    { key: 'afternoon', label: 'Afternoon', time: '15:00' },
    { key: 'evening', label: 'Evening', time: '18:00' },
  ];

  // Day pattern helpers
  const setWeekdays = () => {
    const newSelectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    setSelectedDays(newSelectedDays);
    setIsDaily(false);
    updateSchedule({ isDaily: false, selectedDays: newSelectedDays });
  };

  const setWeekends = () => {
    const newSelectedDays = ['Saturday', 'Sunday'];
    setSelectedDays(newSelectedDays);
    setIsDaily(false);
    updateSchedule({ isDaily: false, selectedDays: newSelectedDays });
  };

  const setAllDays = () => {
    setIsDaily(true);
    updateSchedule({ isDaily: true });
  };

  const toggleDay = (day: string) => {
    let newSelectedDays;
    if (selectedDays.includes(day)) {
      newSelectedDays = selectedDays.filter(d => d !== day);
    } else {
      newSelectedDays = [...selectedDays, day];
    }
    setSelectedDays(newSelectedDays);
    updateSchedule({ selectedDays: newSelectedDays });
  };

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
    const newTime = `${hours}:${minutes}`;
    setSpecificTime(newTime);
    setTimeType('specific');
    updateSchedule({ timeType: 'specific', specificTime: newTime });
    hideTimePicker();
  };

  const handlePresetTime = (preset: typeof timePresets[0]) => {
    setSpecificTime(preset.time);
    setTimeType(preset.key as any);
    updateSchedule({ timeType: preset.key as any, specificTime: preset.time });
  };

  const handleAnytime = () => {
    setTimeType('anytime');
    updateSchedule({ timeType: 'anytime' });
  };

  // Schedule preview
  const getSchedulePreview = (): string => {
    const dayText = isDaily ? 'Every day' : 
      selectedDays.length === 0 ? 'No days selected' :
      selectedDays.length === 7 ? 'Every day' :
      selectedDays.length === 5 && selectedDays.every(d => !['Saturday', 'Sunday'].includes(d)) ? 'Weekdays' :
      selectedDays.length === 2 && selectedDays.every(d => ['Saturday', 'Sunday'].includes(d)) ? 'Weekends' :
      `Every ${selectedDays.map(d => d.slice(0, 3)).join(', ')}`;

    let timeText = '';
    if (timeType === 'morning') timeText = ' in the morning';
    else if (timeType === 'lunch') timeText = ' at lunch';
    else if (timeType === 'afternoon') timeText = ' in the afternoon';
    else if (timeType === 'evening') timeText = ' in the evening';
    else if (timeType === 'specific') timeText = ` at ${specificTime}`;

    return `${dayText}${timeText}`;
  };

  const styles = createStyles(theme, compact);

  return (
    <View style={styles.container}>
      {!compact && (
        <Text style={styles.sectionTitle}>Schedule</Text>
      )}

      {/* Day Selection */}
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
        {daysOfWeek.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayCircle,
              (isDaily || selectedDays.includes(day)) && styles.dayCircleSelected
            ]}
            onPress={() => {
              if (isDaily) {
                setIsDaily(false);
                setSelectedDays([day]);
                updateSchedule({ isDaily: false, selectedDays: [day] });
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
        onPress={handleAnytime}
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

      {/* Schedule Preview */}
      <View style={styles.schedulePreview}>
        <Text style={styles.previewLabel}>📅 {getSchedulePreview()}</Text>
      </View>

      {/* Time Picker Modal */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={hideTimePicker}
      />
    </View>
  );
}

const createStyles = (theme: any, compact: boolean) => StyleSheet.create({
  container: {
    gap: compact ? theme.spacing.sm : theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  dayPresetsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  dayPresetButton: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: compact ? theme.spacing.sm : theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  dayPresetButtonSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  dayPresetText: {
    fontSize: compact ? 12 : 13,
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
    width: compact ? 32 : 40,
    height: compact ? 32 : 40,
    borderRadius: compact ? 16 : 20,
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
    fontSize: compact ? 14 : 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  dayCircleTextSelected: {
    color: 'white',
  },
  timePresetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  timePresetButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: compact ? theme.spacing.sm : theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  timePresetButtonSelected: {
    backgroundColor: theme.colors.interactive.primary,
    borderColor: theme.colors.interactive.primary,
  },
  timePresetText: {
    fontSize: compact ? 13 : 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  timePresetTextSelected: {
    color: 'white',
  },
  timePresetTime: {
    fontSize: compact ? 11 : 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  timePresetTimeSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  customTimeButton: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: compact ? theme.spacing.md : theme.spacing.lg,
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
    fontSize: compact ? 14 : 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  customTimeButtonTextSelected: {
    color: theme.colors.interactive.primary,
  },
  customTimeHint: {
    fontSize: compact ? 12 : 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  schedulePreview: {
    backgroundColor: theme.colors.interactive.primary + '15',
    borderRadius: theme.radius,
    padding: compact ? theme.spacing.md : theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary + '30',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: compact ? 14 : 16,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
    textAlign: 'center',
  },
});