import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding';
import { useAppStore } from '@/stores/app';
import { nextActionFrom } from '@/services/ai/suggestions';

interface Props {
  step: number;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  allowSkip?: boolean;
}

export function StepNavigation({ step, canProceed, onBack, onNext, allowSkip = false }: Props) {
  const router = useRouter();
  const onboardingData = useOnboardingStore((s) => s.data);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const { addGoal, addHabit, saveWhy, submitEntry, setNextAction } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onNextPress = async () => {
    Keyboard.dismiss();
    if (step === 7 && canProceed && !isSubmitting) {
      try {
        setIsSubmitting(true);
        console.log('[StepNavigation] Starting onboarding completion...');
        
        const title = onboardingData.goalTitle.trim();
        // Ensure there is at least some title
        const finalTitle = title.length ? title : 'My Goal';
        console.log('[StepNavigation] Creating goal:', finalTitle);
        
        const goalId = await addGoal(finalTitle);
        console.log('[StepNavigation] Goal created with ID:', goalId);

        // Save goal metadata
        console.log('[StepNavigation] Saving goal metadata...');
        await saveWhy(goalId, {
          why_text: onboardingData.deepWhy,
          why_audio_uri: onboardingData.whyVoicePath || undefined,
          obstacles: onboardingData.selectedObstacles,
        });

        // Create habits one by one with proper error handling
        console.log('[StepNavigation] Creating habits...', onboardingData.selectedHabits.length);
        for (const habit of onboardingData.selectedHabits) {
          try {
            const schedule = onboardingData.habitSchedules[habit];
            console.log(`[StepNavigation] Creating habit: ${habit}`);
            await addHabit(goalId, habit, schedule);
          } catch (habitErr) {
            console.error(`[StepNavigation] Failed to create habit ${habit}:`, habitErr);
            // Continue with other habits even if one fails
          }
        }

        // Submit initial journal entry (optional - don't fail onboarding if this fails)
        if (onboardingData.firstEntry && onboardingData.firstMood) {
          try {
            console.log('[StepNavigation] Submitting first journal entry...');
            await submitEntry(onboardingData.firstEntry, onboardingData.firstMood);
            console.log('[StepNavigation] First journal entry submitted successfully');
          } catch (entryErr) {
            console.warn('[StepNavigation] Failed to submit first journal entry (non-critical):', entryErr);
            // Don't fail the entire onboarding process for this
          }
        }

        // Generate next action suggestion
        const suggestion = nextActionFrom(
          onboardingData.firstEntry || finalTitle,
          [finalTitle]
        );
        setNextAction(suggestion);

        // Force app store to refresh data after all operations
        console.log('[StepNavigation] Forcing app store hydration...');
        const { hydrate } = useAppStore.getState();
        await hydrate();
        
        console.log('[StepNavigation] All onboarding data saved successfully, completing...');
        completeOnboarding();
        
        // Add small delay to ensure state updates propagate
        setTimeout(() => {
          console.log('[StepNavigation] Navigating to home...');
          router.replace('/');
        }, 100);
        
      } catch (err) {
        console.error('[StepNavigation] Failed to finish onboarding:', err);
        Alert.alert('Setup Complete', 'Your data has been saved. You can now start your journey!');
        
        // Even on error, try to force refresh and complete
        try {
          const { hydrate } = useAppStore.getState();
          await hydrate();
        } catch (hydrateErr) {
          console.warn('[StepNavigation] Failed to hydrate on error:', hydrateErr);
        }
        
        completeOnboarding();
        router.replace('/');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      {step > 1 ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      {allowSkip && !canProceed && (
        <TouchableOpacity onPress={onNext} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onNextPress}
        style={[
          styles.nextButton, 
          (!canProceed || isSubmitting) && !allowSkip && styles.nextButtonDisabled,
          allowSkip && !canProceed && styles.nextButtonSecondary
        ]}
        disabled={(!canProceed || isSubmitting) && !allowSkip}>
        <Text style={[
          styles.nextText,
          allowSkip && !canProceed && styles.nextTextSecondary
        ]}>
          {step === 7 ? (isSubmitting ? 'Finishing…' : 'Finish') : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    gap: 16,
  },
  placeholder: {
    flex: 1,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  nextButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  nextTextSecondary: {
    color: '#FFFFFF',
  },
});
