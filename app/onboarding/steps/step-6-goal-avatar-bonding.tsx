import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

const getAvatarComponent = (type: string) => {
  switch (type) {
    case 'plant': return PlantAvatar;
    case 'pet': return PetAvatar;
    case 'robot': return RobotAvatar;
    default: return BaseAvatar;
  }
};

const getBondingMessage = (avatarType: string, goalCategory: string, avatarName: string) => {
  const messages = {
    plant: {
      health: `${avatarName} will bloom beautifully as you nurture your body with healthy habits. Each workout and nutritious meal helps them grow stronger! 🌱`,
      learning: `${avatarName} thrives on knowledge! Every book you read and skill you learn helps them grow wiser and more vibrant. 📚`,
      career: `${avatarName} grows with your professional development. Each career milestone helps them flourish in their own unique way! 💼`,
      personal: `${avatarName} blossoms as you invest in yourself. Personal growth activities help them reach their full potential! 🌟`
    },
    pet: {
      health: `${avatarName} gets more energetic and playful as you stay active! They love celebrating your fitness achievements and keeping you motivated! 🏃‍♀️`,
      learning: `${avatarName} gets excited every time you learn something new! They'll be your loyal study buddy through all your educational adventures! 📚`,
      career: `${avatarName} is your professional cheerleader! They get more confident and proud as you advance in your career! 💼`,
      personal: `${avatarName} becomes happier and more vibrant as you focus on personal growth. They love seeing you become your best self! 🌟`
    },
    robot: {
      health: `${avatarName} optimizes their systems as you improve your health metrics. They love tracking your progress and helping you achieve peak performance! 💪`,
      learning: `${avatarName} processes new information and gets smarter as you learn! They're your analytical partner in skill development! 🧠`,
      career: `${avatarName} upgrades their capabilities as you advance professionally. They're programmed for success and love seeing your achievements! 🚀`,
      personal: `${avatarName} adapts and evolves as you grow personally. They calculate the best strategies for your self-improvement journey! 📊`
    },
    base: {
      health: `${avatarName} gets healthier and more vibrant as you focus on wellness. They're your supportive companion through every healthy choice! 💚`,
      learning: `${avatarName} grows alongside your expanding knowledge. They celebrate every learning milestone with you! 🎓`,
      career: `${avatarName} becomes more accomplished as you advance professionally. They're proud to support your career journey! 📈`,
      personal: `${avatarName} evolves as you focus on personal development. They're here to support every aspect of your growth! ✨`
    }
  };
  
  return messages[avatarType as keyof typeof messages]?.[goalCategory as keyof typeof messages.plant] || 
         `${avatarName} will grow and thrive as you work towards your goals! 🌟`;
};

