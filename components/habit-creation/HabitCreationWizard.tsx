import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { HabitCategory, HabitCategorySelector } from './HabitCategorySelector';
import { SmartSchedulingPanel } from './SmartSchedulingPanel';
import { HabitPreviewCard } from './HabitPreviewCard';
import { HabitSchedule } from '@/lib/db';

interface HabitData {
  title: string;
  description: string;
  category: HabitCategory | null;
  schedule: HabitSchedule | null;
  goalId: string | null;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  timeRange?: { start: string; end: string };
}

interface HabitCreationWizardProps {
  visible: boolean;
  onClose: () => void;
  initialGoalId?: string | null;
}

export function HabitCreationWizard({ visible, onClose, initialGoalId }: HabitCreationWizardProps) {
  const { theme } = useTheme();
  const { addHabit } = useAppStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [habitData, setHabitData] = useState<HabitData>({
    title: '',
    description: '',
    category: null,
    schedule: null,
    goalId: initialGoalId ?? null,
    duration: 15,
    difficulty: 'medium',
    timeRange: undefined,
  });

  // Animation references
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const styles = createStyles(theme);
  const totalSteps = 4;

  // Reset wizard when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Use setTimeout to ensure Modal is fully rendered before reset
      setTimeout(() => {
        // Reset to step 1
        setCurrentStep(1);
        setHabitData({
          title: '',
          description: '',
          category: null,
          schedule: null,
          goalId: initialGoalId ?? null,
          duration: 15,
          difficulty: 'medium',
          timeRange: undefined,
        });
        // Force reset animations to initial state
        slideAnim.setValue(0);
        progressAnim.setValue(0);
        
        // Double-check by logging current values
        console.log('Wizard reset - Step:', 1, 'SlideAnim:', slideAnim._value, 'ScreenWidth:', Dimensions.get('window').width);
      }, 50); // Small delay to let Modal settle
    }
  }, [visible, initialGoalId, slideAnim, progressAnim]);

  // Update habit data
  const updateHabitData = useCallback((updates: Partial<HabitData>) => {
    setHabitData(prev => ({ ...prev, ...updates }));
  }, []);

  // Memoized schedule change handler
  const handleScheduleChange = useCallback((schedule: HabitSchedule) => {
    updateHabitData({ schedule });
  }, [updateHabitData]);

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      animateToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      animateToStep(currentStep - 1);
    }
  };

  const animateToStep = (step: number) => {
    const screenWidth = Dimensions.get('window').width;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -(step - 1) * screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: (step / totalSteps) * 100,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Validation functions
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1: return habitData.title.trim().length >= 3; // Only title required for step 1
      case 2: return true; // Goal selection is optional
      case 3: return true; // Scheduling is optional, can use defaults
      case 4: return true; // Review step
      default: return false;
    }
  };

  // Handle creation
  const handleCreate = async () => {
    if (!habitData.title.trim()) return;

    setIsCreating(true);
    try {
      const enhancedData = {
        description: habitData.description || undefined,
        category: habitData.category || undefined,
        duration: habitData.duration,
        difficulty: habitData.difficulty,
        timeRange: habitData.timeRange,
      };

      // Provide default schedule if none set
      const defaultSchedule = {
        isDaily: true,
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        timeType: 'anytime' as const,
      };

      await addHabit(
        habitData.goalId,
        habitData.title.trim(),
        habitData.schedule || defaultSchedule,
        enhancedData
      );
      
      onClose();
      resetWizard();
    } catch (error) {
      console.error('Error creating habit:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Reset wizard state
  const resetWizard = () => {
    setCurrentStep(1);
    setHabitData({
      title: '',
      description: '',
      category: null,
      schedule: null,
      goalId: initialGoalId ?? null,
      duration: 15,
      difficulty: 'medium',
      timeRange: undefined,
    });
    slideAnim.setValue(0);
    progressAnim.setValue(0);
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header with Progress */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} disabled={isCreating}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <View style={styles.progressContainer}>
                <Text style={styles.stepCounter}>{currentStep} of {totalSteps}</Text>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                onPress={currentStep === totalSteps ? handleCreate : nextStep}
                disabled={!canProceedFromStep(currentStep) || isCreating}
                style={[
                  styles.actionButton,
                  (!canProceedFromStep(currentStep) || isCreating) && styles.actionButtonDisabled
                ]}
              >
                <Text style={[
                  styles.actionText,
                  (!canProceedFromStep(currentStep) || isCreating) && styles.actionTextDisabled
                ]}>
                  {currentStep === totalSteps 
                    ? (isCreating ? 'Creating...' : 'Create')
                    : 'Next'
                  }
                </Text>
              </TouchableOpacity>
            </View>

            {/* Steps Container */}
            <View style={styles.stepsContainer}>
              <Animated.View
                style={[
                  styles.stepsWrapper,
                  {
                    transform: [
                      {
                        translateX: slideAnim,
                      },
                    ],
                  },
                ]}
              >
                {/* Step 1: Basic Info & Category */}
                <ScrollView style={[styles.step, { backgroundColor: 'rgba(255,0,0,0.1)' }]} showsVerticalScrollIndicator={false}>
                  <Text style={styles.stepTitle}>What&apos;s your habit?</Text>
                  <Text style={styles.stepSubtitle}>
                    Choose a clear, specific action you want to do regularly
                  </Text>
                  
                  {/* Habit Title */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Habit Title *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Read for 30 minutes"
                      value={habitData.title}
                      onChangeText={(title) => updateHabitData({ title })}
                      maxLength={100}
                      autoFocus={currentStep === 1}
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Add details about your habit..."
                      value={habitData.description}
                      onChangeText={(description) => updateHabitData({ description })}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      maxLength={300}
                    />
                  </View>
                  
                  <HabitCategorySelector
                    selectedCategory={habitData.category}
                    onCategorySelect={(category) => updateHabitData({ category })}
                    compact={false}
                  />
                </ScrollView>

                {/* Step 2: Goal Connection */}
                <ScrollView style={styles.step} showsVerticalScrollIndicator={false}>
                  <Text style={styles.stepTitle}>Connect to a goal?</Text>
                  <Text style={styles.stepSubtitle}>
                    Link this habit to an existing goal or keep it standalone
                  </Text>
                  
                  <View style={styles.comingSoonCard}>
                    <Text style={styles.comingSoonEmoji}>🔗</Text>
                    <Text style={styles.comingSoonTitle}>Goal Connection</Text>
                    <Text style={styles.comingSoonText}>
                      Link your habit to existing goals for better tracking and motivation.
                    </Text>
                    <Text style={styles.comingSoonSubtext}>Coming in next update!</Text>
                  </View>
                </ScrollView>

                {/* Step 3: Smart Scheduling */}
                <ScrollView style={styles.step} showsVerticalScrollIndicator={false}>
                  <Text style={styles.stepTitle}>When will you do it?</Text>
                  <Text style={styles.stepSubtitle}>
                    Set up a schedule that works with your lifestyle
                  </Text>
                  
                  <SmartSchedulingPanel
                    category={habitData.category}
                    currentSchedule={habitData.schedule || undefined}
                    onScheduleChange={handleScheduleChange}
                  />
                </ScrollView>

                {/* Step 4: Review & Create */}
                <View style={[styles.step, { backgroundColor: 'rgba(0,255,0,0.1)' }]}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <HabitPreviewCard
                      habitData={habitData}
                      onEdit={(section) => {
                        const targetStep = section === 'basic' ? 1 : section === 'goal' ? 2 : 3;
                        setCurrentStep(targetStep);
                        animateToStep(targetStep);
                      }}
                      showMetrics={true}
                      compact={false}
                    />
                  </ScrollView>
                </View>
              </Animated.View>
            </View>

            {/* Navigation Footer */}
            <View style={styles.footer}>
              {currentStep > 1 && (
                <TouchableOpacity 
                  onPress={prevStep}
                  style={styles.backButton}
                  disabled={isCreating}
                >
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              )}
              
              {/* Step Indicators */}
              <View style={styles.stepIndicators}>
                {Array.from({ length: totalSteps }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepIndicator,
                      index + 1 === currentStep && styles.stepIndicatorActive,
                      index + 1 < currentStep && styles.stepIndicatorCompleted,
                    ]}
                  />
                ))}
              </View>
              
              <View style={styles.footerSpacer} />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    backgroundColor: theme.colors.background.primary,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    minWidth: 60,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.interactive.primary,
    borderRadius: 2,
  },
  actionButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
  },
  actionTextDisabled: {
    color: theme.colors.text.muted,
  },
  stepsContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  stepsWrapper: {
    flexDirection: 'row',
    height: '100%',
    width: Dimensions.get('window').width * 4, // Total width for all 4 steps
  },
  step: {
    width: Dimensions.get('window').width,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    flex: 0, // Prevent flex shrinking
    flexShrink: 0, // Ensure fixed width
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.background.primary,
  },
  backButton: {
    minWidth: 60,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.interactive.primary,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background.tertiary,
  },
  stepIndicatorActive: {
    backgroundColor: theme.colors.interactive.primary,
    transform: [{ scale: 1.2 }],
  },
  stepIndicatorCompleted: {
    backgroundColor: theme.colors.interactive.primary,
    opacity: 0.6,
  },
  footerSpacer: {
    minWidth: 60,
  },
  inputSection: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  comingSoonCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderStyle: 'dashed',
    marginTop: theme.spacing.lg,
  },
  comingSoonEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.md,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  comingSoonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  comingSoonSubtext: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});