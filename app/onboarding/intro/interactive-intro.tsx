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
  interpolate,
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
  { type: 'robot', name: 'Linguabot', personality: 'analytical and persistent', emoji: '🤖' },
  { type: 'base', name: 'Buddy', personality: 'balanced and adaptable', emoji: '✨' },
];

const sampleGoals = {
  health: ['Run a 5K race', 'Lose 20 pounds', 'Sleep 8 hours daily'],
  learning: ['Read 12 books', 'Learn Spanish', 'Master coding'],
  career: ['Get promoted', 'Start a business', 'Network weekly'],
  personal: ['Practice mindfulness', 'Travel more', 'Build confidence']
};

export default function InteractiveIntro() {
  const { theme } = useTheme();
  const { completeIntroFlow, setIntroSelections } = useOnboardingStore();
  const styles = createStyles(theme);

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>('plant');
  const [coachingStyle, setCoachingStyle] = useState<CoachingStyle>('Companion');
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<keyof typeof sampleGoals>('health');

  // Animation values
  const avatarScale = useSharedValue(1);
  const coachingSlider = useSharedValue(0); // 0 = Companion, 1 = Coach
  const progressValue = useSharedValue(0);

  const handleAvatarSelect = (type: AvatarType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAvatar(type);
    avatarScale.value = withSpring(1.1, { damping: 15 }, () => {
      avatarScale.value = withSpring(1);
    });
  };

  const handleCoachingChange = (value: number) => {
    const newStyle: CoachingStyle = value < 0.5 ? 'Companion' : 'Coach';
    if (newStyle !== coachingStyle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCoachingStyle(newStyle);
    }
    coachingSlider.value = value;
  };

  const handleStartJourney = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Save selections to store
    setIntroSelections(selectedAvatar, coachingStyle, selectedGoalCategory);
    console.log('Saved selections:', { selectedAvatar, coachingStyle, selectedGoalCategory });

    progressValue.value = withTiming(1, { duration: 800 }, () => {
      runOnJS(completeIntroFlow)();
    });
  };

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const animatedSliderStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateX: interpolate(coachingSlider.value, [0, 1], [0, 120])
    }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
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
          <Text style={styles.title}>Personalize Your{'\n'}Journey</Text>
          <Text style={styles.subtitle}>
            Choose your companion and coaching style for the perfect fit
          </Text>
        </View>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
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
                    vitality={75} 
                    size={60} 
                    animated={selectedAvatar === avatar.type}
                  />
                </Animated.View>
                <Text style={styles.avatarName}>{avatar.name}</Text>
                <Text style={styles.avatarPersonality}>{avatar.personality}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Coaching Style Slider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coaching Style</Text>
          <View style={styles.coachingContainer}>
            <View style={styles.coachingTrack}>
              <Animated.View style={[styles.coachingThumb, animatedSliderStyle]} />
            </View>
            <View style={styles.coachingLabels}>
              <TouchableOpacity 
                style={styles.coachingLabel}
                onPress={() => handleCoachingChange(0)}
              >
                <Text style={styles.coachingEmoji}>🤗</Text>
                <Text style={[
                  styles.coachingText,
                  coachingStyle === 'Companion' && styles.coachingTextActive
                ]}>Companion</Text>
                <Text style={styles.coachingDesc}>Supportive friend</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.coachingLabel}
                onPress={() => handleCoachingChange(1)}
              >
                <Text style={styles.coachingEmoji}>💪</Text>
                <Text style={[
                  styles.coachingText,
                  coachingStyle === 'Coach' && styles.coachingTextActive
                ]}>Coach</Text>
                <Text style={styles.coachingDesc}>Tough love</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Goal Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What interests you?</Text>
          <View style={styles.goalCategories}>
            {Object.keys(sampleGoals).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.goalCategory,
                  selectedGoalCategory === category && styles.goalCategorySelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGoalCategory(category as keyof typeof sampleGoals);
                }}
              >
                <Text style={styles.goalCategoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sampleGoals}>
            {sampleGoals[selectedGoalCategory].map((goal, index) => (
              <View key={index} style={styles.sampleGoal}>
                <Text style={styles.sampleGoalText}>• {goal}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity 
          style={styles.button}
          onPress={handleStartJourney}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Start My Journey</Text>
          <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          🔒 Everything stays private on your device
        </Text>
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
    marginBottom: 40,
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  avatarPersonality: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  coachingContainer: {
    alignItems: 'center',
  },
  coachingTrack: {
    width: 160,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginBottom: 16,
    justifyContent: 'center',
  },
  coachingThumb: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginLeft: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  coachingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  coachingLabel: {
    alignItems: 'center',
    flex: 1,
  },
  coachingEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  coachingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 2,
  },
  coachingTextActive: {
    opacity: 1,
  },
  coachingDesc: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  goalCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  goalCategory: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalCategorySelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  goalCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  sampleGoals: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  sampleGoal: {
    marginBottom: 4,
  },
  sampleGoalText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
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
    overflow: 'hidden',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  footer: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
});
