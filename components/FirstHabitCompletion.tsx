import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';

interface HabitTemplate {
  action: string;
  timing: string;
  goal: string;
}

interface FirstHabitCompletionProps {
  habitTemplate: HabitTemplate;
  habitFullText: string;
  onComplete: () => void;
  onSkip?: () => void;
}

export function FirstHabitCompletion({
  habitTemplate,
  habitFullText,
  onComplete,
  onSkip
}: FirstHabitCompletionProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [completionTime, setCompletionTime] = useState<Date | null>(null);

  const handleStart = () => {
    setStartTime(new Date());
  };

  const handleComplete = () => {
    const endTime = new Date();
    setCompletionTime(endTime);
    setIsCompleted(true);

    // Calculate duration if started
    let duration = '';
    if (startTime) {
      const diffInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      duration = diffInMinutes < 1 ? 'less than 1 minute' : `${diffInMinutes} minutes`;
    }

    setTimeout(() => {
      Alert.alert(
        '🎉 Congratulations!',
        `You just completed your first "${habitTemplate.action}"! ${duration ? `It took you ${duration}.` : ''}\n\nThis is the beginning of building your new routine. Every time you do this habit, you're getting closer to "${habitTemplate.goal}".`,
        [
          {
            text: 'Continue',
            onPress: onComplete,
            style: 'default'
          }
        ]
      );
    }, 500);
  };

  const handleSkip = () => {
    if (onSkip) {
      Alert.alert(
        'Skip First Completion?',
        'No worries! You can always do your habit later. The important thing is that you\'ve created it.',
        [
          {
            text: 'Go Back',
            style: 'cancel'
          },
          {
            text: 'Skip for Now',
            onPress: onSkip,
            style: 'default'
          }
        ]
      );
    }
  };

  // Get action-specific instructions
  const getInstructions = (): string[] => {
    const action = habitTemplate.action.toLowerCase();

    if (action.includes('read')) {
      return [
        'Find a book, article, or digital content to read',
        'Set a timer or just start reading',
        'Focus on understanding rather than speed',
        'Mark as complete when done!'
      ];
    }

    if (action.includes('exercise') || action.includes('workout') || action.includes('push-up') || action.includes('walk')) {
      return [
        'Find a comfortable space for movement',
        'Start with a light warm-up if needed',
        'Focus on proper form over speed',
        'Listen to your body and adjust as needed'
      ];
    }

    if (action.includes('write') || action.includes('journal')) {
      return [
        'Get your preferred writing tool (digital or paper)',
        'Find a quiet, comfortable spot',
        'Don\'t worry about perfect grammar or style',
        'Focus on expressing your thoughts freely'
      ];
    }

    if (action.includes('meditat') || action.includes('mindful')) {
      return [
        'Find a quiet, comfortable position',
        'You can sit, lie down, or even walk mindfully',
        'Focus on your breath or chosen meditation technique',
        'It\'s normal for your mind to wander - just gently return focus'
      ];
    }

    if (action.includes('practice') || action.includes('skill')) {
      return [
        'Set up your practice space or materials',
        'Start with basics if it\'s your first time',
        'Focus on quality practice over quantity',
        'Celebrate small progress and improvements'
      ];
    }

    // Generic instructions
    return [
      'Prepare whatever you need for this activity',
      'Start small - even 5-10 minutes counts',
      'Focus on the process, not perfection',
      'Remember: consistency beats intensity'
    ];
  };

  const getTips = (): string[] => {
    const action = habitTemplate.action.toLowerCase();

    const tips = [
      'Start smaller than you think you need to',
      'Focus on the process, not the outcome',
      'This is practice - perfection isn\'t the goal',
      'Every small step counts toward your bigger goal'
    ];

    if (action.includes('read')) {
      tips.unshift('Even 5-10 pages is a great start');
    }

    if (action.includes('exercise')) {
      tips.unshift('Listen to your body and start gently');
    }

    if (action.includes('write')) {
      tips.unshift('Write freely - editing comes later');
    }

    if (action.includes('meditat')) {
      tips.unshift('It\'s okay if your mind wanders - that\'s normal');
    }

    return tips.slice(0, 3);
  };

  if (isCompleted && completionTime) {
    return (
      <View style={{
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderRadius: 16,
        padding: 24,
        margin: 16,
        borderWidth: 2,
        borderColor: 'rgba(34, 197, 94, 0.3)',
        alignItems: 'center'
      }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>

        <Text style={{
          color: '#FFFFFF',
          fontSize: 22,
          fontWeight: '700',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          Habit Complete!
        </Text>

        <Text style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: 16,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 16
        }}>
          You just completed your first "{habitTemplate.action}" at{' '}
          {completionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          width: '100%'
        }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
            textAlign: 'center'
          }}>
            🧠 What just happened?
          </Text>

          <Text style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 17
          }}>
            You've started building a neural pathway for this habit. Each time you repeat this action, that pathway gets stronger, making it easier and more automatic.
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#22c55e',
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12
          }}
          onPress={onComplete}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '700'
          }}>
            Continue Journey 🚀
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        marginBottom: 8,
        textAlign: 'center'
      }}>
        🚀 Let's do this right now!
      </Text>

      <Text style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 18
      }}>
        The best time to start a new habit is right now. Let's complete your first:
      </Text>

      {/* Habit Display */}
      <View style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
      }}>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: 22
        }}>
          "{habitFullText}"
        </Text>
      </View>

      {/* Instructions */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 12
        }}>
          📋 Step-by-step guide:
        </Text>

        {getInstructions().map((instruction, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: 8
            }}
          >
            <Text style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14,
              marginRight: 8,
              minWidth: 20
            }}>
              {index + 1}.
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              lineHeight: 18,
              flex: 1
            }}>
              {instruction}
            </Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      <View style={{
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)'
      }}>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8
        }}>
          💡 Pro tips:
        </Text>

        {getTips().map((tip, index) => (
          <Text
            key={index}
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              lineHeight: 16,
              marginBottom: index < getTips().length - 1 ? 4 : 0
            }}
          >
            • {tip}
          </Text>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 12 }}>
        {!startTime ? (
          <TouchableOpacity
            style={{
              backgroundColor: '#3b82f6',
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 14,
              alignItems: 'center'
            }}
            onPress={handleStart}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700'
            }}>
              Start Now! 🎯
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: '#22c55e',
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 14,
              alignItems: 'center'
            }}
            onPress={handleComplete}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700'
            }}>
              ✅ I Completed It!
            </Text>
          </TouchableOpacity>
        )}

        {onSkip && (
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)'
            }}
            onPress={handleSkip}
          >
            <Text style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              fontWeight: '600'
            }}>
              Skip for Now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}