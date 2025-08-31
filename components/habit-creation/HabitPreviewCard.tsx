import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { HabitSchedule } from '@/lib/db';
import { HabitCategory, HABIT_CATEGORIES } from './HabitCategorySelector';

interface HabitData {
  title: string;
  description: string;
  category: HabitCategory | null;
  schedule: HabitSchedule | null;
  goalId: string | null;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  timeRange?: { start: string; end: string };
}

interface SuccessMetrics {
  completionRate: number;
  streakPotential: number;
  difficultyScore: number;
  timingScore: number;
  overallScore: number;
}

interface HabitPreviewCardProps {
  habitData: HabitData;
  onEdit?: (section: 'basic' | 'schedule' | 'goal') => void;
  showMetrics?: boolean;
  compact?: boolean;
}

export function HabitPreviewCard({ 
  habitData, 
  onEdit, 
  showMetrics = true, 
  compact = false 
}: HabitPreviewCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme, compact);

  // Calculate success metrics based on habit data
  const successMetrics = useMemo((): SuccessMetrics => {
    let completionRate = 0.7; // Base rate
    let streakPotential = 0.6;
    let difficultyScore = 0.7;
    let timingScore = 0.8;

    // Category-based adjustments
    if (habitData.category) {
      const categoryData = HABIT_CATEGORIES.find(c => c.id === habitData.category);
      if (categoryData) {
        // Health and wellness habits have higher completion rates
        if (['health', 'wellness', 'mindfulness'].includes(habitData.category)) {
          completionRate += 0.1;
        }
        // Learning and productivity habits need better timing
        if (['learning', 'productivity'].includes(habitData.category)) {
          timingScore += 0.1;
        }
      }
    }

    // Schedule-based adjustments
    if (habitData.schedule) {
      // Daily habits have higher streak potential
      if (habitData.schedule.isDaily) {
        streakPotential += 0.2;
      }
      // Consistent timing improves completion
      if (habitData.schedule.timeType !== 'anytime') {
        completionRate += 0.1;
      }
      // Morning habits have higher success rates
      if (habitData.schedule.timeType === 'morning') {
        completionRate += 0.15;
        timingScore += 0.1;
      }
    }

    // Duration-based adjustments
    if (habitData.duration <= 15) {
      difficultyScore += 0.2; // Easier to maintain
      completionRate += 0.1;
    } else if (habitData.duration >= 60) {
      difficultyScore -= 0.2; // Harder to maintain
      completionRate -= 0.1;
    }

    // Difficulty-based adjustments
    switch (habitData.difficulty) {
      case 'easy':
        difficultyScore += 0.2;
        completionRate += 0.15;
        break;
      case 'hard':
        difficultyScore -= 0.1;
        completionRate -= 0.1;
        streakPotential -= 0.1;
        break;
    }

    // Ensure values are within bounds
    const clamp = (value: number) => Math.max(0.3, Math.min(1.0, value));
    
    const finalMetrics = {
      completionRate: clamp(completionRate),
      streakPotential: clamp(streakPotential),
      difficultyScore: clamp(difficultyScore),
      timingScore: clamp(timingScore),
      overallScore: 0
    };

    // Calculate overall score
    finalMetrics.overallScore = clamp(
      (finalMetrics.completionRate + finalMetrics.streakPotential + 
       finalMetrics.difficultyScore + finalMetrics.timingScore) / 4
    );

    return finalMetrics;
  }, [habitData]);

  const categoryData = habitData.category ? 
    HABIT_CATEGORIES.find(c => c.id === habitData.category) : null;

  const formatSchedule = (schedule: HabitSchedule): string => {
    if (!schedule) return 'No schedule set';
    
    const dayText = schedule.isDaily ? 'Every day' : 
      schedule.daysOfWeek.length === 5 && 
      !schedule.daysOfWeek.includes('sat') && !schedule.daysOfWeek.includes('sun') ? 'Weekdays' :
      schedule.daysOfWeek.length === 2 && 
      schedule.daysOfWeek.includes('sat') && schedule.daysOfWeek.includes('sun') ? 'Weekends' :
      `${schedule.daysOfWeek.length} days/week`;

    const timeText = schedule.timeType === 'anytime' ? '' :
      schedule.timeType === 'morning' ? ' in the morning' :
      schedule.timeType === 'afternoon' ? ' in the afternoon' :
      schedule.timeType === 'evening' ? ' in the evening' :
      schedule.timeType === 'lunch' ? ' at lunch' :
      schedule.timeType === 'specific' ? ` at ${schedule.specificTime}` : '';

    return `${dayText}${timeText}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return theme.colors.status.success;
    if (score >= 0.6) return theme.colors.status.warning;
    return theme.colors.status.error;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Challenging';
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return theme.colors.status.success;
      case 'medium': return theme.colors.status.warning;
      case 'hard': return theme.colors.status.error;
      default: return theme.colors.text.secondary;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Category */}
      <View style={styles.header}>
        <View style={styles.categorySection}>
          {categoryData && (
            <View 
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryData.gradient[0] + '20' }
              ]}
            >
              <Text style={styles.categoryEmoji}>{categoryData.emoji}</Text>
              <Text style={[
                styles.categoryText,
                { color: categoryData.gradient[0] }
              ]}>
                {categoryData.title}
              </Text>
            </View>
          )}
        </View>
        
        {onEdit && (
          <TouchableOpacity 
            onPress={() => onEdit('basic')}
            style={styles.editButton}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Habit Title & Description */}
      <View style={styles.habitDetails}>
        <Text style={styles.habitTitle}>{habitData.title || 'Untitled Habit'}</Text>
        {habitData.description && (
          <Text style={styles.habitDescription}>{habitData.description}</Text>
        )}
      </View>

      {/* Schedule Summary */}
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>📅 Schedule</Text>
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit('schedule')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.scheduleText}>
          {habitData.schedule ? formatSchedule(habitData.schedule) : 'Not scheduled'}
        </Text>
        
        {/* Duration & Difficulty */}
        <View style={styles.scheduleDetails}>
          <View style={styles.detailChip}>
            <Text style={styles.detailIcon}>⏱️</Text>
            <Text style={styles.detailText}>{habitData.duration} min</Text>
          </View>
          <View style={[
            styles.detailChip,
            { backgroundColor: getDifficultyColor(habitData.difficulty) + '20' }
          ]}>
            <Text style={styles.detailIcon}>
              {habitData.difficulty === 'easy' ? '🟢' : 
               habitData.difficulty === 'medium' ? '🟡' : '🔴'}
            </Text>
            <Text style={[
              styles.detailText,
              { color: getDifficultyColor(habitData.difficulty) }
            ]}>
              {habitData.difficulty}
            </Text>
          </View>
        </View>
      </View>

      {/* Success Metrics */}
      {showMetrics && (
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Success Prediction</Text>
          
          {/* Overall Score */}
          <View style={styles.overallScore}>
            <View style={styles.scoreCircle}>
              <Text style={[
                styles.scoreNumber,
                { color: getScoreColor(successMetrics.overallScore) }
              ]}>
                {Math.round(successMetrics.overallScore * 100)}
              </Text>
              <Text style={styles.scorePercent}>%</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={[
                styles.scoreLabel,
                { color: getScoreColor(successMetrics.overallScore) }
              ]}>
                {getScoreLabel(successMetrics.overallScore)}
              </Text>
              <Text style={styles.scoreDescription}>
                Likelihood of maintaining this habit for 30 days
              </Text>
            </View>
          </View>

          {/* Detailed Metrics */}
          <View style={styles.detailMetrics}>
            <MetricBar 
              label="Daily Completion" 
              value={successMetrics.completionRate} 
              icon="✅"
              theme={theme}
            />
            <MetricBar 
              label="Streak Potential" 
              value={successMetrics.streakPotential} 
              icon="🔥"
              theme={theme}
            />
            <MetricBar 
              label="Difficulty Level" 
              value={successMetrics.difficultyScore} 
              icon="💪"
              theme={theme}
            />
            <MetricBar 
              label="Timing Fit" 
              value={successMetrics.timingScore} 
              icon="⏰"
              theme={theme}
            />
          </View>
        </View>
      )}

      {/* Success Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Success Tips</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>
            • Start small - even 1 minute counts as a win
          </Text>
          <Text style={styles.tipItem}>
            • Stack with existing habits (habit stacking)
          </Text>
          <Text style={styles.tipItem}>
            • Track your progress to stay motivated
          </Text>
          {successMetrics.overallScore < 0.7 && (
            <Text style={[styles.tipItem, styles.warningTip]}>
              • Consider adjusting the schedule or reducing duration
            </Text>
          )}
        </View>
      </View>

      {/* Ready to Start CTA */}
      <View style={styles.ctaCard}>
        <Text style={styles.ctaEmoji}>🚀</Text>
        <Text style={styles.ctaTitle}>Ready to Begin!</Text>
        <Text style={styles.ctaDescription}>
          Your habit is set up for success. You&apos;ll get reminders and can track your progress daily.
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper component for metric bars
interface MetricBarProps {
  label: string;
  value: number;
  icon: string;
  theme: any;
}

function MetricBar({ label, value, icon, theme }: MetricBarProps) {
  const getBarColor = (val: number): string => {
    if (val >= 0.8) return theme.colors.status.success;
    if (val >= 0.6) return theme.colors.status.warning;
    return theme.colors.status.error;
  };

  return (
    <View style={[metricBarStyles(theme).container]}>
      <View style={metricBarStyles(theme).header}>
        <Text style={metricBarStyles(theme).icon}>{icon}</Text>
        <Text style={metricBarStyles(theme).label}>{label}</Text>
        <Text style={metricBarStyles(theme).value}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={metricBarStyles(theme).barTrack}>
        <View 
          style={[
            metricBarStyles(theme).barFill,
            { 
              width: `${value * 100}%`,
              backgroundColor: getBarColor(value)
            }
          ]} 
        />
      </View>
    </View>
  );
}

const metricBarStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  icon: {
    fontSize: 14,
    marginRight: theme.spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  barTrack: {
    height: 4,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});

const createStyles = (theme: any, compact: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  categorySection: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius,
    alignSelf: 'flex-start',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  editText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.interactive.primary,
  },
  editLink: {
    fontSize: 14,
    color: theme.colors.interactive.primary,
    fontWeight: '500',
  },
  habitDetails: {
    marginBottom: theme.spacing.lg,
  },
  habitTitle: {
    fontSize: compact ? 20 : 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: compact ? 24 : 30,
  },
  habitDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  scheduleCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  scheduleText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  scheduleDetails: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  metricsCard: {
    backgroundColor: theme.colors.interactive.primary + '08',
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary + '30',
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  overallScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.interactive.primary,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  scorePercent: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: -4,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  scoreDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  detailMetrics: {
    gap: theme.spacing.sm,
  },
  tipsCard: {
    backgroundColor: theme.colors.status.warning + '15',
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.status.warning + '30',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  tipsList: {
    gap: theme.spacing.sm,
  },
  tipItem: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  warningTip: {
    color: theme.colors.status.warning,
    fontWeight: '500',
  },
  ctaCard: {
    backgroundColor: theme.colors.status.success + '15',
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.status.success + '30',
  },
  ctaEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.md,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  ctaDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});