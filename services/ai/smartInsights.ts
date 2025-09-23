/**
 * Enhanced Smart Insights for better AI suggestions
 */

import { habitAnalytics } from '@/services/analytics/HabitAnalyticsService';
import { streakPredictor } from '@/services/analytics/StreakPredictionEngine';

export interface EnhancedInsight {
  id: string;
  type: 'timing' | 'streak' | 'motivation' | 'pattern' | 'recommendation';
  icon: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable?: boolean;
  suggestedAction?: string;
  confidence: number; // 0-1 scale
}

export interface SmartInsights {
  primaryInsights: EnhancedInsight[];
  optimalTime?: string;
  streakRisk?: 'low' | 'medium' | 'high';
  personalizedTip?: string;
  motivationalMessage?: string;
}

interface HabitContext {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  difficulty: 'easy' | 'medium' | 'hard';
  time?: string;
}

interface UserContext {
  currentHour: number;
  dayOfWeek: string;
  completionRate: number;
  totalHabits: number;
  completedHabits: number;
}

export class SmartInsightsEngine {
  private static instance: SmartInsightsEngine;

  public static getInstance(): SmartInsightsEngine {
    if (!SmartInsightsEngine.instance) {
      SmartInsightsEngine.instance = new SmartInsightsEngine();
    }
    return SmartInsightsEngine.instance;
  }

  /**
   * Generate comprehensive smart insights for a habit and user context
   */
  async generateInsights(
    habit: HabitContext,
    userContext: UserContext,
    allHabits: HabitContext[] = []
  ): Promise<SmartInsights> {
    const insights: EnhancedInsight[] = [];

    try {
      // Gather analytics data
      const [timingPattern, streakForecast] = await Promise.all([
        habitAnalytics.analyzeHabitTiming(habit.id).catch(() => null),
        streakPredictor.generateStreakForecast(habit.id).catch(() => null),
      ]);

      // Generate timing insights
      const timingInsights = this.generateTimingInsights(
        habit,
        userContext,
        timingPattern
      );
      insights.push(...timingInsights);

      // Generate streak insights
      const streakInsights = this.generateStreakInsights(
        habit,
        userContext,
        streakForecast
      );
      insights.push(...streakInsights);

      // Generate motivational insights
      const motivationalInsights = this.generateMotivationalInsights(
        habit,
        userContext,
        allHabits
      );
      insights.push(...motivationalInsights);

      // Generate pattern insights
      const patternInsights = this.generatePatternInsights(
        habit,
        userContext,
        allHabits
      );
      insights.push(...patternInsights);

      // Generate recommendation insights
      const recommendationInsights = this.generateRecommendationInsights(
        habit,
        userContext,
        timingPattern,
        streakForecast
      );
      insights.push(...recommendationInsights);

      // Sort by priority and confidence
      const sortedInsights = insights
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidence - a.confidence;
        })
        .slice(0, 3); // Take top 3 insights

