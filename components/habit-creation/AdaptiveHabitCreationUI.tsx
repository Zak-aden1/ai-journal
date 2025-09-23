import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import {
  UnifiedHabitCreation,
  HabitCreationContext,
  HabitCreationMode,
  HabitCreationConfig,
  HabitData
} from './UnifiedHabitCreation';
import { HabitCategory } from './UnifiedHabitTemplates';

// Base interface for all adaptive UI components
interface AdaptiveUIProps extends Omit<HabitCreationConfig, 'context' | 'mode'> {
  visible?: boolean;
  title?: string;
  subtitle?: string;
  gradient?: string[];
  style?: any;
}

// Onboarding Container - Inline within existing flow
interface OnboardingHabitCreationProps extends AdaptiveUIProps {
  stepNumber?: number;
  totalSteps?: number;
  compact?: boolean;
}

export function OnboardingHabitCreation({
  stepNumber,
  totalSteps,
  compact = true,
  goalCategory,
  goalId,
  existingHabits = [],
  onComplete,
  onCancel,
  style
}: OnboardingHabitCreationProps) {
  const styles = createOnboardingStyles();

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {stepNumber && totalSteps && (
        <View style={styles.stepHeader}>
          <Text style={styles.stepIndicator}>
            Step {stepNumber} of {totalSteps}
          </Text>
          <Text style={styles.stepTitle}>Add some habits</Text>
          <Text style={styles.stepSubtitle}>
            Choose habits that will help you achieve your goal
          </Text>
        </View>
      )}

      <UnifiedHabitCreation
        context="onboarding"
        mode="inline"
        features={{
          aiSuggestions: true,
          goalLinking: false,
          categorySelection: false,
          advancedScheduling: false,
          progressiveDisclosure: true,
          templateChips: true,
          realTimeValidation: true,
          inspirationSection: true
        }}
        goalCategory={goalCategory}
        goalId={goalId}
        existingHabits={existingHabits}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </View>
  );
}

// Modal Container - For homepage and standalone use
interface ModalHabitCreationProps extends AdaptiveUIProps {
  visible: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'pageSheet' | 'formSheet' | 'fullScreen';
}

export function ModalHabitCreation({
  visible,
  title = "New Habit",
  subtitle,
  animationType = 'slide',
  presentationStyle = 'pageSheet',
  goalCategory,
  goalId,
  existingHabits = [],
  onComplete,
  onCancel,
  style
}: ModalHabitCreationProps) {
  const { theme } = useTheme();
  const styles = createModalStyles(theme);

  const handleComplete = (habitData: HabitData) => {
    onComplete?.(habitData);
  };

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>

            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <UnifiedHabitCreation
              context="homepage"
              mode="modal"
              features={{
                aiSuggestions: true,
                goalLinking: true,
                categorySelection: true,
                advancedScheduling: true,
                progressiveDisclosure: true,
                templateChips: true,
                realTimeValidation: true,
                inspirationSection: false
              }}
              goalCategory={goalCategory}
              goalId={goalId}
              existingHabits={existingHabits}
              onComplete={handleComplete}
              onCancel={onCancel}
              style={style}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// Wizard Container - Multi-step guided experience
interface WizardHabitCreationProps extends AdaptiveUIProps {
  visible: boolean;
  totalSteps?: number;
}

export function WizardHabitCreation({
  visible,
  title = "Create New Habit",
  totalSteps = 3,
  goalCategory,
  goalId,
  existingHabits = [],
  onComplete,
  onCancel,
  style
}: WizardHabitCreationProps) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [habitData, setHabitData] = React.useState<Partial<HabitData>>({});
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const styles = createWizardStyles(theme);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      Animated.timing(slideAnim, {
        toValue: -(currentStep) * 100,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      Animated.timing(slideAnim, {
        toValue: -(currentStep - 2) * 100,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  const handleStepComplete = (data: HabitData) => {
    setHabitData(prev => ({ ...prev, ...data }));
    if (currentStep === totalSteps) {
      onComplete?.(data);
    } else {
      nextStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        {/* Header with Progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <Text style={styles.stepCounter}>{currentStep} of {totalSteps}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(currentStep / totalSteps) * 100}%` }
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={currentStep === totalSteps ? () => onComplete?.(habitData as HabitData) : nextStep}
          >
            <Text style={styles.nextText}>
              {currentStep === totalSteps ? 'Create' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Steps Container */}
        <View style={styles.stepsContainer}>
          <Animated.View
            style={[
              styles.stepsWrapper,
              {
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [-200, 0, 200],
                    outputRange: [200, 0, -200]
                  })
                }]
              }
            ]}
          >
            {/* Step 1: Basic Info */}
            <View style={styles.step}>
              <Text style={styles.stepTitle}>What&apos;s your habit?</Text>
              <UnifiedHabitCreation
                context="homepage"
                mode="wizard"
                features={{
                  aiSuggestions: false,
                  goalLinking: false,
                  categorySelection: true,
                  advancedScheduling: false,
                  progressiveDisclosure: false,
                  templateChips: true,
                  realTimeValidation: true,
                  inspirationSection: true
                }}
                goalCategory={goalCategory}
                goalId={goalId}
                existingHabits={existingHabits}
                onComplete={handleStepComplete}
                onCancel={onCancel}
              />
            </View>

            {/* Additional wizard steps would go here */}
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity onPress={prevStep}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.stepIndicators}>
            {Array.from({ length: totalSteps }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.stepIndicator,
                  index + 1 === currentStep && styles.stepIndicatorActive,
                  index + 1 < currentStep && styles.stepIndicatorCompleted
                ]}
              />
            ))}
          </View>

          <View style={styles.footerSpacer} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Goal Detail Container - Contextual within goal view
