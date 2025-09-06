import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
// Voice recognition will be implemented when ready for production builds
import * as FileSystem from 'expo-file-system';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

type VoiceToTextMode = 'voice-only' | 'voice-to-text';

interface VoiceToTextRecorderProps {
  onTranscriptionUpdate?: (text: string) => void;
  onRecordingComplete?: (audioUri: string, transcription?: string) => void;
  onCancel?: () => void;
  mode?: VoiceToTextMode;
  maxDuration?: number; // in seconds
}

export function VoiceToTextRecorder({ 
  onTranscriptionUpdate,
  onRecordingComplete,
  onCancel,
  mode = 'voice-to-text',
  maxDuration = 120 // 2 minutes default
}: VoiceToTextRecorderProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Recording state
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Speech recognition state
  const [transcription, setTranscription] = useState('');
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0);
  const microphoneRotation = useSharedValue(0);
  
  useEffect(() => {
    checkPermissions();
    checkSpeechAvailability();
  }, []);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            handleStopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDuration]);
  
  // Animation effects
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );
      waveOpacity.value = withRepeat(
        withTiming(1, { duration: 800 }),
        -1,
        true
      );
      microphoneRotation.value = withRepeat(
        withTiming(10, { duration: 500 }),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
      waveOpacity.value = withTiming(0);
      microphoneRotation.value = withSpring(0);
    }
  }, [isRecording]);
  
  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermissions(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'This app needs microphone access to record voice notes and provide speech-to-text functionality.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };
  
  const checkSpeechAvailability = async () => {
    // Speech recognition will be available in production builds
    // For now, just do voice recording
    setIsSpeechAvailable(false);
  };
  
  const startRecording = async () => {
    if (!hasPermissions) {
      await checkPermissions();
      return;
    }
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setTranscription('');
      
      // Start speech recognition if available
      if (isSpeechAvailable) {
        await startSpeechRecognition();
      }
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };
  
  const handleStopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    
    try {
      setIsRecording(false);
      setIsTranscribing(false);
      
      // Stop speech recognition if it's running
      if (isSpeechAvailable) {
        try {
          await Voice.stop();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        // Save to persistent storage
        const fileName = `voice_${Date.now()}.m4a`;
        const destination = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: destination });
        
        setAudioUri(destination);
        onRecordingComplete?.(destination, transcription || undefined);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
    }
  };
  
  const startSpeechRecognition = async () => {
    if (!isSpeechAvailable) return;
    
    try {
      // Clear any previous transcription
      setTranscription('');
      
      // Start voice recognition
      await Voice.start('en-US'); // You can make this configurable
      console.log('Voice recognition started');
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsTranscribing(false);
      
      // Show user-friendly error message
      Alert.alert(
        'Speech Recognition Error', 
        'Unable to start speech recognition. Your voice will still be recorded.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  const animatedWaveStyle = useAnimatedStyle(() => ({
    opacity: waveOpacity.value,
    transform: [
      { scale: interpolate(waveOpacity.value, [0, 1], [0.8, 1.2]) }
    ],
  }));
  
  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${microphoneRotation.value}deg` }],
  }));
  
  if (!hasPermissions) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Microphone Access Required</Text>
          <Text style={styles.permissionText}>
            To use voice recording and speech-to-text features, please grant microphone access.
          </Text>
          <Pressable style={styles.permissionButton} onPress={checkPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.modeIndicator}>
          <Text style={styles.modeText}>
            🎤 Voice Input
          </Text>
          <Text style={styles.modeSubtext}>
            {isSpeechAvailable ? 'Speak naturally - your words will be typed automatically' : 'Voice will be recorded for playback'}
          </Text>
        </View>
        
        {isRecording && (
          <View style={styles.durationContainer}>
            <View style={styles.recordingDot} />
            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.recordingArea}>
        {/* Visual feedback waves */}
        {isRecording && (
          <>
            <Animated.View style={[styles.wave, styles.wave1, animatedWaveStyle]} />
            <Animated.View style={[styles.wave, styles.wave2, animatedWaveStyle]} />
            <Animated.View style={[styles.wave, styles.wave3, animatedWaveStyle]} />
          </>
        )}
        
        {/* Main recording button */}
        <Animated.View style={animatedPulseStyle}>
          <Pressable
            style={[
              styles.recordButton,
              isRecording ? styles.recordButtonActive : styles.recordButtonInactive
            ]}
            onPress={isRecording ? handleStopRecording : startRecording}
          >
            <Animated.View style={animatedMicStyle}>
              <Text style={styles.recordButtonIcon}>
                {isRecording ? '⏹️' : '🎤'}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
        
        <Text style={styles.recordButtonLabel}>
          {isRecording ? 'Tap to Stop' : 'Tap to Start'}
        </Text>
      </View>
      
      {/* Transcription display - always shown */}
      <View style={styles.transcriptionContainer}>
        <View style={styles.transcriptionHeader}>
          <Text style={styles.transcriptionTitle}>
            {isSpeechAvailable ? 'Live Transcription' : 'Voice Recording'}
          </Text>
          {isTranscribing && (
            <View style={styles.transcribingIndicator}>
              <Text style={styles.transcribingText}>●</Text>
              <Text style={styles.transcribingLabel}>Listening...</Text>
            </View>
          )}
        </View>
        
        <View style={styles.transcriptionBox}>
          {transcription ? (
            <Text style={styles.transcriptionText}>{transcription}</Text>
          ) : (
            <Text style={styles.transcriptionPlaceholder}>
              {isRecording 
                ? (isSpeechAvailable ? 'Start speaking to see live transcription...' : 'Recording your voice...')
                : (isSpeechAvailable ? 'Transcribed text will appear here' : 'Your voice recording will be saved')
              }
            </Text>
          )}
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        {onCancel && (
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        )}
        
        {audioUri && !isRecording && (
          <Pressable 
            style={styles.saveButton}
            onPress={() => onRecordingComplete?.(audioUri, transcription || undefined)}
          >
            <Text style={styles.saveButtonText}>Save Recording</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  modeIndicator: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modeText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modeSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  recordingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
    height: 200,
  },
  wave: {
    position: 'absolute',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: theme.colors.primary + '40',
  },
  wave1: {
    width: 120,
    height: 120,
  },
  wave2: {
    width: 160,
    height: 160,
  },
  wave3: {
    width: 200,
    height: 200,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#ef4444',
  },
  recordButtonInactive: {
    backgroundColor: theme.colors.primary,
  },
  recordButtonIcon: {
    fontSize: 32,
  },
  recordButtonLabel: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  transcriptionContainer: {
    marginBottom: 32,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  transcribingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transcribingText: {
    fontSize: 12,
    color: '#ef4444',
    marginRight: 4,
  },
  transcribingLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  transcriptionBox: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  transcriptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  transcriptionPlaceholder: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});