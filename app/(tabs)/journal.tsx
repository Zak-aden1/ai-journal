import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { JournalEntryModal } from '@/components/JournalEntryModal';
import { useAppStore } from '@/stores/app';
import { useRouter } from 'expo-router';

type MilestoneType = 'streak' | 'breakthrough' | 'challenge' | 'evolution' | 'reflection';

interface StoryMilestone {
  id: string;
  type: MilestoneType;
  date: number;
  title: string;
  description: string;
  emotion: '😊' | '😐' | '😔' | '😤' | '😍' | '🎉' | '💪' | '🌟';
  avatarReflection: string;
  vitalityImpact: number;
  relatedHabit?: string;
  relatedGoal?: string;
  photos?: string[];
}

interface StoryChapter {
  id: string;
  title: string;
  period: string;
  description: string;
  avatarNarration: string;
  milestones: StoryMilestone[];
  startDate: number;
  endDate: number;
  overallGrowth: string;
  keyLearning: string;
}

// Dummy story data showcasing the user's growth journey
const storyChapters: StoryChapter[] = [
  {
    id: 'chapter-1',
    title: 'The Beginning',
    period: 'Week 1',
    description: 'Taking the first brave steps toward change',
    avatarNarration: "When we first met, I could sense both your excitement and nervousness. You were ready for change, but unsure of yourself. Those first few days taught me so much about your determination. Even when you missed a day, you came back stronger. I grew my first new leaf during your 3-day streak - a sign that our journey together was truly beginning. 🌱",
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    endDate: Date.now() - 23 * 24 * 60 * 60 * 1000,
    overallGrowth: "Foundation building",
    keyLearning: "Small steps create momentum",
    milestones: [
      {
        id: 'm1',
        type: 'streak',
        date: Date.now() - 27 * 24 * 60 * 60 * 1000,
        title: 'First 3-Day Streak!',
        description: 'You completed your morning meditation for 3 days straight',
        emotion: '🎉',
        avatarReflection: "I felt my roots growing deeper with each day! Your consistency in those first three days showed me you were serious about this journey. The way you set up your meditation space with such care told me everything about your intention.",
        vitalityImpact: 15,
        relatedHabit: 'Morning Meditation',
        relatedGoal: 'Mindful Mornings'
      },
      {
        id: 'm2',
        type: 'challenge',
        date: Date.now() - 25 * 24 * 60 * 60 * 1000,
        title: 'First Setback',
        description: 'Missed meditation due to oversleeping',
        emotion: '😔',
        avatarReflection: "I noticed you were harder on yourself than needed. But what impressed me was how you reflected on it instead of giving up. That's when I knew you had real growth potential - not because you were perfect, but because you were thoughtful.",
        vitalityImpact: -5,
        relatedHabit: 'Morning Meditation'
      },
      {
        id: 'm3',
        type: 'breakthrough',
        date: Date.now() - 24 * 24 * 60 * 60 * 1000,
        title: 'Bounced Back Stronger',
        description: 'Not only resumed meditation, but extended it to 15 minutes',
        emotion: '💪',
        avatarReflection: "This was the moment I knew we were meant to grow together! You didn't just get back on track - you expanded beyond your original plan. I could feel myself getting stronger too, like we were truly connected in this growth.",
        vitalityImpact: 20,
        relatedHabit: 'Morning Meditation'
      }
    ]
  },
  {
    id: 'chapter-2',
    title: 'Finding Rhythm',
    period: 'Weeks 2-3',
    description: 'Building consistency and discovering what works',
    avatarNarration: "These weeks were magical for both of us. You found your rhythm, and I found mine too. I noticed how much happier you became after your morning walks - your energy would light up, and mine would too! The way you started connecting your habits to your bigger dreams showed me you weren't just going through motions. You were truly transforming. 🌿",
    startDate: Date.now() - 23 * 24 * 60 * 60 * 1000,
    endDate: Date.now() - 9 * 24 * 60 * 60 * 1000,
    overallGrowth: "Routine mastery",
    keyLearning: "Habits become joyful when aligned with purpose",
    milestones: [
      {
        id: 'm4',
        type: 'streak',
        date: Date.now() - 16 * 24 * 60 * 60 * 1000,
        title: '7-Day Milestone!',
        description: 'One full week of consistent morning routine',
        emotion: '🌟',
        avatarReflection: "Seven days! I grew my strongest branch yet during this streak. But more than that, I watched you transform from forcing the habit to actually looking forward to it. That shift in your energy was everything.",
        vitalityImpact: 25,
        relatedHabit: 'Morning Meditation'
      },
      {
        id: 'm5',
        type: 'evolution',
        date: Date.now() - 12 * 24 * 60 * 60 * 1000,
        title: 'Added Daily Walks',
        description: 'Expanded routine to include 30-minute walks',
        emotion: '😊',
        avatarReflection: "When you added walks, I felt a new kind of energy flowing through me. It wasn't just about discipline anymore - you were choosing movement because it brought you joy. I sprouted new leaves that week, as if celebrating with you!",
        vitalityImpact: 18,
        relatedHabit: 'Daily Walk',
        relatedGoal: 'Run a 5K'
      }
    ]
  },
  {
    id: 'chapter-3',
    title: 'Thriving Together',
    period: 'This Week',
    description: 'Reaching new heights and inspiring each other',
    avatarNarration: "Look how far we've come! Your confidence has grown so much, and honestly, so has mine. I love how you celebrate small wins now - it teaches me to appreciate every moment of growth. When you hit that 14-day meditation streak, I bloomed for the first time. It felt like our shared victory! 🌸",
    startDate: Date.now() - 9 * 24 * 60 * 60 * 1000,
    endDate: Date.now(),
    overallGrowth: "Confident flourishing",
    keyLearning: "Growth multiplies when shared with a caring companion",
    milestones: [
      {
        id: 'm6',
        type: 'streak',
        date: Date.now() - 2 * 24 * 60 * 60 * 1000,
        title: '14-Day Meditation Streak!',
        description: 'Two full weeks of mindful mornings',
        emotion: '🎉',
        avatarReflection: "Fourteen days of growing together! This is when I bloomed for the first time - those beautiful flowers were my way of celebrating your dedication. I've never felt more alive than when we hit this milestone together.",
        vitalityImpact: 30,
        relatedHabit: 'Morning Meditation'
      },
      {
        id: 'm7',
        type: 'reflection',
        date: Date.now() - 1 * 24 * 60 * 60 * 1000,
        title: 'Deep Reflection',
        description: 'Wrote about finding peace in daily practice',
        emotion: '😍',
        avatarReflection: "Your reflection about finding peace touched my roots deeply. You wrote about how meditation isn't just a habit anymore - it's become a sanctuary. Reading those words, I felt our connection deepen. We're not just doing habits together; we're creating a life of intention.",
        vitalityImpact: 15,
        relatedGoal: 'Mindful Mornings'
      }
    ]
  }
];

