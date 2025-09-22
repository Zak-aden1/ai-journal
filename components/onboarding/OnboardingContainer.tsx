import React from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressDots } from './ProgressDots';
import { OnboardingProgressIndicator } from './OnboardingProgressIndicator';
import { StepNavigation } from './StepNavigation';
import { useOnboardingStore } from '@/stores/onboarding';

interface Props {
  children: React.ReactNode;
  step: number;
  gradient: [string, string];
  totalSteps?: number;
  allowSkip?: boolean;
  showProgressBar?: boolean;
  compact?: boolean;
  hasUnsavedChanges?: boolean;
  onSaveBeforeBack?: () => Promise<void> | void;
}

export function OnboardingContainer({
  children,
  step,
  gradient,
  totalSteps = 7,
  allowSkip = false,
  showProgressBar = true,
  compact = false,
  hasUnsavedChanges = false,
  onSaveBeforeBack
}: Props) {
  const canProceed = useOnboardingStore((s) => s.canProceedFromStep(step));
  const setStep = useOnboardingStore((s) => s.setStep);

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={12}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.content}>
              {showProgressBar ? (
                <OnboardingProgressIndicator
                  currentStep={step}
                  totalSteps={totalSteps}
                  compact={compact}
                />
              ) : (
                <ProgressDots current={step} total={totalSteps} />
              )}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  styles.scrollContent,
                  step === 5 && styles.scrollContentStep5
                ]}
              >
                {children}
              </ScrollView>
              <StepNavigation
                step={step}
                canProceed={canProceed}
                onBack={() => setStep(step - 1)}
                onNext={() => setStep(step + 1)}
                allowSkip={allowSkip}
                hasUnsavedChanges={hasUnsavedChanges}
                onSaveBeforeBack={onSaveBeforeBack}
              />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingHorizontal: 0,
    paddingBottom: 16,
  },
  scrollContentStep5: {
    paddingBottom: 200, // Much more padding for Privacy step with lots of content
  },
});
