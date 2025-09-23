import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppStore } from '@/stores/app';
import { HabitSchedule } from '@/lib/db';
import {
  HabitTemplate,
  HabitTemplateManager,
  HabitTemplateChips,
  HabitCategory,
  HABIT_CATEGORIES
} from './UnifiedHabitTemplates';
import {
  UnifiedHabitValidator,
  ValidationFeedback,
  HabitValidationResult,
  useHabitValidation
} from './UnifiedHabitValidation';
import { ProgressiveSchedulePicker } from './ProgressiveSchedulePicker';

export type HabitCreationContext = 'onboarding' | 'homepage' | 'goal-detail' | 'standalone';
export type HabitCreationMode = 'inline' | 'modal' | 'wizard';

export interface HabitCreationFeatures {
  aiSuggestions: boolean;
  goalLinking: boolean;
  categorySelection: boolean;
  advancedScheduling: boolean;
  progressiveDisclosure: boolean;
  templateChips: boolean;
  realTimeValidation: boolean;
  inspirationSection: boolean;
}

export interface HabitCreationConfig {
  context: HabitCreationContext;
  mode: HabitCreationMode;
  features: Partial<HabitCreationFeatures>;
  goalCategory?: HabitCategory;
  goalId?: string;
  existingHabits?: string[];
  onComplete?: (habitData: HabitData) => void;
  onCancel?: () => void;
}

export interface HabitData {
  title: string;
  description?: string;
  category?: HabitCategory;
  schedule: HabitSchedule;
  goalId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  duration?: number; // minutes
  tags?: string[];
  template?: HabitTemplate;
}

// Default feature sets by context
const CONTEXT_DEFAULTS: Record<HabitCreationContext, HabitCreationFeatures> = {
  onboarding: {
    aiSuggestions: true,
    goalLinking: false,
    categorySelection: false,
    advancedScheduling: false,
    progressiveDisclosure: true,
    templateChips: true,
    realTimeValidation: true,
    inspirationSection: true
  },
  homepage: {
    aiSuggestions: true,
    goalLinking: true,
    categorySelection: true,
    advancedScheduling: true,
    progressiveDisclosure: true,
    templateChips: true,
    realTimeValidation: true,
    inspirationSection: false
  },
  'goal-detail': {
    aiSuggestions: true,
    goalLinking: false, // Auto-linked to goal
    categorySelection: false, // Inferred from goal
    advancedScheduling: true,
    progressiveDisclosure: true,
    templateChips: true,
    realTimeValidation: true,
    inspirationSection: true
  },
  standalone: {
    aiSuggestions: false,
    goalLinking: false,
    categorySelection: true,
    advancedScheduling: true,
    progressiveDisclosure: false,
    templateChips: true,
    realTimeValidation: true,
    inspirationSection: false
  }
};

export class UnifiedHabitCreationLogic {
  private config: HabitCreationConfig;
  private features: HabitCreationFeatures;

  constructor(config: HabitCreationConfig) {
    this.config = config;
    this.features = {
      ...CONTEXT_DEFAULTS[config.context],
      ...config.features
    };
  }

  getFeatures(): HabitCreationFeatures {
    return { ...this.features };
  }

  updateFeatures(newFeatures: Partial<HabitCreationFeatures>): void {
    this.features = { ...this.features, ...newFeatures };
  }

  getSmartTemplates(limit: number = 4): HabitTemplate[] {
    return HabitTemplateManager.getSmartSuggestions(
      this.config.goalCategory,
      undefined, // difficulty will be determined later
      limit
    );
  }

  getSuggestedSchedule(template?: HabitTemplate): HabitSchedule {
    if (template?.suggestedSchedule) {
      return template.suggestedSchedule;
    }

    // Default schedule based on context and category
    const defaultSchedules: Record<HabitCategory, HabitSchedule> = {
      health: {
        isDaily: true,
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        timeType: 'morning',
        specificTime: undefined,
        reminder: false
      },
      learning: {
        isDaily: true,
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        timeType: 'evening',
        specificTime: undefined,
        reminder: false
      },
      career: {
        isDaily: false,
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
        timeType: 'morning',
        specificTime: undefined,
        reminder: false
      },
      personal: {
        isDaily: true,
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        timeType: 'evening',
        specificTime: undefined,
        reminder: false
      },
      finance: {
        isDaily: false,
        daysOfWeek: ['mon', 'wed', 'fri'],
        timeType: 'afternoon',
        specificTime: undefined,
        reminder: false
      },
      relationships: {
        isDaily: false,
        daysOfWeek: ['sat', 'sun'],
        timeType: 'afternoon',
        specificTime: undefined,
        reminder: false
      },
      creative: {
        isDaily: false,
        daysOfWeek: ['mon', 'wed', 'fri'],
        timeType: 'evening',
        specificTime: undefined,
        reminder: false
      }
    };

    return this.config.goalCategory
      ? defaultSchedules[this.config.goalCategory]
      : defaultSchedules.personal;
  }

