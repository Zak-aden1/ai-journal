/**
 * Curated habit templates organized by category and effectiveness
 */

export interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  category: 'health' | 'learning' | 'career' | 'personal';
  timeEstimate: string;
  frequency: 'daily' | 'weekdays' | 'weekly' | '3x-week';
  difficulty: 'easy' | 'medium' | 'hard';
  impactScore: number; // 1-100
  tags: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  schedule: {
    isDaily: boolean;
    daysOfWeek: string[];
    timeType: 'anytime' | 'morning' | 'afternoon' | 'evening';
    reminder: boolean;
  };
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Health Category - High Impact Habits
  {
    id: 'walk-daily',
    name: 'Walk for 30 minutes',
    description: 'Take a brisk walk to improve cardiovascular health and mental clarity',
    category: 'health',
    timeEstimate: '30 minutes',
    frequency: 'daily',
    difficulty: 'easy',
    impactScore: 85,
    tags: ['exercise', 'cardio', 'outdoor', 'mental-health'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'anytime',
      reminder: true
    }
  },
  {
    id: 'meditate-daily',
    name: 'Meditate for 10 minutes',
    description: 'Practice mindfulness to reduce stress and improve focus',
    category: 'health',
    timeEstimate: '10 minutes',
    frequency: 'daily',
    difficulty: 'easy',
    impactScore: 90,
    tags: ['mindfulness', 'stress-relief', 'mental-health', 'focus'],
    timeOfDay: 'morning',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'morning',
      reminder: true
    }
  },
  {
    id: 'water-intake',
    name: 'Drink 8 glasses of water',
    description: 'Stay hydrated throughout the day for optimal body function',
    category: 'health',
    timeEstimate: 'Throughout day',
    frequency: 'daily',
    difficulty: 'easy',
    impactScore: 75,
    tags: ['hydration', 'health', 'energy'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'anytime',
      reminder: true
    }
  },
  {
    id: 'strength-training',
    name: 'Do strength training for 45 minutes',
    description: 'Build muscle and bone strength with resistance exercises',
    category: 'health',
    timeEstimate: '45 minutes',
    frequency: '3x-week',
    difficulty: 'medium',
    impactScore: 95,
    tags: ['strength', 'muscle', 'fitness', 'gym'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'anytime',
      reminder: true
    }
  },
  {
    id: 'sleep-schedule',
    name: 'Sleep 8 hours nightly',
    description: 'Maintain consistent sleep schedule for better recovery and health',
    category: 'health',
    timeEstimate: '8 hours',
    frequency: 'daily',
    difficulty: 'medium',
    impactScore: 95,
    tags: ['sleep', 'recovery', 'health', 'energy'],
    timeOfDay: 'evening',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      reminder: true
    }
  },

  // Learning Category - Skill Development
  {
    id: 'read-daily',
    name: 'Read for 25 minutes',
    description: 'Expand knowledge and vocabulary through consistent reading',
    category: 'learning',
    timeEstimate: '25 minutes',
    frequency: 'daily',
    difficulty: 'easy',
    impactScore: 85,
    tags: ['reading', 'knowledge', 'books', 'growth'],
    timeOfDay: 'evening',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      reminder: true
    }
  },
  {
    id: 'language-practice',
    name: 'Practice new language for 20 minutes',
    description: 'Build fluency through daily language learning practice',
    category: 'learning',
    timeEstimate: '20 minutes',
    frequency: 'daily',
    difficulty: 'medium',
    impactScore: 80,
    tags: ['language', 'communication', 'culture', 'brain-training'],
    timeOfDay: 'morning',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'morning',
      reminder: true
    }
  },
  {
    id: 'coding-practice',
    name: 'Practice coding for 1 hour',
    description: 'Improve programming skills through hands-on practice',
    category: 'learning',
    timeEstimate: '1 hour',
    frequency: 'weekdays',
    difficulty: 'medium',
    impactScore: 90,
    tags: ['coding', 'programming', 'tech-skills', 'problem-solving'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'anytime',
      reminder: true
    }
  },
  {
    id: 'online-course',
    name: 'Study online course for 45 minutes',
    description: 'Make consistent progress on skill-building courses',
    category: 'learning',
    timeEstimate: '45 minutes',
    frequency: 'weekdays',
    difficulty: 'medium',
    impactScore: 85,
    tags: ['education', 'skills', 'certification', 'growth'],
    timeOfDay: 'evening',
    schedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'evening',
      reminder: true
    }
  },

  // Career Category - Professional Development
  {
    id: 'network-weekly',
    name: 'Network with 1 new person',
    description: 'Build professional relationships for career growth',
    category: 'career',
    timeEstimate: '30 minutes',
    frequency: 'weekly',
    difficulty: 'medium',
    impactScore: 90,
    tags: ['networking', 'relationships', 'career-growth', 'opportunities'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: false,
      daysOfWeek: ['fri'],
      timeType: 'anytime',
      reminder: true
    }
  },
  {
    id: 'portfolio-update',
    name: 'Update professional portfolio',
    description: 'Keep portfolio current with latest work and achievements',
    category: 'career',
    timeEstimate: '1 hour',
    frequency: 'weekly',
    difficulty: 'easy',
    impactScore: 85,
    tags: ['portfolio', 'showcase', 'career', 'personal-brand'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: false,
      daysOfWeek: ['sun'],
      timeType: 'anytime',
      reminder: true
    }
  },
  {
    id: 'industry-reading',
    name: 'Read industry articles for 20 minutes',
    description: 'Stay current with industry trends and developments',
    category: 'career',
    timeEstimate: '20 minutes',
    frequency: 'weekdays',
    difficulty: 'easy',
    impactScore: 75,
    tags: ['industry-knowledge', 'trends', 'news', 'expertise'],
    timeOfDay: 'morning',
    schedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'morning',
      reminder: true
    }
  },
  {
    id: 'skill-development',
    name: 'Practice job-relevant skill for 30 minutes',
    description: 'Develop skills directly applicable to career advancement',
    category: 'career',
    timeEstimate: '30 minutes',
    frequency: 'weekdays',
    difficulty: 'medium',
    impactScore: 88,
    tags: ['skills', 'professional-development', 'career-growth'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'anytime',
      reminder: true
    }
  },

  // Personal Category - Life Management & Well-being
  {
    id: 'gratitude-journal',
    name: 'Write 3 gratitude items daily',
    description: 'Cultivate positive mindset through gratitude practice',
    category: 'personal',
    timeEstimate: '5 minutes',
    frequency: 'daily',
    difficulty: 'easy',
    impactScore: 80,
    tags: ['gratitude', 'positivity', 'mental-health', 'journaling'],
    timeOfDay: 'evening',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'evening',
      reminder: true
    }
  },
  {
    id: 'weekly-planning',
    name: 'Plan upcoming week goals',
    description: 'Set intentions and priorities for the week ahead',
    category: 'personal',
    timeEstimate: '30 minutes',
    frequency: 'weekly',
    difficulty: 'easy',
    impactScore: 85,
    tags: ['planning', 'goals', 'productivity', 'organization'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: false,
      daysOfWeek: ['sun'],
      timeType: 'anytime',
      reminder: true
    }
  },
  {
    id: 'deep-work',
    name: 'Focus on important task for 90 minutes',
    description: 'Dedicate uninterrupted time to high-impact activities',
    category: 'personal',
    timeEstimate: '90 minutes',
    frequency: 'weekdays',
    difficulty: 'hard',
    impactScore: 95,
    tags: ['focus', 'productivity', 'deep-work', 'achievement'],
    timeOfDay: 'morning',
    schedule: {
      isDaily: false,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeType: 'morning',
      reminder: true
    }
  },
  {
    id: 'organize-space',
    name: 'Organize living space for 15 minutes',
    description: 'Maintain clean, organized environment for better focus',
    category: 'personal',
    timeEstimate: '15 minutes',
    frequency: 'daily',
    difficulty: 'easy',
    impactScore: 70,
    tags: ['organization', 'environment', 'cleanliness', 'focus'],
    timeOfDay: 'anytime',
    schedule: {
      isDaily: true,
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: 'anytime',
      reminder: true
    }
  }
];

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category: 'health' | 'learning' | 'career' | 'personal'): HabitTemplate[] {
  return HABIT_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get templates filtered by difficulty
 */
export function getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): HabitTemplate[] {
  return HABIT_TEMPLATES.filter(template => template.difficulty === difficulty);
}

