import { habitAnalytics, type HabitTimingPattern } from './HabitAnalyticsService';
import { streakPredictor, type StreakForecast } from './StreakPredictionEngine';
import { enhancedAvatarPersonality } from '@/lib/enhancedAvatarPersonality';
import { generatePersonalizedResponse, updateAvatarMemory, smartMemoryUpdate } from '@/lib/avatarPersonality';
import type { AvatarType, AvatarMemory } from '@/components/avatars/types';
import type { HabitWithId, Entry, Mood } from '@/stores/app';

/**
 * Integration Service that connects Analytics with Chat and Avatar Systems
 * Provides seamless integration between pattern recognition and AI responses
 */

export interface IntegratedInsightContext {
  habitId: string;
  habitTitle: string;
  userContext: {
    currentMood?: Mood;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    recentEntries: Entry[];
    vitality: number;
  };
  analyticsSnapshot: {
    timingPattern: HabitTimingPattern;
    streakForecast: StreakForecast;
    isOptimalTime: boolean;
    isRiskPeriod: boolean;
  };
}

export interface SmartChatResponse {
  message: string;
  emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise' | 'concerned';
  vitalityImpact: number;
  analyticsInsights: string[];
  actionableRecommendations: string[];
  memoryUpdates: {
    milestone?: string;
    pattern?: { type: 'bestTime' | 'struggleDay' | 'favoriteGoal'; value: string };
    emotion?: { mood: string; context: string };
  };
  nextOptimalEngagement?: Date;
}

export interface ContextualNotification {
  id: string;
  type: 'timing-optimal' | 'streak-risk' | 'pattern-insight' | 'encouragement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  avatarMessage: string;
  action?: {
    type: 'habit-suggestion' | 'difficulty-adjustment' | 'timing-shift';
    data: any;
  };
  scheduledFor: Date;
  expiresAt: Date;
}

export class AnalyticsIntegrationService {
  
  /**
   * Generate analytics-enhanced chat response
   */
  async generateSmartChatResponse(
    userMessage: string,
    avatarType: AvatarType,
    avatarMemory: AvatarMemory,
    context: IntegratedInsightContext
  ): Promise<SmartChatResponse> {
    
    // Get enhanced avatar response
    const enhancedResponse = await enhancedAvatarPersonality.generateEnhancedResponse(
      avatarType,
      {
        currentVitality: context.userContext.vitality,
        recentEntries: context.userContext.recentEntries,
        goals: [context.habitTitle], // Simplified for this context
        timeOfDay: context.userContext.timeOfDay,
        mode: 'Coach',
        progress: {
          habitsCompleted: 1, // Would be calculated from actual data
          goalsInProgress: 1
        }
      },
      context.habitId,
      userMessage
    );

    // Generate analytics insights
    const analyticsInsights = this.generateAnalyticsInsights(context);
    
    // Generate actionable recommendations
    const recommendations = this.generateActionableRecommendations(context);
    
    // Determine memory updates based on interaction
    const memoryUpdates = this.generateMemoryUpdates(context, userMessage);
    
    // Predict next optimal engagement time
    const nextOptimalEngagement = await this.predictNextOptimalEngagement(context);
    
    return {
      message: enhancedResponse.combinedMessage,
      emotion: enhancedResponse.emotion,
      vitalityImpact: enhancedResponse.vitalityImpact,
      analyticsInsights,
      actionableRecommendations: recommendations,
      memoryUpdates,
      nextOptimalEngagement
    };
  }

