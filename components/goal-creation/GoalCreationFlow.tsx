import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppStore } from '@/stores/app';
import { VoiceRecorder } from '@/components/VoiceRecorder';

export type GoalCategory = 'health' | 'learning' | 'career' | 'personal' | 'finance' | 'relationships';

export interface GoalData {
  title: string;
  category: GoalCategory | null;
  targetDate?: string;
  details?: string;
  voiceNoteUri?: string;
  selectedHabits: string[];
}

interface GoalCreationFlowProps {
  // Styling context
  context: 'onboarding' | 'modal';
  styles: any; // Will be passed from parent for context-specific styling
  
  // Data handling
  initialData?: Partial<GoalData>;
  onDataChange?: (data: GoalData) => void;
  onComplete?: (goalId: string) => void;
  
  // Navigation (for onboarding context)
  canProceed?: boolean;
  singleStepMode?: boolean; // Lock to step 1 only
  
  // Voice recording callback
  onVoiceRecorded?: (path: string) => void;
}

export const GOAL_CATEGORIES: { 
  id: GoalCategory; 
  title: string; 
  emoji: string; 
  description: string 
}[] = [
  { id: 'health', title: 'Health & Fitness', emoji: '💪', description: 'Physical and mental wellness' },
  { id: 'learning', title: 'Learning & Skills', emoji: '🎓', description: 'Knowledge and skill development' },
  { id: 'career', title: 'Career & Work', emoji: '💼', description: 'Professional growth and success' },
  { id: 'personal', title: 'Personal Growth', emoji: '🌱', description: 'Self-improvement and habits' },
  { id: 'finance', title: 'Financial', emoji: '💰', description: 'Money management and wealth building' },
  { id: 'relationships', title: 'Relationships', emoji: '❤️', description: 'Family, friends, and connections' },
];

export const SUGGESTED_HABITS: Record<GoalCategory, string[]> = {
  health: ['Morning workout', 'Drink 8 glasses of water', 'Get 8 hours of sleep', 'Take daily vitamins', 'Meditate for 10 minutes'],
  learning: ['Read for 30 minutes', 'Practice new skill daily', 'Watch educational videos', 'Take online course', 'Write in learning journal'],
  career: ['Network with one person', 'Update LinkedIn profile', 'Learn new work skill', 'Set daily priorities', 'Review goals weekly'],
  personal: ['Morning routine', 'Evening reflection', 'Gratitude practice', 'Digital detox hour', 'Weekly planning session'],
  finance: ['Track daily expenses', 'Review budget weekly', 'Save automatically', 'Read financial content', 'Plan investments'],
  relationships: ['Call family member', 'Plan quality time', 'Practice active listening', 'Express gratitude', 'Schedule regular check-ins'],
};

