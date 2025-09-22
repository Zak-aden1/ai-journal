import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HabitSchedule } from '@/lib/db';

interface HabitScheduleCustomizerProps {
  habitName: string;
  schedule: HabitSchedule;
  onScheduleChange: (schedule: HabitSchedule) => void;
  onClose: () => void;
}

export function HabitScheduleCustomizer({
  habitName,
  schedule,
  onScheduleChange,
  onClose
}: HabitScheduleCustomizerProps) {
  const [localSchedule, setLocalSchedule] = useState<HabitSchedule>(schedule);

  const frequencies = [
    { key: 'daily', label: 'Daily', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    { key: 'weekdays', label: 'Weekdays', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
    { key: 'weekends', label: 'Weekends', days: ['sat', 'sun'] },
    { key: 'custom', label: 'Custom', days: [] }
  ];

  const dayLabels = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun'
  };

  const timeTypes = [
    { key: 'morning', label: '🌅 Morning', description: '6-11 AM' },
    { key: 'afternoon', label: '☀️ Afternoon', description: '12-5 PM' },
    { key: 'evening', label: '🌆 Evening', description: '6-9 PM' },
    { key: 'anytime', label: '⏰ Anytime', description: 'Flexible' }
  ];

  const handleFrequencyChange = (frequencyOption: typeof frequencies[0]) => {
    const updatedSchedule: HabitSchedule = {
      ...localSchedule,
      isDaily: frequencyOption.key === 'daily',
      daysOfWeek: frequencyOption.days.length > 0 ? frequencyOption.days : localSchedule.daysOfWeek
    };
    setLocalSchedule(updatedSchedule);
  };

  const handleDayToggle = (day: string) => {
    const currentDays = localSchedule.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];

    const updatedSchedule: HabitSchedule = {
      ...localSchedule,
      daysOfWeek: newDays,
      isDaily: newDays.length === 7
    };
    setLocalSchedule(updatedSchedule);
  };

  const handleTimeTypeChange = (timeType: string) => {
    const updatedSchedule: HabitSchedule = {
      ...localSchedule,
      timeType: timeType as any
    };
    setLocalSchedule(updatedSchedule);
  };

  const handleSave = () => {
    onScheduleChange(localSchedule);
    onClose();
  };

  const getCurrentFrequency = () => {
    if (localSchedule.isDaily) return 'daily';
    if (localSchedule.daysOfWeek?.length === 5 &&
        ['mon', 'tue', 'wed', 'thu', 'fri'].every(day => localSchedule.daysOfWeek?.includes(day))) {
      return 'weekdays';
    }
    if (localSchedule.daysOfWeek?.length === 2 &&
        ['sat', 'sun'].every(day => localSchedule.daysOfWeek?.includes(day))) {
      return 'weekends';
    }
    return 'custom';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customize Schedule</Text>
        <Text style={styles.habitName}>{habitName}</Text>
      </View>

      {/* Frequency Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How often?</Text>
        <View style={styles.frequencyGrid}>
          {frequencies.map((freq) => (
            <TouchableOpacity
              key={freq.key}
              style={[
                styles.frequencyOption,
                getCurrentFrequency() === freq.key && styles.frequencyOptionSelected
              ]}
              onPress={() => handleFrequencyChange(freq)}
            >
              <Text style={[
                styles.frequencyLabel,
                getCurrentFrequency() === freq.key && styles.frequencyLabelSelected
              ]}>
                {freq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Days Selection */}
      {getCurrentFrequency() === 'custom' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Which days?</Text>
          <View style={styles.daysGrid}>
            {Object.entries(dayLabels).map(([dayKey, dayLabel]) => (
              <TouchableOpacity
                key={dayKey}
                style={[
                  styles.dayOption,
                  localSchedule.daysOfWeek?.includes(dayKey) && styles.dayOptionSelected
                ]}
                onPress={() => handleDayToggle(dayKey)}
              >
                <Text style={[
                  styles.dayLabel,
                  localSchedule.daysOfWeek?.includes(dayKey) && styles.dayLabelSelected
                ]}>
                  {dayLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Time Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What time of day?</Text>
        <View style={styles.timeGrid}>
          {timeTypes.map((timeType) => (
            <TouchableOpacity
              key={timeType.key}
              style={[
                styles.timeOption,
                localSchedule.timeType === timeType.key && styles.timeOptionSelected
              ]}
              onPress={() => handleTimeTypeChange(timeType.key)}
            >
              <Text style={[
                styles.timeLabel,
                localSchedule.timeType === timeType.key && styles.timeLabelSelected
              ]}>
                {timeType.label}
              </Text>
              <Text style={[
                styles.timeDescription,
                localSchedule.timeType === timeType.key && styles.timeDescriptionSelected
              ]}>
                {timeType.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  habitName: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  // Frequency Grid
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    minWidth: '45%',
    alignItems: 'center',
  },
  frequencyOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  frequencyLabelSelected: {
    color: '#FFFFFF',
  },

  // Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayOption: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    minWidth: 44,
    alignItems: 'center',
  },
  dayOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  dayLabelSelected: {
    color: '#FFFFFF',
  },

  // Time Grid
  timeGrid: {
    gap: 8,
  },
  timeOption: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  timeOptionSelected: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a855f7',
    marginBottom: 2,
  },
  timeLabelSelected: {
    color: '#FFFFFF',
  },
  timeDescription: {
    fontSize: 12,
    color: '#a855f7',
    opacity: 0.8,
  },
  timeDescriptionSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});