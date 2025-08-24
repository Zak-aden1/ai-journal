import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Toggle } from '@/components/onboarding/Toggle';
import { Chip } from '@/components/onboarding/Chip';

const moods: ('😊'|'😐'|'😔'|'😤'|'😍')[] = ['😊', '😐', '😔', '😤', '😍'];

export default function PrivacyStep() {
  const { data, setPrivacy, setFirstCheckIn } = useOnboardingStore();
  const [entry, setEntry] = React.useState(data.firstEntry);

  return (
    <OnboardingContainer step={5} gradient={['#fa709a', '#fee140']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy & First Check-in</Text>
          <Text style={styles.subtitle}>
            Configure your privacy settings and complete your first journal entry
          </Text>
        </View>

        <View style={styles.form}>
          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={styles.label}>Privacy Settings</Text>
            
            <Toggle
              label="Local-only Storage"
              sublabel="Keep all data on your device only"
              value={data.privacy.localOnly}
              onToggle={() => setPrivacy('localOnly', !data.privacy.localOnly)}
            />
            
            <Toggle
              label="Voice Recording Storage"
              sublabel="Allow storing voice messages locally"
              value={data.privacy.voiceRecording}
              onToggle={() => setPrivacy('voiceRecording', !data.privacy.voiceRecording)}
            />
          </View>

          {/* First Check-in */}
          <View style={styles.section}>
            <Text style={styles.label}>How are you feeling about this goal? *</Text>
            
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

            <TextInput
              value={entry}
              onChangeText={(text) => {
                setEntry(text);
                if (data.firstMood) {
                  setFirstCheckIn(data.firstMood, text);
                }
              }}
              placeholder="Share your thoughts about starting this journey..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
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
    gap: 32,
  },
  section: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
