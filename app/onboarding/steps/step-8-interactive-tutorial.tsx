import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { HabitCelebrationModal } from '@/components/HabitCelebrationModal';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';
import * as Haptics from 'expo-haptics';

const getAvatarComponent = (type: string) => {
  switch (type) {
    case 'plant': return PlantAvatar;
    case 'pet': return PetAvatar;
    case 'robot': return RobotAvatar;
    default: return BaseAvatar;
  }
};

const getTutorialHabit = (goalCategory: string) => {
  const habits = {
    health: {
      name: 'Drink a glass of water',
      emoji: '💧',
      description: 'Stay hydrated for better health',
      goalTheme: 'wellness' as const
    },
    learning: {
      name: 'Read for 10 minutes',
      emoji: '📖',
      description: 'Expand your knowledge daily',
      goalTheme: 'learning' as const
    },
    career: {
      name: 'Review your goals',
      emoji: '🎯',
      description: 'Plan your professional growth',
      goalTheme: 'creativity' as const
    },
    personal: {
      name: 'Practice gratitude',
      emoji: '🙏',
      description: 'Reflect on positive moments',
      goalTheme: 'wellness' as const
    }
  };
  
  return habits[goalCategory as keyof typeof habits] || habits.personal;
};

export default function InteractiveTutorialStep() {
  const { data, setTutorialCompleted, setFirstHabitCompleted } = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  
  const progressRef = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseRef = useRef(new Animated.Value(1)).current;
  
  const avatarType = data.selectedAvatarType || 'base';
  const goalCategory = data.goalCategory || 'personal';
  const avatarName = data.avatarName || 'Companion';
  const tutorialHabit = getTutorialHabit(goalCategory);
  
  const AvatarComponent = getAvatarComponent(avatarType);
  
  const tutorialSteps = [
    {
      title: 'Welcome to Habit Completion!',
      description: `Let's learn how to complete habits with ${avatarName}. This is the heart of your journey together!`,
      action: 'Continue',
      showHabit: false
    },
    {
      title: 'Hold to Complete',
      description: 'Instead of tapping, you\'ll hold the habit button for 3 seconds. This makes each completion more intentional.',
      action: 'Got it!',
      showHabit: false
    },
    {
      title: 'Try It Yourself!',
      description: `Hold the button below to complete "${tutorialHabit.name}" and see ${avatarName} celebrate with you!`,
      action: null,
      showHabit: true
    }
  ];
  
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Start pulse animation on the habit button
      if (currentStep === 1) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseRef, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseRef, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  };
  
  const handleHoldStart = () => {
    setIsHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Start progress animation
    Animated.timing(progressRef, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
    
    // Set timer for completion
    holdTimerRef.current = setTimeout(() => {
      handleHabitComplete();
    }, 3000);
    
    // Haptic feedback during hold
    const hapticInterval = setInterval(() => {
      if (holdTimerRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        clearInterval(hapticInterval);
      }
    }, 500);
  };
  
  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    
    // Reset progress animation
    Animated.timing(progressRef, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  
  const handleHabitComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsHolding(false);
    progressRef.setValue(0);
    pulseRef.stopAnimation();
    pulseRef.setValue(1);
    
    // Mark tutorial steps as complete
    setFirstHabitCompleted();
    setShowCelebration(true);
  };
  
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setTutorialComplete(true);
    setTutorialCompleted();
  };
  
  const currentStepData = tutorialSteps[currentStep];
  
  return (
    <OnboardingContainer step={6} gradient={['#667eea', '#764ba2']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </View>

        {/* Avatar Display */}
        <View style={styles.avatarSection}>
          <AvatarComponent
            vitality={75}
            size={100}
            animated={true}
          />
          <Text style={styles.avatarName}>{avatarName}</Text>
          <Text style={styles.avatarMessage}>
            {currentStep === 0 && "Hi! Ready to learn together? 😊"}
            {currentStep === 1 && "Hold, don't tap! I'll celebrate with you! 🎉"}
            {currentStep === 2 && "Try it! Hold the button below! 💪"}
          </Text>
        </View>

        {/* Interactive Habit Button */}
        {currentStepData.showHabit && (
          <View style={styles.habitSection}>
            <Text style={styles.habitLabel}>Practice Habit:</Text>
            
            <Animated.View style={[styles.habitCard, { transform: [{ scale: pulseRef }] }]}>
              <TouchableOpacity
                style={[styles.habitButton, isHolding && styles.habitButtonHolding]}
                onPressIn={handleHoldStart}
                onPressOut={handleHoldEnd}
                activeOpacity={1}
              >
                <View style={styles.habitContent}>
                  <Text style={styles.habitEmoji}>{tutorialHabit.emoji}</Text>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitName}>{tutorialHabit.name}</Text>
                    <Text style={styles.habitDescription}>{tutorialHabit.description}</Text>
                  </View>
                </View>
                
                {/* Progress Overlay */}
                <Animated.View
                  style={[
                    styles.progressOverlay,
                    {
                      opacity: progressRef.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.3],
                      }),
                    },
                  ]}
                />
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressRef.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <Text style={styles.instructionText}>
              {isHolding ? 'Keep holding... 3 seconds!' : 'Hold for 3 seconds to complete'}
            </Text>
          </View>
        )}

        {/* Tutorial Completed Message */}
        {tutorialComplete && (
          <View style={styles.completedSection}>
            <Text style={styles.completedTitle}>🎉 Tutorial Complete!</Text>
            <Text style={styles.completedMessage}>
              Great job! You&apos;ve learned how to complete habits with {avatarName}. 
              They&apos;re excited to grow with you on your journey!
            </Text>
          </View>
        )}

        {/* Action Button */}
        {currentStepData.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>{currentStepData.action}</Text>
          </TouchableOpacity>
        )}

        {/* Step Indicators */}
        <View style={styles.stepIndicators}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive,
                index < currentStep && styles.stepDotCompleted
              ]}
            />
          ))}
        </View>
      </View>

      {/* Celebration Modal */}
      <HabitCelebrationModal
        visible={showCelebration}
        habitName={tutorialHabit.name}
        habitEmoji={tutorialHabit.emoji}
        goalTheme={tutorialHabit.goalTheme}
        avatar={{ type: avatarType, name: avatarName }}
        oldVitality={60}
        newVitality={75}
        vitalityIncrease={15}
        onClose={handleCelebrationClose}
      />
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  avatarMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  habitSection: {
    marginBottom: 32,
  },
  habitLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  habitCard: {
    marginBottom: 16,
  },
  habitButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  habitButtonHolding: {
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  habitDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#22c55e',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.9,
  },
  completedSection: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  completedTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  completedMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.95,
  },
  actionButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: '#22c55e',
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: '#22c55e',
  },
});