/**
 * Get top templates by impact score
 */
export function getTopImpactTemplates(count: number = 5): HabitTemplate[] {
  return HABIT_TEMPLATES
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, count);
}

/**
 * Get templates suitable for beginners (easy difficulty, high impact)
 */
export function getBeginnerFriendlyTemplates(): HabitTemplate[] {
  return HABIT_TEMPLATES
    .filter(template => template.difficulty === 'easy' && template.impactScore >= 75)
    .sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Search templates by keywords
 */
export function searchTemplates(query: string): HabitTemplate[] {
  const searchTerms = query.toLowerCase().split(' ');

  return HABIT_TEMPLATES.filter(template => {
    const searchableText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
    return searchTerms.some(term => searchableText.includes(term));
  });
}

/**
 * Get recommended templates based on goal category and user preferences
 */
export function getRecommendedTemplates(
  goalCategory: 'health' | 'learning' | 'career' | 'personal',
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  timeAvailable: 'low' | 'medium' | 'high' = 'medium'
): HabitTemplate[] {
  let templates = getTemplatesByCategory(goalCategory);

  // Filter by user level
  if (userLevel === 'beginner') {
    templates = templates.filter(t => t.difficulty === 'easy');
  } else if (userLevel === 'intermediate') {
    templates = templates.filter(t => t.difficulty === 'easy' || t.difficulty === 'medium');
  }

  // Filter by time availability
  if (timeAvailable === 'low') {
    templates = templates.filter(t => {
      const timeNum = parseInt(t.timeEstimate);
      return timeNum <= 20;
    });
  } else if (timeAvailable === 'medium') {
    templates = templates.filter(t => {
      const timeNum = parseInt(t.timeEstimate);
      return timeNum <= 45;
    });
  }

  // Sort by impact score
  return templates.sort((a, b) => b.impactScore - a.impactScore).slice(0, 6);
}