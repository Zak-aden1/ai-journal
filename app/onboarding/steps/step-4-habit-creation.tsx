import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { HabitTemplateBuilder } from '@/components/HabitTemplateBuilder';
import { FirstHabitCompletion } from '@/components/FirstHabitCompletion';
import { createOnboardingStyles } from '@/components/goal-creation/OnboardingGoalCreationStyles';
import { HabitSuggestionsService, type HabitConcept, type HabitTemplate } from '@/services/ai/habitSuggestions';

type FlowStep = 'concepts' | 'template' | 'confirmation' | 'completion';

export default function HabitCreationStep() {
  const { data, setStep, setHabitTemplate } = useOnboardingStore();
  const styles = createOnboardingStyles();

  // Flow state
  const [flowStep, setFlowStep] = useState<FlowStep>('concepts');
  const [selectedConcept, setSelectedConcept] = useState<HabitConcept | null>(null);
  const [habitConcepts, setHabitConcepts] = useState<HabitConcept[]>([]);
  const [createdHabit, setCreatedHabit] = useState<{ template: HabitTemplate; fullHabit: string } | null>(null);

  // Load habit concepts on component mount
  useEffect(() => {
    if (data.goalTitle && data.goalCategory) {
      const concepts = HabitSuggestionsService.getHabitConcepts(data.goalTitle, data.goalCategory);
      setHabitConcepts(concepts);
    }
  }, [data.goalTitle, data.goalCategory]);

  const handleConceptSelect = (concept: HabitConcept) => {
    setSelectedConcept(concept);
    setFlowStep('template');
  };

  const handleHabitCreated = (template: HabitTemplate, fullHabit: string) => {
    setCreatedHabit({ template, fullHabit });
    setFlowStep('confirmation');
  };

  const handleConfirmHabit = () => {
    if (!createdHabit) return;

    // Store the habit template in the onboarding store
    setHabitTemplate(createdHabit.template, createdHabit.fullHabit);

    // Move to completion step
    setFlowStep('completion');
  };

  const handleFirstCompletionDone = () => {
    // Move to next step in onboarding flow
    setStep(5);
  };

  const handleSkipFirstCompletion = () => {
    // Move to next step without completing
    setStep(5);
  };

  const handleBackToConcepts = () => {
    setSelectedConcept(null);
    setFlowStep('concepts');
  };

  const handleBackToTemplate = () => {
    setCreatedHabit(null);
    setFlowStep('template');
  };

  const canContinue = createdHabit !== null;

  // Concept Selection Step
  if (flowStep === 'concepts') {
    return (
      <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']} compact={true}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header as any}>
            <Text style={styles.title as any}>Choose your habit focus</Text>
            <Text style={styles.subtitle as any}>
              Pick one area to focus on for &ldquo;{data.goalTitle}&rdquo;
            </Text>
          </View>

          <View style={styles.form as any}>
            <Text style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              ✨ We'll help you create a specific, personalized habit
            </Text>

            {/* Concept Cards */}
            <View style={{ marginBottom: 20 }}>
              {habitConcepts.map((concept, index) => (
                <TouchableOpacity
                  key={concept.concept}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 12,
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center'
                  }}
                  onPress={() => handleConceptSelect(concept)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>{concept.icon}</Text>

                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 4,
                    textAlign: 'center'
                  }}>
                    {concept.concept}
                  </Text>

                  <Text style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 14,
                    textAlign: 'center',
                    lineHeight: 18
                  }}>
                    {concept.description}
                  </Text>

                  <View style={{
                    backgroundColor: `rgba(${concept.category === 'physical' ? '34, 197, 94' : concept.category === 'mental' ? '59, 130, 246' : concept.category === 'creative' ? '168, 85, 247' : concept.category === 'social' ? '245, 158, 11' : '139, 69, 19'}, 0.2)`,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginTop: 8
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {concept.category}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom option */}
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: 16,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center'
              }}
              onPress={() => handleConceptSelect({
                concept: 'Custom Habit',
                icon: '⭐',
                description: 'Create something completely unique',
                defaultAction: '',
                defaultTiming: '',
                category: 'productive'
              })}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>⭐</Text>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 4
              }}>
                Create Custom Habit
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                textAlign: 'center'
              }}>
                Build something completely unique for your goal
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </OnboardingContainer>
    );
  }

  // Template Building Step
  if (flowStep === 'template' && selectedConcept) {
    const defaults = selectedConcept.concept !== 'Custom Habit'
      ? HabitSuggestionsService.generateTemplateDefaults(selectedConcept, data.goalTitle, data.goalCategory)
      : { action: '', timing: '' };

    return (
      <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']} compact={true}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header as any}>
            <TouchableOpacity
              onPress={handleBackToConcepts}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
                alignSelf: 'flex-start'
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>← </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Back to concepts</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>{selectedConcept.icon}</Text>
              <Text style={[styles.title as any, { fontSize: 20 }]}>
                {selectedConcept.concept}
              </Text>
            </View>

            <Text style={styles.subtitle as any}>
              {selectedConcept.description}
            </Text>
          </View>

          <HabitTemplateBuilder
            goalTitle={data.goalTitle}
            goalCategory={data.goalCategory}
            defaultAction={defaults.action}
            defaultTiming={defaults.timing}
            onHabitCreated={handleHabitCreated}
            onCancel={handleBackToConcepts}
          />
        </ScrollView>
      </OnboardingContainer>
    );
  }

  // Confirmation Step
  if (flowStep === 'confirmation' && createdHabit) {
    return (
      <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']} compact={true}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header as any}>
            <Text style={styles.title as any}>Your habit is ready! 🎉</Text>
            <Text style={styles.subtitle as any}>
              Review your habit and let's make it official
            </Text>
          </View>

          <View style={styles.form as any}>
            {/* Habit Display */}
            <View style={{
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: 'rgba(34, 197, 94, 0.3)'
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                ✅ YOUR HABIT
              </Text>

              <Text style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 16
              }}>
                &ldquo;{createdHabit.fullHabit}&rdquo;
              </Text>

              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 12
              }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Why this habit works:
                </Text>

                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 17
                }}>
                  • It's specific and actionable{'\n'}
                  • It has a clear time and context{'\n'}
                  • It's directly connected to your goal{'\n'}
                  • Research shows this format increases success by 2-3x
                </Text>
              </View>
            </View>

            {/* Next Steps Preview */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 12,
                textAlign: 'center'
              }}>
                🚀 What happens next?
              </Text>

              <View style={{ gap: 8 }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  lineHeight: 18
                }}>
                  1. We'll help you do this habit right now
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  lineHeight: 18
                }}>
                  2. Set up reminders to stay consistent
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  lineHeight: 18
                }}>
                  3. Track your progress and celebrate wins
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              justifyContent: 'center'
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)'
                }}
                onPress={handleBackToTemplate}
              >
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Edit Habit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#22c55e',
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 12
                }}
                onPress={handleConfirmHabit}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '700'
                }}>
                  Let's Do This! 🎯
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </OnboardingContainer>
    );
  }

  // First Habit Completion Step
  if (flowStep === 'completion' && createdHabit) {
    return (
      <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']} compact={true}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header as any}>
            <Text style={styles.title as any}>Perfect timing! 🎯</Text>
            <Text style={styles.subtitle as any}>
              Let's complete your first habit right now and build momentum
            </Text>
          </View>

          <FirstHabitCompletion
            habitTemplate={createdHabit.template}
            habitFullText={createdHabit.fullHabit}
            onComplete={handleFirstCompletionDone}
            onSkip={handleSkipFirstCompletion}
          />
        </ScrollView>
      </OnboardingContainer>
    );
  }

  // Fallback (shouldn't reach here)
  return (
    <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']} compact={true}>
      <View style={styles.container}>
        <Text style={styles.title as any}>Loading...</Text>
      </View>
    </OnboardingContainer>
  );
}