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

// New interfaces for template-based habit creation
export interface HabitConcept {
  concept: string; // e.g., "Daily Reading", "Morning Exercise"
  icon: string;
  description: string;
  defaultAction: string; // e.g., "read 20 pages", "do 30 push-ups"
  defaultTiming: string; // e.g., "with morning coffee", "right after waking up"
  category: 'physical' | 'mental' | 'creative' | 'social' | 'productive';
}

export interface HabitTemplate {
  action: string;
  timing: string;
  goal: string;
}

export interface HabitConceptsResponse {
  concepts: HabitConcept[];
  summary: string;
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
  static getFallbackHabits(goalCategory: string, goalTitle?: string): HabitSuggestion[] {
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

    // Generate goal-specific habits if goalTitle is provided
    if (goalTitle) {
      const smartHabits = this.generateSmartFallbacks(goalTitle, goalCategory);
      if (smartHabits.length > 0) {
        return smartHabits;
      }
    }

    return fallbacks[goalCategory] || fallbacks.personal;
  }

  /**
   * Generate contextual fallback habits based on goal title keywords
   */
  private static generateSmartFallbacks(goalTitle: string, goalCategory: string): HabitSuggestion[] {
    const title = goalTitle.toLowerCase();
    const habits: HabitSuggestion[] = [];

    // Health-related keywords
    const healthPatterns = {
      'weight': [
        { habit: 'Track daily weight', schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Monitor weight progress consistently' }},
        { habit: 'Plan healthy meals', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Prepare nutritious meals in advance' }},
        { habit: 'Do 30 minutes of cardio', schedule: { frequency: 'custom', timesPerWeek: 4, timeOfDay: 'morning', description: 'Build cardiovascular fitness' }}
      ],
      'fitness|exercise|workout': [
        { habit: 'Complete daily workout', schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Stay consistent with fitness routine' }},
        { habit: 'Track workout progress', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Record sets, reps, and improvements' }},
        { habit: 'Stretch for 10 minutes', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Improve flexibility and recovery' }}
      ],
      'run|running|marathon': [
        { habit: 'Go for a daily run', schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Build running endurance' }},
        { habit: 'Track running distance', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Monitor progress toward running goals' }},
        { habit: 'Do strength training', schedule: { frequency: 'custom', timesPerWeek: 2, timeOfDay: 'evening', description: 'Support running with strength work' }}
      ],
      'meditat|mindful': [
        { habit: 'Meditate for 10 minutes', schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Start day with mindfulness' }},
        { habit: 'Practice gratitude', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Reflect on positive moments' }},
        { habit: 'Do breathing exercises', schedule: { frequency: 'daily', timeOfDay: 'anytime', description: 'Reduce stress through breathwork' }}
      ]
    };

    // Learning-related keywords
    const learningPatterns = {
      'language|spanish|french|german': [
        { habit: 'Practice language for 20 minutes', schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Consistent language practice builds fluency' }},
        { habit: 'Review vocabulary flashcards', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Reinforce new words and phrases' }},
        { habit: 'Watch foreign language content', schedule: { frequency: 'custom', timesPerWeek: 3, timeOfDay: 'evening', description: 'Improve listening comprehension' }}
      ],
      'coding|programming|code': [
        { habit: 'Code for 1 hour daily', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Build programming skills through practice' }},
        { habit: 'Complete coding challenges', schedule: { frequency: 'weekdays', timeOfDay: 'morning', description: 'Solve problems to improve logic skills' }},
        { habit: 'Read tech articles', schedule: { frequency: 'daily', timeOfDay: 'anytime', description: 'Stay updated with technology trends' }}
      ],
      'read|book|reading': [
        { habit: 'Read for 30 minutes', schedule: { frequency: 'daily', timeOfDay: 'evening', description: 'Build knowledge through consistent reading' }},
        { habit: 'Take notes on key insights', schedule: { frequency: 'daily', timeOfDay: 'anytime', description: 'Retain important information from reading' }},
        { habit: 'Discuss books with others', schedule: { frequency: 'weekly', timeOfDay: 'anytime', description: 'Deepen understanding through discussion' }}
      ]
    };

    // Career-related keywords
    const careerPatterns = {
      'network|networking': [
        { habit: 'Connect with 2 professionals daily', schedule: { frequency: 'weekdays', timeOfDay: 'afternoon', description: 'Expand professional network systematically' }},
        { habit: 'Attend networking events', schedule: { frequency: 'weekly', timeOfDay: 'evening', description: 'Meet new contacts in person' }},
        { habit: 'Follow up with contacts', schedule: { frequency: 'weekly', timeOfDay: 'morning', description: 'Maintain professional relationships' }}
      ],
      'skill|skills|learn': [
        { habit: 'Practice new skills daily', schedule: { frequency: 'daily', timeOfDay: 'morning', description: 'Consistent practice builds expertise' }},
        { habit: 'Take online courses', schedule: { frequency: 'weekdays', timeOfDay: 'evening', description: 'Structured learning for skill development' }},
        { habit: 'Apply skills in projects', schedule: { frequency: 'weekly', timeOfDay: 'anytime', description: 'Reinforce learning through application' }}
      ]
    };

    // Match patterns to goal title
    const allPatterns = { ...healthPatterns, ...learningPatterns, ...careerPatterns };

    for (const [pattern, patternHabits] of Object.entries(allPatterns)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(title)) {
        habits.push(...patternHabits);
        break; // Use first match to avoid overwhelming user
      }
    }

    // If no specific patterns matched, generate generic goal-focused habits
    if (habits.length === 0) {
      const goalWords = title.split(' ').filter(word => word.length > 3);
      const primaryWord = goalWords[0] || 'goal';

      habits.push(
        {
          habit: `Work on ${primaryWord} daily`,
          schedule: { frequency: 'daily', timeOfDay: 'morning', description: `Consistent progress toward your ${primaryWord}` }
        },
        {
          habit: `Track ${primaryWord} progress`,
          schedule: { frequency: 'daily', timeOfDay: 'evening', description: `Monitor your ${primaryWord} development` }
        },
        {
          habit: `Review ${primaryWord} strategy weekly`,
          schedule: { frequency: 'weekly', timeOfDay: 'morning', description: `Plan and adjust your ${primaryWord} approach` }
        }
      );
    }

    return habits.slice(0, 3); // Return top 3 habits
  }

  /**
   * Get habit concepts for template-based habit creation
   */
  static getHabitConcepts(goalTitle: string, goalCategory: string): HabitConcept[] {
    const title = goalTitle.toLowerCase();
    const concepts: HabitConcept[] = [];

    // Health and fitness concepts
    const healthConcepts: HabitConcept[] = [
      {
        concept: 'Daily Movement',
        icon: '🏃',
        description: 'Build physical activity into your routine',
        defaultAction: 'do 30 minutes of exercise',
        defaultTiming: 'first thing in the morning',
        category: 'physical'
      },
      {
        concept: 'Mindful Eating',
        icon: '🥗',
        description: 'Develop healthier eating habits',
        defaultAction: 'plan and prep my meals',
        defaultTiming: 'every Sunday morning',
        category: 'physical'
      },
      {
        concept: 'Daily Hydration',
        icon: '💧',
        description: 'Stay properly hydrated throughout the day',
        defaultAction: 'drink a full glass of water',
        defaultTiming: 'when I wake up and before each meal',
        category: 'physical'
      }
    ];

    // Learning concepts
    const learningConcepts: HabitConcept[] = [
      {
        concept: 'Daily Learning',
        icon: '📚',
        description: 'Consistent knowledge building',
        defaultAction: 'read for 30 minutes',
        defaultTiming: 'with my morning coffee',
        category: 'mental'
      },
      {
        concept: 'Skill Practice',
        icon: '🎯',
        description: 'Deliberate practice of specific skills',
        defaultAction: 'practice my target skill',
        defaultTiming: 'for 25 minutes after work',
        category: 'mental'
      },
      {
        concept: 'Knowledge Review',
        icon: '🧠',
        description: 'Reinforce what you\'ve learned',
        defaultAction: 'review my notes and key insights',
        defaultTiming: 'before bed for 10 minutes',
        category: 'mental'
      }
    ];

    // Career concepts
    const careerConcepts: HabitConcept[] = [
      {
        concept: 'Professional Growth',
        icon: '📈',
        description: 'Invest in your career development',
        defaultAction: 'work on career-building activities',
        defaultTiming: 'for 30 minutes before work',
        category: 'productive'
      },
      {
        concept: 'Network Building',
        icon: '🤝',
        description: 'Expand your professional connections',
        defaultAction: 'reach out to one professional contact',
        defaultTiming: 'during my lunch break',
        category: 'social'
      },
      {
        concept: 'Skill Development',
        icon: '⚡',
        description: 'Stay current with industry skills',
        defaultAction: 'learn something new in my field',
        defaultTiming: 'for 20 minutes in the evening',
        category: 'productive'
      }
    ];

    // Personal development concepts
    const personalConcepts: HabitConcept[] = [
      {
        concept: 'Self Reflection',
        icon: '🪞',
        description: 'Build self-awareness through reflection',
        defaultAction: 'write in my journal',
        defaultTiming: 'before bed for 10 minutes',
        category: 'mental'
      },
      {
        concept: 'Creative Expression',
        icon: '🎨',
        description: 'Nurture your creative side',
        defaultAction: 'spend time on creative work',
        defaultTiming: 'in the evening when I feel inspired',
        category: 'creative'
      },
      {
        concept: 'Mindfulness Practice',
        icon: '🧘',
        description: 'Cultivate presence and calm',
        defaultAction: 'meditate or practice mindfulness',
        defaultTiming: 'for 10 minutes after waking up',
        category: 'mental'
      }
    ];

    // Select concepts based on goal category and keywords
    if (goalCategory === 'health') {
      concepts.push(...healthConcepts);
    } else if (goalCategory === 'learning') {
      concepts.push(...learningConcepts);
    } else if (goalCategory === 'career') {
      concepts.push(...careerConcepts);
    } else if (goalCategory === 'personal') {
      concepts.push(...personalConcepts);
    }

    // Add contextual concepts based on goal keywords
    if (/weight|fitness|exercise|health/i.test(title)) {
      concepts.unshift(...healthConcepts.slice(0, 2));
    }

    if (/read|learn|study|language|skill/i.test(title)) {
      concepts.unshift(...learningConcepts.slice(0, 2));
    }

    if (/career|job|professional|network/i.test(title)) {
      concepts.unshift(...careerConcepts.slice(0, 2));
    }

    if (/mindful|meditat|journal|reflect/i.test(title)) {
      concepts.unshift(...personalConcepts.filter(c => c.category === 'mental'));
    }

    // Remove duplicates and limit to top 3
    const uniqueConcepts = concepts.filter((concept, index, self) =>
      index === self.findIndex(c => c.concept === concept.concept)
    );

    return uniqueConcepts.slice(0, 3);
  }

  /**
   * Generate smart defaults for habit template based on concept and goal
   */
  static generateTemplateDefaults(
    concept: HabitConcept,
    goalTitle: string,
    goalCategory: string
  ): { action: string; timing: string } {
    let action = concept.defaultAction;
    let timing = concept.defaultTiming;

    // Customize based on goal specifics
    const title = goalTitle.toLowerCase();

    // Customize action based on goal keywords
    if (concept.concept === 'Daily Learning' && /language|spanish|french|german/i.test(title)) {
      action = 'practice my target language for 20 minutes';
    }

    if (concept.concept === 'Daily Movement' && /weight|lose|fitness/i.test(title)) {
      action = 'do cardio exercise for 30 minutes';
    }

    if (concept.concept === 'Daily Movement' && /strength|muscle|build/i.test(title)) {
      action = 'do strength training for 45 minutes';
    }

    if (concept.concept === 'Skill Practice' && /code|programming/i.test(title)) {
      action = 'practice coding for 1 hour';
      timing = 'in the evening after work';
    }

    if (concept.concept === 'Creative Expression' && /write|writing|novel|book/i.test(title)) {
      action = 'write for 30 minutes';
      timing = 'first thing in the morning';
    }

    return { action, timing };
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
      const fallbackHabits = HabitSuggestionsService.getFallbackHabits(request.goalCategory, request.goalTitle);
      setSuggestions(fallbackHabits);
      setSummary(`Smart habit suggestions for "${request.goalTitle}". AI suggestions temporarily unavailable.`);

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