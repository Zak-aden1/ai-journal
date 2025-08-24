import React, { memo } from 'react';
import { View, AccessibilityInfo } from 'react-native';
import { PlantAvatar } from '../PlantAvatar';
import { PetAvatar } from '../PetAvatar';
import { RobotAvatar } from '../RobotAvatar';
import { BaseAvatar } from '../BaseAvatar';
import type { AvatarType } from '../types';

export type AvatarRendererProps = {
  type: AvatarType;
  name?: string;
  vitality: number;
  size?: number;
  animated?: boolean;
  accentColor?: string;
  accessibilityLabel?: string;
  style?: any;
};

const map: Record<AvatarType, React.ComponentType<{ vitality: number; size?: number; animated?: boolean; style?: any }>> = {
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
}: AvatarRendererProps) {
  const Component = map[type] ?? BaseAvatar;
  const a11yLabel = accessibilityLabel ?? `Avatar, ${type}, vitality ${Math.round(vitality)} percent`;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11yLabel} style={style}>
      <Component vitality={vitality} size={size} animated={animated} />
    </View>
  );
});


