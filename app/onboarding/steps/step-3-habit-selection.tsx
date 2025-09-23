import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { HabitScheduleCustomizer } from '@/components/HabitScheduleCustomizer';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { createOnboardingStyles } from '@/components/goal-creation/OnboardingGoalCreationStyles';
import { SUGGESTED_HABITS } from '@/components/goal-creation/GoalCreationFlow';
import { HabitSchedule } from '@/lib/db';
import { useHabitSuggestions, type HabitSuggestionsRequest, type HabitSuggestion } from '@/services/ai/habitSuggestions';
import { validateHabitInput, suggestHabitImprovements } from '@/utils/habitValidation';

export default function HabitSelectionStep() {
  const { data, addHabit, removeHabit, setStep, setHabitSchedule } = useOnboardingStore();
  const styles = createOnboardingStyles();


  // AI suggestions state
  const { getSuggestions, isLoading, error, suggestions, summary, clearError } = useHabitSuggestions();
  const [aiSuggestionsLoaded, setAiSuggestionsLoaded] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedHabitsWithSchedules, setSelectedHabitsWithSchedules] = useState<Map<string, HabitSuggestion['schedule']>>(new Map());

  // Schedule customization state
  const [customizingHabit, setCustomizingHabit] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Fallback to static suggestions if AI fails or hasn't loaded
  const staticSuggestions = data.goalCategory ? SUGGESTED_HABITS[data.goalCategory] : [];
  // Convert old format to new format for backward compatibility
  const staticSuggestionsConverted = staticSuggestions.map(habit => ({
    habit,
    schedule: { frequency: 'daily' as const, timeOfDay: 'anytime' as const, description: 'Custom schedule' }
  }));
  const suggestedHabits = suggestions.length > 0 ? suggestions : staticSuggestionsConverted;

  const [customHabit, setCustomHabit] = React.useState('');
  const [habitValidation, setHabitValidation] = useState<{ isValid: boolean; warning?: string; error?: string }>({ isValid: true });

  // Manual AI suggestions trigger
  const loadAISuggestions = async () => {
    if (!data.goalTitle || !data.goalCategory || !data.selectedAvatarType) {
      Alert.alert('Missing Information', 'Please complete your goal setup first.');
      return;
    }

    if (aiSuggestionsLoaded) {
      setShowAISuggestions(true);
      return;
    }

    const request: HabitSuggestionsRequest = {
      goalTitle: data.goalTitle,
      goalCategory: data.goalCategory,
      userId: 'onboarding-user', // TODO: Use actual user ID when auth is implemented
      context: {
        avatarType: data.selectedAvatarType,
        avatarName: data.avatarName,
        existingHabits: data.selectedHabits
      }
    };

    console.log('🤖 Loading AI habit suggestions for:', data.goalTitle);
    setShowAISuggestions(true);
    await getSuggestions(request);
    setAiSuggestionsLoaded(true);
  };

  const toggleHabit = (habitSuggestion: HabitSuggestion) => {
    const habitName = habitSuggestion.habit;
    if (data.selectedHabits.includes(habitName)) {
      removeHabit(habitName);
      // Remove from local schedule state
      const newSchedules = new Map(selectedHabitsWithSchedules);
      newSchedules.delete(habitName);
      setSelectedHabitsWithSchedules(newSchedules);
    } else {
      addHabit(habitName);
      // Add AI-suggested schedule to local state
      const newSchedules = new Map(selectedHabitsWithSchedules);
      newSchedules.set(habitName, habitSuggestion.schedule);
      setSelectedHabitsWithSchedules(newSchedules);

      // Also set in onboarding store with converted format
      const habitSchedule: HabitSchedule = convertToHabitSchedule(habitSuggestion.schedule);
      setHabitSchedule(habitName, habitSchedule);
    }
  };

  // Helper function to convert AI schedule to HabitSchedule format
  const convertToHabitSchedule = (aiSchedule: HabitSuggestion['schedule']): HabitSchedule => {
    const daysMap = {
      daily: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      weekends: ['sat', 'sun'],
      weekly: ['mon'], // Default to Monday for weekly
      custom: ['mon', 'tue', 'wed'] // Default for custom
    };

    return {
      isDaily: aiSchedule.frequency === 'daily',
      daysOfWeek: daysMap[aiSchedule.frequency] || daysMap.daily,
      timeType: aiSchedule.timeOfDay === 'anytime' ? 'anytime' : aiSchedule.timeOfDay || 'anytime',
      specificTime: undefined,
      reminder: false
    };
  };

  // Helper function to format schedule display
  const formatScheduleDisplay = (schedule: HabitSuggestion['schedule']): string => {
    const frequencyText = {
      daily: 'Daily',
      weekdays: 'Weekdays',
      weekends: 'Weekends',
      weekly: 'Weekly',
      custom: `${schedule.timesPerWeek || 3}x per week`
    };

    const timeText = schedule.timeOfDay === 'anytime' ? '' : ` • ${schedule.timeOfDay}`;
    return `${frequencyText[schedule.frequency]}${timeText}`;
  };

  const addCustomHabit = () => {
    const habit = customHabit.trim();

    // Enhanced validation with duplicate detection
    const validation = validateHabitInput(habit, data.selectedHabits);

    if (!validation.isValid) {
      if (validation.error) {
        Alert.alert('Invalid Habit', validation.error);
      }
      return;
    }

    // Handle similar habits with warning
    if (validation.warning && validation.similarity) {
      Alert.alert(
        'Similar Habit Found',
        validation.warning,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Add Anyway',
            onPress: () => {
              addHabit(habit);
              setCustomHabit('');
            }
          }
        ]
      );
      return;
    }

    // Valid habit, add it
    addHabit(habit);
    setCustomHabit('');

    // Show improvement suggestions if any
    const suggestions = suggestHabitImprovements(habit);
    if (suggestions.length > 0 && Math.random() < 0.3) { // Show occasionally
      setTimeout(() => {
        Alert.alert(
          'Habit Tip',
          `Great habit! ${suggestions[0]}`,
          [{ text: 'Got it', style: 'default' }]
        );
      }, 500);
    }
  };

  const handleCustomizeSchedule = (habitName: string) => {
    setCustomizingHabit(habitName);
    setShowScheduleModal(true);
  };

  const handleScheduleUpdate = (schedule: HabitSchedule) => {
    if (customizingHabit) {
      setHabitSchedule(customizingHabit, schedule);
    }
  };

  const getHabitSchedule = (habitName: string): HabitSchedule => {
    const existing = data.habitSchedules[habitName];
    if (existing) return existing;

    // Default schedule for custom habits
    return {
      isDaily: false,
      daysOfWeek: ['mon', 'wed', 'fri'],
      timeType: 'anytime',
      specificTime: undefined,
      reminder: false
    };
  };

  const getHabitImpactReason = (habitName: string, goalCategory: string | null): string => {
    const habit = habitName.toLowerCase();
    const category = goalCategory || 'personal';

    // Smart reasoning based on habit keywords and goal category
    const reasons: Record<string, Record<string, string>> = {
      health: {
        'exercise': 'Builds physical strength and endurance for sustained progress',
        'walk': 'Low-impact movement that boosts energy and mental clarity',
        'run': 'Cardiovascular fitness accelerates overall health improvements',
        'meditate': 'Reduces stress and improves focus for better health decisions',
        'sleep': 'Quality rest is essential for physical recovery and mental health',
        'water': 'Proper hydration supports all bodily functions and energy',
        'stretch': 'Flexibility prevents injury and improves physical performance'
      },
      learning: {
        'read': 'Consistent reading builds knowledge and cognitive skills',
        'practice': 'Regular practice creates lasting skill development',
        'study': 'Structured learning accelerates knowledge acquisition',
        'write': 'Writing reinforces learning and improves communication',
        'research': 'Research skills deepen understanding and critical thinking',
        'review': 'Regular review strengthens memory retention'
      },
      career: {
        'network': 'Building relationships opens new opportunities and insights',
        'practice': 'Skill development directly impacts career advancement',
        'read': 'Industry knowledge keeps you competitive and informed',
        'learn': 'Continuous learning drives professional growth',
        'portfolio': 'Showcasing work demonstrates value to employers/clients',
        'interview': 'Interview skills are crucial for career progression'
      },
      personal: {
        'journal': 'Self-reflection accelerates personal growth and clarity',
        'gratitude': 'Positive mindset improves overall life satisfaction',
        'organize': 'Organization reduces stress and increases productivity',
        'budget': 'Financial discipline creates freedom for other goals',
        'plan': 'Strategic planning turns aspirations into achievable steps'
      }
    };

    // Find matching keywords
    for (const [keyword, reason] of Object.entries(reasons[category] || {})) {
      if (habit.includes(keyword)) {
        return reason;
      }
    }

    // Generic reasons based on category
    const genericReasons = {
      health: 'This habit supports your physical and mental well-being',
      learning: 'This practice accelerates skill development and knowledge growth',
      career: 'This action builds capabilities that advance your professional goals',
      personal: 'This habit contributes to overall life satisfaction and growth'
    };

    return genericReasons[category as keyof typeof genericReasons] || 'This habit supports your overall goal achievement';
  };

  const getHabitImpactScore = (habitName: string, goalCategory: string | null): number => {
    const habit = habitName.toLowerCase();
    const category = goalCategory || 'personal';

    // Impact scores based on research and common effectiveness
    const impactScores: Record<string, Record<string, number>> = {
      health: {
        'exercise': 95,
        'walk': 85,
        'run': 90,
        'meditate': 80,
        'sleep': 95,
        'water': 75,
        'stretch': 70,
        'nutrition': 90,
        'meal prep': 85
      },
      learning: {
        'read': 85,
        'practice': 95,
        'study': 90,
        'write': 80,
        'research': 75,
        'review': 85,
        'flashcards': 80,
        'teach': 90
      },
      career: {
        'network': 90,
        'practice': 85,
        'read': 75,
        'learn': 80,
        'portfolio': 85,
        'interview': 85,
        'skill': 90,
        'mentor': 80
      },
      personal: {
        'journal': 85,
        'gratitude': 75,
        'organize': 70,
        'budget': 85,
        'plan': 80,
        'reflect': 80,
        'goal': 85
      }
    };

    // Find the best matching keyword
    let bestScore = 65; // Default score
    for (const [keyword, score] of Object.entries(impactScores[category] || {})) {
      if (habit.includes(keyword)) {
        bestScore = Math.max(bestScore, score);
      }
    }

    return bestScore;
  };


  const handleContinue = () => {
    setStep(4); // Advance to Your Why step
  };

  const canContinue = data.goalTitle.trim().length >= 3; // Basic validation

  return (
    <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']} compact={true}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header as any}>
          <Text style={styles.title as any}>Add some habits</Text>
          <Text style={styles.subtitle as any}>
            Choose habits that will help you achieve &quot;{data.goalTitle}&quot;
          </Text>
        </View>

        <View style={styles.form as any}>
          {/* Custom Habit Input - Now First */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              gap: 8
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                flex: 1
              }}>
                Add your own habit
              </Text>
              <HelpTooltip
                title="Creating effective habits"
                content="Great habits are specific (read 20 pages), actionable (practice piano), and tied to your goal. Include duration or frequency when possible. Examples: 'Walk 10,000 steps daily' vs 'Exercise more'."
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={customHabit}
                onChangeText={(text) => {
                  setCustomHabit(text);
                  // Real-time validation feedback
                  if (text.trim().length > 2) {
                    const validation = validateHabitInput(text, data.selectedHabits);
                    setHabitValidation({
                      isValid: validation.isValid,
                      warning: validation.warning,
                      error: validation.error
                    });
                  } else {
                    setHabitValidation({ isValid: true });
                  }
                }}
                placeholder="e.g., Practice piano for 20 minutes"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: 12,
                  color: '#FFFFFF',
                  fontSize: 16,
                  marginRight: 8,
                  borderWidth: habitValidation.error ? 2 : habitValidation.warning ? 1 : 0,
                  borderColor: habitValidation.error ? '#ef4444' : habitValidation.warning ? '#f59e0b' : 'transparent'
                }}
                returnKeyType="done"
                onSubmitEditing={addCustomHabit}
                maxLength={80}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: customHabit.trim().length >= 3 ? '#22c55e' : 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  opacity: customHabit.trim().length >= 3 ? 1 : 0.6
                }}
                onPress={addCustomHabit}
                disabled={customHabit.trim().length < 3}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {/* Validation feedback */}
            {(habitValidation.error || habitValidation.warning) && customHabit.trim().length > 2 && (
              <View style={{
                marginTop: 8,
                padding: 8,
                borderRadius: 8,
                backgroundColor: habitValidation.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderWidth: 1,
                borderColor: habitValidation.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'
              }}>
                <Text style={{
                  color: habitValidation.error ? '#ef4444' : '#f59e0b',
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  {habitValidation.error ? '⚠️ ' : '💡 '}{habitValidation.error || habitValidation.warning}
                </Text>
              </View>
            )}
          </View>

          {/* AI Suggestions Button */}
          {!showAISuggestions && (
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center'
              }}
              onPress={loadAISuggestions}
              disabled={isLoading}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>✨</Text>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 4
              }}>
                Get AI Habit Suggestions
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 18
              }}>
                Based on your goal and category
              </Text>
              {isLoading && (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 8 }} />
              )}
            </TouchableOpacity>
          )}

          {/* AI Suggestions Section - Only show when triggered */}
          {showAISuggestions && (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700'
                }}>
                  ✨ AI Personalized Habits
                </Text>
                {isLoading && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />
                )}
              </View>

              {/* AI Summary - Compact */}
              {summary && !isLoading && (
                <Text style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 14,
                  lineHeight: 18,
                  marginBottom: 4
                }}>
                  {summary}
                </Text>
              )}

              {suggestions.length > 0 && !isLoading && (
                <Text style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  Powered by AI • Schedules included
                </Text>
              )}
            </View>
          )}

          {/* Loading state */}
          {isLoading && (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              alignItems: 'center'
            }}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 16,
                marginTop: 12,
                textAlign: 'center',
                fontWeight: '500'
              }}>
                Creating personalized habits...
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 14,
                marginTop: 4,
                textAlign: 'center'
              }}>
                For &quot;{data.goalTitle}&quot;
              </Text>
            </View>
          )}

          {/* Error state */}
          {error && (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 4
              }}>
                ⚠️ Using fallback suggestions
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12
              }}>
                AI suggestions temporarily unavailable
              </Text>
            </View>
          )}

          {/* Habit Selection Cards - Compact Design */}
          {showAISuggestions && suggestedHabits.length > 0 && !isLoading && (
            <View style={{ marginBottom: 20 }}>
              {suggestedHabits.slice(0, 3).map((habitSuggestion, index) => {
                const isSelected = data.selectedHabits.includes(habitSuggestion.habit);
                return (
                  <TouchableOpacity
                    key={`${habitSuggestion.habit}-${index}`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1.5,
                      borderColor: isSelected ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.2)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 52
                    }}
                    onPress={() => toggleHabit(habitSuggestion)}
                  >
                    {/* Main Content */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{
                          color: '#FFFFFF',
                          fontSize: 15,
                          fontWeight: '600',
                          flex: 1
                        }}>
                          {isSelected ? '✅ ' : '○ '}{habitSuggestion.habit}
                        </Text>
                        <View style={{
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          borderRadius: 8,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          marginLeft: 8
                        }}>
                          <Text style={{
                            color: '#FFFFFF',
                            fontSize: 9,
                            fontWeight: '700',
                          }}>
                            {getHabitImpactScore(habitSuggestion.habit, data.goalCategory)}%
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: 12,
                          fontWeight: '500'
                        }}>
                          {formatScheduleDisplay(habitSuggestion.schedule)}
                        </Text>
                        <Text style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: 12,
                          marginLeft: 6,
                          flex: 1
                        }}>
                          • {habitSuggestion.schedule.description}
                        </Text>
                      </View>
                    </View>

                    {/* Customize Button - Only when selected */}
                    {isSelected && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginLeft: 8,
                        }}
                        onPress={() => handleCustomizeSchedule(habitSuggestion.habit)}
                      >
                        <Text style={{
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: '600'
                        }}>
                          ⚙️
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}


          {/* Selected Habits Summary */}
          {data.selectedHabits.length > 0 && (
            <View style={{
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: 'rgba(34, 197, 94, 0.3)'
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                ✅ Selected {data.selectedHabits.length} habit{data.selectedHabits.length > 1 ? 's' : ''}
              </Text>

              {/* List each habit with its schedule */}
              {data.selectedHabits.map((habitName, index) => {
                const schedule = data.habitSchedules[habitName];
                const displaySchedule = schedule
                  ? `${schedule.isDaily ? 'Daily' : schedule.daysOfWeek?.length + 'x/week'} • ${schedule.timeType || 'anytime'}`
                  : 'Default schedule';

                return (
                  <View
                    key={habitName}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 6,
                      borderTopWidth: index > 0 ? 1 : 0,
                      borderTopColor: 'rgba(255,255,255,0.2)',
                      marginTop: index > 0 ? 6 : 0,
                      paddingTop: index > 0 ? 6 : 0,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '600',
                        marginBottom: 2
                      }}>
                        {habitName}
                      </Text>
                      <Text style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 12
                      }}>
                        {displaySchedule}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                      onPress={() => handleCustomizeSchedule(habitName)}
                    >
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: '600'
                      }}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.modalNavigation as any}>
          <TouchableOpacity
            onPress={handleContinue}
            style={[styles.nextButton as any, !canContinue && (styles.nextButtonDisabled as any)]}
            disabled={!canContinue}
          >
            <Text style={[styles.nextButtonText as any, !canContinue && (styles.nextButtonTextDisabled as any)]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Schedule Customization Modal */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {customizingHabit && (
            <HabitScheduleCustomizer
              habitName={customizingHabit}
              schedule={getHabitSchedule(customizingHabit)}
              onScheduleChange={handleScheduleUpdate}
              onClose={() => {
                setShowScheduleModal(false);
                setCustomizingHabit(null);
              }}
            />
          )}
        </View>
      </Modal>

    </OnboardingContainer>
  );
}