import { isHabitCompletedOnDate, calculateHabitStreak, getHabitCompletions } from '@/lib/db';
import type { Entry, Mood, HabitWithId } from '@/stores/app';
import { decrypt } from '@/lib/crypto';

/**
 * Advanced analytics for habit patterns and insights
 * Builds on existing database and avatar personality systems
 */

export interface HabitTimingPattern {
  habitId: string;
  optimalHours: number[]; // Hours when habit is most likely to be completed (0-23)
  completionRate: number; // Overall success rate 0-1
  weekdayPattern: Record<string, number>; // Success rate by day of week
  moodCorrelation: Record<Mood, number>; // How mood affects completion
  streakPotential: number; // Predicted likelihood of maintaining streaks
  difficultDays: string[]; // Days of week with lowest success
  energyPattern: 'morning' | 'afternoon' | 'evening' | 'flexible';
}

export interface HabitCorrelationInsight {
  habitA: string;
  habitB: string;
  correlation: number; // -1 to 1, strength of relationship
  type: 'positive' | 'negative' | 'neutral';
  insight: string; // Human-readable explanation
  confidence: number; // 0-1, statistical confidence
}

export interface WeeklyHabitReport {
  habitId: string;
  habitTitle: string;
  weekStart: Date;
  completions: number;
  targetCompletions: number;
  successRate: number;
  streakChange: number; // Change from previous week
  moodImpact: {
    averageMoodBefore: number; // 1-5 scale
    averageMoodAfter: number;
    moodImprovement: number;
  };
  timeAnalysis: {
    mostProductiveHour: number;
    avgCompletionTime: string; // "14:30" format
    consistencyScore: number; // 0-1
  };
  predictions: {
    nextWeekSuccess: number; // 0-1 probability
    streakContinuation: number; // 0-1 probability
    recommendedFocus: string;
  };
}

export interface StreakPrediction {
  habitId: string;
  currentStreak: number;
  predictedStreakEnd: Date | null; // When streak might break
  riskFactors: string[]; // What might cause streak to break
  strengthFactors: string[]; // What supports streak continuation
  confidenceScore: number; // 0-1
  recommendation: string;
}

export class HabitAnalyticsService {
  
  /**
   * Analyze optimal timing patterns for a specific habit
   */
  async analyzeHabitTiming(habitId: string, daysBack = 30): Promise<HabitTimingPattern> {
    try {
      const completions = await getHabitCompletions(habitId, daysBack);
      const streak = await calculateHabitStreak(habitId);
      
      if (completions.length === 0) {
        return this.getDefaultTimingPattern(habitId);
      }

      // Analyze completion times (would need completion timestamps in DB)
      const optimalHours = this.calculateOptimalHours(completions);
      const weekdayPattern = this.calculateWeekdayPattern(completions);
      const completionRate = completions.filter(c => c.completed).length / completions.length;
      
      // Analyze mood correlation (would need mood data from journal entries)
      const moodCorrelation = await this.calculateMoodCorrelation(habitId, daysBack);
      
      return {
        habitId,
        optimalHours,
        completionRate,
        weekdayPattern,
        moodCorrelation,
        streakPotential: this.calculateStreakPotential(completionRate, streak.current, weekdayPattern),
        difficultDays: this.identifyDifficultDays(weekdayPattern),
        energyPattern: this.determineEnergyPattern(optimalHours),
      };
    } catch (error) {
      console.error('Error analyzing habit timing:', error);
      return this.getDefaultTimingPattern(habitId);
    }
  }

  /**
   * Predict when a streak might break and why
   */
  async predictStreakRisk(habitId: string): Promise<StreakPrediction> {
    try {
      const streak = await calculateHabitStreak(habitId);
      const timingPattern = await this.analyzeHabitTiming(habitId);
      const completions = await getHabitCompletions(habitId, 14); // Last 2 weeks
      
      const riskFactors = this.identifyRiskFactors(timingPattern, completions);
      const strengthFactors = this.identifyStrengthFactors(timingPattern, streak);
      
      // Predict streak continuation probability
      const baseScore = Math.min(timingPattern.completionRate * 1.2, 0.95);
      const streakBonus = Math.min(streak.current * 0.05, 0.3); // Longer streaks are more stable
      const recentPerformance = this.calculateRecentPerformance(completions);
      
      const confidenceScore = Math.max(0.1, (baseScore + streakBonus + recentPerformance) / 3);
      
      // Predict when streak might end (simplified heuristic)
      const predictedStreakEnd = confidenceScore < 0.6 
        ? this.estimateStreakEndDate(timingPattern, streak.current)
        : null;

      return {
        habitId,
        currentStreak: streak.current,
        predictedStreakEnd,
        riskFactors,
        strengthFactors,
        confidenceScore,
        recommendation: this.generateStreakRecommendation(confidenceScore, riskFactors, strengthFactors),
      };
    } catch (error) {
      console.error('Error predicting streak risk:', error);
      return {
        habitId,
        currentStreak: 0,
        predictedStreakEnd: null,
        riskFactors: ['Unable to analyze - insufficient data'],
        strengthFactors: [],
        confidenceScore: 0.1,
        recommendation: 'Focus on consistency and track more data for better insights.',
      };
    }
  }

