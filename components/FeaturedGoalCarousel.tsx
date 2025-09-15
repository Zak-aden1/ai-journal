import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { AvatarRenderer } from '@/components/avatars';
import { useTheme } from '@/hooks/useTheme';
import type { AvatarType } from '@/components/avatars/types';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, Extrapolate, SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Separate component for carousel items to properly use hooks
const CarouselItem = React.memo(({ 
  item, 
  index, 
  scrollX, 
  interval, 
  cardWidth, 
  GAP, 
  styles, 
  theme 
}: {
  item: any;
  index: number;
  scrollX: SharedValue<number>;
  interval: number;
  cardWidth: number;
  GAP: number;
  styles: any;
  theme: any;
}) => {
  const itemStyle = useAnimatedStyle(() => {
    const center = index * interval;
    const d = (scrollX.value - center) / interval;
    const ad = Math.abs(d);
    const scale = interpolate(ad, [0, 1, 2], [1, 0.95, 0.9], Extrapolate.CLAMP);
    const translateY = interpolate(ad, [0, 1], [0, 8], Extrapolate.CLAMP);
    const rotateY = interpolate(d, [-1, 0, 1], [6, 0, -6], Extrapolate.CLAMP);
    const opacity = interpolate(ad, [0, 1, 2], [1, 0.92, 0.8], Extrapolate.CLAMP);
    const shadowOpacity = interpolate(ad, [0, 1], [0.18, 0.08], Extrapolate.CLAMP);
    const shadowRadius = interpolate(ad, [0, 1], [12, 6], Extrapolate.CLAMP);
    const elevation = interpolate(ad, [0, 1], [8, 3], Extrapolate.CLAMP);
    return {
      transform: [
        { scale },
        { translateY },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  });

  const parallaxStyle = useAnimatedStyle(() => {
    const center = index * interval;
    const d = (scrollX.value - center) / interval;
    const px = interpolate(d, [-1, 0, 1], [12, 0, -12], Extrapolate.CLAMP);
    return { transform: [{ translateX: px }] };
  });

  const displayAvatar = item.avatar || { type: 'plant' as AvatarType, name: 'Companion', vitality: 50 };
  const vitalityColor = displayAvatar.vitality >= 80 ? theme.colors.status.success
    : displayAvatar.vitality >= 60 ? theme.colors.primary
    : displayAvatar.vitality >= 40 ? theme.colors.status.warning
    : theme.colors.status.error;
  const progressPercentage = item.totalHabits > 0 ? Math.round((item.completedHabits / item.totalHabits) * 100) : 0;
  const healthStatus = displayAvatar.vitality >= 80 ? { status: 'Thriving', emoji: '🌟' }
    : displayAvatar.vitality >= 60 ? { status: 'Growing', emoji: '🌱' }
    : displayAvatar.vitality >= 40 ? { status: 'Stable', emoji: '😊' }
    : displayAvatar.vitality >= 20 ? { status: 'Struggling', emoji: '😔' }
    : { status: 'Needs care', emoji: '🆘' };

  return (
    <Animated.View style={[{ width: cardWidth, marginRight: GAP }, styles.goalCard, { borderColor: vitalityColor + '30' }, itemStyle]}>
      <View style={[styles.statusBadge, { backgroundColor: vitalityColor + '20' }]}>
        <Text style={styles.statusEmoji}>{healthStatus.emoji}</Text>
        <Text style={[styles.statusText, { color: vitalityColor }]}>{healthStatus.status}</Text>
      </View>
      <View style={styles.cardContent}>
        <Animated.View style={[styles.avatarSection, parallaxStyle]}>
          <AvatarRenderer type={displayAvatar.type} vitality={displayAvatar.vitality} size={60} animated={false} />
          <Text style={styles.avatarName}>{displayAvatar.name}</Text>
          <Text style={[styles.vitalityText, { color: vitalityColor }]}>{displayAvatar.vitality}% Vitality</Text>
        </Animated.View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Today&apos;s Progress</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressStats}>{item.completedHabits}/{item.totalHabits} habits</Text>
              <Text style={[styles.progressPercentage, { color: vitalityColor }]}>{progressPercentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: vitalityColor }]} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

CarouselItem.displayName = 'CarouselItem';

// Separate component for pagination dots
const PaginationDot = React.memo(({ 
  index, 
  currentIndex, 
  scrollX, 
  interval, 
  styles, 
  theme 
}: {
  index: number;
  currentIndex: number;
  scrollX: SharedValue<number>;
  interval: number;
  styles: any;
  theme: any;
}) => {
  const dotStyle = useAnimatedStyle(() => {
    const center = index * interval;
    const d = (scrollX.value - center) / interval;
    const ad = Math.abs(d);
    const width = interpolate(ad, [0, 1], [16, 8], Extrapolate.CLAMP);
    const scale = interpolate(ad, [0, 1], [1.1, 1], Extrapolate.CLAMP);
    const opacity = interpolate(ad, [0, 1], [1, 0.6], Extrapolate.CLAMP);
    return { width, transform: [{ scale }], opacity };
  });

  const isActive = index === currentIndex;
  return (
    <Animated.View
      style={[
        styles.paginationDot,
        isActive && styles.activePaginationDot,
        isActive && { backgroundColor: theme.colors.primary },
        dotStyle,
      ]}
    />
  );
});

PaginationDot.displayName = 'PaginationDot';

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

export const FeaturedGoalCarousel: React.FC<FeaturedGoalCarouselProps> = ({ goals, primaryGoalId, onGoalPress }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const primaryIndex = goals.findIndex(goal => goal.id === primaryGoalId);
    return primaryIndex >= 0 ? primaryIndex : 0;
  });

  // Layout + snapping
  const SIDE_PADDING = theme.spacing.lg;
  const GAP = theme.spacing.sm;
  const cardWidth = width - SIDE_PADDING * 2;
  const interval = cardWidth + GAP;

  // Scroll-driven animation values
  const scrollX = useSharedValue(currentIndex * interval);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });


  const handleMomentumEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(x / interval);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onGoalPress?.(goals[newIndex]?.id);
      Haptics.selectionAsync();
    }
  };

  const scrollToIndex = useCallback((nextIndex: number) => {
    if (!listRef.current) return;
    const clamped = Math.max(0, Math.min(nextIndex, goals.length - 1));
    listRef.current.scrollToOffset({ offset: clamped * interval, animated: true });
  }, [goals.length, interval]);

  const handleButtonNavigate = useCallback((direction: 'left' | 'right') => {
    const next = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    scrollToIndex(next);
  }, [currentIndex, scrollToIndex]);
  

  const currentGoal = goals[currentIndex];
  
  if (goals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No goals yet</Text>
        <Text style={styles.emptySubtext}>Create your first goal to get started!</Text>
      </View>
    );
  }



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
            onPress={() => handleButtonNavigate('left')}
            activeOpacity={0.7}
          >
            <Text style={styles.navArrow}>←</Text>
          </TouchableOpacity>
        )}

        {/* Carousel */}
        <Animated.FlatList
          ref={listRef}
          data={goals}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentIndex}
          getItemLayout={(_, index) => ({ length: interval, offset: interval * index, index })}
          contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
          snapToInterval={interval}
          decelerationRate="fast"
          bounces={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item, index }) => (
            <CarouselItem
              item={item}
              index={index}
              scrollX={scrollX}
              interval={interval}
              cardWidth={cardWidth}
              GAP={GAP}
              styles={styles}
              theme={theme}
            />
          )}
        />

        {/* Right Navigation Arrow */}
        {goals.length > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.rightNavButton]}
            onPress={() => handleButtonNavigate('right')}
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
            <PaginationDot
              key={index}
              index={index}
              currentIndex={currentIndex}
              scrollX={scrollX}
              interval={interval}
              styles={styles}
              theme={theme}
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
    borderRadius: 20,
    padding: theme.spacing.lg,
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
    marginRight: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
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
