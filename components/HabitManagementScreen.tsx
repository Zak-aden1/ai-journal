import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { HabitCreationModal } from '@/components/HabitCreationModal';
import { HabitEditModal } from '@/components/HabitEditModal';

interface HabitManagementScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface HabitCardProps {
  habit: {
    id: string;
    title: string;
    goalId?: string | null;
  };
  goalTitle?: string;
  onEdit: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  onReassign: (habitId: string) => void;
}

function HabitCard({ habit, goalTitle, onEdit, onDelete, onReassign }: HabitCardProps) {
  const { theme } = useTheme();
  const styles = createHabitCardStyles(theme);

  return (
    <View style={styles.habitCard}>
      <View style={styles.habitContent}>
        <Text style={styles.habitTitle}>{habit.title}</Text>
        {goalTitle && (
          <Text style={styles.habitGoal}>🎯 {goalTitle}</Text>
        )}
        {!goalTitle && habit.goalId === null && (
          <Text style={styles.habitStandalone}>⭐ Standalone habit</Text>
        )}
      </View>
      
      <View style={styles.habitActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onEdit(habit.id)}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onReassign(habit.id)}
        >
          <Text style={styles.actionButtonText}>🔗</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(habit.id)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function HabitManagementScreen({ visible, onClose }: HabitManagementScreenProps) {
  const { theme } = useTheme();
  const { 
    goalsWithIds, 
    standaloneHabits, 
    habitsWithIds, 
    deleteHabit,
    refreshStandaloneHabits,
    refreshHabitsForGoal 
  } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateHabit, setShowCreateHabit] = useState(false);
  const [showEditHabit, setShowEditHabit] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  
  const styles = createStyles(theme);

  // Filter habits based on search query
  const filteredStandaloneHabits = standaloneHabits.filter(habit =>
    habit.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGoalsWithHabits = goalsWithIds.map(goal => ({
    ...goal,
    habits: (habitsWithIds[goal.id] || []).filter(habit =>
      habit.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(goal => goal.habits.length > 0 || searchQuery === ''); // Show all goals when no search

  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const handleEditHabit = (habitId: string) => {
    setEditingHabitId(habitId);
    setShowEditHabit(true);
  };

  const handleDeleteHabit = async (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habitId);
              // Refresh data
              await refreshStandaloneHabits();
              for (const goal of goalsWithIds) {
                await refreshHabitsForGoal(goal.id);
              }
            } catch {
              Alert.alert('Error', 'Failed to delete habit');
            }
          }
        }
      ]
    );
  };

  const handleReassignHabit = (habitId: string) => {
    // TODO: Open reassignment modal
    Alert.alert('Reassign Habit', `Reassign habit ${habitId} - Coming soon!`);
  };

  const getTotalHabitsCount = () => {
    const goalHabitsCount = Object.values(habitsWithIds).reduce(
      (total, habits) => total + habits.length, 0
    );
    return goalHabitsCount + standaloneHabits.length;
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.headerButton}
            >
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Manage Habits</Text>
              <Text style={styles.subtitle}>{getTotalHabitsCount()} habits total</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowCreateHabit(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search habits..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Standalone Habits */}
            {(filteredStandaloneHabits.length > 0 || searchQuery === '') && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    ⭐ Standalone Habits ({standaloneHabits.length})
                  </Text>
                </View>
                
                {filteredStandaloneHabits.length > 0 ? (
                  filteredStandaloneHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onEdit={handleEditHabit}
                      onDelete={handleDeleteHabit}
                      onReassign={handleReassignHabit}
                    />
                  ))
                ) : searchQuery === '' ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No standalone habits yet</Text>
                    <Text style={styles.emptySubtext}>
                      Create habits for general wellness that don&apos;t fit a specific goal
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Goal-grouped Habits */}
            {goalsWithIds.length > 0 ? (
              goalsWithIds.map(goal => {
                const goalHabits = habitsWithIds[goal.id] || [];
                const filteredGoalHabits = goalHabits.filter(habit =>
                  habit.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const isExpanded = expandedGoals.has(goal.id);
                const shouldShow = filteredGoalHabits.length > 0 || searchQuery === '';
                
                if (!shouldShow) return null;

                return (
                  <View key={goal.id} style={styles.section}>
                    <TouchableOpacity 
                      style={styles.sectionHeader}
                      onPress={() => toggleGoalExpansion(goal.id)}
                    >
                      <Text style={styles.sectionTitle}>
                        🎯 {goal.title} ({goalHabits.length})
                      </Text>
                      <Text style={styles.expandIcon}>
                        {isExpanded ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>
                    
                    {isExpanded && (
                      <>
                        {filteredGoalHabits.length > 0 ? (
                          filteredGoalHabits.map(habit => (
                            <HabitCard
                              key={habit.id}
                              habit={habit}
                              goalTitle={goal.title}
                              onEdit={handleEditHabit}
                              onDelete={handleDeleteHabit}
                              onReassign={handleReassignHabit}
                            />
                          ))
                        ) : searchQuery === '' ? (
                          <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No habits for this goal yet</Text>
                          </View>
                        ) : null}
                      </>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Goal Habits</Text>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No goals yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create goals in the Goals tab to organize your habits
                  </Text>
                </View>
              </View>
            )}

            {/* Overall Empty State */}
            {getTotalHabitsCount() === 0 && searchQuery === '' && (
              <View style={styles.section}>
                <View style={styles.overallEmptyState}>
                  <Text style={styles.emptyTitle}>No habits yet! 🌱</Text>
                  <Text style={styles.emptyText}>
                    Start building better habits to achieve your goals
                  </Text>
                  <TouchableOpacity 
                    style={styles.createFirstButton}
                    onPress={() => setShowCreateHabit(true)}
                  >
                    <Text style={styles.createFirstButtonText}>Create Your First Habit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Search No Results */}
            {searchQuery !== '' && filteredStandaloneHabits.length === 0 && 
             filteredGoalsWithHabits.every(g => g.habits.length === 0) && (
              <View style={styles.section}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No habits found for &quot;{searchQuery}&quot;</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Habit Creation Modal */}
      <HabitCreationModal
        visible={showCreateHabit}
        onClose={() => setShowCreateHabit(false)}
      />

      {/* Habit Edit Modal */}
      <HabitEditModal
        visible={showEditHabit}
        onClose={() => {
          setShowEditHabit(false);
          setEditingHabitId(null);
        }}
        habitId={editingHabitId}
      />
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  headerButton: {
    paddingVertical: theme.spacing.sm,
    minWidth: 60,
  },
  closeText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: theme.colors.interactive.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  expandIcon: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  overallEmptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  createFirstButton: {
    backgroundColor: theme.colors.interactive.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 20,
    marginTop: theme.spacing.lg,
  },
  createFirstButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

const createHabitCardStyles = (theme: any) => StyleSheet.create({
  habitCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  habitGoal: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  habitStandalone: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  habitActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: theme.colors.error + '20',
  },
  actionButtonText: {
    fontSize: 16,
  },
});