import { AvatarType, AvatarPersonality, AvatarMemory, VitalityLevel } from '@/components/avatars/types';
import { Entry, Mode } from '@/stores/app';

/**
 * Avatar Personality Configuration
 * Each avatar type has distinct personality traits and communication styles
 */
export const AVATAR_PERSONALITIES: Record<AvatarType, AvatarPersonality> = {
  plant: {
    traits: {
      enthusiasm: 6,    // Measured, not overly excited
      supportive: 9,    // Very nurturing and encouraging
      analytical: 7,    // Thoughtful and insightful
      playful: 4,       // More serious, growth-focused
      patient: 10,      // Extremely patient like nature
    },
    communicationStyle: 'wise',
    motivationStyle: 'gentle-push',
    responsePatterns: [
      'Like a seed that grows slowly but surely...',
      'Every small step is progress, just like how plants grow',
      'Remember, even the mightiest oak started as an acorn',
      'Growth takes time - be patient with yourself',
      'Your journey is like tending a garden',
    ]
  },

  pet: {
    traits: {
      enthusiasm: 10,   // Maximum excitement and energy
      supportive: 8,    // Very encouraging, like a loyal companion
      analytical: 3,    // Not focused on details, more emotional
      playful: 9,       // High energy, fun-loving
      patient: 6,       // Moderate patience, eager for action
    },
    communicationStyle: 'cheerful',
    motivationStyle: 'celebration',
    responsePatterns: [
      'Woof woof! You did it! 🐕',
      'I&apos;m so proud of you!',
      'Let&apos;s celebrate this win together!',
      'You&apos;re amazing! Keep going!',
      'Every day with you is an adventure!',
    ]
  },

  robot: {
    traits: {
      enthusiasm: 7,    // Controlled enthusiasm
      supportive: 7,    // Supportive in a logical way
      analytical: 10,   // Maximum analytical thinking
      playful: 2,       // Very serious and focused
      patient: 9,       // Very patient and systematic
    },
    communicationStyle: 'analytical',
    motivationStyle: 'logical',
    responsePatterns: [
      'Data analysis complete: You&apos;re making progress',
      'Efficiency optimized through consistent habits',
      'Calculating success probability... Looking good!',
      'System update: Your performance metrics are improving',
      'Logic confirms: Persistence leads to success',
    ]
  },

  base: {
    traits: {
      enthusiasm: 6,    // Balanced enthusiasm
      supportive: 7,    // Moderately supportive
      analytical: 5,    // Balanced analytical thinking
      playful: 5,       // Moderately playful
      patient: 7,       // Good patience level
    },
    communicationStyle: 'casual',
    motivationStyle: 'emotional',
    responsePatterns: [
      'Nice work on that!',
      'You&apos;re doing great!',
      'Keep it up, I believe in you',
      'Every step counts',
      'You&apos;ve got this!',
    ]
  }
};

/**
 * Context for generating personalized responses
 */
export interface ResponseContext {
  currentVitality: number;
  recentEntries: Entry[];
  goals: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  mode: Mode;
  progress?: {
    habitsCompleted: number;
    goalsInProgress: number;
  };
}

/**
 * Generate a personalized response based on avatar type, context, and memory
 */
export function generatePersonalizedResponse(
  avatarType: AvatarType,
  context: ResponseContext,
  memory: AvatarMemory
): string {
  const personality = AVATAR_PERSONALITIES[avatarType];
  const baseResponse = getContextualBaseResponse(avatarType, context, memory);
  
  return applyPersonalityModifiers(baseResponse, personality, context);
}

/**
 * Get base response based on context and memory
 */
