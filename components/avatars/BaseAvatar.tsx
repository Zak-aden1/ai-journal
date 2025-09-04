import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { AvatarProps, getVitalityLevel, getVitalityDescription } from './types';

export function BaseAvatar({ 
  vitality, 
  size = 120, 
  animated = true, 
  showBorder = true,
  style,
  compact = false
}: AvatarProps & { compact?: boolean }) {
  const level = getVitalityLevel(vitality);
  const description = getVitalityDescription(level);
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const bounce = useSharedValue(0);
  
  // Get avatar configuration based on vitality level
  const getAvatarConfig = () => {
    switch (level) {
      case 'critical':
        return {
          emoji: '😵',
          backgroundColor: '#fee2e2',
          borderColor: '#dc2626',
          pulseColor: '#fecaca',
          shadowColor: '#dc2626',
          description: 'Critical - needs immediate attention!'
        };
      case 'low':
        return {
          emoji: '😔',
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          pulseColor: '#fde68a',
          shadowColor: '#f59e0b',
          description: 'Low energy - could use some care'
        };
      case 'medium':
        return {
          emoji: '😐',
          backgroundColor: '#e0f2fe',
          borderColor: '#0284c7',
          pulseColor: '#bae6fd',
          shadowColor: '#0284c7',
          description: 'Neutral - doing okay'
        };
      case 'high':
        return {
          emoji: '😊',
          backgroundColor: '#dcfce7',
          borderColor: '#16a34a',
          pulseColor: '#bbf7d0',
          shadowColor: '#16a34a',
          description: 'Happy - feeling good!'
        };
      case 'perfect':
        return {
          emoji: '🤩',
          backgroundColor: '#fdf4ff',
          borderColor: '#c026d3',
          pulseColor: '#f3e8ff',
          shadowColor: '#c026d3',
          description: 'Perfect - absolutely thriving!'
        };
    }
  };
  
  const config = getAvatarConfig();
  
  useEffect(() => {
    if (!animated) return;
    
    // Different animations based on vitality level
    switch (level) {
      case 'critical':
        // Weak, slow pulse
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(0.95, { duration: 1500 }),
            withTiming(1, { duration: 1500 })
          ),
          -1,
          false
        );
        break;
        
      case 'low':
        // Gentle, tired pulse
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(0.98, { duration: 1200 }),
            withTiming(1.02, { duration: 1200 })
          ),
          -1,
          false
        );
        break;
        
      case 'medium':
        // Steady, calm pulse
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          false
        );
        break;
        
      case 'high':
        // Energetic pulse with bounce
        pulseScale.value = withRepeat(
          withSequence(
            withSpring(1.05, { damping: 8, stiffness: 100 }),
            withSpring(1, { damping: 8, stiffness: 100 })
          ),
          -1,
          false
        );
        
        bounce.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 2000 }),
            withSpring(-5, { damping: 8, stiffness: 100 }),
            withSpring(0, { damping: 8, stiffness: 100 })
          ),
          -1,
          false
        );
        break;
        
      case 'perfect':
        // Vibrant pulse with shimmer effect
        pulseScale.value = withRepeat(
          withSequence(
            withSpring(1.08, { damping: 6, stiffness: 120 }),
            withSpring(1, { damping: 6, stiffness: 120 })
          ),
          -1,
          false
        );
        
        shimmer.value = withRepeat(
          withTiming(1, { duration: 2000 }),
          -1,
          false
        );
        
        bounce.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 1500 }),
            withSpring(-8, { damping: 6, stiffness: 120 }),
            withSpring(0, { damping: 6, stiffness: 120 })
          ),
          -1,
          false
        );
        break;
    }
  }, [level, animated, pulseScale, shimmer, bounce]);
  
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmer.value,
      [0, 0.5, 1],
      [config.backgroundColor, config.pulseColor, config.backgroundColor]
    );
    
    return {
      transform: [
        { scale: pulseScale.value },
        { translateY: bounce.value }
      ],
      backgroundColor: animated ? backgroundColor : config.backgroundColor,
    };
  });
  
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: config.borderColor,
    shadowColor: config.shadowColor,
  }));
  
  const styles = createStyles(size, config);
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.avatar, borderStyle, animatedStyle]}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        
        {/* Vitality percentage */}
        <View style={styles.vitalityBadge}>
          <Text style={styles.vitalityText}>{vitality}%</Text>
        </View>
      </Animated.View>
      
      {/* Optional description */}
      <Text style={[styles.description, { color: config.borderColor }]}>
        {config.description}
      </Text>
    </View>
  );
}

const createStyles = (size: number, config: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  emoji: {
    fontSize: size * 0.4,
  },
  vitalityBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  vitalityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});