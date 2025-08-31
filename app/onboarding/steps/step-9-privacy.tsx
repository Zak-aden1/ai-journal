import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Toggle } from '@/components/onboarding/Toggle';
import { Chip } from '@/components/onboarding/Chip';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

const moods: ('😊'|'😐'|'😔'|'😤'|'😍')[] = ['😊', '😐', '😔', '😤', '😍'];

const getAvatarComponent = (type: string) => {
  switch (type) {
    case 'plant': return PlantAvatar;
    case 'pet': return PetAvatar;
    case 'robot': return RobotAvatar;
    default: return BaseAvatar;
  }
};

export default function PrivacyStep() {
  const { data, setPrivacy, setFirstCheckIn } = useOnboardingStore();
  const [entry, setEntry] = React.useState(data.firstEntry);

  const avatarType = data.selectedAvatarType || 'base';
  const avatarName = data.avatarName || 'Companion';
  const goalTitle = data.goalTitle || 'your goal';
  
  const AvatarComponent = getAvatarComponent(avatarType);

  return (
    <OnboardingContainer step={6} gradient={['#fa709a', '#fee140']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Privacy & First Check-in</Text>
          <Text style={styles.subtitle}>
            Configure your privacy settings and share your first thoughts with {avatarName}
          </Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <AvatarComponent
            vitality={85}
            size={80}
            animated={true}
          />
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{avatarName}</Text>
            <Text style={styles.avatarMessage}>
              "Your privacy is important! Let's set up your preferences and then I'd love to hear how you're feeling about starting this journey! 🔒✨"
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Privacy Settings */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Privacy Settings</Text>
            
            <View style={styles.privacyCard}>
              <Toggle
                label="Local-only Storage"
                description="Keep all data on your device only"
                value={data.privacy.localOnly}
                onValueChange={(value) => setPrivacy('localOnly', value)}
              />
              
              <Toggle
                label="Voice Recording"
                description="Allow voice notes and recordings"
                value={data.privacy.voiceRecording}
                onValueChange={(value) => setPrivacy('voiceRecording', value)}
              />
            </View>
            
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyTitle}>Your Data Security:</Text>
              <Text style={styles.privacyText}>
                • All journal entries are encrypted on your device
              </Text>
              <Text style={styles.privacyText}>
                • {avatarName} and your progress data stays completely private
              </Text>
              <Text style={styles.privacyText}>
                • No data is shared without your explicit consent
              </Text>
            </View>
          </View> */}

          {/* First Check-in */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💭 First Check-in with {avatarName}</Text>
            
            {/* Mood Selection */}
            <View style={styles.moodSection}>
              <Text style={styles.label}>How are you feeling about "{goalTitle}"?</Text>
              <View style={styles.moods}>
                {moods.map((mood) => (
                  <Chip
                    key={mood}
                    label={mood}
                    selected={data.firstMood === mood}
                    onPress={() => setFirstCheckIn(mood, entry)}
                  />
                ))}
              </View>
            </View>

            {/* Journal Entry */}
            <View style={styles.entrySection}>
              <Text style={styles.label}>Share your thoughts and feelings *</Text>
              <TextInput
                value={entry}
                onChangeText={(text) => {
                  setEntry(text);
                  setFirstCheckIn(data.firstMood, text);
                }}
                placeholder={`Tell ${avatarName} how you're feeling about starting this journey...`}
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={[
                  styles.textArea,
                  entry.length > 0 && styles.textAreaValid
                ]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.characterCount}>{entry.length}/300</Text>
            </View>
          </View>

          {/* Journey Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>🌟 Your Journey Summary</Text>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Companion:</Text>
                <Text style={styles.summaryValue}>{avatarName} ({avatarType})</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Goal:</Text>
                <Text style={styles.summaryValue}>{goalTitle}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Category:</Text>
                <Text style={styles.summaryValue}>{data.goalCategory}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Target:</Text>
                <Text style={styles.summaryValue}>{data.targetDate || 'Flexible timeline'}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Habits:</Text>
                <Text style={styles.summaryValue}>{data.selectedHabits.length} selected</Text>
              </View>
            </View>
          </View>

          {/* Ready Message */}
          <View style={styles.readySection}>
            <Text style={styles.readyTitle}>🎉 Ready to Begin!</Text>
            <Text style={styles.readyText}>
              {avatarName} is excited to start this journey with you! Complete this step to begin building habits and watching your companion grow. ✨
            </Text>
          </View>
        </View>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  container: {
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
    gap: 24,
    paddingBottom: 40, // Space for bottom content
  },
  section: {
    // Section styles
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  privacyCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  privacyInfo: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  privacyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  privacyText: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.9,
    lineHeight: 18,
    marginBottom: 4,
  },
  moodSection: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moods: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  entrySection: {
    // Entry section styles
  },
  textArea: {
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
  textAreaValid: {
    borderColor: '#22c55e',
  },
  characterCount: {
    color: '#FFFFFF',
    opacity: 0.6,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  summarySection: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryCard: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  readySection: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 20,
  },
  readyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  readyText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.95,
  },
});