import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { AvatarProps, getVitalityLevel } from './types';

export function PlantAvatar({ 
  vitality, 
  size = 120, 
  animated = true, 
  showBorder = true,
  style 
}: AvatarProps) {
  const level = getVitalityLevel(vitality);
  
  // Animation values
  const sway = useSharedValue(0);
  const grow = useSharedValue(0.8);
  const sparkle = useSharedValue(0);
  const droop = useSharedValue(0);
  
  // Get plant configuration based on vitality level
  const getPlantConfig = () => {
    switch (level) {
      case 'critical':
        return {
          plant: '🥀', // Wilted flower
          pot: '🪴',
          backgroundColor: '#450a0a',
          borderColor: '#dc2626',
          description: 'Withering - needs water!',
          particles: ['💧', '😢'],
          swayIntensity: 0.5, // Very weak sway
          growthScale: 0.7,
        };
      case 'low':
        return {
          plant: '🌱', // Small sprout
          pot: '🪴',
          backgroundColor: '#451a03',
          borderColor: '#ea580c',
          description: 'Just sprouting',
          particles: ['💧', '🌿'],
          swayIntensity: 1,
          growthScale: 0.8,
        };
      case 'medium':
        return {
          plant: '🌿', // Growing plant
          pot: '🪴',
          backgroundColor: '#14532d',
          borderColor: '#16a34a',
          description: 'Growing steadily',
          particles: ['🌿', '💚'],
          swayIntensity: 1.5,
          growthScale: 0.9,
        };
      case 'high':
        return {
          plant: '🌻', // Sunflower
          pot: '🪴',
          backgroundColor: '#365314',
          borderColor: '#65a30d',
          description: 'Blooming beautifully!',
          particles: ['🌻', '☀️', '🌿'],
          swayIntensity: 2,
          growthScale: 1.0,
        };
      case 'perfect':
        return {
          plant: '🌺', // Hibiscus in full bloom
          pot: '🪴',
          backgroundColor: '#4c1d95',
          borderColor: '#7c3aed',
          description: 'Magnificent bloom!',
          particles: ['🌺', '✨', '🌿', '🌸'],
          swayIntensity: 2.5,
          growthScale: 1.1,
        };
    }
  };
  
  const config = getPlantConfig();
  
  useEffect(() => {
    if (!animated) return;
    
    // Growth animation
    grow.value = withSpring(config.growthScale, {
      damping: 8,
      stiffness: 50,
    });
    
    // Different animations based on vitality level
    switch (level) {
      case 'critical':
        // Drooping, barely moving
        droop.value = withRepeat(
          withSequence(
            withTiming(5, { duration: 3000 }),
            withTiming(0, { duration: 3000 })
          ),
          -1,
          false
        );
        
        sway.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 4000 }),
            withTiming(2, { duration: 4000 })
          ),
          -1,
          true
        );
        break;
        
      case 'low':
        // Gentle, tentative movement
        sway.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 3000 }),
            withTiming(3, { duration: 3000 })
          ),
          -1,
          true
        );
        break;
        
      case 'medium':
        // Natural swaying
        sway.value = withRepeat(
          withSequence(
            withTiming(-4, { duration: 2500 }),
            withTiming(4, { duration: 2500 })
          ),
          -1,
          true
        );
        break;
        
      case 'high':
        // Lively swaying with growth spurts
        sway.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 2000 }),
            withTiming(5, { duration: 2000 })
          ),
          -1,
          true
        );
        
        grow.value = withRepeat(
          withSequence(
            withSpring(config.growthScale, { damping: 8, stiffness: 100 }),
            withSpring(config.growthScale * 1.05, { damping: 8, stiffness: 100 })
          ),
          -1,
          true
        );
        break;
        
      case 'perfect':
        // Dynamic movement with sparkles
        sway.value = withRepeat(
          withSequence(
            withTiming(-6, { duration: 1800 }),
            withTiming(6, { duration: 1800 })
          ),
          -1,
          true
        );
        
        sparkle.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 1000 }),
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          false
        );
        
        grow.value = withRepeat(
          withSequence(
            withSpring(config.growthScale, { damping: 6, stiffness: 120 }),
            withSpring(config.growthScale * 1.08, { damping: 6, stiffness: 120 })
          ),
          -1,
          true
        );
        break;
    }
  }, [level, animated, sway, grow, sparkle, droop]);
  
  const plantStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: grow.value },
      { rotate: `${sway.value}deg` },
      { translateY: droop.value }
    ],
  }));
  
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
  }));
  
  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
    transform: [
      { scale: interpolate(sparkle.value, [0, 1], [0.5, 1.2], Extrapolate.CLAMP) }
    ],
  }));
  
  const styles = createStyles(size);
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.avatar, containerStyle]}>
        {/* Sparkle effect for perfect vitality */}
        {level === 'perfect' && (
          <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
            <Text style={styles.sparkle}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
          </Animated.View>
        )}
        
        {/* Plant */}
        <Animated.View style={[styles.plantContainer, plantStyle]}>
          <Text style={styles.plantEmoji}>{config.plant}</Text>
        </Animated.View>
        
        {/* Pot */}
        <Text style={styles.potEmoji}>{config.pot}</Text>
        
        {/* Vitality percentage */}
        <View style={styles.vitalityBadge}>
          <Text style={styles.vitalityText}>{vitality}%</Text>
        </View>
        
        {/* Floating particles */}
        {config.particles.map((particle, index) => (
          <Animated.Text 
            key={index}
            style={[
              styles.particle,
              {
                top: 10 + (index * 15),
                right: 5 + (index * 8),
                opacity: level === 'critical' ? 0.3 : 0.7,
              }
            ]}
          >
            {particle}
          </Animated.Text>
        ))}
      </Animated.View>
      
      {/* Description */}
      <Text style={[styles.description, { color: config.borderColor }]}>
        {config.description}
      </Text>
    </View>
  );
}

const createStyles = (size: number) => StyleSheet.create({
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
    overflow: 'hidden',
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  plantEmoji: {
    fontSize: size * 0.25,
    marginBottom: 4,
  },
  potEmoji: {
    fontSize: size * 0.2,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
  },
  sparkle2: {
    top: -10,
    left: -15,
    fontSize: 12,
  },
  sparkle3: {
    bottom: -10,
    right: -15,
    fontSize: 14,
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
  particle: {
    position: 'absolute',
    fontSize: 8,
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});