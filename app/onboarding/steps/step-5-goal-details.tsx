import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { GoalEnhancementCard } from '@/components/GoalEnhancementCard';
import { GoalCreationService, type GoalCreationRequest } from '@/services/ai/goalCreation';
import { getFallbackGoalRating } from '@/utils/goalClarity';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

// Goal rating stars component with loading and offline states
const GoalRatingStars = React.memo(({
  rating,
  isLoading,
  isConnected
}: {
  rating: number;
  isLoading: boolean;
  isConnected: boolean | null;
}) => {
  const scaleAnim = useSharedValue(1);
  const previousRating = useRef(0);

  const getStarColor = useCallback((stars: number) => {
    if (stars === 0) return 'rgba(255,255,255,0.4)'; // gray for no rating
    if (stars <= 2) return '#ef4444'; // red
    if (stars <= 3) return '#f59e0b'; // yellow
    return '#22c55e'; // green
  }, []);

  const getStarDisplay = useCallback((stars: number) => {
    if (stars === 0) return '☆☆☆☆☆';
    const fullStars = '⭐'.repeat(Math.max(0, Math.min(5, stars)));
    const emptyStars = '☆'.repeat(Math.max(0, 5 - stars));
    return fullStars + emptyStars;
  }, []);

  const getAccessibilityFeedback = useCallback((stars: number) => {
    if (stars >= 5) return 'Perfect SMART goal!';
    if (stars >= 4) return 'Excellent goal with clear structure.';
    if (stars >= 3) return 'Good foundation, could be enhanced.';
    if (stars >= 2) return 'Needs improvement to be actionable.';
    return 'Consider adding more specificity.';
  }, []);

  // Bounce animation when rating changes
  useEffect(() => {
    if (rating > 0 && rating !== previousRating.current) {
      scaleAnim.value = withSequence(
        withSpring(1.2, { damping: 15, stiffness: 200 }),
        withSpring(1.0, { damping: 15, stiffness: 200 })
      );
      previousRating.current = rating;
    }
  }, [rating, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  // Show loading state
  if (isLoading) {
    return (
      <View
        style={styles.starsContainer}
        accessible={true}
        accessibilityLabel="Analyzing goal quality"
        accessibilityRole="text"
      >
        <Text style={[styles.stars, { color: 'rgba(255,255,255,0.6)' }]}>
          ⏳
        </Text>
        <Text style={styles.starCount}>Analyzing</Text>
      </View>
    );
  }

  // Show offline state
  if (isConnected === false) {
    return (
      <View
        style={styles.starsContainer}
        accessible={true}
        accessibilityLabel="Using offline goal analysis"
        accessibilityRole="text"
      >
        <Text style={[styles.stars, { color: 'rgba(255,255,255,0.4)' }]}>
          📶
        </Text>
        <Text style={styles.starCount}>Offline</Text>
      </View>
    );
  }

  // Show rating with animation and accessibility
  console.log('🌟 Star Component - Rating value:', rating, 'Type:', typeof rating);

  const accessibilityLabel = rating > 0
    ? `Goal quality rating: ${rating} out of 5 stars. ${getAccessibilityFeedback(rating)}`
    : 'Goal not yet rated';

  return (
    <Animated.View
      style={[styles.starsContainer, animatedStyle]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <Text
        style={[styles.stars, { color: getStarColor(rating) }]}
        importantForAccessibility="no"
      >
        {getStarDisplay(rating)}
      </Text>
      <Text
        style={styles.starCount}
        importantForAccessibility="no"
      >
        {rating > 0 ? `${rating}/5` : 'Not rated'}
      </Text>
    </Animated.View>
  );
});

const getGoalExamples = (category: string) => {
  const examples = {
    health: [
      'Lose 20 pounds by December 2025',
      'Run a 5K race in under 30 minutes by summer',
      'Reduce cholesterol to under 200 by next doctor visit'
    ],
    learning: [
      'Complete AWS certification by March 2025',
      'Read 24 books by end of 2025',
      'Achieve conversational Spanish fluency by December'
    ],
    career: [
      'Get promoted to Senior Developer by end of Q2',
      'Earn $10K additional income by December 2025',
      'Launch side business with $5K monthly revenue by year-end'
    ],
    personal: [
      'Save $15,000 for house down payment by October 2025',
      'Visit 5 new countries by end of 2026',
      'Complete a marathon in under 4 hours by spring 2026'
    ]
  };
  
  return examples[category as keyof typeof examples] || examples.personal;
};

export default function GoalDetailsStep() {
  const { data, setGoalDetails } = useOnboardingStore();
  const [goalTitle, setGoalTitle] = useState(data.goalTitle);
  const [goalDetails, setGoalDetailsLocal] = useState(data.goalDetails);
  const [targetDate, setTargetDate] = useState(data.targetDate);

  // Sync local state with store when store values change (e.g., when navigating back)
  useEffect(() => {
    setGoalTitle(data.goalTitle);
    setGoalDetailsLocal(data.goalDetails);
    setTargetDate(data.targetDate);
  }, [data.goalTitle, data.goalDetails, data.targetDate]);

  const avatarType = data.selectedAvatarType || 'base';
  const goalCategory = data.goalCategory || 'personal';
  const avatarName = data.avatarName || 'Companion';

  // AI-based rating system with better state management
  const [goalRating, setGoalRating] = useState(0);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isRatingGoal, setIsRatingGoal] = useState(false);
  const ratingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestTextRef = useRef<string>('');
  const isEnhancedSelectionRef = useRef<boolean>(false);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return unsubscribe;
  }, []);

  // Memoized request context to prevent unnecessary re-renders
  const requestContext = useMemo(() => ({
    avatarType: avatarType as any,
    avatarName,
    goalCategory
  }), [avatarType, avatarName, goalCategory]);

  // Memoized goal examples to prevent recreation
  const goalExamples = useMemo(() => getGoalExamples(goalCategory), [goalCategory]);

  // These functions are now contained within the GoalRatingStars component
  // No need to memoize them here since they're local to that component

  // Memoized validation text
  const validationText = useMemo(() => {
    if (isConnected !== false && goalTitle.length >= 3 && !isRatingGoal && goalRating > 0) {
      return goalRating >= 4 ? '🤖 AI says: Excellent SMART goal!' :
             goalRating >= 3 ? '🤖 AI says: Good foundation' :
             goalRating >= 2 ? '🤖 AI says: Add metrics & timeline' :
             '🤖 AI says: Make it more specific';
    }
    return null;
  }, [isConnected, goalTitle.length, isRatingGoal, goalRating]);

  // Improved AI rating function with request cancellation and fallback
  const getRatingFromAI = useCallback(async (text: string) => {
    // Skip if same text or invalid
    if (!text || text.length < 3 || text === lastRequestTextRef.current) {
      if (!text || text.length < 3) {
        setGoalRating(0);
      }
      return;
    }

    // Use fallback scoring when offline
    if (isConnected === false) {
      const fallback = getFallbackGoalRating(text, goalCategory);
      setGoalRating(fallback.stars);
      return;
    }

    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    lastRequestTextRef.current = text;
    setIsRatingGoal(true);

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const request: GoalCreationRequest = {
        userInput: text,
        userId: Constants.sessionId || 'anonymous',
        context: requestContext
      };

      const result = await GoalCreationService.enhanceGoal(request);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      console.log('🎯 Goal Rating Debug - Raw result:', result);

      if ('error' in result) {
        console.log('❌ AI rating error:', result.error);
        // Don't reset rating on API errors, keep previous value
      } else {
        // Use AI rating
        console.log('⭐ Setting rating from AI:', result.originalRating?.stars);
        console.log('📊 Full originalRating object:', result.originalRating);
        setGoalRating(result.originalRating.stars);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.log('Rating error:', error);
        // Don't reset rating on network errors
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsRatingGoal(false);
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [isConnected, requestContext]);

  // Initialize rating for existing goal
  useEffect(() => {
    if (data.goalTitle && data.goalTitle.length >= 3) {
      getRatingFromAI(data.goalTitle);
    }
  }, [data.goalTitle, getRatingFromAI]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ratingTimeoutRef.current) {
        clearTimeout(ratingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const handleSave = () => {
    setGoalDetails(goalTitle, goalDetails, targetDate);
  };

  // Track if there are unsaved changes
  const hasUnsavedChanges =
    goalTitle !== data.goalTitle ||
    goalDetails !== data.goalDetails ||
    targetDate !== data.targetDate;

  const handleGoalChange = useCallback((text: string) => {
    setGoalTitle(text);
    setGoalDetails(text, goalDetails, targetDate);

    // Skip AI analysis if this change came from enhanced goal selection
    if (isEnhancedSelectionRef.current) {
      isEnhancedSelectionRef.current = false;
      return;
    }

    // Clear existing timeout
    if (ratingTimeoutRef.current) {
      clearTimeout(ratingTimeoutRef.current);
    }

    // Debounce AI rating calls (wait 800ms after user stops typing)
    ratingTimeoutRef.current = setTimeout(() => {
      getRatingFromAI(text);
    }, 800);
  }, [goalDetails, targetDate, getRatingFromAI, setGoalDetails]);
  
  return (
    <OnboardingContainer
      step={2}
      gradient={['#f093fb', '#f5576c']}
      compact={true}
      hasUnsavedChanges={hasUnsavedChanges}
      onSaveBeforeBack={handleSave}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Simplified Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Define Your Goal</Text>
          <Text style={styles.subtitle}>
            What do you want to achieve?
          </Text>
        </View>

        {/* Enhanced Goal Input Section */}
        <View style={styles.goalSection}>
          <View style={styles.goalInputContainer}>
            <View style={styles.inputHeader}>
              <View style={styles.labelWithHelp}>
                <Text style={styles.goalLabel}>Your Goal *</Text>
                <HelpTooltip
                  title="What makes a great goal?"
                  content="SMART goals are Specific (what exactly?), Measurable (how much?), Achievable (realistic?), Relevant (why important?), and Time-bound (by when?). Example: 'Save $10,000 for emergency fund by December 2024' vs 'Save money.'"
                />
              </View>
              <GoalRatingStars
                rating={goalRating}
                isLoading={isRatingGoal}
                isConnected={isConnected}
              />
            </View>
            <TextInput
              value={goalTitle}
              onChangeText={handleGoalChange}
              placeholder="I want to save $1 million for retirement by age 60..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={[
                styles.enhancedGoalInput,
                goalTitle.length > 0 && styles.inputValid
              ]}
              maxLength={150}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="sentences"
              autoComplete="off"
              spellCheck={false}
              accessible={true}
              accessibilityLabel="Enter your goal. Include what you want to achieve, how much, and by when for best results."
              accessibilityHint="Type your goal here. The AI will analyze it and provide a quality rating."
              accessibilityRole="none"
            />
            <View style={styles.inputFooter}>
              <View style={styles.validationIndicator}>
                {isConnected === false && goalTitle.length >= 3 && (
                  <Text style={styles.offlineText}>
                    📶 Using offline SMART analysis • Connect for AI enhancement
                  </Text>
                )}
                {validationText && (
                  <Text style={styles.validationText}>
                    {validationText}
                  </Text>
                )}
                {isRatingGoal && (
                  <Text style={styles.loadingText}>
                    🤖 AI is analyzing your goal...
                  </Text>
                )}
              </View>
              <Text style={styles.characterCount}>{goalTitle.length}/150</Text>
            </View>
          </View>
        </View>

        {/* AI Enhancement Section - More Integrated */}
        {goalTitle.trim().length >= 3 && (
          <View style={styles.enhancementSection}>
            <GoalEnhancementCard
              goalInput={goalTitle}
              userId={Constants.sessionId || 'anonymous'}
              avatarType={avatarType as any}
              avatarName={avatarName}
              goalCategory={goalCategory}
              onEnhancedGoalSelect={(enhancedGoal, rating) => {
                console.log('🎯 Enhanced goal selected:', enhancedGoal);
                console.log('🎯 Original goal was:', goalTitle);

                // Set flag to prevent AI re-analysis
                isEnhancedSelectionRef.current = true;

                // Use handleGoalChange to update state consistently
                handleGoalChange(enhancedGoal);

                console.log('🎯 Updated goal via handleGoalChange:', enhancedGoal);

                // Set the rating immediately to avoid "Not rated" state
                if (rating !== undefined) {
                  setGoalRating(rating);
                  // Cancel any pending rating request since we already have the rating
                  if (ratingTimeoutRef.current) {
                    clearTimeout(ratingTimeoutRef.current);
                  }
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                    abortControllerRef.current = null;
                  }
                  // Update the last request text to prevent duplicate requests
                  lastRequestTextRef.current = enhancedGoal;
                }
              }}
              onCategorySelect={(category) => {
                console.log('AI suggested category:', category);
              }}
              onHabitsSelect={(habits) => {
                console.log('AI suggested habits:', habits);
              }}
            />
          </View>
        )}

        {/* Additional Details Section - Streamlined */}
        <View style={styles.additionalSection}>
          {/* Target Date - More Prominent */}
          <View style={styles.targetDateField}>
            <View style={styles.labelWithHelp}>
              <Text style={styles.sectionLabel}>When do you want to achieve this?</Text>
              <HelpTooltip
                title="Setting a timeline"
                content="A specific deadline makes your goal more actionable and helps you plan backwards. Use real dates (December 2024), seasons (next summer), or time periods (in 6 months). Avoid vague terms like 'someday' or 'eventually.'"
              />
            </View>
            <TextInput
              value={targetDate}
              onChangeText={(text) => {
                setTargetDate(text);
                handleSave();
              }}
              placeholder="e.g., December 2024, Next summer, 6 months"
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.targetDateInput}
              accessible={true}
              accessibilityLabel="When do you want to achieve this goal?"
              accessibilityHint="Enter a target date or timeframe for your goal"
            />
          </View>

          {/* Collapsible Additional Details */}
          <View style={styles.optionalSection}>
            <Text style={styles.optionalLabel}>Additional Details (Optional)</Text>
            
            {/* Goal Details */}
            <TextInput
              value={goalDetails}
              onChangeText={(text) => {
                setGoalDetailsLocal(text);
                handleSave();
              }}
              placeholder="Why is this goal important? What will success look like?"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.detailsInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

          </View>
        </View>


        {/* Compact Examples & Tips */}
        <View style={styles.helpSection}>
          {/* Examples - Condensed */}
          <View style={styles.compactExamplesSection}>
            <Text style={styles.compactExamplesTitle}>💡 {goalCategory} examples:</Text>
            <View style={styles.compactExamples}>
              {goalExamples.slice(0, 3).map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleChip}
                  onPress={() => handleGoalChange(example)}
                >
                  <Text style={styles.exampleChipText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SMART Tips - Condensed */}
          <View style={styles.smartTipsSection}>
            <Text style={styles.smartTipsTitle}>🎯 SMART Goals Include:</Text>
            <Text style={styles.smartTipsText}>
              <Text style={styles.tipBold}>Numbers</Text> (how much?) • <Text style={styles.tipBold}>Deadlines</Text> (by when?) • <Text style={styles.tipBold}>Action words</Text> (what will you do?)
            </Text>
          </View>
        </View>
      </ScrollView>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Simplified Header Styles
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Stars Component Styles - Header positioned
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stars: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  starCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },

  // Enhanced Goal Input Styles
  goalSection: {
    marginBottom: 24,
  },
  goalInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelWithHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  goalLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  enhancedGoalInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: '#FFFFFF',
    minHeight: 120, // Increased for more space
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  inputValid: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  validationIndicator: {
    flex: 1,
  },
  validationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  offlineText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  loadingText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  characterCount: {
    color: '#FFFFFF',
    opacity: 0.6,
    fontSize: 12,
    fontWeight: '500',
  },

  // Enhancement Section
  enhancementSection: {
    marginBottom: 24,
  },

  // Additional Details Styles
  additionalSection: {
    marginBottom: 24,
  },
  targetDateField: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  targetDateInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionalSection: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  optionalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.9,
  },
  detailsInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },

  // Help Section Styles
  helpSection: {
    marginBottom: 100, // Space for bottom button
  },
  compactExamplesSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  compactExamplesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  compactExamples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exampleChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  smartTipsSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  smartTipsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  smartTipsText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '700',
  },
});