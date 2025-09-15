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
import { 
  GoalPlantStage,
  getPlantStageConfig, 
  getStageAnimationConfig 
} from '@/lib/goalPlantStages';

export interface GoalPlantAvatarProps {
  stage: GoalPlantStage;
  size?: number;
  animated?: boolean;
  showBorder?: boolean;
  style?: any;
  compact?: boolean;
  isInteracting?: boolean; // For celebration animations
}

export function GoalPlantAvatar({ 
  stage,
  size = 80, 
  animated = true, 
  showBorder = true,
  style,
  compact = false,
  isInteracting = false
}: GoalPlantAvatarProps) {
  
  // Animation values
  const sway = useSharedValue(0);
  const grow = useSharedValue(0.8);
  const sparkle = useSharedValue(0);
  const bounce = useSharedValue(0);
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);
  
  const stageConfig = getPlantStageConfig(stage);
  const animConfig = getStageAnimationConfig(stage);
  
  useEffect(() => {
    if (!animated) return;
    
    // Growth animation
    grow.value = withSpring(animConfig.growthScale, {
      damping: 8,
      stiffness: 50,
    });
    
    // Pulse animation based on stage
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: animConfig.pulseSpeed }),
        withTiming(1, { duration: animConfig.pulseSpeed })
      ),
      -1,
      true
    );
    
    // Sway animation
    if (animConfig.swayIntensity > 0) {
      sway.value = withRepeat(
        withSequence(
          withTiming(-animConfig.swayIntensity, { duration: 2500 }),
          withTiming(animConfig.swayIntensity, { duration: 2500 })
        ),
        -1,
        true
      );
    }
    
    // Special animations for thriving stage
    if (stage === 'thriving') {
      sparkle.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500 }),
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        false
      );
    }
    
    // Interaction bounce
    if (isInteracting && animConfig.bounceOnInteraction) {
      bounce.value = withSequence(
        withTiming(10, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );
      
      glow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
    }
    
  }, [stage, animated, isInteracting, sway, grow, sparkle, bounce, pulse, glow, animConfig]);
  
  const plantStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: grow.value * pulse.value },
      { rotate: `${sway.value}deg` },
      { translateY: -bounce.value }
    ],
  }));
  
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: stageConfig.backgroundColor,
    borderColor: stageConfig.borderColor,
    shadowOpacity: glow.value * 0.4,
    shadowRadius: glow.value * 8,
    shadowColor: stageConfig.borderColor,
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
        /* Compact mode - minimal design for goal cards */
        <View style={styles.compactContainer}>
          <Animated.View style={[styles.avatar, containerStyle]}>
            <Animated.View style={[styles.plantContainer, plantStyle]}>
              <Image source={stageConfig.plant} style={styles.plantImage} resizeMode="contain" />
            </Animated.View>
            <Image source={stageConfig.pot} style={styles.potImage} resizeMode="contain" />
          </Animated.View>
          
          {/* Celebration sparkles for thriving stage only in compact mode */}
          {stage === 'thriving' && (
            <Animated.Text 
              style={[
                styles.compactSparkle,
                { 
                  opacity: sparkle.value,
                  transform: [{ scale: sparkle.value }] 
                }
              ]}
            >
              ✨
            </Animated.Text>
          )}
        </View>
      ) : (
        /* Full mode - with particles and detailed display */
        <>
          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.avatar, containerStyle]}>
              {/* Sparkle effects for thriving stage */}
              {stage === 'thriving' && (
                <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
                  <Text style={styles.sparkle}>✨</Text>
                  <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
                  <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
                </Animated.View>
              )}
              
              {/* Main plant */}
              <Animated.View style={[styles.plantContainer, plantStyle]}>
                <Image source={stageConfig.plant} style={styles.plantImage} resizeMode="contain" />
              </Animated.View>
              
              {/* Pot */}
              <Image source={stageConfig.pot} style={styles.potImage} resizeMode="contain" />
            </Animated.View>
            
            {/* Floating particles around avatar */}
            {animConfig.particles.map((particle, index) => {
              const particleRadius = size * 0.6;
              const angle = (index * (360 / animConfig.particles.length)) * (Math.PI / 180);
              const particleX = Math.cos(angle) * particleRadius;
              const particleY = Math.sin(angle) * particleRadius;
              
              return (
                <Animated.Text 
                  key={index}
                  style={[
                    styles.particle,
                    {
                      left: (size * 1.5) / 2 + particleX - 8,
                      top: (size * 1.5) / 2 + particleY - 8,
                      opacity: stage === 'struggling' ? 0.4 : 0.7,
                      transform: [
                        { scale: pulse.value * 0.3 + 0.7 },
                        { rotate: `${sparkle.value * 30}deg` },
                      ],
                    }
                  ]}
                >
                  {particle}
                </Animated.Text>
              );
            })}
          </View>
          
          {/* Stage description */}
          <Text style={[styles.description, { color: stageConfig.borderColor }]}>
            {stageConfig.description}
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
    width: size * 1.5,
    height: size * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compactContainer: {
    width: size + 12,
    height: size + 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  plantImage: {
    width: size * 0.4,
    height: size * 0.4,
    marginBottom: 2,
  },
  potImage: {
    width: size * 0.35,
    height: size * 0.25,
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
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sparkle2: {
    top: -8,
    left: -12,
    fontSize: 10,
  },
  sparkle3: {
    bottom: -8,
    right: -12,
    fontSize: 12,
  },
  particle: {
    position: 'absolute',
    fontSize: Math.max(10, size * 0.1),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compactSparkle: {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: size * 0.25,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});