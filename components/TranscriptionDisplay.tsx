import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Pressable 
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface TranscriptionDisplayProps {
  transcription: string;
  isTranscribing: boolean;
  onTranscriptionEdit?: (editedText: string) => void;
  onClearTranscription?: () => void;
  showEditMode?: boolean;
  maxLength?: number;
}

export function TranscriptionDisplay({
  transcription,
  isTranscribing,
  onTranscriptionEdit,
  onClearTranscription,
  showEditMode = true,
  maxLength = 1000
}: TranscriptionDisplayProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription);
  const [wordCount, setWordCount] = useState(0);
  
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const pulseOpacity = useSharedValue(0.3);
  const editButtonScale = useSharedValue(1);
  const containerHeight = useSharedValue(120);
  
  useEffect(() => {
    setEditedText(transcription);
    updateWordCount(transcription);
  }, [transcription]);
  
  useEffect(() => {
    if (isTranscribing) {
      pulseOpacity.value = withTiming(1, { duration: 500 }, () => {
        pulseOpacity.value = withTiming(0.3, { duration: 500 });
      });
    }
  }, [isTranscribing]);
  
  useEffect(() => {
    if (isEditing) {
      containerHeight.value = withSpring(200);
      setTimeout(() => textInputRef.current?.focus(), 100);
    } else {
      containerHeight.value = withSpring(120);
    }
  }, [isEditing]);
  
  const updateWordCount = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      onTranscriptionEdit?.(editedText);
      setIsEditing(false);
    } else {
      // Enter edit mode
      editButtonScale.value = withSpring(0.95, {}, () => {
        editButtonScale.value = withSpring(1);
      });
      setIsEditing(true);
    }
  };
  
  const handleTextChange = (text: string) => {
    if (text.length <= maxLength) {
      setEditedText(text);
      updateWordCount(text);
    }
  };
  
  const handleCancelEdit = () => {
    setEditedText(transcription);
    setIsEditing(false);
    updateWordCount(transcription);
  };
  
  const handleClearAll = () => {
    setEditedText('');
    setWordCount(0);
    onClearTranscription?.();
    if (isEditing) {
      setIsEditing(false);
    }
  };
  
  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const animatedEditButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editButtonScale.value }],
  }));
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
  }));
  
  const hasContent = transcription.length > 0 || editedText.length > 0;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Live Transcription</Text>
          {isTranscribing && (
            <Animated.View style={[styles.listeningIndicator, animatedPulseStyle]}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningText}>Listening...</Text>
            </Animated.View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {wordCount > 0 && (
            <Text style={styles.wordCount}>{wordCount} words</Text>
          )}
          
          {hasContent && showEditMode && (
            <Animated.View style={animatedEditButtonStyle}>
              <TouchableOpacity
                style={[styles.editButton, isEditing && styles.editButtonActive]}
                onPress={handleEditToggle}
              >
                <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
      
      {/* Content Area */}
      <Animated.View style={[styles.contentContainer, animatedContainerStyle]}>
        {isEditing ? (
          <View style={styles.editingContainer}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              value={editedText}
              onChangeText={handleTextChange}
              multiline
              placeholder="Edit your transcription..."
              placeholderTextColor={`${theme.colors.text.primary}60`}
              textAlignVertical="top"
              maxLength={maxLength}
            />
            
            <View style={styles.editingActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {editedText.length}/{maxLength}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptionScroll}
            contentContainerStyle={styles.transcriptionContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
          >
            {hasContent ? (
              <Text style={styles.transcriptionText}>
                {transcription || editedText}
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isTranscribing 
                  ? 'Start speaking to see live transcription...' 
                  : 'Transcribed text will appear here'
                }
              </Text>
            )}
          </ScrollView>
        )}
      </Animated.View>
      
      {/* Footer Actions */}
      {hasContent && (
        <View style={styles.footer}>
          <Pressable 
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearButtonIcon}>🗑️</Text>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
          
          <View style={styles.transcriptionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Words</Text>
              <Text style={styles.statValue}>{wordCount}</Text>
            </View>
            
            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Characters</Text>
              <Text style={styles.statValue}>{(transcription || editedText).length}</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Quality Indicator */}
      {isTranscribing && (
        <View style={styles.qualityIndicator}>
          <View style={styles.qualityBars}>
            {[1, 2, 3, 4, 5].map((level) => (
              <Animated.View
                key={level}
                style={[
                  styles.qualityBar,
                  { 
                    backgroundColor: level <= 3 
                      ? theme.colors.primary 
                      : `${theme.colors.primary}60`,
                    height: 4 + (level * 2)
                  }
                ]}
              />
            ))}
          </View>
          <Text style={styles.qualityText}>Voice Quality</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  listeningText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  wordCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
  },
  editButtonActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  editButtonTextActive: {
    color: theme.colors.primary,
  },
  contentContainer: {
    overflow: 'hidden',
  },
  editingContainer: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
    textAlignVertical: 'top',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    minHeight: 100,
  },
  editingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  characterCount: {
    paddingHorizontal: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  transcriptionScroll: {
    flex: 1,
  },
  transcriptionContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  transcriptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.tertiary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
  },
  clearButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  transcriptionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  statSeparator: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.background.tertiary,
  },
  qualityIndicator: {
    marginTop: 12,
    alignItems: 'center',
  },
  qualityBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 4,
  },
  qualityBar: {
    width: 3,
    borderRadius: 1.5,
  },
  qualityText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});