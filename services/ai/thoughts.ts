import * as SecureStore from 'expo-secure-store';
import { generateAIResponse, GoalContext, ConversationContext, initializeChatAI } from './chat';
import { getAIConfig } from './config';

export interface AvatarThought {
  thoughts: string;
  generated_at: string;
  avatar_name: string;
  goal_id: string;
}

interface StoredThoughts {
  [goalId: string]: AvatarThought;
}

const STORAGE_KEY = 'avatar_thoughts';

export class AvatarThoughtsService {
  /**
   * Check if thoughts can be generated for a goal today
   */
  async canGenerateToday(goalId: string): Promise<boolean> {
    try {
      const stored = await this.getStoredThoughts();
      const goalThoughts = stored[goalId];
      
      if (!goalThoughts) return true;
      
      const generatedDate = new Date(goalThoughts.generated_at);
      const today = new Date();
      
      // Check if it's a different day
      return !this.isSameDay(generatedDate, today);
    } catch (error) {
      console.warn('Error checking thought generation availability:', error);
      return true; // Default to allowing generation if we can't check
    }
  }

  /**
   * Get existing thoughts for a goal if generated today
   */
  async getTodaysThoughts(goalId: string): Promise<AvatarThought | null> {
    try {
      const stored = await this.getStoredThoughts();
      const goalThoughts = stored[goalId];
      
      if (!goalThoughts) return null;
      
      const generatedDate = new Date(goalThoughts.generated_at);
      const today = new Date();
      
      // Return thoughts only if generated today
      return this.isSameDay(generatedDate, today) ? goalThoughts : null;
    } catch (error) {
      console.warn('Error getting today\'s thoughts:', error);
      return null;
    }
  }

  /**
   * Generate new daily thoughts for a goal
   */
  async generateDailyThoughts(goalContext: GoalContext): Promise<AvatarThought> {
    // Ensure AI is initialized with backend base URL
    try {
      initializeChatAI(getAIConfig());
    } catch {}
    // Check if we can generate today
    const canGenerate = await this.canGenerateToday(goalContext.id);
    if (!canGenerate) {
      throw new Error('Daily thoughts already generated. Please try again tomorrow.');
    }

    // Prepare conversation context for reflection
    const reflectionContext: ConversationContext = {
      recentMessages: [],
      userEmotionalState: 'neutral',
      sessionStartTime: Date.now(),
      previousInteractions: 0
    };

    // Special message for daily reflection
    const reflectionMessage = `DAILY_REFLECTION: Please share your daily thoughts on my progress with "${goalContext.title}". Consider my current progress, recent habits, and offer encouragement or insights in your unique personality.`;

    try {
      // Generate AI response using existing chat service
      const aiResponse = await generateAIResponse(
        reflectionMessage,
        goalContext,
        reflectionContext
      );

      // Create thought object
      const thought: AvatarThought = {
        thoughts: aiResponse.content,
        generated_at: new Date().toISOString(),
        avatar_name: goalContext.avatar.name,
        goal_id: goalContext.id
      };

      // Store the thought
      await this.storeThought(goalContext.id, thought);

      return thought;
    } catch (error) {
      console.error('Error generating daily thoughts:', error);
      throw new Error('Unable to generate thoughts right now. Please try again later.');
    }
  }

  /**
   * Get time until next generation is available
   */
  async getTimeUntilNextGeneration(goalId: string): Promise<string | null> {
    try {
      const stored = await this.getStoredThoughts();
      const goalThoughts = stored[goalId];
      
      if (!goalThoughts) return null;
      
      const generatedDate = new Date(goalThoughts.generated_at);
      const nextAvailable = new Date(generatedDate);
      nextAvailable.setDate(nextAvailable.getDate() + 1);
      nextAvailable.setHours(0, 0, 0, 0); // Start of next day
      
      const now = new Date();
      const timeDiff = nextAvailable.getTime() - now.getTime();
      
      if (timeDiff <= 0) return null; // Available now
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.warn('Error calculating next generation time:', error);
      return null;
    }
  }

  /**
   * Clear thoughts for a specific goal (useful for testing)
   */
  async clearGoalThoughts(goalId: string): Promise<void> {
    try {
      const stored = await this.getStoredThoughts();
      delete stored[goalId];
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.warn('Error clearing goal thoughts:', error);
    }
  }

  /**
   * Clear all stored thoughts (useful for testing)
   */
  async clearAllThoughts(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing all thoughts:', error);
    }
  }

  // Private helper methods

  private async getStoredThoughts(): Promise<StoredThoughts> {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Error reading stored thoughts:', error);
      return {};
    }
  }

  private async storeThought(goalId: string, thought: AvatarThought): Promise<void> {
    try {
      const stored = await this.getStoredThoughts();
      stored[goalId] = thought;
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Error storing thought:', error);
      throw new Error('Failed to save thoughts');
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

// Export singleton instance
export const avatarThoughtsService = new AvatarThoughtsService();

// Convenience functions
export async function canGenerateDailyThoughts(goalId: string): Promise<boolean> {
  return avatarThoughtsService.canGenerateToday(goalId);
}

export async function generateDailyThoughts(goalContext: GoalContext): Promise<AvatarThought> {
  return avatarThoughtsService.generateDailyThoughts(goalContext);
}

export async function getTodaysThoughts(goalId: string): Promise<AvatarThought | null> {
  return avatarThoughtsService.getTodaysThoughts(goalId);
}

export async function getTimeUntilNextGeneration(goalId: string): Promise<string | null> {
  return avatarThoughtsService.getTimeUntilNextGeneration(goalId);
}
