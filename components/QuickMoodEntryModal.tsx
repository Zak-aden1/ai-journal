import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

type Mood = '😊' | '😐' | '😔' | '😤' | '😍';

interface QuickMoodEntryModalProps {
  visible: boolean;
  mood: Mood | null;
  moodLabel: string;
  onClose: () => void;
  onSave: (mood: Mood, text?: string) => void;
}

export function QuickMoodEntryModal({ 
  visible, 
  mood, 
  moodLabel, 
  onClose, 
  onSave 
}: QuickMoodEntryModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [text, setText] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300)); // Start 300px below screen

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      setText('');
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleQuickSave = async () => {
    if (!mood) return;
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(mood);
    onClose();
  };

  const handleSaveWithText = async () => {
    if (!mood) return;
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(mood, text.trim() || undefined);
    onClose();
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!mood) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.moodDisplay}>
                  <Text style={styles.moodEmoji}>{mood}</Text>
                  <Text style={styles.moodLabel}>{moodLabel}</Text>
                </View>
                <Text style={styles.title}>Quick Entry</Text>
              </View>

              {/* Quick Save Button */}
              <TouchableOpacity 
                style={styles.quickSaveButton}
                onPress={handleQuickSave}
                activeOpacity={0.8}
              >
                <View style={styles.quickSaveContent}>
                  <Text style={styles.quickSaveEmoji}>⚡</Text>
                  <View>
                    <Text style={styles.quickSaveTitle}>Save mood only</Text>
                    <Text style={styles.quickSaveSubtitle}>
                      Just capture how you&apos;re feeling right now
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or add thoughts</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder={`What&apos;s making you feel ${moodLabel.toLowerCase()}?`}
                placeholderTextColor={theme.colors.text.secondary + '60'}
                multiline
                numberOfLines={3}
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
                autoFocus={false}
              />

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveWithText}
                >
                  <Text style={styles.saveButtonText}>
                    {text.trim() ? 'Save Entry' : 'Save Mood'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Encouragement */}
              <Text style={styles.encouragement}>
                Every feeling matters on your journey ✨
              </Text>
            </SafeAreaView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  
  overlayTouchable: {
    flex: 1,
  },
  
  keyboardAvoid: {
    justifyContent: 'flex-end',
  },
  
  safeArea: {
    // Remove maxHeight constraint that was causing issues
  },
  
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  
  moodDisplay: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  moodEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.xs,
  },
  
  moodLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  title: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  quickSaveButton: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    marginBottom: theme.spacing.xl,
  },
  
  quickSaveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  
  quickSaveEmoji: {
    fontSize: 24,
  },
  
  quickSaveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  
  quickSaveSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.background.tertiary,
  },
  
  dividerText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  textInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    alignItems: 'center',
  },
  
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  
  saveButton: {
    flex: 2,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  encouragement: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});