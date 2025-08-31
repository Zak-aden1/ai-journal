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

export default function YourWhyStep() {
  const { data, setDeepWhy, setVoiceNote } = useOnboardingStore();
  const [whyText, setWhyText] = useState(data.deepWhy);

  const avatarType = data.selectedAvatarType || 'base';
  const avatarName = data.avatarName || 'Companion';
  const goalTitle = data.goalTitle || 'your goal';
  
  const AvatarComponent = getAvatarComponent(avatarType);

  return (
    <OnboardingContainer step={4} gradient={['#4facfe', '#00f2fe']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Deeper Why</Text>
          <Text style={styles.subtitle}>
            What makes "{goalTitle}" truly meaningful to you?
          </Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <AvatarComponent
            vitality={80}
            size={80}
            animated={true}
          />
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{avatarName}</Text>
            <Text style={styles.avatarMessage}>
              "Understanding your 'why' will keep us motivated when things get tough. What's driving this goal? 💭"
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Deep Why Text */}
          <View style={styles.field}>
            <Text style={styles.label}>What's driving you? *</Text>
            <TextInput
              value={whyText}
              onChangeText={(text) => {
                setWhyText(text);
                setDeepWhy(text);
              }}
              placeholder="I want to achieve this because..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={[
                styles.input,
                whyText.length >= 10 && styles.inputValid
              ]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{whyText.length}/500</Text>
          </View>

          {/* Voice Note Section */}
          <View style={styles.voiceSection}>
            <Text style={styles.label}>Record Your Why (Optional)</Text>
            <Text style={styles.voiceDescription}>
              Sometimes speaking your motivation out loud makes it more powerful
            </Text>
            <VoiceRecorder
              onRecordingComplete={(path) => setVoiceNote(path, 'why')}
              existingRecording={data.whyVoicePath}
            />
          </View>
        </View>

        {/* Prompts Section */}
        <View style={styles.promptsSection}>
          <Text style={styles.promptsTitle}>💡 Need inspiration? Consider these questions:</Text>
          
          <View style={styles.prompts}>
            <View style={styles.prompt}>
              <Text style={styles.promptText}>
                • How will achieving this goal improve your life?
              </Text>
            </View>
            <View style={styles.prompt}>
              <Text style={styles.promptText}>
                • What would happen if you don't pursue this goal?
              </Text>
            </View>
            <View style={styles.prompt}>
              <Text style={styles.promptText}>
                • Who else will benefit when you achieve this?
              </Text>
            </View>
            <View style={styles.prompt}>
              <Text style={styles.promptText}>
                • What values does this goal represent for you?
              </Text>
            </View>
            <View style={styles.prompt}>
              <Text style={styles.promptText}>
                • How will you feel when you reach this goal?
              </Text>
            </View>
          </View>
        </View>

        {/* Examples Section */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Examples of powerful "whys":</Text>
          
          <View style={styles.examples}>
            <View style={styles.example}>
              <Text style={styles.exampleText}>
                "I want to be healthy so I can keep up with my kids and be a positive role model for them."
              </Text>
            </View>
            <View style={styles.example}>
              <Text style={styles.exampleText}>
                "Learning new skills will help me advance my career and provide better for my family."
              </Text>
            </View>
            <View style={styles.example}>
              <Text style={styles.exampleText}>
                "I want to prove to myself that I can achieve anything I set my mind to."
              </Text>
            </View>
          </View>
        </View>

        {/* Motivation Message */}
        <View style={styles.motivationSection}>
          <Text style={styles.motivationTitle}>Remember:</Text>
          <Text style={styles.motivationText}>
            Your "why" is what will fuel your consistency when motivation fades. 
            {avatarName} will remind you of this purpose throughout your journey! 🌟
          </Text>
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputValid: {
    borderColor: '#22c55e',
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
  promptsSection: {
    backgroundColor: 'rgba(139, 69, 19, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  promptsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  prompts: {
    gap: 8,
  },
  prompt: {
    marginBottom: 4,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
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
    gap: 12,
  },
  example: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  exampleText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  motivationSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 100, // Space for bottom button
  },
  motivationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  motivationText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
  },
});