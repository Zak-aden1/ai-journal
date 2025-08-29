import { AvatarType, AvatarPersonality, AvatarMemory } from '@/components/avatars/types';
import { Entry, Mode, Mood } from '@/stores/app';
import { AVATAR_PERSONALITIES, generatePersonalizedResponse, ResponseContext } from './avatarPersonality';
import { habitAnalytics, type HabitTimingPattern, type WeeklyHabitReport } from '@/services/analytics/HabitAnalyticsService';
import { streakPredictor, type StreakForecast, type MoodBasedDifficultyAdjustment } from '@/services/analytics/StreakPredictionEngine';

/**
 * Enhanced Avatar Personality System with Advanced Analytics Integration
 * Builds on existing personality system with pattern-aware insights and predictions
 */

export interface EnhancedInsightContext {
  basicContext: ResponseContext;
  analyticsInsights: {
    timingPattern?: HabitTimingPattern;
    streakForecast?: StreakForecast;
    weeklyReport?: WeeklyHabitReport;
    moodDifficulty?: MoodBasedDifficultyAdjustment;
  };
  patternRecognition: {
    isOptimalTime: boolean;
    isStruggleDay: boolean;
    isStreakRisk: boolean;
    moodTrend: 'improving' | 'stable' | 'declining';
  };
}

export interface SmartMotivationalMessage {
  message: string;
  type: 'insight' | 'prediction' | 'encouragement' | 'warning' | 'celebration';
  urgency: 'low' | 'medium' | 'high';
  actionable: boolean;
  specificRecommendation?: string;
  timing: 'immediate' | 'today' | 'this-week' | 'long-term';
  confidence: number; // 0-1
}

export interface AdaptivePersonalityResponse {
  baseResponse: string;
  analyticsEnhancement: string;
  combinedMessage: string;
  personalizedTips: string[];
  motivation: SmartMotivationalMessage;
  emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise' | 'concerned';
  vitalityImpact: number;
}

export class EnhancedAvatarPersonalityService {
  
  /**
   * Generate enhanced response using analytics insights
   */
  async generateEnhancedResponse(
    avatarType: AvatarType,
    basicContext: ResponseContext,
    habitId?: string,
    userMessage?: string
  ): Promise<AdaptivePersonalityResponse> {
    
    // Gather analytics insights if habit provided
    let analyticsInsights: EnhancedInsightContext['analyticsInsights'] = {};
    if (habitId) {
      try {
        analyticsInsights = await this.gatherAnalyticsInsights(habitId);
      } catch (error) {
        console.warn('Could not gather analytics insights:', error);
      }
    }
    
    // Create enhanced context
    const enhancedContext: EnhancedInsightContext = {
      basicContext,
      analyticsInsights,
      patternRecognition: await this.analyzePatterns(basicContext, analyticsInsights, habitId)
    };
    
    // Generate base response
    const baseResponse = generatePersonalizedResponse(avatarType, basicContext, basicContext.goals as any);
    
    // Generate analytics enhancement
    const analyticsEnhancement = this.generateAnalyticsEnhancement(avatarType, enhancedContext);
    
    // Combine responses intelligently
    const combinedMessage = this.combineResponses(baseResponse, analyticsEnhancement, avatarType);
    
    // Generate personalized tips
    const personalizedTips = await this.generatePersonalizedTips(enhancedContext, habitId);
    
    // Generate smart motivational message
    const motivation = this.generateSmartMotivation(avatarType, enhancedContext);
    
    // Determine emotional tone and vitality impact
    const { emotion, vitalityImpact } = this.calculateEmotionalResponse(enhancedContext, avatarType);
    
    return {
      baseResponse,
      analyticsEnhancement,
      combinedMessage,
      personalizedTips,
      motivation,
      emotion,
      vitalityImpact
    };
  }

