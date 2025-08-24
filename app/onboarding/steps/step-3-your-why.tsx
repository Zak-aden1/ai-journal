import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { VoiceRecorder } from '@/components/VoiceRecorder';

export default function YourWhyStep() {
  const { data, setDeepWhy, setVoiceNote } = useOnboardingStore();
  const [whyText, setWhyText] = useState(data.deepWhy);

  return (
    <OnboardingContainer step={3} gradient={['#4facfe', '#00f2fe']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Deeper Why</Text>
          <Text style={styles.subtitle}>
            What makes this goal truly meaningful to you?
          </Text>
        </View>

        <View style={styles.form}>
          {/* Deep Why Text */}
          <View style={styles.field}>
            <Text style={styles.label}>What&apos;s driving you? *</Text>
            <TextInput
              value={whyText}
              onChangeText={(text) => {
                setWhyText(text);
                setDeepWhy(text);
              }}
              placeholder="Share what makes this goal important to you..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              numberOfLines={5}
              style={[
                styles.input,
                styles.textArea,
                whyText.length >= 10 && styles.inputValid
              ]}
            />
            <Text style={styles.hint}>
              {whyText.length}/10 characters minimum
            </Text>
          </View>

          {/* Voice Message */}
          <View style={styles.field}>
            <Text style={styles.label}>Message to Future You (Optional)</Text>
            <Text style={styles.hint}>
              Record a personal message to listen to when you need motivation
            </Text>
            <VoiceRecorder
              onSaved={(path: string) => setVoiceNote(path, 'why')}
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
