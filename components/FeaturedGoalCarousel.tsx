import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { AvatarRenderer } from '@/components/avatars';
import { useTheme } from '@/hooks/useTheme';
import type { AvatarType } from '@/components/avatars/types';

interface FeaturedGoalCarouselProps {
  goals: {
    id: string;
    title: string;
    completedHabits: number;
    totalHabits: number;
    avatar?: {
      type: AvatarType;
      name: string;
      vitality: number;
    };
  }[];
  primaryGoalId: string | null;
  onGoalPress?: (goalId: string) => void;
}

export const FeaturedGoalCarousel: React.FC<FeaturedGoalCarouselProps> = ({
  goals,
  primaryGoalId,
  onGoalPress,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [currentIndex, setCurrentIndex] = useState(() => {
    const primaryIndex = goals.findIndex(goal => goal.id === primaryGoalId);
    return primaryIndex >= 0 ? primaryIndex : 0;
  });
  
  const translateX = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  // Pan gesture handler
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();
      
      const swipeThreshold = 50;
      
      if (gestureState.dx > swipeThreshold && goals.length > 1) {
        // Swipe right (go to previous goal)
        navigateToGoal('left');
      } else if (gestureState.dx < -swipeThreshold && goals.length > 1) {
        // Swipe left (go to next goal)
        navigateToGoal('right');
      }
      
      // Reset pan position
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    },
  });

  const currentGoal = goals[currentIndex];
  
  if (goals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No goals yet</Text>
        <Text style={styles.emptySubtext}>Create your first goal to get started!</Text>
      </View>
    );
  }

  const avatar = currentGoal.avatar || {
    type: 'plant' as AvatarType,
    name: 'Companion',
    vitality: 50,
  };

  const getVitalityColor = (vitality: number) => {
    if (vitality >= 80) return theme.colors.status.success;
    if (vitality >= 60) return theme.colors.primary;
    if (vitality >= 40) return theme.colors.status.warning;
    return theme.colors.status.error;
  };

  const getHealthStatus = (vitality: number) => {
    if (vitality >= 80) return { status: 'Thriving', emoji: '🌟' };
    if (vitality >= 60) return { status: 'Growing', emoji: '🌱' };
    if (vitality >= 40) return { status: 'Stable', emoji: '😊' };
    if (vitality >= 20) return { status: 'Struggling', emoji: '😔' };
    return { status: 'Needs care', emoji: '🆘' };
  };

  const vitalityColor = getVitalityColor(avatar.vitality);
  const healthStatus = getHealthStatus(avatar.vitality);
  const progressPercentage = currentGoal.totalHabits > 0 ? Math.round((currentGoal.completedHabits / currentGoal.totalHabits) * 100) : 0;

  const navigateToGoal = (direction: 'left' | 'right') => {
    let newIndex: number;
    
    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : goals.length - 1;
    } else {
      newIndex = currentIndex < goals.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentIndex(newIndex);
    const newGoal = goals[newIndex];
    onGoalPress?.(newGoal.id);

    // Animate the transition
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: direction === 'left' ? 20 : -20,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getContextualGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return `Good morning! Let's work on ${currentGoal.title}`;
    } else if (hour < 17) {
      return `Making progress on ${currentGoal.title}`;
    } else {
      return `Evening focus: ${currentGoal.title}`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Text */}
      <Text style={styles.headerText}>
        {getContextualGreeting()}
      </Text>

      {/* Main Card Container */}
      <View style={styles.cardContainer}>
        {/* Left Navigation Arrow */}
        {goals.length > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.leftNavButton]}
            onPress={() => navigateToGoal('left')}
            activeOpacity={0.7}
          >
            <Text style={styles.navArrow}>←</Text>
          </TouchableOpacity>
        )}

        {/* Goal Card */}
        <Animated.View 
          {...panResponder.panHandlers}
          style={[
            styles.goalCard,
            { 
              borderColor: vitalityColor + '30',
              transform: [
                { translateX },
                { translateX: pan.x }
              ]
            }
          ]}
        >
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: vitalityColor + '20' }]}>
            <Text style={styles.statusEmoji}>{healthStatus.emoji}</Text>
            <Text style={[styles.statusText, { color: vitalityColor }]}>
              {healthStatus.status}
            </Text>
          </View>

          {/* Main Content */}
          <View style={styles.cardContent}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <AvatarRenderer
                type={avatar.type}
                vitality={avatar.vitality}
                size={80}
                animated
              />
              <Text style={styles.avatarName}>{avatar.name}</Text>
              <Text style={[styles.vitalityText, { color: vitalityColor }]}>
                {avatar.vitality}% Vitality
              </Text>
            </View>

            {/* Goal Info */}
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle} numberOfLines={2}>
                {currentGoal.title}
              </Text>
              
              {/* Progress Section */}
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>Today's Progress</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressStats}>
                    {currentGoal.completedHabits}/{currentGoal.totalHabits} habits
                  </Text>
                  <Text style={[styles.progressPercentage, { color: vitalityColor }]}>
                    {progressPercentage}%
                  </Text>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${progressPercentage}%`,
                          backgroundColor: vitalityColor 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Right Navigation Arrow */}
        {goals.length > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.rightNavButton]}
            onPress={() => navigateToGoal('right')}
            activeOpacity={0.7}
          >
            <Text style={styles.navArrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pagination Dots */}
      {goals.length > 1 && (
        <View style={styles.paginationContainer}>
          {goals.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.activePaginationDot,
                index === currentIndex && { backgroundColor: vitalityColor }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  leftNavButton: {
    marginRight: theme.spacing.sm,
  },
  
  rightNavButton: {
    marginLeft: theme.spacing.sm,
  },
  
  navArrow: {
    fontSize: 20,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  
  goalCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 24,
    padding: theme.spacing.xl,
    borderWidth: 2,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
  },
  
  statusEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  avatarSection: {
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },
  
  avatarName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  
  vitalityText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  
  goalInfo: {
    flex: 1,
  },
  
  goalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  
  progressSection: {
    marginTop: theme.spacing.md,
  },
  
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  progressStats: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  progressBarContainer: {
    marginTop: theme.spacing.xs,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background.tertiary,
    marginHorizontal: 4,
  },
  
  activePaginationDot: {
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 24,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});