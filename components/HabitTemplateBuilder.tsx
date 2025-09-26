import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { validateHabitInput, generateHabitExamples } from '@/utils/habitValidation';

interface HabitTemplate {
  action: string;
  timing: string;
  goal: string;
}

interface HabitTemplateBuilderProps {
  goalTitle: string;
  goalCategory: string;
  defaultAction?: string;
  defaultTiming?: string;
  onHabitCreated: (template: HabitTemplate, fullHabit: string) => void;
  onCancel?: () => void;
}

interface TimingSuggestion {
  label: string;
  value: string;
  icon: string;
}

export function HabitTemplateBuilder({
  goalTitle,
  goalCategory,
  defaultAction = '',
  defaultTiming = '',
  onHabitCreated,
  onCancel
}: HabitTemplateBuilderProps) {
  const [action, setAction] = useState(defaultAction);
  const [timing, setTiming] = useState(defaultTiming);
  const [goal, setGoal] = useState(goalTitle);
  const [actionValidation, setActionValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [showTimingSuggestions, setShowTimingSuggestions] = useState(false);

  // Smart timing suggestions based on action and goal
  const getTimingSuggestions = (): TimingSuggestion[] => {
    const actionLower = action.toLowerCase();
    const goalLower = goalTitle.toLowerCase();

    const suggestions: TimingSuggestion[] = [
      { label: 'First thing in the morning', value: 'first thing in the morning', icon: '🌅' },
      { label: 'Right after waking up', value: 'right after I wake up', icon: '⏰' },
      { label: 'After breakfast', value: 'after breakfast', icon: '🥞' },
      { label: 'During lunch break', value: 'during my lunch break', icon: '🥗' },
      { label: 'After work/school', value: 'right after work', icon: '🏢' },
      { label: 'In the evening', value: 'in the evening', icon: '🌆' },
      { label: 'Before bed', value: 'before going to bed', icon: '🛏️' },
    ];

    // Add context-specific suggestions
    if (actionLower.includes('exercise') || actionLower.includes('workout') || actionLower.includes('run')) {
      suggestions.unshift({ label: 'Early morning (6-8am)', value: 'at 7am before work', icon: '💪' });
    }

    if (actionLower.includes('read') || actionLower.includes('study') || actionLower.includes('learn')) {
      suggestions.unshift({ label: 'With morning coffee', value: 'with my morning coffee', icon: '☕' });
    }

    if (actionLower.includes('write') || actionLower.includes('journal')) {
      suggestions.unshift({ label: 'Before bed reflection', value: 'before bed as reflection', icon: '📝' });
    }

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  // Generate full habit sentence
  const getFullHabit = (): string => {
    if (!action.trim() || !timing.trim() || !goal.trim()) return '';
    return `I will ${action.trim()}, ${timing.trim()}, so that I can ${goal.trim()}`;
  };

  // Validate action input
  const validateAction = (text: string) => {
    if (text.length < 3) {
      setActionValidation({ isValid: false, error: 'Please be more specific about what you\'ll do' });
      return;
    }

    const validation = validateHabitInput(text, []);
    setActionValidation({
      isValid: validation.isValid,
      error: validation.error
    });
  };

  useEffect(() => {
    if (action.length > 2) {
      validateAction(action);
    }
  }, [action]);

  const handleCreateHabit = () => {
    if (!action.trim()) {
      Alert.alert('Missing Action', 'Please specify what you will do');
      return;
    }

    if (!timing.trim()) {
      Alert.alert('Missing Timing', 'Please specify when you will do this habit');
      return;
    }

    if (!actionValidation.isValid) {
      Alert.alert('Invalid Action', actionValidation.error || 'Please enter a valid action');
      return;
    }

    const template: HabitTemplate = {
      action: action.trim(),
      timing: timing.trim(),
      goal: goal.trim()
    };

    const fullHabit = getFullHabit();
    onHabitCreated(template, fullHabit);
  };

  const canCreate = action.trim().length >= 3 && timing.trim().length >= 3 && actionValidation.isValid;

  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: 20,
      margin: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)'
    }}>
      <Text style={{
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        ✨ Create Your Habit
      </Text>

      <Text style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 18
      }}>
        Let's build a specific, actionable habit that will help you achieve "{goalTitle}"
      </Text>

      {/* Template Structure Preview */}
      <View style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
      }}>
        <Text style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          YOUR HABIT
        </Text>

        <Text style={{
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: 22,
          minHeight: 44
        }}>
          {getFullHabit() || 'I will _______, _______, so that I can _______'}
        </Text>
      </View>

      {/* Action Input */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8
        }}>
          I will... (what specific action?)
        </Text>

        <TextInput
          value={action}
          onChangeText={setAction}
          placeholder="e.g., read 20 pages, do 30 push-ups, write 500 words"
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: 12,
            color: '#FFFFFF',
            fontSize: 16,
            borderWidth: actionValidation.error ? 2 : 0,
            borderColor: actionValidation.error ? '#ef4444' : 'transparent'
          }}
          maxLength={60}
        />

        {actionValidation.error && (
          <View style={{
            marginTop: 8,
            padding: 8,
            borderRadius: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}>
            <Text style={{
              color: '#ef4444',
              fontSize: 12,
              fontWeight: '500'
            }}>
              ⚠️ {actionValidation.error}
            </Text>

            {/* Show examples for invalid actions */}
            {(() => {
              const examples = generateHabitExamples(action);
              if (examples.length > 0) {
                return (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 11,
                      fontWeight: '600',
                      marginBottom: 4
                    }}>
                      Try these examples:
                    </Text>
                    {examples.slice(0, 2).map((example, index) => (
                      <TouchableOpacity
                        key={index}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginBottom: 2,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)'
                        }}
                        onPress={() => setAction(example)}
                      >
                        <Text style={{
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: '500'
                        }}>
                          "{example}"
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }
              return null;
            })()}
          </View>
        )}
      </View>

      {/* Timing Input */}
      <View style={{ marginBottom: 16 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600'
          }}>
            When? (be specific)
          </Text>

          <TouchableOpacity
            onPress={() => setShowTimingSuggestions(!showTimingSuggestions)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4
            }}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: '600'
            }}>
              {showTimingSuggestions ? 'Hide' : 'Suggestions'}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={timing}
          onChangeText={setTiming}
          placeholder="e.g., at 7am with coffee, after dinner, before bed"
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: 12,
            color: '#FFFFFF',
            fontSize: 16
          }}
          maxLength={50}
        />

        {/* Timing Suggestions */}
        {showTimingSuggestions && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {getTimingSuggestions().map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                    minWidth: 100,
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    setTiming(suggestion.value);
                    setShowTimingSuggestions(false);
                  }}
                >
                  <Text style={{ fontSize: 16, marginBottom: 2 }}>{suggestion.icon}</Text>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: '500',
                    textAlign: 'center',
                    lineHeight: 12
                  }}>
                    {suggestion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Goal Input */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8
        }}>
          So that I can... (your goal)
        </Text>

        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="achieve my goal"
          placeholderTextColor="rgba(255,255,255,0.5)"
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            padding: 12,
            color: '#FFFFFF',
            fontSize: 16
          }}
          maxLength={60}
        />
      </View>

      {/* Action Buttons */}
      <View style={{
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center'
      }}>
        {onCancel && (
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)'
            }}
            onPress={onCancel}
          >
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: canCreate ? '#22c55e' : 'rgba(255,255,255,0.2)',
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
            opacity: canCreate ? 1 : 0.6
          }}
          onPress={handleCreateHabit}
          disabled={!canCreate}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '700'
          }}>
            Create My Habit ✨
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}