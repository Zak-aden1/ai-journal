import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import Reanimated, {
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
import { AvatarRenderer } from '@/components/avatars';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const avatarPersonalities = [
  {
    type: 'plant' as const,
    name: 'Sage',
    greeting: 'Hello! I\'m here to help you grow, one day at a time.',
    personality: 'wise and nurturing',
    promise: 'I\'ll be your steady companion through every season of growth.',
    emoji: '🌱'
  },
  {
    type: 'pet' as const,
    name: 'Runner',
    greeting: 'Hey there! Ready to chase your dreams together?',
    personality: 'energetic and loyal',
    promise: 'I\'ll keep your energy high and never let you give up!',
    emoji: '🐕'
  },
  {
    type: 'robot' as const,
    name: 'Linguabot',
    greeting: 'Greetings! I\'m programmed to optimize your success.',
    personality: 'analytical and persistent',
    promise: 'I\'ll track your progress and find the most efficient path forward.',
    emoji: '🤖'
  }
];

export default function AvatarIntroStep() {
  const { theme } = useTheme();
  const { nextIntroStep } = useOnboardingStore();
  const styles = createStyles(theme);

  const [currentAvatar, setCurrentAvatar] = useState(0);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.5);
  const messageOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    titleOpacity.value = withTiming(1, { duration: 600 });
    avatarScale.value = withDelay(600, withSpring(1, { damping: 15 }));
    messageOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));
    dotsOpacity.value = withDelay(1800, withTiming(1, { duration: 400 }));
    buttonScale.value = withDelay(2200, withSpring(1, { damping: 12 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bounce animation
    avatarScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
  };

  const handleNextAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const nextIndex = (currentAvatar + 1) % avatarPersonalities.length;

    // Fade out current message
    messageOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setCurrentAvatar)(nextIndex);
      // Fade in new message
      messageOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    });

    // Avatar transition
    avatarScale.value = withSequence(
      withTiming(0.8, { duration: 150 }),
      withSpring(1, { damping: 15 })
    );
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    buttonScale.value = withSpring(1.1, { damping: 8 }, () => {
      runOnJS(nextIntroStep)();
    });
  };

  const avatar = avatarPersonalities[currentAvatar];

  // Animated styles
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{
      translateY: interpolate(titleOpacity.value, [0, 1], [20, 0])
    }],
  }));

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const animatedMessageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{
      translateY: interpolate(messageOpacity.value, [0, 1], [15, 0])
    }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedDotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  return (
    <LinearGradient
      colors={['#fa709a', '#fee140']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <Reanimated.View style={[styles.header, animatedTitleStyle]}>
          <Text style={styles.title}>Meet Your Personal{'\n'}AI Companion</Text>
          <Text style={styles.subtitle}>
            A friend who believes in you, celebrates your wins, and never gives up on your dreams
          </Text>
        </Reanimated.View>

        {/* Avatar Showcase */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            onPress={handleAvatarTap}
            activeOpacity={0.9}
            style={styles.avatarContainer}
          >
            <Reanimated.View style={[styles.avatarWrapper, animatedAvatarStyle]}>
              <AvatarRenderer
                type={avatar.type}
                vitality={85}
                size={120}
                animated
              />
            </Reanimated.View>
          </TouchableOpacity>

          <Reanimated.View style={[styles.messageContainer, animatedMessageStyle]}>
            <View style={styles.speechBubble}>
              <Text style={styles.avatarName}>{avatar.name}</Text>
              <Text style={styles.avatarGreeting}>&quot;{avatar.greeting}&quot;</Text>
              <Text style={styles.avatarPromise}>{avatar.promise}</Text>
            </View>
            <View style={styles.bubbleTail} />
          </Reanimated.View>

          {/* Avatar Navigation */}
          <Reanimated.View style={[styles.navigation, animatedDotsStyle]}>
            <View style={styles.dots}>
              {avatarPersonalities.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentAvatar && styles.dotActive
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextAvatar}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>Try another →</Text>
            </TouchableOpacity>
          </Reanimated.View>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Reanimated.View style={animatedButtonStyle}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Let&apos;s do this together</Text>
              <Text style={styles.buttonEmoji}>🤝</Text>
            </TouchableOpacity>
          </Reanimated.View>
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
  avatarSection: {
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarWrapper: {
    padding: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  speechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    maxWidth: SCREEN_WIDTH - 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.95)',
    transform: [{ rotate: '180deg' }],
    marginTop: -1,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  avatarGreeting: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  avatarPromise: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  navigation: {
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  nextButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
    minWidth: 240,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fa709a',
  },
  buttonEmoji: {
    fontSize: 18,
  },

});