interface GoalDetailHabitCreationProps extends AdaptiveUIProps {
  goalTitle?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function GoalDetailHabitCreation({
  goalTitle,
  collapsed = false,
  onToggleCollapse,
  goalCategory,
  goalId,
  existingHabits = [],
  onComplete,
  onCancel,
  style
}: GoalDetailHabitCreationProps) {
  const styles = createGoalDetailStyles();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggleCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>➕</Text>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Add Habit</Text>
            <Text style={styles.headerSubtitle}>
              {goalTitle ? `Support your "${goalTitle}" goal` : 'Support this goal'}
            </Text>
          </View>
        </View>
        <Text style={styles.collapseIcon}>
          {collapsed ? '▶' : '▼'}
        </Text>
      </TouchableOpacity>

      {!collapsed && (
        <View style={styles.content}>
          <UnifiedHabitCreation
            context="goal-detail"
            mode="inline"
            features={{
              aiSuggestions: true,
              goalLinking: false, // Auto-linked
              categorySelection: false, // Inferred from goal
              advancedScheduling: true,
              progressiveDisclosure: true,
              templateChips: true,
              realTimeValidation: true,
              inspirationSection: true
            }}
            goalCategory={goalCategory}
            goalId={goalId}
            existingHabits={existingHabits}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        </View>
      )}
    </View>
  );
}

// Floating Action Button trigger
interface FloatingHabitCreationProps {
  onPress: () => void;
  style?: any;
}

export function FloatingHabitCreation({ onPress, style }: FloatingHabitCreationProps) {
  const styles = createFloatingStyles();

  return (
    <TouchableOpacity style={[styles.fab, style]} onPress={onPress}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.fabGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.fabIcon}>+</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Factory function to create appropriate UI based on context
export function createAdaptiveHabitCreation(
  context: HabitCreationContext,
  mode: HabitCreationMode,
  props: AdaptiveUIProps
) {
  if (context === 'onboarding') {
    return <OnboardingHabitCreation {...props} />;
  }

  if (mode === 'modal' && context === 'homepage') {
    return <ModalHabitCreation {...props} visible={props.visible || false} />;
  }

  if (mode === 'wizard') {
    return <WizardHabitCreation {...props} visible={props.visible || false} />;
  }

  if (context === 'goal-detail') {
    return <GoalDetailHabitCreation {...props} />;
  }

  // Default to modal
  return <ModalHabitCreation {...props} visible={props.visible || false} />;
}

// Styles for different contexts
const createOnboardingStyles = () => StyleSheet.create({
  container: {
    padding: 20
  },
  containerCompact: {
    padding: 16
  },
  stepHeader: {
    marginBottom: 20,
    alignItems: 'center'
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center'
  },
  stepSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22
  }
});

const createModalStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary
  },
  content: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line
  },
  cancelButton: {
    paddingVertical: 8,
    minWidth: 60
  },
  cancelText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500'
  },
  headerContent: {
    flex: 1,
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary
  },
  headerSpacer: {
    minWidth: 60
  },
  scrollContent: {
    flex: 1,
    padding: 20
  }
});

const createWizardStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    minWidth: 60
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.interactive.primary,
    borderRadius: 2
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
    minWidth: 60,
    textAlign: 'right'
  },
  stepsContainer: {
    flex: 1,
    overflow: 'hidden'
  },
  stepsWrapper: {
    flexDirection: 'row',
    height: '100%'
  },
  step: {
    width: '100%',
    padding: 20
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.interactive.primary,
    minWidth: 60
  },
  stepIndicators: {
    flexDirection: 'row',
    marginHorizontal: -4
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background.tertiary,
    marginHorizontal: 4
  },
  stepIndicatorActive: {
    backgroundColor: theme.colors.interactive.primary,
    transform: [{ scale: 1.2 }]
  },
  stepIndicatorCompleted: {
    backgroundColor: theme.colors.interactive.primary,
    opacity: 0.6
  },
  footerSpacer: {
    minWidth: 60
  }
});

const createGoalDetailStyles = () => StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginVertical: 8,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 12
  },
  headerText: {
    flex: 1
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13
  },
  collapseIcon: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600'
  },
  content: {
    padding: 16
  }
});

const createFloatingStyles = () => StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600'
  }
});