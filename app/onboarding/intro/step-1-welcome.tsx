import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboarding';

export default function IntroWelcomeStep() {
  const { theme } = useTheme();
  const { nextIntroStep } = useOnboardingStore();
  const styles = createStyles(theme);

  const handleGetStarted = () => {
    console.log('Get Started button pressed');
    nextIntroStep();
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎯</Text>
          </View>
          <Text style={styles.title}>Welcome to{'\n'}AI Journal</Text>
          <Text style={styles.subtitle}>
            Your personal companion for building life-changing habits and achieving meaningful goals
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📝</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Journaling</Text>
              <Text style={styles.featureDescription}>
                AI-powered insights from your daily reflections
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Goal Tracking</Text>
              <Text style={styles.featureDescription}>
                Break down big dreams into actionable steps
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🌱</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Habit Building</Text>
              <Text style={styles.featureDescription}>
                Consistent small actions lead to big changes
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          🔒 Your data stays private and secure on your device
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  features: {
    gap: 20,
    marginVertical: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  privacyNote: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 20,
  },
});
