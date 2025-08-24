import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

const goalCategories = [
  {
    id: 'health' as const,
    title: 'Health & Fitness',
    description: 'Build physical strength, improve wellness, and create healthy lifestyle habits',
    icon: '💪',
    examples: ['Exercise regularly', 'Eat healthier', 'Get better sleep', 'Stay hydrated'],
    avatarMatch: 'pet',
    gradient: ['#ef4444', '#f87171'],
    bgColor: 'rgba(239, 68, 68, 0.1)'
  },
  {
    id: 'learning' as const,
    title: 'Learning & Growth',
    description: 'Expand knowledge, develop new skills, and pursue educational goals',
    icon: '📚',
    examples: ['Read books', 'Learn a language', 'Take courses', 'Practice skills'],
    avatarMatch: 'plant',
    gradient: ['#3b82f6', '#60a5fa'],
    bgColor: 'rgba(59, 130, 246, 0.1)'
  },
  {
    id: 'career' as const,
    title: 'Career & Productivity',
    description: 'Advance professionally, boost productivity, and achieve work-related goals',
    icon: '💼',
    examples: ['Network professionally', 'Learn new tools', 'Complete projects', 'Improve skills'],
    avatarMatch: 'robot',
    gradient: ['#8b5cf6', '#a78bfa'],
    bgColor: 'rgba(139, 92, 246, 0.1)'
  },
  {
    id: 'personal' as const,
    title: 'Personal & Lifestyle',
    description: 'Develop personal interests, hobbies, and improve overall life satisfaction',
    icon: '🌟',
    examples: ['Practice mindfulness', 'Creative projects', 'Social connections', 'Self-care'],
    avatarMatch: 'base',
    gradient: ['#10b981', '#34d399'],
    bgColor: 'rgba(16, 185, 129, 0.1)'
  }
];

const getAvatarComponent = (type: string) => {
  switch (type) {
    case 'plant': return PlantAvatar;
    case 'pet': return PetAvatar;
    case 'robot': return RobotAvatar;
    default: return BaseAvatar;
  }
};

export default function GoalCategoryStep() {
  const { data, setGoalCategory } = useOnboardingStore();
  
  const renderCategoryCard = (category: typeof goalCategories[0]) => {
    const isSelected = data.goalCategory === category.id;
    const AvatarComponent = getAvatarComponent(category.avatarMatch);
    const isRecommended = data.selectedAvatarType === category.avatarMatch;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
          { backgroundColor: isSelected ? 'rgba(255,255,255,0.95)' : category.bgColor }
        ]}
        onPress={() => setGoalCategory(category.id)}
        activeOpacity={0.9}
      >
        {/* Recommended Badge */}
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>Recommended</Text>
          </View>
        )}
        
        {/* Header */}
        <View style={styles.categoryHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
          </View>
          
          <View style={styles.categoryInfo}>
            <Text style={[
              styles.categoryTitle,
              isSelected && styles.selectedText
            ]}>
              {category.title}
            </Text>
            <Text style={[
              styles.categoryDescription,
              isSelected && styles.selectedDescription
            ]}>
              {category.description}
            </Text>
          </View>
          
          {/* Avatar Preview */}
          <View style={styles.avatarPreview}>
            <AvatarComponent
              vitality={75}
              size={50}
              animated={false}
            />
          </View>
        </View>
        
        {/* Examples */}
        <View style={styles.examplesSection}>
          <Text style={[
            styles.examplesTitle,
            isSelected && styles.selectedDescription
          ]}>
            Example goals:
          </Text>
          <View style={styles.examples}>
            {category.examples.map((example, index) => (
              <View key={index} style={[
                styles.example,
                isSelected && styles.selectedExample
              ]}>
                <Text style={[
                  styles.exampleText,
                  isSelected && styles.selectedExampleText
                ]}>
                  {example}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Avatar Match Info */}
        {isRecommended && (
          <View style={styles.matchInfo}>
            <Text style={[
              styles.matchText,
              isSelected && styles.selectedDescription
            ]}>
              Perfect match for your {data.selectedAvatarType} companion!
            </Text>
          </View>
        )}
        
        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <OnboardingContainer step={4} gradient={['#667eea', '#764ba2']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Goal Category</Text>
          <Text style={styles.subtitle}>
            What area of your life would you like to focus on with {data.avatarName || 'your companion'}?
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {goalCategories.map(renderCategoryCard)}
        </View>
        
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why choose a category?</Text>
          <Text style={styles.infoText}>
            Categories help us suggest relevant habits and ensure your avatar companion is perfectly suited to support your specific goals.
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
    paddingBottom: 32,
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
  categoriesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 18,
  },
  avatarPreview: {
    // Avatar preview styles
  },
  selectedText: {
    color: '#1f2937',
  },
  selectedDescription: {
    color: '#6b7280',
  },
  examplesSection: {
    marginBottom: 12,
  },
  examplesTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '600',
    marginBottom: 8,
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  example: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedExample: {
    backgroundColor: '#22c55e',
  },
  exampleText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedExampleText: {
    color: '#FFFFFF',
  },
  matchInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  matchText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 100, // Space for bottom button
  },
  infoTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
  },
});