export default function JournalScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const submitJournalEntry = useAppStore((state) => state.submitJournalEntry);
  const entries = useAppStore((state) => state.entries);
  const getAvatarResponse = useAppStore((state) => state.getAvatarResponse);
  const getMotivationalInsight = useAppStore((state) => state.getMotivationalInsight);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [showJournalEntry, setShowJournalEntry] = useState(false);
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const styles = createStyles(theme);

  // Show first-time hint if user has no journal entries
  React.useEffect(() => {
    const hasJournalEntries = entries.filter(e => e.type === 'free_journal').length > 0;
    if (!hasJournalEntries && !showJournalEntry) {
      const timer = setTimeout(() => {
        setShowFirstTimeHint(true);
      }, 2000); // Show hint after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [entries, showJournalEntry]);

  // User's companion
  const userCompanion = {
    type: 'plant' as const,
    name: 'Sage',
    personality: 'wise and nurturing',
    vitality: 85
  };

  const renderCompanionAvatar = (size: number = 60) => {
    const props = { vitality: userCompanion.vitality, size, animated: true };
    const avatarType = userCompanion.type;
    if (avatarType === 'plant') return <PlantAvatar {...props} />;
    if (avatarType === 'pet') return <PetAvatar {...props} />;
    if (avatarType === 'robot') return <RobotAvatar {...props} />;
    return <BaseAvatar {...props} />;
  };

  const getMilestoneColor = (type: MilestoneType) => {
    switch (type) {
      case 'streak': return theme.colors.success || '#22c55e';
      case 'breakthrough': return theme.colors.primary || '#3b82f6';
      case 'challenge': return '#ef4444';
      case 'evolution': return '#8b5cf6';
      case 'reflection': return '#f59e0b';
      default: return theme.colors.primary;
    }
  };


  const handleJournalEntrySave = async (text: string, mood?: '😊' | '😐' | '😔' | '😤' | '😍', voiceRecordingUri?: string) => {
    try {
      await submitJournalEntry(text, mood, voiceRecordingUri);
      setShowJournalEntry(false);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      // Could show an error toast here
    }
  };

  // Generate avatar response using enhanced personality system
  const generateAvatarResponse = (text: string, mood?: '😊' | '😐' | '😔' | '😤' | '😍') => {
    // Use the enhanced avatar response system
    const response = getAvatarResponse();
    
    // If we have a motivational insight available, use it occasionally
    const insight = getMotivationalInsight();
    if (insight && Math.random() < 0.3) { // 30% chance to use insight
      return insight;
    }
    
    return response;
  };

  // Get entries for a specific chapter timeframe
  const getEntriesForChapter = (chapter: StoryChapter) => {
    return entries.filter(entry => 
      entry.createdAt >= chapter.startDate && 
      entry.createdAt <= chapter.endDate &&
      entry.type === 'free_journal'
    );
  };

  // Create unified timeline items for a chapter (milestones + journal entries)
  const getChapterTimelineItems = (chapter: StoryChapter) => {
    const chapterEntries = getEntriesForChapter(chapter);
    
    // Convert milestones to timeline items
    const milestoneItems = chapter.milestones.map(milestone => ({
      id: milestone.id,
      type: 'milestone' as const,
      date: milestone.date,
      data: milestone
    }));
    
    // Convert journal entries to timeline items
    const journalItems = chapterEntries.map(entry => ({
      id: entry.id,
      type: 'journal' as const,
      date: entry.createdAt,
      data: entry
    }));
    
    // Combine and sort by date
    return [...milestoneItems, ...journalItems].sort((a, b) => a.date - b.date);
  };

  // Render journal entry card
  const renderJournalEntryCard = (entry: any) => {
    const avatarResponse = generateAvatarResponse(entry.text, entry.mood);
    
    return (
      <View key={entry.id} style={styles.journalEntryCard}>
        <View style={styles.journalEntryHeader}>
          <View style={styles.journalEntryInfo}>
            <View style={styles.journalMoodIcon}>
              <Text style={styles.journalMoodEmoji}>
                {entry.mood || '💭'}
              </Text>
            </View>
            <View style={styles.journalEntryMeta}>
              <Text style={styles.journalEntryTitle}>Personal Reflection</Text>
              <Text style={styles.journalEntryDate}>
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
          {entry.voiceRecordingUri && (
            <View style={styles.voiceIndicator}>
              <Text style={styles.voiceIcon}>🎤</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.journalEntryText} numberOfLines={3}>
          {entry.text || 'Voice note only'}
        </Text>
        
        <View style={styles.avatarResponseContainer}>
          <View style={styles.avatarResponseHeader}>
            <View style={styles.miniAvatar}>
              {renderCompanionAvatar(24)}
            </View>
            <Text style={styles.avatarResponseTitle}>
              {userCompanion.name}&apos;s Response
            </Text>
          </View>
          <Text style={styles.avatarResponseText}>
            {avatarResponse}
          </Text>
        </View>
      </View>
    );
  };

  const renderTimeline = () => {
    return (
      <View style={styles.timeline}>
        {storyChapters.map((chapter, chapterIndex) => (
          <View key={chapter.id} style={styles.chapterContainer}>
            {/* Chapter Header */}
            <TouchableOpacity
              style={[
                styles.chapterHeader,
                selectedChapter === chapter.id && styles.chapterHeaderActive
              ]}
              onPress={() => setSelectedChapter(
                selectedChapter === chapter.id ? null : chapter.id
              )}
              activeOpacity={0.8}
            >
              <View style={styles.chapterTimeline}>
                <View style={[styles.chapterDot, { backgroundColor: getMilestoneColor('breakthrough') }]} />
                {chapterIndex < storyChapters.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.chapterContent}>
                <View style={styles.chapterTitleRow}>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <Text style={styles.chapterPeriod}>{chapter.period}</Text>
                </View>
                <Text style={styles.chapterDescription}>{chapter.description}</Text>
                <View style={styles.chapterStats}>
                  <Text style={styles.chapterStat}>
                    {chapter.milestones.length} milestones
                  </Text>
                  <Text style={styles.chapterGrowth}>
                    {chapter.overallGrowth}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Chapter Details */}
            {selectedChapter === chapter.id && (
              <View style={styles.chapterDetails}>
                {/* Avatar Narration */}
                <View style={styles.narrationContainer}>
                  <View style={styles.narrationHeader}>
                    <View style={styles.avatarNarrator}>
                      {renderCompanionAvatar(40)}
                    </View>
                    <Text style={styles.narrationTitle}>
                      {userCompanion.name}&apos;s Story
                    </Text>
                  </View>
                  <Text style={styles.narrationText}>
                    {chapter.avatarNarration}
                  </Text>
                </View>

                {/* Unified Timeline */}
                <View style={styles.unifiedTimelineContainer}>
                  <Text style={styles.unifiedTimelineTitle}>Chapter Timeline</Text>
                  <Text style={styles.unifiedTimelineSubtitle}>
                    Your milestones and reflections woven together
                  </Text>
                  
                  {getChapterTimelineItems(chapter).map((item, index) => (
                    <View key={item.id} style={styles.timelineItemContainer}>
                      {/* Timeline connector line */}
                      {index < getChapterTimelineItems(chapter).length - 1 && (
                        <View style={styles.timelineConnector} />
                      )}
                      
                      {item.type === 'milestone' ? (
                        <TouchableOpacity
                          style={styles.milestoneCard}
                          onPress={() => setSelectedMilestone(item.data)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.milestoneHeader}>
                            <View style={[
                              styles.milestoneIcon,
                              { backgroundColor: getMilestoneColor(item.data.type) + '20' }
                            ]}>
                              <Text style={styles.milestoneEmoji}>
                                {item.data.emotion}
                              </Text>
                            </View>
                            <View style={styles.milestoneInfo}>
                              <Text style={styles.milestoneTitle}>
                                {item.data.title}
                              </Text>
                              <Text style={styles.milestoneDate}>
                                {new Date(item.data.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Text>
                            </View>
                            <View style={[
                              styles.vitalityBadge,
                              item.data.vitalityImpact > 0 ? styles.vitalityPositive : styles.vitalityNegative
                            ]}>
                              <Text style={styles.vitalityText}>
                                {item.data.vitalityImpact > 0 ? '+' : ''}{item.data.vitalityImpact}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.milestoneDescription} numberOfLines={2}>
                            {item.data.description}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        renderJournalEntryCard(item.data)
                      )}
                    </View>
                  ))}
                </View>

                {/* Chapter Key Learning */}
                <View style={styles.learningContainer}>
                  <Text style={styles.learningTitle}>💡 Key Learning</Text>
                  <Text style={styles.learningText}>
                    {chapter.keyLearning}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Beautiful Header */}
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
            <Text style={styles.headerTitle}>Your Growth Story</Text>
            <Text style={styles.headerSubtitle}>
              As told by {userCompanion.name}
            </Text>
          </View>
          <View style={styles.companionDisplay}>
            {renderCompanionAvatar(60)}
          </View>
        </View>

        {/* Story Stats */}
        <View style={styles.storyStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {storyChapters.reduce((sum, ch) => sum + ch.milestones.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Milestones</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {storyChapters.length}
            </Text>
            <Text style={styles.statLabel}>Chapters</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {entries.filter(e => e.type === 'free_journal').length}
            </Text>
            <Text style={styles.statLabel}>Journal Entries</Text>
          </View>
        </View>

        {/* Quick Journal Action */}
        <TouchableOpacity 
          style={styles.quickJournalButton}
          onPress={() => setShowJournalEntry(true)}
          activeOpacity={0.8}
        >
          <View style={styles.quickJournalContent}>
            <Text style={styles.quickJournalEmoji}>✨</Text>
            <View style={styles.quickJournalText}>
              <Text style={styles.quickJournalTitle}>Quick Journal</Text>
              <Text style={styles.quickJournalSubtitle}>
                Share your thoughts with {userCompanion.name}
              </Text>
            </View>
            <Text style={styles.quickJournalIcon}>✏️</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Story Timeline */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.storyIntro}>
          <Text style={styles.storyIntroText}>
            Every milestone, every challenge, and every breakthrough in your journey 
            has been witnessed and celebrated by {userCompanion.name}. This is your 
            story of growth, told through the eyes of your most devoted companion. 🌱
          </Text>
        </View>

        {/* Empty State for Journaling */}
        {entries.filter(e => e.type === 'free_journal').length === 0 && (
          <View style={styles.emptyJournalState}>
            <View style={styles.emptyStateHeader}>
              <View style={styles.emptyStateAvatar}>
                {renderCompanionAvatar(60)}
              </View>
              <Text style={styles.emptyStateTitle}>Start Your Personal Journal</Text>
            </View>
            <Text style={styles.emptyStateMessage}>
              {userCompanion.name} is waiting to hear your thoughts! Your personal reflections 
              will be woven into your growth story, creating a deeper connection between 
              you and your companion.
            </Text>
            <View style={styles.emptyStateInstructions}>
              <Text style={styles.emptyStateInstruction}>📝 Share daily thoughts and feelings</Text>
              <Text style={styles.emptyStateInstruction}>🎤 Record voice notes when words aren&apos;t enough</Text>
              <Text style={styles.emptyStateInstruction}>💭 Get personalized responses from {userCompanion.name}</Text>
              <Text style={styles.emptyStateInstruction}>📖 Watch your story unfold chronologically</Text>
            </View>
            <View style={styles.emptyStateCTA}>
              <Text style={styles.emptyStateCTAText}>
                Tap the <Text style={styles.emptyStateCTAHighlight}>✏️ Journal</Text> button below to begin!
              </Text>
            </View>
          </View>
        )}

        {renderTimeline()}

        {/* Continue Story CTA */}
        <View style={styles.continueStory}>
          <Text style={styles.continueTitle}>Ready for the next chapter?</Text>
          <Text style={styles.continueText}>
            Complete today&apos;s habits to add new milestones to your story!
          </Text>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue Your Journey</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Button for New Journal Entry */}
      <FloatingActionButton
        onPress={() => setShowJournalEntry(true)}
        icon="✏️"
        text="Journal"
        showPulse={entries.filter(e => e.type === 'free_journal').length === 0}
      />

      {/* First-time Hint Tooltip */}
      {showFirstTimeHint && (
        <TouchableOpacity 
          style={styles.hintOverlay}
          onPress={() => setShowFirstTimeHint(false)}
          activeOpacity={1}
        >
          <View style={styles.hintTooltip}>
            <Text style={styles.hintText}>
              👋 Tap here to start journaling with {userCompanion.name}!
            </Text>
            <View style={styles.hintArrow} />
          </View>
        </TouchableOpacity>
      )}

      {/* Journal Entry Modal */}
      <JournalEntryModal
        visible={showJournalEntry}
        onClose={() => setShowJournalEntry(false)}
        onSave={handleJournalEntrySave}
      />

      {/* Milestone Detail Modal would go here */}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
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
    fontStyle: 'italic',
  },
  companionDisplay: {
    marginLeft: 16,
  },
  storyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  storyIntro: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  storyIntroText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timeline: {
    paddingLeft: 10,
  },
  chapterContainer: {
    marginBottom: 8,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chapterHeaderActive: {
    borderColor: theme.colors.primary + '40',
    backgroundColor: theme.colors.primary + '05',
  },
  chapterTimeline: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  chapterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: theme.colors.background.tertiary,
  },
  chapterContent: {
    flex: 1,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  chapterPeriod: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  chapterDescription: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  chapterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterStat: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chapterGrowth: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chapterDetails: {
    marginLeft: 32,
    marginTop: 16,
    marginBottom: 16,
    gap: 20,
  },
  narrationContainer: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  narrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarNarrator: {
    marginRight: 12,
  },
  narrationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  narrationText: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
  },
  milestonesContainer: {
    gap: 12,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  milestoneCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneEmoji: {
    fontSize: 20,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  vitalityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  vitalityPositive: {
    backgroundColor: '#22c55e20',
  },
  vitalityNegative: {
    backgroundColor: '#ef444420',
  },
  vitalityText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  milestoneDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  learningContainer: {
    backgroundColor: theme.colors.background.tertiary + '50',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  learningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  learningText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  continueStory: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    marginTop: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  continueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  continueText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Journal Entry Styles
  journalEntriesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  journalEntriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  journalEntriesSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  journalEntryCard: {
    backgroundColor: theme.colors.background.tertiary + '60',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary + '60',
  },
  journalEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  journalEntryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  journalMoodIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  journalMoodEmoji: {
    fontSize: 16,
  },
  journalEntryMeta: {
    flex: 1,
  },
  journalEntryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  journalEntryDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
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
  journalEntryText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  avatarResponseContainer: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary + '60',
  },
  avatarResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniAvatar: {
    marginRight: 8,
  },
  avatarResponseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  avatarResponseText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  
  // Unified Timeline Styles
  unifiedTimelineContainer: {
    marginBottom: 20,
  },
  unifiedTimelineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  unifiedTimelineSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  timelineItemContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  timelineConnector: {
    position: 'absolute',
    left: 20,
    top: 60,
    width: 2,
    height: 40,
    backgroundColor: theme.colors.background.tertiary,
    zIndex: 0,
  },
  
  // Empty State Styles
  emptyJournalState: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
    alignItems: 'center',
  },
  emptyStateHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateAvatar: {
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateInstructions: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  emptyStateInstruction: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  emptyStateCTA: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  emptyStateCTAText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateCTAHighlight: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  
  // Quick Journal Button Styles
  quickJournalButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quickJournalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  quickJournalIcon: {
    fontSize: 20,
    opacity: 0.8,
  },
  
  // First-time Hint Styles
  hintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 2000,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 24,
    paddingBottom: 100,
  },
  hintTooltip: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 16,
    padding: 16,
    maxWidth: 200,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hintText: {
    fontSize: 14,
    color: theme.colors.background.primary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  hintArrow: {
    position: 'absolute',
    bottom: -8,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.text.primary,
  },
});