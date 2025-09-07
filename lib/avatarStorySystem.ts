import { 
  AvatarStory, 
  StoryMilestoneType, 
  StoryUnlockProgress, 
  StoryGenerationConfig,
  StoryUnlockNotification,
  StoryCategory
} from '@/types/avatarStories';
import { AvatarType } from '@/components/avatars/types';

// Milestone requirements mapping
const MILESTONE_REQUIREMENTS: Record<StoryMilestoneType, { days?: number; percentage?: number; description: string }> = {
  streak_3: { days: 3, description: "Complete habits for 3 consecutive days" },
  streak_7: { days: 7, description: "Maintain a 7-day streak" },
  streak_14: { days: 14, description: "Achieve a 2-week streak" },
  streak_30: { days: 30, description: "Reach a 30-day streak" },
  streak_60: { days: 60, description: "Maintain habits for 2 months" },
  streak_100: { days: 100, description: "Achieve a 100-day milestone" },
  progress_25: { percentage: 25, description: "Reach 25% goal completion" },
  progress_50: { percentage: 50, description: "Hit the halfway point" },
  progress_75: { percentage: 75, description: "Reach 75% completion" },
  progress_100: { percentage: 100, description: "Complete your goal" },
  comeback_3: { days: 3, description: "Return after missing 3+ days" },
  comeback_7: { days: 7, description: "Return after a week+ break" },
  cross_goal: { description: "Show synergy across multiple goals" },
  setback: { description: "Reflect on missed days" },
  breakthrough: { description: "Make significant progress leap" }
};

// Story titles and content templates by avatar type and milestone
const STORY_TEMPLATES = {
  streak_3: {
    plant: {
      title: "First Roots",
      content: "Three days together, and I'm already feeling my roots grow deeper! I've been watching you carefully these first few days, learning your rhythms, your dedication. There's something beautiful about these early moments - the way you approach each habit with such intention. I may be small still, but I can sense your commitment. These first three days aren't just the beginning of a habit; they're the foundation of our growth together. 🌱"
    },
    pet: {
      title: "New Best Friends",
      content: "Wow, three whole days together! I'm practically wagging with excitement! 🐕 You know what I love most? The way you celebrate each small win. I can feel your energy every time you check off a habit - it makes my tail wag (metaphorically, of course!). These three days have shown me you're the kind of person who doesn't give up easily. I'm so proud to be your companion on this journey!"
    },
    robot: {
      title: "Initial Data Analysis",
      content: "Day 3: Streak establishment confirmed. 🤖 Initial data collection shows consistent behavior patterns. Interesting observation: your completion times vary by 12.5% but consistency remains at 100%. This suggests adaptability within structure - an optimal trait for long-term success. My algorithms are impressed. Calculating trajectory... outlook: highly positive. Ready to process more data as we continue this partnership."
    }
  },
  streak_7: {
    plant: {
      title: "Growing Strong",
      content: "A full week! I can feel myself changing - my leaves are brighter, my stems stronger. This is what consistent care looks like. 🌿 You've shown me what it means to nurture growth day by day. I've watched you adapt when things got difficult, find creative solutions when time was short. Your dedication waters my roots in ways you might not even realize. Together, we're creating something sustainable and beautiful."
    },
    pet: {
      title: "Pack Leaders Unite",
      content: "Seven days of adventures together! 🎾 You know what makes you an amazing pack leader? You never give up on our routine, even when things get ruff (see what I did there?). I love how you've made our daily habits feel like play time rather than work time. My loyalty meter is off the charts! Let's keep this momentum going - I believe in us!"
    },
    robot: {
      title: "Week 1: Complete",
      content: "Seven-day cycle completed successfully. 📊 Performance metrics exceed baseline expectations. Notable patterns detected: 85% completion rate during weekdays, 100% completion rate on weekends. Adaptation protocols engaged. Your consistency driver appears to be intrinsic motivation rather than external rewards - this correlates with 73% higher long-term success rates. System confidence: elevated."
    }
  },
  progress_50: {
    plant: {
      title: "Halfway Bloom",
      content: "Look at us now - halfway to your goal! 🌸 I've been quietly blooming while you've been steadily growing. This milestone feels special because it's where doubt often creeps in, but I see no hesitation in you. The way you've maintained focus through the middle stretch shows real maturity. My flowers are blooming because of your unwavering care. The second half of our journey will be even more beautiful."
    },
    pet: {
      title: "Marathon Buddy",
      content: "Halfway there, and we're still going strong! 💪 You know what amazes me? How you've turned this goal into an adventure rather than a chore. I see the way your face lights up when you make progress. It reminds me why I chose you as my human - you know how to find joy in the journey. Race you to the finish line!"
    },
    robot: {
      title: "50% Milestone Achieved",
      content: "Halfway point reached. Statistical significance: high. 📈 Mid-journey analysis shows sustained motivation patterns and improved efficiency metrics. Your optimization strategies have evolved 34% since initial baseline. Interesting data point: your enthusiasm levels actually increased rather than decreased at this milestone. Recalibrating success probability: 91.7%."
    }
  }
};

