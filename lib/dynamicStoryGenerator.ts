import { 
  AvatarStory, 
  StoryGenerationConfig, 
  StoryMilestoneType,
  StoryCategory 
} from '@/types/avatarStories';
import { AvatarType } from '@/components/avatars/types';

// Enhanced story generator that uses the chat API for dynamic content
export async function generateDynamicAvatarStory(
  config: StoryGenerationConfig
): Promise<AvatarStory> {
  try {
    // Build context for the AI to generate the story
    const storyPrompt = buildStoryPrompt(config);
    
    // Call the chat API to generate personalized story content
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: storyPrompt,
        conversationContext: {
          messages: [],
          userEmotionalState: 'celebrating',
          sessionStartTime: Date.now(),
          previousInteractions: 0
        },
        goalContext: {
          id: config.goalId,
          title: config.goalTitle,
          habits: config.contextData.recentHabits.map((title, index) => ({
            id: `habit_${index}`,
            title,
            description: `Habit for ${config.goalTitle}`,
            category: 'personal'
          })),
          completedHabitsToday: config.contextData.recentHabits.length,
          totalHabits: config.contextData.recentHabits.length,
          avatar: {
            type: config.avatarType,
            name: config.avatarName,
            vitality: 75,
            personality: config.avatarPersonality
          },
          userProgress: {
            streaks: { [config.goalTitle]: config.contextData.currentStreak },
            recentCompletions: config.contextData.progressPercentage,
            overallProgress: config.contextData.progressPercentage
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Parse the AI response to extract story content
    const { title, content } = parseAIStoryResponse(aiResponse.content, config);
    
    // Create the story object
    const story: AvatarStory = {
      id: `story_${config.goalId}_${config.milestoneType}_${Date.now()}`,
      goalId: config.goalId,
      milestoneType: config.milestoneType,
      category: getCategoryForMilestone(config.milestoneType),
      title,
      content,
      unlockedAt: Date.now(),
      avatarType: config.avatarType,
      avatarName: config.avatarName,
      metadata: {
        streakLength: config.contextData.currentStreak,
        progressPercentage: config.contextData.progressPercentage,
        habitsInvolved: config.contextData.recentHabits,
        emotionalTone: aiResponse.emotion || 'supportive',
        keyInsight: extractKeyInsight(aiResponse.content),
        relatedGoals: config.contextData.relatedGoals?.map(g => g.id)
      },
      isGenerated: true,
      generatedAt: Date.now()
    };

    return story;
  } catch (error) {
    console.error('Failed to generate dynamic story:', error);
    // Fallback to template-based story
    return generateFallbackStory(config);
  }
}

/**
 * Build a specialized prompt for generating avatar stories
 */
function buildStoryPrompt(config: StoryGenerationConfig): string {
  const milestoneDescription = getMilestoneDescription(config.milestoneType);
  const avatarPersonality = getAvatarPersonalityDescription(config.avatarType, config.avatarPersonality);
  
  return `As ${config.avatarName}, a ${config.avatarType} avatar companion, write a personal story reflecting on this milestone: ${milestoneDescription}

Context:
- Goal: ${config.goalTitle}
- Current streak: ${config.contextData.currentStreak} days
- Progress: ${config.contextData.progressPercentage}%
- Recent habits: ${config.contextData.recentHabits.join(', ')}

Your personality: ${avatarPersonality}

Write a heartfelt, personal reflection from your perspective as the avatar companion. Include:
1. A meaningful title (max 4 words)
2. Your personal observations about the user's journey
3. How this milestone made you feel as their companion
4. What you've learned about them through this experience
5. Encouragement for continuing forward

Format:
Title: [Your title here]
Content: [Your story here, 2-3 paragraphs, written in first person as the avatar]

Keep it authentic, warm, and specific to this milestone. Aim for 100-150 words.`;
}

/**
 * Parse AI response to extract title and content
 */
function parseAIStoryResponse(aiContent: string, config: StoryGenerationConfig): { title: string; content: string } {
  const lines = aiContent.split('\n').filter(line => line.trim());
  
  let title = '';
  let content = '';
  let inContent = false;
  
  for (const line of lines) {
    if (line.toLowerCase().startsWith('title:')) {
      title = line.replace(/^title:\s*/i, '').trim();
    } else if (line.toLowerCase().startsWith('content:')) {
      content = line.replace(/^content:\s*/i, '').trim();
      inContent = true;
    } else if (inContent) {
      content += ' ' + line.trim();
    }
  }
  
  // Fallback if parsing fails
  if (!title) {
    title = getDefaultTitle(config.milestoneType);
  }
  
  if (!content) {
    content = aiContent; // Use the whole response as content
  }
  
  return { title, content };
}

/**
 * Get milestone description for prompt
 */
function getMilestoneDescription(milestone: StoryMilestoneType): string {
  const descriptions = {
    streak_3: 'completing a 3-day habit streak',
    streak_7: 'reaching a 7-day consistency milestone', 
    streak_14: 'achieving a 2-week habit streak',
    streak_30: 'reaching a 30-day milestone',
    streak_60: 'completing 2 months of consistency',
    streak_100: 'achieving a 100-day streak',
    progress_25: 'reaching 25% goal completion',
    progress_50: 'hitting the halfway point',
    progress_75: 'achieving 75% progress',
    progress_100: 'completing the entire goal',
    comeback_3: 'returning to habits after a 3+ day break',
    comeback_7: 'recommitting after a week away',
    cross_goal: 'showing synergy across multiple goals',
    setback: 'reflecting on missed days',
    breakthrough: 'making a significant progress leap'
  };
  
  return descriptions[milestone] || 'reaching an important milestone';
}

/**
 * Get avatar personality description
 */
function getAvatarPersonalityDescription(type: AvatarType, personality: any): string {
  const baseTraits = {
    plant: 'wise, patient, and nurturing',
    pet: 'enthusiastic, loyal, and playful',
    robot: 'analytical, supportive, and data-driven',
    base: 'balanced and encouraging'
  };
  
  let description = baseTraits[type] || baseTraits.base;
  
  // Add specific traits based on personality scores
  if (personality.enthusiasm >= 8) description += ', highly enthusiastic';
  if (personality.supportive >= 8) description += ', deeply supportive';
  if (personality.analytical >= 8) description += ', very analytical';
  if (personality.playful >= 8) description += ', quite playful';
  if (personality.patient >= 8) description += ', extremely patient';
  
  return description;
}

/**
 * Extract key insight from AI response
 */
function extractKeyInsight(content: string): string {
  // Simple extraction - look for insight-like sentences
  const sentences = content.split(/[.!?]/).filter(s => s.trim());
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (lower.includes('learn') || lower.includes('realize') || lower.includes('understand') || lower.includes('discover')) {
      return sentence.trim() + '.';
    }
  }
  
  // Fallback
  return 'Every step forward is meaningful growth.';
}

/**
 * Get default title for milestone
 */
function getDefaultTitle(milestone: StoryMilestoneType): string {
  const titles = {
    streak_3: 'First Steps Together',
    streak_7: 'Weekly Rhythm Found',
    streak_14: 'Two Weeks Strong',
    streak_30: 'Monthly Milestone',
    streak_60: 'Two Month Journey',
    streak_100: 'Hundred Day Victory',
    progress_25: 'Quarter Way There',
    progress_50: 'Halfway Victory',
    progress_75: 'Almost Complete',
    progress_100: 'Goal Achieved',
    comeback_3: 'Welcome Back',
    comeback_7: 'Return Journey',
    cross_goal: 'Connected Growth',
    setback: 'Learning Moment',
    breakthrough: 'Major Progress'
  };
  
  return titles[milestone] || 'Milestone Reached';
}

/**
 * Helper functions from the original system
 */
function getCategoryForMilestone(milestone: StoryMilestoneType): StoryCategory {
  if (milestone.startsWith('streak_')) return 'consistency';
  if (milestone.startsWith('progress_')) return 'breakthrough';
  if (milestone.startsWith('comeback_')) return 'challenge';
  if (milestone === 'cross_goal') return 'synergy';
  return 'growth';
}

function generateFallbackStory(config: StoryGenerationConfig): AvatarStory {
  return {
    id: `story_${config.goalId}_${config.milestoneType}_${Date.now()}`,
    goalId: config.goalId,
    milestoneType: config.milestoneType,
    category: getCategoryForMilestone(config.milestoneType),
    title: getDefaultTitle(config.milestoneType),
    content: `Congratulations on reaching this milestone! As your ${config.avatarType} companion, I'm proud of the progress you've made with ${config.goalTitle}. Your ${config.contextData.currentStreak}-day streak shows real dedication. Keep going!`,
    unlockedAt: Date.now(),
    avatarType: config.avatarType,
    avatarName: config.avatarName,
    metadata: {
      streakLength: config.contextData.currentStreak,
      progressPercentage: config.contextData.progressPercentage,
      habitsInvolved: config.contextData.recentHabits,
      emotionalTone: 'supportive',
      keyInsight: 'Every milestone matters on your journey.'
    },
    isGenerated: true,
    generatedAt: Date.now()
  };
}