function getContextualBaseResponse(
  avatarType: AvatarType,
  context: ResponseContext,
  memory: AvatarMemory
): string {
  const personality = AVATAR_PERSONALITIES[avatarType];
  
  // Check for milestone achievements first (highest priority)
  if (context.progress?.habitsCompleted && context.progress.habitsCompleted > 0) {
    return getAchievementResponse(avatarType, context.progress.habitsCompleted, memory);
  }
  
  // Check for returning user patterns
  const returningUserResponse = getReturningUserResponse(avatarType, memory, context);
  if (returningUserResponse) return returningUserResponse;
  
  // Check for struggle pattern recognition
  const struggleResponse = getStrugglePatternResponse(avatarType, memory, context);
  if (struggleResponse) return struggleResponse;
  
  // Check for low vitality encouraging response
  if (context.currentVitality < 30) {
    return getLowVitalityResponse(avatarType, memory);
  }
  
  // Check for high vitality celebration
  if (context.currentVitality > 80) {
    return getHighVitalityResponse(avatarType, memory);
  }
  
  // Time-based responses with memory context
  const timeResponse = getTimeBasedResponse(avatarType, context.timeOfDay, memory);
  if (timeResponse) return timeResponse;
  
  // Goal-specific encouragement if goals are available
  const goalResponse = getGoalSpecificResponse(avatarType, context.goals, memory);
  if (goalResponse) return goalResponse;
  
  // Default to personality pattern with memory enhancement
  const baseResponse = personality.responsePatterns[Math.floor(Math.random() * personality.responsePatterns.length)];
  return enhanceWithMemoryContext(baseResponse, memory, avatarType);
}

/**
 * Apply personality traits to modify response tone and content
 */
function applyPersonalityModifiers(
  baseResponse: string,
  personality: AvatarPersonality,
  context: ResponseContext
): string {
  let modifiedResponse = baseResponse;
  
  // Add enthusiasm based on trait level
  if (personality.traits.enthusiasm > 7) {
    modifiedResponse = addEnthusiasmMarkers(modifiedResponse);
  }
  
  // Add analytical insights if high analytical trait
  if (personality.traits.analytical > 7 && context.progress) {
    const insight = getAnalyticalInsight(context);
    if (insight) {
      modifiedResponse += ` ${insight}`;
    }
  }
  
  // Add playful elements if high playfulness
  if (personality.traits.playful > 7) {
    modifiedResponse = addPlayfulElements(modifiedResponse);
  }
  
  return modifiedResponse;
}

/**
 * Get responses for returning users based on patterns
 */
function getReturningUserResponse(avatarType: AvatarType, memory: AvatarMemory, context: ResponseContext): string | null {
  // Look for favorite goals or best times
  const favoriteGoal = memory.patterns.favoriteGoals[memory.patterns.favoriteGoals.length - 1];
  const bestTime = memory.patterns.bestTimes[memory.patterns.bestTimes.length - 1];
  
  if (favoriteGoal && context.goals.includes(favoriteGoal)) {
    switch (avatarType) {
      case 'plant':
        return `I see you're back to working on ${favoriteGoal}. Like returning to a well-tended garden, your consistency will bloom beautifully.`;
      case 'pet':
        return `Yay! Back to ${favoriteGoal}! I missed working on this with you! Let's make today amazing! 🎾`;
      case 'robot':
        return `Resuming ${favoriteGoal} protocol. Previous performance data indicates high success probability for this objective.`;
      case 'base':
        return `Great to see you focusing on ${favoriteGoal} again. You've shown good progress here before.`;
    }
  }
  
  if (bestTime && context.timeOfDay === bestTime) {
    switch (avatarType) {
      case 'plant':
        return `Perfect timing! ${bestTime} has been your most productive time. Your natural rhythm is shining through.`;
      case 'pet':
        return `Woof! It's ${bestTime} - your power hour! You always do amazing work at this time! 🌟`;
      case 'robot':
        return `Optimal timing detected. Historical data shows ${bestTime} yields peak performance for your workflow.`;
      case 'base':
        return `Nice timing! ${bestTime} tends to be when you're most focused and productive.`;
    }
  }
  
  return null;
}

/**
 * Get responses when user struggle patterns are detected
 */
function getStrugglePatternResponse(avatarType: AvatarType, memory: AvatarMemory, context: ResponseContext): string | null {
  const recentStruggles = memory.patterns.struggleDays;
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  if (recentStruggles.includes(currentDay) && context.currentVitality < 50) {
    switch (avatarType) {
      case 'plant':
        return `I notice ${currentDay}s can be challenging for you. Remember, even storms help roots grow deeper. Take it one small step at a time.`;
      case 'pet':
        return `Hey, I know ${currentDay}s are tough for you sometimes. But I'm here, and we'll get through this together! 🐾`;
      case 'robot':
        return `Pattern analysis: ${currentDay} difficulty detected. Recommending reduced task load and self-compassion protocols.`;
      case 'base':
        return `I've noticed ${currentDay}s can be harder for you. That's completely normal - be gentle with yourself today.`;
    }
  }
  
  return null;
}

