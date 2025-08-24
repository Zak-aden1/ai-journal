import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding';

// New Intro Flow
import WelcomeHookStep from './intro/step-1-welcome-hook';
import ProblemSolutionStep from './intro/step-2-problem-solution';
import AvatarIntroStep from './intro/step-3-avatar-intro';
import InteractiveIntro from './intro/interactive-intro';

// Main Onboarding Steps (Streamlined from 9 to 5 steps)
import AvatarPersonalizationStep from './steps/step-3-avatar-personalization';
import GoalDetailsStep from './steps/step-5-goal-details';
import YourWhyStep from './steps/step-7-your-why';
import InteractiveTutorialStep from './steps/step-8-interactive-tutorial';
import PrivacyStep from './steps/step-9-privacy';

export default function OnboardingScreen() {
  const router = useRouter();
  const introStep = useOnboardingStore((s) => s.introStep);
  const introComplete = useOnboardingStore((s) => s.introComplete);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isComplete);

  console.log('OnboardingScreen render:', { introStep, introComplete, currentStep, isComplete });

  useEffect(() => {
    if (isComplete) {
      router.replace('/');
    }
  }, [isComplete, router]);

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

  // Show main onboarding after intro is complete (5 streamlined steps)
  switch (currentStep) {
    case 1:
      return <AvatarPersonalizationStep />;
    case 2:
      return <GoalDetailsStep />;
    case 3:
      return <YourWhyStep />;
    case 4:
      return <InteractiveTutorialStep />;
    case 5:
      return <PrivacyStep />;
    default:
      return <AvatarPersonalizationStep />;
  }
}