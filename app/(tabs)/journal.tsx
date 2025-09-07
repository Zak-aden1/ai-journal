import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/stores/app';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { JournalEntryModal } from '@/components/JournalEntryModal';
import { AvatarRenderer } from '@/components/avatars';

type TimeframeFilter = 'all' | 'week' | 'month' | 'year';
type MoodFilter = '😊' | '😐' | '😔' | '😤' | '😍' | 'all';

export default function AuthenticJournalScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const { 
    submitJournalEntry, 
    entries, 
    avatar,
    getAvatarResponse
  } = useAppStore();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [showJournalEntry, setShowJournalEntry] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

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
    
    // Sort by newest first
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
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
    }
  };

  const renderJournalEntry = (entry: any) => {
    const avatarResponse = getAvatarResponse('general');
    
    return (
      <View key={entry.id} style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryMeta}>
            {entry.mood && (
              <View style={styles.moodIcon}>
                <Text style={styles.moodEmoji}>{entry.mood}</Text>
              </View>
            )}
            <View style={styles.entryInfo}>
              <Text style={styles.entryTime}>
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
              {entry.voiceRecordingUri && (
                <View style={styles.voiceIndicator}>
                  <Text style={styles.voiceIcon}>🎤</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <Text style={styles.entryText}>
          {entry.text || 'Voice note recorded'}
        </Text>
        
        {/* Supportive Avatar Response */}
        <View style={styles.avatarResponse}>
          <View style={styles.avatarResponseHeader}>
            <View style={styles.miniAvatar}>
              <AvatarRenderer 
                type={avatar.type} 
                vitality={avatar.vitality} 
                size={24} 
                animated={false} 
              />
            </View>
            <Text style={styles.avatarResponseTitle}>
              {avatar.name} reflects
            </Text>
          </View>
          <Text style={styles.avatarResponseText}>
            {avatarResponse}
          </Text>
        </View>
      </View>
    );
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
        colors={theme.colors.background.primary === '#0F1419' 
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
          <View style={styles.headerAvatar}>
            <AvatarRenderer 
              type={avatar.type} 
              vitality={avatar.vitality} 
              size={50} 
              animated={true}
            />
          </View>
        </View>

        {/* Quick Journal Button */}
        <TouchableOpacity 
          style={styles.quickJournalButton}
          onPress={() => setShowJournalEntry(true)}
          activeOpacity={0.8}
        >
          <View style={styles.quickJournalContent}>
            <Text style={styles.quickJournalEmoji}>✏️</Text>
            <View style={styles.quickJournalText}>
              <Text style={styles.quickJournalTitle}>Write Your Thoughts</Text>
              <Text style={styles.quickJournalSubtitle}>
                What&apos;s on your mind today?
              </Text>
            </View>
            <Text style={styles.quickJournalArrow}>→</Text>
          </View>
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

      {/* Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {journalEntries.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyStateHeader}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>Start Your Personal Journal</Text>
            </View>
            <Text style={styles.emptyMessage}>
              Your thoughts, reflections, and experiences matter. Create your first entry 
              and begin capturing the moments that shape your journey.
            </Text>
            <View style={styles.emptyFeatures}>
              <Text style={styles.emptyFeature}>📝 Write freely about anything</Text>
              <Text style={styles.emptyFeature}>🎤 Record voice notes when words aren&apos;t enough</Text>
              <Text style={styles.emptyFeature}>😊 Track your emotional journey</Text>
              <Text style={styles.emptyFeature}>💭 Get supportive responses from {avatar.name}</Text>
            </View>
          </View>
        ) : filteredEntries.length === 0 ? (
          /* No Results State */
          <View style={styles.noResultsState}>
            <Text style={styles.noResultsEmoji}>🔍</Text>
            <Text style={styles.noResultsTitle}>No entries found</Text>
            <Text style={styles.noResultsMessage}>
              Try adjusting your filters to see more entries, or create a new one!
            </Text>
          </View>
        ) : (
          /* Journal Entries */
          <View style={styles.entriesContainer}>
            <View style={styles.entriesHeader}>
              <Text style={styles.resultsCount}>
                {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'} found
              </Text>
            </View>
            
            {Object.entries(groupedEntries).map(([date, entries]) => 
              renderDateGroup(date, entries)
            )}
          </View>
        )}
        
        {/* Journal Purpose Reminder */}
        <View style={styles.purposeReminder}>
          <Text style={styles.purposeTitle}>💡 Your Journal, Your Voice</Text>
          <Text style={styles.purposeText}>
            This is your space for authentic self-expression. Write freely, reflect deeply, 
            and watch your thoughts evolve over time. {avatar.name} is here to support you, 
            not to tell your story for you.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setShowJournalEntry(true)}
        icon="✏️"
        text="Write"
        showPulse={journalEntries.length === 0}
      />

      {/* Journal Entry Modal */}
      <JournalEntryModal
        visible={showJournalEntry}
        onClose={() => setShowJournalEntry(false)}
        onSave={handleJournalEntrySave}
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  
  headerAvatar: {
    marginLeft: theme.spacing.md,
  },
  
  quickJournalButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  quickJournalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  
  quickJournalEmoji: {
    fontSize: 24,
  },
  
  quickJournalText: {
    flex: 1,
  },
  
  quickJournalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  quickJournalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  
  quickJournalArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  
  filtersContainer: {
    backgroundColor: theme.colors.background.secondary + '60',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary + '40',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  
  filterButtonActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary + '40',
  },
  
  filterButtonText: {
    fontSize: 13,
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
  
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
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
  
  noResultsEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  
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
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  entryHeader: {
    marginBottom: theme.spacing.md,
  },
  
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  moodIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.tertiary + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  
  moodEmoji: {
    fontSize: 16,
  },
  
  entryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  entryTime: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  
  voiceIndicator: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  voiceIcon: {
    fontSize: 12,
  },
  
  entryText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  
  avatarResponse: {
    backgroundColor: theme.colors.primary + '08',
    borderRadius: 12,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary + '40',
  },
  
  avatarResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  miniAvatar: {
    marginRight: theme.spacing.sm,
  },
  
  avatarResponseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  
  avatarResponseText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
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
  }
});