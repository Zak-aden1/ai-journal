import React, { memo } from 'react';
import { View, AccessibilityInfo } from 'react-native';
import { PlantAvatar } from '../PlantAvatar';
import { PetAvatar } from '../PetAvatar';
import { RobotAvatar } from '../RobotAvatar';
import { BaseAvatar } from '../BaseAvatar';
import type { AvatarType } from '../types';

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

export type AvatarRendererProps = {
  type: AvatarType;
  name?: string;
  vitality: number;
  size?: number;
  animated?: boolean;
  accentColor?: string;
  accessibilityLabel?: string;
  style?: any;
  emotionalState?: AvatarEmotionalState;
  isTyping?: boolean;
  recentActivity?: 'message_sent' | 'message_received' | 'idle';
  compact?: boolean;
};

const map: Record<AvatarType, React.ComponentType<{ 
  vitality: number; 
  size?: number; 
  animated?: boolean; 
  style?: any;
  emotionalState?: AvatarEmotionalState;
  isTyping?: boolean;
  recentActivity?: 'message_sent' | 'message_received' | 'idle';
  compact?: boolean;
}>> = {
  plant: PlantAvatar,
  pet: PetAvatar,
  robot: RobotAvatar,
  base: BaseAvatar,
};

export const AvatarRenderer = memo(function AvatarRenderer({
  type,
  vitality,
  size = 80,
  animated = true,
  accessibilityLabel,
  style,
  emotionalState = 'neutral',
  isTyping = false,
  recentActivity = 'idle',
  compact = false,
}: AvatarRendererProps) {
  const Component = map[type] ?? BaseAvatar;
  const a11yLabel = accessibilityLabel ?? `Avatar, ${type}, vitality ${Math.round(vitality)} percent, ${emotionalState}`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11yLabel} style={style}>
      <Component 
        vitality={vitality} 
        size={size} 
        animated={animated}
        emotionalState={emotionalState}
        isTyping={isTyping}
        recentActivity={recentActivity}
        compact={compact}
      />
    </View>
  );
});


