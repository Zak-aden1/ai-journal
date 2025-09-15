import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

type Mood = '😊' | '😐' | '😔' | '😤' | '😍';

interface MoodBubble {
  emoji: Mood;
  label: string;
  color: string;
}

const moodBubbles: MoodBubble[] = [
  { emoji: '😊', label: 'Happy', color: '#FFD700' },
  { emoji: '😐', label: 'Neutral', color: '#87CEEB' },
  { emoji: '😔', label: 'Sad', color: '#B0C4DE' },
  { emoji: '😤', label: 'Frustrated', color: '#FF6B6B' },
  { emoji: '😍', label: 'Grateful', color: '#98FB98' },
];

interface QuickMoodBubblesProps {
  onMoodSelect: (mood: Mood, label: string) => void;
  style?: any;
}

export function QuickMoodBubbles({ onMoodSelect, style }: QuickMoodBubblesProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [animatedValues] = useState(() => 
    moodBubbles.map(() => new Animated.Value(1))
  );

  const handleMoodPress = async (mood: Mood, label: string, index: number) => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setSelectedMood(mood);
    
    // Bounce animation
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Brief delay for visual feedback, then trigger callback
    setTimeout(() => {
      onMoodSelect(mood, label);
    }, 200);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.bubblesContainer}>
        {moodBubbles.map((bubble, index) => (
          <Animated.View
            key={bubble.emoji}
            style={[
              styles.bubbleWrapper,
              {
                transform: [{ scale: animatedValues[index] }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.bubble,
                { backgroundColor: bubble.color + '20' },
                selectedMood === bubble.emoji && styles.selectedBubble,
              ]}
              onPress={() => handleMoodPress(bubble.emoji, bubble.label, index)}
              activeOpacity={0.7}
            >
              <Text style={styles.bubbleEmoji}>{bubble.emoji}</Text>
              <Text style={[styles.bubbleLabel, { color: bubble.color }]}>
                {bubble.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
  },
  
  bubblesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  
  bubbleWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing.xs,
  },
  
  selectedBubble: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '30',
  },
  
  bubbleEmoji: {
    fontSize: 18,
    marginBottom: 1,
  },
  
  bubbleLabel: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
});