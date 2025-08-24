import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { router } from 'expo-router';

const modes = [
  {
    id: 'Companion' as const,
    title: 'Companion',
    subtitle: 'A supportive friend for your journey',
    description: 'Gentle encouragement and understanding. Perfect for self-reflection and personal growth.',
    icon: '🤝'
  },
  {
    id: 'Coach' as const, 
    title: 'Coach',
    subtitle: 'Direct accountability and guidance',
    description: 'Structured approach with clear goals. Ideal for achievement and breaking through barriers.',
    icon: '🎯'
  }
];

export default function WelcomeStep() {
  const { data, setMode } = useOnboardingStore();
  
  return (
    <OnboardingContainer step={1} gradient={['#667eea', '#764ba2']}>
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.title}>
            Welcome to Your{'\n'}AI Journal
          </Text>
          
          <Text style={styles.subtitle}>
            Choose how you&apos;d like your AI to support you
          </Text>
        </View>

        <Button title="Skip" onPress={() => {
          setMode('Coach');
          router.replace('/');
        }} />

        {/* Mode Selection */}
        <View style={styles.modes}>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              onPress={() => setMode(mode.id)}
              style={[
                styles.modeCard,
                data.mode === mode.id && styles.modeCardSelected
              ]}
            >
              <View style={styles.modeHeader}>
                <Text style={styles.modeIcon}>{mode.icon}</Text>
                <Text style={[
                  styles.modeTitle,
                  data.mode === mode.id && styles.modeTextSelected
                ]}>
                  {mode.title}
                </Text>
              </View>
              
              <Text style={[
                styles.modeSubtitle,
                data.mode === mode.id && styles.modeSubtitleSelected
              ]}>
                {mode.subtitle}
              </Text>
              
              <Text style={[
                styles.modeDescription,
                data.mode === mode.id && styles.modeTextSelected
              ]}>
                {mode.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </OnboardingContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  modes: {
    gap: 16,
  },
  modeCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#22C55E',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  modeSubtitleSelected: {
    color: '#22C55E',
  },
  modeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    lineHeight: 20,
  },
  modeTextSelected: {
    color: '#0F172A',
  },
});
