import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AvatarRenderer } from '@/components/avatars';
import { useTheme } from '@/hooks/useTheme';
import type { AvatarType } from '@/components/avatars/types';

interface CompanionCarouselProps {
  goals: Array<{
    id: string;
    title: string;
    avatar?: {
      type: AvatarType;
      name: string;
      vitality: number;
    };
  }>;
  onGoalPress?: (goalId: string) => void;
  primaryGoalId?: string | null;
}

export const CompanionCarousel: React.FC<CompanionCarouselProps> = ({
  goals,
  onGoalPress,
  primaryGoalId,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const getHealthStatus = (vitality: number) => {
    if (vitality >= 80) return 'Thriving';
    if (vitality >= 60) return 'Growing steadily'; 
    if (vitality >= 40) return 'Just sprouting';
    if (vitality >= 20) return 'Struggling';
    return 'Needs care';
  };

  const getHealthColor = (vitality: number) => {
    if (vitality >= 80) return theme.colors.status.success;
    if (vitality >= 60) return theme.colors.primary;
    if (vitality >= 40) return theme.colors.status.warning;
    return theme.colors.status.error;
  };

  if (goals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No companions yet</Text>
        <Text style={styles.emptySubtext}>Create your first goal to meet your companion!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Companions</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={120} // Width of each item + margin
      >
        {goals.map((goal) => {
          const avatar = goal.avatar || {
            type: 'plant' as AvatarType,
            name: 'Companion',
            vitality: 50,
          };
          
          const isPrimary = goal.id === primaryGoalId;
          const healthColor = getHealthColor(avatar.vitality);
          
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.companionCard,
                isPrimary && styles.primaryCard,
                avatar.vitality < 30 && styles.urgentCard,
              ]}
              onPress={() => onGoalPress?.(goal.id)}
              activeOpacity={0.8}
            >
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <AvatarRenderer
                  type={avatar.type}
                  vitality={avatar.vitality}
                  size={60}
                  animated
                />
                
                {/* Health indicator */}
                <View style={[styles.healthDot, { backgroundColor: healthColor }]}>
                  <Text style={styles.healthDotEmoji}>
                    {avatar.vitality >= 80 ? '🌟' : avatar.vitality >= 60 ? '🌱' : avatar.vitality >= 40 ? '😊' : avatar.vitality >= 20 ? '😔' : '🆘'}
                  </Text>
                </View>
                
                {/* Primary indicator */}
                {isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>★</Text>
                  </View>
                )}
              </View>
              
              {/* Goal info */}
              <View style={styles.goalInfo}>
                <Text style={styles.healthStatus}>
                  {getHealthStatus(avatar.vitality)}
                </Text>
                <Text style={styles.goalTitle} numberOfLines={2}>
                  {goal.title}
                </Text>
                <Text style={styles.avatarName}>
                  {avatar.name}
                </Text>
                <Text style={[styles.vitalityText, { color: healthColor }]}>
                  {avatar.vitality}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  companionCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: theme.spacing.lg,
    width: 160,
    height: 200,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.status.error,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  primaryCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.15,
    backgroundColor: theme.colors.primary + '10',
    transform: [{ scale: 1.05 }],
    width: 110,
  },
  
  urgentCard: {
    borderColor: theme.colors.status.error,
    shadowColor: theme.colors.status.error,
    shadowOpacity: 0.2,
  },
  
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  
  healthDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.secondary,
  },
  
  healthDotEmoji: {
    fontSize: 10,
  },
  
  primaryBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  primaryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  
  goalInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  
  healthStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  
  avatarName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  vitalityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  
  emptyText: {
    fontSize: 16,
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