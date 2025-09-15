import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  Animated,
  SectionList
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/stores/app';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { JournalEntryModal } from '@/components/JournalEntryModal';
import { QuickMoodBubbles } from '@/components/QuickMoodBubbles';
import { QuickMoodEntryModal } from '@/components/QuickMoodEntryModal';
import { VoiceToTextRecorder } from '@/components/VoiceToTextRecorder';
import { DeeperAnalysisModal } from '@/components/DeeperAnalysisModal';
import { generateSummaryTitle } from '@/lib/summaryGenerator';

type TimeframeFilter = 'all' | 'week' | 'month' | 'year';
type MoodFilter = '😊' | '😐' | '😔' | '😤' | '😍' | 'all';

export default function AuthenticJournalScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const { 
    submitJournalEntry, 
    entries,
    deleteEntry
  } = useAppStore();
  
  const listRef = useRef<SectionList<any>>(null);
  const [showJournalEntry, setShowJournalEntry] = useState(false);
  const [showQuickMoodEntry, setShowQuickMoodEntry] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showDeeperAnalysis, setShowDeeperAnalysis] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [cardAnimations] = useState<Map<string, Animated.Value>>(new Map());
  const [expansionAnimations] = useState<Map<string, Animated.Value>>(new Map());
  const [hintPulse] = useState(new Animated.Value(1));
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedQuickMood, setSelectedQuickMood] = useState<{ mood: '😊' | '😐' | '😔' | '😤' | '😍' | null; label: string }>({ mood: null, label: '' });
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  // Filter journal entries (only free_journal type)
  const journalEntries = entries.filter(entry => entry.type === 'free_journal');
  
  const filteredEntries = useMemo(() => {
    let filtered = journalEntries;
    
    // Apply timeframe filter
    if (timeframeFilter !== 'all') {
      const now = Date.now();
      const timeRanges = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      };
      const cutoff = now - timeRanges[timeframeFilter];
      filtered = filtered.filter(entry => entry.createdAt >= cutoff);
    }
    
    // Apply mood filter
    if (moodFilter !== 'all') {
      filtered = filtered.filter(entry => entry.mood === moodFilter);
    }
    
    // Sort by newest first (non-mutating)
    return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  }, [journalEntries, timeframeFilter, moodFilter]);

  // Group entries by date for better organization
  const groupedEntries = useMemo(() => {
    const groups: Record<string, typeof filteredEntries> = {};
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    
    return groups;
  }, [filteredEntries]);

  // Build SectionList data from groups
  const sections = useMemo(() => {
    // Sort dates descending
    const entries = Object.entries(groupedEntries).sort(([a], [b]) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
    return entries.map(([date, data]) => ({ title: date, data }));
  }, [groupedEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app this might sync with backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleJournalEntrySave = async (text: string, mood?: '😊' | '😐' | '😔' | '😤' | '😍', voiceRecordingUri?: string) => {
    try {
      await submitJournalEntry(text, mood, voiceRecordingUri);
      setShowJournalEntry(false);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      // Show user-friendly error message
      Alert.alert(
        'Save Failed', 
        'Unable to save your journal entry. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleQuickMoodSelect = (mood: '😊' | '😐' | '😔' | '😤' | '😍', label: string) => {
    setSelectedQuickMood({ mood, label });
    setShowQuickMoodEntry(true);
  };

  const handleQuickMoodSave = async (mood: '😊' | '😐' | '😔' | '😤' | '😍', text?: string) => {
    try {
      const entryText = text || `Feeling ${selectedQuickMood.label.toLowerCase()} right now`;
      await submitJournalEntry(entryText, mood);
      setShowQuickMoodEntry(false);
      setSelectedQuickMood({ mood: null, label: '' });
    } catch (error) {
      console.error('Failed to save quick mood entry:', error);
      Alert.alert(
        'Save Failed', 
        'Unable to save your mood entry. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleVoiceRecordingComplete = async (audioUri: string, transcription?: string) => {
    try {
      const entryText = transcription || 'Voice note recorded';
      await submitJournalEntry(entryText, undefined, audioUri);
      setShowVoiceRecording(false);
    } catch (error) {
      console.error('Failed to save voice entry:', error);
      Alert.alert(
        'Save Failed', 
        'Unable to save your voice entry. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeeperAnalysis = async (entry: any) => {
    // Haptic feedback for AI button press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedEntry(entry);
    setShowDeeperAnalysis(true);
  };

  const toggleEntryExpansion = async (entryId: string) => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newExpanded = new Set(expandedEntries);
    const isExpanding = !newExpanded.has(entryId);
    
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    
    // Animate expansion/collapse with spring physics
    const expansionAnim = getExpansionAnimation(entryId);
    Animated.spring(expansionAnim, {
      toValue: isExpanding ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: false, // Height animations need layout
    }).start();
    
    setExpandedEntries(newExpanded);
  };

  const getCardAnimation = (entryId: string) => {
    if (!cardAnimations.has(entryId)) {
      cardAnimations.set(entryId, new Animated.Value(1));
    }
    return cardAnimations.get(entryId)!;
  };

  const getExpansionAnimation = (entryId: string) => {
    if (!expansionAnimations.has(entryId)) {
      const isExpanded = expandedEntries.has(entryId);
      expansionAnimations.set(entryId, new Animated.Value(isExpanded ? 1 : 0));
    }
    return expansionAnimations.get(entryId)!;
  };

  const animateCardPress = (entryId: string, callback: () => void) => {
    const animation = getCardAnimation(entryId);
    
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    callback();
  };

  const handleLongPress = async (entry: any) => {
    // Strong haptic feedback for long press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowQuickActions(entry.id);
  };

  const handleQuickAction = async (action: string, entry: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowQuickActions(null);
    
    switch (action) {
      case 'edit':
        // TODO: Implement edit functionality
        console.log('Edit entry:', entry.id);
        break;
      case 'delete':
        Alert.alert(
          'Delete Entry',
          'Are you sure you want to permanently delete this entry?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive', 
              onPress: async () => {
                try {
                  await deleteEntry(entry.id);
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {
                  console.error('Failed to delete entry', e);
                  Alert.alert('Delete Failed', 'Unable to delete the entry. Please try again.');
                }
              }
            }
          ]
        );
        break;
      case 'share':
        // TODO: Implement share functionality
        console.log('Share entry:', entry.id);
        break;
      case 'analyze':
        handleDeeperAnalysis(entry);
        break;
    }
  };

  // Subtle pulse animation for expand hints
  React.useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, [hintPulse]);

  const getMoodAccentColor = (mood?: string) => {
    const moodColors = {
      '😊': '#FFD700', // Happy - Gold
      '😐': '#87CEEB', // Neutral - Sky Blue
      '😔': '#B0C4DE', // Sad - Light Steel Blue
      '😤': '#FF6B6B', // Frustrated - Coral
      '😍': '#98FB98'  // Grateful - Pale Green
    };
    return moodColors[mood as keyof typeof moodColors] || theme.colors.primary;
  };

  const renderJournalEntry = (entry: any) => {
    const isExpanded = expandedEntries.has(entry.id);
    const summaryTitle = generateSummaryTitle(entry.text, entry.mood);
    const accentColor = getMoodAccentColor(entry.mood);
    
    const cardScale = getCardAnimation(entry.id);
    const expansionAnim = getExpansionAnimation(entry.id);
    
    return (
      <TouchableOpacity
        key={entry.id}
        onLongPress={() => handleLongPress(entry)}
        delayLongPress={500}
        activeOpacity={1}
      >
        <Animated.View 
          style={[
            styles.entryCard,
            entry.mood && { borderLeftColor: accentColor, borderLeftWidth: 4 },
            { transform: [{ scale: cardScale }] }
          ]}
        >
        {/* Header with mood, time, and voice indicator */}
        <View style={styles.entryHeader}>
          <View style={styles.entryMeta}>
            {entry.mood && (
              <Text style={styles.entryMoodEmoji}>{entry.mood}</Text>
            )}
            <Text style={styles.entryTime}>
              {new Date(entry.createdAt).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
            {entry.voiceRecordingUri && (
              <TouchableOpacity 
                style={styles.voiceIndicator}
                onPress={() => toggleVoicePlayback(entry)}
                accessibilityRole="button"
                accessibilityLabel={playingEntryId === entry.id ? 'Pause voice note' : 'Play voice note'}
              >
                <Text style={styles.voiceIcon}>
                  {playingEntryId === entry.id ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Subtle Deeper Analysis Button */}
          <TouchableOpacity 
            style={[
              styles.deeperButton,
              entry.mood && { borderColor: accentColor + '60' }
            ]}
            onPress={() => handleDeeperAnalysis(entry)}
            activeOpacity={0.8}
          >
            <Text style={styles.deeperButtonIcon}>•••</Text>
          </TouchableOpacity>
        </View>
        
        {/* Summary title (always shown) */}
        <TouchableOpacity 
          style={[
            styles.summaryContainer,
            isExpanded && styles.summaryContainerExpanded
          ]}
          onPress={() => animateCardPress(entry.id, () => toggleEntryExpansion(entry.id))}
          activeOpacity={0.9}
        >
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          {!isExpanded && (
            <Animated.Text style={[
              styles.expandHint,
              { transform: [{ scale: hintPulse }] }
            ]}>
              Tap to read more
            </Animated.Text>
          )}
        </TouchableOpacity>
        
        {/* Full text (animated expansion) */}
        <Animated.View 
          style={[
            styles.fullTextAnimationContainer,
            {
              opacity: expansionAnim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 0.8, 1],
              }),
              maxHeight: expansionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500], // Reduced max height for better performance
              }),
              transform: [{
                scaleY: expansionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                })
              }],
            }
          ]}
        >
          {isExpanded && (
            <View style={styles.fullTextContainer}>
              <Text style={styles.fullText}>
                {entry.text || 'Voice note recorded'}
              </Text>
              <TouchableOpacity 
                style={styles.collapseButton}
                onPress={() => animateCardPress(entry.id, () => toggleEntryExpansion(entry.id))}
              >
                <Text style={styles.collapseButtonText}>Show less</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
        </Animated.View>
        
        {/* Quick Actions Menu */}
        {showQuickActions === entry.id && (
          <View style={styles.quickActionsMenu}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('edit', entry)}
            >
              <Text style={styles.quickActionIcon}>✐</Text>
              <Text style={styles.quickActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('analyze', entry)}
            >
              <Text style={styles.quickActionIcon}>◆</Text>
              <Text style={styles.quickActionText}>Analyze</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('share', entry)}
            >
              <Text style={styles.quickActionIcon}>↗</Text>
              <Text style={styles.quickActionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.quickActionDanger]}
              onPress={() => handleQuickAction('delete', entry)}
            >
              <Text style={[styles.quickActionIcon, styles.quickActionDangerIcon]}>×</Text>
              <Text style={styles.quickActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const toggleVoicePlayback = async (entry: any) => {
    if (!entry.voiceRecordingUri) return;
    try {
      // Stop current
      if (playingEntryId === entry.id) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setPlayingEntryId(null);
        return;
      }
      // Switch to this entry
      if (soundRef.current) {
        try { await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: entry.voiceRecordingUri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingEntryId(entry.id);
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status && status.isLoaded && status.didJustFinish) {
          setPlayingEntryId(null);
          try { sound.unloadAsync(); } catch {}
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch (e) {
      console.error('Playback error', e);
      Alert.alert('Playback Error', 'Unable to play the voice note.');
    }
  };

  const renderDateGroup = (date: string, entries: typeof filteredEntries) => {
    const dateObj = new Date(date);
    const isToday = dateObj.toDateString() === new Date().toDateString();
    const isYesterday = dateObj.toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    let dateLabel = date;
    if (isToday) dateLabel = 'Today';
    else if (isYesterday) dateLabel = 'Yesterday';
    else {
      dateLabel = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short', 
        day: 'numeric',
        year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }
    
    return (
      <View key={date} style={styles.dateGroup}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <Text style={styles.entryCount}>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</Text>
        </View>
        {entries.map(renderJournalEntry)}
      </View>
    );
  };

  const timeframeOptions: { key: TimeframeFilter; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' }
  ];

  const moodOptions: { key: MoodFilter; label: string; emoji?: string }[] = [
    { key: 'all', label: 'All Moods' },
    { key: '😊', label: 'Happy', emoji: '😊' },
    { key: '😐', label: 'Neutral', emoji: '😐' },
    { key: '😔', label: 'Sad', emoji: '😔' },
    { key: '😤', label: 'Frustrated', emoji: '😤' },
    { key: '😍', label: 'Grateful', emoji: '😍' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isDark 
          ? ['#1a1a2e', '#16213e'] 
          : ['#667eea', '#764ba2']
        }
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Your Journal</Text>
            <Text style={styles.headerSubtitle}>
              {journalEntries.length} personal entr{journalEntries.length === 1 ? 'y' : 'ies'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.voiceShortcutButton}
              onPress={() => setShowVoiceRecording(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.voiceShortcutIcon}>●</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Mood Bubbles */}
        <QuickMoodBubbles onMoodSelect={handleQuickMoodSelect} />
        
        {/* Compact Write Button */}
        <TouchableOpacity 
          style={styles.compactWriteButton}
          onPress={() => setShowJournalEntry(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.compactWriteIcon}>⮚</Text>
          <Text style={styles.compactWriteText}>Write Freely</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Filters */}
      {journalEntries.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {/* Timeframe Filters */}
            {timeframeOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterButton,
                  timeframeFilter === option.key && styles.filterButtonActive
                ]}
                onPress={() => setTimeframeFilter(option.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  timeframeFilter === option.key && styles.filterButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Divider */}
            <View style={styles.filterDivider} />
            
            {/* Mood Filters */}
            {moodOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterButton,
                  moodFilter === option.key && styles.filterButtonActive
                ]}
                onPress={() => setMoodFilter(option.key)}
              >
                {option.emoji ? (
                  <View style={styles.moodFilterContent}>
                    <Text style={styles.moodFilterEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.filterButtonText,
                      moodFilter === option.key && styles.filterButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.filterButtonText,
                    moodFilter === option.key && styles.filterButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content: SectionList */}
      <SectionList
        ref={listRef}
        sections={filteredEntries.length > 0 ? sections : []}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => renderJournalEntry(item)}
        renderSectionHeader={({ section }) => {
          const dateObj = new Date(section.title);
          const isToday = dateObj.toDateString() === new Date().toDateString();
          const isYesterday = dateObj.toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
          let dateLabel = section.title;
          if (isToday) dateLabel = 'Today';
          else if (isYesterday) dateLabel = 'Yesterday';
          else {
            dateLabel = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
            });
          }
          return (
            <View style={styles.dateHeader}>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              <Text style={styles.entryCount}>{section.data.length} entr{section.data.length === 1 ? 'y' : 'ies'}</Text>
            </View>
          );
        }}
        ListHeaderComponent={(
          <View style={styles.entriesHeader}>
            {filteredEntries.length > 0 && (
              <Text style={styles.resultsCount}>
                {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'} found
              </Text>
            )}
          </View>
        )}
        ListFooterComponent={(
          <View style={styles.purposeReminder}>
            <Text style={styles.purposeTitle}>Your Journal, Your Voice</Text>
            <Text style={styles.purposeText}>
              This is your space for authentic self-expression. Write freely, reflect deeply, 
              and watch your thoughts evolve over time. Use optional AI insights when you want 
              deeper reflection, but this space is purely yours.
            </Text>
          </View>
        )}
        ListEmptyComponent={(
          journalEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateHeader}>
                <Text style={styles.emptyTitle}>Start Your Personal Journal</Text>
                <View style={styles.emptyTitleUnderline} />
              </View>
              <Text style={styles.emptyMessage}>
                Your thoughts, reflections, and experiences matter. Create your first entry 
                and begin capturing the moments that shape your journey.
              </Text>
              <View style={styles.emptyFeatures}>
                <Text style={styles.emptyFeature}>📝 Write freely about anything</Text>
                <Text style={styles.emptyFeature}>🎤 Record voice notes when words aren&apos;t enough</Text>
                <Text style={styles.emptyFeature}>😊 Track your emotional journey</Text>
                <Text style={styles.emptyFeature}>💭 Reflect deeper with optional AI insights</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noResultsState}>
              <Text style={styles.noResultsTitle}>No entries found</Text>
              <Text style={styles.noResultsMessage}>
                Try adjusting your filters to see more entries, or create a new one!
              </Text>
            </View>
          )
        )}
        contentContainerStyle={styles.entriesContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onScrollBeginDrag={() => {
          if (showQuickActions) setShowQuickActions(null);
        }}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setShowJournalEntry(true)}
        icon="✏️"
        text="Write"
        accessibilityLabel="Add journal entry"
        showPulse={journalEntries.length === 0}
      />

      {/* Journal Entry Modal */}
      <JournalEntryModal
        visible={showJournalEntry}
        onClose={() => setShowJournalEntry(false)}
        onSave={handleJournalEntrySave}
      />

      {/* Quick Mood Entry Modal */}
      <QuickMoodEntryModal
        visible={showQuickMoodEntry}
        mood={selectedQuickMood.mood}
        moodLabel={selectedQuickMood.label}
        onClose={() => {
          setShowQuickMoodEntry(false);
          setSelectedQuickMood({ mood: null, label: '' });
        }}
        onSave={handleQuickMoodSave}
      />

      {/* Voice Recording Modal */}
      {showVoiceRecording && (
        <Modal
          visible={showVoiceRecording}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowVoiceRecording(false)}
        >
          <SafeAreaView style={styles.voiceRecordingContainer}>
            <VoiceToTextRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              onCancel={() => setShowVoiceRecording(false)}
              mode="voice-to-text"
            />
          </SafeAreaView>
        </Modal>
      )}

      {/* Deeper Analysis Modal */}
      <DeeperAnalysisModal
        visible={showDeeperAnalysis}
        entry={selectedEntry}
        onClose={() => {
          setShowDeeperAnalysis(false);
          setSelectedEntry(null);
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  header: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },

  voiceShortcutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  voiceShortcutIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  voiceRecordingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  compactWriteButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  compactWriteIcon: {
    fontSize: 12,
    marginRight: theme.spacing.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  compactWriteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  filtersContainer: {
    backgroundColor: theme.colors.background.secondary + '40',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary + '50',
  },
  
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  
  filterButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    backgroundColor: theme.colors.background.tertiary + '30',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary + '60',
  },
  
  filterButtonActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary + '40',
  },
  
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  
  filterButtonTextActive: {
    color: theme.colors.primary,
  },
  
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.background.tertiary,
    alignSelf: 'center',
  },
  
  moodFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  moodFilterEmoji: {
    fontSize: 14,
  },
  
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl * 2,
  },
  
  emptyStateHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  
  emptyTitleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginTop: theme.spacing.sm,
  },
  
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  emptyMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  
  emptyFeatures: {
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  
  emptyFeature: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  
  noResultsState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  
  // Removed noResultsEmoji style for cleaner interface
  
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  noResultsMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Entries
  entriesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  
  entriesHeader: {
    marginBottom: theme.spacing.lg,
  },
  
  resultsCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  
  dateGroup: {
    marginBottom: theme.spacing.xl,
  },
  
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary + '40',
  },
  
  dateLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  
  entryCount: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  
  entryCard: {
    backgroundColor: theme.colors.background.secondary + 'F8',
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary + '40',
    
    // Enhanced shadow system
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  
  entryMoodEmoji: {
    fontSize: 18,
  },
  
  entryTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  voiceIndicator: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  
  voiceIcon: {
    fontSize: 8,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  
  summaryContainer: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.xs,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  
  summaryContainerExpanded: {
    backgroundColor: theme.colors.background.tertiary + '15',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary + '30',
  },
  
  summaryTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.2,
  },
  
  expandHint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    opacity: 0.8,
    textAlign: 'center',
    paddingVertical: theme.spacing.xs,
  },
  
  fullTextAnimationContainer: {
    overflow: 'hidden',
  },
  
  fullTextContainer: {
    backgroundColor: theme.colors.background.tertiary + '20',
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary + '30',
  },
  
  fullText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  
  collapseButtonText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  deeperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.tertiary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary + '50',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  
  deeperButtonIcon: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  
  purposeReminder: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  
  purposeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  purposeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Quick Actions Menu
  quickActionsMenu: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    marginBottom: theme.spacing.xs,
    minWidth: 80,
  },
  
  quickActionDanger: {
    backgroundColor: '#FF3B3020',
  },
  
  quickActionIcon: {
    fontSize: 12,
    marginRight: theme.spacing.xs,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  
  quickActionDangerIcon: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
  },
  
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  }
});