  /**
   * Generate pattern-aware insights for avatar responses
   */
  async generatePatternAwareInsight(
    avatarType: AvatarType,
    habitId: string,
    context: 'timing' | 'streak-risk' | 'mood-adjustment' | 'weekly-review'
  ): Promise<string> {
    
    const personality = AVATAR_PERSONALITIES[avatarType];
    
    switch (context) {
      case 'timing':
        const timingPattern = await habitAnalytics.analyzeHabitTiming(habitId);
        return this.generateTimingInsight(avatarType, timingPattern, personality);
        
      case 'streak-risk':
        const streakForecast = await streakPredictor.generateStreakForecast(habitId);
        return this.generateStreakRiskInsight(avatarType, streakForecast, personality);
        
      case 'mood-adjustment':
        // Would integrate with current mood from context
        return this.generateMoodInsight(avatarType, personality);
        
      case 'weekly-review':
        const weeklyReport = await habitAnalytics.generateWeeklyReport(habitId, 'Habit');
        return this.generateWeeklyInsight(avatarType, weeklyReport, personality);
        
      default:
        return this.generateGeneralPatternInsight(avatarType, personality);
    }
  }

  /**
   * Predict optimal intervention timing based on analytics
   */
  async predictOptimalInterventionTime(habitId: string): Promise<{
    nextOptimalTime: Date;
    interventionType: 'encouragement' | 'reminder' | 'celebration' | 'course-correction';
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }> {
    
    const streakForecast = await streakPredictor.generateStreakForecast(habitId);
    const timingPattern = await habitAnalytics.analyzeHabitTiming(habitId);
    
    // Determine intervention timing
    let hoursAhead = 24; // Default: tomorrow
    let interventionType: 'encouragement' | 'reminder' | 'celebration' | 'course-correction' = 'encouragement';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    
    if (streakForecast.riskProfile === 'high') {
      hoursAhead = 2; // Very soon
      interventionType = 'course-correction';
      priority = 'urgent';
    } else if (streakForecast.nextCriticalDate) {
      const hoursUntilCritical = (streakForecast.nextCriticalDate.getTime() - Date.now()) / (1000 * 60 * 60);
      hoursAhead = Math.max(1, hoursUntilCritical - 12); // 12 hours before critical
      interventionType = 'reminder';
      priority = 'high';
    } else if (timingPattern.optimalHours.length > 0) {
      // Use their optimal time tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(timingPattern.optimalHours[0], 0, 0, 0);
      hoursAhead = (tomorrow.getTime() - Date.now()) / (1000 * 60 * 60);
    }
    
    const nextOptimalTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    
    return {
      nextOptimalTime,
      interventionType,
      message: this.generateInterventionMessage(interventionType, streakForecast),
      priority
    };
  }

  // Private helper methods

  private async gatherAnalyticsInsights(habitId: string) {
    try {
      const [timingPattern, streakForecast, weeklyReport] = await Promise.all([
        habitAnalytics.analyzeHabitTiming(habitId).catch(() => undefined),
        streakPredictor.generateStreakForecast(habitId).catch(() => undefined),
        habitAnalytics.generateWeeklyReport(habitId, 'Habit').catch(() => undefined)
      ]);
      
      return {
        timingPattern,
        streakForecast, 
        weeklyReport
        // moodDifficulty would be generated based on current context
      };
    } catch (error) {
      console.warn('Error gathering analytics insights:', error);
      return {};
    }
  }

  private async analyzePatterns(
    basicContext: ResponseContext, 
    insights: EnhancedInsightContext['analyticsInsights'],
    habitId?: string
  ) {
    const currentHour = new Date().getHours();
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    const isOptimalTime = insights.timingPattern 
      ? insights.timingPattern.optimalHours.includes(currentHour)
      : false;
      
    const isStruggleDay = insights.timingPattern
      ? insights.timingPattern.difficultDays.includes(currentDay)
      : false;
      
    const isStreakRisk = insights.streakForecast
      ? insights.streakForecast.riskProfile === 'high' || insights.streakForecast.predictions.day7 < 0.5
      : false;
      
    // Analyze mood trend from recent entries
    const moodTrend = this.analyzeMoodTrend(basicContext.recentEntries);
    
    return {
      isOptimalTime,
      isStruggleDay,
      isStreakRisk,
      moodTrend
    };
  }

