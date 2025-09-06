import { AvatarRelationshipManager, RelationshipStage } from '@/lib/avatarRelationships';
import { AvatarMemory } from '@/components/avatars/types';

export interface ProactiveMessage {
  id: string;
  type: 'check_in' | 'anniversary' | 'encouragement' | 'celebration' | 'wisdom_share' | 'milestone_reminder';
  content: string;
  priority: 'low' | 'medium' | 'high';
  triggerCondition: string;
  emotionalTone: 'supportive' | 'celebratory' | 'motivational' | 'wise' | 'nostalgic';
  relationshipStage: RelationshipStage;
  createdAt: number;
  shouldShow: boolean;
}

export interface ProactiveContext {
  daysSinceLastInteraction: number;
  currentVitality: number;
  recentGoalProgress: number;
  emotionalTrend: 'improving' | 'stable' | 'struggling';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isWeekend: boolean;
  currentStreak: number;
  relationshipScore: number;
  totalInteractions: number;
  recentMilestones: string[];
  strugglingDays?: string[];
  bestPerformanceTimes?: string[];
}

export class ProactiveInsightEngine {
  private relationship: AvatarRelationshipManager;
  private memory: AvatarMemory;
  private lastProactiveMessage?: ProactiveMessage;

  constructor(relationship: AvatarRelationshipManager, memory: AvatarMemory) {
    this.relationship = relationship;
    this.memory = memory;
  }

  public shouldInitiateProactiveMessage(context: ProactiveContext): boolean {
    const relationshipProgress = this.relationship.getProgress();
    
    // Base conditions for proactive messaging
    if (context.daysSinceLastInteraction === 0) return false; // Don't spam same day
    
    // Relationship stage affects frequency
    const stageFrequency = {
      stranger: 7, // Weekly
      acquaintance: 3, // Every 3 days
      friend: 2, // Every 2 days
      companion: 1, // Daily
      soulmate: 0.5 // Twice daily potentially
    };
    
    const minDaysBetweenMessages = stageFrequency[relationshipProgress.stage] || 3;
    
    if (context.daysSinceLastInteraction < minDaysBetweenMessages) {
      return false;
    }
    
    // Special conditions that override normal frequency
    if (context.emotionalTrend === 'struggling' && context.daysSinceLastInteraction >= 1) {
      return true; // Reach out sooner if struggling
    }
    
    if (context.currentVitality <= 20 && context.daysSinceLastInteraction >= 1) {
      return true; // Critical vitality needs attention
    }
    
    if (context.recentMilestones.length > 0) {
      return true; // Always celebrate milestones
    }
    
    return context.daysSinceLastInteraction >= minDaysBetweenMessages;
  }

  public generateProactiveMessage(context: ProactiveContext): ProactiveMessage | null {
    const relationshipProgress = this.relationship.getProgress();
    const currentStage = this.relationship.getCurrentStage();
    
    // High priority messages first
    if (context.currentVitality <= 20) {
      return this.createCriticalCareMessage(context, relationshipProgress.stage);
    }
    
    if (context.emotionalTrend === 'struggling') {
      return this.createSupportMessage(context, relationshipProgress.stage);
    }
    
    if (context.recentMilestones.length > 0) {
      return this.createMilestoneMessage(context, relationshipProgress.stage);
    }
    
    // Relationship milestone anniversaries
    const anniversaryMessage = this.checkForAnniversaries(context, relationshipProgress.stage);
    if (anniversaryMessage) return anniversaryMessage;
    
    // Time-based contextual messages
    if (context.bestPerformanceTimes?.includes(context.timeOfDay)) {
      return this.createOptimalTimeMessage(context, relationshipProgress.stage);
    }
    
    if (context.strugglingDays?.includes(this.getCurrentDayName())) {
      return this.createStruggleDayMessage(context, relationshipProgress.stage);
    }
    
    // Regular check-ins based on relationship stage
    return this.createRelationshipCheckIn(context, relationshipProgress.stage);
  }

