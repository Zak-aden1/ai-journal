import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  avatarName: string;
  text?: string | null;
  updatedAt?: number | null;
  loading?: boolean;
  error?: string | null;
  canGenerate: boolean;
  nextAvailableIn?: string | null;
  accentColor?: string; // fallback to theme.colors.primary
  provenance?: string[]; // e.g., ["Streak 3", "0/2 today"]
  onGenerate: () => void;
};

export function AIThoughtCard({
  avatarName,
  text,
  updatedAt,
  loading = false,
  error,
  canGenerate,
  nextAvailableIn,
  accentColor,
  provenance = [],
  onGenerate,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = accentColor || theme.colors.primary;

  // Loading spinner animation
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (loading) {
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    }
  }, [loading, spinValue]);

  const spinRotation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Sparkle ping animation on mount
  const sparkleScale = useRef(new Animated.Value(0.8)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(sparkleScale, { toValue: 1.15, duration: 220, useNativeDriver: true }),
        Animated.timing(sparkleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(sparkleScale, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(sparkleOpacity, { toValue: 0.85, duration: 120, useNativeDriver: true }),
      ]),
    ]).start();
  }, [sparkleScale, sparkleOpacity]);

  const [showWhy, setShowWhy] = useState(false);

  const updatedLabel = useMemo(() => {
    if (!updatedAt) return undefined;
    const d = new Date(updatedAt);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay ? 'Updated today' : `Updated ${d.toLocaleDateString()}`;
  }, [updatedAt]);

  return (
    <LinearGradient
      colors={[`${accent}26`, theme.colors.background.secondary]}
      style={[styles.glowWrapper, { shadowColor: accent }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.innerCard}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Animated.Text
              style={[styles.sparkle, { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              ✨
            </Animated.Text>
            <Text style={styles.titleText}>{avatarName}&apos;s Analysis</Text>
            <View style={[styles.aiPill, { backgroundColor: `${accent}33`, borderColor: `${accent}66` }]}> 
              <Text style={[styles.aiPillText, { color: accent }]}>AI</Text>
            </View>
          </View>
          {!text && !loading && (
            <TouchableOpacity
              style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
              onPress={onGenerate}
              disabled={!canGenerate}
              accessibilityRole="button"
              accessibilityLabel={canGenerate ? "Generate today&apos;s analysis" : 'Generation locked until tomorrow'}
            >
              <Text style={styles.generateBtnText}>
                {canGenerate ? "Generate" : (nextAvailableIn ? `In ${nextAvailableIn}` : 'Tomorrow')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Body */}
        <View>
          {loading ? (
            <>
              <View style={styles.skelLine} />
              <View style={[styles.skelLine, { width: '80%' }]} />
            </>
          ) : text ? (
            <Text style={styles.contentText}>{text}</Text>
          ) : (
            <Text style={styles.emptyText}>No analysis yet for today.</Text>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Footer / Meta */}
        <View style={styles.footerRow}>
          {updatedLabel && <Text style={styles.metaText}>{updatedLabel}</Text>}
          {!canGenerate && nextAvailableIn && (
            <Text style={styles.metaText}>· New in {nextAvailableIn}</Text>
          )}
          {provenance.length > 0 && (
            <TouchableOpacity onPress={() => setShowWhy(v => !v)} accessibilityRole="button" style={styles.whyBtn}>
              <Text style={[styles.whyText, { color: accent }]}>{showWhy ? 'Hide why' : 'Why?'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {showWhy && provenance.length > 0 && (
          <View style={styles.provenanceBox}>
            {provenance.map((p, i) => (
              <Text key={i} style={styles.provenanceText}>• {p}</Text>
            ))}
          </View>
        )}

        {/* Secondary action (optional) */}
        {!text && canGenerate && (
          <TouchableOpacity 
            style={[
              styles.primaryCTA, 
              { backgroundColor: accent },
              loading && styles.primaryCTALoading
            ]} 
            onPress={onGenerate}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? "Generating analysis..." : "Generate today's analysis"}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Animated.View 
                  style={[
                    styles.loadingSpinner,
                    { transform: [{ rotate: spinRotation }] }
                  ]} 
                />
                <Text style={[styles.primaryCTAText, styles.loadingText]}>Analyzing...</Text>
              </View>
            ) : (
              <Text style={styles.primaryCTAText}>Generate today&apos;s analysis</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  glowWrapper: {
    borderRadius: 20,
    padding: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  innerCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkle: {
    fontSize: 18,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  aiPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  generateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.warning || '#F59E0B',
    marginTop: theme.spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  whyBtn: {
    marginLeft: 'auto',
  },
  whyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  provenanceBox: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  provenanceText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  primaryCTA: {
    marginTop: theme.spacing.md,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryCTALoading: {
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
  },
  loadingText: {
    opacity: 0.9,
  },
});

