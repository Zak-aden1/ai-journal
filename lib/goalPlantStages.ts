import { getVitalityLevel } from '@/components/avatars/types';

export type GoalPlantStage = 
  | 'sprout'      // Stage 1: New goals, early momentum
  | 'growing'     // Stage 2: Consistent progress, steady habits
  | 'thriving'    // Stage 3: Strong progress, good habit completion
  | 'struggling'; // Stage 4: Needs attention, low completion rates

export interface GoalProgress {
  habitCompletionRate: number; // 0-100% completion rate over last 7 days
  currentStreak: number; // Current consecutive completion streak
  totalHabits: number; // Total number of habits for this goal
  completedTodayCount: number; // Habits completed today
  daysActive: number; // Days since goal was created
  recentActivity: number; // Activity score over last 7 days (0-100)
}

export interface PlantStageConfig {
  stage: GoalPlantStage;
  plant: any; // Plant image require
  pot: any; // Pot image require
  backgroundColor: string;
  borderColor: string;
  description: string;
  encouragementMessage: string;
  actionSuggestion: string;
}

/**
 * Determines the plant stage for a goal based on its progress metrics
 */
export function determineGoalPlantStage(progress: GoalProgress): GoalPlantStage {
  const { 
    habitCompletionRate, 
    currentStreak, 
    totalHabits, 
    completedTodayCount,
    daysActive,
    recentActivity 
  } = progress;

  // New goal (less than 7 days old)
  if (daysActive < 7) {
    if (completedTodayCount > 0 || currentStreak >= 3) {
      return 'sprout'; // Good early start
    }
    return 'struggling'; // Not engaging with new goal
  }

  // Established goals (7+ days)
  if (habitCompletionRate >= 70 && currentStreak >= 5 && recentActivity >= 75) {
    return 'thriving'; // Excellent performance
  }

  if (habitCompletionRate >= 50 && currentStreak >= 2 && recentActivity >= 50) {
    return 'growing'; // Good steady progress
  }

  if (habitCompletionRate >= 25 && (currentStreak >= 1 || completedTodayCount > 0)) {
    return 'sprout'; // Some progress but needs nurturing
  }

  // Low engagement, needs attention
  return 'struggling';
}

/**
 * Get configuration for each plant stage
 */
export function getPlantStageConfig(stage: GoalPlantStage): PlantStageConfig {
  const configs: Record<GoalPlantStage, PlantStageConfig> = {
    sprout: {
      stage: 'sprout',
      plant: require('@/assets/images/avatars/plants/plant-sprout.png'),
      pot: require('@/assets/images/avatars/plants/plant-pot.png'),
      backgroundColor: '#065f46', // Dark green
      borderColor: '#10b981', // Green
      description: 'Growing with promise',
      encouragementMessage: "Great start! Your goal is taking root beautifully.",
      actionSuggestion: "Keep up the momentum with consistent daily habits.",
    },
    growing: {
      stage: 'growing',
      plant: require('@/assets/images/avatars/plants/plant-growing.png'),
      pot: require('@/assets/images/avatars/plants/plant-pot.png'),
      backgroundColor: '#14532d', // Rich green
      borderColor: '#16a34a', // Strong green
      description: 'Steadily flourishing',
      encouragementMessage: "Excellent progress! You're building strong foundations.",
      actionSuggestion: "Your consistency is paying off. Maintain this rhythm.",
    },
    thriving: {
      stage: 'thriving',
      plant: require('@/assets/images/avatars/plants/plant-thriving.png'),
      pot: require('@/assets/images/avatars/plants/plant-pot.png'),
      backgroundColor: '#4c1d95', // Purple (premium feel)
      borderColor: '#7c3aed', // Bright purple
      description: 'Blooming magnificently',
      encouragementMessage: "Outstanding! You're achieving remarkable success.",
      actionSuggestion: "You're in the flow! Consider expanding or deepening your goals.",
    },
    struggling: {
      stage: 'struggling',
      plant: require('@/assets/images/avatars/plants/plant-struggling.png'),
      pot: require('@/assets/images/avatars/plants/plant-pot.png'),
      backgroundColor: '#450a0a', // Dark red
      borderColor: '#dc2626', // Red
      description: 'Needs your care',
      encouragementMessage: "Every goal needs nurturing. You've got this!",
      actionSuggestion: "Try focusing on one small habit today to restart your momentum.",
    },
  };

  return configs[stage];
}

