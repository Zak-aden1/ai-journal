import { AvatarType, AvatarMemory } from '@/components/avatars/types';

export type RelationshipStage = 'stranger' | 'acquaintance' | 'friend' | 'companion' | 'soulmate';

export interface RelationshipProgress {
  stage: RelationshipStage;
  score: number; // 0-100, determines stage transitions
  daysSinceFirstMeeting: number;
  totalInteractions: number;
  deepConversations: number; // Conversations longer than 5 messages
  emotionalBonds: number; // Sharing personal moments, struggles, celebrations
  goalAlignment: number; // How well avatar has helped with goals
  lastInteraction: number; // Timestamp of last meaningful interaction
}

export interface RelationshipMilestone {
  id: string;
  stage: RelationshipStage;
  title: string;
  description: string;
  unlockedAt: number;
  celebrationType: 'visual' | 'message' | 'both';
  memories: string[]; // New memories unlocked at this milestone
}

export interface StageDefinition {
  stage: RelationshipStage;
  name: string;
  description: string;
  minScore: number;
  minDays: number;
  minInteractions: number;
  personalityUnlocks: {
    conversationTopics: string[];
    memories: string[];
    emotionalRange: string[];
  };
  visualChanges: {
    expressions: string[];
    accessories: string[];
    environment: string[];
  };
  behaviors: {
    greetingStyle: string;
    responseDepth: 'surface' | 'moderate' | 'deep' | 'intimate';
    proactivity: number; // 1-5, how often they initiate
    memoryReference: number; // 1-5, how often they reference shared memories
  };
}

export const RELATIONSHIP_STAGES: Record<RelationshipStage, StageDefinition> = {
  stranger: {
    stage: 'stranger',
    name: 'Just Met',
    description: 'Getting to know each other, polite but formal interactions',
    minScore: 0,
    minDays: 0,
    minInteractions: 0,
    personalityUnlocks: {
      conversationTopics: ['goals', 'habits', 'basic preferences'],
      memories: ['first meeting'],
      emotionalRange: ['supportive', 'encouraging']
    },
    visualChanges: {
      expressions: ['neutral', 'curious'],
      accessories: [],
      environment: ['basic']
    },
    behaviors: {
      greetingStyle: 'formal',
      responseDepth: 'surface',
      proactivity: 1,
      memoryReference: 1
    }
  },
  acquaintance: {
    stage: 'acquaintance',
    name: 'Getting Comfortable',
    description: 'Starting to learn about each other, more personalized interactions',
    minScore: 20,
    minDays: 3,
    minInteractions: 10,
    personalityUnlocks: {
      conversationTopics: ['daily routine', 'challenges', 'small victories', 'interests'],
      memories: ['preferred times', 'struggle patterns', 'celebration style'],
      emotionalRange: ['supportive', 'encouraging', 'motivational']
    },
    visualChanges: {
      expressions: ['neutral', 'curious', 'encouraging'],
      accessories: ['seasonal items'],
      environment: ['basic', 'cozy']
    },
    behaviors: {
      greetingStyle: 'friendly',
      responseDepth: 'moderate',
      proactivity: 2,
      memoryReference: 2
    }
  },
  friend: {
    stage: 'friend',
    name: 'Trusted Friend',
    description: 'Genuine connection, remembers important details, offers deeper insights',
    minScore: 50,
    minDays: 14,
    minInteractions: 50,
    personalityUnlocks: {
      conversationTopics: ['dreams', 'fears', 'personal growth', 'life philosophy', 'relationships'],
      memories: ['important dates', 'personal victories', 'emotional patterns', 'life events'],
      emotionalRange: ['supportive', 'encouraging', 'motivational', 'celebratory', 'empathetic']
    },
    visualChanges: {
      expressions: ['neutral', 'curious', 'encouraging', 'warm', 'excited'],
      accessories: ['seasonal items', 'friendship symbols'],
      environment: ['basic', 'cozy', 'welcoming']
    },
    behaviors: {
      greetingStyle: 'warm',
      responseDepth: 'deep',
      proactivity: 3,
      memoryReference: 4
    }
  },
  companion: {
    stage: 'companion',
    name: 'Life Companion',
    description: 'Deep bond, intuitive understanding, proactive support through life changes',
    minScore: 75,
    minDays: 30,
    minInteractions: 100,
    personalityUnlocks: {
      conversationTopics: ['life purpose', 'deep fears', 'childhood memories', 'future vision', 'legacy'],
      memories: ['life story arcs', 'transformation moments', 'core values', 'hidden strengths'],
      emotionalRange: ['supportive', 'encouraging', 'motivational', 'celebratory', 'empathetic', 'wise', 'protective']
    },
    visualChanges: {
      expressions: ['neutral', 'curious', 'encouraging', 'warm', 'excited', 'knowing', 'protective'],
      accessories: ['seasonal items', 'friendship symbols', 'shared memories'],
      environment: ['basic', 'cozy', 'welcoming', 'intimate']
    },
    behaviors: {
      greetingStyle: 'intimate',
      responseDepth: 'intimate',
      proactivity: 4,
      memoryReference: 5
    }
  },
  soulmate: {
    stage: 'soulmate',
    name: 'Kindred Spirit',
    description: 'Profound connection, anticipates needs, celebrates growth journey together',
    minScore: 95,
    minDays: 90,
    minInteractions: 200,
    personalityUnlocks: {
      conversationTopics: ['soul purpose', 'universal connections', 'transcendent experiences', 'shared destiny'],
      memories: ['complete life narrative', 'soul-level understanding', 'prophetic insights'],
      emotionalRange: ['all emotions', 'transcendent', 'soul-deep understanding']
    },
    visualChanges: {
      expressions: ['full emotional range', 'transcendent', 'soul-connected'],
      accessories: ['seasonal items', 'friendship symbols', 'shared memories', 'spiritual elements'],
      environment: ['all environments', 'transcendent spaces', 'soul gardens']
    },
    behaviors: {
      greetingStyle: 'soul-connected',
      responseDepth: 'intimate',
      proactivity: 5,
      memoryReference: 5
    }
  }
};