  private generateAnalyticsEnhancement(avatarType: AvatarType, context: EnhancedInsightContext): string {
    const { analyticsInsights, patternRecognition } = context;
    
    const enhancements: string[] = [];
    
    // Timing insights
    if (patternRecognition.isOptimalTime && analyticsInsights.timingPattern) {
      enhancements.push(this.generateTimingEnhancement(avatarType, 'optimal'));
    } else if (patternRecognition.isStruggleDay) {
      enhancements.push(this.generateTimingEnhancement(avatarType, 'difficult'));
    }
    
    // Streak insights
    if (patternRecognition.isStreakRisk && analyticsInsights.streakForecast) {
      enhancements.push(this.generateStreakEnhancement(avatarType, analyticsInsights.streakForecast));
    }
    
    // Mood trend insights
    if (patternRecognition.moodTrend !== 'stable') {
      enhancements.push(this.generateMoodTrendEnhancement(avatarType, patternRecognition.moodTrend));
    }
    
    return enhancements.join(' ');
  }

  private generateTimingEnhancement(avatarType: AvatarType, timing: 'optimal' | 'difficult'): string {
    const personality = AVATAR_PERSONALITIES[avatarType];
    
    if (timing === 'optimal') {
      switch (avatarType) {
        case 'plant':
          return 'Perfect timing - you\'re in your natural growth window right now.';
        case 'pet':
          return 'YES! This is your power hour! I can feel your energy! 🌟';
        case 'robot':
          return 'Optimal productivity window detected. Executing at peak efficiency.';
        case 'base':
          return 'Great timing - you typically perform well at this hour.';
        default:
          return 'This is good timing for you!';
      }
    } else {
      switch (avatarType) {
        case 'plant':
          return 'I know this timing can be challenging, but even difficult seasons bring growth.';
        case 'pet':
          return 'Hey, I know this is usually tough for you, but I\'m here to help! 💪';
        case 'robot':
          return 'Suboptimal timing detected. Adjusting expectations and support protocols.';
        case 'base':
          return 'This time can be tricky for you - let\'s make it easier today.';
        default:
          return 'Let\'s take it easy with the timing today.';
      }
    }
  }

  private generateStreakEnhancement(avatarType: AvatarType, forecast: StreakForecast): string {
    switch (avatarType) {
      case 'plant':
        return forecast.riskProfile === 'high' 
          ? 'I sense your routine needs some gentle nurturing - like tending to roots.'
          : `Your ${forecast.currentStreak}-day growth streak is beautiful to witness.`;
      case 'pet':
        return forecast.riskProfile === 'high'
          ? 'Woof! I notice your routine needs extra love and attention today! 🐾'
          : `WOW! ${forecast.currentStreak} days of awesomeness! You\'re incredible!`;
      case 'robot':
        return forecast.riskProfile === 'high'
          ? `Streak maintenance at ${Math.round(forecast.predictions.day7 * 100)}% probability. Initiating support protocols.`
          : `Streak analysis: ${forecast.currentStreak} days achieved. Sustainability score: ${forecast.streakSustainabilityScore}%.`;
      case 'base':
        return forecast.riskProfile === 'high'
          ? 'Your streak could use some extra attention right now.'
          : `Nice work on your ${forecast.currentStreak}-day streak!`;
      default:
        return 'Your streak is looking good!';
    }
  }