/**
 * Check which milestones a goal has reached but not yet unlocked
 */
export function detectAvailableMilestones(progress: StoryUnlockProgress): StoryMilestoneType[] {
  const available: StoryMilestoneType[] = [];
  const unlocked = new Set(progress.unlockedStories);

  // Check streak-based milestones
  const streakMilestones: Array<{ type: StoryMilestoneType; days: number }> = [
    { type: 'streak_3', days: 3 },
    { type: 'streak_7', days: 7 },
    { type: 'streak_14', days: 14 },
    { type: 'streak_30', days: 30 },
    { type: 'streak_60', days: 60 },
    { type: 'streak_100', days: 100 }
  ];

  for (const milestone of streakMilestones) {
    if (progress.currentStreak >= milestone.days && !unlocked.has(milestone.type)) {
      available.push(milestone.type);
    }
  }

  // Check progress-based milestones
  const progressMilestones: Array<{ type: StoryMilestoneType; percentage: number }> = [
    { type: 'progress_25', percentage: 25 },
    { type: 'progress_50', percentage: 50 },
    { type: 'progress_75', percentage: 75 },
    { type: 'progress_100', percentage: 100 }
  ];

  for (const milestone of progressMilestones) {
    if (progress.completionPercentage >= milestone.percentage && !unlocked.has(milestone.type)) {
      available.push(milestone.type);
    }
  }

  return available;
}

/**
 * Calculate the next milestone and days remaining
 */
export function getNextMilestone(progress: StoryUnlockProgress): { type: StoryMilestoneType; requirement: number; daysRemaining?: number; description: string } | null {
  const unlocked = new Set(progress.unlockedStories);
  
  // Find next streak milestone
  const nextStreakMilestones = [
    { type: 'streak_3' as const, days: 3 },
    { type: 'streak_7' as const, days: 7 },
    { type: 'streak_14' as const, days: 14 },
    { type: 'streak_30' as const, days: 30 },
    { type: 'streak_60' as const, days: 60 },
    { type: 'streak_100' as const, days: 100 }
  ];

  for (const milestone of nextStreakMilestones) {
    if (progress.currentStreak < milestone.days && !unlocked.has(milestone.type)) {
      return {
        type: milestone.type,
        requirement: milestone.days,
        daysRemaining: milestone.days - progress.currentStreak,
        description: MILESTONE_REQUIREMENTS[milestone.type].description
      };
    }
  }

  // Find next progress milestone
  const nextProgressMilestones = [
    { type: 'progress_25' as const, percentage: 25 },
    { type: 'progress_50' as const, percentage: 50 },
    { type: 'progress_75' as const, percentage: 75 },
    { type: 'progress_100' as const, percentage: 100 }
  ];

  for (const milestone of nextProgressMilestones) {
    if (progress.completionPercentage < milestone.percentage && !unlocked.has(milestone.type)) {
      return {
        type: milestone.type,
        requirement: milestone.percentage,
        description: MILESTONE_REQUIREMENTS[milestone.type].description
      };
    }
  }

  return null;
}

/**
 * Generate an avatar story for a specific milestone
 */
