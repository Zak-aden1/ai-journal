import { useState } from 'react';

// Types matching the backend API
export interface HabitSuggestionsRequest {
  goalTitle: string;
  goalCategory: string;
  userId: string;
  context: {
    avatarType: 'plant' | 'pet' | 'robot' | 'base';
    avatarName: string;
    existingHabits?: string[];
  };
}

export interface HabitSuggestion {
  habit: string;
  schedule: {
    frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom';
    timesPerWeek?: number;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
    description: string;
  };
}

export interface HabitSuggestionsResponse {
  habits: HabitSuggestion[];
  summary: string;
  usageRemaining: number;
}

export interface HabitSuggestionsError {
  error: string;
  code?: 'RATE_LIMITED' | 'API_ERROR' | 'NETWORK_ERROR';
}

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

/**
 * AI-powered habit suggestion service
 */
export class HabitSuggestionsService {
  /**
   * Get AI-generated habit suggestions for a specific goal
   */
  static async getSuggestions(request: HabitSuggestionsRequest): Promise<HabitSuggestionsResponse | HabitSuggestionsError> {
    try {
      // Make API request to backend
      const response = await fetch(`${BACKEND_URL}/api/habit-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return {
            error: 'Daily AI suggestion limit reached. Try again tomorrow!',
            code: 'RATE_LIMITED'
          };
        }

        throw new Error(`API error: ${response.status}`);
      }

      const result: HabitSuggestionsResponse = await response.json();

      console.log('🤖 AI Habit Suggestions Result:', result); // Debug logging

      return result;

    } catch (error) {
      console.error('Habit suggestions error:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          error: 'Unable to connect to AI service. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        };
      }

      return {
        error: 'AI suggestions temporarily unavailable. Please try again later.',
        code: 'API_ERROR'
      };
    }
  }

  /**
   * Validate request before sending to AI
   */
  static validateRequest(request: Partial<HabitSuggestionsRequest>): { isValid: boolean; error?: string } {
    if (!request.goalTitle?.trim()) {
      return { isValid: false, error: 'Goal title is required' };
    }

    if (!request.goalCategory) {
      return { isValid: false, error: 'Goal category is required' };
    }

    if (!request.userId) {
      return { isValid: false, error: 'User ID is required' };
    }

    if (request.goalTitle.trim().length < 3) {
      return { isValid: false, error: 'Goal title should be at least 3 characters' };
    }

    return { isValid: true };
  }

  /**
   * Filter and format habit suggestions for display
   */
  static formatHabits(habits: HabitSuggestion[]): HabitSuggestion[] {
    return habits
      .filter(suggestion => suggestion.habit.trim().length > 0)
      .slice(0, 5) // Limit to top 5
      .map(suggestion => ({
        ...suggestion,
        habit: suggestion.habit.trim().replace(/^[-•*]\s*/, '').trim()
      }));
  }

  /**
   * Get fallback habits if AI fails
   */
  static getFallbackHabits(goalCategory: string): HabitSuggestion[] {
    const fallbacks: Record<string, HabitSuggestion[]> = {
      health: [
        {
          habit: 'Track daily progress',
          schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Monitor your health journey' }
        },
        {
          habit: 'Plan meals in advance',
          schedule: { frequency: 'weekly', timeOfDay: 'morning', description: 'Set yourself up for healthy eating' }
        },
        {
          habit: 'Exercise regularly',
          schedule: { frequency: 'custom', timesPerWeek: 3, timeOfDay: 'morning', description: 'Build physical fitness' }
        }
      ],
      learning: [
        {
          habit: 'Study for 30 minutes daily',
          schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Consistent learning builds expertise' }
        },
        {
          habit: 'Review progress weekly',
          schedule: { frequency: 'weekly', timeOfDay: 'evening', description: 'Reflect on what you\'ve learned' }
        },
        {
          habit: 'Practice new skills',
          schedule: { frequency: 'weekdays', timeOfDay: 'afternoon', description: 'Apply what you learn' }
        }
      ],
      career: [
        {
          habit: 'Update skills regularly',
          schedule: { frequency: 'weekdays', timeOfDay: 'morning', description: 'Stay competitive in your field' }
        },
        {
          habit: 'Network with professionals',
          schedule: { frequency: 'weekly', timeOfDay: 'anytime', description: 'Build valuable connections' }
        },
        {
          habit: 'Track achievements',
          schedule: { frequency: 'weekly', timeOfDay: 'evening', description: 'Document your professional growth' }
        }
      ],
      personal: [
        {
          habit: 'Practice daily reflection',
          schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Build self-awareness' }
        },
        {
          habit: 'Set weekly personal goals',
          schedule: { frequency: 'weekly', timeOfDay: 'morning', description: 'Plan your personal growth' }
        },
        {
          habit: 'Build positive routines',
          schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Create structure for success' }
        }
      ],
      finance: [
        {
          habit: 'Track daily expenses',
          schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Monitor your spending habits' }
        },
        {
          habit: 'Review budget weekly',
          schedule: { frequency: 'weekly', timeOfDay: 'morning', description: 'Stay on top of your finances' }
        },
        {
          habit: 'Learn about investments',
          schedule: { frequency: 'weekdays', timeOfDay: 'morning', description: 'Build financial knowledge' }
        }
      ]
    };

    return fallbacks[goalCategory] || fallbacks.personal;
  }
}

/**
 * React Hook for habit suggestions
 */
export function useHabitSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [summary, setSummary] = useState<string>('');

  const getSuggestions = async (request: HabitSuggestionsRequest): Promise<HabitSuggestion[] | null> => {
    setIsLoading(true);
    setError(null);

    // Validate request
    const validation = HabitSuggestionsService.validateRequest(request);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid request');
      setIsLoading(false);
      return null;
    }

    const result = await HabitSuggestionsService.getSuggestions(request);

    console.log('🔧 useHabitSuggestions hook - received result:', result);

    if ('error' in result) {
      // Provide more specific error messages based on error code
      let userFriendlyError = result.error;

      switch (result.code) {
        case 'RATE_LIMITED':
          userFriendlyError = 'Daily AI limit reached. Try again tomorrow!';
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

      console.log('❌ Habit suggestions hook error:', userFriendlyError);
      setError(userFriendlyError);

      // Set fallback habits on error
      const fallbackHabits = HabitSuggestionsService.getFallbackHabits(request.goalCategory);
      setSuggestions(fallbackHabits);
      setSummary('Using general habit suggestions. AI suggestions temporarily unavailable.');

      setIsLoading(false);
      return fallbackHabits;
    }

    console.log('✅ Habit suggestions hook success');
    const formattedHabits = HabitSuggestionsService.formatHabits(result.habits);
    setSuggestions(formattedHabits);
    setSummary(result.summary);
    setIsLoading(false);
    return formattedHabits;
  };

  const clearSuggestions = () => {
    setSuggestions([]);
    setSummary('');
    setError(null);
  };

  return {
    getSuggestions,
    clearSuggestions,
    isLoading,
    error,
    suggestions,
    summary,
    clearError: () => setError(null)
  };
}