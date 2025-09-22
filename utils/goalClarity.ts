export type ClarityResult = {
  score: number; // 0..5 in 0.5 steps
  stars: 1 | 2 | 3 | 4 | 5; // star rating for UI consistency
  reasons: string[]; // what is missing
  tags: string[]; // what is good
  feedback: string; // user-friendly summary
  missing: string[]; // formatted for UI consistency with AI service
};

export type GoalAnalysis = {
  isSpecific: boolean;
  isMeasurable: boolean;
  isTimebound: boolean;
  isConcise: boolean;
  isRelevant: boolean;
  hasActionVerb: boolean;
  hasNumericMetric: boolean;
  hasDeadline: boolean;
};

const SPECIFIC_VERBS = [
  'save', 'invest', 'read', 'practice', 'exercise', 'run', 'learn', 'study', 'cook', 'meditate', 'write', 'walk', 'sleep', 'drink', 'stretch',
  'complete', 'finish', 'achieve', 'reach', 'build', 'create', 'launch', 'start', 'begin', 'master', 'improve', 'develop', 'increase', 'decrease',
  'reduce', 'lose', 'gain', 'earn', 'visit', 'travel', 'meet', 'network', 'publish', 'design', 'code', 'test', 'deploy', 'optimize'
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  health: ['exercise', 'workout', 'sleep', 'run', 'walk', 'meditate', 'cook', 'healthy', 'weight', 'fitness', 'diet', 'nutrition', 'wellness', 'strength', 'cardio', 'yoga', 'stretch'],
  learning: ['read', 'learn', 'study', 'course', 'language', 'book', 'practice', 'skill', 'certification', 'degree', 'training', 'education', 'knowledge', 'research', 'experiment'],
  career: ['promote', 'manager', 'network', 'business', 'skills', 'portfolio', 'job', 'salary', 'interview', 'resume', 'leadership', 'project', 'client', 'revenue', 'startup'],
  personal: ['travel', 'relationships', 'balance', 'journal', 'gratitude', 'family', 'friends', 'hobby', 'volunteer', 'organize', 'declutter', 'budget', 'invest', 'mindfulness']
};

function hasMetric(text: string): boolean {
  return /(\$?\b\d+[\d,.]*\b\s?(%|minutes?|mins?|hours?|days?|x|times?|\/week|\/day|k|m|lbs?|kg|miles?|km)?)/i.test(text);
}

function hasTimeline(text: string): boolean {
  return /(by\s+\b\w+\b\s?\d{4}|by\s+\w+|in\s+\d+\s+(days?|weeks?|months?|years?)|within\s+\d+\s+(days?|weeks?|months?|years?)|next\s+\w+|end\s+of\s+\w+|\b\d{4}\b|Q[1-4]|spring|summer|fall|autumn|winter)/i.test(text);
}

function hasSpecificVerb(text: string): boolean {
  const lower = text.toLowerCase();
  return SPECIFIC_VERBS.some(v => new RegExp(`\\b${v}\\b`, 'i').test(lower));
}

function isLengthOk(text: string): boolean {
  return text.length > 0 && text.length <= 150; // Slightly increased for better goals
}

function matchesCategory(text: string, category: string): boolean {
  const lower = text.toLowerCase();
  const list = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.personal;
  return list.some(k => lower.includes(k));
}

function generateFeedback(score: number, tags: string[]): string {
  if (score >= 4.5) return `Excellent SMART goal! You have ${tags.join(', ').toLowerCase()} elements.`;
  if (score >= 3.5) return `Good foundation! Your goal is ${tags.join(', ').toLowerCase()}.`;
  if (score >= 2.5) return `Getting there! Add more specificity to make it actionable.`;
  if (score >= 1.5) return `Needs work. Consider adding metrics and a clear timeline.`;
  return `Let's make this clearer and more specific to set you up for success.`;
}

/**
 * Analyze goal structure and components
 */
export function analyzeGoal(title: string, category: string): GoalAnalysis {
  return {
    isSpecific: hasSpecificVerb(title),
    isMeasurable: hasMetric(title),
    isTimebound: hasTimeline(title),
    isConcise: isLengthOk(title),
    isRelevant: matchesCategory(title, category),
    hasActionVerb: hasSpecificVerb(title),
    hasNumericMetric: hasMetric(title),
    hasDeadline: hasTimeline(title)
  };
}

/**
 * Score goal clarity with enhanced feedback
 */
export function scoreGoalClarity(title: string, category: string): ClarityResult {
  const reasons: string[] = [];
  const missing: string[] = [];
  const tags: string[] = [];
  let score = 0;

  if (hasSpecificVerb(title)) {
    score += 1;
    tags.push('Specific');
  } else {
    reasons.push('Add a clear action verb (run, save, learn, etc.)');
    missing.push('Specific action verb');
  }

  if (hasMetric(title)) {
    score += 1;
    tags.push('Measurable');
  } else {
    reasons.push('Add a metric (20 minutes, $5000, 5 times/week)');
    missing.push('Measurable target');
  }

  if (hasTimeline(title)) {
    score += 1;
    tags.push('Time-bound');
  } else {
    reasons.push('Add a timeline (by December, in 6 months, next summer)');
    missing.push('Deadline or timeline');
  }

  if (isLengthOk(title)) {
    score += 1;
    tags.push('Concise');
  } else {
    reasons.push('Keep it ≤ 150 characters for clarity');
    missing.push('Appropriate length');
  }

  if (matchesCategory(title, category)) {
    score += 1;
    tags.push('Relevant');
  } else {
    reasons.push(`Align with your ${category} category goals`);
    missing.push('Category relevance');
  }

  // Round to nearest 0.5 for nicer star display, ensure 1-5 range
  const rounded = Math.max(1, Math.min(5, Math.round(score * 2) / 2));
  const stars = Math.ceil(rounded) as 1 | 2 | 3 | 4 | 5;

  return {
    score: rounded,
    stars,
    reasons,
    missing,
    tags,
    feedback: generateFeedback(rounded, tags)
  };
}

/**
 * Get fallback rating when AI is unavailable
 */
export function getFallbackGoalRating(title: string, category: string) {
  const clarity = scoreGoalClarity(title, category);
  return {
    stars: clarity.stars,
    missing: clarity.missing,
    feedback: clarity.feedback
  };
}