export default function GoalAvatarBondingStep() {
  const { data } = useOnboardingStore();
  const [currentDemo, setCurrentDemo] = useState(0);
  
  const avatarType = data.selectedAvatarType || 'base';
  const goalCategory = data.goalCategory || 'personal';
  const avatarName = data.avatarName || 'Companion';
  const goalTitle = data.goalTitle || 'Your Goal';
  
  const AvatarComponent = getAvatarComponent(avatarType);
  
  // Animation values
  const avatar1Scale = useSharedValue(1);
  const avatar2Scale = useSharedValue(0);
  const avatar3Scale = useSharedValue(0);
  const progressBar = useSharedValue(0);
  const heartScale = useSharedValue(0);
  
  const demoStates = [
    { vitality: 30, progress: 0, label: 'Just Starting', description: 'Beginning the journey' },
    { vitality: 65, progress: 50, label: 'Making Progress', description: 'Building momentum' },
    { vitality: 90, progress: 100, label: 'Thriving!', description: 'Goal achieved!' }
  ];
  
  useEffect(() => {
    // Start the demo animation cycle
    const runDemo = () => {
      // Reset all animations
      avatar1Scale.value = 1;
      avatar2Scale.value = 0;
      avatar3Scale.value = 0;
      progressBar.value = 0;
      heartScale.value = 0;
      
      // Animate to state 1
      setTimeout(() => {
        setCurrentDemo(1);
        avatar1Scale.value = withTiming(0, { duration: 500 });
        avatar2Scale.value = withSpring(1, { damping: 8, stiffness: 100 });
        progressBar.value = withTiming(0.5, { duration: 1000 });
        heartScale.value = withSequence(
          withTiming(1.2, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );
      }, 2000);
      
      // Animate to state 2
      setTimeout(() => {
        setCurrentDemo(2);
        avatar2Scale.value = withTiming(0, { duration: 500 });
        avatar3Scale.value = withSpring(1, { damping: 8, stiffness: 100 });
        progressBar.value = withTiming(1, { duration: 1000 });
        heartScale.value = withSequence(
          withTiming(1.5, { duration: 300 }),
          withTiming(1, { duration: 300 })
        );
      }, 4500);
      
      // Reset after showing final state
      setTimeout(() => {
        setCurrentDemo(0);
        avatar3Scale.value = withTiming(0, { duration: 500 });
        avatar1Scale.value = withSpring(1, { damping: 8, stiffness: 100 });
        progressBar.value = withTiming(0, { duration: 500 });
        heartScale.value = withTiming(0, { duration: 300 });
      }, 7000);
    };
    
    runDemo();
    const interval = setInterval(runDemo, 9000);
    
    return () => clearInterval(interval);
  }, [avatar1Scale, avatar2Scale, avatar3Scale, progressBar, heartScale]);
  
  const avatar1Style = useAnimatedStyle(() => ({
    transform: [{ scale: avatar1Scale.value }],
    opacity: avatar1Scale.value,
  }));
  
  const avatar2Style = useAnimatedStyle(() => ({
    transform: [{ scale: avatar2Scale.value }],
    opacity: avatar2Scale.value,
  }));
  
  const avatar3Style = useAnimatedStyle(() => ({
    transform: [{ scale: avatar3Scale.value }],
    opacity: avatar3Scale.value,
  }));
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressBar.value * 100}%`,
  }));
  
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  
  return (
    <OnboardingContainer step={6} gradient={['#667eea', '#764ba2']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Journey Together</Text>
          <Text style={styles.subtitle}>
            Watch how {avatarName} grows as you make progress on "{goalTitle}"
          </Text>
        </View>

        {/* Animated Demo */}
        <View style={styles.demoContainer}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Goal Progress</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
            <Text style={styles.progressText}>
              {demoStates[currentDemo].progress}% - {demoStates[currentDemo].label}
            </Text>
          </View>

          {/* Avatar States */}
          <View style={styles.avatarDemo}>
            <View style={styles.avatarContainer}>
              <Animated.View style={[styles.avatarState, avatar1Style]}>
                <AvatarComponent vitality={30} size={100} animated={true} />
              </Animated.View>
              <Animated.View style={[styles.avatarState, avatar2Style]}>
                <AvatarComponent vitality={65} size={100} animated={true} />
              </Animated.View>
              <Animated.View style={[styles.avatarState, avatar3Style]}>
                <AvatarComponent vitality={90} size={100} animated={true} />
              </Animated.View>
              
              {/* Heart Animation */}
              <Animated.View style={[styles.heartContainer, heartStyle]}>
                <Text style={styles.heart}>💚</Text>
              </Animated.View>
            </View>
            
            <Text style={styles.avatarStateLabel}>
              {avatarName}: "{demoStates[currentDemo].description}"
            </Text>
          </View>
        </View>

        {/* Bonding Message */}
        <View style={styles.bondingSection}>
          <Text style={styles.bondingTitle}>Your Special Bond</Text>
          <Text style={styles.bondingMessage}>
            {getBondingMessage(avatarType, goalCategory, avatarName)}
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Complete Habits</Text>
                <Text style={styles.stepDescription}>
                  Each habit you complete increases {avatarName}'s vitality
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Watch Growth</Text>
                <Text style={styles.stepDescription}>
                  {avatarName} becomes happier and more vibrant with your progress
                </Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Achieve Together</Text>
                <Text style={styles.stepDescription}>
                  Celebrate your goal achievements with your thriving companion!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>
            Ready to start this journey with {avatarName}? Let's set up your first habits!
          </Text>
        </View>
      </ScrollView>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  demoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  avatarDemo: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  avatarState: {
    position: 'absolute',
  },
  heartContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  heart: {
    fontSize: 24,
  },
  avatarStateLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bondingSection: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bondingTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  bondingMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.95,
  },
  howItWorksSection: {
    marginBottom: 24,
  },
  howItWorksTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 100, // Space for bottom button
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});