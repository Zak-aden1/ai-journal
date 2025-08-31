import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { GoalCreationFlow, type GoalData } from './goal-creation/GoalCreationFlow';
import { createModalStyles } from './goal-creation/ModalGoalCreationStyles';

interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onGoalCreated?: (goalId: string) => void;
}

export function CreateGoalModal({ visible, onClose, onGoalCreated }: CreateGoalModalProps) {
  const { theme } = useTheme();
  const styles = createModalStyles(theme);
  const containerStyles = createStyles(theme);

  const handleClose = () => {
    onClose();
  };

  const handleGoalCreated = (goalId: string) => {
    onGoalCreated?.(goalId);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={containerStyles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={containerStyles.header}>
          <TouchableOpacity onPress={handleClose} style={containerStyles.closeButton}>
            <Text style={containerStyles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={containerStyles.headerTitle}>Create Goal</Text>
          <View style={containerStyles.placeholder} />
        </View>

        <GoalCreationFlow
          context="modal"
          styles={styles}
          onComplete={handleGoalCreated}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 60, // To balance the close button
  },
});