  shouldShowProgressiveSchedule(habitText: string, validation: HabitValidationResult): boolean {
    return this.features.progressiveDisclosure &&
           this.features.advancedScheduling &&
           habitText.trim().length >= 3 &&
           validation.isValid;
  }

  shouldShowTemplateChips(): boolean {
    return this.features.templateChips;
  }

  shouldShowInspiration(): boolean {
    return this.features.inspirationSection;
  }

  validateHabitForContext(habitText: string, existingHabits: string[]): HabitValidationResult {
    const validator = new UnifiedHabitValidator({
      enableRealTimeValidation: this.features.realTimeValidation,
      enableImprovementSuggestions: this.features.realTimeValidation,
      enableSimilarityCheck: true,
      enableTemplateSuggestions: this.features.templateChips,
      existingHabits
    });

    return validator.validateHabit(habitText);
  }
}

// Main React component
interface UnifiedHabitCreationProps extends HabitCreationConfig {
  style?: any;
}

export function UnifiedHabitCreation({
  context,
  mode,
  features = {},
  goalCategory,
  goalId,
  existingHabits = [],
  onComplete,
  onCancel,
  style
}: UnifiedHabitCreationProps) {
  const { addHabit } = useAppStore();

  // Initialize logic controller
  const logic = useMemo(() => new UnifiedHabitCreationLogic({
    context,
    mode,
    features,
    goalCategory,
    goalId,
    existingHabits,
    onComplete,
    onCancel
  }), [context, mode, features, goalCategory, goalId, existingHabits, onComplete, onCancel]);

  const enabledFeatures = logic.getFeatures();

  // State management
  const [habitData, setHabitData] = useState<HabitData>({
    title: '',
    description: '',
    category: goalCategory,
    schedule: logic.getSuggestedSchedule(),
    goalId,
    difficulty: 'medium',
    duration: 15,
    tags: []
  });

  const [showInspiration, setShowInspiration] = useState(false);
  const [showProgressiveSchedule, setShowProgressiveSchedule] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Validation
  const [validator, validateHabit] = useHabitValidation({
    existingHabits,
    enableRealTimeValidation: enabledFeatures.realTimeValidation
  });

  const validation = useMemo(() =>
    validateHabit(habitData.title),
    [habitData.title, validateHabit]
  );

  // Smart templates
  const smartTemplates = useMemo(() =>
    logic.getSmartTemplates(4),
    [logic]
  );

  // Event handlers
  const updateHabitData = useCallback((updates: Partial<HabitData>) => {
    setHabitData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleTextChange = useCallback((text: string) => {
    updateHabitData({ title: text });

    // Show progressive schedule picker if enabled
    if (logic.shouldShowProgressiveSchedule(text, validation)) {
      setShowProgressiveSchedule(true);
    } else {
      setShowProgressiveSchedule(false);
    }
  }, [logic, validation, updateHabitData]);

  const handleTemplateToggle = useCallback((template: HabitTemplate) => {
    const isSelected = selectedTemplates.includes(template.id);

    if (isSelected) {
      setSelectedTemplates(prev => prev.filter(id => id !== template.id));
    } else {
      setSelectedTemplates(prev => [...prev, template.id]);

      // Auto-fill habit data from template
      updateHabitData({
        title: template.title,
        description: template.description,
        category: template.category,
        schedule: template.suggestedSchedule,
        difficulty: template.difficulty,
        duration: template.duration,
        tags: template.tags,
        template
      });
    }
  }, [selectedTemplates, updateHabitData]);

  const handleScheduleChange = useCallback((schedule: HabitSchedule) => {
    updateHabitData({ schedule });
  }, [updateHabitData]);

  const handleCreate = useCallback(async () => {
    if (!validation.isValid || !habitData.title.trim()) {
      Alert.alert('Invalid Habit', validation.error || 'Please enter a valid habit title');
      return;
    }

    setIsCreating(true);
    try {
      await addHabit(
        habitData.goalId || null,
        habitData.title.trim(),
        habitData.schedule,
        {
          description: habitData.description,
          category: habitData.category,
          difficulty: habitData.difficulty,
          duration: habitData.duration,
          tags: habitData.tags
        }
      );

      onComplete?.(habitData);
    } catch (error) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [validation, habitData, addHabit, onComplete]);

  const styles = createUnifiedStyles();

  return (
    <View style={[styles.container, style]}>
      {/* Template Chips Section */}
      {enabledFeatures.templateChips && smartTemplates.length > 0 && (
        <View style={styles.templateSection}>
          <Text style={styles.templateTitle}>
            🚀 Quick start with popular {goalCategory || 'habit'} habits:
          </Text>
          {smartTemplates && smartTemplates.length > 0 ? (
            <HabitTemplateChips
              templates={smartTemplates}
              selectedTemplates={selectedTemplates || []}
              onToggleTemplate={handleTemplateToggle}
              style={styles.templateChips}
            />
          ) : (
            <Text style={styles.templateError}>No templates available</Text>
          )}
          <Text style={styles.templateSubtitle}>
            Tap to add instantly with smart defaults, or create your own below
          </Text>
        </View>
      )}

      {/* Custom Habit Input */}
      <View style={styles.inputSection}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>
            {selectedTemplates.length > 0 ? 'Customize your habit' : 'Add your own habit'}
          </Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={habitData.title}
            onChangeText={handleTextChange}
            placeholder="e.g., Practice piano for 20 minutes"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={[
              styles.textInput,
              validation.error ? styles.textInputError :
              validation.warning ? styles.textInputWarning : undefined
            ]}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            maxLength={80}
          />

          <TouchableOpacity
            style={[
              styles.addButton,
              !validation.isValid || habitData.title.trim().length < 3 ?
                styles.addButtonDisabled : undefined
            ]}
            onPress={handleCreate}
            disabled={!validation.isValid || habitData.title.trim().length < 3 || isCreating}
          >
            <Text style={styles.addButtonText}>
              {isCreating ? '...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Validation Feedback */}
        {enabledFeatures.realTimeValidation && (
          <ValidationFeedback
            validation={validation}
            habitText={habitData.title}
            showScore={false}
            compact={mode === 'inline'}
            style={styles.validation}
          />
        )}
      </View>

      {/* Inspiration Section */}
      {enabledFeatures.inspirationSection && (
        <TouchableOpacity
          style={styles.inspirationToggle}
          onPress={() => setShowInspiration(!showInspiration)}
        >
          <Text style={styles.inspirationText}>
            {showInspiration ? '✨ Hide inspiration' : '💡 Need inspiration? View habit templates'}
          </Text>
        </TouchableOpacity>
      )}

      {showInspiration && (
        <View style={styles.inspirationSection}>
          <Text style={styles.inspirationTitle}>
            Popular {goalCategory || 'habit'} habits:
          </Text>
          {(() => {
            try {
              const inspirationTemplates = HabitTemplateManager.getByCategory(goalCategory || 'personal', 6);
              return inspirationTemplates && inspirationTemplates.length > 0 ? (
                <HabitTemplateChips
                  templates={inspirationTemplates}
                  selectedTemplates={selectedTemplates || []}
                  onToggleTemplate={handleTemplateToggle}
                  style={styles.inspirationChips}
                />
              ) : (
                <Text style={styles.templateError}>No inspiration templates available</Text>
              );
            } catch (error) {
              console.warn('Error loading inspiration templates:', error);
              return <Text style={styles.templateError}>Unable to load templates</Text>;
            }
          })()}
          <Text style={styles.inspirationSubtitle}>
            Tap any template to use it, then customize as needed
          </Text>
        </View>
      )}

      {/* Progressive Schedule Picker */}
      {showProgressiveSchedule && enabledFeatures.progressiveDisclosure && (
        <ProgressiveSchedulePicker
          habitName={habitData.title.trim()}
          currentSchedule={habitData.schedule}
          category={habitData.category}
          mode={enabledFeatures.advancedScheduling ? 'advanced' : 'simple'}
          compact={mode === 'inline'}
          onScheduleChange={handleScheduleChange}
          style={styles.schedulePicker}
        />
      )}
    </View>
  );
}

// Export hook for using the unified logic
export function useUnifiedHabitCreation(config: HabitCreationConfig) {
  return useMemo(() => new UnifiedHabitCreationLogic(config), [config]);
}

const createUnifiedStyles = () => StyleSheet.create({
  container: {
    marginVertical: -8
  },

  // Template section
  templateSection: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginVertical: 8
  },
  templateTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  templateChips: {
    marginBottom: 6
  },
  templateSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontStyle: 'italic'
  },

  // Input section
  inputSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  textInputError: {
    borderColor: '#ef4444',
    borderWidth: 2
  },
  textInputWarning: {
    borderColor: '#f59e0b',
    borderWidth: 1
  },
  addButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    opacity: 0.6
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  validation: {
    marginTop: 8
  },

  // Inspiration section
  inspirationToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center'
  },
  inspirationText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500'
  },
  inspirationSection: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8
  },
  inspirationTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  inspirationChips: {
    marginBottom: 6
  },
  inspirationSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontStyle: 'italic'
  },

  // Error states
  templateError: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12
  },

  // Input section
  inputSection: {
    marginVertical: 8
  },

  // Schedule picker
  schedulePicker: {
    marginTop: 8
  }
});