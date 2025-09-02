import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

const getAvatarComponent = (type: string) => {
  switch (type) {
    case 'plant': return PlantAvatar;
    case 'pet': return PetAvatar;
    case 'robot': return RobotAvatar;
    default: return BaseAvatar;
  }
};

const getGoalExamples = (category: string) => {
  const examples = {
    health: [
      'Exercise 4 times per week',
      'Lose 15 pounds by summer',
      'Run my first 5K race',
      'Cook healthy meals daily'
    ],
    learning: [
      'Read 12 books this year',
      'Learn Spanish conversationally',
      'Master React development',
      'Complete online course'
    ],
    career: [
      'Get promoted to manager',
      'Learn new professional skills',
      'Build a side business',
      'Network with 20 professionals'
    ],
    personal: [
      'Practice meditation daily',
      'Improve work-life balance',
      'Travel to 3 new countries',
      'Build stronger relationships'
    ]
  };
  
  return examples[category as keyof typeof examples] || examples.personal;
};

export default function GoalDetailsStep() {
  const { data, setGoalDetails, setVoiceNote } = useOnboardingStore();
  const [goalTitle, setGoalTitle] = useState(data.goalTitle);
  const [goalDetails, setGoalDetailsLocal] = useState(data.goalDetails);
  const [targetDate, setTargetDate] = useState(data.targetDate);
  
  const avatarType = data.selectedAvatarType || 'base';
  const goalCategory = data.goalCategory || 'personal';
  const avatarName = data.avatarName || 'Companion';
  
  const AvatarComponent = getAvatarComponent(avatarType);
  const examples = getGoalExamples(goalCategory);
  
  const handleSave = () => {
    setGoalDetails(goalTitle, goalDetails, targetDate);
  };
  
  return (
    <OnboardingContainer step={2} gradient={['#f093fb', '#f5576c']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Define Your Goal</Text>
          <Text style={styles.subtitle}>
            Let's create a specific goal that {avatarName} can help you achieve
          </Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <AvatarComponent
            vitality={70}
            size={80}
            animated={true}
          />
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{avatarName}</Text>
            <Text style={styles.avatarMessage}>
              "I'm excited to help you achieve your {goalCategory} goal! Let's make it specific and inspiring! ✨"
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Goal Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Goal Title *</Text>
            <TextInput
              value={goalTitle}
              onChangeText={(text) => {
                setGoalTitle(text);
                handleSave();
              }}
              placeholder={examples[0]}
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={[
                styles.input,
                goalTitle.length > 0 && styles.inputValid
              ]}
              maxLength={100}
              autoCorrect={false}
              autoCapitalize="sentences"
              autoComplete="off"
              spellCheck={false}
            />
            <Text style={styles.characterCount}>{goalTitle.length}/100</Text>
          </View>

          {/* Target Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Target Date</Text>
            <TextInput
              value={targetDate}
              onChangeText={(text) => {
                setTargetDate(text);
                handleSave();
              }}
              placeholder="e.g., December 2024, Next summer, 6 months"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
            />
          </View>

          {/* Goal Details */}
          <View style={styles.field}>
            <Text style={styles.label}>More Details (Optional)</Text>
            <TextInput
              value={goalDetails}
              onChangeText={(text) => {
                setGoalDetailsLocal(text);
                handleSave();
              }}
              placeholder="Why is this goal important? What will success look like?"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Voice Note Section */}
          <View style={styles.voiceSection}>
            <Text style={styles.label}>Record a Voice Note (Optional)</Text>
            <Text style={styles.voiceDescription}>
              Share your motivation or thoughts about this goal
            </Text>
            <VoiceRecorder
              onRecordingComplete={(path) => setVoiceNote(path, 'goal')}
              existingRecording={data.voiceNotePath}
            />
          </View>
        </View>

        {/* Examples Section */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>💡 Example {goalCategory} goals:</Text>
          <View style={styles.examples}>
            {examples.map((example, index) => (
              <View key={index} style={styles.example}>
                <Text style={styles.exampleText}>• {example}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>🎯 Make it SMART:</Text>
          <View style={styles.tips}>
            <Text style={styles.tip}>• <Text style={styles.tipBold}>Specific:</Text> Clear and well-defined</Text>
            <Text style={styles.tip}>• <Text style={styles.tipBold}>Measurable:</Text> Track your progress</Text>
            <Text style={styles.tip}>• <Text style={styles.tipBold}>Achievable:</Text> Realistic and attainable</Text>
            <Text style={styles.tip}>• <Text style={styles.tipBold}>Relevant:</Text> Meaningful to you</Text>
            <Text style={styles.tip}>• <Text style={styles.tipBold}>Time-bound:</Text> Has a deadline</Text>
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
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  avatarInfo: {
    flex: 1,
    marginLeft: 16,
  },
  avatarName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  avatarMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputValid: {
    borderColor: '#22c55e',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#FFFFFF',
    opacity: 0.6,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  voiceSection: {
    marginTop: 8,
  },
  voiceDescription: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 12,
  },
  examplesSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  examplesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  examples: {
    gap: 8,
  },
  example: {
    // Example styles
  },
  exampleText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 100, // Space for bottom button
  },
  tipsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  tips: {
    gap: 8,
  },
  tip: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '700',
  },
});