/**
 * Get goal-specific responses based on user's current goals
 */
function getGoalSpecificResponse(avatarType: AvatarType, goals: string[], memory: AvatarMemory): string | null {
  if (goals.length === 0) return null;
  
  const randomGoal = goals[Math.floor(Math.random() * goals.length)];
  const isFrequentGoal = memory.patterns.favoriteGoals.includes(randomGoal);
  
  if (isFrequentGoal) {
    switch (avatarType) {
      case 'plant':
        return `Your dedication to ${randomGoal} reminds me of how consistent watering helps a plant flourish. Keep nurturing this growth.`;
      case 'pet':
        return `I love how committed you are to ${randomGoal}! Your persistence makes my tail wag with pride! 🎯`;
      case 'robot':
        return `${randomGoal} shows consistent engagement in your behavior patterns. Maintaining this focus will optimize results.`;
      case 'base':
        return `Your consistency with ${randomGoal} is really paying off. Keep building on this momentum.`;
    }
  }
  
  return null;
}

/**
 * Enhance base responses with memory context
 */
function enhanceWithMemoryContext(baseResponse: string, memory: AvatarMemory, avatarType: AvatarType): string {
  // Add milestone references occasionally
  const recentMilestone = memory.milestones[memory.milestones.length - 1];
  if (recentMilestone && Math.random() < 0.3) { // 30% chance to reference milestone
    const milestoneAddition = getMilestoneAddition(recentMilestone, avatarType);
    if (milestoneAddition) {
      return `${baseResponse} ${milestoneAddition}`;
    }
  }
  
  // Add emotional context if recent emotional history is available
  const recentEmotion = memory.emotionalHistory[memory.emotionalHistory.length - 1];
  if (recentEmotion && (Date.now() - recentEmotion.timestamp) < 86400000) { // Within 24 hours
    const emotionalAddition = getEmotionalContextAddition(recentEmotion, avatarType);
    if (emotionalAddition) {
      return `${baseResponse} ${emotionalAddition}`;
    }
  }
  
  return baseResponse;
}

/**
 * Get milestone reference additions
 */
function getMilestoneAddition(milestone: string, avatarType: AvatarType): string | null {
  switch (avatarType) {
    case 'plant':
      return `Building on your recent success with ${milestone}.`;
    case 'pet':
      return `Just like when you achieved ${milestone}!`;
    case 'robot':
      return `Previous success: ${milestone}. Applying similar strategies.`;
    case 'base':
      return `Remember your progress with ${milestone}?`;
    default:
      return null;
  }
}

/**
 * Get emotional context additions
 */
function getEmotionalContextAddition(emotion: { mood: string; context: string }, avatarType: AvatarType): string | null {
  if (emotion.mood === '😊' || emotion.mood === '😍') {
    switch (avatarType) {
      case 'plant': return 'I sense your positive energy growing.';
      case 'pet': return 'Your happiness makes me happy too!';
      case 'robot': return 'Positive emotional state detected.';
      case 'base': return 'I can feel your good vibes.';
    }
  } else if (emotion.mood === '😔' || emotion.mood === '😤') {
    switch (avatarType) {
      case 'plant': return 'Even in difficult seasons, growth continues.';
      case 'pet': return 'I\'m here for you no matter what.';
      case 'robot': return 'Emotional support protocols activated.';
      case 'base': return 'Taking things one step at a time.';
    }
  }
  return null;
}

/**
 * Get achievement-based responses
 */
