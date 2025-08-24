import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { EnhancedGoalCard, GoalData } from './EnhancedGoalCard';
import { useTheme } from '@/hooks/useTheme';

// Sample goal data demonstrating different states and categories
const sampleGoals: GoalData[] = [
  {
    id: '1',
    title: 'Read 12 books this year',
    description: 'Expand my knowledge and improve focus through regular reading',
    progress: 75,
    level: 3,
    completedToday: 1,
    totalToday: 1,
    nextAction: 'Morning Reading Session',
    category: 'learning',
    avatar: {
      type: 'plant',
      name: 'Sage',
      vitality: 85,
    },
    streak: 14,
    targetDate: 'December 2024',
  },
  {
    id: '2',
    title: 'Mindful Living',
    description: 'Practice mindfulness and meditation daily',
    progress: 50,
    level: 3,
    completedToday: 1,
    totalToday: 2,
    nextAction: 'Morning Meditation',
    category: 'wellness',
    avatar: {
      type: 'pet',
      name: 'Buddy',
      vitality: 75,
    },
    streak: 7,
    targetDate: 'Ongoing',
  },
  {
    id: '3',
    title: 'Fitness Journey',
    description: 'Build strength and endurance through consistent exercise',
    progress: 30,
    level: 2,
    completedToday: 0,
    totalToday: 2,
    nextAction: 'Morning Workout',
    category: 'fitness',
    avatar: {
      type: 'robot',
      name: 'Apex',
      vitality: 45,
    },
    streak: 3,
    targetDate: 'June 2025',
  },
  {
    id: '4',
    title: 'Creative Expression',
    description: 'Explore creativity through art and writing',
    progress: 90,
    level: 4,
    completedToday: 2,
    totalToday: 2,
    nextAction: 'Evening Sketching',
    category: 'creativity',
    avatar: {
      type: 'base',
      name: 'Muse',
      vitality: 95,
    },
    streak: 21,
    targetDate: 'Ongoing',
  },
];

export function GoalShowcase() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [layoutMode, setLayoutMode] = useState<'detailed' | 'compact'>('detailed');
  
  const handleGoalPress = (goalId: string) => {
    console.log(`Goal pressed: ${goalId}`);
    // Navigate to goal detail screen
  };
  
  const handleAvatarPress = (goalId: string) => {
    console.log(`Avatar pressed for goal: ${goalId}`);
    // Show avatar interaction modal
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Goal Cards</Text>
        <Text style={styles.subtitle}>Avatar-powered goal tracking with personality</Text>
        
        {/* Layout Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              layoutMode === 'detailed' && styles.toggleButtonActive
            ]}
            onPress={() => setLayoutMode('detailed')}
          >
            <Text style={[
              styles.toggleText,
              layoutMode === 'detailed' && styles.toggleTextActive
            ]}>
              Detailed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              layoutMode === 'compact' && styles.toggleButtonActive
            ]}
            onPress={() => setLayoutMode('compact')}
          >
            <Text style={[
              styles.toggleText,
              layoutMode === 'compact' && styles.toggleTextActive
            ]}>
              Compact
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sampleGoals.map((goal) => (
          <EnhancedGoalCard
            key={goal.id}
            goal={goal}
            layout={layoutMode}
            onPress={() => handleGoalPress(goal.id)}
            onAvatarPress={() => handleAvatarPress(goal.id)}
          />
        ))}
        
        {/* Features Overview */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>🌟 Enhanced Features</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🤖</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personality-Driven Responses</Text>
              <Text style={styles.featureDescription}>
                Each avatar type provides unique, contextual encouragement based on your progress and patterns.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🧠</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Memory & Pattern Recognition</Text>
              <Text style={styles.featureDescription}>
                Avatars remember your achievements, recognize your best performance times, and provide personalized insights.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎨</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Category-Aware Design</Text>
              <Text style={styles.featureDescription}>
                Different color schemes and visual treatments for fitness, wellness, learning, and creativity goals.
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Adaptive Layouts</Text>
              <Text style={styles.featureDescription}>
                Switch between detailed cards for focused viewing and compact cards for efficient goal management.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: theme.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  toggleTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  featuresContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
});