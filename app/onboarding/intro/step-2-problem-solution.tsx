import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboarding';
import * as Haptics from 'expo-haptics';

const struggles = [
  { emoji: '😔', problem: 'I start strong but give up', solution: 'Build sustainable habits that stick' },
  { emoji: '😰', problem: 'I don\'t know where to begin', solution: 'Get personalized step-by-step guidance' },
  { emoji: '😤', problem: 'I lose motivation quickly', solution: 'Stay motivated with AI coaching' },
  { emoji: '😕', problem: 'I feel alone in my journey', solution: 'Have a companion who never gives up on you' },
];

export default function ProblemSolutionStep() {
  const { theme } = useTheme();
  const { nextIntroStep } = useOnboardingStore();
  const styles = createStyles(theme);

  const [selectedStruggle, setSelectedStruggle] = useState<number | null>(null);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const strugglesOpacity = useSharedValue(0);
  const solutionOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    titleOpacity.value = withTiming(1, { duration: 600 });
    strugglesOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    buttonScale.value = withDelay(1600, withSpring(1, { damping: 12 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStrugglePress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStruggle(index);
    
    // Animate solution appearance
    solutionOpacity.value = 0;
    solutionOpacity.value = withTiming(1, { duration: 600 });
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    buttonScale.value = withSpring(1.1, { damping: 8 }, () => {
      runOnJS(nextIntroStep)();
    });
  };

  // Animated styles
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{
      translateY: interpolate(titleOpacity.value, [0, 1], [30, 0])
    }],
  }));

  const animatedStrugglesStyle = useAnimatedStyle(() => ({
    opacity: strugglesOpacity.value,
    transform: [{
      translateY: interpolate(strugglesOpacity.value, [0, 1], [40, 0])
    }],
  }));

  const animatedSolutionStyle = useAnimatedStyle(() => ({
    opacity: solutionOpacity.value,
    transform: [{
      translateY: interpolate(solutionOpacity.value, [0, 1], [20, 0])
    }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <Animated.View style={[styles.header, animatedTitleStyle]}>
          <Text style={styles.title}>We all have dreams{'\n'}that feel impossible</Text>
          <Text style={styles.subtitle}>
            But what if the only thing standing between you and your goals was the right support?
          </Text>
        </Animated.View>

        {/* Struggles */}
        <Animated.View style={[styles.strugglesContainer, animatedStrugglesStyle]}>
          <Text style={styles.strugglesTitle}>Tap what resonates with you:</Text>
          <View style={styles.strugglesGrid}>
            {struggles.map((struggle, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.struggleCard,
                  selectedStruggle === index && styles.struggleCardSelected
                ]}
                onPress={() => handleStrugglePress(index)}
                activeOpacity={0.8}
              >
                <Text style={styles.struggleEmoji}>{struggle.emoji}</Text>
                <Text style={styles.struggleText}>{struggle.problem}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Solution */}
        {selectedStruggle !== null && (
          <Animated.View style={[styles.solutionContainer, animatedSolutionStyle]}>
            <View style={styles.solutionCard}>
              <Text style={styles.solutionEmoji}>✨</Text>
              <Text style={styles.solutionTitle}>Here&apos;s how we help:</Text>
              <Text style={styles.solutionText}>
                {struggles[selectedStruggle].solution}
              </Text>
            </View>
          </Animated.View>
        )}
        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Show me how</Text>
              <Text style={styles.buttonEmoji}>→</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.stats}>
            Join 10,000+ people who&apos;ve transformed their lives
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
  header: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  strugglesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  strugglesTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
    opacity: 0.95,
  },
  strugglesGrid: {
    gap: 16,
  },
  struggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  struggleCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 1.02 }],
  },
  struggleEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  struggleText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  solutionContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  solutionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  solutionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  solutionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  solutionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.95,
  },
  ctaContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
    minWidth: 200,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4facfe',
  },
  buttonEmoji: {
    fontSize: 18,
    color: '#4facfe',
  },
  stats: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '500',
  },
});