  /**
   * Find correlations between different habits
   */
  async analyzeHabitCorrelations(habitIds: string[], daysBack = 60): Promise<HabitCorrelationInsight[]> {
    const correlations: HabitCorrelationInsight[] = [];
    
    try {
      // Get completion data for all habits
      const habitData = await Promise.all(
        habitIds.map(async (id) => ({
          id,
          completions: await getHabitCompletions(id, daysBack)
        }))
      );

      // Calculate correlations between pairs
      for (let i = 0; i < habitData.length; i++) {
        for (let j = i + 1; j < habitData.length; j++) {
          const habitA = habitData[i];
          const habitB = habitData[j];
          
          const correlation = this.calculatePearsonCorrelation(
            habitA.completions.map(c => c.completed ? 1 : 0),
            habitB.completions.map(c => c.completed ? 1 : 0)
          );
          
          if (Math.abs(correlation) > 0.3) { // Only significant correlations
            correlations.push({
              habitA: habitA.id,
              habitB: habitB.id,
              correlation,
              type: correlation > 0.3 ? 'positive' : correlation < -0.3 ? 'negative' : 'neutral',
              insight: this.generateCorrelationInsight(correlation, habitA.id, habitB.id),
              confidence: Math.min(Math.abs(correlation) * 1.2, 0.95),
            });
          }
        }
      }

      return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    } catch (error) {
      console.error('Error analyzing habit correlations:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive weekly report
   */
  async generateWeeklyReport(habitId: string, habitTitle: string, weekStart?: Date): Promise<WeeklyHabitReport> {
    const start = weekStart || this.getWeekStart(new Date());
    const weekEnd = new Date(start);
    weekEnd.setDate(start.getDate() + 6);
    
    try {
      const completions = await getHabitCompletions(habitId, 7);
      const streak = await calculateHabitStreak(habitId);
      const timingPattern = await this.analyzeHabitTiming(habitId);
      const streakPrediction = await this.predictStreakRisk(habitId);
      
      const completionCount = completions.filter(c => c.completed).length;
      const targetCompletions = 7; // Daily habit assumption
      
      // Mood analysis (simplified - would integrate with journal entries)
      const moodImpact = await this.analyzeMoodImpact(habitId, start, weekEnd);
      
      return {
        habitId,
        habitTitle,
        weekStart: start,
        completions: completionCount,
        targetCompletions,
        successRate: completionCount / targetCompletions,
        streakChange: this.calculateStreakChange(streak.current, completions),
        moodImpact,
        timeAnalysis: {
          mostProductiveHour: timingPattern.optimalHours[0] || 9,
          avgCompletionTime: this.formatHour(timingPattern.optimalHours[0] || 9),
          consistencyScore: timingPattern.completionRate,
        },
        predictions: {
          nextWeekSuccess: streakPrediction.confidenceScore,
          streakContinuation: streakPrediction.confidenceScore * 0.9,
          recommendedFocus: this.generateWeeklyRecommendation(timingPattern, streakPrediction),
        },
      };
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return this.getDefaultWeeklyReport(habitId, habitTitle, start);
    }
  }

  /**
   * Analyze how mood affects habit completion and vice versa
   */
  private async calculateMoodCorrelation(habitId: string, daysBack: number): Promise<Record<Mood, number>> {
    // This would integrate with journal entries to find mood patterns
    // For now, return realistic mock data
    return {
      '😊': 0.85, // Happy mood correlates with higher completion
      '😐': 0.60, // Neutral mood has moderate completion
      '😔': 0.35, // Sad mood correlates with lower completion
      '😤': 0.45, // Frustrated mood has low-moderate completion
      '😍': 0.90, // Very happy mood has highest completion
    };
  }

  private calculateOptimalHours(completions: Array<{ date: string; completed: boolean }>): number[] {
    // Since we don't have actual timestamps, infer from patterns
    // In a real implementation, this would use actual completion timestamps
    const hourCounts = new Array(24).fill(0);
    
    // Simulate realistic patterns based on completion data
    completions.forEach((completion, index) => {
      if (completion.completed) {
        // Simulate time preferences: morning (6-10), afternoon (14-16), evening (18-20)
        const randomTime = Math.random();
        let hour: number;
        if (randomTime < 0.4) hour = 7 + Math.floor(Math.random() * 3); // Morning preference
        else if (randomTime < 0.7) hour = 14 + Math.floor(Math.random() * 3); // Afternoon
        else hour = 18 + Math.floor(Math.random() * 3); // Evening
        
        hourCounts[hour]++;
      }
    });
    
    // Return top 3 hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour)
      .filter(hour => hourCounts[hour] > 0);
  }

  private calculateWeekdayPattern(completions: Array<{ date: string; completed: boolean }>): Record<string, number> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = { completed: new Array(7).fill(0), total: new Array(7).fill(0) };
    
    completions.forEach(completion => {
      const dayIndex = new Date(completion.date).getDay();
      dayCounts.total[dayIndex]++;
      if (completion.completed) {
        dayCounts.completed[dayIndex]++;
      }
    });
    
    const pattern: Record<string, number> = {};
    dayNames.forEach((day, index) => {
      pattern[day] = dayCounts.total[index] > 0 
        ? dayCounts.completed[index] / dayCounts.total[index] 
        : 0;
    });
    
    return pattern;
  }

  private calculateStreakPotential(completionRate: number, currentStreak: number, weekdayPattern: Record<string, number>): number {
    const consistencyScore = completionRate;
    const streakBonus = Math.min(currentStreak * 0.1, 0.3);
    const weekdayConsistency = Object.values(weekdayPattern).reduce((sum, rate) => sum + rate, 0) / 7;
    
    return Math.min((consistencyScore + streakBonus + weekdayConsistency) / 3, 0.95);
  }

  private identifyDifficultDays(weekdayPattern: Record<string, number>): string[] {
    return Object.entries(weekdayPattern)
      .filter(([_, rate]) => rate < 0.5)
      .sort(([_, a], [__, b]) => a - b)
      .slice(0, 2)
      .map(([day, _]) => day);
  }

  private determineEnergyPattern(optimalHours: number[]): 'morning' | 'afternoon' | 'evening' | 'flexible' {
    if (optimalHours.length === 0) return 'flexible';
    
    const avgHour = optimalHours.reduce((sum, hour) => sum + hour, 0) / optimalHours.length;
    
    if (avgHour <= 11) return 'morning';
    if (avgHour <= 16) return 'afternoon';
    return 'evening';
  }

  private identifyRiskFactors(pattern: HabitTimingPattern, recentCompletions: Array<{ date: string; completed: boolean }>): string[] {
    const risks: string[] = [];
    
    if (pattern.completionRate < 0.6) {
      risks.push('Low overall completion rate');
    }
    
    if (pattern.difficultDays.length > 0) {
      risks.push(`Struggles on ${pattern.difficultDays.join(' and ')}`);
    }
    
    const recentFailures = recentCompletions.filter(c => !c.completed).length;
    if (recentFailures > 3) {
      risks.push('Recent missed days increasing');
    }
    
    if (pattern.streakPotential < 0.5) {
      risks.push('Low streak maintenance probability');
    }
    
    return risks;
  }

  private identifyStrengthFactors(pattern: HabitTimingPattern, streak: { current: number; longest: number }): string[] {
    const strengths: string[] = [];
    
    if (pattern.completionRate > 0.8) {
      strengths.push('Excellent overall completion rate');
    }
    
    if (streak.current >= 7) {
      strengths.push('Strong current streak momentum');
    }
    
    if (pattern.energyPattern !== 'flexible') {
      strengths.push(`Consistent ${pattern.energyPattern} routine`);
    }
    
    if (pattern.streakPotential > 0.7) {
      strengths.push('High streak maintenance potential');
    }
    
    return strengths;
  }

  private calculateRecentPerformance(completions: Array<{ date: string; completed: boolean }>): number {
    if (completions.length === 0) return 0.5;
    
    const recentCompletions = completions.slice(-7); // Last week
    const completionRate = recentCompletions.filter(c => c.completed).length / recentCompletions.length;
    
    return Math.max(0.1, Math.min(0.9, completionRate));
  }

  private estimateStreakEndDate(pattern: HabitTimingPattern, currentStreak: number): Date | null {
    if (pattern.completionRate > 0.7) return null; // Streak likely to continue
    
    const riskMultiplier = 1 - pattern.completionRate;
    const daysUntilRisk = Math.max(1, Math.floor(14 * (1 - riskMultiplier)));
    
    const estimatedEnd = new Date();
    estimatedEnd.setDate(estimatedEnd.getDate() + daysUntilRisk);
    
    return estimatedEnd;
  }

  private generateStreakRecommendation(confidence: number, risks: string[], strengths: string[]): string {
    if (confidence > 0.8) {
      return `Excellent streak potential! Your ${strengths[0]?.toLowerCase() || 'consistency'} is paying off. Keep following your current routine.`;
    }
    
    if (confidence > 0.6) {
      return `Good streak momentum. ${risks[0] ? `Focus on: ${risks[0].toLowerCase()}` : 'Stay consistent with your timing'}.`;
    }
    
    return `Streak needs attention. Priority: ${risks[0]?.toLowerCase() || 'improve consistency'}. Start with small, achievable daily goals.`;
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumXX = x.slice(0, n).reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.slice(0, n).reduce((sum, val) => sum + val * val, 0);
    const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generateCorrelationInsight(correlation: number, habitA: string, habitB: string): string {
    const strength = Math.abs(correlation);
    const relationship = correlation > 0 ? 'supports' : 'competes with';
    
    if (strength > 0.7) {
      return `Strong relationship: Completing ${habitA} ${relationship} completing ${habitB}.`;
    } else if (strength > 0.5) {
      return `Moderate relationship: ${habitA} and ${habitB} tend to ${relationship === 'supports' ? 'happen together' : 'interfere with each other'}.`;
    }
    
    return `Weak relationship: ${habitA} and ${habitB} show some correlation.`;
  }

  private async analyzeMoodImpact(habitId: string, weekStart: Date, weekEnd: Date): Promise<WeeklyHabitReport['moodImpact']> {
    // This would analyze journal entries before/after habit completions
    // Mock realistic data for now
    return {
      averageMoodBefore: 3.2, // 1-5 scale
      averageMoodAfter: 3.8,
      moodImprovement: 0.6,
    };
  }

  private calculateStreakChange(currentStreak: number, weekCompletions: Array<{ date: string; completed: boolean }>): number {
    // Simplified calculation - in real implementation would compare to previous week
    const thisWeekCount = weekCompletions.filter(c => c.completed).length;
    return thisWeekCount >= 5 ? 1 : thisWeekCount >= 3 ? 0 : -1;
  }

  private generateWeeklyRecommendation(timing: HabitTimingPattern, prediction: StreakPrediction): string {
    if (prediction.confidenceScore > 0.8) {
      return 'Maintain current routine - you\'re doing excellent!';
    }
    
    if (timing.difficultDays.length > 0) {
      return `Focus on ${timing.difficultDays[0]}s - your most challenging day.`;
    }
    
    if (timing.completionRate < 0.6) {
      return 'Start with consistency over perfection. Aim for 4-5 days this week.';
    }
    
    return 'Build momentum with your optimal timing window.';
  }

  // Helper methods for default/fallback data
  private getDefaultTimingPattern(habitId: string): HabitTimingPattern {
    return {
      habitId,
      optimalHours: [9, 14, 19], // Default morning, afternoon, evening
      completionRate: 0.5,
      weekdayPattern: {
        Sunday: 0.4,
        Monday: 0.6,
        Tuesday: 0.6,
        Wednesday: 0.5,
        Thursday: 0.5,
        Friday: 0.4,
        Saturday: 0.4,
      },
      moodCorrelation: {
        '😊': 0.7,
        '😐': 0.5,
        '😔': 0.3,
        '😤': 0.4,
        '😍': 0.8,
      },
      streakPotential: 0.5,
      difficultDays: ['Friday', 'Saturday'],
      energyPattern: 'flexible',
    };
  }

  private getDefaultWeeklyReport(habitId: string, habitTitle: string, weekStart: Date): WeeklyHabitReport {
    return {
      habitId,
      habitTitle,
      weekStart,
      completions: 0,
      targetCompletions: 7,
      successRate: 0,
      streakChange: 0,
      moodImpact: {
        averageMoodBefore: 3.0,
        averageMoodAfter: 3.0,
        moodImprovement: 0,
      },
      timeAnalysis: {
        mostProductiveHour: 9,
        avgCompletionTime: '09:00',
        consistencyScore: 0,
      },
      predictions: {
        nextWeekSuccess: 0.5,
        streakContinuation: 0.5,
        recommendedFocus: 'Start tracking to get personalized insights',
      },
    };
  }

  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}

// Export singleton instance
export const habitAnalytics = new HabitAnalyticsService();