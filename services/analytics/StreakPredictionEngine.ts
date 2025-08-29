import type { HabitWithId, Entry, Mood } from '@/stores/app';
import { getHabitCompletions, calculateHabitStreak } from '@/lib/db';
import { habitAnalytics, type HabitTimingPattern } from './HabitAnalyticsService';

/**
 * Advanced streak prediction using machine learning-inspired algorithms
 * Predicts streak sustainability and provides actionable recommendations
 */

export interface StreakForecast {
  habitId: string;
  currentStreak: number;
  predictions: {
    day7: number;   // Probability of maintaining streak for 7 more days
    day14: number;  // Probability for 14 more days
    day30: number;  // Probability for 30 more days
  };
  riskProfile: 'low' | 'medium' | 'high';
  keyRiskFactors: Array<{
    factor: string;
    impact: number; // 0-1 scale
    mitigation: string;
  }>;
  streakSustainabilityScore: number; // 0-100
  optimalInterventions: string[];
  nextCriticalDate: Date | null; // When intervention is most needed
}

export interface MoodBasedDifficultyAdjustment {
  habitId: string;
  baselineComplexity: 'easy' | 'medium' | 'hard';
  currentMood: Mood;
  adjustedComplexity: 'easy' | 'medium' | 'hard';
  suggestionModification: {
    timeReduction?: number; // Percentage to reduce time/effort
    energyAdjustment: string;
    alternativeSuggestion?: string;
  };
  motivationalApproach: 'gentle' | 'encouraging' | 'celebratory' | 'supportive';
  contextualTips: string[];
}

export interface StreakRecoveryPlan {
  habitId: string;
  brokenStreakLength: number;
  recoveryStrategy: 'quick-restart' | 'gradual-buildup' | 'foundation-reset';
  recommendedActions: Array<{
    day: number; // Day of recovery plan
    action: string;
    reasoning: string;
    difficultyLevel: 'minimal' | 'low' | 'normal';
  }>;
  psychologicalSupport: {
    reframingMessage: string;
    encouragementLevel: 'high' | 'medium' | 'low';
    focusArea: 'progress' | 'learning' | 'resilience';
  };
}

export class StreakPredictionEngine {
  
  /**
   * Generate comprehensive streak forecast using multiple prediction models
   */
  async generateStreakForecast(habitId: string): Promise<StreakForecast> {
    try {
      const streak = await calculateHabitStreak(habitId);
      const timingPattern = await habitAnalytics.analyzeHabitTiming(habitId);
      const recentPerformance = await this.analyzeRecentPerformance(habitId, 14);
      
      // Multiple prediction models
      const basicModel = this.basicStreakPrediction(streak, timingPattern);
      const trendModel = this.trendBasedPrediction(recentPerformance);
      const seasonalModel = this.seasonalPrediction(habitId);
      
      // Ensemble prediction (weighted average)
      const predictions = {
        day7: this.ensemblePrediction([basicModel.day7, trendModel.day7, seasonalModel.day7], [0.4, 0.4, 0.2]),
        day14: this.ensemblePrediction([basicModel.day14, trendModel.day14, seasonalModel.day14], [0.4, 0.4, 0.2]),
        day30: this.ensemblePrediction([basicModel.day30, trendModel.day30, seasonalModel.day30], [0.3, 0.5, 0.2])
      };
      
      const riskProfile = this.calculateRiskProfile(predictions);
      const keyRiskFactors = await this.identifyKeyRiskFactors(habitId, timingPattern, recentPerformance);
      const streakSustainabilityScore = this.calculateSustainabilityScore(predictions, timingPattern, streak);
      const optimalInterventions = this.generateOptimalInterventions(riskProfile, keyRiskFactors);
      const nextCriticalDate = this.predictNextCriticalDate(predictions, riskProfile);
      
      return {
        habitId,
        currentStreak: streak.current,
        predictions,
        riskProfile,
        keyRiskFactors,
        streakSustainabilityScore,
        optimalInterventions,
        nextCriticalDate
      };
    } catch (error) {
      console.error('Error generating streak forecast:', error);
      return this.getDefaultForecast(habitId);
    }
  }