      return {
        primaryInsights: sortedInsights,
        optimalTime: this.formatOptimalTime(timingPattern),
        streakRisk: streakForecast?.riskProfile,
        personalizedTip: this.generatePersonalizedTip(habit, userContext, timingPattern, streakForecast),
        motivationalMessage: this.generateMotivationalMessage(habit, userContext),
      };

    } catch (error) {
      console.warn('Error generating smart insights:', error);

      // Return fallback insights
      return {
        primaryInsights: this.getFallbackInsights(habit, userContext),
        personalizedTip: this.getFallbackTip(habit, userContext),
        motivationalMessage: this.getFallbackMotivation(habit, userContext),
      };
    }
  }

  private generateTimingInsights(
    habit: HabitContext,
    userContext: UserContext,
    timingPattern: any
  ): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];

    if (timingPattern?.optimalHours?.length > 0) {
      const isOptimalTime = timingPattern.optimalHours.includes(userContext.currentHour);

      if (isOptimalTime && !habit.completed) {
        insights.push({
          id: `timing-optimal-${habit.id}`,
          type: 'timing',
          icon: '🕒',
          title: 'Perfect Timing!',
          message: `Now is your optimal time for ${habit.name.toLowerCase()}`,
          priority: 'high',
          actionable: true,
          suggestedAction: `Complete ${habit.name} now`,
          confidence: 0.9,
        });
      } else if (!isOptimalTime && !habit.completed) {
        const nextOptimalHour = timingPattern.optimalHours.find(
          (hour: number) => hour > userContext.currentHour
        ) || timingPattern.optimalHours[0];

        insights.push({
          id: `timing-upcoming-${habit.id}`,
          type: 'timing',
          icon: '⏰',
          title: 'Optimal Time Coming',
          message: `Your best time for ${habit.name.toLowerCase()} is at ${nextOptimalHour}:00`,
          priority: 'medium',
          actionable: false,
          confidence: 0.7,
        });
      }
    }

    return insights;
  }

  private generateStreakInsights(
    habit: HabitContext,
    userContext: UserContext,
    streakForecast: any
  ): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];

    if (streakForecast) {
      if (streakForecast.riskProfile === 'high') {
        insights.push({
          id: `streak-risk-${habit.id}`,
          type: 'streak',
          icon: '⚠️',
          title: 'Streak at Risk',
          message: `Your ${habit.streak}-day streak needs attention`,
          priority: 'high',
          actionable: true,
          suggestedAction: 'Break the habit into smaller steps',
          confidence: 0.8,
        });
      } else if (habit.streak >= 7 && habit.streak % 7 === 0) {
        insights.push({
          id: `streak-milestone-${habit.id}`,
          type: 'streak',
          icon: '🔥',
          title: 'Streak Milestone!',
          message: `Amazing! ${habit.streak} days strong with ${habit.name}`,
          priority: 'medium',
          actionable: false,
          confidence: 1.0,
        });
      }
    }

    return insights;
  }

  private generateMotivationalInsights(
    habit: HabitContext,
    userContext: UserContext,
    allHabits: HabitContext[]
  ): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];

    // Progress celebration
    if (userContext.completionRate >= 0.8) {
      insights.push({
        id: `motivation-progress-${Date.now()}`,
        type: 'motivation',
        icon: '🎉',
        title: 'Crushing It!',
        message: `${Math.round(userContext.completionRate * 100)}% complete - you're on fire!`,
        priority: 'medium',
        actionable: false,
        confidence: 1.0,
      });
    }

    // Encouragement for low completion
    else if (userContext.completionRate < 0.3 && userContext.currentHour < 20) {
      insights.push({
        id: `motivation-encouragement-${Date.now()}`,
        type: 'motivation',
        icon: '💪',
        title: 'You Got This!',
        message: 'Every small step counts. Start with just one habit.',
        priority: 'medium',
        actionable: true,
        suggestedAction: `Try ${habit.name} for just 5 minutes`,
        confidence: 0.7,
      });
    }

    return insights;
  }

  private generatePatternInsights(
    habit: HabitContext,
    userContext: UserContext,
    allHabits: HabitContext[]
  ): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];

    // Habit stacking opportunity
    const completedHabits = allHabits.filter(h => h.completed);
    if (completedHabits.length > 0 && !habit.completed) {
      const lastCompleted = completedHabits[completedHabits.length - 1];
      insights.push({
        id: `pattern-stack-${habit.id}`,
        type: 'pattern',
        icon: '🔗',
        title: 'Stack Your Habits',
        message: `Since you completed ${lastCompleted.name}, try ${habit.name} next`,
        priority: 'medium',
        actionable: true,
        suggestedAction: `Do ${habit.name} right after ${lastCompleted.name}`,
        confidence: 0.6,
      });
    }

    // Weekend vs weekday patterns
    const isWeekend = ['Saturday', 'Sunday'].includes(userContext.dayOfWeek);
    if (isWeekend && habit.difficulty === 'hard') {
      insights.push({
        id: `pattern-weekend-${habit.id}`,
        type: 'pattern',
        icon: '🏖️',
        title: 'Weekend Wisdom',
        message: 'Weekends are perfect for challenging habits - you have more time',
        priority: 'low',
        actionable: false,
        confidence: 0.5,
      });
    }

    return insights;
  }

  private generateRecommendationInsights(
    habit: HabitContext,
    userContext: UserContext,
    timingPattern: any,
    streakForecast: any
  ): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];

    // Difficulty adjustment recommendations
    if (streakForecast?.riskProfile === 'high' && habit.difficulty === 'hard') {
      insights.push({
        id: `rec-difficulty-${habit.id}`,
        type: 'recommendation',
        icon: '🎯',
        title: 'Make It Easier',
        message: 'Consider reducing the intensity to build consistency',
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Try a 10-minute version instead',
        confidence: 0.7,
      });
    }

    // Time adjustment recommendations
    if (timingPattern?.difficultDays?.includes(userContext.dayOfWeek)) {
      insights.push({
        id: `rec-timing-${habit.id}`,
        type: 'recommendation',
        icon: '📅',
        title: 'Tough Day Strategy',
        message: `${userContext.dayOfWeek}s are challenging - try morning completion`,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Set an earlier reminder',
        confidence: 0.6,
      });
    }

    return insights;
  }

  private formatOptimalTime(timingPattern: any): string | undefined {
    if (!timingPattern?.optimalHours?.length) return undefined;

    const hours = timingPattern.optimalHours;
    if (hours.length === 1) {
      return `${hours[0]}:00`;
    }

    const start = Math.min(...hours);
    const end = Math.max(...hours);
    return `${start}:00-${end}:00`;
  }

  private generatePersonalizedTip(
    habit: HabitContext,
    userContext: UserContext,
    timingPattern: any,
    streakForecast: any
  ): string | undefined {
    if (streakForecast?.riskProfile === 'high') {
      return 'Break this habit into 2-minute chunks to rebuild momentum';
    }

    if (timingPattern?.difficultDays?.length > 0) {
      const dayName = timingPattern.difficultDays[0];
      return `Plan ahead for ${dayName}s - they're your challenging day`;
    }

    if (userContext.completionRate < 0.5 && userContext.currentHour > 18) {
      return 'Try morning habits - evening completion rates are typically lower';
    }

    if (habit.streak >= 21) {
      return 'Consider adding a related habit to expand your routine';
    }

    return undefined;
  }

  private generateMotivationalMessage(
    habit: HabitContext,
    userContext: UserContext
  ): string | undefined {
    if (userContext.completionRate === 1.0) {
      return '🌟 Perfect day! You\'re building incredible momentum';
    }

    if (userContext.completionRate >= 0.8) {
      return '🚀 Outstanding progress! You\'re in the zone today';
    }

    if (userContext.completionRate >= 0.5) {
      return '💪 Great work! You\'re more than halfway there';
    }

    if (userContext.currentHour < 12) {
      return '🌅 Fresh start! Every great day begins with the first habit';
    }

    if (userContext.currentHour < 18) {
      return '⚡ Keep the momentum! You still have time to make progress';
    }

    return '🌙 Reflect on today and plan for tomorrow\'s success';
  }

  private getFallbackInsights(
    habit: HabitContext,
    userContext: UserContext
  ): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];

    if (!habit.completed && userContext.currentHour < 20) {
      insights.push({
        id: `fallback-${habit.id}`,
        type: 'motivation',
        icon: '💪',
        title: 'Ready to Begin?',
        message: `${habit.name} is waiting for you`,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Start now',
        confidence: 0.5,
      });
    }

    return insights;
  }

  private getFallbackTip(habit: HabitContext, userContext: UserContext): string {
    return 'Consistency beats perfection - focus on showing up daily';
  }

  private getFallbackMotivation(habit: HabitContext, userContext: UserContext): string {
    const hour = userContext.currentHour;
    if (hour < 12) return 'Start strong today!';
    if (hour < 18) return 'Keep going!';
    return 'Reflect and prepare for tomorrow';
  }
}

export const smartInsightsEngine = SmartInsightsEngine.getInstance();