/**
 * Calculate goal progress metrics from goal data
 */
export async function calculateGoalProgress(
  goalId: string,
  goalHabits: Array<{ id: string; title: string }>,
  getHabitStreak: (habitId: string) => Promise<{ current: number; longest: number }>,
  isHabitCompletedOnDate: (habitId: string, date?: Date) => Promise<boolean>,
  goalCreatedAt?: Date
): Promise<GoalProgress> {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  let totalCompletions = 0;
  let maxStreak = 0;
  let completedTodayCount = 0;
  let recentActivityCount = 0;

  // Calculate metrics for each habit
  for (const habit of goalHabits) {
    try {
      // Get streak data
      const streak = await getHabitStreak(habit.id);
      maxStreak = Math.max(maxStreak, streak.current);

      // Check today's completion
      const completedToday = await isHabitCompletedOnDate(habit.id, today);
      if (completedToday) {
        completedTodayCount++;
      }

      // Calculate recent activity (last 7 days)
      let recentCompletions = 0;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        const completed = await isHabitCompletedOnDate(habit.id, checkDate);
        if (completed) {
          recentCompletions++;
        }
      }
      
      totalCompletions += recentCompletions;
      if (recentCompletions > 0) {
        recentActivityCount++;
      }
    } catch (error) {
      console.warn(`Error calculating progress for habit ${habit.id}:`, error);
    }
  }

  // Calculate percentages
  const maxPossibleCompletions = goalHabits.length * 7; // 7 days * habits
  const habitCompletionRate = maxPossibleCompletions > 0 
    ? Math.round((totalCompletions / maxPossibleCompletions) * 100)
    : 0;

  const recentActivity = goalHabits.length > 0 
    ? Math.round((recentActivityCount / goalHabits.length) * 100)
    : 0;

  // Calculate days since goal creation
  const daysActive = goalCreatedAt 
    ? Math.max(1, Math.floor((today.getTime() - goalCreatedAt.getTime()) / (1000 * 60 * 60 * 24)))
    : 30; // Default to 30 days if no creation date

  return {
    habitCompletionRate,
    currentStreak: maxStreak,
    totalHabits: goalHabits.length,
    completedTodayCount,
    daysActive,
    recentActivity,
  };
}

/**
 * Get personalized message based on plant stage and progress
 */
export function getPersonalizedMessage(
  stage: GoalPlantStage, 
  progress: GoalProgress,
  goalTitle: string
): string {
  const config = getPlantStageConfig(stage);
  const { completedTodayCount, totalHabits, currentStreak } = progress;

  switch (stage) {
    case 'sprout':
      if (currentStreak >= 5) {
        return `${goalTitle} is gaining momentum! ${currentStreak} days strong.`;
      }
      return `${goalTitle} is taking root. Keep nurturing it daily!`;

    case 'growing':
      if (completedTodayCount === totalHabits) {
        return `Perfect day for ${goalTitle}! All habits completed.`;
      }
      return `${goalTitle} is developing beautifully. Stay consistent!`;

    case 'thriving':
      return `${goalTitle} is in full bloom! You're achieving excellence.`;

    case 'struggling':
      if (completedTodayCount > 0) {
        return `Great restart with ${goalTitle}! Every step counts.`;
      }
      return `${goalTitle} needs your attention. Small steps can revive it.`;

    default:
      return config.encouragementMessage;
  }
}

/**
 * Get animation configuration based on plant stage
 */
export function getStageAnimationConfig(stage: GoalPlantStage) {
  const configs = {
    sprout: {
      swayIntensity: 1,
      growthScale: 0.9,
      bounceOnInteraction: true,
      pulseSpeed: 1500,
      particles: ['💧', '🌿'],
    },
    growing: {
      swayIntensity: 1.5,
      growthScale: 1.0,
      bounceOnInteraction: true,
      pulseSpeed: 1200,
      particles: ['🌿', '💚', '✨'],
    },
    thriving: {
      swayIntensity: 2,
      growthScale: 1.1,
      bounceOnInteraction: true,
      pulseSpeed: 800,
      particles: ['🌺', '✨', '🌟', '🎉'],
    },
    struggling: {
      swayIntensity: 0.5,
      growthScale: 0.8,
      bounceOnInteraction: false,
      pulseSpeed: 2000,
      particles: ['💧', '😢'],
    },
  };

  return configs[stage];
}