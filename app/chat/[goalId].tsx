import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AvatarRenderer, AvatarEmotionalState } from '@/components/avatars';
import { safeProperty } from '@/lib/safeRender';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore, ConversationMessage } from '@/stores/app';
import * as Haptics from 'expo-haptics';
import { generateAIResponse, initializeChatAI } from '@/services/ai/chat';
import { GoalContextBuilder, extractAppStateForContext } from '@/services/ai/contextBuilder';
import ReAnimated, { FadeInUp, Layout } from 'react-native-reanimated';
import { getAIConfig } from '@/services/ai/config';
import { VoiceToTextRecorder } from '@/components/VoiceToTextRecorder';

const QUICK_PROMPTS = [
  { text: "I'm feeling discouraged", emotion: 'supportive' as const },
  { text: "How are we doing?", emotion: 'motivational' as const },
  { text: "Help me stay motivated", emotion: 'motivational' as const },
  { text: "I completed my habits!", emotion: 'celebratory' as const },
];

export default function GoalChatScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const storeData = useAppStore();

    const { 
      goalsWithIds, 
      habitsWithIds, 
      avatar, 
      updateAvatarVitality,
      updateAvatarMemoryWithActivity,
      getGoalConversation,
      addConversationMessage,
      goalMeta,
      conversations,
      getAvatarRelationship,
      addRelationshipInteraction,
      getPersonalizedGreeting
    } = storeData;

  // Safe wrapper to get relationship stage
  const getRelationshipStage = (): string => {
    try {
      if (!getAvatarRelationship || typeof getAvatarRelationship !== 'function') {
        return 'stranger';
      }
      const relationship = getAvatarRelationship();
      const stage = safeProperty(relationship, 'stage', 'stranger');
      
      // Validate that the stage is one of the expected values
      const validStages = ['stranger', 'acquaintance', 'friend', 'companion', 'soulmate'];
      return validStages.includes(stage) ? stage : 'stranger';
    } catch (error) {
      console.error('Error getting relationship stage:', error);
      return 'stranger';
    }
  };

  // Safe emotional state calculation
  const getMessageEmotionalState = (message: ConversationMessage): AvatarEmotionalState => {
    try {
      // Direct emotion mapping
      if (typeof message.emotion === 'string') {
        switch (message.emotion) {
          case 'celebratory': return 'celebrating';
          case 'motivational': return 'motivated';
          case 'wise': return 'content';
          case 'supportive': return 'speaking';
          default: break;
        }
      }
      
      // Check if user mentioned completing habits for celebration
      const hasCompletionContext = messages.some(m => {
        if (!m || !m.isUser) return false;
        const raw = typeof m.content === 'string' ? m.content : String(m.content || '');
        const content = raw.toLowerCase();
        return content.includes('completed') || 
               content.includes('did my habits') ||
               content.includes('finished') ||
               content.includes('done');
      });
      
      const hasPositiveImpact = typeof message.vitalityImpact === 'number' && message.vitalityImpact > 0;
      
      if (hasCompletionContext && hasPositiveImpact) {
        return 'celebrating';
      }
      
      return 'speaking';
    } catch (error) {
      console.error('Error calculating emotional state:', error);
      return 'neutral';
    }
  };

  // Use messages directly from store instead of local state - with safety checks
  const messages = (goalId && getGoalConversation && typeof getGoalConversation === 'function') 
    ? getGoalConversation(goalId) || [] 
    : [];

  // Safety check for avatar
  const safeAvatar = avatar || {
    type: 'plant',
    name: 'Sage', 
    vitality: 50,
    memory: { milestones: [], patterns: { bestTimes: [], struggleDays: [], favoriteGoals: [] }, emotionalHistory: [], personalContext: { goalNames: [], habitTypes: [] } }
  };
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [dynamicPrompts, setDynamicPrompts] = useState(QUICK_PROMPTS);
  const [showVoiceToText, setShowVoiceToText] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  // Get current goal data
  let currentGoal = goalsWithIds.find(g => g.id === goalId);
  
  // Fallback: Create a goal object based on common dummy goal IDs
  if (!currentGoal && goalId) {
    const fallbackGoals = {
      '1': { 
        id: '1', 
        title: 'Read 12 books this year', 
        description: 'Build a consistent reading habit',
        avatar: { name: 'Sage' },
        progress: 0,
        totalHabits: 3,
        completedHabits: 0
      },
      '2': { 
        id: '2', 
        title: 'Run a marathon', 
        description: 'Train for 26.2 miles',
        avatar: { name: 'Runner' },
        progress: 0,
        totalHabits: 3,
        completedHabits: 0
      },
      '3': { 
        id: '3', 
        title: 'Learn Spanish conversationally', 
        description: 'Achieve fluency in Spanish',
        avatar: { name: 'Lingua' },
        progress: 0,
        totalHabits: 3,
        completedHabits: 0
      },
    };
    
    if (fallbackGoals[goalId as keyof typeof fallbackGoals]) {
      currentGoal = fallbackGoals[goalId as keyof typeof fallbackGoals];
    }
  }
  

  // Initialize AI service
  useEffect(() => {
    initializeChatAI(getAIConfig());
  }, []);

  useEffect(() => {
    if (!currentGoal || !goalId) return;

    // Load existing conversation or initialize new one
    const initializeChat = async () => {
      const existingMessages = getGoalConversation(goalId);
      
      if (existingMessages.length === 0) {
        // Use relationship-aware personalized greeting
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' :
                         hour < 17 ? 'afternoon' :
                         hour < 21 ? 'evening' : 'night';
                         
        const greeting = getPersonalizedGreeting(timeOfDay, {
          recentActivity: 'first_meeting',
          mood: safeAvatar.vitality <= 30 ? 'struggling' : safeAvatar.vitality <= 70 ? 'motivated' : 'excited'
        }) + ` Let's talk about ${currentGoal.title}!`;

        const initialMessage: ConversationMessage = {
          id: `msg-${Date.now()}`,
          content: greeting,
          isUser: false,
          timestamp: Date.now(),
          goalId: goalId,
          emotion: 'supportive',
          vitalityImpact: 2
        };
        
        addConversationMessage(initialMessage);
        
        // Small vitality boost for starting conversation
        updateAvatarVitality(Math.min(100, safeAvatar.vitality + 2));
        updateAvatarMemoryWithActivity('goal_interaction', currentGoal.title);
        
        // Track initial relationship interaction
        addRelationshipInteraction('message');
      }
    };

    initializeChat();
  }, [currentGoal, goalId, getGoalConversation, addConversationMessage, updateAvatarVitality, safeAvatar.vitality, updateAvatarMemoryWithActivity]);

  // Messages are now directly from store, no sync needed


  const generateGoalResponse = async (userMessage: string, emotion?: 'supportive' | 'celebratory' | 'motivational' | 'wise'): Promise<{ content: string; emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise'; vitalityImpact: number }> => {
    if (!currentGoal || !goalId) {
      throw new Error('Goal information is required for AI chat');
    }
    
    // Extract app state for context building
    const appState = extractAppStateForContext(goalId, {
      goalsWithIds,
      goalMeta,
      habitsWithIds,
      avatar,
      conversations,
    });
    
    // Build comprehensive context
    const goalContext = GoalContextBuilder.buildGoalContext(appState);
    const conversationContext = GoalContextBuilder.buildConversationContext(messages);
    
    // Generate AI response - no fallback, let errors bubble up
    const aiResponse = await generateAIResponse(userMessage, goalContext, conversationContext);
    
    return {
      content: aiResponse.content,
      emotion: aiResponse.emotion,
      vitalityImpact: aiResponse.vitalityImpact,
    };
  };

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || inputText.trim();
    if (!message || !currentGoal || !goalId || !isConnected || isTyping) return;
    
    // Clear any previous errors when attempting to send
    setConnectionError(null);

    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      content: String(message),
      isUser: true,
      timestamp: Date.now(),
      goalId: goalId,
    };

    console.log('Adding user message:', userMessage);
    addConversationMessage(userMessage);
    setInputText('');
    setIsTyping(true);
    
    // Messages added successfully
    
    // Haptic feedback
    Haptics.selectionAsync();

    // Start typing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingAnimation, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Generate AI response
    setTimeout(async () => {
      try {
        const aiResponse = await generateGoalResponse(userMessage.content);
        
        const goalMessage: ConversationMessage = {
          id: `msg-${Date.now()}-goal`,
          content: String(aiResponse.content ?? ''),
          isUser: false,
          timestamp: Date.now(),
          goalId: goalId,
          emotion: aiResponse.emotion,
          vitalityImpact: aiResponse.vitalityImpact
        };

        addConversationMessage(goalMessage);
        setIsTyping(false);
        typingAnimation.stopAnimation();
        typingAnimation.setValue(0);

        // Apply vitality boost from AI response
        updateAvatarVitality(Math.min(100, safeAvatar.vitality + aiResponse.vitalityImpact));
        updateAvatarMemoryWithActivity('goal_interaction', currentGoal.title);
        
        // Track relationship interaction based on conversation depth and content
        let interactionType: 'message' | 'goal_work' | 'celebration' | 'support' | 'deep_share' = 'message';
        
        // Determine interaction type based on user message content and AI response
        const messageContent = (userMessage.content || '').toLowerCase();
        const responseContent = (aiResponse.content || '').toLowerCase();
        
        if (messageContent.includes('completed') || messageContent.includes('achieved') || messageContent.includes('success')) {
          interactionType = 'celebration';
        } else if (messageContent.includes('struggling') || messageContent.includes('difficult') || messageContent.includes('help') || aiResponse.emotion === 'supportive') {
          interactionType = 'support';
        } else if (messageContent.includes('relationship') || messageContent.includes('how are we') || messageContent.includes('our connection')) {
          interactionType = 'deep_share';
        } else if (messageContent.length > 100 || aiResponse.emotion === 'wise') {
          interactionType = 'deep_share';
        } else if (messageContent.includes('goal') || responseContent.includes('habit')) {
          interactionType = 'goal_work';
        }
        
        // Track relationship interaction
        addRelationshipInteraction(interactionType);
        
        // Update dynamic prompts if available
        if ((aiResponse as any).suggestedPrompts) {
          setDynamicPrompts((aiResponse as any).suggestedPrompts);
        }
        
        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Failed to generate AI response:', error);
        setIsTyping(false);
        typingAnimation.stopAnimation();
        typingAnimation.setValue(0);
        
        // Handle connection errors specifically
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
          setConnectionError('Unable to connect to AI service. Please check your internet connection.');
          setIsConnected(false);
        } else if (errorMessage.includes('unavailable')) {
          setConnectionError('AI service is temporarily unavailable. Please try again later.');
          setIsConnected(false);
        } else if (errorMessage.includes('rate limit')) {
          setConnectionError('Too many requests. Please wait a moment and try again.');
        } else {
          setConnectionError('Failed to get AI response. Please try again.');
          setIsConnected(false);
        }
        
        // Show error haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 1500 + Math.random() * 1000); // 1.5-2.5 seconds
  };

  const handleVoiceToTextComplete = (audioUri: string, transcription?: string) => {
    setShowVoiceToText(false);
    setLiveTranscription('');
    
    if (transcription) {
      // Send the transcribed message immediately
      handleSendMessage(transcription);
    }
  };

  const handleTranscriptionUpdate = (text: string) => {
    setLiveTranscription(text);
  };

  const handleQuickPrompt = (prompt: { text: string; emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise' }) => {
    if (!currentGoal || !goalId || !isConnected || isTyping) return;
    
    // Clear any previous errors when attempting to send
    setConnectionError(null);
    
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      content: String(prompt.text),
      isUser: true,
      timestamp: Date.now(),
      goalId: goalId,
    };

    addConversationMessage(userMessage);
    setIsTyping(true);
    
    Haptics.selectionAsync();

    setTimeout(async () => {
      try {
        const aiResponse = await generateGoalResponse(prompt.text, prompt.emotion);
        
        const goalMessage: ConversationMessage = {
          id: `msg-${Date.now()}-goal`,
          content: String(aiResponse.content ?? ''),
          isUser: false,
          timestamp: Date.now(),
          goalId: goalId,
          emotion: aiResponse.emotion,
          vitalityImpact: aiResponse.vitalityImpact
        };

        addConversationMessage(goalMessage);
        setIsTyping(false);

        updateAvatarVitality(Math.min(100, safeAvatar.vitality + aiResponse.vitalityImpact));
        
        // Track relationship interaction for quick prompts too
        let quickInteractionType: 'message' | 'goal_work' | 'celebration' | 'support' | 'deep_share' = 'message';
        const promptContent = (prompt.text || '').toLowerCase();
        
        if (promptContent.includes('completed') || promptContent.includes('success')) {
          quickInteractionType = 'celebration';
        } else if (promptContent.includes('discouraged') || promptContent.includes('help') || promptContent.includes('motivated')) {
          quickInteractionType = 'support';
        }
        
        addRelationshipInteraction(quickInteractionType);
        
        // Update dynamic prompts if available
        if ((aiResponse as any).suggestedPrompts) {
          setDynamicPrompts((aiResponse as any).suggestedPrompts);
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error('Failed to generate AI response for quick prompt:', error);
        setIsTyping(false);
        
        // Handle connection errors specifically
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
          setConnectionError('Unable to connect to AI service. Please check your internet connection.');
          setIsConnected(false);
        } else if (errorMessage.includes('unavailable')) {
          setConnectionError('AI service is temporarily unavailable. Please try again later.');
          setIsConnected(false);
        } else if (errorMessage.includes('rate limit')) {
          setConnectionError('Too many requests. Please wait a moment and try again.');
        } else {
          setConnectionError('Failed to get AI response. Please try again.');
          setIsConnected(false);
        }
        
        // Show error haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }, 1200);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const testConnection = async () => {
    try {
      setConnectionError(null);
      // Simple connection test by trying to generate a minimal response
      const testResponse = await generateGoalResponse("Hello");
      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionError(`Connection failed: ${errorMessage}`);
      setIsConnected(false);
    }
  };

  const clearError = () => {
    setConnectionError(null);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!currentGoal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🤔</Text>
          <Text style={styles.errorText}>Hmm, I can&apos;t find that goal</Text>
          <Text style={styles.errorSubtext}>
            It might have been moved or doesn&apos;t exist yet.{'\n'}
            Try going back and selecting a goal again.
          </Text>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{currentGoal.title}</Text>
            <Text style={styles.headerSubtitle}>Powered by AI</Text>
          </View>
          
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={messages.length === 0 ? styles.emptyMessagesContainer : undefined}
        >
          {messages.length === 0 && !isTyping ? (
            /* Empty State Illustration */
            <View style={styles.emptyStateContainer}>
              <View style={styles.avatarIllustration}>
                {/* Central Avatar */}
                <View style={styles.centralAvatar}>
                  <AvatarRenderer 
                    type={safeAvatar.type} 
                    vitality={safeAvatar.vitality} 
                    size={120} 
                    animated 
                    emotionalState={messages.length > 0 ? 'content' : 'neutral'}
                    isTyping={false}
                    recentActivity="idle"
                    relationshipStage={getRelationshipStage()}
                  />
                </View>
                
                {/* Floating Icons */}
                <View style={[styles.floatingIcon, styles.floatingIcon1]}>
                  <Text style={styles.floatingEmoji}>📚</Text>
                </View>
                <View style={[styles.floatingIcon, styles.floatingIcon2]}>
                  <Text style={styles.floatingEmoji}>🎯</Text>
                </View>
                <View style={[styles.floatingIcon, styles.floatingIcon3]}>
                  <Text style={styles.floatingEmoji}>⭐</Text>
                </View>
                <View style={[styles.floatingIcon, styles.floatingIcon4]}>
                  <Text style={styles.floatingEmoji}>💪</Text>
                </View>
                <View style={[styles.floatingIcon, styles.floatingIcon5]}>
                  <Text style={styles.floatingEmoji}>🌱</Text>
                </View>
                <View style={[styles.floatingIcon, styles.floatingIcon6]}>
                  <Text style={styles.floatingEmoji}>✨</Text>
                </View>
              </View>
              
              <Text style={styles.emptyStateTitle}>
                Talk to {typeof (currentGoal as any).avatar?.name === 'string' ? (currentGoal as any).avatar.name : 'Your Companion'}
              </Text>
              
              <Text style={styles.emptyStateSubtitle}>
                Chat messages are cleared each time you{'\n'}
                leave this view to ensure your privacy.
              </Text>
            </View>
          ) : (
            /* Regular Messages */
            <>
              {messages.map((message, index) => {
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                
                // Group messages from same sender within 5 minutes
                const isGroupedWithPrevious = previousMessage && 
                  previousMessage.isUser === message.isUser && 
                  (message.timestamp - previousMessage.timestamp) < 300000; // 5 minutes
                
                const isGroupedWithNext = nextMessage && 
                  nextMessage.isUser === message.isUser && 
                  (nextMessage.timestamp - message.timestamp) < 300000; // 5 minutes
                
                const isFirstInGroup = !isGroupedWithPrevious;
                const isLastInGroup = !isGroupedWithNext;
                
                return (
                  <ReAnimated.View 
                    key={message.id}
                    entering={FadeInUp.duration(300).delay(index * 50)}
                    layout={Layout.springify().damping(12).stiffness(100)}
                    style={[
                      styles.messageContainer,
                      message.isUser ? styles.userMessageContainer : styles.goalMessageContainer,
                      isGroupedWithPrevious && styles.groupedMessage,
                    ]}
                  >
                    {/* Avatar for AI messages - only show for first message in group */}
                    {!message.isUser && isFirstInGroup && (
                      <View style={styles.messageAvatar}>
                        <AvatarRenderer
                          type={safeAvatar.type}
                          vitality={safeAvatar.vitality}
                          size={28}
                          animated
                          compact={true}
                          relationshipStage={getRelationshipStage()}
                          emotionalState={getMessageEmotionalState(message)}
                          isTyping={false}
                          recentActivity="message_sent"
                        />
                      </View>
                    )}
                    
                    {/* Spacer for grouped AI messages without avatar */}
                    {!message.isUser && !isFirstInGroup && (
                      <View style={styles.messageAvatarSpacer} />
                    )}
                    
                    <View style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.goalBubble,
                      // Adjust bubble corners for grouping
                      message.isUser && isGroupedWithPrevious && styles.userBubbleGroupedTop,
                      message.isUser && isGroupedWithNext && styles.userBubbleGroupedBottom,
                      !message.isUser && isGroupedWithPrevious && styles.goalBubbleGroupedTop,
                      !message.isUser && isGroupedWithNext && styles.goalBubbleGroupedBottom,
                    ]}>
                      <Text style={[
                        styles.messageText,
                        message.isUser ? styles.userMessageText : styles.goalMessageText
                      ]}>
                        {typeof message.content === 'string' ? message.content : String(message.content || '')}
                      </Text>
                      {/* Only show timestamp on last message of group */}
                      {isLastInGroup && (
                        <Text style={styles.timestamp}>
                          {message.timestamp && !isNaN(message.timestamp) ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Invalid time'}
                        </Text>
                      )}
                    </View>
                  </ReAnimated.View>
                );
              })}
              
              {/* Typing Indicator */}
              {isTyping && (
                <ReAnimated.View 
                  entering={FadeInUp.duration(200)}
                  style={styles.goalMessageContainer}
                >
                  <View style={styles.messageAvatar}>
                    <AvatarRenderer
                      type={safeAvatar.type}
                      vitality={safeAvatar.vitality}
                      size={28}
                      animated
                      compact={true}
                      relationshipStage={getRelationshipStage()}
                      emotionalState="thinking"
                      isTyping={true}
                      recentActivity="idle"
                    />
                  </View>
                  <View style={[styles.messageBubble, styles.goalBubble, styles.typingBubble]}>
                    <Animated.View style={[styles.typingDots, { opacity: typingAnimation }]}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </Animated.View>
                  </View>
                </ReAnimated.View>
              )}
            </>
          )}
        </ScrollView>

        {/* Connection Error Banner */}
        {connectionError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{connectionError}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity onPress={clearError} style={styles.dismissButton}>
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={testConnection} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Section - Quick Prompts + Input */}
        <View style={styles.bottomSection}>
          {/* Quick Prompts */}
          <ScrollView 
            horizontal 
            style={styles.quickPromptsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {dynamicPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickPrompt,
                  (!isConnected || isTyping) && styles.quickPromptDisabled
                ]}
                onPress={() => handleQuickPrompt(prompt)}
                disabled={!isConnected || isTyping}
              >
                <Text style={[
                  styles.quickPromptText,
                  (!isConnected || isTyping) && styles.quickPromptTextDisabled
                ]}>{prompt.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={styles.voiceButton}
                onPress={() => setShowVoiceToText(true)}
                disabled={!isConnected}
              >
                <Text style={[
                  styles.voiceButtonIcon,
                  !isConnected && styles.voiceButtonIconDisabled
                ]}>🎤</Text>
              </TouchableOpacity>
              
              <TextInput
                style={[
                  styles.textInput,
                  !isConnected && styles.textInputDisabled
                ]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isConnected ? "Say or type something..." : "AI connection required"}
                placeholderTextColor={theme.colors.text.muted}
                multiline
                maxLength={500}
                editable={isConnected}
              />
              
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isTyping || !isConnected) && styles.sendButtonDisabled
                ]}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping || !isConnected}
              >
                <Text style={styles.sendButtonIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Voice-to-Text Modal */}
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
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: '300',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm, // Reduce main padding since messageContainer now has it
    paddingTop: theme.spacing.md,
    paddingBottom: 0,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  avatarIllustration: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  centralAvatar: {
    zIndex: 10,
  },
  floatingIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingIcon1: {
    top: 40,
    left: 60,
  },
  floatingIcon2: {
    top: 20,
    right: 50,
  },
  floatingIcon3: {
    top: 100,
    left: 20,
  },
  floatingIcon4: {
    top: 160,
    right: 30,
  },
  floatingIcon5: {
    bottom: 60,
    left: 40,
  },
  floatingIcon6: {
    bottom: 40,
    right: 70,
  },
  floatingEmoji: {
    fontSize: 20,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md, // Better horizontal breathing room
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.lg, // Push user messages away from left edge for better balance
  },
  goalMessageContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginRight: theme.spacing.sm, // Subtle margin for visual balance
  },
  messageBubble: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
    maxWidth: '85%', // More width for user messages (no avatar)
  },
  goalBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.line,
    maxWidth: '70%', // Less width for AI messages (accounts for avatar)
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: 'white',
  },
  goalMessageText: {
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.text.secondary,
    marginHorizontal: 2,
  },
  bottomSection: {
    backgroundColor: theme.colors.background.primary,
  },
  quickPromptsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  quickPrompt: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.line,
    height: 32,
    justifyContent: 'center',
  },
  quickPromptText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 6,
    paddingBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceButtonIcon: {
    fontSize: 18,
  },
  voiceButtonIconDisabled: {
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
    maxHeight: 100,
    minHeight: 36,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.text.muted,
    opacity: 0.5,
  },
  sendButtonIcon: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  errorSubtext: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Connection error styles
  errorBanner: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#FF5252',
  },
  errorBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  dismissButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Disabled states
  textInputDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.background.primary,
  },
  quickPromptDisabled: {
    opacity: 0.5,
  },
  quickPromptTextDisabled: {
    opacity: 0.5,
  },
  // Message avatar styles
  messageAvatar: {
    marginRight: 6,
    alignSelf: 'flex-end',
    marginBottom: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  messageAvatarSpacer: {
    marginRight: 6,
    minWidth: 28,
  },
  voiceToTextContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  // Message grouping styles
  groupedMessage: {
    marginBottom: theme.spacing.xs, // Reduced spacing for grouped messages
  },
  userBubbleGroupedTop: {
    borderBottomRightRadius: 8, // Less rounded when grouped
  },
  userBubbleGroupedBottom: {
    borderTopRightRadius: 8, // Less rounded when grouped
  },
  goalBubbleGroupedTop: {
    borderBottomLeftRadius: 8, // Less rounded when grouped
  },
  goalBubbleGroupedBottom: {
    borderTopLeftRadius: 8, // Less rounded when grouped
  },
  // Typing indicator styles
  typingBubble: {
    minHeight: 32,
    justifyContent: 'center',
  },
});