  /**
   * Adjust habit difficulty based on current mood and context
   */
  adjustHabitDifficulty(
    habitId: string,
    habitTitle: string,
    currentMood: Mood,
    baselineComplexity: 'easy' | 'medium' | 'hard' = 'medium',
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning'
  ): MoodBasedDifficultyAdjustment {
    
    const moodFactors = this.getMoodAdjustmentFactors(currentMood);
    const timeFactors = this.getTimeAdjustmentFactors(timeOfDay);
    
    // Calculate adjusted complexity
    const complexityScore = this.getComplexityScore(baselineComplexity);
    const adjustedScore = complexityScore * moodFactors.difficultyMultiplier * timeFactors.energyMultiplier;
    const adjustedComplexity = this.scoreToComplexity(adjustedScore);
    
    const suggestionModification = this.generateSuggestionModification(
      currentMood, 
      baselineComplexity, 
      adjustedComplexity,
      habitTitle
    );
    
    const motivationalApproach = this.selectMotivationalApproach(currentMood);
    const contextualTips = this.generateContextualTips(currentMood, timeOfDay, habitTitle);
    
    return {
      habitId,
      baselineComplexity,
      currentMood,
      adjustedComplexity,
      suggestionModification,
      motivationalApproach,
      contextualTips
    };
  }

  /**
   * Generate recovery plan for broken streaks
   */
  async generateStreakRecoveryPlan(habitId: string, brokenStreakLength: number): Promise<StreakRecoveryPlan> {
    const recoveryStrategy = this.determineRecoveryStrategy(brokenStreakLength);
    const recommendedActions = this.generateRecoveryActions(recoveryStrategy, brokenStreakLength);
    const psychologicalSupport = this.generatePsychologicalSupport(brokenStreakLength);
    
    return {
      habitId,
      brokenStreakLength,
      recoveryStrategy,
      recommendedActions,
      psychologicalSupport
    };
  }

  // Private methods for prediction models

  private basicStreakPrediction(
    streak: { current: number; longest: number }, 
    pattern: HabitTimingPattern
  ) {
    const baseRate = pattern.completionRate;
    const streakStability = Math.min(streak.current * 0.05, 0.3);
    const consistency = pattern.streakPotential;
    
    const baseline = (baseRate + streakStability + consistency) / 3;
    
    return {
      day7: Math.min(0.95, baseline * 0.95),
      day14: Math.min(0.90, baseline * 0.85),
      day30: Math.min(0.85, baseline * 0.70)
    };
  }

  private trendBasedPrediction(recentPerformance: { slope: number; recent7: number; recent14: number }) {
    const trendFactor = Math.max(0.1, Math.min(1.9, 1 + recentPerformance.slope));
    
    return {
      day7: Math.min(0.95, recentPerformance.recent7 * trendFactor),
      day14: Math.min(0.90, recentPerformance.recent14 * trendFactor * 0.9),
      day30: Math.min(0.85, recentPerformance.recent14 * trendFactor * 0.7)
    };
  }

  private seasonalPrediction(habitId: string) {
    // Simplified seasonal model - would be enhanced with historical data
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monthOfYear = now.getMonth();
    
    // Weekend effect
    const weekendPenalty = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.9 : 1.0;
    
    // Month effect (some months are traditionally harder)
    const monthEffects = [0.9, 0.85, 0.95, 1.0, 1.05, 1.05, 0.95, 0.95, 1.0, 0.95, 0.85, 0.8]; // Jan-Dec
    const monthFactor = monthEffects[monthOfYear];
    
    const baseSeasonal = 0.7;
    
    return {
      day7: baseSeasonal * weekendPenalty * monthFactor,
      day14: baseSeasonal * weekendPenalty * monthFactor * 0.9,
      day30: baseSeasonal * monthFactor * 0.8
    };
  }

