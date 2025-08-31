import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type HabitCategory = 
  | 'health' | 'learning' | 'career' | 'personal' | 'finance' | 'relationships'
  | 'wellness' | 'creativity' | 'productivity' | 'mindfulness' | 'social' | 'adventure';

export interface HabitCategoryDefinition {
  id: HabitCategory;
  title: string;
  emoji: string;
  gradient: string[];
  description: string;
  suggestedTimes: string[];
  popularHabits: string[];
}

export const HABIT_CATEGORIES: HabitCategoryDefinition[] = [
  {
    id: 'health',
    title: 'Health & Fitness',
    emoji: '💪',
    gradient: ['#FF6B6B', '#FF8E53'],
    description: 'Physical wellness and fitness goals',
    suggestedTimes: ['06:00', '07:00', '18:00', '19:00'],
    popularHabits: ['Morning workout', 'Drink water', '10,000 steps', 'Healthy breakfast', 'Evening stretch']
  },
  {
    id: 'wellness',
    title: 'Mental Wellness',
    emoji: '🧘‍♀️',
    gradient: ['#4ECDC4', '#44A08D'],
    description: 'Mental health and emotional wellbeing',
    suggestedTimes: ['07:00', '12:00', '21:00', '22:00'],
    popularHabits: ['Meditate 10 mins', 'Deep breathing', 'Gratitude journal', 'Sleep 8 hours', 'Digital detox']
  },
  {
    id: 'learning',
    title: 'Learning & Growth',
    emoji: '📚',
    gradient: ['#667eea', '#764ba2'],
    description: 'Knowledge and skill development',
    suggestedTimes: ['09:00', '19:00', '20:00', '21:00'],
    popularHabits: ['Read 30 minutes', 'Learn new skill', 'Watch educational video', 'Practice language', 'Take notes']
  },
  {
    id: 'creativity',
    title: 'Creativity & Arts',
    emoji: '🎨',
    gradient: ['#f093fb', '#f5576c'],
    description: 'Creative expression and artistic pursuits',
    suggestedTimes: ['10:00', '14:00', '16:00', '20:00'],
    popularHabits: ['Draw daily', 'Write creatively', 'Play instrument', 'Photography walk', 'Creative project']
  },
  {
    id: 'productivity',
    title: 'Productivity',
    emoji: '⚡',
    gradient: ['#4facfe', '#00f2fe'],
    description: 'Focus, efficiency, and getting things done',
    suggestedTimes: ['08:00', '09:00', '14:00', '15:00'],
    popularHabits: ['Plan daily tasks', 'Time blocking', 'Single-tasking', 'Review progress', 'Organize workspace']
  },
  {
    id: 'career',
    title: 'Career & Work',
    emoji: '💼',
    gradient: ['#fa709a', '#fee140'],
    description: 'Professional growth and success',
    suggestedTimes: ['08:00', '17:00', '18:00', '19:00'],
    popularHabits: ['Network daily', 'Skill practice', 'Industry reading', 'LinkedIn post', 'Career planning']
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    emoji: '🕯️',
    gradient: ['#a8edea', '#fed6e3'],
    description: 'Present moment awareness and reflection',
    suggestedTimes: ['06:00', '12:00', '18:00', '22:00'],
    popularHabits: ['Morning mindfulness', 'Mindful eating', 'Body scan', 'Mindful walking', 'Evening reflection']
  },
  {
    id: 'social',
    title: 'Social & Relationships',
    emoji: '❤️',
    gradient: ['#ffecd2', '#fcb69f'],
    description: 'Connection with family, friends, and community',
    suggestedTimes: ['12:00', '17:00', '19:00', '20:00'],
    popularHabits: ['Call family', 'Text friend', 'Quality time', 'Active listening', 'Express gratitude']
  },
  {
    id: 'personal',
    title: 'Personal Care',
    emoji: '🌸',
    gradient: ['#fad0c4', '#ffd1ff'],
    description: 'Self-care and personal maintenance',
    suggestedTimes: ['07:00', '12:00', '20:00', '21:00'],
    popularHabits: ['Skincare routine', 'Tidy space', 'Self-reflection', 'Personal hygiene', 'Me time']
  },
  {
    id: 'adventure',
    title: 'Adventure & Fun',
    emoji: '🌟',
    gradient: ['#ff9a9e', '#fecfef'],
    description: 'Exploration, fun, and new experiences',
    suggestedTimes: ['10:00', '15:00', '16:00', '18:00'],
    popularHabits: ['Try something new', 'Explore neighborhood', 'Adventure planning', 'Fun activity', 'Photo journey']
  },
  {
    id: 'finance',
    title: 'Financial Health',
    emoji: '💰',
    gradient: ['#84fab0', '#8fd3f4'],
    description: 'Money management and financial planning',
    suggestedTimes: ['09:00', '17:00', '20:00', '21:00'],
    popularHabits: ['Track expenses', 'Budget review', 'Save money', 'Investment research', 'Financial learning']
  }
];

