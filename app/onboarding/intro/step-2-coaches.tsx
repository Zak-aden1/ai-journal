import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboarding';

export default function IntroCoachesStep() {
  const { theme } = useTheme();
  const { nextIntroStep } = useOnboardingStore();
  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🤖</Text>
            </View>
            <Text style={styles.title}>Meet Your{'\n'}AI Coaches</Text>
            <Text style={styles.subtitle}>
              Choose the coaching style that motivates you best
            </Text>
          </View>

          {/* Coaches */}
          <View style={styles.coaches}>
            {/* Companion Coach */}
            <View style={styles.coachCard}>
              <View style={styles.coachHeader}>
                <Text style={styles.coachIcon}>🤗</Text>
                <Text style={styles.coachName}>The Companion</Text>
              </View>
              <Text style={styles.coachDescription}>
                A supportive friend for your journey. Offers gentle encouragement, celebrates your wins, and provides comfort during challenges.
              </Text>
              <View style={styles.coachFeatures}>
                <Text style={styles.coachFeature}>• Gentle reminders</Text>
                <Text style={styles.coachFeature}>• Positive reinforcement</Text>
                <Text style={styles.coachFeature}>• Empathetic responses</Text>
                <Text style={styles.coachFeature}>• Celebrates small wins</Text>
              </View>
            </View>

            {/* Coach */}
            <View style={styles.coachCard}>
              <View style={styles.coachHeader}>
                <Text style={styles.coachIcon}>💪</Text>
                <Text style={styles.coachName}>The Coach</Text>
              </View>
              <Text style={styles.coachDescription}>
                Direct accountability and tough love. Pushes you to stay committed, calls out excuses, and keeps you focused on results.
              </Text>
              <View style={styles.coachFeatures}>
                <Text style={styles.coachFeature}>• Direct feedback</Text>
                <Text style={styles.coachFeature}>• Accountability checks</Text>
                <Text style={styles.coachFeature}>• Challenge-focused</Text>
                <Text style={styles.coachFeature}>• Results-oriented</Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={nextIntroStep}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>That sounds amazing</Text>
          </TouchableOpacity>

          {/* Note */}
          <Text style={styles.note}>
            Don&apos;t worry - you can change your coaching style anytime in settings
          </Text>
        </View>
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
  content: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 50,
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
  coaches: {
    gap: 20,
    marginBottom: 40,
  },
  coachCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  coachName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coachDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 24,
    marginBottom: 16,
  },
  coachFeatures: {
    gap: 8,
  },
  coachFeature: {
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
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4facfe',
  },
  note: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
  },
});