export function GoalCreationFlow({ 
  context, 
  styles, 
  initialData = {}, 
  onDataChange,
  onComplete,
  canProceed = true,
  singleStepMode = false,
  onVoiceRecorded
}: GoalCreationFlowProps) {
  const { addGoal, addHabit } = useAppStore();
  const [step, setStep] = useState(1);
  const [goalData, setGoalData] = useState<GoalData>({
    title: initialData.title || '',
    category: initialData.category || null,
    targetDate: initialData.targetDate || '',
    details: initialData.details || '',
    voiceNoteUri: initialData.voiceNoteUri || undefined,
    selectedHabits: initialData.selectedHabits || [],
  });
  const [customHabit, setCustomHabit] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const updateGoalData = (updates: Partial<GoalData>) => {
    const newData = { ...goalData, ...updates };
    setGoalData(newData);
    onDataChange?.(newData);
  };

  const toggleHabit = (habit: string) => {
    const newHabits = goalData.selectedHabits.includes(habit)
      ? goalData.selectedHabits.filter(h => h !== habit)
      : [...goalData.selectedHabits, habit];
    updateGoalData({ selectedHabits: newHabits });
  };

  const addCustomHabit = () => {
    const habit = customHabit.trim();
    if (habit && !goalData.selectedHabits.includes(habit)) {
      updateGoalData({ selectedHabits: [...goalData.selectedHabits, habit] });
      setCustomHabit('');
    }
  };

  const handleComplete = async () => {
    if (!goalData.title.trim()) return;

    if (context === 'onboarding') {
      // For onboarding, just collect the data and advance to next step
      // Don't create the goal yet - that happens later in onboarding
      onComplete?.('onboarding-continue');
      return;
    }

    // For modal context, create the goal immediately
    setIsCreating(true);
    try {
      const goalId = await addGoal(goalData.title.trim());
      
      // Add selected habits
      for (const habit of goalData.selectedHabits) {
        await addHabit(goalId, habit);
      }

      Alert.alert(
        'Goal Created!',
        `"${goalData.title}" has been created with ${goalData.selectedHabits.length} habits.`
      );

      onComplete?.(goalId);
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
      console.error('Goal creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const canProceedToStep2 = goalData.title.trim().length >= 3;
  const canCompleteGoal = goalData.title.trim().length >= 3;
  const suggestedHabits = goalData.category ? SUGGESTED_HABITS[goalData.category] : [];

  if (step === 1) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>What&apos;s your goal?</Text>
          <Text style={styles.subtitle}>
            Be specific about what you want to achieve
          </Text>
        </View>

        <View style={styles.form}>
          {/* Goal Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Goal Title *</Text>
            <TextInput
              style={[
                styles.input,
                goalData.title.length > 0 && styles.inputValid
              ]}
              placeholder="e.g., Run a 5K marathon"
              placeholderTextColor={styles.placeholderTextColor}
              value={goalData.title}
              onChangeText={(title) => updateGoalData({ title })}
              maxLength={100}
              autoFocus={context === 'modal'}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Choose a category</Text>
            <View style={styles.categoriesGrid}>
              {GOAL_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    goalData.category === category.id && styles.categoryCardSelected
                  ]}
                  onPress={() => updateGoalData({ category: category.id })}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Date (onboarding context only) */}
          {context === 'onboarding' && (
            <View style={styles.field}>
              <Text style={styles.label}>When do you want to achieve this?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., December 2024"
                placeholderTextColor={styles.placeholderTextColor}
                value={goalData.targetDate}
                onChangeText={(targetDate) => updateGoalData({ targetDate })}
              />
            </View>
          )}

          {/* Additional Details (onboarding context only) */}
          {context === 'onboarding' && (
            <View style={styles.field}>
              <Text style={styles.label}>Additional Details (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific details about your goal..."
                placeholderTextColor={styles.placeholderTextColor}
                value={goalData.details}
                onChangeText={(details) => updateGoalData({ details })}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {/* Voice Recording (onboarding context only) */}
          {context === 'onboarding' && (
            <View style={styles.field}>
              <Text style={styles.label}>Voice Note (Optional)</Text>
              <Text style={styles.hint}>
                Record a quick note about this goal
              </Text>
              <VoiceRecorder
                onSaved={(path: string) => {
                  updateGoalData({ voiceNoteUri: path });
                  onVoiceRecorded?.(path);
                }}
              />
            </View>
          )}
        </View>

        {/* Navigation */}
        {!singleStepMode && (
          <View style={styles.modalNavigation}>
            <TouchableOpacity 
              onPress={() => setStep(2)}
              style={[styles.nextButton, !canProceedToStep2 && styles.nextButtonDisabled]}
              disabled={!canProceedToStep2}
            >
              <Text style={[styles.nextButtonText, !canProceedToStep2 && styles.nextButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Single Step Mode - Direct Complete */}
        {singleStepMode && (
          <View style={styles.modalNavigation}>
            <TouchableOpacity 
              onPress={handleComplete}
              style={[styles.nextButton, !canProceedToStep2 && styles.nextButtonDisabled]}
              disabled={!canProceedToStep2}
            >
              <Text style={[styles.nextButtonText, !canProceedToStep2 && styles.nextButtonTextDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // Step 2: Habits (for modal context or when proceeding in onboarding)
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Add some habits</Text>
        <Text style={styles.subtitle}>
          Choose habits that will help you achieve &quot;{goalData.title}&quot;
        </Text>
      </View>

      <View style={styles.form}>
        {/* Suggested Habits */}
        {suggestedHabits.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Suggested habits</Text>
            <View style={styles.habitsContainer}>
              {suggestedHabits.map((habit) => (
                <TouchableOpacity
                  key={habit}
                  style={[
                    styles.habitChip,
                    goalData.selectedHabits.includes(habit) && styles.habitChipSelected
                  ]}
                  onPress={() => toggleHabit(habit)}
                >
                  <Text style={[
                    styles.habitChipText,
                    goalData.selectedHabits.includes(habit) && styles.habitChipTextSelected
                  ]}>
                    {habit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Custom Habit Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Add your own habit</Text>
          <View style={styles.customHabitContainer}>
            <TextInput
              style={[styles.input, styles.customHabitInput]}
              placeholder="e.g., Practice piano for 20 minutes"
              placeholderTextColor={styles.placeholderTextColor}
              value={customHabit}
              onChangeText={setCustomHabit}
              maxLength={80}
              onSubmitEditing={addCustomHabit}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addCustomHabit}
              disabled={!customHabit.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Habits */}
        {goalData.selectedHabits.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Selected habits ({goalData.selectedHabits.length})</Text>
            <View style={styles.selectedHabitsContainer}>
              {goalData.selectedHabits.map((habit) => (
                <View key={habit} style={styles.selectedHabit}>
                  <Text style={styles.selectedHabitText}>{habit}</Text>
                  <TouchableOpacity 
                    onPress={() => toggleHabit(habit)}
                    style={styles.removeHabitButton}
                  >
                    <Text style={styles.removeHabitButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.modalNavigation}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleComplete}
          style={[styles.nextButton, (!canCompleteGoal || isCreating) && styles.nextButtonDisabled]}
          disabled={!canCompleteGoal || isCreating}
        >
          <Text style={[styles.nextButtonText, (!canCompleteGoal || isCreating) && styles.nextButtonTextDisabled]}>
            {isCreating ? 'Creating...' : (context === 'modal' ? 'Create' : 'Continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}