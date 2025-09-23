import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
  style?: 'primary' | 'secondary';
}

interface EnhancedEmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actions?: EmptyStateAction[];
  illustration?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export function EnhancedEmptyState({
  icon,
  title,
  subtitle,
  actions = [],
  illustration,
  size = 'medium'
}: EnhancedEmptyStateProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(30)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: styles.smallIcon,
          title: styles.smallTitle,
          subtitle: styles.smallSubtitle,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: styles.largeIcon,
          title: styles.largeTitle,
          subtitle: styles.largeSubtitle,
        };
      default:
        return {
          container: styles.mediumContainer,
          icon: styles.mediumIcon,
          title: styles.mediumTitle,
          subtitle: styles.mediumSubtitle,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.container,
        {
          opacity: fadeAnimation,
          transform: [
            { translateY: slideAnimation },
            { scale: scaleAnimation }
          ],
        },
      ]}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <View style={styles.illustrationContainer}>
          {illustration}
        </View>
      ) : icon ? (
        <Animated.Text style={[styles.icon, sizeStyles.icon]}>
          {icon}
        </Animated.Text>
      ) : null}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, sizeStyles.title]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, sizeStyles.subtitle]}>{subtitle}</Text>
        )}
      </View>

      {/* Actions */}
      {actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.style === 'secondary' ? styles.secondaryButton : styles.primaryButton,
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.actionText,
                  action.style === 'secondary' ? styles.secondaryButtonText : styles.primaryButtonText,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.xl,
  },
  smallContainer: {
    padding: theme.spacing.lg,
  },
  mediumContainer: {
    padding: theme.spacing.xl,
  },
  largeContainer: {
    padding: theme.spacing.xxl || theme.spacing.xl * 1.5,
  },
  illustrationContainer: {
    marginBottom: theme.spacing.lg,
  },
  icon: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  smallIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.md,
  },
  mediumIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.lg,
  },
  largeIcon: {
    fontSize: 72,
    marginBottom: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  smallTitle: {
    fontSize: 16,
  },
  mediumTitle: {
    fontSize: 20,
  },
  largeTitle: {
    fontSize: 24,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  smallSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  mediumSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  largeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  actionButton: {
    borderRadius: 12,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '40',
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
  },
});