import { useAppStore } from '@/stores/app';

interface GoalData {
  id: string;
  title: string;
  habits: Array<{ id: string; title: string }>;
  why?: string;
  obstacles?: string[];
  targetDate?: string;
  category?: string;
}

interface EnhancementSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: () => void;
}

export function calculateGoalCompleteness(goal: GoalData, goalMeta?: any): number {
  let score = 20; // Base score for having a goal
  
  // Goal title quality (max 10 points)
  if (goal.title.length > 10) score += 5;
  if (goal.title.length > 20) score += 5;
  
  // Has habits (max 25 points)
  if (goal.habits.length > 0) {
    score += Math.min(25, goal.habits.length * 8);
  }
  
  // Has deep why (max 20 points)
  if (goalMeta?.why_text) {
    const whyLength = goalMeta.why_text.length;
    if (whyLength > 20) score += 10;
    if (whyLength > 100) score += 10;
  }
  
  // Has obstacles identified (max 15 points)
  if (goalMeta?.obstacles && goalMeta.obstacles.length > 0) {
    score += Math.min(15, goalMeta.obstacles.length * 5);
  }
  
  // Has target date (max 10 points)
  if (goalMeta?.targetDate || goal.targetDate) {
    score += 10;
  }
  
  return Math.min(100, score);
}

export function generateEnhancementSuggestions(
  goal: GoalData, 
  goalMeta?: any,
  onOpenGoalDetails?: () => void,
  onCreateHabit?: () => void,
  onAddWhy?: () => void
): EnhancementSuggestion[] {
  const suggestions: EnhancementSuggestion[] = [];
  
  // Need more habits
  if (goal.habits.length === 0) {
    suggestions.push({
      id: 'add-first-habit',
      title: 'Add your first habit',
      description: 'Break down your goal into small, daily actions that move you forward.',
      impact: 'high',
      action: onCreateHabit || (() => {}),
    });
  } else if (goal.habits.length < 3) {
    suggestions.push({
      id: 'add-more-habits',
      title: 'Add more supporting habits',
      description: 'Multiple habits create a stronger foundation for achieving your goal.',
      impact: 'medium',
      action: onCreateHabit || (() => {}),
    });
  }
  
  // Missing deep why
  if (!goalMeta?.why_text || goalMeta.why_text.length < 50) {
    suggestions.push({
      id: 'add-deep-why',
      title: 'Define your deeper why',
      description: 'Understanding why this goal matters will fuel your motivation during tough times.',
      impact: 'high',
      action: onAddWhy || (() => {}),
    });
  }
  
  // No obstacles identified
  if (!goalMeta?.obstacles || goalMeta.obstacles.length === 0) {
    suggestions.push({
      id: 'identify-obstacles',
      title: 'Identify potential obstacles',
      description: 'Anticipating challenges helps you prepare strategies to overcome them.',
      impact: 'medium',
      action: onOpenGoalDetails || (() => {}),
    });
  }
  
  // No target date
  if (!goalMeta?.targetDate && !goal.targetDate) {
    suggestions.push({
      id: 'set-target-date',
      title: 'Set a target date',
      description: 'Having a deadline creates urgency and helps you track progress more effectively.',
      impact: 'medium',
      action: onOpenGoalDetails || (() => {}),
    });
  }
  
  // Goal title could be more specific
  if (goal.title.length < 15) {
    suggestions.push({
      id: 'improve-goal-title',
      title: 'Make your goal more specific',
      description: 'Specific goals are more achievable. Consider adding details like "when", "where", or "how much".',
      impact: 'low',
      action: onOpenGoalDetails || (() => {}),
    });
  }
  
  // Suggest habit variety if all habits are similar
  if (goal.habits.length >= 2) {
    const habitWords = goal.habits.map(h => h.title.toLowerCase().split(' ')).flat();
    const uniqueWords = new Set(habitWords);
    const varietyScore = uniqueWords.size / habitWords.length;
    
    if (varietyScore < 0.5) {
      suggestions.push({
        id: 'diversify-habits',
        title: 'Diversify your habits',
        description: 'Consider adding habits that target different aspects of your goal for better results.',
        impact: 'low',
        action: onCreateHabit || (() => {}),
      });
    }
  }
  
  // Sort suggestions by impact (high first)
  const impactOrder = { high: 3, medium: 2, low: 1 };
  suggestions.sort((a, b) => impactOrder[b.impact] - impactOrder[a.impact]);
  
  return suggestions;
}

// Hook to get enhancement data for a goal
export function useGoalEnhancement(goalId: string) {
  const { goalsWithIds, habitsWithIds, goalMeta } = useAppStore();
  
  const goal = goalsWithIds.find(g => g.id === goalId);
  if (!goal) return null;
  
  const goalData: GoalData = {
    id: goal.id,
    title: goal.title,
    habits: habitsWithIds[goal.id] || [],
  };
  
  const meta = goalMeta[goal.id];
  const completenessScore = calculateGoalCompleteness(goalData, meta);
  
  const suggestions = generateEnhancementSuggestions(
    goalData,
    meta,
    () => console.log('Open goal details for', goalId),
    () => console.log('Create habit for', goalId),
    () => console.log('Add why for', goalId)
  );
  
  return {
    goal: goalData,
    completenessScore,
    suggestions,
    meta,
  };
}