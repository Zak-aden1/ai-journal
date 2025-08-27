import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AvatarRenderer } from '@/components/avatars';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import type { AvatarType } from '@/components/avatars/types';

interface GoalCompanionCardProps {
  goalId: string;
  goalTitle: string;
  avatar?: {
    type: AvatarType;
    name: string;
    vitality: number;
  };
  onPress?: () => void;
  compact?: boolean;
}

export const GoalCompanionCard: React.FC<GoalCompanionCardProps> = ({
  goalId,
  goalTitle,
  avatar,
  onPress,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { habitsWithIds } = useAppStore();
  
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const todayHabits = habitsWithIds[goalId] || [];
  const avatarData = avatar || {
    type: 'plant' as AvatarType,
    name: 'Companion',
    vitality: 50,
  };
  
  // Get health status based on vitality
  const getHealthStatus = (vitality: number) => {
    if (vitality >= 80) return { status: 'Thriving', color: theme.colors.status.success, emoji: '🌟' };
    if (vitality >= 60) return { status: 'Growing', color: theme.colors.primary, emoji: '🌱' };
    if (vitality >= 40) return { status: 'Stable', color: theme.colors.status.warning, emoji: '😊' };
    if (vitality >= 20) return { status: 'Struggling', color: theme.colors.status.error, emoji: '😔' };
    return { status: 'Needs Care', color: theme.colors.status.error, emoji: '🆘' };
  };
  
  const healthStatus = getHealthStatus(avatarData.vitality);
  
  // Get today's completion status
  // Note: This would need integration with habit completion tracking
  const completedToday = 0; // Placeholder
  const totalHabits = todayHabits.length;
  
  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const isEvening = hour >= 18;
    const completionRate = totalHabits > 0 ? completedToday / totalHabits : 0;
    
    if (completionRate === 1) {
      return `${avatarData.name} is so proud of you today! 🎉`;
    } else if (completionRate > 0.7) {
      return `${avatarData.name} feels your dedication! Almost there! 💪`;
    } else if (isEvening && completionRate < 0.3) {
      return `${avatarData.name} is waiting for your attention... 🥺`;
    } else {
      return `${avatarData.name} believes in you! Let's grow together! 🌟`;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact && styles.compactCard,
        healthStatus.status === 'Needs Care' && styles.urgentCard,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <AvatarRenderer
          type={avatarData.type}
          vitality={avatarData.vitality}
          size={compact ? 50 : 70}
          animated
        />
        
        {/* Health Indicator */}
        <View style={[styles.healthBadge, { backgroundColor: healthStatus.color + '20' }]}>
          <Text style={styles.healthEmoji}>{healthStatus.emoji}</Text>
          <Text style={[styles.healthText, { color: healthStatus.color }]}>
            {avatarData.vitality}%
          </Text>
        </View>
      </View>

      {/* Goal Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.headerRow}>
          <Text style={styles.goalTitle}>{goalTitle}</Text>
          <Text style={[styles.statusText, { color: healthStatus.color }]}>
            {healthStatus.status}
          </Text>
        </View>
        
        <Text style={styles.avatarName}>{avatarData.name}</Text>
        
        {!compact && (
          <Text style={styles.motivationalMessage}>
            {getMotivationalMessage()}
          </Text>
        )}
        
        {/* Habits Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {completedToday} of {totalHabits} care tasks completed
          </Text>
          {totalHabits > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(completedToday / totalHabits) * 100}%`,
                    backgroundColor: healthStatus.color 
                  }
                ]} 
              />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 24,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  
  compactCard: {
    padding: theme.spacing.md,
    borderRadius: 16,
  },
  
  urgentCard: {
    borderColor: theme.colors.status.error,
    borderWidth: 2,
    shadowColor: theme.colors.status.error,
    shadowOpacity: 0.2,
  },
  
  avatarSection: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: theme.spacing.xs,
  },
  
  healthEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  
  healthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  infoSection: {
    flex: 1,
  },
  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  avatarName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  
  motivationalMessage: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  
  progressRow: {
    marginTop: theme.spacing.xs,
  },
  
  progressText: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.xs,
  },
  
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});