function getAchievementResponse(avatarType: AvatarType, habitsCompleted: number, memory: AvatarMemory): string {
  const personality = AVATAR_PERSONALITIES[avatarType];
  const isMultipleHabits = habitsCompleted > 1;
  const habitWord = isMultipleHabits ? 'habits' : 'habit';
  
  // Check for streak achievements in memory
  const hasRecentMilestone = memory.milestones.length > 0;
  const recentMilestone = hasRecentMilestone ? memory.milestones[memory.milestones.length - 1] : null;
  
  // Base achievement response with personality
  let baseResponse: string;
  switch (avatarType) {
    case 'plant':
      if (habitsCompleted >= 3) {
        baseResponse = `Magnificent! You've completed ${habitsCompleted} ${habitWord} today. Your garden of habits is flourishing beautifully - each completion is like sunlight feeding your growth.`;
      } else {
        baseResponse = `Beautiful! You've completed ${habitsCompleted} ${habitWord} today. Like sunlight feeding a plant, each habit nourishes your growth.`;
      }
      break;
    case 'pet':
      if (habitsCompleted >= 3) {
        baseResponse = `AMAZING! ${habitsCompleted} ${habitWord} done! 🎉🌟 I'm doing happy zoomies! You're absolutely incredible!`;
      } else {
        baseResponse = `Woohoo! ${habitsCompleted} ${habitWord} done! 🎉 You're the best human ever!`;
      }
      break;
    case 'robot':
      if (habitsCompleted >= 3) {
        baseResponse = `Outstanding performance: ${habitsCompleted} ${habitWord} completed. Efficiency rating: Superior. System optimization achieved.`;
      } else {
        baseResponse = `Achievement unlocked: ${habitsCompleted} ${habitWord} completed. Performance metrics: Excellent. Continue current trajectory.`;
      }
      break;
    case 'base':
      if (habitsCompleted >= 3) {
        baseResponse = `Fantastic! ${habitsCompleted} ${habitWord} completed today! You're really building impressive momentum.`;
      } else {
        baseResponse = `Nice job completing ${habitsCompleted} ${habitWord} today! You're building great momentum.`;
      }
      break;
    default:
      baseResponse = personality.responsePatterns[0];
  }
  
  // Add memory context if available
  if (recentMilestone && Math.random() < 0.4) { // 40% chance for achievements to reference milestones
    const milestoneAddition = getMilestoneAchievementAddition(recentMilestone, avatarType);
    if (milestoneAddition) {
      baseResponse += ` ${milestoneAddition}`;
    }
  }
  
  return baseResponse;
}

/**
 * Get milestone additions specifically for achievements
 */
function getMilestoneAchievementAddition(milestone: string, avatarType: AvatarType): string | null {
  switch (avatarType) {
    case 'plant':
      return `Your growth since ${milestone} has been remarkable to watch.`;
    case 'pet':
      return `This reminds me of your awesome ${milestone} achievement!`;
    case 'robot':
      return `Building on previous milestone: ${milestone}. Pattern consistency detected.`;
    case 'base':
      return `You're really building on that ${milestone} success.`;
    default:
      return null;
  }
}

/**
 * Get low vitality encouragement responses
 */
function getLowVitalityResponse(avatarType: AvatarType, memory: AvatarMemory): string {
  switch (avatarType) {
    case 'plant':
      return "Even in difficult seasons, roots grow deeper. This challenging time is building your inner strength.";
    case 'pet':
      return "Hey, it&apos;s okay to have tough days. I&apos;m here with you, always! Tomorrow is a new adventure! 🐾";
    case 'robot':
      return "System analysis: Temporary low energy detected. Recommended action: Small, manageable tasks to rebuild momentum.";
    case 'base':
      return "Everyone has tough days. Be gentle with yourself and take it one step at a time.";
    default:
      return "You&apos;re going through a difficult time, but I believe in your strength.";
  }
}

/**
 * Get high vitality celebration responses
 */
function getHighVitalityResponse(avatarType: AvatarType, memory: AvatarMemory): string {
  switch (avatarType) {
    case 'plant':
      return "You&apos;re absolutely blooming! Your consistent care is showing beautiful results. Keep nurturing this growth.";
    case 'pet':
      return "You&apos;re AMAZING! Look at you thriving! I&apos;m doing happy zoomies just thinking about your success! 🌟";
    case 'robot':
      return "Optimal performance achieved! All systems functioning at peak efficiency. Maintain current protocols for continued success.";
    case 'base':
      return "You&apos;re doing fantastic! This positive momentum is exactly what success looks like.";
    default:
      return "You&apos;re doing incredibly well! Keep up the great work!";
  }
}

/**
 * Get time-based contextual responses
 */
