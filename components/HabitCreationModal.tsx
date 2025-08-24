import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';

interface HabitCreationModalProps {
  visible: boolean;
  onClose: () => void;
  initialGoalId?: string | null;
}


export function HabitCreationModal({ visible, onClose, initialGoalId }: HabitCreationModalProps) {
  const { theme } = useTheme();
  const { addHabit, goalsWithIds } = useAppStore();
  
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialGoalId ?? null);
  const [isStandalone, setIsStandalone] = useState(initialGoalId === null);
  const [isSaving, setIsSaving] = useState(false);

  // Use real goals data from store
  const availableGoals = goalsWithIds;

  const styles = createStyles(theme);

  const resetForm = () => {
    setHabitTitle('');
    setHabitDescription('');
    setSelectedGoalId(initialGoalId ?? null);
    setIsStandalone(initialGoalId === null);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!habitTitle.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    setIsSaving(true);
    try {
      const goalId = isStandalone ? null : selectedGoalId;
      await addHabit(goalId, habitTitle.trim());
      
      Alert.alert('Success', 'Habit created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalSelection = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsStandalone(false);
  };

  const handleStandaloneToggle = () => {
    setIsStandalone(true);
    setSelectedGoalId(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose}
              disabled={isSaving}
              style={styles.headerButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>New Habit</Text>
            
            <TouchableOpacity 
              onPress={handleSave}
              disabled={!habitTitle.trim() || isSaving}
              style={[
                styles.headerButton,
                styles.saveButton,
                (!habitTitle.trim() || isSaving) && styles.saveButtonDisabled
              ]}
            >
              <Text style={[
                styles.saveText,
                (!habitTitle.trim() || isSaving) && styles.saveTextDisabled
              ]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Habit Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Habit Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Read for 30 minutes"
                value={habitTitle}
                onChangeText={setHabitTitle}
                autoFocus
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details about your habit..."
                value={habitDescription}
                onChangeText={setHabitDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>

            {/* Goal Assignment */}
            <View style={styles.section}>
              <Text style={styles.label}>Link to Goal</Text>
              <Text style={styles.helperText}>
                Choose a goal this habit supports, or keep it as a standalone habit
              </Text>

              {/* Standalone Option */}
              <TouchableOpacity 
                style={[
                  styles.goalOption,
                  isStandalone && styles.goalOptionSelected
                ]}
                onPress={handleStandaloneToggle}
              >
                <View style={styles.goalOptionContent}>
                  <View style={styles.goalIcon}>
                    <Text style={styles.goalEmoji}>🌟</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>Standalone Habit</Text>
                    <Text style={styles.goalSubtitle}>General wellness habit</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioButton,
                  isStandalone && styles.radioButtonSelected
                ]}>
                  {isStandalone && <View style={styles.radioButtonInner} />}
                </View>
              </TouchableOpacity>

              {/* Goal Options */}
              {availableGoals.map((goal) => (
                <TouchableOpacity 
                  key={goal.id}
                  style={[
                    styles.goalOption,
                    selectedGoalId === goal.id && !isStandalone && styles.goalOptionSelected
                  ]}
                  onPress={() => handleGoalSelection(goal.id)}
                >
                  <View style={styles.goalOptionContent}>
                    <View style={styles.goalIcon}>
                      <Text style={styles.goalEmoji}>🎯</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalSubtitle}>Active goal</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedGoalId === goal.id && !isStandalone && styles.radioButtonSelected
                  ]}>
                    {selectedGoalId === goal.id && !isStandalone && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Future Features Preview */}
            <View style={styles.section}>
              <Text style={styles.previewLabel}>Coming Soon</Text>
              <View style={styles.previewFeatures}>
                <Text style={styles.previewFeature}>📅 Scheduling & Reminders</Text>
                <Text style={styles.previewFeature}>🔥 Difficulty & Duration</Text>
                <Text style={styles.previewFeature}>🎨 Custom Icons</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  headerButton: {
    paddingVertical: theme.spacing.sm,
    minWidth: 60,
  },
  cancelText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  saveButton: {
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: theme.colors.interactive.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: theme.colors.text.muted,
  },
  form: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  goalOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalOptionSelected: {
    borderColor: theme.colors.interactive.primary,
    backgroundColor: theme.colors.interactive.primary + '10',
  },
  goalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  goalEmoji: {
    fontSize: 18,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.interactive.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.interactive.primary,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  previewFeatures: {
    backgroundColor: theme.colors.background.secondary + '50',
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  previewFeature: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.xs,
  },
});