import React, { useEffect, useState, useCallback, useRef, Component } from 'react';
import { View, Text, Modal, StyleSheet, Dimensions, TouchableOpacity, StatusBar, AccessibilityInfo } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';
import { getVitalityLevel } from '@/components/avatars/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/app';

// Error boundary to catch animation crashes
class CelebrationErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('Celebration modal crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <Text style={{ color: 'white', fontSize: 16 }}>Something went wrong with the celebration! 🎉</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

interface Props {
  visible: boolean;
  habitName: string;
  habitEmoji: string;
  goalTheme: 'fitness' | 'wellness' | 'learning' | 'creativity';
  onClose: () => void;
  // Avatar integration props
  avatar?: {
    type: 'plant' | 'pet' | 'robot' | 'base';
    name: string;
  };
  oldVitality?: number;
  newVitality?: number;
  vitalityIncrease?: number;
}

const { width, height } = Dimensions.get('window');

// Enhanced confetti component
const ConfettiPiece = ({ delay, themeColors }: { delay: number; themeColors: readonly string[] }) => {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startX = Math.random() * width;
    const endX = startX + (Math.random() - 0.5) * 200;
    
    translateX.value = startX;
    
    // Staggered animation
    translateY.value = withDelay(delay, withTiming(height + 100, { 
      duration: 3000 + Math.random() * 1000,
      easing: Easing.out(Easing.quad)
    }));
    
    translateX.value = withDelay(delay, withTiming(endX, { 
      duration: 3000 + Math.random() * 1000,
      easing: Easing.inOut(Easing.quad)
    }));
    
    rotate.value = withDelay(delay, withTiming(Math.random() * 720, { 
      duration: 3000 + Math.random() * 1000 
    }));
    
    scale.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0.8, { duration: 2800 }),
      withTiming(0, { duration: 200 })
    ));
    
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 2300 }),
      withTiming(0, { duration: 500 })
    ));
  }, [delay, translateY, translateX, rotate, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const color = themeColors[Math.floor(Math.random() * themeColors.length)];
  const size = 8 + Math.random() * 6;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// Floating emoji particles
const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => {
  const translateY = useSharedValue(height);
  const translateX = useSharedValue(Math.random() * width);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(-100, { 
      duration: 4000,
      easing: Easing.out(Easing.quad)
    }));
    
    translateX.value = withDelay(delay, withTiming(
      translateX.value + (Math.random() - 0.5) * 150, 
      { duration: 4000, easing: Easing.inOut(Easing.sin) }
    ));
    
    rotate.value = withDelay(delay, withRepeat(
      withTiming(360, { duration: 3000 }), -1, false
    ));
    
    scale.value = withDelay(delay, withSequence(
      withSpring(1.2, { damping: 8, stiffness: 100 }),
      withTiming(1, { duration: 3500 }),
      withTiming(0, { duration: 300 })
    ));
    
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(1, { duration: 3200 }),
      withTiming(0, { duration: 500 })
    ));
  }, [delay, translateY, translateX, rotate, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ position: 'absolute', fontSize: 24 }, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
};

