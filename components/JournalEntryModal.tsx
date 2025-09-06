import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { VoiceToTextRecorder } from '@/components/VoiceToTextRecorder';
import { TranscriptionDisplay } from '@/components/TranscriptionDisplay';

type Mood = '😊' | '😐' | '😔' | '😤' | '😍';

interface JournalEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string, mood?: Mood, voiceRecordingUri?: string) => void;
}

const moods: { emoji: Mood; label: string; description: string }[] = [
  { emoji: '😊', label: 'Happy', description: 'Feeling good and positive' },
  { emoji: '😐', label: 'Neutral', description: 'Calm and balanced' },
  { emoji: '😔', label: 'Sad', description: 'Feeling down or melancholy' },
  { emoji: '😤', label: 'Frustrated', description: 'Annoyed or stressed' },
  { emoji: '😍', label: 'Grateful', description: 'Appreciative and thankful' },
];

export function JournalEntryModal({ visible, onClose, onSave }: JournalEntryModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [journalText, setJournalText] = useState('');
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(null);
  const [showVoiceToText, setShowVoiceToText] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');

  const handleSave = () => {
    if (!journalText.trim() && !voiceRecordingUri) {
      Alert.alert('Empty Entry', 'Please write something or record a voice note before saving.');
      return;
    }

    onSave(journalText.trim(), selectedMood || undefined, voiceRecordingUri || undefined);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to avoid visual glitch
    setTimeout(() => {
      setSelectedMood(null);
      setJournalText('');
      setVoiceRecordingUri(null);
      setShowVoiceToText(false);
      setLiveTranscription('');
    }, 300);
  };


  const handleVoiceToTextComplete = (audioUri: string, transcription?: string) => {
    setVoiceRecordingUri(audioUri);
    if (transcription) {
      setJournalText(transcription);
      setLiveTranscription('');
    }
    setShowVoiceToText(false);
  };

  const handleTranscriptionUpdate = (text: string) => {
    setLiveTranscription(text);
  };

  const handleTranscriptionEdit = (editedText: string) => {
    setJournalText(editedText);
  };

  const canSave = journalText.trim().length > 0 || voiceRecordingUri;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Journal Entry</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[
                styles.saveButton, 
                !canSave && styles.saveButtonDisabled
              ]}
              disabled={!canSave}
            >
              <Text style={[
                styles.saveButtonText,
                !canSave && styles.saveButtonTextDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Mood Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
              <Text style={styles.sectionSubtitle}>This helps your avatar understand your emotional journey</Text>
              
              <View style={styles.moodGrid}>
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.emoji}
                    style={[
                      styles.moodButton,
                      selectedMood === mood.emoji && styles.moodButtonSelected
                    ]}
                    onPress={() => setSelectedMood(mood.emoji)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Journal Text */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What&apos;s on your mind?</Text>
              <Text style={styles.sectionSubtitle}>
                Share your thoughts, experiences, or anything you want to remember
              </Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="Today I'm thinking about..."
                placeholderTextColor={`${theme?.colors?.text?.primary || '#999999'}60`}
                multiline
                numberOfLines={8}
                value={journalText}
                onChangeText={setJournalText}
                textAlignVertical="top"
              />
            </View>

            {/* Voice Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voice Input (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                Speak your thoughts and see them typed automatically
              </Text>
              
              {voiceRecordingUri ? (
                <View style={styles.voiceRecordedCard}>
                  <Text style={styles.voiceRecordedText}>📝 Voice input saved</Text>
                  <TouchableOpacity 
                    style={styles.voiceDeleteButton}
                    onPress={() => setVoiceRecordingUri(null)}
                  >
                    <Text style={styles.voiceDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.unifiedVoiceButton}
                  onPress={() => setShowVoiceToText(true)}
                >
                  <Text style={styles.unifiedVoiceEmoji}>🎤</Text>
                  <View style={styles.unifiedVoiceContent}>
                    <Text style={styles.unifiedVoiceTitle}>Voice Input</Text>
                    <Text style={styles.unifiedVoiceDescription}>
                      Tap to speak - your words will be typed automatically
                    </Text>
                  </View>
                  <View style={styles.voiceIndicator}>
                    <Text style={styles.voiceIndicatorText}>📝</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Live Transcription Display */}
            {liveTranscription && (
              <View style={styles.section}>
                <TranscriptionDisplay
                  transcription={liveTranscription}
                  isTranscribing={showVoiceToText}
                  onTranscriptionEdit={handleTranscriptionEdit}
                  showEditMode={true}
                />
              </View>
            )}

            {/* Encouragement Card */}
            <View style={styles.encouragementCard}>
              <Text style={styles.encouragementTitle}>✨ Your thoughts matter</Text>
              <Text style={styles.encouragementText}>
                Every entry becomes part of your growth story. Your avatar companion 
                will reflect on these moments with you as you continue your journey.
              </Text>
            </View>
          </ScrollView>


          {/* Voice-to-Text Recorder Modal */}
          {showVoiceToText && (
            <Modal
              visible={showVoiceToText}
              animationType="slide"
              presentationStyle="fullScreen"
              onRequestClose={() => setShowVoiceToText(false)}
            >
              <SafeAreaView style={styles.voiceToTextContainer}>
                <VoiceToTextRecorder
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                  onRecordingComplete={handleVoiceToTextComplete}
                  onCancel={() => setShowVoiceToText(false)}
                  mode="voice-to-text"
                />
              </SafeAreaView>
            </Modal>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
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
    paddingRight: theme.spacing.sm,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  moodButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.tertiary,
    padding: theme.spacing.xs,
  },
  moodButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme?.colors?.primary || '#007AFF'}20`,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    lineHeight: 24,
  },
  voiceRecordButton: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  voiceRecordEmoji: {
    fontSize: 20,
  },
  voiceRecordText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  voiceRecordedCard: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  voiceRecordedText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  voiceDeleteButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
  },
  voiceDeleteText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  encouragementCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  encouragementTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  encouragementText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  unifiedVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    gap: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unifiedVoiceEmoji: {
    fontSize: 28,
    minWidth: 36,
    textAlign: 'center',
  },
  unifiedVoiceContent: {
    flex: 1,
  },
  unifiedVoiceTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  unifiedVoiceDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  voiceIndicator: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIndicatorText: {
    fontSize: 16,
  },
  voiceToTextContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});