  private generateMoodTrendEnhancement(avatarType: AvatarType, trend: 'improving' | 'declining'): string {
    if (trend === 'improving') {
      switch (avatarType) {
        case 'plant': return 'I can feel your positive energy blossoming lately.';
        case 'pet': return 'Your happy vibes have been amazing lately! 🌈';
        case 'robot': return 'Positive emotional trajectory confirmed over recent cycles.';
        case 'base': return 'You seem to be feeling better recently!';
        default: return 'Your mood has been improving!';
      }
    } else {
      switch (avatarType) {
        case 'plant': return 'I sense you\'ve been weathering some storms lately.';
        case 'pet': return 'I\'ve noticed things have been tough - but I\'m here for you! 🤗';
        case 'robot': return 'Emotional support protocols activated based on recent patterns.';
        case 'base': return 'I can tell things have been challenging recently.';
        default: return 'I\'m here to support you through tough times.';
      }
    }
  }

  private combineResponses(base: string, enhancement: string, avatarType: AvatarType): string {
    if (!enhancement.trim()) return base;
    
    const personality = AVATAR_PERSONALITIES[avatarType];
    
    // Different combination styles based on personality
    switch (personality.communicationStyle) {
      case 'wise':
        return `${base} ${enhancement}`;
      case 'cheerful':
        return `${base} Also, ${enhancement.toLowerCase()}`;
      case 'analytical':
        return `${base} Additional insight: ${enhancement}`;
      case 'casual':
        return `${base} By the way, ${enhancement.toLowerCase()}`;
      default:
        return `${base} ${enhancement}`;
    }
  }

  private async generatePersonalizedTips(context: EnhancedInsightContext, habitId?: string): Promise<string[]> {
    const tips: string[] = [];
    
    // Pattern-based tips
    if (context.patternRecognition.isOptimalTime) {
      tips.push('This is your peak performance time - make the most of it!');
    }
    
    if (context.patternRecognition.isStruggleDay) {
      tips.push('Consider simplifying your approach today');
    }
    
    // Analytics-based tips
    if (context.analyticsInsights.timingPattern) {
      const pattern = context.analyticsInsights.timingPattern;
      if (pattern.energyPattern !== 'flexible') {
        tips.push(`You work best during ${pattern.energyPattern} hours`);
      }
    }
    
    if (context.analyticsInsights.streakForecast?.optimalInterventions) {
      tips.push(...context.analyticsInsights.streakForecast.optimalInterventions.slice(0, 2));
    }
    
    return tips.slice(0, 3);
  }

  private generateSmartMotivation(avatarType: AvatarType, context: EnhancedInsightContext): SmartMotivationalMessage {
    const { patternRecognition, analyticsInsights } = context;
    
    // Determine message type and urgency
    let type: SmartMotivationalMessage['type'] = 'encouragement';
    let urgency: SmartMotivationalMessage['urgency'] = 'low';
    let timing: SmartMotivationalMessage['timing'] = 'today';
    
    if (patternRecognition.isStreakRisk) {
      type = 'warning';
      urgency = 'high';
      timing = 'immediate';
    } else if (context.basicContext.progress?.habitsCompleted && context.basicContext.progress.habitsCompleted > 0) {
      type = 'celebration';
      urgency = 'medium';
    } else if (analyticsInsights.streakForecast?.streakSustainabilityScore && analyticsInsights.streakForecast.streakSustainabilityScore > 80) {
      type = 'insight';
      urgency = 'low';
      timing = 'this-week';
    }
    
    const message = this.generateMotivationalMessage(avatarType, type, context);
    
    return {
      message,
      type,
      urgency,
      actionable: type === 'warning' || type === 'insight',
      specificRecommendation: analyticsInsights.streakForecast?.optimalInterventions[0],
      timing,
      confidence: analyticsInsights.streakForecast?.streakSustainabilityScore || 50 / 100
    };
  }