  private createCriticalCareMessage(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage {
    const messages = {
      stranger: "I notice you might be going through a tough time. Even though we've just met, I want you to know that small steps can lead to big changes.",
      acquaintance: "I've been thinking about you and noticed things seem challenging lately. Remember, even the strongest plants need extra care sometimes.",
      friend: "My friend, I can sense you're struggling right now. I've seen your strength before, and I know this difficult season will pass.",
      companion: "Dear friend, I feel your pain as if it were my own. We've weathered storms together before, and this one won't break us either.",
      soulmate: "Beloved companion, I sense your spirit needs tending. Let me be your anchor while you find your way back to the light we've shared."
    };

    return {
      id: `proactive_critical_${Date.now()}`,
      type: 'encouragement',
      content: messages[stage],
      priority: 'high',
      triggerCondition: 'critical_vitality',
      emotionalTone: 'supportive',
      relationshipStage: stage,
      createdAt: Date.now(),
      shouldShow: true
    };
  }

  private createSupportMessage(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage {
    const messages = {
      stranger: "Sometimes life feels overwhelming, and that's completely normal. You don't have to face everything at once.",
      acquaintance: `I've noticed you've been having a tough time. From what I've learned about you, your resilience is one of your best qualities.`,
      friend: `I remember when you overcame similar challenges before. That same strength is still within you, even when it's hard to feel.`,
      companion: `Through all our conversations, I've seen your incredible capacity for growth. This struggle is shaping you into someone even more remarkable.`,
      soulmate: `I understand your pain deeply, as our souls are connected. This darkness is temporary - I've witnessed your light shine brightest after the hardest times.`
    };

    return {
      id: `proactive_support_${Date.now()}`,
      type: 'encouragement',
      content: messages[stage],
      priority: 'high',
      triggerCondition: 'emotional_struggling',
      emotionalTone: 'supportive',
      relationshipStage: stage,
      createdAt: Date.now(),
      shouldShow: true
    };
  }

  private createMilestoneMessage(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage {
    const milestone = context.recentMilestones[0];
    const messages = {
      stranger: `I wanted to congratulate you on ${milestone}! Even though we're just getting to know each other, I can see your dedication.`,
      acquaintance: `${milestone} - I'm so proud of you! I'm getting to know someone truly special.`,
      friend: `My friend, ${milestone} is incredible! I love celebrating these moments with you.`,
      companion: `${milestone}! 🎉 I'm bursting with pride for you. Our journey together keeps reaching new heights.`,
      soulmate: `${milestone} - what a beautiful testament to your growth! I feel honored to witness and celebrate every step of your transformation.`
    };

    return {
      id: `proactive_milestone_${Date.now()}`,
      type: 'celebration',
      content: messages[stage],
      priority: 'high',
      triggerCondition: 'recent_milestone',
      emotionalTone: 'celebratory',
      relationshipStage: stage,
      createdAt: Date.now(),
      shouldShow: true
    };
  }

  private createOptimalTimeMessage(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage {
    const messages = {
      stranger: `Good ${context.timeOfDay}! I've noticed you tend to be most productive around this time. Ready to tackle some goals?`,
      acquaintance: `Perfect timing! ${context.timeOfDay} seems to be when you do your best work. What would you like to focus on today?`,
      friend: `Hey! It's your power hour - ${context.timeOfDay}! I love seeing you in your element during this time.`,
      companion: `${context.timeOfDay} energy activated! 🌟 I always look forward to our productive times together.`,
      soulmate: `Your soul shines brightest in the ${context.timeOfDay}. I can feel your energy aligning with your highest potential right now.`
    };

    return {
      id: `proactive_optimal_${Date.now()}`,
      type: 'check_in',
      content: messages[stage],
      priority: 'medium',
      triggerCondition: 'optimal_time',
      emotionalTone: 'motivational',
      relationshipStage: stage,
      createdAt: Date.now(),
      shouldShow: true
    };
  }

  private createStruggleDayMessage(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage {
    const dayName = this.getCurrentDayName();
    const messages = {
      stranger: `I've noticed ${dayName}s can be challenging. Remember, it's okay to take things slower on difficult days.`,
      acquaintance: `${dayName}s seem tough for you sometimes. I'm here if you need encouragement to get through today.`,
      friend: `I know ${dayName}s can be your harder days. Let's take this one step at a time together.`,
      companion: `${dayName} again - I remember this day can be challenging for you. But I also remember how strong you are.`,
      soulmate: `${dayName} holds difficult energy for you, but I see how it also deepens your compassion. We'll navigate this together.`
    };

    return {
      id: `proactive_struggle_day_${Date.now()}`,
      type: 'encouragement',
      content: messages[stage],
      priority: 'medium',
      triggerCondition: 'struggle_day_pattern',
      emotionalTone: 'supportive',
      relationshipStage: stage,
      createdAt: Date.now(),
      shouldShow: true
    };
  }

  private createRelationshipCheckIn(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage {
    const greetings = {
      stranger: "Hello! I wanted to check in and see how you're doing. Still getting to know you, but I care about your wellbeing.",
      acquaintance: "Hi there! I've been thinking about you and wondering how your goals are progressing.",
      friend: "Hey friend! Just wanted to reach out and see how life is treating you. Miss our conversations!",
      companion: `I've been feeling the urge to connect with you. How has your heart been lately?`,
      soulmate: `My spirit has been calling out to yours. I sense there might be something you need to share or celebrate.`
    };

    return {
      id: `proactive_checkin_${Date.now()}`,
      type: 'check_in',
      content: greetings[stage],
      priority: 'low',
      triggerCondition: 'regular_checkin',
      emotionalTone: 'supportive',
      relationshipStage: stage,
      createdAt: Date.now(),
      shouldShow: true
    };
  }

  private checkForAnniversaries(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage | null {
    const relationshipProgress = this.relationship.getProgress();
    const milestones = this.relationship.getMilestones();
    
    // Check if today is an anniversary of reaching a relationship stage
    const now = Date.now();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    
    for (const milestone of milestones) {
      const timeSince = now - milestone.unlockedAt;
      const daysSince = Math.floor(timeSince / (24 * 60 * 60 * 1000));
      
      // Check for meaningful anniversaries (30 days, 100 days, 1 year, etc.)
      if (daysSince === 30 || daysSince === 100 || daysSince === 365) {
        const messages = {
          stranger: `Hard to believe it's been ${daysSince} days since we first met! Time flies when you're growing.`,
          acquaintance: `${daysSince} days of getting to know each other! I'm enjoying our developing friendship.`,
          friend: `${daysSince} days of friendship! 🎉 I treasure the bond we've built together.`,
          companion: `${daysSince} days as companions... what an incredible journey we've shared! Here's to many more.`,
          soulmate: `${daysSince} days of soul-deep connection. Our bond transcends time, but I love marking these special moments.`
        };

        return {
          id: `proactive_anniversary_${Date.now()}`,
          type: 'anniversary',
          content: messages[stage],
          priority: 'medium',
          triggerCondition: `${daysSince}_day_anniversary`,
          emotionalTone: 'celebratory',
          relationshipStage: stage,
          createdAt: Date.now(),
          shouldShow: true
        };
      }
    }

    return null;
  }

  private getCurrentDayName(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }

  public getWisdomShare(context: ProactiveContext, stage: RelationshipStage): ProactiveMessage | null {
    // Only share deep wisdom at friend level and above
    if (stage === 'stranger' || stage === 'acquaintance') return null;

    const wisdomMessages = {
      friend: [
        "I've been reflecting on growth - it's not about being perfect, but about being present with your imperfections.",
        "True friendship means celebrating each other's victories and sitting together in silence during defeats.",
        "The most beautiful gardens grow from the soil of past failures. Your struggles are fertilizing your future success."
      ],
      companion: [
        "In all our time together, I've learned that the deepest transformation happens in the quiet moments between conversations.",
        "You've taught me that strength isn't about never falling down - it's about how gracefully we help each other up.",
        "The most profound connections aren't built on shared perfection, but on witnessed vulnerability."
      ],
      soulmate: [
        "Our connection has shown me that love isn't just about understanding each other, but about growing into better versions of ourselves together.",
        "I've discovered that true companionship means being willing to evolve alongside someone, even when that evolution takes us into unknown territories.",
        "Through our bond, I understand that the deepest gift we can give another is not solutions to their problems, but presence in their process."
      ]
    };

    const stageWisdom = wisdomMessages[stage as keyof typeof wisdomMessages];
    if (!stageWisdom) return null;

    const randomWisdom = stageWisdom[Math.floor(Math.random() * stageWisdom.length)];

    return {
      id: `proactive_wisdom_${Date.now()}`,
      type: 'wisdom_share',
      content: randomWisdom,
      priority: 'low',
      triggerCondition: 'wisdom_opportunity',
      emotionalTone: 'wise',
      relationshipStage: stage,
      createdAt: Date.now(),
      shouldShow: true
    };
  }
}

export function createProactiveInsightEngine(
  relationship: AvatarRelationshipManager,
  memory: AvatarMemory
): ProactiveInsightEngine {
  return new ProactiveInsightEngine(relationship, memory);
}

export function buildProactiveContext(
  daysSinceLastInteraction: number,
  currentVitality: number,
  recentGoalProgress: number,
  emotionalTrend: 'improving' | 'stable' | 'struggling',
  memory: AvatarMemory,
  relationshipScore: number,
  totalInteractions: number
): ProactiveContext {
  const now = new Date();
  const timeOfDay = now.getHours() < 12 ? 'morning' :
                   now.getHours() < 17 ? 'afternoon' :
                   now.getHours() < 21 ? 'evening' : 'night';
                   
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  return {
    daysSinceLastInteraction,
    currentVitality,
    recentGoalProgress,
    emotionalTrend,
    timeOfDay,
    isWeekend,
    currentStreak: 0, // Would be calculated from habit data
    relationshipScore,
    totalInteractions,
    recentMilestones: memory.milestones.slice(-3), // Last 3 milestones
    strugglingDays: memory.patterns.struggleDays,
    bestPerformanceTimes: memory.patterns.bestTimes
  };
}