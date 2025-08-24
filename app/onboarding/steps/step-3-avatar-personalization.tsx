import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

const avatarPersonalities = {
  plant: {
    suggestions: ['Sage', 'Bloom', 'Willow', 'Fern', 'Ivy', 'Cedar'],
    traits: ['Patient', 'Wise', 'Nurturing', 'Growing'],
    defaultName: 'Sage'
  },
  pet: {
    suggestions: ['Buddy', 'Max', 'Luna', 'Charlie', 'Milo', 'Bella'],
    traits: ['Loyal', 'Energetic', 'Playful', 'Encouraging'],
    defaultName: 'Buddy'
  },
  robot: {
    suggestions: ['Apex', 'Nova', 'Zen', 'Logic', 'Byte', 'Quest'],
    traits: ['Analytical', 'Efficient', 'Smart', 'Logical'],
    defaultName: 'Apex'
  },
  base: {
    suggestions: ['Friend', 'Companion', 'Guide', 'Helper', 'Ally', 'Partner'],
    traits: ['Supportive', 'Adaptable', 'Reliable', 'Versatile'],
    defaultName: 'Friend'
  }
};

const getAvatarComponent = (type: string) => {
  switch (type) {
    case 'plant': return PlantAvatar;
    case 'pet': return PetAvatar;
    case 'robot': return RobotAvatar;
    default: return BaseAvatar;
  }
};

export default function AvatarPersonalizationStep() {
  const { data, setAvatarName } = useOnboardingStore();
  const [localName, setLocalName] = useState(data.avatarName || '');
  
  const avatarType = data.selectedAvatarType || 'base';
  const personality = avatarPersonalities[avatarType];
  const AvatarComponent = getAvatarComponent(avatarType);
  
  const handleNameChange = (name: string) => {
    setLocalName(name);
    setAvatarName(name);
  };
  
  const handleSuggestionSelect = (name: string) => {
    setLocalName(name);
    setAvatarName(name);
  };
  
  return (
    <OnboardingContainer step={1} gradient={['#667eea', '#764ba2']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meet Your Companion</Text>
          <Text style={styles.subtitle}>
            Give your companion a name and learn about their personality
          </Text>
        </View>

        {/* Avatar Display */}
        <View style={styles.avatarDisplay}>
          <View style={styles.avatarContainer}>
            <AvatarComponent
              vitality={80}
              size={120}
              animated={true}
            />
          </View>
          
          {/* Personality Traits */}
          <View style={styles.traitsContainer}>
            <Text style={styles.traitsTitle}>Personality Traits:</Text>
            <View style={styles.traits}>
              {personality.traits.map((trait, index) => (
                <View key={index} style={styles.trait}>
                  <Text style={styles.traitText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>What would you like to name your companion?</Text>
          
          <TextInput
            style={styles.nameInput}
            placeholder={`e.g., ${personality.defaultName}`}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={localName}
            onChangeText={handleNameChange}
            maxLength={20}
            autoCapitalize="words"
            autoCorrect={false}
          />
          
          {/* Character Count */}
          <Text style={styles.characterCount}>
            {localName.length}/20 characters
          </Text>
        </View>

        {/* Name Suggestions */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Or choose from suggestions:</Text>
          
          <View style={styles.suggestions}>
            {personality.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionButton,
                  localName === suggestion && styles.suggestionButtonSelected
                ]}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Text style={[
                  styles.suggestionText,
                  localName === suggestion && styles.suggestionTextSelected
                ]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        {localName.trim().length >= 2 && (
          <View style={styles.preview}>
            <View style={styles.previewBubble}>
              <Text style={styles.previewText}>
                "Hi! I'm {localName}. I'm excited to help you achieve your goals! 🌟"
              </Text>
            </View>
            <View style={styles.previewArrow} />
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Did you know?</Text>
          <Text style={styles.infoText}>
            Your companion's vitality will change based on your habit completion. The more consistent you are, the happier and healthier they become!
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
  avatarDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  traitsContainer: {
    alignItems: 'center',
  },
  traitsTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.9,
  },
  traits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  trait: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  traitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  nameSection: {
    marginBottom: 24,
  },
  nameLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  characterCount: {
    color: '#FFFFFF',
    opacity: 0.6,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  suggestionButtonSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: '#22c55e',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  preview: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  previewBubble: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    maxWidth: '90%',
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  previewArrow: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(34, 197, 94, 0.9)',
  },
  infoBox: {
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