import { AvatarType } from '@/components/avatars/types';

// Milestone types that can unlock avatar stories
export type StoryMilestoneType = 
  | 'streak_3'    // 3-day streak
  | 'streak_7'    // 7-day streak  
  | 'streak_14'   // 14-day streak
  | 'streak_30'   // 30-day streak
  | 'streak_60'   // 60-day streak
  | 'streak_100'  // 100-day streak
  | 'progress_25' // 25% goal progress
  | 'progress_50' // 50% goal progress
  | 'progress_75' // 75% goal progress
  | 'progress_100' // Goal completion
  | 'comeback_3'  // Returned after 3+ day gap
  | 'comeback_7'  // Returned after 7+ day gap
  | 'cross_goal'  // Multiple goals showing synergy
  | 'setback'     // Missed days but reflected
  | 'breakthrough'; // Major progress leap

// Story categories for different types of avatar reflections
export type StoryCategory = 
  | 'consistency'   // Regular habit completion stories
  | 'breakthrough'  // Major progress milestones
  | 'challenge'     // Overcoming setbacks
  | 'growth'        // Personal development insights
  | 'synergy'       // Cross-goal connections
  | 'reflection';   // Deep thoughtful moments

// Avatar story content structure
export interface AvatarStory {
  id: string;
  goalId: string;
  milestoneType: StoryMilestoneType;
  category: StoryCategory;
  title: string;
  content: string; // The avatar's narrative about this milestone
  unlockedAt: number; // Timestamp when story was unlocked
  avatarType: AvatarType;
  avatarName: string;
  metadata: {
    streakLength?: number;
    progressPercentage?: number;
    habitsInvolved?: string[];
    emotionalTone: 'celebratory' | 'supportive' | 'wise' | 'encouraging' | 'proud';
    keyInsight?: string; // Main takeaway from this milestone
    relatedGoals?: string[]; // Other goals mentioned in cross-goal stories
  };
  isGenerated: boolean; // Whether this was AI-generated or pre-written
  generatedAt?: number; // When the story was generated
}

// Progress tracking for story unlocks
export interface StoryUnlockProgress {
  goalId: string;
  currentStreak: number;
  longestStreak: number;
  completionPercentage: number;
  totalHabits: number;
  completedHabits: number;
  lastCompletedDate: number;
  unlockedStories: string[]; // Story IDs that have been unlocked
  availableStories: StoryMilestoneType[]; // Milestones ready to unlock
  nextMilestone?: {
    type: StoryMilestoneType;
    requirement: number; // Days or percentage needed
    daysRemaining?: number;
    description: string;
  };
}

// Configuration for story generation
export interface StoryGenerationConfig {
  goalId: string;
  goalTitle: string;
  milestoneType: StoryMilestoneType;
  avatarType: AvatarType;
  avatarName: string;
  avatarPersonality: {
    enthusiasm: number;
    supportive: number;
    analytical: number;
    playful: number;
    patient: number;
  };
  contextData: {
    currentStreak: number;
    progressPercentage: number;
    recentHabits: string[];
    userRecentJournalEntries?: string[];
    relatedGoals?: Array<{
      id: string;
      title: string;
      progress: number;
    }>;
  };
}

// Story template for pre-written content
export interface StoryTemplate {
  milestoneType: StoryMilestoneType;
  category: StoryCategory;
  templates: Array<{
    avatarType: AvatarType;
    titleTemplate: string;
    contentTemplate: string;
    emotionalTone: 'celebratory' | 'supportive' | 'wise' | 'encouraging' | 'proud';
    personalityMatch: {
      highEnthusiasm?: string;
      highSupportive?: string;
      highAnalytical?: string;
      highPlayful?: string;
      highPatient?: string;
    };
  }>;
}

// Notification for when a story is unlocked
export interface StoryUnlockNotification {
  id: string;
  goalId: string;
  storyId: string;
  milestoneType: StoryMilestoneType;
  title: string;
  message: string;
  avatarName: string;
  timestamp: number;
  isRead: boolean;
  celebrationEmoji: string;
}

// Helper function types
export type StoryGeneratorFunction = (config: StoryGenerationConfig) => Promise<AvatarStory>;
export type MilestoneCheckerFunction = (goalId: string, progress: StoryUnlockProgress) => StoryMilestoneType[];
export type StoryUnlockerFunction = (goalId: string, milestones: StoryMilestoneType[]) => Promise<AvatarStory[]>;