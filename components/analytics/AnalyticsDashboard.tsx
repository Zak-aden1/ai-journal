import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { habitAnalytics, type HabitTimingPattern, type WeeklyHabitReport, type HabitCorrelationInsight } from '@/services/analytics/HabitAnalyticsService';
import { streakPredictor, type StreakForecast } from '@/services/analytics/StreakPredictionEngine';
import { enhancedAvatarPersonality, type SmartMotivationalMessage } from '@/lib/enhancedAvatarPersonality';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

/**
 * Comprehensive Analytics Dashboard
 * Provides users with insights into their habit patterns, predictions, and AI-powered recommendations
 */

const { width } = Dimensions.get('window');

interface HabitInsight {
  habitId: string;
  habitTitle: string;
  timingPattern: HabitTimingPattern;
  streakForecast: StreakForecast;
  weeklyReport: WeeklyHabitReport;
  smartMotivation: SmartMotivationalMessage;
}

interface DashboardTab {
  id: 'overview' | 'patterns' | 'predictions' | 'insights';
  title: string;
  icon: string;
}

export default function AnalyticsDashboard() {
  const { theme } = useTheme();
  const { habitsWithIds, goalsWithIds, avatar, isHydrated } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<DashboardTab['id']>('overview');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<HabitInsight[]>([]);
  const [correlations, setCorrelations] = useState<HabitCorrelationInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const styles = createStyles(theme);

  const tabs: DashboardTab[] = [
    { id: 'overview', title: 'Overview', icon: '📊' },
    { id: 'patterns', title: 'Patterns', icon: '🔍' },
    { id: 'predictions', title: 'Predictions', icon: '🔮' },
    { id: 'insights', title: 'AI Insights', icon: '🧠' },
  ];

  useEffect(() => {
    if (!isHydrated) return;
    loadAnalytics();
  }, [isHydrated]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all habits across goals
      const allHabits = Object.values(habitsWithIds).flat();
      
      // Use real data if available, otherwise show empty state
      if (allHabits.length === 0) {
        setInsights([]);
        setCorrelations([]);
        setLoading(false);
        return;
      }

      // Generate insights for each habit
      const habitInsights = await Promise.all(
        allHabits.slice(0, 5).map(async (habit) => { // Limit to 5 habits for performance
          try {
            const [timingPattern, streakForecast, weeklyReport] = await Promise.all([
              habitAnalytics.analyzeHabitTiming(habit.id),
              streakPredictor.generateStreakForecast(habit.id),
              habitAnalytics.generateWeeklyReport(habit.id, habit.title)
            ]);

            // Generate smart motivation
            const smartMotivation = await enhancedAvatarPersonality.generateEnhancedResponse(
              avatar.type,
              {
                currentVitality: avatar.vitality,
                recentEntries: [], // Would be populated from actual entries
                goals: goalsWithIds.map(g => g.title),
                timeOfDay: getTimeOfDay(),
                mode: 'Coach', // Default mode
                progress: {
                  habitsCompleted: weeklyReport.completions,
                  goalsInProgress: goalsWithIds.length
                }
              },
              habit.id
            );

            return {
              habitId: habit.id,
              habitTitle: habit.title,
              timingPattern,
              streakForecast,
              weeklyReport,
              smartMotivation: smartMotivation.motivation
            };
          } catch (habitError) {
            console.warn(`Error loading insights for habit ${habit.id}:`, habitError);
            return null;
          }
        })
      );

      // Filter out null results and set insights
      const validInsights = habitInsights.filter(insight => insight !== null) as HabitInsight[];
      setInsights(validInsights);

      // Analyze habit correlations
      if (allHabits.length >= 2) {
        const habitIds = allHabits.slice(0, 4).map(h => h.id); // Limit for performance
        const correlationInsights = await habitAnalytics.analyzeHabitCorrelations(habitIds);
        setCorrelations(correlationInsights);
      }

    } catch (analyticsError) {
      console.error('Error loading analytics:', analyticsError);
      setError('Unable to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (size: number = 60) => {
    const props = {
      vitality: avatar.vitality,
      size,
      animated: true,
    };

    switch (avatar.type) {
      case 'plant':
        return <PlantAvatar {...props} />;
      case 'pet':
        return <PetAvatar {...props} />;
      case 'robot':
        return <RobotAvatar {...props} />;
      default:
        return <BaseAvatar {...props} />;
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.interactive.primary} />
          <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>📊</Text>
          <Text style={styles.errorTitle}>Analytics Unavailable</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (insights.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📈</Text>
          <Text style={styles.emptyTitle}>No Analytics Yet</Text>
          <Text style={styles.emptyDescription}>
            Complete some habits to unlock insights and predictions!
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'patterns':
        return renderPatterns();
      case 'predictions':
        return renderPredictions();
      case 'insights':
        return renderAIInsights();
      default:
        return null;
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{insights.length}</Text>
          <Text style={styles.statLabel}>Analyzed Habits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {insights.length > 0 ? Math.round(insights.reduce((sum, i) => sum + i.timingPattern.completionRate * 100, 0) / insights.length) : 0}%
          </Text>
          <Text style={styles.statLabel}>Avg Success Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {insights.reduce((sum, i) => sum + i.streakForecast.currentStreak, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Streak Days</Text>
        </View>
      </View>

      {/* Quick Insights */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Insights</Text>
        {insights.slice(0, 3).map((insight, index) => (
          <View key={insight.habitId} style={styles.quickInsightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.habitTitle}>{insight.habitTitle}</Text>
              <View style={styles.riskBadge}>
                <Text style={[
                  styles.riskText,
                  { color: getRiskColor(insight.streakForecast.riskProfile, theme) }
                ]}>
                  {insight.streakForecast.riskProfile} risk
                </Text>
              </View>
            </View>
            <Text style={styles.insightText}>
              {getQuickInsight(insight)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPatterns = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {insights.map((insight) => (
        <View key={insight.habitId} style={styles.patternCard}>
          <Text style={styles.cardTitle}>{insight.habitTitle}</Text>
          
          {/* Timing Pattern */}
          <View style={styles.patternSection}>
            <Text style={styles.patternSectionTitle}>⏰ Optimal Timing</Text>
            <Text style={styles.patternText}>
              Best times: {insight.timingPattern.optimalHours.map(h => `${h}:00`).join(', ')}
            </Text>
            <Text style={styles.patternText}>
              Energy pattern: {insight.timingPattern.energyPattern}
            </Text>
          </View>

          {/* Weekly Pattern */}
          <View style={styles.patternSection}>
            <Text style={styles.patternSectionTitle}>📅 Weekly Pattern</Text>
            {Object.entries(insight.timingPattern.weekdayPattern)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([day, rate]) => (
                <View key={day} style={styles.weekdayRow}>
                  <Text style={styles.weekdayText}>{day}</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${rate * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.percentageText}>{Math.round(rate * 100)}%</Text>
                </View>
              ))}
          </View>

          {/* Difficult Days */}
          {insight.timingPattern.difficultDays.length > 0 && (
            <View style={styles.patternSection}>
              <Text style={styles.patternSectionTitle}>⚠️ Challenging Days</Text>
              <Text style={styles.patternText}>
                {insight.timingPattern.difficultDays.join(', ')}
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderPredictions = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {insights.map((insight) => (
        <View key={insight.habitId} style={styles.predictionCard}>
          <View style={styles.predictionHeader}>
            <Text style={styles.cardTitle}>{insight.habitTitle}</Text>
            <View style={[
              styles.sustainabilityBadge,
              { backgroundColor: getSustainabilityColor(insight.streakForecast.streakSustainabilityScore, theme) }
            ]}>
              <Text style={styles.sustainabilityText}>
                {insight.streakForecast.streakSustainabilityScore}% sustainable
              </Text>
            </View>
          </View>

          {/* Current Streak */}
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{insight.streakForecast.currentStreak}</Text>
            <Text style={styles.streakLabel}>current streak days</Text>
          </View>

          {/* Predictions */}
          <View style={styles.predictionsContainer}>
            <Text style={styles.predictionSectionTitle}>🔮 Forecasts</Text>
            
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Next 7 days:</Text>
              <Text style={[
                styles.predictionValue,
                { color: getPredictionColor(insight.streakForecast.predictions.day7, theme) }
              ]}>
                {Math.round(insight.streakForecast.predictions.day7 * 100)}%
              </Text>
            </View>

            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Next 14 days:</Text>
              <Text style={[
                styles.predictionValue,
                { color: getPredictionColor(insight.streakForecast.predictions.day14, theme) }
              ]}>
                {Math.round(insight.streakForecast.predictions.day14 * 100)}%
              </Text>
            </View>

            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>Next 30 days:</Text>
              <Text style={[
                styles.predictionValue,
                { color: getPredictionColor(insight.streakForecast.predictions.day30, theme) }
              ]}>
                {Math.round(insight.streakForecast.predictions.day30 * 100)}%
              </Text>
            </View>
          </View>

          {/* Risk Factors */}
          {insight.streakForecast.keyRiskFactors.length > 0 && (
            <View style={styles.riskFactorsContainer}>
              <Text style={styles.riskFactorsTitle}>⚠️ Risk Factors</Text>
              {insight.streakForecast.keyRiskFactors.slice(0, 2).map((factor, index) => (
                <View key={index} style={styles.riskFactorItem}>
                  <Text style={styles.riskFactorText}>{factor.factor}</Text>
                  <Text style={styles.mitigationText}>{factor.mitigation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Interventions */}
          {insight.streakForecast.optimalInterventions.length > 0 && (
            <View style={styles.interventionsContainer}>
              <Text style={styles.interventionsTitle}>💡 Recommendations</Text>
              {insight.streakForecast.optimalInterventions.slice(0, 3).map((intervention, index) => (
                <Text key={index} style={styles.interventionText}>
                  • {intervention}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderAIInsights = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Avatar Insights Header */}
      <View style={styles.avatarInsightsHeader}>
        <View style={styles.avatarDisplay}>
          {renderAvatar(80)}
        </View>
        <View style={styles.avatarInfo}>
          <Text style={styles.avatarName}>{avatar.name}</Text>
          <Text style={styles.avatarInsightsTitle}>Personal Insights</Text>
          <Text style={styles.avatarDescription}>
            Powered by AI analysis of your patterns
          </Text>
        </View>
      </View>

      {/* Smart Motivational Messages */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🧠 AI Insights</Text>
        {insights.map((insight) => (
          <View key={insight.habitId} style={styles.aiInsightCard}>
            <View style={styles.aiInsightHeader}>
              <Text style={styles.habitTitle}>{insight.habitTitle}</Text>
              <View style={[
                styles.urgencyBadge,
                { backgroundColor: getUrgencyColor(insight.smartMotivation.urgency, theme) }
              ]}>
                <Text style={styles.urgencyText}>{insight.smartMotivation.urgency}</Text>
              </View>
            </View>
            
            <Text style={styles.aiMessage}>{insight.smartMotivation.message}</Text>
            
            {insight.smartMotivation.specificRecommendation && (
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>💡 Recommendation:</Text>
                <Text style={styles.recommendationText}>
                  {insight.smartMotivation.specificRecommendation}
                </Text>
              </View>
            )}

            <View style={styles.insightMeta}>
              <Text style={styles.insightType}>
                {getTypeEmoji(insight.smartMotivation.type)} {insight.smartMotivation.type}
              </Text>
              <Text style={styles.confidenceText}>
                {Math.round(insight.smartMotivation.confidence * 100)}% confident
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Habit Correlations */}
      {correlations.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🔗 Habit Relationships</Text>
          {correlations.slice(0, 3).map((correlation, index) => (
            <View key={index} style={styles.correlationCard}>
              <Text style={styles.correlationInsight}>
                {correlation.insight}
              </Text>
              <View style={styles.correlationMeta}>
                <Text style={styles.correlationType}>
                  {getCorrelationEmoji(correlation.type)} {correlation.type}
                </Text>
                <Text style={styles.correlationStrength}>
                  {Math.abs(correlation.correlation * 100).toFixed(0)}% strength
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
}


// Helper functions
const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
};

const getRiskColor = (risk: string, theme: any) => {
  switch (risk) {
    case 'low': return theme.colors.success;
    case 'medium': return theme.colors.warning || '#FFA500';
    case 'high': return theme.colors.error || '#FF6B6B';
    default: return theme.colors.text.secondary;
  }
};

const getSustainabilityColor = (score: number, theme: any) => {
  if (score >= 70) return theme.colors.success + '20';
  if (score >= 50) return (theme.colors.warning || '#FFA500') + '20';
  return (theme.colors.error || '#FF6B6B') + '20';
};

const getPredictionColor = (prediction: number, theme: any) => {
  if (prediction >= 0.7) return theme.colors.success;
  if (prediction >= 0.5) return theme.colors.warning || '#FFA500';
  return theme.colors.error || '#FF6B6B';
};

const getUrgencyColor = (urgency: string, theme: any) => {
  switch (urgency) {
    case 'low': return theme.colors.success + '20';
    case 'medium': return (theme.colors.warning || '#FFA500') + '20';
    case 'high': return (theme.colors.error || '#FF6B6B') + '20';
    default: return theme.colors.background.secondary;
  }
};

const getTypeEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    insight: '💡',
    prediction: '🔮',
    encouragement: '💪',
    warning: '⚠️',
    celebration: '🎉'
  };
  return emojis[type] || '💬';
};

const getCorrelationEmoji = (type: string): string => {
  switch (type) {
    case 'positive': return '📈';
    case 'negative': return '📉';
    default: return '➡️';
  }
};

const getQuickInsight = (insight: HabitInsight): string => {
  const pattern = insight.timingPattern;
  const forecast = insight.streakForecast;
  
  if (forecast.riskProfile === 'high') {
    return `${forecast.currentStreak}-day streak needs attention. Success rate: ${Math.round(pattern.completionRate * 100)}%`;
  }
  
  if (pattern.energyPattern !== 'flexible') {
    return `Works best in ${pattern.energyPattern}. Current streak: ${forecast.currentStreak} days`;
  }
  
  return `${Math.round(pattern.completionRate * 100)}% success rate. ${forecast.currentStreak}-day streak going strong`;
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  tabBar: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: theme.colors.interactive.primary + '15',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.interactive.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.interactive.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 24,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  quickInsightCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  riskBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.background.tertiary,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  patternCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  patternSection: {
    marginBottom: theme.spacing.lg,
  },
  patternSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  patternText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  weekdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  weekdayText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    marginHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.interactive.primary,
  },
  percentageText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    minWidth: 35,
    textAlign: 'right',
  },
  predictionCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sustainabilityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sustainabilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  streakInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.interactive.primary,
  },
  streakLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  predictionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  predictionSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  predictionLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  riskFactorsContainer: {
    marginBottom: theme.spacing.lg,
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  riskFactorItem: {
    marginBottom: theme.spacing.sm,
  },
  riskFactorText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  mitigationText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  interventionsContainer: {
    marginTop: theme.spacing.md,
  },
  interventionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  interventionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  avatarInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    ...theme.shadows.sm,
  },
  avatarDisplay: {
    marginRight: theme.spacing.lg,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  avatarInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
    marginBottom: theme.spacing.xs,
  },
  avatarDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  aiInsightCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  urgencyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
  },
  aiMessage: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  recommendationContainer: {
    backgroundColor: theme.colors.background.tertiary + '40',
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.interactive.primary,
    marginBottom: theme.spacing.xs,
  },
  recommendationText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  insightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightType: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  confidenceText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  correlationCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: 16,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  correlationInsight: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  correlationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correlationType: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  correlationStrength: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
});