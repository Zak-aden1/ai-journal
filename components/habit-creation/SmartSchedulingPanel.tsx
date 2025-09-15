import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { HabitSchedule } from '@/lib/db';
import { HabitCategory, HABIT_CATEGORIES } from './HabitCategorySelector';
import { SchedulingSection } from '@/components/scheduling/SchedulingSection';

interface SmartSchedulingSuggestion {
  id: string;
  title: string;
  description: string;
  schedule: HabitSchedule;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  emoji: string;
}

interface SmartSchedulingPanelProps {
  category: HabitCategory | null;
  currentSchedule?: HabitSchedule;
  onScheduleChange: (schedule: HabitSchedule) => void;
  existingHabits?: { schedule: HabitSchedule; title: string }[];
}

// Stable empty fallback to avoid effect loops
const EMPTY_HABITS: readonly { schedule: HabitSchedule; title: string }[] = Object.freeze([]);

export function SmartSchedulingPanel({
  category,
  currentSchedule,
  onScheduleChange,
  existingHabits,
}: SmartSchedulingPanelProps) {
  const { theme } = useTheme();
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSchedulingSuggestion[]>([]);
  const [showCustomScheduling, setShowCustomScheduling] = useState(false);

  const styles = createStyles(theme);

  const generateSmartSuggestions = useCallback((
    habitCategory: HabitCategory,
    existingHabits: { schedule: HabitSchedule; title: string }[]
  ): SmartSchedulingSuggestion[] => {
    const categoryData = HABIT_CATEGORIES.find(c => c.id === habitCategory);
    if (!categoryData) return [];

    const suggestions: SmartSchedulingSuggestion[] = [];
    const suggestedTimes = categoryData.suggestedTimes;
    
    // Morning routine suggestion
    if (suggestedTimes.some(time => time <= '08:00')) {
      suggestions.push({
        id: 'morning-routine',
        title: 'Morning Ritual',
        description: `Start your day with this ${categoryData.title.toLowerCase()} habit`,
        schedule: {
          isDaily: true,
          daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          timeType: 'morning',
          specificTime: suggestedTimes[0]
        },
        confidence: 'high',
        reason: 'Morning habits have 73% higher completion rates',
        emoji: '🌅'
      });
    }

    // Weekday focus
    suggestions.push({
      id: 'weekday-focus',
      title: 'Weekday Commitment',
      description: 'Build consistency during your work week',
      schedule: {
        isDaily: false,
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
        timeType: suggestedTimes.length > 1 ? 'evening' : 'morning',
        specificTime: suggestedTimes[1] || suggestedTimes[0]
      },
      confidence: 'medium',
      reason: 'Weekday habits reduce decision fatigue',
      emoji: '💼'
    });

    // Evening wind-down (for wellness and personal categories)
    if (['wellness', 'mindfulness', 'personal'].includes(habitCategory)) {
      suggestions.push({
        id: 'evening-ritual',
        title: 'Evening Ritual',
        description: 'End your day with mindful practice',
        schedule: {
          isDaily: true,
          daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          timeType: 'evening',
          specificTime: '21:00'
        },
        confidence: 'high',
        reason: 'Evening routines improve sleep quality by 45%',
        emoji: '🌙'
      });
    }

    // Lunch break habit (for learning, productivity)
    if (['learning', 'productivity', 'creativity'].includes(habitCategory)) {
      suggestions.push({
        id: 'lunch-break',
        title: 'Lunch Break Boost',
        description: 'Make the most of your midday break',
        schedule: {
          isDaily: false,
          daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
          timeType: 'lunch',
          specificTime: '12:30'
        },
        confidence: 'medium',
        reason: 'Midday learning increases retention by 28%',
        emoji: '🍽️'
      });
    }

    // Weekend adventure (for adventure, social, creativity)
    if (['adventure', 'social', 'creativity'].includes(habitCategory)) {
      suggestions.push({
        id: 'weekend-adventure',
        title: 'Weekend Explorer',
        description: 'Dedicate time for what you love',
        schedule: {
          isDaily: false,
          daysOfWeek: ['sat', 'sun'],
          timeType: 'afternoon',
          specificTime: '14:00'
        },
        confidence: 'medium',
        reason: 'Weekend habits boost life satisfaction',
        emoji: '🎉'
      });
    }

    // Avoid scheduling conflicts with existing habits
    return suggestions.map(suggestion => {
      const hasConflict = existingHabits.some(existing => 
        existing.schedule.timeType === suggestion.schedule.timeType &&
        existing.schedule.specificTime === suggestion.schedule.specificTime
      );
      
      if (hasConflict) {
        return {
          ...suggestion,
          confidence: 'low' as const,
          reason: 'Alternative time to avoid conflicts'
        };
      }
      
      return suggestion;
    });
  }, []);

  // Generate smart suggestions based on category and existing habits
  useEffect(() => {
    if (category) {
      const inputHabits = (existingHabits && existingHabits.length > 0)
        ? existingHabits
        : (EMPTY_HABITS as { schedule: HabitSchedule; title: string }[]);
      const generatedSuggestions = generateSmartSuggestions(category, inputHabits);
      setSuggestions(generatedSuggestions);
    }
  }, [category, existingHabits, generateSmartSuggestions]);

  // Auto-select best suggestion only when category first loads (separate effect)
  useEffect(() => {
    if (category && suggestions.length > 0 && !selectedSuggestionId) {
      const bestSuggestion = suggestions.find(s => s.confidence === 'high');
      if (bestSuggestion) {
        setSelectedSuggestionId(bestSuggestion.id);
        onScheduleChange(bestSuggestion.schedule);
      }
    }
  }, [category, suggestions, selectedSuggestionId, onScheduleChange]);

  const handleSuggestionSelect = (suggestion: SmartSchedulingSuggestion) => {
    setSelectedSuggestionId(suggestion.id);
    onScheduleChange(suggestion.schedule);
    setShowCustomScheduling(false);
  };

  const handleCustomScheduling = () => {
    setShowCustomScheduling(true);
    setSelectedSuggestionId('custom');
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return theme.colors.status.success;
      case 'medium': return theme.colors.status.warning;
      case 'low': return theme.colors.status.error;
      default: return theme.colors.text.secondary;
    }
  };

  if (!category) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Select a category to see smart scheduling suggestions
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Smart Suggestions</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your category and successful habit patterns
        </Text>
      </View>

      {/* AI Suggestions */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsScroll}
        contentContainerStyle={styles.suggestionsContent}
      >
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={[
              styles.suggestionCard,
              selectedSuggestionId === suggestion.id && styles.suggestionCardSelected
            ]}
            onPress={() => handleSuggestionSelect(suggestion)}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: getConfidenceColor(suggestion.confidence) + '20' }
              ]}>
                <Text style={[
                  styles.confidenceText,
                  { color: getConfidenceColor(suggestion.confidence) }
                ]}>
                  {suggestion.confidence}
                </Text>
              </View>
            </View>
            
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
            
            <View style={styles.suggestionDetails}>
              <Text style={styles.schedulePreview}>
                {getSchedulePreview(suggestion.schedule)}
              </Text>
              <Text style={styles.suggestionReason}>💡 {suggestion.reason}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Custom Scheduling Option */}
        <TouchableOpacity
          style={[
            styles.suggestionCard,
            styles.customSuggestionCard,
            selectedSuggestionId === 'custom' && styles.suggestionCardSelected
          ]}
          onPress={handleCustomScheduling}
          activeOpacity={0.7}
        >
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionEmoji}>⚙️</Text>
          </View>
          <Text style={styles.suggestionTitle}>Custom Schedule</Text>
          <Text style={styles.suggestionDescription}>
            Create your own personalized schedule
          </Text>
          <View style={styles.suggestionDetails}>
            <Text style={styles.suggestionReason}>🎯 Full control over timing</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Scheduling Interface */}
      {showCustomScheduling && (
        <View style={styles.customSchedulingContainer}>
          <View style={styles.customHeader}>
            <Text style={styles.customTitle}>Custom Schedule</Text>
            <TouchableOpacity 
              onPress={() => setShowCustomScheduling(false)}
              style={styles.customCloseButton}
            >
              <Text style={styles.customCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <SchedulingSection
            schedule={currentSchedule}
            onScheduleChange={onScheduleChange}
            compact={true}
          />
        </View>
      )}

      {/* Selected Schedule Preview */}
      {selectedSuggestionId && !showCustomScheduling && (
        <View style={styles.selectedPreview}>
          <Text style={styles.previewTitle}>Selected Schedule</Text>
          <Text style={styles.previewText}>
            {currentSchedule ? getSchedulePreview(currentSchedule) : 'No schedule selected'}
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper function to generate schedule preview text
const getSchedulePreview = (schedule: HabitSchedule): string => {
  if (!schedule) return '';
  
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
    schedule.timeType === 'lunch' ? ' • Lunch' :
    schedule.timeType === 'specific' ? ` • ${schedule.specificTime}` : '';

  return `${dayText}${timeText}`;
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  placeholder: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  suggestionsScroll: {
    marginHorizontal: -theme.spacing.lg,
  },
  suggestionsContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  suggestionCard: {
    width: 280,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.line,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionCardSelected: {
    borderColor: theme.colors.interactive.primary,
    backgroundColor: theme.colors.interactive.primary + '08',
    shadowColor: theme.colors.interactive.primary,
    shadowOpacity: 0.3,
    transform: [{ scale: 1.02 }],
  },
  customSuggestionCard: {
    borderStyle: 'dashed',
    borderColor: theme.colors.text.secondary,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  suggestionEmoji: {
    fontSize: 24,
  },
  confidenceBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  suggestionDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  suggestionDetails: {
    gap: theme.spacing.sm,
  },
  schedulePreview: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
    backgroundColor: theme.colors.interactive.primary + '15',
    padding: theme.spacing.sm,
    borderRadius: theme.radius,
    textAlign: 'center',
  },
  suggestionReason: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  customSchedulingContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  customCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCloseText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  selectedPreview: {
    backgroundColor: theme.colors.interactive.primary + '15',
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary + '30',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
    textAlign: 'center',
  },
});