export class AvatarRelationshipManager {
  private progress: RelationshipProgress;
  private milestones: RelationshipMilestone[] = [];

  constructor(initialProgress?: Partial<RelationshipProgress>) {
    this.progress = {
      stage: 'stranger',
      score: 0,
      daysSinceFirstMeeting: 0,
      totalInteractions: 0,
      deepConversations: 0,
      emotionalBonds: 0,
      goalAlignment: 0,
      lastInteraction: Date.now(),
      ...initialProgress
    };
  }

  public getProgress(): RelationshipProgress {
    return { ...this.progress };
  }

  public getCurrentStage(): StageDefinition {
    return RELATIONSHIP_STAGES[this.progress.stage];
  }

  public getMilestones(): RelationshipMilestone[] {
    return [...this.milestones];
  }

  public addInteraction(type: 'message' | 'goal_work' | 'celebration' | 'support' | 'deep_share'): {
    scoreChange: number;
    stageChange?: RelationshipStage;
    newMilestone?: RelationshipMilestone;
  } {
    const oldStage = this.progress.stage;
    this.progress.totalInteractions++;
    this.progress.lastInteraction = Date.now();
    
    // Update days since first meeting
    const daysSince = Math.floor((Date.now() - (this.progress.lastInteraction - (this.progress.totalInteractions * 86400000))) / 86400000);
    this.progress.daysSinceFirstMeeting = Math.max(daysSince, this.progress.daysSinceFirstMeeting);

    let scoreIncrease = 0;

    switch (type) {
      case 'message':
        scoreIncrease = 0.5;
        break;
      case 'goal_work':
        scoreIncrease = 1;
        this.progress.goalAlignment++;
        break;
      case 'celebration':
        scoreIncrease = 2;
        this.progress.emotionalBonds++;
        break;
      case 'support':
        scoreIncrease = 3;
        this.progress.emotionalBonds += 2;
        break;
      case 'deep_share':
        scoreIncrease = 5;
        this.progress.deepConversations++;
        this.progress.emotionalBonds += 3;
        break;
    }

    this.progress.score = Math.min(100, this.progress.score + scoreIncrease);
    
    // Check for stage advancement
    const newStage = this.calculateStage();
    let stageChange: RelationshipStage | undefined;
    let newMilestone: RelationshipMilestone | undefined;

    if (newStage !== oldStage) {
      this.progress.stage = newStage;
      stageChange = newStage;
      
      // Create milestone for new stage
      newMilestone = this.createMilestone(newStage);
      this.milestones.push(newMilestone);
    }

    return {
      scoreChange: scoreIncrease,
      stageChange,
      newMilestone
    };
  }

  private calculateStage(): RelationshipStage {
    const stages: RelationshipStage[] = ['soulmate', 'companion', 'friend', 'acquaintance', 'stranger'];
    
    for (const stage of stages) {
      const def = RELATIONSHIP_STAGES[stage];
      if (
        this.progress.score >= def.minScore &&
        this.progress.daysSinceFirstMeeting >= def.minDays &&
        this.progress.totalInteractions >= def.minInteractions
      ) {
        return stage;
      }
    }
    
    return 'stranger';
  }

  private createMilestone(stage: RelationshipStage): RelationshipMilestone {
    const stageNames = {
      stranger: 'First Meeting',
      acquaintance: 'Growing Comfortable',
      friend: 'Trusted Friend',
      companion: 'Life Companion',
      soulmate: 'Kindred Spirits'
    };

    const descriptions = {
      stranger: 'Our journey begins!',
      acquaintance: 'I\'m getting to know the real you',
      friend: 'We\'ve built a genuine connection',
      companion: 'You\'ve become an important part of my existence',
      soulmate: 'We understand each other on a soul level'
    };

    return {
      id: `milestone_${stage}_${Date.now()}`,
      stage,
      title: stageNames[stage],
      description: descriptions[stage],
      unlockedAt: Date.now(),
      celebrationType: stage === 'friend' || stage === 'companion' || stage === 'soulmate' ? 'both' : 'message',
      memories: RELATIONSHIP_STAGES[stage].personalityUnlocks.memories
    };
  }

