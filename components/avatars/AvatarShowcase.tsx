import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BaseAvatar } from './BaseAvatar';
import { PlantAvatar } from './PlantAvatar';
import { PetAvatar } from './PetAvatar';
import { RobotAvatar } from './RobotAvatar';

export function AvatarShowcase() {
  const [selectedVitality, setSelectedVitality] = useState(75);
  
  const vitalityLevels = [
    { value: 10, label: 'Critical', color: '#dc2626' },
    { value: 25, label: 'Low', color: '#f59e0b' },
    { value: 50, label: 'Medium', color: '#3b82f6' },
    { value: 75, label: 'High', color: '#10b981' },
    { value: 95, label: 'Perfect', color: '#8b5cf6' },
  ];
  
  const avatarTypes = [
    { component: BaseAvatar, name: 'Basic Avatar' },
    { component: PlantAvatar, name: 'Plant Avatar' },
    { component: PetAvatar, name: 'Pet Avatar' },
    { component: RobotAvatar, name: 'Robot Avatar' },
  ];
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Avatar Showcase</Text>
      <Text style={styles.subtitle}>Different personalities and vitality states</Text>
      
      {/* Vitality Level Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>Vitality Level: {selectedVitality}%</Text>
        <View style={styles.buttonRow}>
          {vitalityLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.vitalityButton,
                { 
                  backgroundColor: level.color,
                  opacity: selectedVitality === level.value ? 1 : 0.6 
                }
              ]}
              onPress={() => setSelectedVitality(level.value)}
            >
              <Text style={styles.buttonText}>{level.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Avatar Grid */}
      <View style={styles.avatarGrid}>
        {avatarTypes.map((avatar, index) => {
          const AvatarComponent = avatar.component;
          return (
            <View key={index} style={styles.avatarCard}>
              <AvatarComponent
                vitality={selectedVitality}
                size={100}
                animated={true}
              />
              <Text style={styles.avatarName}>{avatar.name}</Text>
            </View>
          );
        })}
      </View>
      
      {/* Usage Example */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>Usage Example:</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`import { PlantAvatar } from '@/components/avatars';

<PlantAvatar 
  vitality={${selectedVitality}} 
  size={120} 
  animated={true} 
/>`}
          </Text>
        </View>
      </View>
      
      {/* Features List */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Features:</Text>
        <Text style={styles.feature}>• Reactive animations based on vitality level</Text>
        <Text style={styles.feature}>• Different personalities (Plant, Pet, Robot, Basic)</Text>
        <Text style={styles.feature}>• 5 distinct emotional states</Text>
        <Text style={styles.feature}>• Customizable size and styling</Text>
        <Text style={styles.feature}>• Smooth transitions and effects</Text>
        <Text style={styles.feature}>• Built with Reanimated for performance</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  selectorContainer: {
    marginBottom: 32,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  vitalityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 32,
  },
  avatarCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  exampleContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  code: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 18,
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
});