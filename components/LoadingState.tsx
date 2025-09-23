import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  size = 'medium',
  showText = true
}: LoadingStateProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const dotsOpacity = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    // Spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Dots animation
    const dotsAnimation = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dotsOpacity[0], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotsOpacity[0], {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotsOpacity[1], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotsOpacity[1], {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dotsOpacity[2], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotsOpacity[2], {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();
    dotsAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      dotsAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const containerSize = sizeMap[size];

  return (
    <View style={[styles.container, styles[`${size}Container`]]}>
      {/* Spinning Circle */}
      <Animated.View
        style={[
          styles.spinner,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            transform: [{ rotate: spin }, { scale: pulseValue }],
          },
        ]}
      />

      {/* Loading Text with Animated Dots */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.text, styles[`${size}Text`]]}>{message}</Text>
          <View style={styles.dotsContainer}>
            {dotsOpacity.map((opacity, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { opacity, backgroundColor: theme.colors.primary },
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  smallContainer: {
    paddingVertical: theme.spacing.sm,
  },
  mediumContainer: {
    paddingVertical: theme.spacing.lg,
  },
  largeContainer: {
    paddingVertical: theme.spacing.xl,
  },
  spinner: {
    borderWidth: 3,
    borderColor: theme.colors.background.tertiary,
    borderTopColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginRight: theme.spacing.xs,
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});