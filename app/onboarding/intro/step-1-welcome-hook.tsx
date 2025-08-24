import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Image
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboarding';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const dreamGoals = [
  { emoji: '🏃‍♀️', text: 'Run a marathon', color: '#FF6B9D' },
  { emoji: '📚', text: 'Read 50 books', color: '#4ECDC4' },
  { emoji: '🎯', text: 'Start a business', color: '#45B7D1' },
  { emoji: '🧘‍♀️', text: 'Find inner peace', color: '#96CEB4' },
  { emoji: '🌍', text: 'Travel the world', color: '#FECA57' },
  { emoji: '💪', text: 'Get in shape', color: '#FF9FF3' },
];

export default function WelcomeHookStep() {
  const { theme } = useTheme();
  const { nextIntroStep } = useOnboardingStore();
  const styles = createStyles(theme);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const goalsOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const heroScale = useSharedValue(0.8);

  useEffect(() => {
    // Orchestrated entrance animation
    const startAnimation = () => {
      // Hero scales in first
      heroScale.value = withSpring(1, { damping: 15 });
      
      // Title fades in
      titleOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
      
      // Subtitle follows
      subtitleOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));
      
      // Goals animate in with stagger
      goalsOpacity.value = withDelay(2200, withTiming(1, { duration: 800 }));
      
      // Button pops in last
      buttonScale.value = withDelay(3200, withSpring(1, { damping: 12 }));
      
      // Continuous sparkle rotation
      sparkleRotation.value = withDelay(3600, 
        withSequence(
          withTiming(360, { duration: 3000 }),
          withTiming(720, { duration: 3000 })
        )
      );
    };

    startAnimation();
  }, []);

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Exit animation
    buttonScale.value = withSpring(1.1, { damping: 8 }, () => {
      runOnJS(nextIntroStep)();
    });
  };

  const handleGoalTap = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Could add individual goal animations here
  };

  // Animated styles
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{
      translateY: interpolate(titleOpacity.value, [0, 1], [20, 0])
    }],
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{
      translateY: interpolate(subtitleOpacity.value, [0, 1], [20, 0])
    }],
  }));

  const animatedGoalsStyle = useAnimatedStyle(() => ({
    opacity: goalsOpacity.value,
    transform: [{
      translateY: interpolate(goalsOpacity.value, [0, 1], [30, 0])
    }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Hero Section */}
        <Animated.View style={[styles.hero, animatedHeroStyle]}>
          <View style={styles.heroImageContainer}>
            <View style={styles.heroImage}>
              <Text style={styles.heroEmoji}>🌟</Text>
              <Animated.Text style={[styles.sparkle, animatedSparkleStyle]}>
                ✨
              </Animated.Text>
            </View>
          </View>
          
          <Animated.Text style={[styles.title, animatedTitleStyle]}>
            What if you could{'\n'}achieve anything?
          </Animated.Text>
          
          <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>
            Every great transformation starts with believing in yourself and taking that first brave step
          </Animated.Text>
        </Animated.View>

        {/* Dream Goals */}
        <Animated.View style={[styles.goalsContainer, animatedGoalsStyle]}>
          <Text style={styles.goalsTitle}>People just like you are achieving:</Text>
          <View style={styles.goalsGrid}>
            {dreamGoals.map((goal, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.goalCard, { backgroundColor: goal.color + '20' }]}
                onPress={() => handleGoalTap(index)}
                activeOpacity={0.8}
              >
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <Text style={[styles.goalText, { color: goal.color }]}>
                  {goal.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleGetStarted}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>I&apos;m ready to transform</Text>
                <Text style={styles.buttonEmoji}>🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.encouragement}>
            Your future self is waiting
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  heroImageContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  heroImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroEmoji: {
    fontSize: 60,
  },
  sparkle: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 26,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  goalsContainer: {
    marginBottom: 20,
  },
  goalsTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    fontWeight: '600',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: (SCREEN_WIDTH - 72) / 2,
    maxWidth: (SCREEN_WIDTH - 72) / 2,
  },
  goalEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  ctaContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  button: {
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonEmoji: {
    fontSize: 18,
  },
  encouragement: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