  private ensemblePrediction(predictions: number[], weights: number[]): number {
    const weightedSum = predictions.reduce((sum, pred, i) => sum + pred * weights[i], 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    return Math.max(0.05, Math.min(0.95, weightedSum / totalWeight));
  }

  private async analyzeRecentPerformance(habitId: string, days: number) {
    const completions = await getHabitCompletions(habitId, days);
    const rates = completions.map(c => c.completed ? 1 : 0);
    
    const recent7 = rates.slice(-7).reduce((sum, val) => sum + val, 0) / Math.min(7, rates.length);
    const recent14 = rates.slice(-14).reduce((sum, val) => sum + val, 0) / Math.min(14, rates.length);
    
    // Simple trend analysis
    const firstHalf = rates.slice(0, Math.floor(rates.length / 2));
    const secondHalf = rates.slice(Math.floor(rates.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    const slope = (secondAvg - firstAvg) / firstHalf.length; // Simplified slope
    
    return { slope, recent7, recent14 };
  }

  private calculateRiskProfile(predictions: { day7: number; day14: number; day30: number }): 'low' | 'medium' | 'high' {
    const avgPrediction = (predictions.day7 + predictions.day14 + predictions.day30) / 3;
    
    if (avgPrediction > 0.75) return 'low';
    if (avgPrediction > 0.5) return 'medium';
    return 'high';
  }

  private async identifyKeyRiskFactors(
    habitId: string,
    pattern: HabitTimingPattern,
    performance: { slope: number; recent7: number; recent14: number }
  ) {
    const factors = [];
    
    if (pattern.completionRate < 0.6) {
      factors.push({
        factor: 'Low overall completion rate',
        impact: 0.8,
        mitigation: 'Focus on reducing habit complexity and building consistency'
      });
    }
    
    if (performance.slope < -0.1) {
      factors.push({
        factor: 'Declining recent performance',
        impact: 0.7,
        mitigation: 'Review what changed recently and adjust approach'
      });
    }
    
    if (pattern.difficultDays.length > 2) {
      factors.push({
        factor: `Struggles on ${pattern.difficultDays.join(' and ')}`,
        impact: 0.6,
        mitigation: `Plan specific strategies for ${pattern.difficultDays[0]}`
      });
    }
    
    if (performance.recent7 < 0.5) {
      factors.push({
        factor: 'Poor recent week performance',
        impact: 0.9,
        mitigation: 'Consider a streak reset with easier goals'
      });
    }
    
    return factors.sort((a, b) => b.impact - a.impact).slice(0, 3);
  }

  private calculateSustainabilityScore(
    predictions: { day7: number; day14: number; day30: number },
    pattern: HabitTimingPattern,
    streak: { current: number; longest: number }
  ): number {
    const predictionScore = (predictions.day7 * 0.3 + predictions.day14 * 0.4 + predictions.day30 * 0.3) * 100;
    const consistencyScore = pattern.completionRate * 100;
    const experienceScore = Math.min(streak.longest * 2, 30);
    
    return Math.round((predictionScore + consistencyScore + experienceScore) / 3);
  }

  private generateOptimalInterventions(
    riskProfile: 'low' | 'medium' | 'high',
    riskFactors: Array<{ factor: string; impact: number; mitigation: string }>
  ): string[] {
    const interventions = [];
    
    if (riskProfile === 'high') {
      interventions.push('Consider reducing habit complexity temporarily');
      interventions.push('Focus on micro-habits for consistency');
    }
    
    if (riskProfile === 'medium') {
      interventions.push('Review and adjust timing or context');
      interventions.push('Add environmental supports or reminders');
    }
    
    if (riskProfile === 'low') {
      interventions.push('Consider expanding habit scope or adding related habits');
      interventions.push('Maintain current approach with minor optimizations');
    }
    
    // Add specific mitigations from risk factors
    riskFactors.slice(0, 2).forEach(factor => {
      if (!interventions.includes(factor.mitigation)) {
        interventions.push(factor.mitigation);
      }
    });
    
    return interventions.slice(0, 4);
  }

  private predictNextCriticalDate(
    predictions: { day7: number; day14: number; day30: number },
    riskProfile: 'low' | 'medium' | 'high'
  ): Date | null {
    if (riskProfile === 'low' && predictions.day14 > 0.7) {
      return null; // No critical intervention needed
    }
    
    let daysAhead: number;
    if (riskProfile === 'high') {
      daysAhead = 2; // Immediate intervention
    } else if (predictions.day7 < 0.6) {
      daysAhead = 3;
    } else {
      daysAhead = 7;
    }
    
    const criticalDate = new Date();
    criticalDate.setDate(criticalDate.getDate() + daysAhead);
    return criticalDate;
  }

  // Mood-based difficulty adjustment methods

  private getMoodAdjustmentFactors(mood: Mood) {
    const factors = {
      '😊': { difficultyMultiplier: 1.0, energyLevel: 'normal' },
      '😐': { difficultyMultiplier: 0.8, energyLevel: 'moderate' },
      '😔': { difficultyMultiplier: 0.5, energyLevel: 'low' },
      '😤': { difficultyMultiplier: 0.6, energyLevel: 'frustrated' },
      '😍': { difficultyMultiplier: 1.2, energyLevel: 'high' }
    };
    
    return factors[mood] || factors['😐'];
  }

  private getTimeAdjustmentFactors(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night') {
    const factors = {
      morning: { energyMultiplier: 1.1, alertnessLevel: 'high' },
      afternoon: { energyMultiplier: 1.0, alertnessLevel: 'moderate' },
      evening: { energyMultiplier: 0.9, alertnessLevel: 'moderate' },
      night: { energyMultiplier: 0.7, alertnessLevel: 'low' }
    };
    
    return factors[timeOfDay];
  }

  private getComplexityScore(complexity: 'easy' | 'medium' | 'hard'): number {
    const scores = { easy: 0.3, medium: 0.6, hard: 0.9 };
    return scores[complexity];
  }

  private scoreToComplexity(score: number): 'easy' | 'medium' | 'hard' {
    if (score <= 0.4) return 'easy';
    if (score <= 0.7) return 'medium';
    return 'hard';
  }

  private generateSuggestionModification(
    mood: Mood,
    baseline: 'easy' | 'medium' | 'hard',
    adjusted: 'easy' | 'medium' | 'hard',
    habitTitle: string
  ) {
    const reductions = {
      easy: { time: 50, effort: 'minimal' },
      medium: { time: 25, effort: 'reduced' },
      hard: { time: 0, effort: 'normal' }
    };
    
    const reduction = reductions[adjusted];
    
    let energyAdjustment = 'maintain normal energy';
    let alternativeSuggestion: string | undefined;
    
    if (mood === '😔') {
      energyAdjustment = 'be extra gentle with yourself';
      if (baseline !== 'easy') {
        alternativeSuggestion = `Just spend 2 minutes on ${habitTitle.toLowerCase()} - any progress counts`;
      }
    } else if (mood === '😤') {
      energyAdjustment = 'channel frustration into gentle action';
      alternativeSuggestion = `Use ${habitTitle.toLowerCase()} as a positive outlet for your feelings`;
    } else if (mood === '😍') {
      energyAdjustment = 'ride this positive energy wave';
      if (baseline === 'easy') {
        alternativeSuggestion = `Consider extending your ${habitTitle.toLowerCase()} session today`;
      }
    }
    
    return {
      timeReduction: reduction.time > 0 ? reduction.time : undefined,
      energyAdjustment,
      alternativeSuggestion
    };
  }

  private selectMotivationalApproach(mood: Mood): 'gentle' | 'encouraging' | 'celebratory' | 'supportive' {
    const approaches = {
      '😊': 'encouraging',
      '😐': 'supportive',
      '😔': 'gentle',
      '😤': 'supportive',
      '😍': 'celebratory'
    };
    
    return approaches[mood] as any || 'supportive';
  }

  private generateContextualTips(mood: Mood, timeOfDay: string, habitTitle: string): string[] {
    const tips = [];
    
    // Mood-specific tips
    if (mood === '😔') {
      tips.push('Remember: any small step forward is a victory today');
      tips.push('Be compassionate with yourself - progress over perfection');
    } else if (mood === '😤') {
      tips.push('Use this energy constructively - habits can be great stress outlets');
      tips.push('Focus on the calming aspects of your routine');
    } else if (mood === '😍') {
      tips.push('Great mood for building positive associations with habits');
      tips.push('Consider making today\'s session extra enjoyable');
    }
    
    // Time-specific tips
    if (timeOfDay === 'morning') {
      tips.push('Morning habits set the tone for your entire day');
    } else if (timeOfDay === 'night') {
      tips.push('Keep it simple - your brain needs to wind down');
    }
    
    return tips.slice(0, 3);
  }

  // Recovery plan methods

  private determineRecoveryStrategy(brokenStreakLength: number): 'quick-restart' | 'gradual-buildup' | 'foundation-reset' {
    if (brokenStreakLength <= 3) return 'quick-restart';
    if (brokenStreakLength <= 14) return 'gradual-buildup';
    return 'foundation-reset';
  }

  private generateRecoveryActions(strategy: string, brokenStreakLength: number) {
    const baseActions = {
      'quick-restart': [
        { day: 1, action: 'Complete the habit at 50% intensity', reasoning: 'Rebuild momentum quickly', difficultyLevel: 'low' as const },
        { day: 2, action: 'Return to normal habit routine', reasoning: 'Restore confidence', difficultyLevel: 'normal' as const },
        { day: 3, action: 'Focus on consistency over perfection', reasoning: 'Solidify restart', difficultyLevel: 'normal' as const }
      ],
      'gradual-buildup': [
        { day: 1, action: 'Start with micro-version (2 minutes)', reasoning: 'Lower barrier to entry', difficultyLevel: 'minimal' as const },
        { day: 3, action: 'Increase to quarter-version (5 minutes)', reasoning: 'Gradual progression', difficultyLevel: 'minimal' as const },
        { day: 5, action: 'Move to half-version (10 minutes)', reasoning: 'Building capacity', difficultyLevel: 'low' as const },
        { day: 7, action: 'Return to full habit', reasoning: 'Complete restoration', difficultyLevel: 'normal' as const }
      ],
      'foundation-reset': [
        { day: 1, action: 'Identify why the streak broke', reasoning: 'Understanding root causes', difficultyLevel: 'minimal' as const },
        { day: 2, action: 'Redesign habit for current lifestyle', reasoning: 'Address systemic issues', difficultyLevel: 'minimal' as const },
        { day: 4, action: 'Start new micro-habit version', reasoning: 'Fresh beginning', difficultyLevel: 'minimal' as const },
        { day: 7, action: 'Establish new routine and environment', reasoning: 'Supporting systems', difficultyLevel: 'low' as const },
        { day: 14, action: 'Gradually increase habit scope', reasoning: 'Sustainable growth', difficultyLevel: 'low' as const }
      ]
    };
    
    return baseActions[strategy as keyof typeof baseActions] || baseActions['gradual-buildup'];
  }

  private generatePsychologicalSupport(brokenStreakLength: number) {
    const supportLevels = {
      short: {
        reframingMessage: 'A small break doesn\'t erase your progress - you\'re just getting back on track.',
        encouragementLevel: 'medium' as const,
        focusArea: 'progress' as const
      },
      medium: {
        reframingMessage: 'This break is valuable feedback. You\'re learning what works and what doesn\'t.',
        encouragementLevel: 'high' as const,
        focusArea: 'learning' as const
      },
      long: {
        reframingMessage: 'Starting over is a sign of resilience, not failure. Every restart makes you stronger.',
        encouragementLevel: 'high' as const,
        focusArea: 'resilience' as const
      }
    };
    
    if (brokenStreakLength <= 7) return supportLevels.short;
    if (brokenStreakLength <= 21) return supportLevels.medium;
    return supportLevels.long;
  }

  // Default fallback data
  private getDefaultForecast(habitId: string): StreakForecast {
    return {
      habitId,
      currentStreak: 0,
      predictions: { day7: 0.5, day14: 0.4, day30: 0.3 },
      riskProfile: 'medium',
      keyRiskFactors: [{
        factor: 'Insufficient data for analysis',
        impact: 0.5,
        mitigation: 'Track consistently for better predictions'
      }],
      streakSustainabilityScore: 50,
      optimalInterventions: ['Start with consistency over complexity'],
      nextCriticalDate: null
    };
  }
}

// Export singleton instance
export const streakPredictor = new StreakPredictionEngine();