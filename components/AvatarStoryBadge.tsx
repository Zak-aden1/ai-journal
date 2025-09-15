import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AvatarStory, StoryUnlockProgress } from '@/types/avatarStories';

interface AvatarStoryBadgeProps {
  goalId: string;
  stories: AvatarStory[];
  progress: StoryUnlockProgress;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const AvatarStoryBadge: React.FC<AvatarStoryBadgeProps> = ({
  goalId,
  stories,
  progress,
  onPress,
  size = 'medium'
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const unlockedCount = stories.length;
  const hasUnlocked = unlockedCount > 0;
  
  // Get next milestone info
  const nextMilestone = progress.nextMilestone;
  const isCloseToMilestone = nextMilestone && nextMilestone.daysRemaining && nextMilestone.daysRemaining <= 2;
  
  if (!hasUnlocked && !nextMilestone) {
    return null;
  }
  
  const sizeStyles = {
    small: styles.smallBadge,
    medium: styles.mediumBadge,
    large: styles.largeBadge
  };
  
  const textSizeStyles = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.badge,
        sizeStyles[size],
        hasUnlocked ? styles.unlockedBadge : styles.lockedBadge,
        isCloseToMilestone ? styles.almostUnlockedBadge : null
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.badgeContent}>
        {hasUnlocked ? (
          <>
            <Text style={styles.badgeEmoji}>📖</Text>
            <Text style={[styles.badgeText, textSizeStyles[size]]}>
              {unlockedCount} stor{unlockedCount === 1 ? 'y' : 'ies'}
            </Text>
          </>
        ) : nextMilestone ? (
          <>
            <Text style={styles.badgeEmoji}>🔒</Text>
            <Text style={[styles.badgeText, textSizeStyles[size]]}>
              {nextMilestone.daysRemaining ? 
                `${nextMilestone.daysRemaining} day${nextMilestone.daysRemaining === 1 ? '' : 's'}` : 
                'Soon'
              }
            </Text>
          </>
        ) : null}
        
        {isCloseToMilestone && (
          <View style={styles.pulseDot} />
        )}
      </View>
      
      {hasUnlocked && size === 'large' && (
        <Text style={styles.badgeSubtext} numberOfLines={1}>
          Tap to read memories
        </Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  badge: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  
  smallBadge: {
    minWidth: 60,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  
  mediumBadge: {
    minWidth: 80,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  largeBadge: {
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  unlockedBadge: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary + '40',
  },
  
  lockedBadge: {
    backgroundColor: theme.colors.background.tertiary + '40',
    borderColor: theme.colors.background.tertiary,
  },
  
  almostUnlockedBadge: {
    backgroundColor: theme.colors.status?.warning + '15' || '#FFA50015',
    borderColor: theme.colors.status?.warning + '40' || '#FFA50040',
  },
  
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  
  badgeEmoji: {
    fontSize: 12,
  },
  
  badgeText: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  smallText: {
    fontSize: 10,
  },
  
  mediumText: {
    fontSize: 11,
  },
  
  largeText: {
    fontSize: 12,
  },
  
  badgeSubtext: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.status?.warning || '#FFA500',
  }
});