import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface OnboardingProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  showStepNames?: boolean;
  compact?: boolean;
}

export function OnboardingProgressIndicator({
  currentStep,
  totalSteps,
  stepTitles = [],
  showStepNames = false,
  compact = false
}: OnboardingProgressIndicatorProps) {
  const progressWidth = useSharedValue(0);

  React.useEffect(() => {
    const progress = (currentStep / totalSteps) * 100;
    progressWidth.value = withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStep, totalSteps]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const defaultStepTitles = [
    'Avatar',
    'Goal',
    'Why',
    'Habits',
    'Check-in',
    'Tutorial',
    'Privacy'
  ];

  const titles = stepTitles.length > 0 ? stepTitles : defaultStepTitles;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactProgressTrack}>
          <Animated.View style={[styles.compactProgressFill, animatedProgressStyle]} />
        </View>
        <Text style={styles.compactStepText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <View key={stepNumber} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isCurrent && styles.stepCircleCurrent,
                  isUpcoming && styles.stepCircleUpcoming,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    isCompleted && styles.stepNumberCompleted,
                    isCurrent && styles.stepNumberCurrent,
                    isUpcoming && styles.stepNumberUpcoming,
                  ]}
                >
                  {isCompleted ? '✓' : stepNumber}
                </Text>
              </View>
              {showStepNames && titles[index] && (
                <Text
                  style={[
                    styles.stepTitle,
                    isCurrent && styles.stepTitleCurrent,
                    isCompleted && styles.stepTitleCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {titles[index]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // Progress Bar Styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 12,
    opacity: 0.8,
  },

  // Step Indicators Styles
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  stepCircleCurrent: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: '#FFFFFF',
  },
  stepCircleUpcoming: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepNumberCompleted: {
    color: '#FFFFFF',
  },
  stepNumberCurrent: {
    color: '#FFFFFF',
  },
  stepNumberUpcoming: {
    color: 'rgba(255,255,255,0.5)',
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.6,
    color: '#FFFFFF',
  },
  stepTitleCurrent: {
    opacity: 1,
    fontWeight: '700',
  },
  stepTitleCompleted: {
    opacity: 0.8,
    color: '#22c55e',
  },

  // Compact Styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  compactProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  compactStepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
});