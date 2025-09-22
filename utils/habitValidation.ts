/**
 * Utility functions for habit validation and duplicate detection
 */

export interface HabitSimilarity {
  isSimilar: boolean;
  similarHabit?: string;
  reason?: string;
  confidence: number; // 0-1 scale
}

/**
 * Normalize habit text for comparison
 */
function normalizeHabitText(habit: string): string {
  return habit
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(a|an|the|and|or|for|to|of|in|on|at|with|by)\b/g, '') // Remove common words
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity ratio between two strings
 */
function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Extract keywords from habit text
 */
function extractKeywords(habit: string): string[] {
  const normalized = normalizeHabitText(habit);
  const words = normalized.split(' ').filter(word => word.length > 2);

  // Remove very common words that don't help with similarity
  const stopWords = ['minutes', 'times', 'daily', 'weekly', 'every', 'each'];
  return words.filter(word => !stopWords.includes(word));
}

/**
 * Calculate keyword overlap between two habits
 */
function calculateKeywordOverlap(habit1: string, habit2: string): number {
  const keywords1 = new Set(extractKeywords(habit1));
  const keywords2 = new Set(extractKeywords(habit2));

  if (keywords1.size === 0 && keywords2.size === 0) return 1;
  if (keywords1.size === 0 || keywords2.size === 0) return 0;

  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);

  return intersection.size / union.size;
}

/**
 * Check for semantic similarity using common patterns
 */
function checkSemanticSimilarity(habit1: string, habit2: string): { isSimilar: boolean; reason?: string } {
  const h1 = normalizeHabitText(habit1);
  const h2 = normalizeHabitText(habit2);

  // Check for exercise/workout patterns
  const exerciseKeywords = ['exercise', 'workout', 'gym', 'fitness', 'training'];
  const isExercise1 = exerciseKeywords.some(kw => h1.includes(kw));
  const isExercise2 = exerciseKeywords.some(kw => h2.includes(kw));
  if (isExercise1 && isExercise2) {
    return { isSimilar: true, reason: 'Both are exercise-related habits' };
  }

  // Check for reading patterns
  const readingKeywords = ['read', 'book', 'article', 'study'];
  const isReading1 = readingKeywords.some(kw => h1.includes(kw));
  const isReading2 = readingKeywords.some(kw => h2.includes(kw));
  if (isReading1 && isReading2) {
    return { isSimilar: true, reason: 'Both are reading-related habits' };
  }

  // Check for meditation/mindfulness patterns
  const mindfulnessKeywords = ['meditate', 'mindfulness', 'breathing', 'calm'];
  const isMindfulness1 = mindfulnessKeywords.some(kw => h1.includes(kw));
  const isMindfulness2 = mindfulnessKeywords.some(kw => h2.includes(kw));
  if (isMindfulness1 && isMindfulness2) {
    return { isSimilar: true, reason: 'Both are mindfulness-related habits' };
  }

  return { isSimilar: false };
}

/**
 * Main function to check if a new habit is similar to existing habits
 */
export function checkHabitSimilarity(newHabit: string, existingHabits: string[]): HabitSimilarity {
  if (!newHabit.trim() || existingHabits.length === 0) {
    return { isSimilar: false, confidence: 0 };
  }

  let highestSimilarity = 0;
  let mostSimilarHabit = '';
  let reason = '';

  for (const existingHabit of existingHabits) {
    // Skip exact matches (handled elsewhere)
    if (normalizeHabitText(newHabit) === normalizeHabitText(existingHabit)) {
      return {
        isSimilar: true,
        similarHabit: existingHabit,
        reason: 'Exact match (ignoring capitalization and punctuation)',
        confidence: 1.0
      };
    }

    // Check semantic similarity first
    const semanticCheck = checkSemanticSimilarity(newHabit, existingHabit);
    if (semanticCheck.isSimilar) {
      return {
        isSimilar: true,
        similarHabit: existingHabit,
        reason: semanticCheck.reason,
        confidence: 0.9
      };
    }

    // Calculate text similarity
    const textSimilarity = similarityRatio(
      normalizeHabitText(newHabit),
      normalizeHabitText(existingHabit)
    );

    // Calculate keyword overlap
    const keywordSimilarity = calculateKeywordOverlap(newHabit, existingHabit);

    // Combined similarity score (weighted)
    const combinedSimilarity = (textSimilarity * 0.6) + (keywordSimilarity * 0.4);

    if (combinedSimilarity > highestSimilarity) {
      highestSimilarity = combinedSimilarity;
      mostSimilarHabit = existingHabit;

      if (textSimilarity > 0.8) {
        reason = 'Very similar wording';
      } else if (keywordSimilarity > 0.7) {
        reason = 'Same key activities';
      } else {
        reason = 'Similar content';
      }
    }
  }

  // Threshold for similarity detection
  const isSignificantlySimilar = highestSimilarity > 0.65;

  return {
    isSimilar: isSignificantlySimilar,
    similarHabit: isSignificantlySimilar ? mostSimilarHabit : undefined,
    reason: isSignificantlySimilar ? reason : undefined,
    confidence: highestSimilarity
  };
}

/**
 * Validate habit input with enhanced checks
 */
export function validateHabitInput(
  habit: string,
  existingHabits: string[] = []
): { isValid: boolean; error?: string; warning?: string; similarity?: HabitSimilarity } {
  const trimmed = habit.trim();

  // Basic validation
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a habit' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Habit should be at least 3 characters long' };
  }

  if (trimmed.length > 80) {
    return { isValid: false, error: 'Habit should be less than 80 characters' };
  }

  // Check for repeated characters (spam detection)
  if (/^(.)\1{4,}/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a meaningful habit name' };
  }

  // Check for meaningful content
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Habit must contain letters or numbers' };
  }

  // Check for similarity with existing habits
  const similarity = checkHabitSimilarity(trimmed, existingHabits);

  if (similarity.isSimilar && similarity.confidence > 0.9) {
    return {
      isValid: false,
      error: `Too similar to "${similarity.similarHabit}". ${similarity.reason}.`,
      similarity
    };
  }

  if (similarity.isSimilar && similarity.confidence > 0.65) {
    return {
      isValid: true,
      warning: `Similar to "${similarity.similarHabit}". ${similarity.reason}. Continue anyway?`,
      similarity
    };
  }

  return { isValid: true, similarity };
}

/**
 * Suggest habit improvements
 */
export function suggestHabitImprovements(habit: string): string[] {
  const suggestions: string[] = [];
  const normalized = normalizeHabitText(habit);

  // Check for missing time/frequency
  if (!/\b(daily|weekly|every|times|minutes|hours|days)\b/i.test(habit)) {
    suggestions.push('Consider adding how often (daily, 3 times a week, etc.)');
  }

  // Check for missing duration
  if (!/\b\d+\s*(minutes?|hours?|mins?)\b/i.test(habit)) {
    suggestions.push('Consider adding duration (20 minutes, 1 hour, etc.)');
  }

  // Check for vague verbs
  const vagueVerbs = ['do', 'work', 'try', 'attempt'];
  if (vagueVerbs.some(verb => normalized.includes(verb))) {
    suggestions.push('Use specific action words (practice, read, exercise, write)');
  }

  return suggestions;
}