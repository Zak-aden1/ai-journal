import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  text?: string;
  style?: ViewStyle;
  size?: number;
  disabled?: boolean;
  showPulse?: boolean;
  accessibilityLabel?: string;
}

export function FloatingActionButton({ 
  onPress, 
  icon = '+', 
  text,
  style, 
  size = 56,
  disabled = false,
  showPulse = false,
  accessibilityLabel = 'Add new habit'
}: FloatingActionButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme, size, !!text);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (showPulse) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [showPulse, pulseAnim]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={[
      { transform: [{ scale: showPulse ? pulseAnim : 1 }] }
    ]}>
      <TouchableOpacity
        style={[styles.fab, style, disabled && styles.disabled]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {text ? (
          <View style={styles.textContainer}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.text}>{text}</Text>
          </View>
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (theme: any, size: number, hasText: boolean) => StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    minWidth: hasText ? 120 : size,
    height: size,
    borderRadius: hasText ? size / 2 : size / 2,
    backgroundColor: theme.colors.interactive.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    paddingHorizontal: hasText ? 16 : 0,
  },
  disabled: {
    opacity: 0.6,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: hasText ? 18 : size * 0.4,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
