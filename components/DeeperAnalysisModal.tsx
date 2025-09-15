import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface DeeperAnalysisModalProps {
  visible: boolean;
  entry: any;
  onClose: () => void;
}

interface AnalysisResult {
  insights: string[];
  questions: string[];
  patterns: string[];
  emotions: string[];
}

export function DeeperAnalysisModal({ visible, entry, onClose }: DeeperAnalysisModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && entry) {
      performAnalysis();
    }
  }, [visible, entry]);

  const performAnalysis = async () => {
    setLoading(true);
    
    // Simulate AI analysis - in production this would call your AI service
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockAnalysis = generateAnalysis(entry);
    setAnalysis(mockAnalysis);
    setLoading(false);
  };

  const generateAnalysis = (entry: any): AnalysisResult => {
    const text = entry.text?.toLowerCase() || '';
    const mood = entry.mood;
    
    // Simple analysis based on keywords and mood
    const insights: string[] = [];
    const questions: string[] = [];
    const patterns: string[] = [];
    const emotions: string[] = [];

    // Emotional analysis
    if (mood === '😔') {
      emotions.push('sadness', 'melancholy');
      insights.push('You seem to be experiencing some difficult emotions today.');
      questions.push('What specifically is weighing on your mind right now?');
      questions.push('Have you felt this way before in similar situations?');
    } else if (mood === '😊') {
      emotions.push('joy', 'contentment');
      insights.push('There&apos;s a positive energy in your entry today.');
      questions.push('What made this moment particularly special for you?');
      questions.push('How can you create more moments like this?');
    } else if (mood === '😤') {
      emotions.push('frustration', 'anger');
      insights.push('I sense some tension or frustration in your words.');
      questions.push('What triggered these feelings?');
      questions.push('What would need to change for you to feel different about this?');
    }

    // Text-based analysis
    if (text.includes('work') || text.includes('job')) {
      patterns.push('work-related thoughts');
      questions.push('How is your work-life balance affecting your wellbeing?');
    }
    
    if (text.includes('tired') || text.includes('exhausted')) {
      insights.push('You mention feeling tired - this might be affecting other areas of your life.');
      questions.push('What would help you feel more energized?');
    }

    if (text.includes('stress') || text.includes('anxious')) {
      emotions.push('stress', 'anxiety');
      questions.push('What coping strategies have worked for you in the past?');
    }

    if (text.includes('grateful') || text.includes('thankful')) {
      emotions.push('gratitude');
      insights.push('Gratitude is a powerful emotion that can shift perspective.');
      questions.push('What other things in your life deserve appreciation?');
    }

    // Default fallbacks if no specific patterns found
    if (insights.length === 0) {
      insights.push('Every thought and feeling deserves attention and care.');
    }
    
    if (questions.length === 0) {
      questions.push('What&apos;s behind this feeling or thought?');
      questions.push('How does this connect to what&apos;s important to you?');
    }

    return { insights, questions, patterns, emotions };
  };

  const handleClose = () => {
    setAnalysis(null);
    onClose();
  };

  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Deeper Reflection</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Original Entry */}
          <View style={styles.originalEntry}>
            <Text style={styles.originalEntryTitle}>Your entry:</Text>
            <View style={styles.originalEntryContent}>
              {entry.mood && (
                <Text style={styles.originalMood}>{entry.mood}</Text>
              )}
              <Text style={styles.originalText}>
                {entry.text || 'Voice note recorded'}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Analyzing your thoughts...</Text>
            </View>
          ) : analysis ? (
            <View style={styles.analysisContainer}>
              {/* Insights */}
              {analysis.insights.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💡 Insights</Text>
                  {analysis.insights.map((insight, index) => (
                    <View key={index} style={styles.insightCard}>
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Emotions Detected */}
              {analysis.emotions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🎭 Emotions Present</Text>
                  <View style={styles.emotionTags}>
                    {analysis.emotions.map((emotion, index) => (
                      <View key={index} style={styles.emotionTag}>
                        <Text style={styles.emotionTagText}>{emotion}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Reflection Questions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤔 Questions for Reflection</Text>
                {analysis.questions.map((question, index) => (
                  <View key={index} style={styles.questionCard}>
                    <Text style={styles.questionText}>{question}</Text>
                  </View>
                ))}
              </View>

              {/* Patterns */}
              {analysis.patterns.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🔍 Patterns Noticed</Text>
                  {analysis.patterns.map((pattern, index) => (
                    <View key={index} style={styles.patternCard}>
                      <Text style={styles.patternText}>{pattern}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {/* Encouragement */}
          <View style={styles.encouragement}>
            <Text style={styles.encouragementTitle}>🌱 Remember</Text>
            <Text style={styles.encouragementText}>
              Self-reflection is a journey, not a destination. Every insight, 
              no matter how small, contributes to your growth and understanding.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    borderBottomColor: theme.colors.background.tertiary,
  },

  closeButton: {
    paddingVertical: theme.spacing.sm,
  },

  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  placeholder: {
    width: 50, // Same width as close button for centering
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },

  originalEntry: {
    marginVertical: theme.spacing.lg,
  },

  originalEntryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },

  originalEntryContent: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },

  originalMood: {
    fontSize: 24,
    marginBottom: theme.spacing.sm,
  },

  originalText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },

  analysisContainer: {
    paddingBottom: theme.spacing.xl,
  },

  section: {
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },

  insightCard: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },

  insightText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },

  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },

  emotionTag: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },

  emotionTagText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },

  questionCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },

  questionText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  patternCard: {
    backgroundColor: theme.colors.background.secondary + '80',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  patternText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },

  encouragement: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },

  encouragementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },

  encouragementText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