function getTimeBasedResponse(avatarType: AvatarType, timeOfDay: string, memory: AvatarMemory): string | null {
  // Check if this time matches user's best performance patterns
  const isOptimalTime = memory.patterns.bestTimes.includes(timeOfDay);
  
  switch (timeOfDay) {
    case 'morning':
      if (isOptimalTime) {
        switch (avatarType) {
          case 'plant':
            return "Perfect morning timing! Like morning dew at sunrise, your energy is at its peak for growth.";
          case 'pet':
            return "YES! Morning power time! Your best hours are here - let's make magic happen! ☀️✨";
          case 'robot':
            return "Optimal productivity window detected. Morning systems at peak efficiency. Executing priority protocols.";
          case 'base':
            return "Great timing! Morning is when you typically perform at your best.";
        }
      } else {
        switch (avatarType) {
          case 'plant':
            return "Good morning! Like morning dew nourishing leaves, let today's intentions nourish your goals.";
          case 'pet':
            return "Morning! Morning! It's a new day full of possibilities! Let's make it awesome! ☀️";
          case 'robot':
            return "Morning systems check complete. Ready to optimize today's productivity. What's our primary objective?";
          case 'base':
            return "Good morning! Ready to tackle today's goals?";
        }
      }
      break;
      
    case 'afternoon':
      if (isOptimalTime) {
        switch (avatarType) {
          case 'plant':
            return "Afternoon sunshine! This is your time to flourish - your productivity blooms in these hours.";
          case 'pet':
            return "Afternoon power mode activated! 🌟 This is when you really shine, buddy!";
          case 'robot':
            return "Afternoon efficiency protocols engaged. Peak performance window identified.";
          case 'base':
            return "Perfect afternoon timing! This is typically your most productive time.";
        }
      } else {
        switch (avatarType) {
          case 'plant':
            return "Good afternoon! The sun is high and your potential is growing. Time to nurture your goals.";
          case 'pet':
            return "Afternoon check-in! How are we doing, superstar? Ready for some goal-crushing action? 🎯";
          case 'robot':
            return "Afternoon status update: Ready to continue optimizing your daily objectives.";
          case 'base':
            return "Good afternoon! How's your progress going today?";
        }
      }
      break;
      
    case 'evening':
      switch (avatarType) {
        case 'plant':
          return "Evening reflection time. Like a tree settling into peaceful rest, let's review how you've grown today.";
        case 'pet':
          return "Evening wind-down! 🌙 Time to celebrate today's wins and snuggle up with some good progress!";
        case 'robot':
          return "Evening analysis mode. Reviewing daily metrics and preparing optimization strategies for tomorrow.";
        case 'base':
          return "Good evening! Time to reflect on today's progress and plan for tomorrow.";
      }
      break;
      
    case 'night':
      switch (avatarType) {
        case 'plant':
          return "Quiet night energy. Even in rest, growth continues. Your consistent efforts are taking root deeply.";
        case 'pet':
          return "Late night check-in! 🌙 Remember to rest well - tomorrow brings new adventures together!";
        case 'robot':
          return "Night mode: Systems suggest rest for optimal performance. Tomorrow's objectives will be clearer after recharge.";
        case 'base':
          return "Late evening! Don't forget to rest well - consistent sleep helps with consistent habits.";
      }
      break;
  }
  
  return null;
}

/**
 * Add enthusiasm markers to responses
 */
function addEnthusiasmMarkers(response: string): string {
  const markers = ['!', ' 🌟', ' ✨', ' 🎉'];
  const randomMarker = markers[Math.floor(Math.random() * markers.length)];
  return response + randomMarker;
}

/**
 * Get analytical insights based on progress data
 */
function getAnalyticalInsight(context: ResponseContext): string | null {
  if (context.progress?.habitsCompleted && context.progress.habitsCompleted > 0) {
    const completionRate = (context.progress.habitsCompleted / (context.progress.goalsInProgress || 1)) * 100;
    if (completionRate > 75) {
      return "Analysis: 75%+ completion rate indicates strong habit formation.";
    }
  }
  return null;
}

/**
 * Add playful elements to responses
 */
function addPlayfulElements(response: string): string {
  const playfulMarkers = [' 🎈', ' 🎪', ' 🎯', ' 🚀'];
  const randomMarker = playfulMarkers[Math.floor(Math.random() * playfulMarkers.length)];
  return response + randomMarker;
}

/**
 * Update avatar memory with new interactions and achievements
 */
