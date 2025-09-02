import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboarding';
import { AvatarRenderer } from '@/components/avatars';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AvatarType = 'plant' | 'pet' | 'robot' | 'base';
type CoachingStyle = 'Companion' | 'Coach';

const avatarTypes: { type: AvatarType; name: string; personality: string; emoji: string }[] = [
  { type: 'plant', name: 'Sage', personality: 'wise and growing', emoji: '🌱' },
  { type: 'pet', name: 'Runner', personality: 'energetic and loyal', emoji: '🐕' },
  { type: 'robot', name: 'Linguabot', personality: 'analytical', emoji: '🤖' },
  { type: 'base', name: 'Buddy', personality: 'balanced', emoji: '✨' },
];

const goalCategories = [
  { key: 'health' as const, emoji: '💪', label: 'Health & Fitness' },
  { key: 'learning' as const, emoji: '📚', label: 'Learning & Growth' },
  { key: 'career' as const, emoji: '🎯', label: 'Career & Business' },
  { key: 'personal' as const, emoji: '🧘', label: 'Personal & Life' },
];

export default function QuickSetupStep() {
  const { theme } = useTheme();
  const { setStep, setAvatarType, setMode, setGoalCategory, setAvatarName } = useOnboardingStore();
  const styles = createStyles(theme);

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>('plant');
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>('Companion');
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<'health' | 'learning' | 'career' | 'personal'>('health');

  // Animation values
  const avatarScale = useSharedValue(1);
  const buttonScale = useSharedValue(0);

  React.useEffect(() => {
    buttonScale.value = withTiming(1, { duration: 600 });
  }, []);

  const handleAvatarSelect = (type: AvatarType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAvatar(type);
    avatarScale.value = withSpring(1.2, { damping: 15 }, () => {
      avatarScale.value = withSpring(1);
    });
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Save selections to store
    const avatarData = avatarTypes.find(a => a.type === selectedAvatar);
    setAvatarType(selectedAvatar);
    setAvatarName(avatarData?.name || 'Buddy');
    setMode(coachingStyle);
    setGoalCategory(selectedGoalCategory);

    buttonScale.value = withSpring(1.1, { damping: 8 }, () => {
      runOnJS(setStep)(2);
    });
  };

  const canContinue = selectedAvatar && coachingStyle && selectedGoalCategory;

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: canContinue ? 1 : 0.5,
  }));

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Let&apos;s Get Started! ✨</Text>
          <Text style={styles.subtitle}>
            Quick setup to personalize your journey in under a minute
          </Text>
        </View>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your AI Companion</Text>
          <View style={styles.avatarGrid}>
            {avatarTypes.map((avatar) => (
              <TouchableOpacity
                key={avatar.type}
                style={[
                  styles.avatarCard,
                  selectedAvatar === avatar.type && styles.avatarCardSelected
                ]}
                onPress={() => handleAvatarSelect(avatar.type)}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.avatarContainer,
                  selectedAvatar === avatar.type && animatedAvatarStyle
                ]}>
                  <AvatarRenderer 
                    type={avatar.type} 
                    vitality={80} 
                    size={50} 
                    animated={selectedAvatar === avatar.type}
                  />
                </Animated.View>
                <Text style={styles.avatarName}>{avatar.name}</Text>
                <Text style={styles.avatarPersonality}>{avatar.personality}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Coaching Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coaching Style</Text>
          <View style={styles.coachingOptions}>
            <TouchableOpacity
              style={[
                styles.coachingOption,
                coachingStyle === 'Companion' && styles.coachingOptionSelected
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCoachingStyle('Companion');
              }}
            >
              <Text style={styles.coachingEmoji}>🤗</Text>
              <Text style={styles.coachingText}>Companion</Text>
              <Text style={styles.coachingDesc}>Supportive &amp; encouraging</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.coachingOption,
                coachingStyle === 'Coach' && styles.coachingOptionSelected
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCoachingStyle('Coach');
              }}
            >
              <Text style={styles.coachingEmoji}>💪</Text>
              <Text style={styles.coachingText}>Coach</Text>
              <Text style={styles.coachingDesc}>Direct &amp; challenging</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goal Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What&apos;s your main focus?</Text>
          <View style={styles.goalGrid}>
            {goalCategories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.goalCard,
                  selectedGoalCategory === category.key && styles.goalCardSelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGoalCategory(category.key);
                }}
              >
                <Text style={styles.goalEmoji}>{category.emoji}</Text>
                <Text style={styles.goalLabel}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CTA */}
        <Animated.View style={animatedButtonStyle}>
          <TouchableOpacity 
            style={[styles.button, !canContinue && styles.buttonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={!canContinue}
          >
            <Text style={styles.buttonText}>Create My First Goal 🎯</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '20%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 5</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarContainer: {
    marginBottom: 6,
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  avatarPersonality: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  coachingOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  coachingOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coachingOptionSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  coachingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  coachingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  coachingDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  goalCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  goalEmoji: {
    fontSize: 18,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});