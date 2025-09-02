import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder, Animated } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '@/hooks/useTheme';

interface TimeRange {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

interface TimeRangeSelectorProps {
  timeRange?: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  compact?: boolean;
}

const TIME_PRESETS: { label: string; range: TimeRange; emoji: string }[] = [
  { label: 'Early Morning', range: { start: '05:00', end: '07:00' }, emoji: '🌅' },
  { label: 'Morning', range: { start: '07:00', end: '10:00' }, emoji: '☀️' },
  { label: 'Mid-Morning', range: { start: '09:00', end: '11:00' }, emoji: '🌤️' },
  { label: 'Lunch Break', range: { start: '12:00', end: '14:00' }, emoji: '🍽️' },
  { label: 'Afternoon', range: { start: '14:00', end: '17:00' }, emoji: '🌞' },
  { label: 'Evening', range: { start: '17:00', end: '20:00' }, emoji: '🌇' },
  { label: 'Late Evening', range: { start: '20:00', end: '22:00' }, emoji: '🌙' },
  { label: 'Night', range: { start: '22:00', end: '23:59' }, emoji: '🌛' },
];

export function TimeRangeSelector({ timeRange, onTimeRangeChange, compact = false }: TimeRangeSelectorProps) {
  const { theme } = useTheme();
  const [isStartPickerVisible, setIsStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setIsEndPickerVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const styles = createStyles(theme, compact);

  // Convert time string to minutes since midnight for calculations
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes since midnight back to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Handle preset selection
  const handlePresetSelect = (preset: { label: string; range: TimeRange; emoji: string }) => {
    setSelectedPreset(preset.label);
    onTimeRangeChange(preset.range);
  };

  // Handle custom time selection
  const handleStartTimeConfirm = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const newStartTime = `${hours}:${minutes}`;
    
    const newRange: TimeRange = {
      start: newStartTime,
      end: timeRange?.end || '18:00'
    };
    
    // Ensure end time is after start time
    if (timeToMinutes(newRange.start) >= timeToMinutes(newRange.end)) {
      newRange.end = minutesToTime(timeToMinutes(newRange.start) + 60); // Add 1 hour
    }
    
    setSelectedPreset(null);
    onTimeRangeChange(newRange);
    setIsStartPickerVisible(false);
  };

  const handleEndTimeConfirm = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const newEndTime = `${hours}:${minutes}`;
    
    const newRange: TimeRange = {
      start: timeRange?.start || '09:00',
      end: newEndTime
    };
    
    // Ensure end time is after start time
    if (timeToMinutes(newRange.end) <= timeToMinutes(newRange.start)) {
      newRange.start = minutesToTime(timeToMinutes(newRange.end) - 60); // Subtract 1 hour
    }
    
    setSelectedPreset(null);
    onTimeRangeChange(newRange);
    setIsEndPickerVisible(false);
  };

  // Calculate duration in hours and minutes
  const getDuration = (range: TimeRange): string => {
    const startMinutes = timeToMinutes(range.start);
    const endMinutes = timeToMinutes(range.end);
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes < 60) {
      return `${durationMinutes}min`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };

  // Format time for display (12-hour format)
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Time Window</Text>
      <Text style={styles.sectionSubtitle}>
        Choose a flexible time range for this habit
      </Text>