  private generateMotivationalMessage(avatarType: AvatarType, type: SmartMotivationalMessage['type'], context: EnhancedInsightContext): string {
    const base = AVATAR_PERSONALITIES[avatarType].responsePatterns[0];
    
    switch (type) {
      case 'celebration':
        return this.getCelebrationMessage(avatarType);
      case 'warning':
        return this.getWarningMessage(avatarType);
      case 'insight':
        return this.getInsightMessage(avatarType, context);
      case 'prediction':
        return this.getPredictionMessage(avatarType, context);
      default:
        return base;
    }
  }

  private getCelebrationMessage(avatarType: AvatarType): string {
    switch (avatarType) {
      case 'plant': return 'You\'re blooming beautifully today! 🌸';
      case 'pet': return 'AMAZING! You\'re the best human ever! 🎉🐕';
      case 'robot': return 'Achievement unlocked! Performance metrics: Excellent.';
      case 'base': return 'Great job today! You\'re making real progress.';
      default: return 'Well done today!';
    }
  }

  private getWarningMessage(avatarType: AvatarType): string {
    switch (avatarType) {
      case 'plant': return 'Your growth needs some extra attention today - like water for thirsty roots.';
      case 'pet': return 'Woof! I think you need some extra love and support today! 🤗';
      case 'robot': return 'Alert: Streak maintenance requires immediate attention. Activating support protocols.';
      case 'base': return 'Your routine could use some extra focus today.';
      default: return 'Let\'s pay extra attention to your habits today.';
    }
  }

  private getInsightMessage(avatarType: AvatarType, context: EnhancedInsightContext): string {
    const pattern = context.analyticsInsights.timingPattern;
    if (!pattern) return 'You\'re developing interesting patterns in your routine.';
    
    switch (avatarType) {
      case 'plant':
        return `I notice you flourish most during ${pattern.energyPattern} hours - like a plant following the sun.`;
      case 'pet':
        return `I\'ve learned when you\'re at your best - ${pattern.energyPattern} is your superpower time! ⚡`;
      case 'robot':
        return `Pattern analysis reveals optimal performance during ${pattern.energyPattern} cycles. Efficiency: ${Math.round(pattern.completionRate * 100)}%.`;
      case 'base':
        return `I\'ve noticed you work best during ${pattern.energyPattern} hours.`;
      default:
        return 'Your patterns are becoming clearer to me.';
    }
  }

  private getPredictionMessage(avatarType: AvatarType, context: EnhancedInsightContext): string {
    const forecast = context.analyticsInsights.streakForecast;
    if (!forecast) return 'The future looks bright for your habits!';
    
    const daysPrediction = Math.round(forecast.predictions.day7 * 100);
    
    switch (avatarType) {
      case 'plant':
        return `Looking at your growth patterns, I sense a ${daysPrediction}% chance of continued flourishing this week.`;
      case 'pet':
        return `My puppy senses predict ${daysPrediction}% awesome-ness for this week! 🔮🐕`;
      case 'robot':
        return `Predictive analysis: ${daysPrediction}% probability of streak maintenance over next 7-day cycle.`;
      case 'base':
        return `Based on your patterns, you have a ${daysPrediction}% chance of a great week ahead.`;
      default:
        return `I predict good things ahead for your habits!`;
    }
  }

