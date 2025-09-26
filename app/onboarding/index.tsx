import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingRecoveryPrompt } from '@/components/onboarding/OnboardingRecoveryPrompt';

// New Intro Flow
import WelcomeHookStep from './intro/step-1-welcome-hook';
import ProblemSolutionStep from './intro/step-2-problem-solution';
import AvatarIntroStep from './intro/step-3-avatar-intro';
import InteractiveIntro from './intro/interactive-intro';

// Main Onboarding Steps (7 steps)
import AvatarPersonalizationStep from './steps/step-3-avatar-personalization';
import GoalDetailsStep from './steps/step-5-goal-details';
import HabitCreationStep from './steps/step-4-habit-creation';
import YourWhyStep from './steps/step-7-your-why';
import FirstCheckInStep from './steps/step-5-first-check-in';
import InteractiveTutorialStep from './steps/step-8-interactive-tutorial';
import PrivacyStep from './steps/step-9-privacy';

export default function OnboardingScreen() {
  const router = useRouter();
  const introStep = useOnboardingStore((s) => s.introStep);
  const introComplete = useOnboardingStore((s) => s.introComplete);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isComplete);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);
  const getRecoveryProgress = useOnboardingStore((s) => s.getRecoveryProgress);

  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [hasCheckedRecovery, setHasCheckedRecovery] = useState(false);

  console.log('OnboardingScreen render:', { introStep, introComplete, currentStep, isComplete });

  // Check for recovery data on mount
  useEffect(() => {
    const checkRecovery = async () => {
      if (hasCheckedRecovery) return;

      // If user has meaningful progress (beyond step 1 and has some data), show recovery prompt
      const progress = getRecoveryProgress();
      const hasProgress = currentStep > 1 && progress.completedSteps.length > 0;

      if (hasProgress && !isComplete) {
        setShowRecoveryPrompt(true);
      }

      setHasCheckedRecovery(true);
    };

    checkRecovery();
  }, [currentStep, isComplete, hasCheckedRecovery, getRecoveryProgress]);

  useEffect(() => {
    if (isComplete) {
      router.replace('/');
    }
  }, [isComplete, router]);

  const handleContinueRecovery = () => {
    setShowRecoveryPrompt(false);
    // Continue with current progress
  };

  const handleStartOver = () => {
    setShowRecoveryPrompt(false);
    resetOnboarding();
  };

  // Show new intro flow first
  if (!introComplete) {
    switch (introStep) {
      case 1:
        return <WelcomeHookStep />;
      case 2:
        return <ProblemSolutionStep />;
      case 3:
        return <AvatarIntroStep />;
      case 4:
        return <InteractiveIntro />;
      default:
        return <WelcomeHookStep />;
    }
  }

  // Show recovery prompt if needed
  if (showRecoveryPrompt) {
    return (
      <>
        {/* Show current step in background */}
        {(() => {
          switch (currentStep) {
            case 1:
              return <AvatarPersonalizationStep />;
            case 2:
              return <GoalDetailsStep />;
            case 3:
              return <YourWhyStep />;
            case 4:
              return <HabitCreationStep />;
            case 5:
              return <FirstCheckInStep />;
            case 6:
              return <InteractiveTutorialStep />;
            case 7:
              return <PrivacyStep />;
            default:
              return <AvatarPersonalizationStep />;
          }
        })()}

        <OnboardingRecoveryPrompt
          visible={showRecoveryPrompt}
          progress={getRecoveryProgress()}
          onContinue={handleContinueRecovery}
          onStartOver={handleStartOver}
        />
      </>
    );
  }

  // Show main onboarding after intro is complete (7 steps)
  switch (currentStep) {
    case 1:
      return <AvatarPersonalizationStep />;
    case 2:
      return <GoalDetailsStep />;
    case 3:
      return <YourWhyStep />;
    case 4:
      return <HabitCreationStep />;
    case 5:
      return <FirstCheckInStep />;
    case 6:
      return <InteractiveTutorialStep />;
    case 7:
      return <PrivacyStep />;
    default:
      return <AvatarPersonalizationStep />;
  }
}