import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useOnboardingStore } from '@/stores/onboarding';
import { useAppStore } from '@/stores/app';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { AvatarRenderer } from '@/components/avatars';
import * as Haptics from 'expo-haptics';

type Mood = '😊'|'😐'|'😔'|'😤'|'😍';

const moods: { emoji: Mood; label: string; color: string }[] = [
  { emoji: '😍', label: 'Amazing', color: '#22c55e' },
  { emoji: '😊', label: 'Good', color: '#3b82f6' },
  { emoji: '😐', label: 'Okay', color: '#64748b' },
  { emoji: '😤', label: 'Stressed', color: '#f59e0b' },
  { emoji: '😔', label: 'Tough', color: '#ef4444' },
];

const prompts = [
  "How are you feeling about your new goal?",
  "What's one thing you're excited about?",
  "What's motivating you today?",
  "Share what's on your mind right now...",
  "What would make today feel successful?"
];

export default function FirstCheckInStep() {
  const { data, setFirstCheckIn } = useOnboardingStore();
  const { submitJournalEntry } = useAppStore();

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [entryText, setEntryText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(prompts[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.8);
  const moodScale = useSharedValue(0);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    titleOpacity.value = withTiming(1, { duration: 600 });
    avatarScale.value = withDelay(400, withSpring(1, { damping: 15 }));
    moodScale.value = withDelay(800, withSpring(1, { damping: 12 }));
    formOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));

    // Cycle through prompts
    const interval = setInterval(() => {
      setCurrentPrompt(prev => {
        const currentIndex = prompts.indexOf(prev);
        return prompts[(currentIndex + 1) % prompts.length];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleMoodSelect = (mood: Mood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMood(mood);
    // Save to store immediately for validation
    setFirstCheckIn(mood, entryText.trim());
  };

  const handleSaveAndContinue = async () => {
    if (!selectedMood || entryText.trim().length < 10) {
      Alert.alert(
        'Almost there!', 
        'Please select your mood and write at least a few words about how you\'re feeling.'
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Save first check-in to onboarding store (always works)
      setFirstCheckIn(selectedMood, entryText.trim());

      console.log('Attempting to create journal entry:', { 
        text: entryText.trim(), 
        mood: selectedMood,
        textLength: entryText.trim().length 
      });

      // Try to create actual journal entry, but don't block progress if it fails
      try {
        await submitJournalEntry(entryText.trim(), selectedMood);
        console.log('Journal entry created successfully');
      } catch (entryError) {
        console.warn('Failed to save journal entry to database, but continuing onboarding:', entryError);
        // Entry will be saved when onboarding completes and data is processed
      }
    } catch (error) {
      console.error('Critical error in first check-in step:', error);
      Alert.alert('Oops!', 'There was an issue. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  const canContinue = selectedMood && entryText.trim().length >= 10;
  const selectedMoodData = moods.find(m => m.emoji === selectedMood);

  // Animated styles
  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{
      translateY: interpolate(titleOpacity.value, [0, 1], [20, 0])
    }],
  }));

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const animatedMoodStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moodScale.value }],
    opacity: moodScale.value,
  }));

  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{
      translateY: interpolate(formOpacity.value, [0, 1], [20, 0])
    }],
  }));

  return (
    <OnboardingContainer step={5} gradient={['#667eea', '#764ba2']} totalSteps={7}>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, animatedTitleStyle]}>
          <Text style={styles.title}>Your First Check-In ✨</Text>
          <Text style={styles.subtitle}>
            Let&apos;s start your journaling journey! How are you feeling about your goal?
          </Text>
        </Animated.View>

        {/* Avatar Welcome */}
        <Animated.View style={[styles.avatarSection, animatedAvatarStyle]}>
          <AvatarRenderer 
            type={data.selectedAvatarType || 'base'} 
            vitality={85} 
            size={80} 
            animated 
          />
          <View style={styles.speechBubble}>
            <Text style={styles.avatarName}>{data.avatarName || 'Buddy'}</Text>
            <Text style={styles.avatarMessage}>
              &quot;I&apos;m so excited to start this journey with you! How are you feeling right now? This is your first step towards your goal: {data.goalTitle}!&quot;
            </Text>
          </View>
        </Animated.View>

        {/* Mood Selection */}
        <Animated.View style={[styles.section, animatedMoodStyle]}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.emoji}
                style={[
                  styles.moodButton,
                  selectedMood === mood.emoji && styles.moodButtonSelected,
                  selectedMood === mood.emoji && { borderColor: mood.color }
                ]}
                onPress={() => handleMoodSelect(mood.emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.emoji && { color: mood.color }
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Journal Entry Form */}
        <Animated.View style={[styles.section, animatedFormStyle]}>
          <Text style={styles.sectionTitle}>Share your thoughts</Text>
          <Text style={styles.promptText}>{currentPrompt}</Text>
          
          <View style={[
            styles.textInputContainer,
            selectedMoodData && { borderColor: selectedMoodData.color }
          ]}>
            <TextInput
              style={styles.textInput}
              value={entryText}
              onChangeText={(text) => {
                setEntryText(text);
                // Save to store immediately for validation
                if (selectedMood) {
                  setFirstCheckIn(selectedMood, text.trim());
                }
              }}
              placeholder="Start writing... (minimum 10 characters)"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
          
          <View style={styles.inputFooter}>
            <Text style={styles.characterCount}>{entryText.length}/500</Text>
            <Text style={styles.encouragement}>
              {entryText.length >= 10 ? "Great! Keep going... 💪" : "Share what's on your mind..."}
            </Text>
          </View>
        </Animated.View>

        {/* Value Proposition */}
        <View style={styles.valueSection}>
          <Text style={styles.valueTitle}>✨ This is how you&apos;ll grow:</Text>
          <View style={styles.valuePoints}>
            <Text style={styles.valuePoint}>📝 Daily reflection builds self-awareness</Text>
            <Text style={styles.valuePoint}>📈 Track your progress towards your goal</Text>
            <Text style={styles.valuePoint}>🤖 Get personalized insights from {data.avatarName}</Text>
            <Text style={styles.valuePoint}>🎯 Stay motivated and on track</Text>
          </View>
        </View>

        <View style={styles.spacing} />
      </ScrollView>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  speechBubble: {
    flex: 1,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  avatarMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodButton: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 1.05 }],
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  promptText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 16,
    fontStyle: 'italic',
    minHeight: 20,
  },
  textInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  encouragement: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  valueSection: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  valuePoints: {
    gap: 8,
  },
  valuePoint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  spacing: {
    height: 100, // Space for bottom navigation
  },
});