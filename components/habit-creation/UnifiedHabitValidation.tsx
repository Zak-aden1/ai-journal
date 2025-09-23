import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { validateHabitInput, suggestHabitImprovements, checkHabitSimilarity, type HabitSimilarity } from '@/utils/habitValidation';
import { HabitTemplate } from './UnifiedHabitTemplates';

export interface HabitValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  improvements?: string[];
  similarity?: HabitSimilarity;
  suggestions?: HabitTemplate[];
  score: number; // 0-100 quality score
}

export interface HabitValidationConfig {
  enableRealTimeValidation: boolean;
  enableImprovementSuggestions: boolean;
  enableSimilarityCheck: boolean;
  enableTemplateSuggestions: boolean;
  minLength: number;
  maxLength: number;
  existingHabits: string[];
}

const DEFAULT_VALIDATION_CONFIG: HabitValidationConfig = {
  enableRealTimeValidation: true,
  enableImprovementSuggestions: true,
  enableSimilarityCheck: true,
  enableTemplateSuggestions: true,
  minLength: 3,
  maxLength: 80,
  existingHabits: []
};

export class UnifiedHabitValidator {
  private config: HabitValidationConfig;

  constructor(config: Partial<HabitValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  validateHabit(habitText: string): HabitValidationResult {
    const trimmed = habitText.trim();

    // Basic validation
    const basicValidation = validateHabitInput(trimmed, this.config.existingHabits);

    // Calculate quality score
    const score = this.calculateQualityScore(trimmed);

    // Get improvement suggestions
    const improvements = this.config.enableImprovementSuggestions
      ? suggestHabitImprovements(trimmed)
      : [];

    // Check similarity if enabled
    const similarity = this.config.enableSimilarityCheck
      ? checkHabitSimilarity(trimmed, this.config.existingHabits)
      : undefined;

    return {
      isValid: basicValidation.isValid,
      error: basicValidation.error,
      warning: basicValidation.warning,
      improvements: improvements.length > 0 ? improvements : undefined,
      similarity: basicValidation.similarity || similarity,
      score,
      suggestions: [] // Template suggestions would be added here
    };
  }

  private calculateQualityScore(habitText: string): number {
    if (!habitText.trim()) return 0;

    let score = 30; // Base score

    // Length scoring (sweet spot: 15-40 characters)
    const length = habitText.length;
    if (length >= 15 && length <= 40) {
      score += 20;
    } else if (length >= 10 && length <= 60) {
      score += 15;
    } else if (length >= 5 && length <= 80) {
      score += 10;
    }

    // Specificity indicators
    const specificityIndicators = [
      /\b\d+\s*(minutes?|hours?|mins?|hrs?)\b/i, // Time duration
      /\b(daily|weekly|every|times?)\b/i, // Frequency
      /\b(for|during|in|at)\b/i, // Context
      /\b(practice|read|write|exercise|meditate|walk)\b/i // Action verbs
    ];

    specificityIndicators.forEach(pattern => {
      if (pattern.test(habitText)) {
        score += 10;
      }
    });

    // Positive indicators
    const positiveIndicators = [
      /\b(morning|evening|before|after)\b/i, // Time context
      /\b(healthy|positive|beneficial)\b/i, // Positive framing
      /\b(goal|target|aim)\b/i // Goal-oriented
    ];

    positiveIndicators.forEach(pattern => {
      if (pattern.test(habitText)) {
        score += 5;
      }
    });

    // Negative indicators
    const negativeIndicators = [
      /\b(stop|quit|don't|avoid|prevent)\b/i, // Negative framing
      /^.{1,4}$/i, // Too short
      /(.)\1{3,}/i, // Repeated characters
      /\b(stuff|things|something)\b/i // Vague terms
    ];

    negativeIndicators.forEach(pattern => {
      if (pattern.test(habitText)) {
        score -= 10;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  updateConfig(newConfig: Partial<HabitValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): HabitValidationConfig {
    return { ...this.config };
  }
}

// Enhanced validation feedback component
interface ValidationFeedbackProps {
  validation: HabitValidationResult;
  habitText: string;
  showScore?: boolean;
  compact?: boolean;
  style?: any;
}

export function ValidationFeedback({
  validation,
  habitText,
  showScore = true,
  compact = false,
  style
}: ValidationFeedbackProps) {
  if (!habitText.trim() || habitText.trim().length < 3) {
    return null;
  }

  const styles = createValidationStyles();

  return (
    <View style={[styles.container, style]}>
      {/* Error State */}
      {validation.error && (
        <View style={[styles.feedbackItem, styles.errorItem]}>
          <Text style={styles.errorText}>
            ⚠️ {validation.error}
          </Text>
        </View>
      )}

      {/* Warning State */}
      {validation.warning && !validation.error && (
        <View style={[styles.feedbackItem, styles.warningItem]}>
          <Text style={styles.warningText}>
            💡 {validation.warning}
          </Text>
        </View>
      )}

      {/* Quality Score */}
      {showScore && validation.isValid && !compact && (
        <View style={[styles.feedbackItem, styles.scoreItem]}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Quality Score</Text>
            <View style={[
              styles.scoreBadge,
              validation.score >= 80 ? styles.scoreExcellent :
              validation.score >= 60 ? styles.scoreGood :
              validation.score >= 40 ? styles.scoreFair :
              styles.scorePoor
            ]}>
              <Text style={styles.scoreText}>{validation.score}%</Text>
            </View>
          </View>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreProgress,
                { width: `${validation.score}%` },
                validation.score >= 80 ? styles.progressExcellent :
                validation.score >= 60 ? styles.progressGood :
                validation.score >= 40 ? styles.progressFair :
                styles.progressPoor
              ]}
            />
          </View>
        </View>
      )}

      {/* Improvement Suggestions */}
      {validation.isValid && validation.improvements && validation.improvements.length > 0 && !compact && (
        <View style={[styles.feedbackItem, styles.improvementItem]}>
          <Text style={styles.improvementHeader}>
            ✨ Suggestions to make it even better:
          </Text>
          {validation.improvements.slice(0, 2).map((suggestion, index) => (
            <View key={index} style={styles.suggestionRow}>
              <Text style={styles.suggestionBullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Success State - Compact */}
      {validation.isValid &&
       validation.score >= 70 &&
       (!validation.improvements || validation.improvements.length === 0) && (
        <View style={[styles.feedbackItem, styles.successItem, compact && styles.successCompact]}>
          <Text style={[styles.successText, compact && styles.successTextCompact]}>
            ✅ {compact ? 'Great habit!' : 'Great habit! Ready to add'}
          </Text>
        </View>
      )}
    </View>
  );
}

// Component for real-time validation as user types
interface LiveValidationProps {
  habitText: string;
  existingHabits: string[];
  config?: Partial<HabitValidationConfig>;
  onValidationChange?: (validation: HabitValidationResult) => void;
  style?: any;
}

export function LiveValidation({
  habitText,
  existingHabits,
  config = {},
  onValidationChange,
  style
}: LiveValidationProps) {
  const validator = React.useMemo(
    () => new UnifiedHabitValidator({ ...config, existingHabits }),
    [existingHabits, config]
  );

  const validation = React.useMemo(() => {
    const result = validator.validateHabit(habitText);
    onValidationChange?.(result);
    return result;
  }, [habitText, validator, onValidationChange]);

  return (
    <ValidationFeedback
      validation={validation}
      habitText={habitText}
      style={style}
    />
  );
}

// Batch validation for multiple habits
export function validateHabitBatch(
  habitTexts: string[],
  config: Partial<HabitValidationConfig> = {}
): HabitValidationResult[] {
  const validator = new UnifiedHabitValidator(config);
  return habitTexts.map(text => validator.validateHabit(text));
}

// Hook for using validation in components
export function useHabitValidation(
  config: Partial<HabitValidationConfig> = {}
): [UnifiedHabitValidator, (text: string) => HabitValidationResult] {
  const validator = React.useMemo(
    () => new UnifiedHabitValidator(config),
    [config]
  );

  const validateHabit = React.useCallback(
    (text: string) => validator.validateHabit(text),
    [validator]
  );

  return [validator, validateHabit];
}

const createValidationStyles = () => StyleSheet.create({
  container: {
    marginVertical: -3
  },
  feedbackItem: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    marginVertical: 3
  },
  errorItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  warningItem: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  improvementItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  successItem: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)'
  },
  successCompact: {
    padding: 6
  },
  scoreItem: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.3)'
  },

  // Text styles
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500'
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '500'
  },
  successText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center'
  },
  successTextCompact: {
    fontSize: 10
  },

  // Score styles
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  scoreLabel: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '600'
  },
  scoreBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  scoreExcellent: {
    backgroundColor: '#22c55e'
  },
  scoreGood: {
    backgroundColor: '#3b82f6'
  },
  scoreFair: {
    backgroundColor: '#f59e0b'
  },
  scorePoor: {
    backgroundColor: '#ef4444'
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  scoreBar: {
    height: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 2
  },
  progressExcellent: {
    backgroundColor: '#22c55e'
  },
  progressGood: {
    backgroundColor: '#3b82f6'
  },
  progressFair: {
    backgroundColor: '#f59e0b'
  },
  progressPoor: {
    backgroundColor: '#ef4444'
  },

  // Improvement suggestions
  improvementHeader: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2
  },
  suggestionBullet: {
    color: '#3b82f6',
    fontSize: 11,
    marginRight: 4
  },
  suggestionText: {
    color: '#3b82f6',
    fontSize: 11,
    flex: 1,
    lineHeight: 14
  }
});