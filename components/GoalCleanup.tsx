import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAppStore } from '@/stores/app';
import { listGoals } from '@/lib/db';

// Known dummy goal patterns
const DUMMY_GOAL_PATTERNS = [
  /^demo-/i,
  'Run a 5K Marathon',
  'Daily Mindfulness', 
  'Learn Spanish',
  'Creative Writing'
];

function isDummyGoal(goalId: string, goalTitle: string): boolean {
  return DUMMY_GOAL_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(goalId);
    }
    return goalTitle === pattern;
  });
}

export function GoalCleanup() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteGoal } = useAppStore();

  const handleCleanup = async () => {
    try {
      setIsDeleting(true);
      
      // Get all goals
      const allGoals = await listGoals();
      
      // Identify real goals to delete
      const realGoals = allGoals.filter(goal => 
        !isDummyGoal(goal.id, goal.title)
      );
      
      if (realGoals.length === 0) {
        Alert.alert('No Goals to Delete', 'No real goals found to delete!');
        return;
      }
      
      // Show confirmation
      const goalList = realGoals.map(g => `• ${g.title}`).join('\n');
      
      Alert.alert(
        'Delete Real Goals?',
        `This will delete ${realGoals.length} real goals and keep the dummy ones:\n\n${goalList}\n\nThis action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              try {
                for (const goal of realGoals) {
                  await deleteGoal(goal.id);
                }
                
                Alert.alert(
                  'Success!', 
                  `Deleted ${realGoals.length} real goals. Dummy goals have been preserved.`
                );
              } catch (error) {
                Alert.alert('Error', `Failed to delete goals: ${error}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to load goals: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, isDeleting && styles.buttonDisabled]} 
        onPress={handleCleanup}
        disabled={isDeleting}
      >
        <Text style={styles.buttonText}>
          {isDeleting ? 'Cleaning up...' : 'Delete Real Goals (Keep Dummy)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});