  /**
   * Generate contextual notifications based on analytics
   */
  async generateContextualNotifications(
    habitIds: string[],
    avatarType: AvatarType,
    avatarMemory: AvatarMemory
  ): Promise<ContextualNotification[]> {
    
    const notifications: ContextualNotification[] = [];
    const now = new Date();
    
    for (const habitId of habitIds) {
      try {
        // Get analytics for habit
        const [timingPattern, streakForecast] = await Promise.all([
          habitAnalytics.analyzeHabitTiming(habitId),
          streakPredictor.generateStreakForecast(habitId)
        ]);
        
        // Check for optimal timing notifications
        const currentHour = now.getHours();
        if (timingPattern.optimalHours.includes(currentHour)) {
          notifications.push({
            id: `timing-${habitId}-${Date.now()}`,
            type: 'timing-optimal',
            priority: 'medium',
            message: `Now is your optimal time for habit completion!`,
            avatarMessage: this.generateOptimalTimingMessage(avatarType, timingPattern),
            scheduledFor: now,
            expiresAt: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
          });
        }
        
        // Check for streak risk notifications
        if (streakForecast.riskProfile === 'high' || streakForecast.predictions.day7 < 0.5) {
          const riskNotification = await this.createStreakRiskNotification(
            habitId,
            streakForecast,
            avatarType,
            now
          );
          notifications.push(riskNotification);
        }
        
        // Check for pattern insights
        if (Math.random() < 0.1) { // 10% chance for pattern insight
          const patternInsight = await this.createPatternInsightNotification(
            habitId,
            timingPattern,
            avatarType,
            now
          );
          if (patternInsight) notifications.push(patternInsight);
        }
        
      } catch (error) {
        console.warn(`Error generating notifications for habit ${habitId}:`, error);
      }
    }
    
    return notifications.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyze user patterns and suggest optimal intervention times
   */
  async analyzeOptimalInterventionStrategy(
    habitId: string,
    avatarType: AvatarType,
    recentActivity: Array<{ date: string; completed: boolean; mood?: Mood }>
  ): Promise<{
    strategy: 'immediate' | 'scheduled' | 'reactive' | 'preventive';
    timing: Date;
    approach: string;
    confidence: number;
  }> {
    
    const [timingPattern, streakForecast] = await Promise.all([
      habitAnalytics.analyzeHabitTiming(habitId),
      streakPredictor.generateStreakForecast(habitId)
    ]);
    
    let strategy: 'immediate' | 'scheduled' | 'reactive' | 'preventive' = 'scheduled';
    let timing = new Date();
    let approach = 'Regular encouragement';
    let confidence = 0.7;
    
    // Determine strategy based on risk and patterns
    if (streakForecast.riskProfile === 'high') {
      strategy = 'immediate';
      approach = 'Urgent streak protection';
      confidence = 0.9;
      timing = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    } else if (streakForecast.nextCriticalDate) {
      strategy = 'preventive';
      approach = 'Proactive support before difficulty';
      confidence = 0.8;
      timing = new Date(streakForecast.nextCriticalDate.getTime() - 12 * 60 * 60 * 1000); // 12 hours before
    } else if (timingPattern.optimalHours.length > 0) {
      strategy = 'scheduled';
      approach = 'Optimal timing engagement';
      confidence = 0.75;
      
      // Schedule for next optimal hour
      const nextOptimalHour = this.findNextOptimalHour(timingPattern.optimalHours);
      timing = nextOptimalHour;
    } else {
      strategy = 'reactive';
      approach = 'Respond to user activity';
      confidence = 0.6;
      timing = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    }
    
    return { strategy, timing, approach, confidence };
  }

  /**
   * Update avatar memory with analytics insights
   */
  async updateAvatarMemoryWithAnalytics(
    currentMemory: AvatarMemory,
    habitId: string,
    userActivity: {
      completed: boolean;
      mood?: Mood;
      timeOfDay: string;
      vitality: number;
    }
  ): Promise<AvatarMemory> {
    
    const context = {
      activityType: 'habit_completion' as const,
      timeOfDay: userActivity.timeOfDay,
      mood: userActivity.mood,
      habitType: 'general', // Would be determined from habit data
      vitality: userActivity.vitality
    };
    
    // Use smart memory update that incorporates analytics
    let updatedMemory = smartMemoryUpdate(currentMemory, context);
    
    // Add specific analytics-driven insights
    try {
      const timingPattern = await habitAnalytics.analyzeHabitTiming(habitId);
      const streakForecast = await streakPredictor.generateStreakForecast(habitId);
      
      // Add timing insights to memory
      if (timingPattern.optimalHours.includes(new Date().getHours())) {
        updatedMemory = updateAvatarMemory(updatedMemory, {
          pattern: { type: 'bestTime', value: userActivity.timeOfDay }
        });
      }
      
      // Add milestone if streak achievement
      if (streakForecast.currentStreak > 0 && streakForecast.currentStreak % 7 === 0) {
        updatedMemory = updateAvatarMemory(updatedMemory, {
          milestone: `${streakForecast.currentStreak}-day streak milestone - ${new Date().toLocaleDateString()}`
        });
      }
      
    } catch (error) {
      console.warn('Error updating memory with analytics:', error);
    }
    
    return updatedMemory;
  }

  // Private helper methods

  private generateAnalyticsInsights(context: IntegratedInsightContext): string[] {
    const insights: string[] = [];
    const { analyticsSnapshot } = context;
    
    if (analyticsSnapshot.isOptimalTime) {
      insights.push(`You're ${Math.round(analyticsSnapshot.timingPattern.completionRate * 100)}% more successful at this time`);
    }
    
    if (analyticsSnapshot.isRiskPeriod) {
      insights.push(`Your ${analyticsSnapshot.streakForecast.currentStreak}-day streak shows ${analyticsSnapshot.streakForecast.riskProfile} risk`);
    }
    
    if (analyticsSnapshot.timingPattern.energyPattern !== 'flexible') {
      insights.push(`Your energy pattern is ${analyticsSnapshot.timingPattern.energyPattern}-focused`);
    }
    
    return insights;
  }

  private generateActionableRecommendations(context: IntegratedInsightContext): string[] {
    const recommendations: string[] = [];
    const { analyticsSnapshot, userContext } = context;
    
    if (analyticsSnapshot.isRiskPeriod) {
      recommendations.push(...analyticsSnapshot.streakForecast.optimalInterventions.slice(0, 2));
    }
    
    if (!analyticsSnapshot.isOptimalTime && analyticsSnapshot.timingPattern.optimalHours.length > 0) {
      const nextOptimal = analyticsSnapshot.timingPattern.optimalHours[0];
      recommendations.push(`Consider trying this habit at ${nextOptimal}:00 for better success`);
    }
    
    if (userContext.currentMood && ['😔', '😤'].includes(userContext.currentMood)) {
      recommendations.push('Consider a simplified version of this habit today');
    }
    
    return recommendations.slice(0, 3);
  }

  private generateMemoryUpdates(context: IntegratedInsightContext, userMessage: string) {
    const updates: SmartChatResponse['memoryUpdates'] = {};
    
    // Emotional context
    if (context.userContext.currentMood) {
      updates.emotion = {
        mood: context.userContext.currentMood,
        context: userMessage.length > 50 ? 'detailed_discussion' : 'brief_interaction'
      };
    }
    
    // Pattern recognition
    if (context.analyticsSnapshot.isOptimalTime) {
      updates.pattern = {
        type: 'bestTime',
        value: context.userContext.timeOfDay
      };
    }
    
    return updates;
  }

  private async predictNextOptimalEngagement(context: IntegratedInsightContext): Promise<Date | undefined> {
    const now = new Date();
    const currentHour = now.getHours();
    const optimalHours = context.analyticsSnapshot.timingPattern.optimalHours;
    
    if (optimalHours.length === 0) return undefined;
    
    // Find next optimal hour
    const nextOptimalHour = this.findNextOptimalHour(optimalHours);
    
    // If streak is at risk, engage sooner
    if (context.analyticsSnapshot.streakForecast.riskProfile === 'high') {
      return new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
    }
    
    return nextOptimalHour;
  }

  private findNextOptimalHour(optimalHours: number[]): Date {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next optimal hour today
    const nextToday = optimalHours.find(hour => hour > currentHour);
    
    if (nextToday !== undefined) {
      const nextTime = new Date(now);
      nextTime.setHours(nextToday, 0, 0, 0);
      return nextTime;
    }
    
    // Otherwise, first optimal hour tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(optimalHours[0], 0, 0, 0);
    return tomorrow;
  }

  private generateOptimalTimingMessage(avatarType: AvatarType, pattern: HabitTimingPattern): string {
    const successRate = Math.round(pattern.completionRate * 100);
    
    switch (avatarType) {
      case 'plant':
        return `Like morning dew at sunrise, this is when you naturally flourish! Your success rate is ${successRate}% at this time.`;
      case 'pet':
        return `WOOF! This is your power hour! You're ${successRate}% more awesome right now! 🌟`;
      case 'robot':
        return `Optimal productivity window detected. Historical success rate: ${successRate}%. Execute habit protocol now.`;
      case 'base':
        return `Perfect timing! You typically have ${successRate}% success rate during this hour.`;
      default:
        return `Great timing! This is one of your optimal hours.`;
    }
  }

  private async createStreakRiskNotification(
    habitId: string,
    forecast: StreakForecast,
    avatarType: AvatarType,
    now: Date
  ): Promise<ContextualNotification> {
    
    const avatarMessage = await enhancedAvatarPersonality.generatePatternAwareInsight(
      avatarType,
      habitId,
      'streak-risk'
    );
    
    return {
      id: `streak-risk-${habitId}-${Date.now()}`,
      type: 'streak-risk',
      priority: forecast.riskProfile === 'high' ? 'urgent' : 'high',
      message: `Your ${forecast.currentStreak}-day streak needs attention`,
      avatarMessage,
      action: {
        type: 'difficulty-adjustment',
        data: { reduce: true, supportLevel: 'high' }
      },
      scheduledFor: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  private async createPatternInsightNotification(
    habitId: string,
    pattern: HabitTimingPattern,
    avatarType: AvatarType,
    now: Date
  ): Promise<ContextualNotification | null> {
    
    if (pattern.difficultDays.length === 0) return null;
    
    const avatarMessage = await enhancedAvatarPersonality.generatePatternAwareInsight(
      avatarType,
      habitId,
      'timing'
    );
    
    return {
      id: `pattern-${habitId}-${Date.now()}`,
      type: 'pattern-insight',
      priority: 'low',
      message: `I've noticed patterns in your ${habitId} habit`,
      avatarMessage,
      scheduledFor: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }
}

// Export singleton instance
export const analyticsIntegration = new AnalyticsIntegrationService();