import { useReducedMotion } from 'react-native-reanimated';
import { useMemo } from 'react';

export type AvatarMotionPreset = 'idle' | 'pulse' | 'bounce' | 'celebrate' | 'none';

export function useAvatarAnimations() {
  const prefersReduced = useReducedMotion();

  return useMemo(() => {
    const disabled = prefersReduced;
    return {
      prefersReduced,
      isEnabled: !disabled,
      presets: {
        idle: disabled ? 'none' : 'idle',
        pulse: disabled ? 'none' : 'pulse',
        bounce: disabled ? 'none' : 'bounce',
        celebrate: disabled ? 'none' : 'celebrate',
      } as Record<AvatarMotionPreset, AvatarMotionPreset>,
    };
  }, [prefersReduced]);
}


