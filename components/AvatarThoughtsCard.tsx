import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AvatarRenderer } from '@/components/avatars';
import { 
  canGenerateDailyThoughts, 
  generateDailyThoughts, 
  getTodaysThoughts, 
  getTimeUntilNextGeneration,
  AvatarThought 
} from '@/services/ai/thoughts';
import { GoalContext } from '@/services/ai/chat';
import * as Haptics from 'expo-haptics';

interface AvatarThoughtsCardProps {
  goalContext: GoalContext;
  onThoughtsGenerated?: (thoughts: AvatarThought) => void;
}

export function AvatarThoughtsCard({ goalContext, onThoughtsGenerated }: AvatarThoughtsCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [thoughts, setThoughts] = useState<AvatarThought | null>(null);
  const [canGenerate, setCanGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing thoughts and check availability on mount
  useEffect(() => {
    loadThoughtsState();
  }, [goalContext.id, loadThoughtsState]);

  const loadThoughtsState = useCallback(async () => {
    try {
      // Check if we can generate today
      const canGen = await canGenerateDailyThoughts(goalContext.id);
      setCanGenerate(canGen);
      
      if (!canGen) {
        // Load existing thoughts
        const existingThoughts = await getTodaysThoughts(goalContext.id);
        setThoughts(existingThoughts);
        
        if (existingThoughts) {
          const timeLeft = await getTimeUntilNextGeneration(goalContext.id);
          setTimeUntilNext(timeLeft);
        }
      } else {
        setThoughts(null);
        setTimeUntilNext(null);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading thoughts state:', error);
      setError('Unable to load thoughts status');
    }
  }, [goalContext.id]);

  // Update time until next generation every minute
  useEffect(() => {
    if (!canGenerate && thoughts) {
      const interval = setInterval(async () => {
        const timeLeft = await getTimeUntilNextGeneration(goalContext.id);
        setTimeUntilNext(timeLeft);
        
        // If time is up, refresh the state
        if (!timeLeft) {
          loadThoughtsState();
        }
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [canGenerate, thoughts, goalContext.id, loadThoughtsState]);

  const handleGenerateThoughts = async () => {
    if (!canGenerate || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    // Haptic feedback for button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const newThoughts = await generateDailyThoughts(goalContext);
      setThoughts(newThoughts);
      setCanGenerate(false);
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Calculate time until next generation
      const timeLeft = await getTimeUntilNextGeneration(goalContext.id);
      setTimeUntilNext(timeLeft);
      
      // Notify parent component
      onThoughtsGenerated?.(newThoughts);
      
    } catch (error) {
      console.error('Error generating thoughts:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate thoughts');
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatGeneratedTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarSection}>
          <AvatarRenderer 
            type={goalContext.avatar.type} 
            vitality={goalContext.avatar.vitality}
            size={40}
            animated={false}
          />
          <Text style={styles.avatarName}>{goalContext.avatar.name}</Text>
        </View>
        <Text style={styles.sectionTitle}>&apos;s Daily Thoughts</Text>
      </View>

      {/* Content */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadThoughtsState}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && canGenerate && (
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerateThoughts}
          disabled={isGenerating}
          activeOpacity={0.7}
        >
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
              <Text style={styles.generateButtonText}>Thinking...</Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>
              Get {goalContext.avatar.name}&apos;s Thoughts ✨
            </Text>
          )}
        </TouchableOpacity>
      )}

      {!error && thoughts && (
        <View style={styles.thoughtsContainer}>
          <Text style={styles.thoughtsText}>&quot;{thoughts.thoughts}&quot;</Text>
          <View style={styles.thoughtsFooter}>
            <Text style={styles.timestampText}>
              {formatGeneratedTime(thoughts.generated_at)}
            </Text>
            {timeUntilNext && (
              <Text style={styles.nextAvailableText}>
                Next thoughts in {timeUntilNext}
              </Text>
            )}
          </View>
        </View>
      )}

      {!error && !canGenerate && !thoughts && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={theme.colors.text.secondary} />
          <Text style={styles.loadingText}>Loading thoughts...</Text>
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
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  thoughtsContainer: {
    backgroundColor: theme.colors.background.tertiary + '40',
    borderRadius: 12,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  thoughtsText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  thoughtsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  nextAvailableText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: theme.colors.status?.error + '10' || '#FF6B6B10',
    borderRadius: 12,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.status?.error || '#FF6B6B',
    flex: 1,
  },
  retryButton: {
    backgroundColor: theme.colors.status?.error || '#FF6B6B',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});