      {/* Preset Time Ranges */}
      <View style={styles.presetsContainer}>
        {TIME_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            style={[
              styles.presetButton,
              selectedPreset === preset.label && styles.presetButtonSelected
            ]}
            onPress={() => handlePresetSelect(preset)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.presetEmoji,
              selectedPreset === preset.label && styles.presetEmojiSelected
            ]}>
              {preset.emoji}
            </Text>
            <Text style={[
              styles.presetLabel,
              selectedPreset === preset.label && styles.presetLabelSelected
            ]}>
              {preset.label}
            </Text>
            <Text style={[
              styles.presetRange,
              selectedPreset === preset.label && styles.presetRangeSelected
            ]}>
              {formatTime(preset.range.start)} - {formatTime(preset.range.end)}
            </Text>
            <Text style={[
              styles.presetDuration,
              selectedPreset === preset.label && styles.presetDurationSelected
            ]}>
              {getDuration(preset.range)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Time Range */}
      <View style={styles.customSection}>
        <Text style={styles.customTitle}>Custom Time Range</Text>
        <View style={styles.customTimeContainer}>
          {/* Start Time */}
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setIsStartPickerVisible(true)}
          >
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>
              {timeRange ? formatTime(timeRange.start) : '9:00 AM'}
            </Text>
          </TouchableOpacity>

          {/* Time Range Indicator */}
          <View style={styles.rangeIndicator}>
            <View style={styles.rangeLine} />
            <Text style={styles.rangeIcon}>→</Text>
          </View>

          {/* End Time */}
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setIsEndPickerVisible(true)}
          >
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeValue}>
              {timeRange ? formatTime(timeRange.end) : '6:00 PM'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Duration Display */}
        {timeRange && (
          <View style={styles.durationDisplay}>
            <Text style={styles.durationIcon}>⏱️</Text>
            <Text style={styles.durationText}>
              {getDuration(timeRange)} window
            </Text>
          </View>
        )}
      </View>

      {/* Visual Time Range Slider */}
      {timeRange && (
        <View style={styles.visualRange}>
          <Text style={styles.visualRangeTitle}>Time Window Visualization</Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timeline}>
              {/* 24-hour markers */}
              {Array.from({ length: 24 }, (_, i) => (
                <View key={i} style={styles.hourMarker}>
                  <Text style={styles.hourText}>{i}</Text>
                </View>
              ))}
              
              {/* Selected range overlay */}
              <View
                style={[
                  styles.rangeOverlay,
                  {
                    left: `${(timeToMinutes(timeRange.start) / 1440) * 100}%`,
                    width: `${((timeToMinutes(timeRange.end) - timeToMinutes(timeRange.start)) / 1440) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.timelineLabel}>
              Your habit window: {formatTime(timeRange.start)} - {formatTime(timeRange.end)}
            </Text>
          </View>
        </View>
      )}

      {/* Time Pickers */}
      <DateTimePickerModal
        isVisible={isStartPickerVisible}
        mode="time"
        onConfirm={handleStartTimeConfirm}
        onCancel={() => setIsStartPickerVisible(false)}
        date={timeRange ? new Date(`2000-01-01T${timeRange.start}:00`) : new Date()}
      />

      <DateTimePickerModal
        isVisible={isEndPickerVisible}
        mode="time"
        onConfirm={handleEndTimeConfirm}
        onCancel={() => setIsEndPickerVisible(false)}
        date={timeRange ? new Date(`2000-01-01T${timeRange.end}:00`) : new Date()}
      />
    </View>
  );
}

const createStyles = (theme: any, compact: boolean) => StyleSheet.create({
  container: {
    gap: compact ? theme.spacing.md : theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: compact ? 16 : 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: compact ? 13 : 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  presetButton: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    minWidth: '48%',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  presetButtonSelected: {
    backgroundColor: theme.colors.interactive.primary + '15',
    borderColor: theme.colors.interactive.primary,
  },
  presetEmoji: {
    fontSize: 20,
  },
  presetEmojiSelected: {
    transform: [{ scale: 1.1 }],
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  presetLabelSelected: {
    color: theme.colors.interactive.primary,
  },
  presetRange: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  presetRangeSelected: {
    color: theme.colors.interactive.primary,
  },
  presetDuration: {
    fontSize: 11,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  presetDurationSelected: {
    color: theme.colors.interactive.primary,
    fontWeight: '600',
  },
  customSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  customTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  timeButton: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  rangeIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeLine: {
    width: 20,
    height: 1,
    backgroundColor: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  rangeIcon: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.interactive.primary + '15',
    borderRadius: theme.radius,
  },
  durationIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
  },
  visualRange: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  visualRangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  timelineContainer: {
    gap: theme.spacing.md,
  },
  timeline: {
    height: 40,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    position: 'relative',
    flexDirection: 'row',
  },
  hourMarker: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.line,
  },
  hourText: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  rangeOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.interactive.primary + '30',
    borderRadius: theme.radius,
    borderWidth: 2,
    borderColor: theme.colors.interactive.primary,
  },
  timelineLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});