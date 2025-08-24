import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Mood = '😊' | '😐' | '😔' | '😤' | '😍';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string, mood: Mood) => void;
}

const moods: Mood[] = ['😊', '😐', '😔', '😤', '😍'];

export function MicroReflectionSheet({ visible, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [reflection, setReflection] = useState('');

  const handleSave = () => {
    if (selectedMood && reflection.trim()) {
      onSave(reflection.trim(), selectedMood);
      // Reset state
      setSelectedMood(null);
      setReflection('');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to avoid visual glitch
    setTimeout(() => {
      setSelectedMood(null);
      setReflection('');
    }, 300);
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
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Quick Reflection</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[
                styles.saveButton, 
                (!selectedMood || !reflection.trim()) && styles.saveButtonDisabled
              ]}
              disabled={!selectedMood || !reflection.trim()}
            >
              <Text style={[
                styles.saveButtonText,
                (!selectedMood || !reflection.trim()) && styles.saveButtonTextDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.body}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How are you feeling?</Text>
              <View style={styles.moodGrid}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodButton,
                      selectedMood === mood && styles.moodButtonSelected
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text style={styles.moodEmoji}>{mood}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What&apos;s on your mind?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Share a quick thought about your progress..."
                placeholderTextColor={`${theme.colors.text.primary}60`}
                multiline
                numberOfLines={4}
                value={reflection}
                onChangeText={setReflection}
                textAlignVertical="top"
              />
            </View>

            {/* Habit context */}
            <View style={styles.contextCard}>
              <Text style={styles.contextTitle}>Great job completing your habit! 🎉</Text>
              <Text style={styles.contextText}>
                Every small step counts toward your bigger goals. How did it feel?
              </Text>
            </View>
          </View>
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
    borderBottomColor: theme.colors.background.tertiary,
  },
  closeButton: {
    paddingVertical: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    opacity: 0.7,
  },
  title: {
    ...theme.type.section,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: theme.colors.text.primary,
    opacity: 0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.type.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  moodGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.tertiary,
  },
  moodButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}20`,
  },
  moodEmoji: {
    fontSize: 24,
  },
  textInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  contextCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginTop: 'auto',
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  contextTitle: {
    ...theme.type.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  contextText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    opacity: 0.7,
    lineHeight: 20,
  },
});