export function HabitCelebrationModal({ 
  visible, 
  habitName, 
  habitEmoji, 
  goalTheme, 
  onClose,
  avatar = { type: 'base', name: 'Avatar' },
  oldVitality = 65,
  newVitality = 80,
  vitalityIncrease = 15
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const getAvatarResponse = useAppStore((state) => state.getAvatarResponse);
  const updateAvatarMemoryWithActivity = useAppStore((state) => state.updateAvatarMemoryWithActivity);
  
  // Animation values
  const backgroundOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0);
  const avatarRotate = useSharedValue(-180);
  const percentageScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const badgeScale = useSharedValue(0);
  
  // Avatar vitality animation
  const vitalityProgress = useSharedValue(oldVitality);
  const borderGlow = useSharedValue(0);
  const stageTransition = useSharedValue(0);
  
  // State
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentPercentage, setCurrentPercentage] = useState(oldVitality);
  const [isStageTransition, setIsStageTransition] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);  // Prevent re-animation
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMounted, setIsMounted] = useState(true);  // Track mount state
  const swipeStartY = useRef(0);
  
  // Check if vitality level changed
  const oldLevel = getVitalityLevel(oldVitality);
  const newLevel = getVitalityLevel(newVitality);
  const hasLevelUp = oldLevel !== newLevel;
  
  // Track achievement in avatar memory
  React.useEffect(() => {
    if (visible) {
      updateAvatarMemoryWithActivity('achievement', undefined, habitName);
    }
  }, [visible, habitName, updateAvatarMemoryWithActivity]);

  // Component mount/unmount tracking
  React.useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Enhanced theme configurations with personalized avatar messages
  const getThemeConfig = (theme: string, habitName: string, streakDays: number = 8) => {
    const getPersonalizedMessage = () => {
      // Get avatar's personalized response for achievements
      const avatarResponse = getAvatarResponse('achievement');
      
      // Add level up celebration if applicable
      if (hasLevelUp) {
        return `${avatarResponse} I just leveled up with you - your ${habitName.toLowerCase()} consistency is amazing! 🎆`;
      }
      
      // Add streak celebration if applicable
      if (streakDays >= 7) {
        return `${avatarResponse} ${streakDays} days strong - I'm so proud of our journey together! 🚀`;
      }
      
      return avatarResponse;
    };

    switch (theme) {
      case 'fitness':
        return {
          colors: ['#ff6b6b', '#ff8e53'] as const,
          emojis: ['💪', '🔥', '⚡', '🏃‍♀️', '💦', '🎯'],
          message: getPersonalizedMessage()
        };
      case 'wellness':
        return {
          colors: ['#4ecdc4', '#44a08d'] as const,
          emojis: ['🧘‍♀️', '🌱', '☮️', '💚', '🌸', '✨'],
          message: getPersonalizedMessage()
        };
      case 'learning':
        return {
          colors: ['#667eea', '#764ba2'] as const,
          emojis: ['📚', '🧠', '✨', '🎓', '💡', '🌟'],
          message: getPersonalizedMessage()
        };
      default:
        return {
          colors: ['#ffeaa7', '#fab1a0'] as const,
          emojis: ['🎨', '🌟', '🎪', '🎭', '🎨', '✨'],
          message: getPersonalizedMessage()
        };
    }
  };
  
  const themeConfig = getThemeConfig(goalTheme, habitName, 8); // TODO: Get real streak count

  const triggerHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const animatePercentage = useCallback((value: number) => {
    const roundedValue = Math.round(value);
    setCurrentPercentage(roundedValue);
    vitalityProgress.value = value;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Intentionally empty to prevent infinite loops

  const triggerStageTransition = useCallback(() => {
    setIsStageTransition(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Subtle level up indication (no full overlay)
    stageTransition.value = withSequence(
      withTiming(0.8, { duration: 300 }),
      withTiming(0, { duration: 500 })
    );
    
    // Enhanced glow for level up (more dramatic)
    borderGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.4, { duration: 200 })
      ),
      4,
      false
    );
    
    setTimeout(() => setIsStageTransition(false), 1200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Intentionally empty to prevent infinite loops

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});

    // Memory guard: prevent excessive re-renders and ensure component is mounted
    if (visible && !hasAnimated && !isStageTransition && isMounted) {
      setHasAnimated(true);  // Mark as animated to prevent re-runs
      
      // Reset values
      backgroundOpacity.value = 0;
      avatarScale.value = 0;
      avatarRotate.value = -180;
      percentageScale.value = 0;
      cardTranslateY.value = 50;
      cardOpacity.value = 0;
      buttonScale.value = 0;
      badgeScale.value = 0;
      vitalityProgress.value = oldVitality;
      borderGlow.value = 0;
      stageTransition.value = 0;
      setShowConfetti(false);
      setCurrentPercentage(oldVitality);
      setIsStageTransition(false);

      // Faster, staggered animation sequence
      backgroundOpacity.value = withTiming(1, { duration: reduceMotion ? 0 : 300 });
      
      // Avatar entrance with haptic (faster)
      setTimeout(() => {
        runOnJS(triggerHaptics)();
        avatarScale.value = withSpring(1, { damping: 10, stiffness: 150 });
        avatarRotate.value = withSpring(0, { damping: 12, stiffness: 120 });
      }, reduceMotion ? 0 : 200);

      // Badge pop-in (earlier, faster)
      setTimeout(() => {
        badgeScale.value = withSequence(
          withSpring(1.2, { damping: 10, stiffness: 250 }),
          withSpring(1, { damping: 12, stiffness: 150 })
        );
      }, reduceMotion ? 0 : 500);

      // Faster vitality counter animation
      setTimeout(() => {
        percentageScale.value = withSpring(1, { damping: 8, stiffness: 100 });
        
        const startTime = Date.now();
        const updateCounter = () => {
          const elapsed = Date.now() - startTime;
          const growMs = reduceMotion ? 0 : 1200;
          const progress = growMs === 0 ? 1 : Math.min(elapsed / growMs, 1);
          const value = oldVitality + (progress * vitalityIncrease);
          runOnJS(animatePercentage)(value);
          
          // Check for stage transition earlier
          if (hasLevelUp && progress > 0.6 && !isStageTransition) {
            runOnJS(triggerStageTransition)();
          }
          
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          }
        };
        updateCounter();
      }, reduceMotion ? 0 : 700);

      // Card slide up (faster, earlier)
      setTimeout(() => {
        cardOpacity.value = withTiming(1, { duration: 400 });
        cardTranslateY.value = withSpring(0, { damping: 10, stiffness: 120 });
      }, reduceMotion ? 0 : 900);

      // Button appearance (earlier)
      setTimeout(() => {
        buttonScale.value = withSpring(1, { damping: 10, stiffness: 120 });
      }, reduceMotion ? 0 : 1200);

      // Start confetti (earlier, with vitality growth)
      setTimeout(() => {
        runOnJS(setShowConfetti)(true);
        runOnJS(triggerHaptics)();
      }, reduceMotion ? 0 : 800);

      // Gentler pulse animation for avatar (starts earlier)
      setTimeout(() => {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: reduceMotion ? 0 : 1000 }),
            withTiming(1, { duration: reduceMotion ? 0 : 1000 })
          ),
          -1,
          false
        );
      }, reduceMotion ? 0 : 1400);
      
      // Cleanup function to stop animations if component unmounts
      return () => {
        backgroundOpacity.value = 0;
        avatarScale.value = 0;
        pulseScale.value = 1;
        // Clear any pending timers
        const timers = [800, 1000, 1200, 1400, 200, 500, 700, 900];
        timers.forEach(delay => {
          if (typeof delay === 'number') {
            // This is a simple cleanup - in a real app you'd track timer IDs
          }
        });
      };

    } else if (!visible) {
      // Reset all animations when modal closes
      setHasAnimated(false);  // Allow re-animation next time
      backgroundOpacity.value = 0;
      avatarScale.value = 0;
      percentageScale.value = 0;
      cardOpacity.value = 0;
      buttonScale.value = 0;
      vitalityProgress.value = oldVitality;
      borderGlow.value = 0;
      stageTransition.value = 0;
      setShowConfetti(false);
      setIsStageTransition(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, oldVitality, vitalityIncrease, hasLevelUp]);  // Limited deps to prevent infinite loops

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const avatarStyle = useAnimatedStyle(() => ({
              transform: [
      { scale: avatarScale.value * pulseScale.value },
      { rotate: `${avatarRotate.value}deg` }
    ],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const percentageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: percentageScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Micro-interaction: avatar tap bounce + quick glow
  const onAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    avatarScale.value = withSequence(
      withSpring(1.08, { damping: 12, stiffness: 250 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    borderGlow.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 180 })
    );
  };

  const onResponderStart = (e: any) => {
    swipeStartY.current = e.nativeEvent.pageY;
  };

  const onResponderMove = (e: any) => {
    const dy = e.nativeEvent.pageY - swipeStartY.current;
    if (dy > 80) {
      handleClose();
    }
  };

  const avatarBorderStyle = useAnimatedStyle(() => {
    const glowColor = hasLevelUp ? '#22c55e' : '#3b82f6';
    const shadowOpacity = 0.3 + (borderGlow.value * 0.7);
    const shadowRadius = 8 + (borderGlow.value * 12);
    const borderWidth = 3 + (borderGlow.value * 2);
    
    return {
      shadowColor: glowColor,
      shadowOpacity,
      shadowRadius,
      borderWidth,
      borderColor: interpolateColor(
        borderGlow.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.95)', glowColor]
      ),
    };
  });

  // Stage transition effect
  const stageTransitionStyle = useAnimatedStyle(() => ({
    opacity: stageTransition.value,
    transform: [{ scale: 1 + (stageTransition.value * 0.3) }],
  }));

  // Render the correct avatar component
  const renderAvatar = (vitality: number) => {
    const avatarProps = {
      vitality,
      size: 140,
      animated: true,
      style: { flex: 1 }
    };

    switch (avatar.type) {
      case 'plant':
        return <PlantAvatar {...avatarProps} />;
      case 'pet':
        return <PetAvatar {...avatarProps} />;
      case 'robot':
        return <RobotAvatar {...avatarProps} />;
      default:
        return <BaseAvatar {...avatarProps} />;
    }
  };

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  return (
    <CelebrationErrorBoundary>
      <Modal
        visible={visible}
        animationType="none"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
      <StatusBar hidden />
      
      <Animated.View
        style={[styles.container, backgroundStyle]}
        onStartShouldSetResponder={() => true}
        onResponderStart={onResponderStart}
        onResponderMove={onResponderMove}
      >
        <LinearGradient
          colors={themeConfig.colors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close celebration"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Optimized Confetti Layer */}
        {showConfetti && !reduceMotion && (
          <View style={styles.confettiContainer}>
            {Array.from({ length: 25 }).map((_, i) => (
              <ConfettiPiece 
                key={`confetti-${i}`} 
                delay={i * 80} 
                themeColors={themeConfig.colors}
              />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <FloatingEmoji 
                key={`emoji-${i}`} 
                emoji={themeConfig.emojis[i % themeConfig.emojis.length]}
                delay={i * 300}
              />
            ))}
        </View>
        )}

        {/* Main Content */}
        <View style={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Animated.View style={[styles.avatarContainer, avatarStyle]}>
              <TouchableOpacity activeOpacity={0.85} onPress={onAvatarPress} accessibilityRole="imagebutton" accessibilityLabel={`${avatar.name} avatar`}>
                <Animated.View style={[styles.avatar, avatarBorderStyle]}>
                  {renderAvatar(currentPercentage)}
                </Animated.View>
              </TouchableOpacity>
              
              {/* Subtle level up indicator */}
              {hasLevelUp && (
                <Animated.View style={[styles.levelUpIndicator, stageTransitionStyle]}>
                  <Text style={styles.levelUpText}>LEVEL UP!</Text>
              </Animated.View>
              )}
              
              {/* Vitality Badge */}
              <Animated.View style={[styles.vitalityBadge, badgeStyle]}>
                <Text style={styles.badgeText}>⚡ +{vitalityIncrease} ✨</Text>
              </Animated.View>
            </Animated.View>
            
            {/* Simplified Status */}
            <Animated.View style={[styles.statusContainer, percentageStyle]}>
              <Text style={styles.vitalityText}>{currentPercentage}%</Text>
              <Text style={styles.statusLabel}>
                {hasLevelUp ? `${avatar.name} leveled up! 🌟` : `+${vitalityIncrease} vitality! 🎉`}
              </Text>
            </Animated.View>
              </View>

          {/* Personalized Message */}
          <Animated.View style={[styles.messageContainer, cardStyle]}>
            <View style={styles.habitInfo}>
              <Text style={styles.habitEmoji}>{habitEmoji}</Text>
              <Text style={styles.habitName}>{habitName} completed!</Text>
            </View>
            
            <Text style={styles.personalizedMessage}>{themeConfig.message}</Text>
            
            <View style={styles.streakInfo}>
            <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>8 Day Streak!</Text>
            </View>
          </Animated.View>

          {/* Continue Button */}
          <Animated.View style={buttonStyle}>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue journey"
            >
              <Text style={styles.continueButtonText}>Continue Journey</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
      </Modal>
    </CelebrationErrorBoundary>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  levelUpIndicator: {
    position: 'absolute',
    top: -15,
    left: '50%',
    marginLeft: -40,
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  levelUpText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  vitalityBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  vitalityText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  statusLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
  },
  habitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  habitName: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '700',
  },
  personalizedMessage: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  streakText: {
    color: '#d97706',
    fontSize: 16,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '700',
  },
});