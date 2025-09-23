import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  actions: QuickAction[];
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function QuickActionsModal({
  visible,
  onClose,
  actions,
  title = "What would you like to do?"
}: QuickActionsModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);


  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Initialize animation values for each action
  const actionAnimations = useRef<Animated.Value[]>([]).current;

  // Ensure we have the right number of animation values
  useEffect(() => {
    const neededCount = actions?.length || 0;
    const currentCount = actionAnimations.length;

    if (neededCount > currentCount) {
      // Add new animation values
      for (let i = currentCount; i < neededCount; i++) {
        actionAnimations.push(new Animated.Value(0));
      }
    } else if (neededCount < currentCount) {
      // Remove excess animation values
      actionAnimations.splice(neededCount);
    }
  }, [actions?.length]);

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // iOS-style spring animation for entrance
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 400,
          friction: 30,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Staggered animations for action items
        const actionAnims = actionAnimations.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            delay: index * 80,
            useNativeDriver: true,
          })
        );
        Animated.parallel(actionAnims).start();
      });
    } else {
      // Reset action animations for next entrance
      actionAnimations.forEach(anim => anim.setValue(0));

      // Smooth exit animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleActionPress = (action: QuickAction) => {
    // Enhanced haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Close modal with smooth transition
    onClose();

    // Small delay to allow modal to start closing before action
    setTimeout(() => {
      action.onPress();
      // Light confirmation haptic after action
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 50);
    }, 150);
  };

  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions && actions.length > 0 ? actions.map((action, index) => (
              <View key={action.id}>
                <TouchableOpacity
                  style={[
                    styles.actionCard,
                    action.color && { borderLeftColor: action.color },
                    index === actions.length - 1 && styles.lastActionCard,
                  ]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionContent}>
                    <View style={[
                      styles.actionIcon,
                      action.color && { backgroundColor: action.color + '15' }
                    ]}>
                      <Text style={styles.actionEmoji}>{action.icon}</Text>
                    </View>

                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      {action.subtitle && (
                        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.actionArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
              </TouchableOpacity>
              </View>
            )) : (
              <View style={styles.noActionsContainer}>
                <Text style={styles.noActionsText}>No actions available</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleBackdropPress}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: theme.colors?.background?.primary || '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: insets.bottom || 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    borderTopWidth: 0.5,
    borderTopColor: theme.colors?.text?.primary + '10' || 'rgba(0,0,0,0.1)',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: theme.colors.text.secondary + '50',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 12,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    paddingHorizontal: theme.spacing?.lg || 16,
    paddingVertical: theme.spacing?.md || 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors?.background?.tertiary || '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors?.text?.primary || '#000',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  actionsContainer: {
    flexGrow: 1,
    padding: theme.spacing?.md || 12,
    gap: 6,
  },
  actionCard: {
    backgroundColor: theme.colors?.background?.secondary || '#F3F4F6',
    borderRadius: 16,
    padding: theme.spacing?.md || 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: theme.colors.text.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.interactive?.primary || '#007AFF',
    minHeight: 52,
  },
  lastActionCard: {
    marginBottom: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors?.background?.tertiary || '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing?.sm || 10,
    shadowColor: theme.colors?.text?.primary || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionEmoji: {
    fontSize: 18,
    lineHeight: 18,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors?.text?.primary || '#000',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: theme.colors?.text?.secondary || '#64748B',
    lineHeight: 16,
    fontWeight: '400',
  },
  actionArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors?.background?.tertiary || '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing?.xs || 6,
  },
  arrowText: {
    fontSize: 12,
    color: theme.colors?.text?.secondary || '#64748B',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: theme.spacing?.lg || 16,
    paddingTop: theme.spacing?.md || 12,
    paddingBottom: theme.spacing?.sm || 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors?.background?.tertiary || '#F1F5F9',
  },
  cancelButton: {
    backgroundColor: theme.colors?.background?.secondary || '#F8FAFC',
    borderRadius: 12,
    paddingVertical: theme.spacing?.md || 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: theme.colors?.text?.primary + '08' || 'rgba(0,0,0,0.08)',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors?.text?.secondary || '#64748B',
    letterSpacing: -0.1,
  },
  noActionsContainer: {
    padding: theme.spacing?.xl || 24,
    alignItems: 'center',
  },
  noActionsText: {
    fontSize: 16,
    color: theme.colors?.text?.secondary || '#64748B',
    fontStyle: 'italic',
  },
});