export function updateAvatarMemory(
  currentMemory: AvatarMemory,
  update: {
    milestone?: string;
    pattern?: { type: 'bestTime' | 'struggleDay' | 'favoriteGoal'; value: string };
    emotion?: { mood: string; context: string };
    personalContext?: { goalName?: string; habitType?: string; userName?: string };
  }
): AvatarMemory {
  const newMemory = { ...currentMemory };
  
  if (update.milestone) {
    newMemory.milestones = [...newMemory.milestones, update.milestone].slice(-10); // Keep last 10
  }
  
  if (update.pattern) {
    switch (update.pattern.type) {
      case 'bestTime':
        newMemory.patterns.bestTimes = [...newMemory.patterns.bestTimes, update.pattern.value].slice(-5);
        break;
      case 'struggleDay':
        newMemory.patterns.struggleDays = [...newMemory.patterns.struggleDays, update.pattern.value].slice(-5);
        break;
      case 'favoriteGoal':
        newMemory.patterns.favoriteGoals = [...newMemory.patterns.favoriteGoals, update.pattern.value].slice(-3);
        break;
    }
  }
  
  if (update.emotion) {
    newMemory.emotionalHistory = [
      ...newMemory.emotionalHistory,
      { ...update.emotion, timestamp: Date.now() }
    ].slice(-20); // Keep last 20 emotional states
  }
  
  if (update.personalContext) {
    if (update.personalContext.goalName) {
      newMemory.personalContext.goalNames = [
        ...newMemory.personalContext.goalNames,
        update.personalContext.goalName
      ].slice(-10);
    }
    if (update.personalContext.habitType) {
      newMemory.personalContext.habitTypes = [
        ...newMemory.personalContext.habitTypes,
        update.personalContext.habitType
      ].slice(-10);
    }
    if (update.personalContext.userName) {
      newMemory.personalContext.userName = update.personalContext.userName;
    }
  }
  
  return newMemory;
}

/**
 * Get avatar personality configuration
 */
export function getAvatarPersonality(avatarType: AvatarType): AvatarPersonality {
  return AVATAR_PERSONALITIES[avatarType];
}

/**
 * Calculate vitality-based response intensity
 */
export function calculateVitalityResponse(currentVitality: number, change: number): {
  intensity: 'low' | 'medium' | 'high';
  type: 'encouragement' | 'celebration' | 'maintenance';
} {
  if (currentVitality < 30) {
    return { intensity: 'high', type: 'encouragement' };
  }
  
  if (currentVitality > 80 || change > 20) {
    return { intensity: 'high', type: 'celebration' };
  }
  
  return { intensity: 'medium', type: 'maintenance' };
}

/**
 * Analyze user patterns to suggest optimal timing for activities
 */
export function analyzeUserPatterns(memory: AvatarMemory): {
  bestTimeOfDay?: string;
  mostEngagedGoal?: string;
  emotionalTrend: 'improving' | 'stable' | 'struggling';
  streakPotential: number; // 0-100
} {
  // Determine best time of day
  const bestTimeOfDay = memory.patterns.bestTimes.length > 0 
    ? memory.patterns.bestTimes[memory.patterns.bestTimes.length - 1] 
    : undefined;
    
  // Determine most engaged goal
  const mostEngagedGoal = memory.patterns.favoriteGoals.length > 0
    ? memory.patterns.favoriteGoals[memory.patterns.favoriteGoals.length - 1]
    : undefined;
    
  // Analyze emotional trend
  const recentEmotions = memory.emotionalHistory.slice(-5); // Last 5 emotions
  let emotionalTrend: 'improving' | 'stable' | 'struggling' = 'stable';
  
  if (recentEmotions.length >= 3) {
    const positiveCount = recentEmotions.filter(e => e.mood === '😊' || e.mood === '😍').length;
    const negativeCount = recentEmotions.filter(e => e.mood === '😔' || e.mood === '😤').length;
    
    if (positiveCount > negativeCount && positiveCount >= 2) {
      emotionalTrend = 'improving';
    } else if (negativeCount > positiveCount && negativeCount >= 2) {
      emotionalTrend = 'struggling';
    }
  }
  
  // Calculate streak potential based on patterns
  let streakPotential = 50; // Base
  if (bestTimeOfDay) streakPotential += 20;
  if (mostEngagedGoal) streakPotential += 15;
  if (emotionalTrend === 'improving') streakPotential += 15;
  if (memory.milestones.length > 3) streakPotential += 10; // Multiple achievements
  
  return {
    bestTimeOfDay,
    mostEngagedGoal,
    emotionalTrend,
    streakPotential: Math.min(100, streakPotential)
  };
}

