import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

const avatarTypes = [
  {
    type: 'plant' as const,
    title: 'Plant Companion',
    subtitle: 'Grows with your progress',
    description: 'A gentle, nurturing companion that blooms as you build healthy habits. Perfect for wellness and personal growth goals.',
    component: PlantAvatar,
    personality: 'Wise and patient, grows beautifully with care',
    bestFor: ['Wellness', 'Mindfulness', 'Learning'],
    gradient: ['#10b981', '#34d399']
  },
  {
    type: 'pet' as const,
    title: 'Pet Companion',
    subtitle: 'Your loyal motivational friend',
    description: 'An energetic, loyal companion that celebrates your wins and encourages you through challenges. Great for fitness and active goals.',
    component: PetAvatar,
    personality: 'Playful and encouraging, always by your side',
    bestFor: ['Fitness', 'Health', 'Active Goals'],
    gradient: ['#3b82f6', '#60a5fa']
  },
  {
    type: 'robot' as const,
    title: 'Robot Companion',
    subtitle: 'Your analytical achievement partner',
    description: 'A logical, systematic companion that helps you optimize and track progress. Ideal for skill-building and productivity goals.',
    component: RobotAvatar,
    personality: 'Smart and analytical, loves optimization',
    bestFor: ['Learning', 'Career', 'Productivity'],
    gradient: ['#8b5cf6', '#a78bfa']
  },
  {
    type: 'base' as const,
    title: 'Classic Companion',
    subtitle: 'Simple and supportive',
    description: 'A versatile, friendly companion that adapts to any goal. Clean and minimal design for those who prefer simplicity.',
    component: BaseAvatar,
    personality: 'Adaptable and supportive, fits any journey',
    bestFor: ['Any Goal', 'Minimalist', 'Versatile'],
    gradient: ['#6b7280', '#9ca3af']
  }
];

export default function AvatarSelectionStep() {
  const { data, setAvatarType } = useOnboardingStore();
  
  return (
    <OnboardingContainer step={2} gradient={['#667eea', '#764ba2']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Companion</Text>
          <Text style={styles.subtitle}>
            Your avatar will grow and evolve as you build habits and achieve your goals
          </Text>
        </View>

        {/* Avatar Options */}
        <View style={styles.avatarGrid}>
          {avatarTypes.map((avatar) => (
            <TouchableOpacity
              key={avatar.type}
              style={[
                styles.avatarCard,
                data.selectedAvatarType === avatar.type && styles.avatarCardSelected
              ]}
              onPress={() => setAvatarType(avatar.type)}
              activeOpacity={0.9}
            >
              {/* Avatar Preview */}
              <View style={styles.avatarPreview}>
                <avatar.component
                  vitality={75}
                  size={80}
                  animated={true}
                />
              </View>
              
              {/* Avatar Info */}
              <View style={styles.avatarInfo}>
                <Text style={[
                  styles.avatarTitle,
                  data.selectedAvatarType === avatar.type && styles.selectedText
                ]}>
                  {avatar.title}
                </Text>
                <Text style={[
                  styles.avatarSubtitle,
                  data.selectedAvatarType === avatar.type && styles.selectedSubtitle
                ]}>
                  {avatar.subtitle}
                </Text>
                <Text style={[
                  styles.avatarDescription,
                  data.selectedAvatarType === avatar.type && styles.selectedDescription
                ]}>
                  {avatar.description}
                </Text>
                
                {/* Best For Tags */}
                <View style={styles.tagsContainer}>
                  <Text style={[
                    styles.tagsLabel,
                    data.selectedAvatarType === avatar.type && styles.selectedDescription
                  ]}>
                    Best for:
                  </Text>
                  <View style={styles.tags}>
                    {avatar.bestFor.map((tag, index) => (
                      <View key={index} style={[
                        styles.tag,
                        data.selectedAvatarType === avatar.type && styles.selectedTag
                      ]}>
                        <Text style={[
                          styles.tagText,
                          data.selectedAvatarType === avatar.type && styles.selectedTagText
                        ]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Selection Indicator */}
              {data.selectedAvatarType === avatar.type && (
                <View style={styles.selectionIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Preview Message */}
        {data.selectedAvatarType && (
          <View style={styles.previewMessage}>
            <Text style={styles.previewText}>
              Great choice! Your {avatarTypes.find(a => a.type === data.selectedAvatarType)?.title.toLowerCase()} will be excited to start this journey with you.
            </Text>
          </View>
        )}
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
  avatarGrid: {
    gap: 20,
    paddingBottom: 100, // Space for bottom button
  },
  avatarCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInfo: {
    alignItems: 'center',
  },
  avatarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  avatarSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  avatarDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectedText: {
    color: '#1f2937',
  },
  selectedSubtitle: {
    color: '#4b5563',
  },
  selectedDescription: {
    color: '#6b7280',
  },
  tagsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  tagsLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 8,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedTag: {
    backgroundColor: '#22c55e',
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedTagText: {
    color: '#FFFFFF',
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
  previewMessage: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
});