interface HabitCategorySelectorProps {
  selectedCategory: HabitCategory | null;
  onCategorySelect: (category: HabitCategory) => void;
  compact?: boolean;
}

export function HabitCategorySelector({ 
  selectedCategory, 
  onCategorySelect, 
  compact = false 
}: HabitCategorySelectorProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme, compact);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Choose a Category</Text>
      <Text style={styles.sectionSubtitle}>
        This helps us suggest the best times and related habits
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {HABIT_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected
              ]}
              onPress={() => onCategorySelect(category.id)}
              activeOpacity={0.7}
            >
              {/* Gradient Background Overlay */}
              <View 
                style={[
                  styles.gradientOverlay,
                  { 
                    backgroundColor: isSelected 
                      ? category.gradient[0] + '20' 
                      : 'transparent' 
                  }
                ]}
              />
              
              {/* Category Content */}
              <View style={styles.categoryContent}>
                <Text style={[styles.categoryEmoji, isSelected && styles.categoryEmojiSelected]}>
                  {category.emoji}
                </Text>
                <Text style={[styles.categoryTitle, isSelected && styles.categoryTitleSelected]}>
                  {category.title}
                </Text>
                <Text style={[styles.categoryDescription, isSelected && styles.categoryDescriptionSelected]}>
                  {category.description}
                </Text>
              </View>
              
              {/* Selection Indicator */}
              {isSelected && (
                <View style={[styles.selectionIndicator, { backgroundColor: category.gradient[0] }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Selected Category Details */}
      {selectedCategory && (
        <View style={styles.selectedCategoryDetails}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsEmoji}>
              {HABIT_CATEGORIES.find(c => c.id === selectedCategory)?.emoji}
            </Text>
            <Text style={styles.detailsTitle}>Popular Habits</Text>
          </View>
          <View style={styles.popularHabits}>
            {HABIT_CATEGORIES.find(c => c.id === selectedCategory)?.popularHabits.slice(0, 3).map((habit, index) => (
              <View key={index} style={styles.popularHabitChip}>
                <Text style={styles.popularHabitText}>{habit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any, compact: boolean) => StyleSheet.create({
  container: {
    marginBottom: compact ? theme.spacing.lg : theme.spacing.xl,
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
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  scrollView: {
    marginHorizontal: -theme.spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  categoryCard: {
    width: compact ? 140 : 160,
    height: compact ? 120 : 140,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.line,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSelected: {
    borderColor: theme.colors.interactive.primary,
    shadowColor: theme.colors.interactive.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.radius * 1.5,
  },
  categoryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  categoryEmoji: {
    fontSize: compact ? 24 : 32,
    marginBottom: theme.spacing.sm,
  },
  categoryEmojiSelected: {
    transform: [{ scale: 1.1 }],
  },
  categoryTitle: {
    fontSize: compact ? 13 : 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    lineHeight: 16,
  },
  categoryTitleSelected: {
    color: theme.colors.interactive.primary,
  },
  categoryDescription: {
    fontSize: compact ? 10 : 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryDescriptionSelected: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  selectionIndicator: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 2,
  },
  selectedCategoryDetails: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailsEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  popularHabits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  popularHabitChip: {
    backgroundColor: theme.colors.interactive.primary + '15',
    borderRadius: theme.radius,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary + '30',
  },
  popularHabitText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.interactive.primary,
  },
});