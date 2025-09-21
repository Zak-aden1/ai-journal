import { useState } from 'react';
import { checkAIUsageRemaining, incrementAIUsage } from '@/lib/db';

// Types matching the backend API
export interface GoalCreationRequest {
  userInput: string;
  userId: string;
  context: {
    avatarType: 'plant' | 'pet' | 'robot' | 'base';
    avatarName: string;
    existingGoals?: Array<{ title: string; category: string }>;
    goalCategory?: string;
  };
}

export interface SmartRating {
  stars: 1 | 2 | 3 | 4 | 5;
  missing: string[];
  feedback: string;
}

export interface GoalCreationResponse {
  enhanced: string;
  originalRating: SmartRating;
  improvements: {
    alternatives: string[];
    reasoning: string;
  };
  suggestedCategory: string;
  suggestedHabits: string[];
  contextWarnings?: string[];
  usageRemaining: number;
}

export interface GoalEnhancementError {
  error: string;
  code?: 'RATE_LIMITED' | 'API_ERROR' | 'NETWORK_ERROR';
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * Enhanced goal creation service with AI assistance
 */
export class GoalCreationService {
  /**
   * Check how many AI enhancements the user has remaining today
   */
  static async checkUsageRemaining(userId: string): Promise<number> {
    try {
      return await checkAIUsageRemaining(userId);
    } catch (error) {
      console.error('Error checking AI usage:', error);
      return 0; // Conservative fallback
    }
  }

  /**
   * Enhance a user's goal input with AI assistance
   */
  static async enhanceGoal(request: GoalCreationRequest): Promise<GoalCreationResponse | GoalEnhancementError> {
    try {
      // Check rate limiting first
      const remaining = await this.checkUsageRemaining(request.userId);
      if (remaining <= 0) {
        return {
          error: 'Daily AI enhancement limit reached. Try again tomorrow!',
          code: 'RATE_LIMITED'
        };
      }

      // Make API request to backend
      const response = await fetch(`${BACKEND_URL}/api/goal-creation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return {
            error: 'Daily AI enhancement limit reached. Try again tomorrow!',
            code: 'RATE_LIMITED'
          };
        }

        throw new Error(`API error: ${response.status}`);
      }

      const result: GoalCreationResponse = await response.json();

      // Increment local usage count
      await incrementAIUsage(request.userId);

      return result;

    } catch (error) {
      console.error('Goal enhancement error:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          error: 'Unable to connect to AI service. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        };
      }

      return {
        error: 'AI enhancement temporarily unavailable. Please try again later.',
        code: 'API_ERROR'
      };
    }
  }

  /**
   * Get star rating display for UI
   */
  static getStarDisplay(stars: number): string {
    const filledStar = '⭐';
    const emptyStar = '☆';

    return filledStar.repeat(stars) + emptyStar.repeat(5 - stars);
  }

  /**
   * Get star rating color for UI theming
   */
  static getStarColor(stars: number): string {
    if (stars >= 5) return '#22c55e'; // Green
    if (stars >= 4) return '#3b82f6'; // Blue
    if (stars >= 3) return '#f59e0b'; // Yellow
    if (stars >= 2) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get user-friendly feedback based on star rating
   */
  static getStarFeedback(stars: number): string {
    switch (stars) {
      case 5: return 'Perfect SMART goal!';
      case 4: return 'Nearly there! Just needs a small tweak.';
      case 3: return 'Good foundation, can be improved.';
      case 2: return 'Needs some work to be actionable.';
      case 1: return 'Let\'s make this clearer and more specific.';
      default: return 'Invalid rating';
    }
  }

  /**
   * Validate goal input before sending to AI
   */
  static validateGoalInput(input: string): { isValid: boolean; error?: string } {
    if (!input.trim()) {
      return { isValid: false, error: 'Please enter a goal first' };
    }

    if (input.trim().length < 3) {
      return { isValid: false, error: 'Goal should be at least 3 characters' };
    }

    if (input.length > 200) {
      return { isValid: false, error: 'Goal should be less than 200 characters' };
    }

    return { isValid: true };
  }

  /**
   * Format goal alternatives for display
   */
  static formatAlternatives(alternatives: string[]): string[] {
    return alternatives
      .filter(alt => alt.trim().length > 0)
      .slice(0, 3) // Limit to top 3
      .map(alt => alt.trim());
  }

  /**
   * Format suggested habits for display
   */
  static formatSuggestedHabits(habits: string[]): string[] {
    return habits
      .filter(habit => habit.trim().length > 0)
      .slice(0, 4) // Limit to top 4
      .map(habit => habit.trim());
  }
}

/**
 * React Hook for goal enhancement
 */
export function useGoalEnhancement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  const enhanceGoal = async (request: GoalCreationRequest): Promise<GoalCreationResponse | null> => {
    setIsLoading(true);
    setError(null);

    const result = await GoalCreationService.enhanceGoal(request);

    if ('error' in result) {
      // Provide more specific error messages based on error code
      let userFriendlyError = result.error;

      switch (result.code) {
        case 'RATE_LIMITED':
          userFriendlyError = 'Daily AI limit reached (10/10 uses). Try again tomorrow!';
          break;
        case 'NETWORK_ERROR':
          userFriendlyError = 'Connection failed. Check your internet and try again.';
          break;
        case 'API_ERROR':
          userFriendlyError = 'AI service temporarily unavailable. Please try again in a moment.';
          break;
        default:
          userFriendlyError = result.error;
      }

      setError(userFriendlyError);
      setIsLoading(false);
      return null;
    }

    setUsageRemaining(result.usageRemaining);
    setIsLoading(false);
    return result;
  };

  const checkUsage = async (userId: string) => {
    const remaining = await GoalCreationService.checkUsageRemaining(userId);
    setUsageRemaining(remaining);
  };

  return {
    enhanceGoal,
    checkUsage,
    isLoading,
    error,
    usageRemaining,
    clearError: () => setError(null)
  };
}