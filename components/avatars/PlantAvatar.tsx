import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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

// Import plant avatar images
const plantImages = {
  critical: require('@/assets/images/avatars/plants/plant-0.png'),
  low: require('@/assets/images/avatars/plants/plant-25.png'),
  medium: require('@/assets/images/avatars/plants/plant-50.png'),
  high: require('@/assets/images/avatars/plants/plant-75.png'),
  perfect: require('@/assets/images/avatars/plants/plant-100.png'),
};

export function PlantAvatar({ 
  vitality, 
  size = 120, 
  animated = true, 
  showBorder = true,
  style,
  emotionalState = 'neutral',
  isTyping = false,
  recentActivity = 'idle',
  relationshipStage = 'stranger',
  compact = false
}: AvatarProps) {
  const level = getVitalityLevel(vitality);
  
  // Animation values
  const sway = useSharedValue(0);
  const grow = useSharedValue(0.8);
  const sparkle = useSharedValue(0);
  const droop = useSharedValue(0);
  const bounce = useSharedValue(0);
  const glow = useSharedValue(0);
  const shake = useSharedValue(0);
  const pulse = useSharedValue(1);
  
  // Get relationship-based enhancements
  const getRelationshipEnhancements = () => {
    switch (relationshipStage) {
      case 'stranger':
        return {
          accessories: [],
          environment: 'basic',
          specialEffects: [],
          plantVariations: {},
        };
      case 'acquaintance':
        return {
          accessories: ['🌿'], // Small leaf accent
          environment: 'cozy',
          specialEffects: ['gentle_glow'],
          plantVariations: { pot: '🏺' }, // Slightly nicer pot
        };
      case 'friend':
        return {
          accessories: ['🌿', '🦋'], // Leaf and butterfly friend
          environment: 'welcoming',
          specialEffects: ['gentle_glow', 'friendship_sparkles'],
          plantVariations: { pot: '🏺', backdrop: '🌤️' }, // Nice pot with sunny backdrop
        };
      case 'companion':
        return {
          accessories: ['🌿', '🦋', '💚'], // Leaf, butterfly, and heart
          environment: 'intimate',
          specialEffects: ['gentle_glow', 'friendship_sparkles', 'bond_aura'],
          plantVariations: { pot: '🏺', backdrop: '🌅', extras: '🌸' }, // Beautiful setup
        };
      case 'soulmate':
        return {
          accessories: ['🌿', '🦋', '💚', '✨'], // Full accessories
          environment: 'transcendent',
          specialEffects: ['gentle_glow', 'friendship_sparkles', 'bond_aura', 'soul_connection'],
          plantVariations: { pot: '🏛️', backdrop: '🌈', extras: '🌸🌺' }, // Majestic setup
        };
      default:
        return {
          accessories: [],
          environment: 'basic',
          specialEffects: [],
          plantVariations: {},
        };
    }
  };

  // Get plant configuration based on vitality level
  const getPlantConfig = () => {
    switch (level) {
      case 'critical':
        return {
          plantImage: plantImages.critical,
          backgroundColor: 'transparent', // Let image handle its own background
          borderColor: '#dc2626',
          description: 'Withering - needs water!',
          particles: ['💧', '😢'],
          swayIntensity: 0.5, // Very weak sway
          growthScale: 0.7,
        };
      case 'low':
        return {
          plantImage: plantImages.low,
          backgroundColor: 'transparent',
          borderColor: '#ea580c',
          description: 'Just sprouting',
          particles: ['💧', '🌿'],
          swayIntensity: 1,
          growthScale: 0.8,
        };
      case 'medium':
        return {
          plantImage: plantImages.medium,
          backgroundColor: 'transparent',
          borderColor: '#16a34a',
          description: 'Growing steadily',
          particles: ['🌿', '💚'],
          swayIntensity: 1.5,
          growthScale: 0.9,
        };
      case 'high':
        return {
          plantImage: plantImages.high,
          backgroundColor: 'transparent',
          borderColor: '#65a30d',
          description: 'Blooming beautifully!',
          particles: ['🌻', '☀️', '🌿'],
          swayIntensity: 2,
          growthScale: 1.0,
        };
      case 'perfect':
        return {
          plantImage: plantImages.perfect,
          backgroundColor: 'transparent',
          borderColor: '#7c3aed',
          description: 'Magnificent bloom!',
          particles: ['🌺', '✨', '🌿', '🌸'],
          swayIntensity: 2.5,
          growthScale: 1.1,
        };
    }
  };
  
  const config = getPlantConfig();
  const relationshipEnhancements = getRelationshipEnhancements();
  
  // Merge relationship enhancements with base config
  const enhancedConfig = {
    ...config,
    accessories: relationshipEnhancements.accessories,
    backdrop: relationshipEnhancements.plantVariations.backdrop,
    extras: relationshipEnhancements.plantVariations.extras,
    specialEffects: relationshipEnhancements.specialEffects,
  };
  
  // Get emotion-specific animation configuration
  const getEmotionConfig = () => {
    switch (emotionalState) {
      case 'celebrating':
        return {
          bounceIntensity: 3,
          sparkleIntensity: 2,
          swayMultiplier: 1.5,
          particleEmojis: ['🎉', '✨', '🌟', '🎊'],
          pulseSpeed: 800,
        };
      case 'motivated':
        return {
          bounceIntensity: 2,
          sparkleIntensity: 1.5,
          swayMultiplier: 1.3,
          particleEmojis: ['⚡', '🔥', '💪', '🚀'],
          pulseSpeed: 1000,
        };
      case 'discouraged':
        return {
          bounceIntensity: 0,
          sparkleIntensity: 0.2,
          swayMultiplier: 0.5,
          particleEmojis: ['💧', '😢', '🌧️'],
          pulseSpeed: 2000,
        };
      case 'curious':
        return {
          bounceIntensity: 1,
          sparkleIntensity: 1,
          swayMultiplier: 0.8,
          particleEmojis: ['❓', '🔍', '💭', '✨'],
          pulseSpeed: 1200,
        };
      case 'determined':
        return {
          bounceIntensity: 1.5,
          sparkleIntensity: 1,
          swayMultiplier: 0.7,
          particleEmojis: ['💪', '🎯', '🔥', '⚡'],
          pulseSpeed: 900,
        };
      case 'overwhelmed':
        return {
          bounceIntensity: 0,
          sparkleIntensity: 0.3,
          swayMultiplier: 2,
          particleEmojis: ['😵‍💫', '🌀', '😰'],
          pulseSpeed: 1800,
        };
      case 'content':
        return {
          bounceIntensity: 0.5,
          sparkleIntensity: 0.8,
          swayMultiplier: 1,
          particleEmojis: ['😌', '🌸', '☮️', '💚'],
          pulseSpeed: 1500,
        };
      case 'thinking':
        return {
          bounceIntensity: 0,
          sparkleIntensity: 0.5,
          swayMultiplier: 0.3,
          particleEmojis: ['💭', '🤔', '💡'],
          pulseSpeed: 1300,
        };
      case 'speaking':
        return {
          bounceIntensity: 1,
          sparkleIntensity: 1,
          swayMultiplier: 1.2,
          particleEmojis: ['💬', '🗨️', '📢', '✨'],
          pulseSpeed: 700,
        };
      case 'bonding':
        return {
          bounceIntensity: 1.5,
          sparkleIntensity: 2,
          swayMultiplier: 1.1,
          particleEmojis: ['💕', '🤝', '✨', '🌟'],
          pulseSpeed: 800,
        };
      case 'nostalgic':
        return {
          bounceIntensity: 0.3,
          sparkleIntensity: 0.8,
          swayMultiplier: 0.7,
          particleEmojis: ['💭', '🕰️', '📸', '💫'],
          pulseSpeed: 1800,
        };
      case 'protective':
        return {
          bounceIntensity: 0.8,
          sparkleIntensity: 1.2,
          swayMultiplier: 0.6,
          particleEmojis: ['🛡️', '💪', '🌟', '⚡'],
          pulseSpeed: 1000,
        };
      case 'transcendent':
        return {
          bounceIntensity: 2,
          sparkleIntensity: 3,
          swayMultiplier: 1.5,
          particleEmojis: ['✨', '🌟', '💫', '🔮', '🌈'],
          pulseSpeed: 600,
        };
      default: // neutral
        return {
          bounceIntensity: 0.5,
          sparkleIntensity: 0.5,
          swayMultiplier: 1,
          particleEmojis: config.particles,
          pulseSpeed: 1500,
        };
    }
  };
  
  const emotionConfig = getEmotionConfig();
  
  useEffect(() => {
    if (!animated) return;
    
    // Growth animation with emotion influence
    const emotionalGrowthScale = config.growthScale * (1 + (emotionConfig.bounceIntensity * 0.1));
    grow.value = withSpring(emotionalGrowthScale, {
      damping: 8,
      stiffness: 50,
    });
    
    // Emotional pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1 + (emotionConfig.sparkleIntensity * 0.1), { duration: emotionConfig.pulseSpeed }),
        withTiming(1, { duration: emotionConfig.pulseSpeed })
      ),
      -1,
      true
    );
    
    // Bounce animation for excited emotions
    if (emotionConfig.bounceIntensity > 0) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(emotionConfig.bounceIntensity * 5, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        emotionConfig.bounceIntensity * 2,
        false
      );
    }
    
    // Typing animation - enhanced with pulse
    if (isTyping) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
      
      // Add gentle pulse animation for thinking
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      
      // Slight sway during thinking
      sway.value = withRepeat(
        withSequence(
          withTiming(-1.5, { duration: 1500 }),
          withTiming(1.5, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      glow.value = withTiming(0, { duration: 300 });
      // Return to normal pulse when not typing
      pulse.value = withTiming(1, { duration: 300 });
    }
    
    // Special celebration animation
    if (emotionalState === 'celebrating') {
      sparkle.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 200 }),
          withTiming(0, { duration: 200 })
        ),
        6,
        false
      );
    }
    
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
  }, [level, animated, emotionalState, isTyping, recentActivity, sway, grow, sparkle, droop, bounce, glow, shake, pulse]);
  
  const plantStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: grow.value * pulse.value },
      { rotate: `${sway.value * emotionConfig.swayMultiplier}deg` },
      { translateY: droop.value - bounce.value },
      { translateX: shake.value }
    ],
  }));
  
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
    shadowOpacity: glow.value * 0.5,
    shadowRadius: glow.value * 10,
    shadowColor: config.borderColor,
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
      {compact ? (
        /* Compact mode - minimal particles for celebration only */
        <View style={styles.compactContainer}>
          <Animated.View style={[styles.avatar, containerStyle]}>
            {/* Plant Image */}
            <Animated.View style={[styles.plantContainer, plantStyle]}>
              <Image
                source={config.plantImage}
                style={styles.plantImage}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
          
          {/* Celebration particles in compact mode */}
          {emotionalState === 'celebrating' && (
            <>
              <Animated.Text 
                style={[
                  styles.compactParticle,
                  styles.compactParticle1,
                  { 
                    opacity: sparkle.value,
                    transform: [{ scale: sparkle.value }] 
                  }
                ]}
              >
                🎉
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.compactParticle,
                  styles.compactParticle2,
                  { 
                    opacity: sparkle.value * 0.8,
                    transform: [{ scale: sparkle.value * 0.9 }] 
                  }
                ]}
              >
                ✨
              </Animated.Text>
            </>
          )}
        </View>
      ) : (
        /* Full mode - with particles and effects */
        <>
          {/* Expanded container for particles */}
          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.avatar, containerStyle]}>
              {/* Sparkle effect for perfect vitality */}
              {level === 'perfect' && (
                <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
                  <Text style={styles.sparkle}>✨</Text>
                  <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
                  <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
                </Animated.View>
              )}
              
              {/* Backdrop (if any) */}
              {enhancedConfig.backdrop && (
                <Text style={[styles.backdrop, { fontSize: size * 0.8 }]}>
                  {enhancedConfig.backdrop}
                </Text>
              )}
              
              {/* Plant Image */}
              <Animated.View style={[styles.plantContainer, plantStyle]}>
                <Image
                  source={config.plantImage}
                  style={styles.plantImage}
                  resizeMode="contain"
                />
                {/* Extras like flowers */}
                {enhancedConfig.extras && (
                  <Text style={[styles.plantExtras, { fontSize: size * 0.15 }]}>
                    {enhancedConfig.extras}
                  </Text>
                )}
              </Animated.View>
              
              {/* Relationship Accessories */}
              {enhancedConfig.accessories.map((accessory, index) => (
                <Text 
                  key={index}
                  style={[
                    styles.relationshipAccessory,
                    {
                      fontSize: size * 0.12,
                      top: index * 15 + 10,
                      right: index * 12 + 8,
                    }
                  ]}
                >
                  {accessory}
                </Text>
              ))}
              
              {/* Vitality percentage */}
              <View style={styles.vitalityBadge}>
                <Text style={styles.vitalityText}>{vitality}%</Text>
              </View>
            </Animated.View>
            
            {/* Floating particles outside main avatar */}
            {emotionConfig.particleEmojis.map((particle, index) => {
              const particleRadius = size * 0.7; // Particles float around the avatar
              const angle = (index * (360 / emotionConfig.particleEmojis.length)) * (Math.PI / 180);
              const particleX = Math.cos(angle) * particleRadius;
              const particleY = Math.sin(angle) * particleRadius;
              
              return (
                <Animated.Text 
                  key={index}
                  style={[
                    styles.particle,
                    {
                      left: (size * 1.6) / 2 + particleX - 8, // Center within expanded container
                      top: (size * 1.6) / 2 + particleY - 8,   // Center within expanded container
                      opacity: level === 'critical' ? 0.4 : 0.8,
                      transform: [
                        { scale: pulse.value * 0.3 + 0.8 }, // Animate with pulse
                        { rotate: `${sparkle.value * 45}deg` }, // Add slight rotation for celebration
                      ],
                    }
                  ]}
                >
                  {particle}
                </Animated.Text>
              );
            })}
          </View>
          
          {/* Description */}
          <Text style={[styles.description, { color: config.borderColor }]}>
            {config.description}
          </Text>
        </>
      )}
    </View>
  );
}

const createStyles = (size: number) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: size * 1.6, // Extra space for particles
    height: size * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compactContainer: {
    width: size + 16, // Small buffer for compact celebration particles
    height: size + 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden', // Ensure circular clipping
    backgroundColor: 'transparent',
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantImage: {
    width: size,
    height: size,
    borderRadius: size / 2, // Make the image itself circular
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
    fontSize: Math.max(12, size * 0.12), // Scale with avatar size, minimum 12px
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Compact mode celebration particles
  compactParticle: {
    position: 'absolute',
    fontSize: size * 0.4, // Smaller particles for compact mode
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compactParticle1: {
    top: -4,
    right: -4,
  },
  compactParticle2: {
    bottom: -4,
    left: -4,
  },
  description: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  // Relationship enhancement styles
  backdrop: {
    position: 'absolute',
    top: -20,
    left: -20,
    opacity: 0.6,
    zIndex: -1,
  },
  plantExtras: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  relationshipAccessory: {
    position: 'absolute',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 5,
  },
});