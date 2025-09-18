import { DEFAULT_AI_CONFIG } from './config';

/**
 * Habit Analysis Service
 * Provides AI-powered analytical insights about habit performance
 * Separate from conversational chat - focused on data analysis
 */

// Request types
export interface HabitCompletionRecord {
  date: string;
  completed: boolean;
  planned: boolean;
}

export interface HabitAnalysisRequest {
  habitId: string;
  habitTitle: string;
  category: string;
  avatar: {
    name: string;
    type: string;
  };
  performance: {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    successRate: number;
    weeklyCompletions: number;
    monthlyCompletions: number;
  };
  completionHistory: HabitCompletionRecord[];
  schedule: {
    isDaily: boolean;
    daysOfWeek: string[];
  };
  context: {
    isStandalone: boolean;
    goalTitle?: string;
    goalId?: string;
  };
}

// Response types
export interface HabitInsight {
  type: 'pattern' | 'streak' | 'schedule' | 'improvement' | 'celebration';
  title: string;
  insight: string;
  confidence: number;
}

export interface HabitAnalysisResponse {
  analysis: string;
  insights: HabitInsight[];
  emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise';
  vitalityImpact: number;
  avatar_name: string;
  generated_at: string;
}

class HabitAnalysisService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = DEFAULT_AI_CONFIG.baseUrl || 'http://localhost:3000';
  }

  /**
   * Generate AI analysis for a habit based on performance data
   */
  async generateAnalysis(request: HabitAnalysisRequest): Promise<HabitAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/habit-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Analysis temporarily busy. Please try again in a moment.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please check configuration.');
        } else if (response.status >= 500) {
          throw new Error('Analysis service temporarily unavailable. Please try again later.');
        }
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data: HabitAnalysisResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Habit analysis error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Unable to generate analysis right now. Please try again later.');
    }
  }

  /**
   * Build analysis request from habit data
   */
  buildAnalysisRequest(
    habitData: {
      id: string;
      title: string;
      category: string;
      streak: number;
      completedToday: boolean;
      isStandalone: boolean;
      goalTitle?: string;
      goalId?: string;
    },
    habitStats: {
      totalCompletions: number;
      longestStreak: number;
      successRate: number;
      weeklyCompletions: number;
      monthlyCompletions: number;
    },
    completionHistory: HabitCompletionRecord[],
    schedule: {
      isDaily: boolean;
      daysOfWeek: string[];
    },
    avatar: {
      name: string;
      type: string;
    }
  ): HabitAnalysisRequest {
    return {
      habitId: habitData.id,
      habitTitle: habitData.title,
      category: habitData.category,
      avatar: {
        name: avatar.name,
        type: avatar.type,
      },
      performance: {
        currentStreak: habitData.streak,
        longestStreak: habitStats.longestStreak,
        totalCompletions: habitStats.totalCompletions,
        successRate: habitStats.successRate,
        weeklyCompletions: habitStats.weeklyCompletions,
        monthlyCompletions: habitStats.monthlyCompletions,
      },
      completionHistory,
      schedule,
      context: {
        isStandalone: habitData.isStandalone,
        goalTitle: habitData.goalTitle,
        goalId: habitData.goalId,
      },
    };
  }
}

// Export singleton instance
export const habitAnalysisService = new HabitAnalysisService();

// Export convenience function
export async function generateHabitAnalysis(request: HabitAnalysisRequest): Promise<HabitAnalysisResponse> {
  return habitAnalysisService.generateAnalysis(request);
}