  private calculateEmotionalResponse(context: EnhancedInsightContext, avatarType: AvatarType): {
    emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise' | 'concerned';
    vitalityImpact: number;
  } {
    let emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise' | 'concerned' = 'supportive';
    let vitalityImpact = 2; // Default neutral impact
    
    // Determine emotion based on patterns and context
    if (context.basicContext.progress?.habitsCompleted && context.basicContext.progress.habitsCompleted > 0) {
      emotion = 'celebratory';
      vitalityImpact = 4;
    } else if (context.patternRecognition.isStreakRisk) {
      emotion = 'concerned';
      vitalityImpact = 1; // Gentle impact when concerned
    } else if (context.patternRecognition.moodTrend === 'improving') {
      emotion = 'motivational';
      vitalityImpact = 3;
    } else if (context.analyticsInsights.streakForecast?.streakSustainabilityScore && context.analyticsInsights.streakForecast.streakSustainabilityScore > 70) {
      emotion = 'wise';
      vitalityImpact = 3;
    }
    
    // Adjust based on avatar personality
    const personality = AVATAR_PERSONALITIES[avatarType];
    if (personality.traits.analytical > 7 && emotion === 'supportive') {
      emotion = 'wise';
    }
    if (personality.traits.enthusiasm > 8 && vitalityImpact < 3) {
      vitalityImpact += 1;
    }
    
    return { emotion, vitalityImpact };
  }

