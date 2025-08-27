import { GoalContext, ConversationContext } from './chat';
import type { ConversationMessage, HabitWithId } from '@/stores/app';
import { AvatarType } from '@/components/avatars/types';
import { AVATAR_PERSONALITIES } from '@/lib/avatarPersonality';

interface AppStateSnapshot {
  currentGoal: { id: string; title: string };
  goalMeta: { why_text?: string; obstacles?: string[] };
  habits: HabitWithId[];
  completedHabitsToday: number;
  avatar: {
    type: AvatarType;
    name: string;
    vitality: number;
  };
  conversations: ConversationMessage[];
  userProgress: {
    streaks: Record<string, number>;
    recentCompletions: number;
    overallProgress: number;
  };
}

export class GoalContextBuilder {
  
  /**
   * Builds comprehensive goal context from app state
   */
  static buildGoalContext(appState: AppStateSnapshot): GoalContext {
    const personality = AVATAR_PERSONALITIES[appState.avatar.type];
    
    return {
      id: appState.currentGoal.id,
      title: appState.currentGoal.title,
      why: appState.goalMeta?.why_text,
      obstacles: appState.goalMeta?.obstacles || [],
      habits: appState.habits,
      completedHabitsToday: appState.completedHabitsToday,
      totalHabits: appState.habits.length,
      avatar: {
        type: appState.avatar.type,
        name: appState.avatar.name,
        vitality: appState.avatar.vitality,
        personality: personality.traits,
      },
      userProgress: appState.userProgress,
    };
  }

  /**
   * Builds conversation context from recent messages and user behavior
   */
  static buildConversationContext(
    messages: ConversationMessage[],
    sessionStartTime?: number
  ): ConversationContext {
    const recentMessages = messages.slice(-10); // Last 10 messages for context
    const userEmotionalState = this.detectEmotionalState(messages);
    
    return {
      recentMessages,
      userEmotionalState,
      sessionStartTime: sessionStartTime || Date.now(),
      previousInteractions: messages.length,
    };
  }

  /**
   * Detects user's emotional state from recent messages
   */
  private static detectEmotionalState(
    messages: ConversationMessage[]
  ): 'motivated' | 'discouraged' | 'celebrating' | 'neutral' {
    if (messages.length === 0) return 'neutral';
    
    const recentUserMessages = messages
      .filter(m => m.isUser)
      .slice(-3) // Last 3 user messages
      .map(m => m.content.toLowerCase());
    
    const allText = recentUserMessages.join(' ');
    
    // Check for celebrating keywords
    if (/(completed|finished|did it|success|great|amazing|proud|achieved|won|accomplished)/i.test(allText)) {
      return 'celebrating';
    }
    
    // Check for discouraged keywords
    if (/(frustrated|stuck|hard|difficult|giving up|failed|can't|tired|overwhelmed)/i.test(allText)) {
      return 'discouraged';
    }
    
    // Check for motivated keywords
    if (/(ready|motivated|excited|let's do|pumped|energized|confident)/i.test(allText)) {
      return 'motivated';
    }
    
    return 'neutral';
  }

  /**
   * Calculates user progress metrics from habits and streaks
   */
  static calculateProgressMetrics(
    habits: HabitWithId[],
    completedToday: number,
    streaks: Record<string, number>
  ): { overallProgress: number; recentCompletions: number } {
    const totalHabits = habits.length;
    const todayProgress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
    
    // Calculate average streak as indicator of consistency
    const streakValues = Object.values(streaks);
    const avgStreak = streakValues.length > 0 
      ? streakValues.reduce((sum, streak) => sum + streak, 0) / streakValues.length 
      : 0;
    
    // Overall progress considers both today's completion and consistency
    const overallProgress = Math.round((todayProgress + Math.min(avgStreak * 2, 50)) / 2);
    
    return {
      overallProgress: Math.min(overallProgress, 100),
      recentCompletions: completedToday,
    };
  }

  /**
   * Enriches goal context with dynamic insights
   */
  static enrichWithInsights(goalContext: GoalContext): GoalContext {
    const insights = this.generateProgressInsights(goalContext);
    
    return {
      ...goalContext,
      // Add computed insights that AI can reference
      insights,
    } as GoalContext & { insights: string[] };
  }

  private static generateProgressInsights(goalContext: GoalContext): string[] {
    const insights: string[] = [];
    
    // Vitality insights
    if (goalContext.avatar.vitality > 80) {
      insights.push("High vitality indicates strong momentum and engagement");
    } else if (goalContext.avatar.vitality < 30) {
      insights.push("Low vitality suggests need for encouragement and small wins");
    }
    
    // Progress insights
    const completionRate = goalContext.totalHabits > 0 
      ? goalContext.completedHabitsToday / goalContext.totalHabits 
      : 0;
    
    if (completionRate === 1) {
      insights.push("Perfect habit completion today - celebrate this achievement!");
    } else if (completionRate >= 0.7) {
      insights.push("Strong daily progress with most habits completed");
    } else if (completionRate === 0) {
      insights.push("Fresh start opportunity - focus on one small habit");
    }
    
    // Streak insights
    const streakValues = Object.values(goalContext.userProgress.streaks);
    const maxStreak = Math.max(...streakValues, 0);
    
    if (maxStreak >= 7) {
      insights.push(`Impressive ${maxStreak}-day streak shows commitment and consistency`);
    } else if (maxStreak >= 3) {
      insights.push("Building good momentum with recent consistency");
    }
    
    // Obstacle insights
    if (goalContext.obstacles && goalContext.obstacles.length > 0) {
      insights.push(`Key obstacles identified: ${goalContext.obstacles.join(', ')}`);
    }
    
    return insights;
  }
}

/**
 * Helper function to extract relevant data from Zustand store
 */
export function extractAppStateForContext(
  goalId: string,
  store: any // Zustand store state
): AppStateSnapshot {
  const currentGoal = store.goalsWithIds.find((g: any) => g.id === goalId);
  const goalMeta = store.goalMeta[goalId] || {};
  const habits = store.habitsWithIds[goalId] || [];
  const conversations = store.conversations[goalId] || [];
  
  // Calculate completed habits today (would need actual completion data)
  const completedHabitsToday = habits.filter((habit: HabitWithId) => {
    // This would need to check actual completion status for today
    // For now, using a placeholder
    return false; // TODO: implement actual completion check
  }).length;
  
  // Calculate streaks and progress
  const streaks: Record<string, number> = {};
  habits.forEach((habit: HabitWithId) => {
    // TODO: implement actual streak calculation
    streaks[habit.id] = Math.floor(Math.random() * 10); // Placeholder
  });
  
  const progressMetrics = GoalContextBuilder.calculateProgressMetrics(
    habits,
    completedHabitsToday,
    streaks
  );
  
  return {
    currentGoal: currentGoal || { id: goalId, title: 'Unknown Goal' },
    goalMeta,
    habits,
    completedHabitsToday,
    avatar: store.avatar,
    conversations,
    userProgress: {
      streaks,
      ...progressMetrics,
    },
  };
}