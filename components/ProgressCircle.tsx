import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ProgressCircleProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  animated = true,
}) => {
  const { theme } = useTheme();
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, animated, animatedValue]);

  const percentage = Math.round(progress * 100);

  return (
    <View style={{ 
      width: size, 
      height: size, 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: theme.colors.background.tertiary,
        }}
      />
      
      {/* Progress circle */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: theme.colors.primary,
          borderRightColor: progress > 0.25 ? theme.colors.primary : 'transparent',
          borderBottomColor: progress > 0.5 ? theme.colors.primary : 'transparent',
          borderLeftColor: progress > 0.75 ? theme.colors.primary : 'transparent',
          transform: [{ rotate: '-90deg' }],
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      />
      
      {/* Percentage text */}
      <Text
        style={{
          fontSize: size * 0.2,
          fontWeight: '700',
          color: theme.colors.text.primary,
        }}
      >
        {percentage}%
      </Text>
    </View>
  );
};