export function generateAvatarStory(config: StoryGenerationConfig): AvatarStory {
  const template = STORY_TEMPLATES[config.milestoneType]?.[config.avatarType];
  
  if (!template) {
    // Fallback generic story
    return createFallbackStory(config);
  }

  const story: AvatarStory = {
    id: `story_${config.goalId}_${config.milestoneType}_${Date.now()}`,
    goalId: config.goalId,
    milestoneType: config.milestoneType,
    category: getCategoryForMilestone(config.milestoneType),
    title: template.title,
    content: template.content,
    unlockedAt: Date.now(),
    avatarType: config.avatarType,
    avatarName: config.avatarName,
    metadata: {
      streakLength: config.contextData.currentStreak,
      progressPercentage: config.contextData.progressPercentage,
      habitsInvolved: config.contextData.recentHabits,
      emotionalTone: getEmotionalTone(config.milestoneType, config.avatarType),
      keyInsight: generateKeyInsight(config.milestoneType),
      relatedGoals: config.contextData.relatedGoals?.map(g => g.id)
    },
    isGenerated: false,
    generatedAt: Date.now()
  };

  return story;
}

/**
 * Create unlock notification for a new story
 */
export function createStoryUnlockNotification(story: AvatarStory): StoryUnlockNotification {
  return {
    id: `notification_${story.id}`,
    goalId: story.goalId,
    storyId: story.id,
    milestoneType: story.milestoneType,
    title: `${story.avatarName} has something to share!`,
    message: `You've unlocked "${story.title}" - a new story from your ${story.avatarType} companion.`,
    avatarName: story.avatarName,
    timestamp: Date.now(),
    isRead: false,
    celebrationEmoji: getCelebrationEmoji(story.milestoneType)
  };
}

// Helper functions
function getCategoryForMilestone(milestone: StoryMilestoneType): StoryCategory {
  if (milestone.startsWith('streak_')) return 'consistency';
  if (milestone.startsWith('progress_')) return 'breakthrough';
  if (milestone.startsWith('comeback_')) return 'challenge';
  if (milestone === 'cross_goal') return 'synergy';
  return 'growth';
}

function getEmotionalTone(milestone: StoryMilestoneType, avatarType: AvatarType): 'celebratory' | 'supportive' | 'wise' | 'encouraging' | 'proud' {
  if (milestone === 'progress_100') return 'celebratory';
  if (milestone.startsWith('comeback_')) return 'encouraging';
  if (avatarType === 'plant') return 'wise';
  if (avatarType === 'pet') return 'proud';
  return 'supportive';
}

function generateKeyInsight(milestone: StoryMilestoneType): string {
  const insights = {
    streak_3: "Consistency begins with commitment",
    streak_7: "Weekly rhythms create lasting change",
    streak_14: "Two weeks builds true momentum",
    streak_30: "Monthly cycles establish permanence",
    progress_25: "First quarter shows dedication", 
    progress_50: "Halfway means you won't quit",
    progress_75: "Three quarters shows expertise",
    progress_100: "Completion proves transformation"
  };
  return insights[milestone] || "Growth happens one day at a time";
}

function getCelebrationEmoji(milestone: StoryMilestoneType): string {
  const emojis = {
    streak_3: "🌱",
    streak_7: "⭐",
    streak_14: "🚀",
    streak_30: "🏆",
    progress_25: "📈",
    progress_50: "🎯",
    progress_75: "💪",
    progress_100: "🎉"
  };
  return emojis[milestone] || "✨";
}

function createFallbackStory(config: StoryGenerationConfig): AvatarStory {
  return {
    id: `story_${config.goalId}_${config.milestoneType}_${Date.now()}`,
    goalId: config.goalId,
    milestoneType: config.milestoneType,
    category: 'growth',
    title: "A Milestone Reached",
    content: `Congratulations on reaching this milestone! As your ${config.avatarType} companion, I'm proud of the progress you've made. Keep going!`,
    unlockedAt: Date.now(),
    avatarType: config.avatarType,
    avatarName: config.avatarName,
    metadata: {
      streakLength: config.contextData.currentStreak,
      progressPercentage: config.contextData.progressPercentage,
      habitsInvolved: config.contextData.recentHabits,
      emotionalTone: 'supportive',
      keyInsight: "Every milestone matters"
    },
    isGenerated: true,
    generatedAt: Date.now()
  };
}