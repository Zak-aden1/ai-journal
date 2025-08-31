import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface GoalEnhancementSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: () => void;
}

interface GoalEnhancementCardProps {
  goalId: string;
  goalTitle: string;
  completenessScore: number; // 0-100
  suggestions: GoalEnhancementSuggestion[];
}

const IMPACT_COLORS = {
  low: '#10B981',    // Green
  medium: '#F59E0B', // Orange  
  high: '#EF4444',   // Red
};

const IMPACT_LABELS = {
  low: 'Small boost',
  medium: 'Good boost',
  high: 'Big impact',
};

export function GoalEnhancementCard({ 
  goalId, 
  goalTitle, 
  completenessScore, 
  suggestions 
}: GoalEnhancementCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getCompletenessLevel = (score: number) => {
    if (score >= 80) return { level: 'Optimized', color: '#10B981', emoji: '🌟' };
    if (score >= 60) return { level: 'Strong', color: '#F59E0B', emoji: '💪' };
    if (score >= 40) return { level: 'Good', color: '#6366F1', emoji: '👍' };
    return { level: 'Basic', color: '#6B7280', emoji: '🌱' };
  };

  const completeness = getCompletenessLevel(completenessScore);
  
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle} numberOfLines={1}>{goalTitle}</Text>
          <View style={styles.completenessContainer}>
            <View style={[styles.completenessIndicator, { backgroundColor: completeness.color }]}>
              <Text style={styles.completenessEmoji}>{completeness.emoji}</Text>
            </View>
            <Text style={styles.completenessText}>
              {completeness.level} ({completenessScore}% complete)
            </Text>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreNumber}>{completenessScore}</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>

      {/* Enhancement Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>
          {suggestions.length === 1 ? '1 suggestion' : `${suggestions.length} suggestions`} to boost your success
        </Text>
        
        {suggestions.slice(0, 2).map((suggestion, index) => (
          <TouchableOpacity
            key={suggestion.id}
            style={styles.suggestionItem}
            onPress={suggestion.action}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionContent}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <View style={[
                  styles.impactBadge, 
                  { backgroundColor: IMPACT_COLORS[suggestion.impact] + '15' }
                ]}>
                  <Text style={[
                    styles.impactText, 
                    { color: IMPACT_COLORS[suggestion.impact] }
                  ]}>
                    {IMPACT_LABELS[suggestion.impact]}
                  </Text>
                </View>
              </View>
              <Text style={styles.suggestionDescription} numberOfLines={2}>
                {suggestion.description}
              </Text>
            </View>
            <Text style={styles.suggestionArrow}>→</Text>
          </TouchableOpacity>
        ))}

        {suggestions.length > 2 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>
              View {suggestions.length - 2} more suggestions
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  completenessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completenessIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  completenessEmoji: {
    fontSize: 12,
  },
  completenessText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    padding: 8,
    minWidth: 50,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary + '40',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '600',
  },
  suggestionDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  suggestionArrow: {
    fontSize: 16,
    color: theme.colors.text.muted,
    marginLeft: 8,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});