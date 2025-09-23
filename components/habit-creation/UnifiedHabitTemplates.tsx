import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { HabitSchedule } from '@/lib/db';

export type HabitCategory = 'health' | 'learning' | 'career' | 'personal' | 'finance' | 'relationships' | 'creative';

export interface HabitTemplate {
  id: string;
  title: string;
  category: HabitCategory;
  description?: string;
  suggestedSchedule: HabitSchedule;
  difficulty: 'easy' | 'medium' | 'hard';
  duration?: number; // minutes
  tags: string[];
  popularityScore: number; // 0-100 for sorting
}

// Unified habit templates with enhanced metadata
export const UNIFIED_HABIT_TEMPLATES: HabitTemplate[] = [
  // Health & Fitness
  {
    id: 'morning-workout',
    title: 'Morning workout',
    category: 'health',
    description: 'Start your day with energizing exercise',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'morning',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 30,
    tags: ['exercise', 'energy', 'morning'],
    popularityScore: 95
  },
  {
    id: 'drink-water',
    title: 'Drink 8 glasses of water',
    category: 'health',
    description: 'Stay hydrated throughout the day',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'anytime',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 0,
    tags: ['hydration', 'health', 'daily'],
    popularityScore: 90
  },
  {
    id: 'sleep-schedule',
    title: 'Get 8 hours of sleep',
    category: 'health',
    description: 'Maintain consistent sleep schedule',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 480, // 8 hours in minutes
    tags: ['sleep', 'recovery', 'health'],
    popularityScore: 88
  },
  {
    id: 'daily-walk',
    title: 'Take a 20-minute walk',
    category: 'health',
    description: 'Get fresh air and light exercise',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'anytime',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 20,
    tags: ['walking', 'exercise', 'outdoors'],
    popularityScore: 85
  },
  {
    id: 'meditation',
    title: 'Meditate for 10 minutes',
    category: 'health',
    description: 'Practice mindfulness and reduce stress',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'morning',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 10,
    tags: ['mindfulness', 'stress', 'mental-health'],
    popularityScore: 83
  },

  // Learning & Skills
  {
    id: 'read-daily',
    title: 'Read for 30 minutes',
    category: 'learning',
    description: 'Expand knowledge and vocabulary',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 30,
    tags: ['reading', 'knowledge', 'growth'],
    popularityScore: 92
  },
  {
    id: 'practice-skill',
    title: 'Practice new skill daily',
    category: 'learning',
    description: 'Dedicate time to skill development',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'afternoon',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 45,
    tags: ['skill-building', 'practice', 'improvement'],
    popularityScore: 87
  },
  {
    id: 'online-course',
    title: 'Complete online course module',
    category: 'learning',
    description: 'Work through structured learning material',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 60,
    tags: ['education', 'structured-learning', 'courses'],
    popularityScore: 82
  },
  {
    id: 'learning-journal',
    title: 'Write in learning journal',
    category: 'learning',
    description: 'Reflect on what you learned today',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 15,
    tags: ['reflection', 'writing', 'learning'],
    popularityScore: 78
  },
  {
    id: 'language-practice',
    title: 'Practice language for 20 minutes',
    category: 'learning',
    description: 'Improve language skills with daily practice',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'morning',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 20,
    tags: ['language', 'communication', 'culture'],
    popularityScore: 80
  },

  // Career & Work
  {
    id: 'networking',
    title: 'Network with one person',
    category: 'career',
    description: 'Build professional relationships',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'afternoon',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 15,
    tags: ['networking', 'relationships', 'professional'],
    popularityScore: 85
  },
  {
    id: 'skill-development',
    title: 'Learn new work skill',
    category: 'career',
    description: 'Enhance professional capabilities',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 30,
    tags: ['professional-development', 'skills', 'career'],
    popularityScore: 88
  },
  {
    id: 'daily-priorities',
    title: 'Set daily priorities',
    category: 'career',
    description: 'Plan and organize your workday',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'morning',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 10,
    tags: ['planning', 'productivity', 'organization'],
    popularityScore: 90
  },
  {
    id: 'weekly-review',
    title: 'Review goals weekly',
    category: 'career',
    description: 'Assess progress and adjust plans',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['fri'],
      timeType: 'afternoon',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 20,
    tags: ['review', 'goals', 'reflection'],
    popularityScore: 75
  },
  {
    id: 'industry-reading',
    title: 'Read industry content',
    category: 'career',
    description: 'Stay updated with industry trends',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'morning',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 20,
    tags: ['industry', 'trends', 'knowledge'],
    popularityScore: 72
  },

  // Personal Growth
  {
    id: 'morning-routine',
    title: 'Complete morning routine',
    category: 'personal',
    description: 'Start day with consistent habits',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'morning',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 45,
    tags: ['routine', 'consistency', 'morning'],
    popularityScore: 89
  },
  {
    id: 'gratitude-practice',
    title: 'Practice gratitude',
    category: 'personal',
    description: 'Write down three things you\'re grateful for',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 5,
    tags: ['gratitude', 'positivity', 'mindset'],
    popularityScore: 85
  },
  {
    id: 'evening-reflection',
    title: 'Evening reflection',
    category: 'personal',
    description: 'Reflect on the day and plan tomorrow',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 10,
    tags: ['reflection', 'planning', 'growth'],
    popularityScore: 82
  },
  {
    id: 'digital-detox',
    title: 'Digital detox hour',
    category: 'personal',
    description: 'Disconnect from screens and technology',
    suggestedSchedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 60,
    tags: ['digital-detox', 'mindfulness', 'balance'],
    popularityScore: 77
  },
  {
    id: 'weekly-planning',
    title: 'Weekly planning session',
    category: 'personal',
    description: 'Plan upcoming week and set intentions',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['sun'],
      timeType: 'afternoon',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 30,
    tags: ['planning', 'organization', 'intention'],
    popularityScore: 73
  },

  // Creative
  {
    id: 'creative-writing',
    title: 'Write creatively for 20 minutes',
    category: 'creative',
    description: 'Express yourself through writing',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'evening',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'medium',
    duration: 20,
    tags: ['writing', 'creativity', 'expression'],
    popularityScore: 70
  },
  {
    id: 'draw-sketch',
    title: 'Draw or sketch for 15 minutes',
    category: 'creative',
    description: 'Practice visual art and creativity',
    suggestedSchedule: {
      isDaily: false,
      daysOfWeek: ['tue', 'thu', 'sat'],
      timeType: 'afternoon',
      specificTime: undefined,
      reminder: false
    },
    difficulty: 'easy',
    duration: 15,
    tags: ['drawing', 'art', 'visual'],
    popularityScore: 65
  }
];

