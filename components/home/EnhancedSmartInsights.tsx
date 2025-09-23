import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { SmartInsights, EnhancedInsight } from '@/services/ai/smartInsights';

interface EnhancedSmartInsightsProps {
  insights: SmartInsights;
  onActionPress?: (insight: EnhancedInsight) => void;
}

export function EnhancedSmartInsights({
  insights,
  onActionPress
}: EnhancedSmartInsightsProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.status?.error || '#FF6B6B';
      case 'medium': return theme.colors.status?.warning || '#FFA500';
      case 'low': return theme.colors.status?.success || '#22C55E';
      default: return theme.colors.text.secondary;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'timing': return '#4F46E5';
      case 'streak': return '#DC2626';
      case 'motivation': return '#059669';
      case 'pattern': return '#7C3AED';
      case 'recommendation': return '#EA580C';
      default: return theme.colors.primary;
    }
  };

  const handleInsightPress = (insightId: string) => {
    setExpandedInsight(expandedInsight === insightId ? null : insightId);
  };

  const handleActionPress = (insight: EnhancedInsight) => {
    onActionPress?.(insight);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🧠</Text>
        <Text style={styles.headerTitle}>Smart Insights</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI</Text>
        </View>
      </View>

      {/* Motivational Message */}
      {insights.motivationalMessage && (
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>{insights.motivationalMessage}</Text>
        </View>
      )}

      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        {insights.optimalTime && (
          <View style={styles.quickStat}>
            <Text style={styles.quickStatIcon}>🕒</Text>
            <Text style={styles.quickStatLabel}>Optimal</Text>
            <Text style={styles.quickStatValue}>{insights.optimalTime}</Text>
          </View>
        )}

        {insights.streakRisk && (
          <View style={styles.quickStat}>
            <Text style={styles.quickStatIcon}>
              {insights.streakRisk === 'high' ? '⚠️' : insights.streakRisk === 'medium' ? '⚡' : '✅'}
            </Text>
            <Text style={styles.quickStatLabel}>Risk</Text>
            <Text style={[styles.quickStatValue, { color: getPriorityColor(insights.streakRisk) }]}>
              {insights.streakRisk}
            </Text>
          </View>
        )}
      </View>

      {/* Enhanced Insights */}
      {insights.primaryInsights.length > 0 && (
        <ScrollView
          style={styles.insightsScroll}
          showsVerticalScrollIndicator={false}
        >
          {insights.primaryInsights.map((insight) => (
            <TouchableOpacity
              key={insight.id}
              style={[
                styles.insightCard,
                { borderLeftColor: getTypeColor(insight.type) }
              ]}
              onPress={() => handleInsightPress(insight.id)}
              activeOpacity={0.7}
            >
              <View style={styles.insightHeader}>
                <View style={styles.insightTitleRow}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(insight.priority) }]}>
                      {insight.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedInsight === insight.id ? '−' : '+'}
                </Text>
              </View>

              <Text style={styles.insightMessage}>{insight.message}</Text>

              {/* Expanded Content */}
              {expandedInsight === insight.id && (
                <View style={styles.expandedContent}>
                  <View style={styles.insightMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Type:</Text>
                      <Text style={[styles.metaValue, { color: getTypeColor(insight.type) }]}>
                        {insight.type}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Confidence:</Text>
                      <Text style={styles.metaValue}>
                        {Math.round(insight.confidence * 100)}%
                      </Text>
                    </View>
                  </View>

                  {insight.actionable && insight.suggestedAction && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: getTypeColor(insight.type) + '20' }]}
                      onPress={() => handleActionPress(insight)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.actionButtonText, { color: getTypeColor(insight.type) }]}>
                        {insight.suggestedAction}
                      </Text>
                      <Text style={[styles.actionArrow, { color: getTypeColor(insight.type) }]}>→</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Personalized Tip */}
      {insights.personalizedTip && (
        <View style={styles.tipContainer}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>{insights.personalizedTip}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  motivationContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  motivationText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickStatsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  quickStat: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  insightsScroll: {
    maxHeight: 200,
    marginBottom: theme.spacing.md,
  },
  insightCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: theme.spacing.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  expandIcon: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  insightMessage: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  expandedContent: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.primary,
  },
  insightMeta: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionArrow: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    flex: 1,
  },
});