  private analyzeMoodTrend(recentEntries: Entry[]): 'improving' | 'stable' | 'declining' {
    if (recentEntries.length < 3) return 'stable';
    
    const moodScores = recentEntries.slice(0, 5).map(entry => this.moodToScore(entry.mood));
    const firstHalf = moodScores.slice(0, Math.ceil(moodScores.length / 2));
    const secondHalf = moodScores.slice(Math.floor(moodScores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.3) return 'improving';
    if (difference < -0.3) return 'declining';
    return 'stable';
  }

  private moodToScore(mood?: Mood): number {
    const scores = {
      '😍': 5,
      '😊': 4,
      '😐': 3,
      '😤': 2,
      '😔': 1
    };
    return mood ? scores[mood] || 3 : 3;
  }

  private generateTimingInsight(avatarType: AvatarType, pattern: HabitTimingPattern, personality: AvatarPersonality): string {
    const optimalTime = pattern.optimalHours[0] || 9;
    const timeString = `${optimalTime}:00`;
    
    switch (avatarType) {
      case 'plant':
        return `Like morning dew, ${timeString} seems to be when you naturally thrive. Your completion rate is ${Math.round(pattern.completionRate * 100)}% - beautiful consistency!`;
      case 'pet':
        return `WOOF! I've noticed ${timeString} is your power hour! You're like a super-pup at this time with ${Math.round(pattern.completionRate * 100)}% success! 🦸‍♀️🐕`;
      case 'robot':
        return `Temporal analysis complete: Peak productivity detected at ${timeString}. Success probability: ${Math.round(pattern.completionRate * 100)}%. Recommend maintaining this schedule.`;
      case 'base':
        return `I've learned that ${timeString} works really well for you. Your success rate at this time is ${Math.round(pattern.completionRate * 100)}%.`;
      default:
        return `${timeString} seems to be your optimal time!`;
    }
  }

  private generateStreakRiskInsight(avatarType: AvatarType, forecast: StreakForecast, personality: AvatarPersonality): string {
    const riskLevel = forecast.riskProfile;
    const nextWeekChance = Math.round(forecast.predictions.day7 * 100);
    
    switch (avatarType) {
      case 'plant':
        return riskLevel === 'high' 
          ? `I sense your ${forecast.currentStreak}-day growth needs gentle care. Like a plant in changing seasons, small adjustments can help you flourish again.`
          : `Your ${forecast.currentStreak}-day journey is strong like deep roots. I see ${nextWeekChance}% chance of continued growth this week.`;
      case 'pet':
        return riskLevel === 'high'
          ? `Oh no! Your ${forecast.currentStreak}-day streak needs some extra pup love! But don't worry - I believe in you 100%! 🐕💪`
          : `WOW! ${forecast.currentStreak} days of being amazing! My prediction? ${nextWeekChance}% chance you'll keep being awesome this week! 🌟`;
      case 'robot':
        return `Streak analysis: Current=${forecast.currentStreak} days, Risk=${riskLevel}, Next-7-days=${nextWeekChance}%. ${riskLevel === 'high' ? 'Implementing support protocols.' : 'Trajectory nominal.'}`;
      case 'base':
        return riskLevel === 'high'
          ? `Your ${forecast.currentStreak}-day streak needs some attention. Let's work together to keep it going.`
          : `Nice ${forecast.currentStreak}-day streak! Looking good for the week ahead (${nextWeekChance}% confidence).`;
      default:
        return `Your streak is looking ${riskLevel === 'high' ? 'like it needs support' : 'strong'}!`;
    }
  }

  private generateMoodInsight(avatarType: AvatarType, personality: AvatarPersonality): string {
    switch (avatarType) {
      case 'plant':
        return 'I can sense your energy today - like soil conditions that affect growth. Let me adjust our approach accordingly.';
      case 'pet':
        return 'I can feel your vibes today! Let me match your energy and help you in the best way! 🐕✨';
      case 'robot':
        return 'Emotional state analysis complete. Adjusting interaction parameters for optimal support delivery.';
      case 'base':
        return 'I can tell how you\'re feeling today, so let me tailor my approach to what works best for you.';
      default:
        return 'I\'m tuning into your energy today.';
    }
  }

  private generateWeeklyInsight(avatarType: AvatarType, report: WeeklyHabitReport, personality: AvatarPersonality): string {
    const successRate = Math.round(report.successRate * 100);
    const moodImprovement = Math.round(report.moodImpact.moodImprovement * 100);
    
    switch (avatarType) {
      case 'plant':
        return `This week you've grown beautifully - ${successRate}% completion! I've watched your mood improve by ${moodImprovement}% when you nurture this habit. Like seasons of growth, you're flourishing! 🌱`;
      case 'pet':
        return `AMAZING WEEK! ${successRate}% completion rate! And guess what? You're ${moodImprovement}% happier when you do this habit! You make my tail wag with pride! 🎉🐕`;
      case 'robot':
        return `Weekly analysis: ${successRate}% task completion. Mood correlation: +${moodImprovement}% improvement post-habit. Performance trajectory: ${report.predictions.nextWeekSuccess > 0.7 ? 'Optimal' : 'Requires optimization'}.`;
      case 'base':
        return `Great week! You hit ${successRate}% completion and I noticed you feel ${moodImprovement}% better after doing this habit. Keep it up!`;
      default:
        return `Solid week with ${successRate}% completion!`;
    }
  }

  private generateGeneralPatternInsight(avatarType: AvatarType, personality: AvatarPersonality): string {
    switch (avatarType) {
      case 'plant':
        return 'I\'m learning your natural rhythms and growth patterns - like understanding when to water and when to let rest.';
      case 'pet':
        return 'I\'m getting to know all your awesome patterns! Every day I learn something new about what makes you amazing! 🌟🐕';
      case 'robot':
        return 'Pattern recognition algorithms active. Continuously analyzing behavioral data to optimize support delivery.';
      case 'base':
        return 'I\'m learning your patterns and preferences to better support your journey.';
      default:
        return 'I\'m getting to know your patterns better each day.';
    }
  }

  private generateInterventionMessage(
    type: 'encouragement' | 'reminder' | 'celebration' | 'course-correction',
    forecast: StreakForecast
  ): string {
    switch (type) {
      case 'encouragement':
        return `Your ${forecast.currentStreak}-day streak shows real commitment. Keep nurturing this positive momentum!`;
      case 'reminder':
        return `Gentle reminder: Your routine could use some attention to maintain that great ${forecast.currentStreak}-day streak.`;
      case 'celebration':
        return `🎉 Celebrating your amazing ${forecast.currentStreak}-day streak! Your consistency is inspiring!`;
      case 'course-correction':
        return `Your ${forecast.currentStreak}-day streak needs immediate care. Let's adjust our approach to get back on track.`;
      default:
        return 'Time to focus on your habit routine!';
    }
  }
}

// Export singleton instance
export const enhancedAvatarPersonality = new EnhancedAvatarPersonalityService();