// Helper functions for template management
export class HabitTemplateManager {
  static getByCategory(category: HabitCategory, limit?: number): HabitTemplate[] {
    const templates = UNIFIED_HABIT_TEMPLATES
      .filter(template => template.category === category)
      .sort((a, b) => b.popularityScore - a.popularityScore);

    return limit ? templates.slice(0, limit) : templates;
  }

  static getPopular(limit: number = 10): HabitTemplate[] {
    return UNIFIED_HABIT_TEMPLATES
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  }

  static getByDifficulty(difficulty: 'easy' | 'medium' | 'hard', limit?: number): HabitTemplate[] {
    const templates = UNIFIED_HABIT_TEMPLATES
      .filter(template => template.difficulty === difficulty)
      .sort((a, b) => b.popularityScore - a.popularityScore);

    return limit ? templates.slice(0, limit) : templates;
  }

  static searchTemplates(query: string): HabitTemplate[] {
    const searchTerm = query.toLowerCase();
    return UNIFIED_HABIT_TEMPLATES.filter(template =>
      template.title.toLowerCase().includes(searchTerm) ||
      template.description?.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  static getSmartSuggestions(
    goalCategory?: HabitCategory,
    difficulty?: 'easy' | 'medium' | 'hard',
    limit: number = 4
  ): HabitTemplate[] {
    let templates = UNIFIED_HABIT_TEMPLATES;

    // Filter by goal category if provided
    if (goalCategory) {
      templates = templates.filter(t => t.category === goalCategory);
    }

    // Filter by difficulty if provided
    if (difficulty) {
      templates = templates.filter(t => t.difficulty === difficulty);
    }

    // Sort by popularity and return limited results
    return templates
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  }
}

// Category display configuration
export const HABIT_CATEGORIES: Record<HabitCategory, {
  title: string;
  emoji: string;
  description: string;
  color: string;
}> = {
  health: {
    title: 'Health & Fitness',
    emoji: '💪',
    description: 'Physical and mental wellness',
    color: '#22c55e'
  },
  learning: {
    title: 'Learning & Skills',
    emoji: '🎓',
    description: 'Knowledge and skill development',
    color: '#3b82f6'
  },
  career: {
    title: 'Career & Work',
    emoji: '💼',
    description: 'Professional growth and success',
    color: '#8b5cf6'
  },
  personal: {
    title: 'Personal Growth',
    emoji: '🌱',
    description: 'Self-improvement and habits',
    color: '#f59e0b'
  },
  finance: {
    title: 'Financial',
    emoji: '💰',
    description: 'Money management and wealth building',
    color: '#10b981'
  },
  relationships: {
    title: 'Relationships',
    emoji: '❤️',
    description: 'Family, friends, and connections',
    color: '#ef4444'
  },
  creative: {
    title: 'Creative & Arts',
    emoji: '🎨',
    description: 'Artistic expression and creativity',
    color: '#ec4899'
  }
};

// React component for rendering template chips
interface HabitTemplateChipsProps {
  templates: HabitTemplate[];
  selectedTemplates: string[];
  onToggleTemplate: (template: HabitTemplate) => void;
  style?: any;
}

export function HabitTemplateChips({
  templates,
  selectedTemplates,
  onToggleTemplate,
  style
}: HabitTemplateChipsProps) {
  const { theme } = useTheme();
  const styles = createChipStyles(theme);

  // Filter out invalid templates and add safety checks
  const validTemplates = templates.filter(template =>
    template &&
    template.id &&
    template.title &&
    template.category
  );

  return (
    <View style={[styles.container, style]}>
      {validTemplates.map((template) => {
        try {
          const isSelected = selectedTemplates.includes(template.id);
          const categoryConfig = HABIT_CATEGORIES[template.category] || HABIT_CATEGORIES.personal;

          return (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                { borderColor: (categoryConfig?.color || '#6b7280') + '40' }
              ]}
              onPress={() => onToggleTemplate(template)}
            >
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected
              ]}>
                {isSelected ? '✅' : '+'} {template.title || 'Untitled'}
              </Text>
              {template.duration && typeof template.duration === 'number' && template.duration > 0 && (
                <Text style={[
                  styles.chipDuration,
                  isSelected && styles.chipDurationSelected
                ]}>
                  {template.duration}min
                </Text>
              )}
            </TouchableOpacity>
          );
        } catch (error) {
          console.warn('Error rendering habit template chip:', template.id, error);
          return null;
        }
      })}
    </View>
  );
}

const createChipStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginVertical: -4
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    marginHorizontal: 4,
    marginVertical: 4
  },
  chipSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.6)'
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4
  },
  chipTextSelected: {
    color: '#FFFFFF'
  },
  chipDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '500'
  },
  chipDurationSelected: {
    color: 'rgba(255,255,255,0.9)'
  }
});