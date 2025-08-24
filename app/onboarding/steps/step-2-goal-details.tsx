import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

export default function GoalDetailsStep() {
  const { data, setGoalDetails, setVoiceNote } = useOnboardingStore();
  const [goalTitle, setGoalTitle] = useState(data.goalTitle);
  const [goalDetails, setGoalDetailsLocal] = useState(data.goalDetails);
  const [targetDate, setTargetDate] = useState(data.targetDate);
  
  const handleSave = () => {
    setGoalDetails(goalTitle, goalDetails, targetDate);
  };
  
  return (
    <OnboardingContainer step={2} gradient={['#f093fb', '#f5576c']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What&apos;s your goal?</Text>
          <Text style={styles.subtitle}>
            Be specific about what you want to achieve
          </Text>
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
              placeholder="e.g., Read 12 books this year"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={[
                styles.input,
                goalTitle.length > 0 && styles.inputValid
              ]}
            />
          </View>

          {/* Target Date */}
          <View style={styles.field}>
            <Text style={styles.label}>When do you want to achieve this?</Text>
            <TextInput
              value={targetDate}
              onChangeText={(text) => {
                setTargetDate(text);
                handleSave();
              }}
              placeholder="e.g., December 2024"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
            />
          </View>

          {/* Additional Details */}
          <View style={styles.field}>
            <Text style={styles.label}>Additional Details (Optional)</Text>
            <TextInput
              value={goalDetails}
              onChangeText={(text) => {
                setGoalDetailsLocal(text);
                handleSave();
              }}
              placeholder="Any specific details about your goal..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.textArea]}
            />
          </View>

          {/* Voice Recording */}
          <View style={styles.field}>
            <Text style={styles.label}>Voice Note (Optional)</Text>
            <Text style={styles.hint}>
              Record a quick note about this goal
            </Text>
            <VoiceRecorder
              onSaved={(path: string) => setVoiceNote(path, 'goal')}
            />
          </View>
        </View>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  form: {
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputValid: {
    borderColor: '#22C55E',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
