import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export interface ToastNotification {
  id: string;
  type: 'encouragement' | 'tip' | 'achievement' | 'reminder' | 'streak';
  title: string;
  message: string;
  emoji: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface MotivationalToastProps {
  visible: boolean;
  notification: ToastNotification | null;
  onDismiss: () => void;
}

export function MotivationalToast({ visible, notification, onDismiss }: MotivationalToastProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const glowIntensity = useSharedValue(0);
  
  // Auto-dismiss timer
  useEffect(() => {
    if (visible && notification) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Entrance animation
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      
      // Glow effect for achievements
      if (notification.type === 'achievement' || notification.type === 'streak') {
        glowIntensity.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 1000 }),
          withTiming(0, { duration: 500 })
        );
      }
      
      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration || 4000);
      
      return () => clearTimeout(timer);
    } else {
      // Exit animation
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
    }
  }, [visible, notification]);
  
  const handleDismiss = () => {
    // Exit animation
    translateY.value = withTiming(-100, { duration: 300, easing: Easing.in(Easing.quad) });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.9, { duration: 300 });
    
    // Call onDismiss after animation
    setTimeout(() => {
      runOnJS(onDismiss)();
    }, 300);
  };
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + (glowIntensity.value * 0.4),
    shadowRadius: 8 + (glowIntensity.value * 12),
  }));
  
  if (!notification || !visible) return null;
  
  const getGradientColors = (type: string): [string, string] => {
    switch (type) {
      case 'achievement':
        return ['#fef3c7', '#fcd34d']; // Yellow gradient
      case 'streak':
        return ['#fed7aa', '#fb923c']; // Orange gradient
      case 'encouragement':
        return ['#dbeafe', '#60a5fa']; // Blue gradient
      case 'tip':
        return ['#e9d5ff', '#a78bfa']; // Purple gradient
      case 'reminder':
        return ['#d1fae5', '#34d399']; // Green gradient
      default:
        return ['#f3f4f6', '#d1d5db']; // Gray gradient
    }
  };
  
  const getIconColor = (type: string): string => {
    switch (type) {
      case 'achievement':
        return '#f59e0b';
      case 'streak':
        return '#ea580c';
      case 'encouragement':
        return '#3b82f6';
      case 'tip':
        return '#8b5cf6';
      case 'reminder':
        return '#10b981';
      default:
        return theme.colors.text.secondary;
    }
  };
  
  const gradientColors = getGradientColors(notification.type);
  const iconColor = getIconColor(notification.type);
  
  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.toastWrapper, glowStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
              <Text style={[styles.emoji, { color: iconColor }]}>
                {notification.emoji}
              </Text>
            </View>
            
            {/* Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              
              {/* Action Button */}
              {notification.action && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: iconColor }]}
                  onPress={notification.action.onPress}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionText, { color: iconColor }]}>
                    {notification.action.label}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toastWrapper: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 20,
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    flexShrink: 0,
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
    lineHeight: 20,
  },
});