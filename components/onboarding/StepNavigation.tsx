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
}

export function StepNavigation({ step, canProceed, onBack, onNext }: Props) {
  const router = useRouter();
  const onboardingData = useOnboardingStore((s) => s.data);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const { addGoal, addHabit, saveWhy, submitEntry, setNextAction } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onNextPress = async () => {
    Keyboard.dismiss();
    if (step === 5 && canProceed && !isSubmitting) {
      try {
        setIsSubmitting(true);
        const title = onboardingData.goalTitle.trim();
        // Ensure there is at least some title
        const goalId = await addGoal(title.length ? title : 'My Goal');

        await saveWhy(goalId, {
          why_text: onboardingData.deepWhy,
          why_audio_uri: onboardingData.whyVoicePath || undefined,
          obstacles: onboardingData.selectedObstacles,
        });

        for (const habit of onboardingData.selectedHabits) {
          await addHabit(goalId, habit);
        }

        if (onboardingData.firstEntry && onboardingData.firstMood) {
          await submitEntry(onboardingData.firstEntry, onboardingData.firstMood);
        }

        const suggestion = nextActionFrom(
          onboardingData.firstEntry || title,
          [title.length ? title : 'your energy']
        );
        setNextAction(suggestion);

        completeOnboarding();
        router.replace('/');
      } catch (err) {
        console.warn('Failed to finish onboarding', err);
        Alert.alert('Saved locally', 'Some data may not have saved perfectly, but you can start now.');
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

      <TouchableOpacity
        onPress={onNextPress}
        style={[styles.nextButton, (!canProceed || isSubmitting) && styles.nextButtonDisabled]}
        disabled={!canProceed || isSubmitting}>
        <Text style={styles.nextText}>{step === 5 ? (isSubmitting ? 'Finishing…' : 'Finish') : 'Next'}</Text>
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
});
