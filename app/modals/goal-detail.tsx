import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Modal
} from 'react-native';
import { tokens } from '@/lib/theme';
import { PlantAvatar } from '@/components/avatars/PlantAvatar';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  habits: string[];
  why: string;
  obstacles: string[];
  category: 'health' | 'learning' | 'career' | 'personal';
  isActive: boolean;
}

interface Props {
  goal: Goal | null;
  visible: boolean;
  onClose: () => void;
}

const categoryEmojis = {
  health: '💪',
  learning: '📚',
  career: '💼',
  personal: '🌟'
};

const categoryColors = {
  health: '#EF4444',
  learning: '#3B82F6',
  career: '#8B5CF6',
  personal: '#F59E0B'
};

export default function GoalDetailModal({ goal, visible, onClose }: Props) {
  if (!goal) return null;

  const categoryColor = categoryColors[goal.category];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* <PlantAvatar vitality={20} /> */}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goal Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Goal Header - Keep as requested */}
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleRow}>
              <Text style={styles.categoryEmoji}>{categoryEmojis[goal.category]}</Text>
              <Text style={styles.goalTitle}>{goal.title}</Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {goal.category}
              </Text>
            </View>
          </View>
          
          <Text style={styles.goalDescription}>{goal.description}</Text>
          
          {/* My Why Section - Enhanced with heart icon */}
          <View style={styles.whySection}>
            <View style={styles.whySectionHeader}>
              <Text style={styles.whyIcon}>❤️</Text>
              <Text style={styles.whySectionTitle}>My Why</Text>
            </View>
            <View style={styles.whyCard}>
              <Text style={styles.whyText}>{goal.why}</Text>
            </View>
          </View>

          {/* Your Coach Section - New addition inspired by the image */}
          <View style={styles.coachSection}>
            <View style={styles.coachSectionHeader}>
              <Text style={styles.coachIcon}>🤖</Text>
              <Text style={styles.coachSectionTitle}>Your Coach</Text>
            </View>
            <View style={styles.coachCard}>
              <View style={styles.coachInfo}>
                <Text style={styles.coachName}>Alex - Goal Motivator</Text>
                <Text style={styles.coachSpecialty}>
                  💪 Specializes in {goal.category} goals and building consistent habits
                </Text>
                <View style={styles.coachBadge}>
                  <Text style={styles.coachBadgeText}>Encouraging & Practical</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Target Date Section - Enhanced design */}
          <View style={styles.targetSection}>
            <View style={styles.targetSectionHeader}>
              <Text style={styles.targetIcon}>🎯</Text>
              <Text style={styles.targetSectionTitle}>Target Date</Text>
            </View>
            <View style={styles.targetCard}>
              <Text style={styles.targetDate}>{goal.targetDate}</Text>
              <Text style={styles.targetSubtext}>My transformation goal</Text>
            </View>
          </View>

          {/* Progress Section - Enhanced with better visuals */}
          <View style={styles.progressSection}>
            <View style={styles.progressSectionHeader}>
              <Text style={styles.progressIcon}>📊</Text>
              <Text style={styles.progressSectionTitle}>Progress</Text>
            </View>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall completion</Text>
                <Text style={styles.progressPercent}>{goal.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${goal.progress}%`,
                      backgroundColor: categoryColor
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Milestones Section - New addition */}
          <View style={styles.milestonesSection}>
            <View style={styles.milestonesSectionHeader}>
              <Text style={styles.milestonesIcon}>⭐</Text>
              <Text style={styles.milestonesSectionTitle}>Milestones</Text>
            </View>
            <View style={styles.milestonesCard}>
              <View style={styles.milestoneItem}>
                <View style={styles.milestoneCheckCompleted}>
                  <Text style={styles.milestoneCheckText}>✓</Text>
                </View>
                <Text style={styles.milestoneText}>Started daily habit routine</Text>
              </View>
              <View style={styles.milestoneItem}>
                <View style={styles.milestoneCheckCompleted}>
                  <Text style={styles.milestoneCheckText}>✓</Text>
                </View>
                <Text style={styles.milestoneText}>Completed first month</Text>
              </View>
              <View style={styles.milestoneItem}>
                <View style={styles.milestoneCheck}>
                  <Text style={styles.milestoneNumber}>3</Text>
                </View>
                <Text style={styles.milestoneTextPending}>Reach 80% completion</Text>
              </View>
            </View>
          </View>
          
          {/* Habits Section - Enhanced */}
          {goal.habits.length > 0 && (
            <View style={styles.habitsSection}>
              <View style={styles.habitsSectionHeader}>
                <Text style={styles.habitsIcon}>🔄</Text>
                <Text style={styles.habitsSectionTitle}>Supporting Habits</Text>
              </View>
              <View style={styles.habitsCard}>
                {goal.habits.map((habit, index) => (
                  <View key={index} style={styles.habitItem}>
                    <View style={styles.habitDot} />
                    <Text style={styles.habitText}>{habit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Obstacles Section - Enhanced */}
          {goal.obstacles.length > 0 && (
            <View style={styles.obstaclesSection}>
              <View style={styles.obstaclesSectionHeader}>
                <Text style={styles.obstaclesIcon}>⚠️</Text>
                <Text style={styles.obstaclesSectionTitle}>Potential Obstacles</Text>
              </View>
              <View style={styles.obstaclesCard}>
                {goal.obstacles.map((obstacle, index) => (
                  <View key={index} style={styles.obstacleItem}>
                    <View style={styles.obstacleDot} />
                    <Text style={styles.obstacleText}>{obstacle}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons - Enhanced */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
              <Text style={styles.primaryActionText}>💬 Talk to Alex</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
              <Text style={styles.secondaryActionText}>✏️ Edit Goal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419', // Dark background like inspiration
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  closeButton: {
    paddingVertical: tokens.spacing.sm,
  },
  closeButtonText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  headerTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: tokens.spacing.xl,
    marginBottom: tokens.spacing.lg,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: tokens.spacing.md,
  },
  goalTitle: {
    ...tokens.type.hero,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  goalDescription: {
    ...tokens.type.body,
    color: '#94A3B8',
    marginBottom: tokens.spacing.xl,
    lineHeight: 22,
  },

  // Enhanced section styles
  whySection: {
    marginBottom: tokens.spacing.xl,
  },
  whySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  whyIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  whySectionTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  whyCard: {
    backgroundColor: '#1E293B',
    borderRadius: tokens.radius,
    padding: tokens.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  whyText: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 22,
  },

  coachSection: {
    marginBottom: tokens.spacing.xl,
  },
  coachSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  coachIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  coachSectionTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  coachCard: {
    backgroundColor: '#1E293B',
    borderRadius: tokens.radius,
    padding: tokens.spacing.lg,
  },
  coachInfo: {
    gap: tokens.spacing.sm,
  },
  coachName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  coachSpecialty: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  coachBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0EA5E9',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: tokens.spacing.sm,
  },
  coachBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  targetSection: {
    marginBottom: tokens.spacing.xl,
  },
  targetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  targetIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  targetSectionTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  targetCard: {
    backgroundColor: '#1E293B',
    borderRadius: tokens.radius,
    padding: tokens.spacing.lg,
  },
  targetDate: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  targetSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },

  progressSection: {
    marginBottom: tokens.spacing.xl,
  },
  progressSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  progressIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  progressSectionTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#1E293B',
    borderRadius: tokens.radius,
    padding: tokens.spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  progressLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  milestonesSection: {
    marginBottom: tokens.spacing.xl,
  },
  milestonesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  milestonesIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  milestonesSectionTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  milestonesCard: {
    backgroundColor: '#1E293B',
    borderRadius: tokens.radius,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneCheckCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  milestoneCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  },
  milestoneCheckText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneNumber: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneText: {
    fontSize: 16,
    color: '#E2E8F0',
    flex: 1,
  },
  milestoneTextPending: {
    fontSize: 16,
    color: '#94A3B8',
    flex: 1,
  },

  habitsSection: {
    marginBottom: tokens.spacing.xl,
  },
  habitsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  habitsIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  habitsSectionTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  habitsCard: {
    backgroundColor: '#1E293B',
    borderRadius: tokens.radius,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: tokens.spacing.md,
  },
  habitText: {
    fontSize: 16,
    color: '#E2E8F0',
    flex: 1,
  },

  obstaclesSection: {
    marginBottom: tokens.spacing.xl,
  },
  obstaclesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  obstaclesIcon: {
    fontSize: 18,
    marginRight: tokens.spacing.sm,
  },
  obstaclesSectionTitle: {
    ...tokens.type.section,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  obstaclesCard: {
    backgroundColor: '#1E293B',
    borderRadius: tokens.radius,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  obstacleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  obstacleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: tokens.spacing.md,
  },
  obstacleText: {
    fontSize: 16,
    color: '#E2E8F0',
    flex: 1,
  },

  actions: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  actionButton: {
    paddingVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.xl,
    borderRadius: tokens.radius,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#0EA5E9',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: '#374151',
  },
  secondaryActionText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
});