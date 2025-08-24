import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { AvatarProps, getVitalityLevel } from './types';

export function PetAvatar({ 
  vitality, 
  size = 120, 
  animated = true, 
  showBorder = true,
  style 
}: AvatarProps) {
  const level = getVitalityLevel(vitality);
  
  // Animation values
  const bounce = useSharedValue(0);
  const tail = useSharedValue(0);
  const blink = useSharedValue(1);
  const ears = useSharedValue(0);
  const pant = useSharedValue(0);
  const sleep = useSharedValue(0);
  
  // Get pet configuration based on vitality level
  const getPetConfig = () => {
    switch (level) {
      case 'critical':
        return {
          face: '😵',
          ears: '🐾',
          backgroundColor: '#7f1d1d',
          borderColor: '#dc2626',
          description: 'Needs urgent care 🚑',
          mood: 'sick',
          accessories: ['💊', '🌡️'],
          tailSpeed: 5000, // Very slow
        };
      case 'low':
        return {
          face: '😴',
          ears: '🐾',
          backgroundColor: '#92400e',
          borderColor: '#ea580c',
          description: 'Feeling sleepy 😪',
          mood: 'tired',
          accessories: ['💤', '😪'],
          tailSpeed: 4000,
        };
      case 'medium':
        return {
          face: '🙂',
          ears: '🐾',
          backgroundColor: '#1e40af',
          borderColor: '#3b82f6',
          description: 'Content and calm 😌',
          mood: 'neutral',
          accessories: ['💙', '😌'],
          tailSpeed: 3000,
        };
      case 'high':
        return {
          face: '😄',
          ears: '🐾',
          backgroundColor: '#166534',
          borderColor: '#22c55e',
          description: 'Happy and playful! 🎾',
          mood: 'happy',
          accessories: ['🎾', '🦴', '❤️'],
          tailSpeed: 2000,
        };
      case 'perfect':
        return {
          face: '🤩',
          ears: '🐾',
          backgroundColor: '#7c2d12',
          borderColor: '#ea580c',
          description: 'Absolutely ecstatic! 🎉',
          mood: 'ecstatic',
          accessories: ['🎉', '⭐', '💖', '🏆'],
          tailSpeed: 1000,
        };
    }
  };
  
  const config = getPetConfig();
  
  useEffect(() => {
    if (!animated) return;
    
    // Different animations based on vitality level
    switch (level) {
      case 'critical':
        // Weak, almost no movement
        sleep.value = withRepeat(
          withSequence(
            withTiming(3, { duration: 3000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          false
        );
        
        blink.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 5000 }),
            withTiming(0, { duration: 200 }),
            withTiming(1, { duration: 200 })
          ),
          -1,
          false
        );
        break;
        
      case 'low':
        // Sleepy, slow movements
        sleep.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 2000 }),
            withTiming(2, { duration: 2000 })
          ),
          -1,
          false
        );
        
        blink.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 3000 }),
            withTiming(0, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          false
        );
        
        tail.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: config.tailSpeed }),
            withTiming(5, { duration: config.tailSpeed })
          ),
          -1,
          true
        );
        break;
        
      case 'medium':
        // Calm, gentle movements
        blink.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2500 }),
            withTiming(0, { duration: 150 }),
            withTiming(1, { duration: 150 })
          ),
          -1,
          false
        );
        
        tail.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: config.tailSpeed }),
            withTiming(8, { duration: config.tailSpeed })
          ),
          -1,
          true
        );
        
        ears.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 4000 }),
            withTiming(-3, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          -1,
          false
        );
        break;
        
      case 'high':
        // Happy, energetic movements
        bounce.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 1500 }),
            withSpring(-8, { damping: 8, stiffness: 100 }),
            withSpring(0, { damping: 8, stiffness: 100 })
          ),
          -1,
          false
        );
        
        blink.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2000 }),
            withTiming(0, { duration: 100 }),
            withTiming(1, { duration: 100 })
          ),
          -1,
          false
        );
        
        tail.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: config.tailSpeed }),
            withTiming(12, { duration: config.tailSpeed })
          ),
          -1,
          true
        );
        
        ears.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 2000 }),
            withSpring(-5, { damping: 6, stiffness: 120 }),
            withSpring(0, { damping: 6, stiffness: 120 })
          ),
          -1,
          false
        );
        break;
        
      case 'perfect':
        // Ecstatic, lots of movement
        bounce.value = withRepeat(
          withSequence(
            withSpring(-12, { damping: 6, stiffness: 150 }),
            withSpring(0, { damping: 6, stiffness: 150 })
          ),
          -1,
          false
        );
        
        blink.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1500 }),
            withTiming(0, { duration: 80 }),
            withTiming(1, { duration: 80 }),
            withTiming(0, { duration: 80 }),
            withTiming(1, { duration: 80 })
          ),
          -1,
          false
        );
        
        tail.value = withRepeat(
          withSequence(
            withTiming(-15, { duration: config.tailSpeed / 2 }),
            withTiming(15, { duration: config.tailSpeed / 2 })
          ),
          -1,
          true
        );
        
        ears.value = withRepeat(
          withSequence(
            withSpring(-8, { damping: 5, stiffness: 150 }),
            withSpring(0, { damping: 5, stiffness: 150 })
          ),
          -1,
          false
        );
        
        pant.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 500 })
          ),
          -1,
          false
        );
        break;
    }
  }, [level, animated, bounce, tail, blink, ears, pant, sleep]);
  
  const petStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value + sleep.value },
      { rotate: `${tail.value * 0.1}deg` }
    ],
  }));
  
  const earsStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ears.value}deg` }],
  }));
  
  const eyesStyle = useAnimatedStyle(() => ({
    opacity: blink.value,
  }));
  
  const tongueStyle = useAnimatedStyle(() => ({
    opacity: pant.value,
  }));
  
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
  }));
  
  const styles = createStyles(size);
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.avatar, containerStyle]}>
        {/* Ears */}
        <Animated.View style={[styles.earsContainer, earsStyle]}>
          <Text style={styles.ears}>{config.ears}</Text>
        </Animated.View>
        
        {/* Pet face */}
        <Animated.View style={[styles.petContainer, petStyle]}>
          <Animated.View style={eyesStyle}>
            <Text style={styles.face}>{config.face}</Text>
          </Animated.View>
          
          {/* Tongue for panting (perfect vitality) */}
          {level === 'perfect' && (
            <Animated.View style={[styles.tongueContainer, tongueStyle]}>
              <Text style={styles.tongue}>👅</Text>
            </Animated.View>
          )}
        </Animated.View>
        
        {/* Vitality percentage */}
        <View style={styles.vitalityBadge}>
          <Text style={styles.vitalityText}>{vitality}%</Text>
        </View>
        
        {/* Accessories/mood indicators */}
        {config.accessories.map((accessory, index) => (
          <Text 
            key={index}
            style={[
              styles.accessory,
              {
                top: 15 + (index * 12),
                left: 10 + (index * 10),
                opacity: level === 'critical' ? 0.5 : 0.8,
              }
            ]}
          >
            {accessory}
          </Text>
        ))}
        
        {/* Tail wagging indicator */}
        {level !== 'critical' && (
          <Animated.View style={[styles.tailContainer, { transform: [{ rotate: `${tail.value}deg` }] }]}>
            <Text style={styles.tail}>~</Text>
          </Animated.View>
        )}
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
    overflow: 'visible',
  },
  earsContainer: {
    position: 'absolute',
    top: size * 0.15,
    alignItems: 'center',
  },
  ears: {
    fontSize: size * 0.15,
  },
  petContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    fontSize: size * 0.35,
  },
  tongueContainer: {
    position: 'absolute',
    bottom: -8,
  },
  tongue: {
    fontSize: size * 0.1,
  },
  tailContainer: {
    position: 'absolute',
    right: -15,
    top: size * 0.3,
  },
  tail: {
    fontSize: size * 0.2,
    color: '#8B4513',
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
  accessory: {
    position: 'absolute',
    fontSize: 10,
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});