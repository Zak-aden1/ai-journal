export type VitalityLevel = 'critical' | 'low' | 'medium' | 'high' | 'perfect';
export type AvatarType = 'plant' | 'pet' | 'robot' | 'base';
export type CommunicationStyle = 'cheerful' | 'wise' | 'analytical' | 'casual';
export type MotivationStyle = 'celebration' | 'gentle-push' | 'logical' | 'emotional';

export interface AvatarPersonality {
  traits: {
    enthusiasm: number;     // 1-10: How excited they get
    supportive: number;     // 1-10: How encouraging they are  
    analytical: number;     // 1-10: How detail-focused they are
    playful: number;       // 1-10: How fun/casual they are
    patient: number;       // 1-10: How they handle setbacks
  };
  communicationStyle: CommunicationStyle;
  responsePatterns: string[];
  motivationStyle: MotivationStyle;
}

export type AvatarEmotionalState = 
  | 'neutral' 
  | 'celebrating' 
  | 'motivated' 
  | 'discouraged' 
  | 'curious' 
  | 'determined' 
  | 'overwhelmed' 
  | 'content'
  | 'thinking'
  | 'speaking';

export interface AvatarProps {
  vitality: number; // 0-100
  size?: number;
  animated?: boolean;
  showBorder?: boolean;
  style?: any;
  emotionalState?: AvatarEmotionalState;
  isTyping?: boolean;
  recentActivity?: 'message_sent' | 'message_received' | 'idle';
}

export interface AvatarState {
  level: VitalityLevel;
  emoji: string;
  backgroundColor: string;
  borderColor: string;
  pulseColor: string;
  description: string;
}

export interface AvatarMemory {
  milestones: string[];
  patterns: {
    bestTimes: string[];
    struggleDays: string[];
    favoriteGoals: string[];
  };
  emotionalHistory: {
    mood: string;
    context: string;
    timestamp: number;
  }[];
  personalContext: {
    goalNames: string[];
    habitTypes: string[];
    userName?: string;
  };
}

export const getVitalityLevel = (vitality: number): VitalityLevel => {
  if (vitality <= 15) return 'critical';
  if (vitality <= 35) return 'low';
  if (vitality <= 65) return 'medium';
  if (vitality <= 85) return 'high';
  return 'perfect';
};

export const getVitalityDescription = (level: VitalityLevel): string => {
  switch (level) {
    case 'critical':
      return 'Needs urgent care';
    case 'low':
      return 'Feeling down';
    case 'medium':
      return 'Doing okay';
    case 'high':
      return 'Feeling great';
    case 'perfect':
      return 'Absolutely thriving';
  }
};