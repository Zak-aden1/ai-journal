import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboarding';

export default function IntroTransformStep() {
  const { theme } = useTheme();
  const { completeIntroFlow } = useOnboardingStore();
  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={['#fa709a', '#fee140']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>✨</Text>
            </View>
            <Text style={styles.title}>Ready to{'\n'}Transform?</Text>
            <Text style={styles.subtitle}>
              Let&apos;s create your personalized journey to success
            </Text>
          </View>

          {/* Journey Steps */}
          <View style={styles.journey}>
            <View style={styles.journeyStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Define Your Goal</Text>
                <Text style={styles.stepDescription}>
                  Tell us what you want to achieve and why it matters to you
                </Text>
              </View>
            </View>

            <View style={styles.journeyStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Build Your Habits</Text>
                <Text style={styles.stepDescription}>
                  Choose daily actions that will move you closer to your goal
                </Text>
              </View>
            </View>

            <View style={styles.journeyStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Track Progress</Text>
                <Text style={styles.stepDescription}>
                  Journal your journey and get AI-powered insights
                </Text>
              </View>
            </View>

            <View style={styles.journeyStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Achieve Success</Text>
                <Text style={styles.stepDescription}>
                  Celebrate your wins and set new ambitious goals
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>92%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>21</Text>
              <Text style={styles.statLabel}>Days to Habit</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>5min</Text>
              <Text style={styles.statLabel}>Daily Time</Text>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={completeIntroFlow}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Create My First Goal</Text>
          </TouchableOpacity>

          {/* Encouragement */}
          <Text style={styles.encouragement}>
            🚀 Your transformation starts now!
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
  journey: {
    marginBottom: 40,
    gap: 20,
  },
  journeyStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fa709a',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
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
    color: '#fa709a',
  },
  encouragement: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
