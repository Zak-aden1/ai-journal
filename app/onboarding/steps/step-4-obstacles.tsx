import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { Chip } from '@/components/Chip';

const commonObstacles = [
  'time',
  'motivation',
  'consistency',
  'focus',
  'energy',
  'stress',
  'distractions'
];

const suggestedHabits = [
  'Daily progress check',
  'Morning routine',
  'Evening reflection',
  'Weekly planning',
  'Accountability partner'
];

export default function ObstaclesStep() {
  const { data, addObstacle, removeObstacle, addHabit, removeHabit } = useOnboardingStore();
  const [customText, setCustomText] = useState('');
  const [customHabit, setCustomHabit] = useState('');

  function handleAddCustom(type: 'obstacle' | 'habit') {
    const text = type === 'obstacle' ? customText : customHabit;
    if (!text.trim()) return;

    if (type === 'obstacle') {
      addObstacle(text.trim());
      setCustomText('');
    } else {
      addHabit(text.trim());
      setCustomHabit('');
    }
  }

  return (
    <OnboardingContainer step={4} gradient={['#43e97b', '#38f9d7']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Obstacles & Habits</Text>
          <Text style={styles.subtitle}>
            Let&apos;s prepare for challenges and build supporting habits
          </Text>
        </View>

        <View style={styles.form}>
          {/* Obstacles */}
          <View style={styles.section}>
            <Text style={styles.label}>What might get in your way?</Text>
            <View style={styles.chips}>
              {commonObstacles.map((obstacle) => (
                <Chip
                  key={obstacle}
                  label={obstacle}
                  selected={data.selectedObstacles.includes(obstacle)}
                  onPress={() => {
                    if (data.selectedObstacles.includes(obstacle)) {
                      removeObstacle(obstacle);
                    } else {
                      addObstacle(obstacle);
                    }
                  }}
                />
              ))}
            </View>
            
            <View style={styles.customInput}>
              <TextInput
                value={customText}
                onChangeText={setCustomText}
                placeholder="Add custom obstacle..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.input}
              />
              <TouchableOpacity
                style={[styles.addButton, !customText.trim() && styles.addButtonDisabled]}
                onPress={() => handleAddCustom('obstacle')}
                disabled={!customText.trim()}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Habits */}
          <View style={styles.section}>
            <Text style={styles.label}>Select supporting habits *</Text>
            <Text style={styles.hint}>Choose habits that will help you overcome obstacles</Text>
            
            <View style={styles.chips}>
              {suggestedHabits.map((habit) => (
                <Chip
                  key={habit}
                  label={habit}
                  selected={data.selectedHabits.includes(habit)}
                  onPress={() => {
                    if (data.selectedHabits.includes(habit)) {
                      removeHabit(habit);
                    } else {
                      addHabit(habit);
                    }
                  }}
                />
              ))}
            </View>
            
            <View style={styles.customInput}>
              <TextInput
                value={customHabit}
                onChangeText={setCustomHabit}
                placeholder="Add custom habit..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.input}
              />
              <TouchableOpacity
                style={[styles.addButton, !customHabit.trim() && styles.addButtonDisabled]}
                onPress={() => handleAddCustom('habit')}
                disabled={!customHabit.trim()}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
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
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  customInput: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  addButton: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#0F172A',
    fontWeight: '600',
  },
});
