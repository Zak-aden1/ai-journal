import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AvatarRenderer } from '@/components/avatars';
import { useTheme } from '@/hooks/useTheme';
import { ProgressCircle } from '@/components/ProgressCircle';
import type { AvatarType } from '@/components/avatars/types';

interface FeaturedGoalSectionProps {
  goal: {
    id: string;
    title: string;
    avatar?: {
      type: AvatarType;
      name: string;
      vitality: number;
    };
  };
  completedHabitsToday: number;
  totalHabitsToday: number;
  onGoalPress?: () => void;
  onQuickActionPress?: (action: 'habits' | 'insights' | 'care') => void;
}

export const FeaturedGoalSection: React.FC<FeaturedGoalSectionProps> = ({
  goal,
  completedHabitsToday,
  totalHabitsToday,
  onGoalPress,
  onQuickActionPress,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const avatar = goal.avatar || {
    type: 'plant' as AvatarType,
    name: 'Companion',
    vitality: 50,
  };
  
  const completionRate = totalHabitsToday > 0 ? completedHabitsToday / totalHabitsToday : 0;
  
  const getHealthStatus = (vitality: number) => {
    if (vitality >= 80) return { 
      status: 'Thriving', 
      color: theme.colors.status.success, 
      emoji: '🌟',
      message: 'Your companion is absolutely flourishing!'
    };
    if (vitality >= 60) return { 
      status: 'Growing', 
      color: theme.colors.primary, 
      emoji: '🌱',
      message: 'Your companion is growing steadily!'
    };
    if (vitality >= 40) return { 
      status: 'Stable', 
      color: theme.colors.status.warning, 
      emoji: '😊',
      message: 'Your companion is doing okay, but could use more care.'
    };
    if (vitality >= 20) return { 
      status: 'Struggling', 
      color: theme.colors.status.error, 
      emoji: '😔',
      message: 'Your companion is struggling and needs your attention.'
    };
    return { 
      status: 'Critical', 
      color: theme.colors.status.error, 
      emoji: '🆘',
      message: 'Your companion urgently needs your care!'
    };
  };
  
  const healthStatus = getHealthStatus(avatar.vitality);
  
  const getTimeOfDayMessage = () => {
    const hour = new Date().getHours();
    const name = avatar.name;
    
    if (hour < 10) {
      return `Good morning! ${name} is ready to start the day with you.`;
    } else if (hour < 14) {
      return `${name} is feeling your morning momentum!`;
    } else if (hour < 18) {
      return `Afternoon check-in with ${name}. How are we doing?`;
    } else if (hour < 22) {
      return `${name} is curious about your day. Time to reflect?`;
    } else {
      return `${name} hopes you had a fulfilling day together.`;
    }
  };

  return (
    <View style={[styles.container, { borderColor: healthStatus.color + '30' }]}>
      <TouchableOpacity
        style={styles.content}
        onPress={onGoalPress}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Featured Companion</Text>
          <View style={[styles.statusBadge, { backgroundColor: healthStatus.color + '20' }]}>
            <Text style={styles.statusEmoji}>{healthStatus.emoji}</Text>
            <Text style={[styles.statusText, { color: healthStatus.color }]}>
              {healthStatus.status}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Left: Avatar and Progress */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <AvatarRenderer
                type={avatar.type}
                vitality={avatar.vitality}
                size={120}
                animated
              />
              
              {/* Vitality ring around avatar */}
              <View style={styles.progressRingContainer}>
                <ProgressCircle
                  progress={avatar.vitality / 100}
                  size={140}
                  strokeWidth={4}
                  animated
                />
              </View>
            </View>
            
            <Text style={styles.vitalityLabel}>
              {avatar.vitality}% Vitality
            </Text>
          </View>

          {/* Right: Goal Info */}
          <View style={styles.infoSection}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.avatarName}>{avatar.name}</Text>
            
            <Text style={styles.healthMessage}>
              {healthStatus.message}
            </Text>
            
            <Text style={styles.timeMessage}>
              {getTimeOfDayMessage()}
            </Text>
          </View>
        </View>

        {/* Today's Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Today&apos;s Care Progress</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressStats}>
              <Text style={styles.progressNumbers}>
                {completedHabitsToday} of {totalHabitsToday} tasks completed
              </Text>
              <Text style={[styles.progressPercentage, { color: healthStatus.color }]}>
                {Math.round(completionRate * 100)}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${completionRate * 100}%`,
                      backgroundColor: healthStatus.color 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => onQuickActionPress?.('habits')}
        >
          <Text style={styles.actionIcon}>🎯</Text>
          <Text style={styles.actionLabel}>Care Tasks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onQuickActionPress?.('insights')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionLabel}>Insights</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, avatar.vitality < 40 && styles.urgentAction]}
          onPress={() => onQuickActionPress?.('care')}
        >
          <Text style={styles.actionIcon}>💝</Text>
          <Text style={styles.actionLabel}>Extra Care</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 28,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
  
  content: {
    padding: theme.spacing.xl,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  
  avatarSection: {
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },
  
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  progressRingContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  
  vitalityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  
  infoSection: {
    flex: 1,
  },
  
  goalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  
  avatarName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  
  healthMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  
  timeMessage: {
    fontSize: 13,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  
  progressSection: {
    marginBottom: theme.spacing.lg,
  },
  
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  progressStats: {
    flex: 1,
  },
  
  progressNumbers: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  progressBarContainer: {
    flex: 2,
    marginLeft: theme.spacing.lg,
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
  
  quickActions: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 12,
    backgroundColor: theme.colors.background.secondary,
  },
  
  primaryAction: {
    backgroundColor: theme.colors.primary + '20',
  },
  
  urgentAction: {
    backgroundColor: theme.colors.status.error + '20',
  },
  
  actionIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});