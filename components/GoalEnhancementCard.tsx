import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/Toast';
import {
  GoalCreationService,
  useGoalEnhancement,
  type GoalCreationRequest,
  type GoalCreationResponse
} from '@/services/ai/goalCreation';

interface GoalEnhancementCardProps {
  goalInput: string;
  userId: string;
  avatarType: 'plant' | 'pet' | 'robot' | 'base';
  avatarName: string;
  existingGoals?: { title: string; category: string }[];
  goalCategory?: string;
  onEnhancedGoalSelect?: (goal: string, rating?: number) => void;
  onHabitsSelect?: (habits: string[]) => void;
  onCategorySelect?: (category: string) => void;
}

export function GoalEnhancementCard({
  goalInput,
  userId,
  avatarType,
  avatarName,
  existingGoals,
  goalCategory,
  onEnhancedGoalSelect,
  onHabitsSelect,
  onCategorySelect
}: GoalEnhancementCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { enhanceGoal, isLoading, error, usageRemaining, clearError } = useGoalEnhancement();
  const [enhancement, setEnhancement] = useState<GoalCreationResponse | null>(null);
  const [hasEnhanced, setHasEnhanced] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toasts, showError, showWarning, showInfo } = useToast();

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return unsubscribe;
  }, []);

  const handleEnhance = async () => {
    clearError();

    // Validate input first
    const validation = GoalCreationService.validateGoalInput(goalInput);
    if (!validation.isValid) {
      showError(validation.error || 'Please enter a valid goal');
      return;
    }

    // Check network connectivity
    if (isConnected === false) {
      showError('No internet connection - AI features require internet access');
      return;
    }

    // Check if we have connection status yet
    if (isConnected === null) {
      showWarning('Checking connection...');
      return;
    }

    const request: GoalCreationRequest = {
      userInput: goalInput,
      userId,
      context: {
        avatarType,
        avatarName,
        existingGoals,
        goalCategory
      }
    };

    const result = await enhanceGoal(request);
    if (result) {
      setEnhancement(result);
      setHasEnhanced(true);
      showInfo('🪄 Goal transformed into SMART format!');
    } else if (error) {
      // Error will be set by the hook, show it as toast
      showError(error);
    }
  };

  const handleSelectEnhanced = () => {
    if (enhancement && onEnhancedGoalSelect) {
      // Enhanced goals should get a higher rating since they've been improved by AI
      // If original was <5 stars, the enhanced version should be 4-5 stars
      const enhancedRating = enhancement.originalRating.stars >= 4 ? 5 : 4;
      onEnhancedGoalSelect(enhancement.enhanced, enhancedRating);

      // Clear the enhancement state to prevent confusion after selection
      setEnhancement(null);
      setHasEnhanced(false);
    }
  };

  const handleSelectAlternative = (alternative: string) => {
    if (onEnhancedGoalSelect) {
      onEnhancedGoalSelect(alternative, 5);

      // Clear the enhancement state to prevent confusion after selection
      setEnhancement(null);
      setHasEnhanced(false);
    }
  };

  const handleSelectHabits = () => {
    if (enhancement && onHabitsSelect) {
      onHabitsSelect(enhancement.suggestedHabits);
    }
  };

  const handleSelectCategory = () => {
    if (enhancement && onCategorySelect) {
      onCategorySelect(enhancement.suggestedCategory);
    }
  };

  // Only show the card if goal input has some content
  if (!goalInput || goalInput.trim().length < 3) {
    return null;
  }

  // Check button state
  const validation = GoalCreationService.validateGoalInput(goalInput);
  const isButtonDisabled = isLoading || !validation.isValid || isConnected === false;

  return (
    <View style={styles.container}>
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onHide={() => {}} />
      ))}
      {/* Enhancement Button */}
      {!hasEnhanced && (
        <View>
          <TouchableOpacity
            style={[
              styles.premiumEnhanceButton,
              isButtonDisabled && styles.premiumEnhanceButtonDisabled
            ]}
            onPress={handleEnhance}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradientContainer}
            >
              <View style={[
                styles.buttonGlassEffect,
                isButtonDisabled && styles.buttonGlassEffectDisabled
              ]}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loadingText}>Enhancing...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContentContainer}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.magicIcon}>🪄</Text>
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[
                        styles.premiumButtonText,
                        isButtonDisabled && styles.premiumButtonTextDisabled
                      ]}>
                        Make it SMART
                      </Text>
                      {usageRemaining !== null && (
                        <Text style={styles.premiumUsageText}>{usageRemaining} uses remaining</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Status Messages */}
          {isConnected === false && (
            <View style={styles.premiumStatusContainer}>
              <Text style={styles.premiumStatusIcon}>📶</Text>
              <Text style={styles.premiumStatusText}>Internet connection required for AI enhancement</Text>
            </View>
          )}
          {!validation.isValid && goalInput.trim().length >= 3 && (
            <View style={styles.premiumStatusContainer}>
              <Text style={styles.premiumStatusIcon}>✨</Text>
              <Text style={styles.premiumStatusText}>{validation.error}</Text>
            </View>
          )}
          {isConnected === null && (
            <View style={styles.premiumStatusContainer}>
              <Text style={styles.premiumStatusIcon}>🔄</Text>
              <Text style={styles.premiumStatusText}>Checking connection...</Text>
            </View>
          )}
        </View>
      )}


      {/* Enhancement Results - Compact Design */}
      {enhancement && (
        <View style={styles.resultsContainer}>
          {/* Goal Feedback - Cleaner without duplicate rating */}
          <View style={styles.compactFeedbackContainer}>
            <Text style={styles.compactFeedbackTitle}>Analysis & Feedback</Text>
            <Text style={styles.compactFeedback}>{enhancement.originalRating.feedback}</Text>
          </View>

          {/* Enhanced Goal - Always visible if different */}
          {enhancement.originalRating.stars < 5 && (
            <TouchableOpacity style={styles.compactEnhancedGoal} onPress={handleSelectEnhanced}>
              <Text style={styles.enhancedLabel}>✨ Enhanced:</Text>
              <Text style={styles.compactEnhancedText} numberOfLines={2}>{enhancement.enhanced}</Text>
              <Text style={styles.compactSelectText}>Tap to use</Text>
            </TouchableOpacity>
          )}

          {/* Expand/Collapse Toggle */}
          <TouchableOpacity
            style={styles.premiumExpandButton}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandIcon}>
              {isExpanded ? '🔼' : '🔽'}
            </Text>
            <Text style={styles.premiumExpandButtonText}>
              {isExpanded ? 'Show Less' : 'Show More Options'}
            </Text>
          </TouchableOpacity>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {/* Missing SMART Elements */}
              {enhancement.originalRating.missing.length > 0 && (
                <View style={styles.missingContainer}>
                  <Text style={styles.missingTitle}>Missing SMART elements:</Text>
                  {enhancement.originalRating.missing.map((item, index) => (
                    <Text key={index} style={styles.missingItem}>• {item}</Text>
                  ))}
                </View>
              )}

              {/* Alternatives */}
              {enhancement.improvements.alternatives.length > 0 && (
                <View style={styles.alternativesContainer}>
                  <Text style={styles.alternativesTitle}>💡 Other Options</Text>
                  {GoalCreationService.formatAlternatives(enhancement.improvements.alternatives).map((alt, index) => (
                    <TouchableOpacity key={index} style={styles.alternative} onPress={() => handleSelectAlternative(alt)}>
                      <Text style={styles.alternativeText}>{alt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Suggested Category */}
              {enhancement.suggestedCategory && enhancement.suggestedCategory !== goalCategory && (
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>🎯 Suggested Category</Text>
                  <TouchableOpacity style={styles.categoryButton} onPress={handleSelectCategory}>
                    <Text style={styles.categoryText}>{enhancement.suggestedCategory}</Text>
                    <Text style={styles.selectText}>Tap to apply</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Suggested Habits */}
              {enhancement.suggestedHabits.length > 0 && (
                <View style={styles.habitsContainer}>
                  <Text style={styles.habitsTitle}>🔄 Supporting Habits</Text>
                  <TouchableOpacity style={styles.habitsButton} onPress={handleSelectHabits}>
                    {GoalCreationService.formatSuggestedHabits(enhancement.suggestedHabits).map((habit, index) => (
                      <Text key={index} style={styles.habitText}>• {habit}</Text>
                    ))}
                    <Text style={styles.selectText}>Tap to add these habits</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Context Warnings */}
              {enhancement.contextWarnings && enhancement.contextWarnings.length > 0 && (
                <View style={styles.warningsContainer}>
                  <Text style={styles.warningsTitle}>⚠️ Note</Text>
                  {enhancement.contextWarnings.map((warning, index) => (
                    <Text key={index} style={styles.warningText}>{warning}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Usage Remaining - Compact */}
          <Text style={styles.compactUsageRemaining}>
            {enhancement.usageRemaining} uses left today
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  enhanceButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  enhanceButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#6b7280',
  },
  enhanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  usageText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  // Premium button styles
  premiumEnhanceButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  premiumEnhanceButtonDisabled: {
    opacity: 0.6,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonGradientContainer: {
    borderRadius: 16,
    padding: 2,
  },
  buttonGlassEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonGlassEffectDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 12,
    transform: [{ scale: 1.2 }],
  },
  magicIcon: {
    fontSize: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textContainer: {
    alignItems: 'center',
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  premiumButtonTextDisabled: {
    opacity: 0.7,
  },
  premiumUsageText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 12,
  },
  compactRatingContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    fontSize: 18,
  },
  starCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  feedback: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  missingContainer: {
    marginTop: 8,
  },
  missingTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  missingItem: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.8,
    marginLeft: 8,
  },
  enhancedContainer: {
    marginBottom: 12,
  },
  enhancedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  enhancedGoal: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  enhancedGoalText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  selectText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  alternativesContainer: {
    marginBottom: 12,
  },
  alternativesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  alternative: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  alternativeText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  habitsContainer: {
    marginBottom: 12,
  },
  habitsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  habitsButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  habitText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
  },
  warningsContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningsTitle: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 13,
    lineHeight: 18,
  },
  usageContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  usageRemaining: {
    color: '#FFFFFF',
    opacity: 0.6,
    fontSize: 12,
  },
  enhanceButtonTextDisabled: {
    opacity: 0.7,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  premiumStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  premiumStatusIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  premiumStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    letterSpacing: 0.2,
    flex: 1,
    textAlign: 'center',
  },
  // Compact design styles
  compactRatingTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  compactFeedbackContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  compactFeedbackTitle: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  compactFeedback: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  compactEnhancedGoal: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  compactEnhancedText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: '600',
  },
  compactSelectText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
  expandButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  expandButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  premiumExpandButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  expandIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  premiumExpandButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  expandedContent: {
    marginTop: 4,
  },
  compactUsageRemaining: {
    color: '#FFFFFF',
    opacity: 0.6,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});