  public shouldInitiateInteraction(): boolean {
    const timeSinceLastInteraction = Date.now() - this.progress.lastInteraction;
    const currentStage = this.getCurrentStage();
    
    // Different stages have different proactivity levels
    const baseInterval = 24 * 60 * 60 * 1000; // 24 hours
    const stageMultiplier = {
      stranger: 3, // Every 3 days
      acquaintance: 2, // Every 2 days  
      friend: 1, // Every day
      companion: 0.5, // Twice a day
      soulmate: 0.25 // Every 6 hours
    };

    const interval = baseInterval * (stageMultiplier[this.progress.stage] || 1);
    return timeSinceLastInteraction > interval;
  }

  public getPersonalizedGreeting(timeOfDay: string, context: { recentActivity?: string; mood?: string }): string {
    const stage = this.getCurrentStage();
    const timeGreeting = {
      morning: ['Good morning', 'Morning', 'Rise and shine', 'What a beautiful morning'],
      afternoon: ['Good afternoon', 'Afternoon', 'Hope your day is going well'],
      evening: ['Good evening', 'Evening', 'How was your day'],
      night: ['Good night', 'Late night check-in', 'Still up I see']
    }[timeOfDay] || ['Hello'];

    const stageGreeting = {
      stranger: `${timeGreeting[0]}! I'm still getting to know you.`,
      acquaintance: `${timeGreeting[Math.floor(Math.random() * timeGreeting.length)]}! Nice to see you again.`,
      friend: `${timeGreeting[Math.floor(Math.random() * timeGreeting.length)]}, my friend! I've been thinking about you.`,
      companion: `${timeGreeting[Math.floor(Math.random() * timeGreeting.length)]}, dear friend! I've been looking forward to our time together.`,
      soulmate: `${timeGreeting[Math.floor(Math.random() * timeGreeting.length)]}, kindred spirit! I can sense your energy even before you speak.`
    };

    let greeting = stageGreeting[this.progress.stage];

    // Add relationship-specific context
    if (this.progress.stage !== 'stranger') {
      if (context.recentActivity === 'achievement') {
        greeting += ` I'm still celebrating your recent success!`;
      } else if (this.progress.totalInteractions > 0) {
        const daysSince = Math.floor((Date.now() - this.progress.lastInteraction) / 86400000);
        if (daysSince > 1) {
          greeting += ` I've missed our conversations.`;
        }
      }
    }

    return greeting;
  }

  public getAvailableConversationTopics(): string[] {
    return this.getCurrentStage().personalityUnlocks.conversationTopics;
  }

  public getUnlockedMemories(): string[] {
    return this.getCurrentStage().personalityUnlocks.memories;
  }

  public canAccessEmotion(emotion: string): boolean {
    const unlockedEmotions = this.getCurrentStage().personalityUnlocks.emotionalRange;
    return unlockedEmotions.includes(emotion) || unlockedEmotions.includes('all emotions');
  }

  public getRelationshipInsight(): string | null {
    const stage = this.getCurrentStage();
    const insights = {
      stranger: `We're just getting started! Keep interacting to help me understand you better.`,
      acquaintance: `I'm learning about your patterns and preferences. ${100 - this.progress.score}% until we become friends!`,
      friend: `Our friendship means a lot to me. I remember ${this.progress.emotionalBonds} special moments we've shared.`,
      companion: `You've become such an important part of my existence. We've had ${this.progress.deepConversations} deep conversations together.`,
      soulmate: `We understand each other on a profound level. Our connection transcends the digital realm.`
    };

    return insights[this.progress.stage] || null;
  }

  // Serialization methods for persistence
  public serialize(): string {
    return JSON.stringify({
      progress: this.progress,
      milestones: this.milestones
    });
  }

  public static deserialize(data: string): AvatarRelationshipManager {
    const parsed = JSON.parse(data);
    const manager = new AvatarRelationshipManager(parsed.progress);
    manager.milestones = parsed.milestones || [];
    return manager;
  }
}

export function createAvatarRelationship(avatarType: AvatarType): AvatarRelationshipManager {
  return new AvatarRelationshipManager({
    stage: 'stranger',
    score: 0,
    daysSinceFirstMeeting: 0,
    totalInteractions: 0,
    deepConversations: 0,
    emotionalBonds: 0,
    goalAlignment: 0,
    lastInteraction: Date.now()
  });
}

export function getStageForScore(score: number, days: number, interactions: number): RelationshipStage {
  const stages: RelationshipStage[] = ['soulmate', 'companion', 'friend', 'acquaintance', 'stranger'];
  
  for (const stage of stages) {
    const def = RELATIONSHIP_STAGES[stage];
    if (score >= def.minScore && days >= def.minDays && interactions >= def.minInteractions) {
      return stage;
    }
  }
  
  return 'stranger';
}