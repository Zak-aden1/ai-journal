import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AvatarStory, StoryUnlockProgress } from '@/types/avatarStories';
import { AvatarRenderer } from '@/components/avatars';
import { AvatarType } from '@/components/avatars/types';

interface AvatarStoryModalProps {
  visible: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  stories: AvatarStory[];
  progress: StoryUnlockProgress;
  avatarType: AvatarType;
  avatarName: string;
  avatarVitality: number;
}

export const AvatarStoryModal: React.FC<AvatarStoryModalProps> = ({
  visible,
  onClose,
  goalId,
  goalTitle,
  stories,
  progress,
  avatarType,
  avatarName,
  avatarVitality
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedStory, setSelectedStory] = useState<AvatarStory | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);
  
  const sortedStories = stories.sort((a, b) => a.unlockedAt - b.unlockedAt);
  
  const getCategoryEmoji = (category: string) => {
    const emojis = {
      consistency: '🔄',
      breakthrough: '🎯', 
      challenge: '💪',
      growth: '🌱',
      synergy: '✨',
      reflection: '💭'
    };
    return emojis[category] || '📖';
  };
  
  const getMilestoneEmoji = (milestoneType: string) => {
    const emojis = {
      streak_3: '🌱',
      streak_7: '⭐',
      streak_14: '🚀',
      streak_30: '🏆',
      streak_60: '👑',
      streak_100: '💎',
      progress_25: '📈',
      progress_50: '🎯',
      progress_75: '💪',
      progress_100: '🎉'
    };
    return emojis[milestoneType] || '✨';
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const renderStoryList = () => (
    <ScrollView style={styles.storyList} showsVerticalScrollIndicator={false}>
      {sortedStories.map((story, index) => (
        <TouchableOpacity
          key={story.id}
          style={styles.storyCard}
          onPress={() => setSelectedStory(story)}
          activeOpacity={0.8}
        >
          <View style={styles.storyHeader}>
            <View style={styles.storyIconContainer}>
              <Text style={styles.storyMilestoneEmoji}>
                {getMilestoneEmoji(story.milestoneType)}
              </Text>
            </View>
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle} numberOfLines={1}>
                {story.title}
              </Text>
              <View style={styles.storyMeta}>
                <Text style={styles.storyCategory}>
                  {getCategoryEmoji(story.category)} {story.category}
                </Text>
                <Text style={styles.storyDate}>
                  {formatDate(story.unlockedAt)}
                </Text>
              </View>
            </View>
            <Text style={styles.readIndicator}>→</Text>
          </View>
          <Text style={styles.storyPreview} numberOfLines={2}>
            {story.content}
          </Text>
        </TouchableOpacity>
      ))}
      
      {/* Next Milestone Preview */}
      {progress.nextMilestone && (
        <View style={styles.nextMilestoneCard}>
          <View style={styles.lockedHeader}>
            <Text style={styles.lockedEmoji}>🔒</Text>
            <Text style={styles.nextMilestoneTitle}>Next Story</Text>
          </View>
          <Text style={styles.nextMilestoneDescription}>
            {progress.nextMilestone.description}
          </Text>
          {progress.nextMilestone.daysRemaining && (
            <Text style={styles.nextMilestoneDays}>
              {progress.nextMilestone.daysRemaining} day{progress.nextMilestone.daysRemaining === 1 ? '' : 's'} to go
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
  
  const renderStoryDetail = () => (
    <ScrollView style={styles.storyDetail} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedStory(null)}
      >
        <Text style={styles.backButtonText}>← Back to Stories</Text>
      </TouchableOpacity>
      
      <View style={styles.storyDetailHeader}>
        <Text style={styles.storyDetailMilestone}>
          {getMilestoneEmoji(selectedStory!.milestoneType)} {selectedStory!.title}
        </Text>
        <Text style={styles.storyDetailDate}>
          Unlocked {formatDate(selectedStory!.unlockedAt)}
        </Text>
      </View>
      
      <View style={styles.storyContent}>
        <Text style={styles.storyDetailText}>
          {selectedStory!.content}
        </Text>
        
        {selectedStory!.metadata.keyInsight && (
          <View style={styles.insightContainer}>
            <Text style={styles.insightTitle}>💡 Key Insight</Text>
            <Text style={styles.insightText}>
              {selectedStory!.metadata.keyInsight}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {selectedStory ? selectedStory.title : `${avatarName}'s Memories`}
              </Text>
              <Text style={styles.headerSubtitle}>
                {selectedStory ? 'Story Details' : goalTitle}
              </Text>
            </View>
            
            <View style={styles.headerAvatar}>
              <AvatarRenderer 
                type={avatarType} 
                vitality={avatarVitality} 
                size={40} 
                animated={true}
              />
            </View>
          </View>
          
          {/* Stats */}
          {!selectedStory && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stories.length}</Text>
                <Text style={styles.statLabel}>Stories Unlocked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{progress.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Math.round(progress.completionPercentage)}%</Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
            </View>
          )}
          
          {/* Content */}
          {selectedStory ? renderStoryDetail() : renderStoryList()}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  content: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  
  closeButton: {
    paddingVertical: theme.spacing.sm,
  },
  
  closeButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  
  headerAvatar: {
    marginLeft: theme.spacing.md,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary + '40',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  
  storyList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  
  storyCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  storyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  
  storyMilestoneEmoji: {
    fontSize: 20,
  },
  
  storyInfo: {
    flex: 1,
  },
  
  storyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  
  storyCategory: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  
  storyDate: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  
  readIndicator: {
    fontSize: 16,
    color: theme.colors.text.muted,
    marginLeft: theme.spacing.sm,
  },
  
  storyPreview: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginTop: theme.spacing.xs,
  },
  
  nextMilestoneCard: {
    backgroundColor: theme.colors.background.tertiary + '40',
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.background.tertiary,
  },
  
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  lockedEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  
  nextMilestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  
  nextMilestoneDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  nextMilestoneDays: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // Story Detail Styles
  storyDetail: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  
  backButton: {
    marginBottom: theme.spacing.lg,
  },
  
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  storyDetailHeader: {
    marginBottom: theme.spacing.xl,
  },
  
  storyDetailMilestone: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  storyDetailDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  
  storyContent: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  
  storyDetailText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  
  insightContainer: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  
  insightText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
  }
});