/**
 * Generate memory-aware motivational insights
 */
export function generateMotivationalInsight(
  avatarType: AvatarType, 
  memory: AvatarMemory,
  context: ResponseContext
): string | null {
  const analysis = analyzeUserPatterns(memory);
  
  // High potential insight
  if (analysis.streakPotential > 75 && context.currentVitality > 60) {
    switch (avatarType) {
      case 'plant':
        return `Your growth patterns show incredible consistency. You're in a perfect season for breakthrough achievements.`;
      case 'pet':
        return `Wow! Your streak potential is through the roof! I can sense you're about to do something amazing! 🚀`;
      case 'robot':
        return `Analysis complete: Optimal conditions detected for sustained performance. Success probability: ${analysis.streakPotential}%.`;
      case 'base':
        return `Your patterns suggest you're in a great position for a breakthrough. Keep up this momentum!`;
    }
  }
  
  // Struggling insight
  if (analysis.emotionalTrend === 'struggling') {
    switch (avatarType) {
      case 'plant':
        return `Even mighty oak trees face storms. These challenging moments are deepening your roots for future growth.`;
      case 'pet':
        return `I know things feel tough right now, but I see your strength! Small steps, big heart, we've got this! 💝`;
      case 'robot':
        return `Temporary performance variance detected. Adjusting support protocols. Remember: persistence optimizes results.`;
      case 'base':
        return `Tough phases are normal in any growth journey. You've overcome challenges before, and you will again.`;
    }
  }
  
  // Improvement insight
  if (analysis.emotionalTrend === 'improving') {
    switch (avatarType) {
      case 'plant':
        return `I can feel your energy blossoming! Like sunlight after rain, your positive momentum is beautiful to witness.`;
      case 'pet':
        return `Yes, yes, YES! Your good vibes are infectious! This upward trend makes my heart sing! 🎵✨`;
      case 'robot':
        return `Positive trend confirmed. Emotional metrics improving. Optimal conditions for accelerated progress detected.`;
      case 'base':
        return `Love seeing this positive trend! You're building great momentum - perfect time to lean into your goals.`;
    }
  }
  
  return null;
}

/**
 * Smart memory update based on context and behavior patterns
 */
export function smartMemoryUpdate(
  currentMemory: AvatarMemory,
  context: {
    activityType: 'habit_completion' | 'goal_interaction' | 'journal_entry' | 'achievement';
    timeOfDay: string;
    mood?: string;
    goalName?: string;
    habitType?: string;
    vitality: number;
  }
): AvatarMemory {
  const updates: Parameters<typeof updateAvatarMemory>[1] = {};
  
  // Track best times when user is highly engaged
  if (context.vitality > 70 && context.activityType === 'habit_completion') {
    updates.pattern = { type: 'bestTime', value: context.timeOfDay };
  }
  
  // Track struggle patterns
  if (context.vitality < 30 && context.mood && ['😔', '😤'].includes(context.mood)) {
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    updates.pattern = { type: 'struggleDay', value: dayOfWeek };
  }
  
  // Track favorite goals based on repeated interactions
  if (context.goalName && context.activityType === 'goal_interaction') {
    updates.pattern = { type: 'favoriteGoal', value: context.goalName };
  }
  
  // Track emotional states
  if (context.mood) {
    updates.emotion = {
      mood: context.mood,
      context: context.activityType
    };
  }
  
  // Track personal context
  if (context.goalName || context.habitType) {
    updates.personalContext = {
      goalName: context.goalName,
      habitType: context.habitType
    };
  }
  
  // Generate milestone for significant achievements
  if (context.activityType === 'achievement' && context.vitality > 80) {
    const achievementTypes = ['habit streak', 'goal progress', 'consistency win', 'breakthrough moment'];
    const randomType = achievementTypes[Math.floor(Math.random() * achievementTypes.length)];
    updates.milestone = `${randomType} - ${new Date().toLocaleDateString()}`;
  }
  
  return updateAvatarMemory(currentMemory, updates);
}