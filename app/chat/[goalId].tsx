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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AvatarRenderer } from '@/components/avatars';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore, ConversationMessage } from '@/stores/app';
import * as Haptics from 'expo-haptics';

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

  const { 
    goalsWithIds, 
    habitsWithIds, 
    avatar, 
    updateAvatarVitality,
    getAvatarResponse,
    updateAvatarMemoryWithActivity,
    getGoalConversation,
    addConversationMessage
  } = useAppStore();

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;

  // Get current goal data
  let currentGoal = goalsWithIds.find(g => g.id === goalId);
  
  // Fallback: Create a goal object based on common dummy goal IDs
  if (!currentGoal && goalId) {
    const fallbackGoals = {
      '1': { id: '1', title: 'Read 12 books this year', avatar: { name: 'Sage' } },
      '2': { id: '2', title: 'Run a marathon', avatar: { name: 'Runner' } },
      '3': { id: '3', title: 'Learn Spanish conversationally', avatar: { name: 'Lingua' } },
    };
    
    if (fallbackGoals[goalId as keyof typeof fallbackGoals]) {
      currentGoal = fallbackGoals[goalId as keyof typeof fallbackGoals];
    }
  }
  
  const goalHabits = habitsWithIds[goalId || ''] || [];

  useEffect(() => {
    if (!currentGoal || !goalId) return;

    // Load existing conversation or initialize new one
    const initializeChat = async () => {
      const existingMessages = getGoalConversation(goalId);
      
      if (existingMessages.length > 0) {
        // Load existing conversation
        setMessages(existingMessages);
      } else {
        // Generate contextual greeting inline
        let greeting = "";
        const hour = new Date().getHours();
        const vitality = avatar.vitality;
        
        // Time-based greeting
        if (hour < 12) greeting = "Good morning! ";
        else if (hour < 17) greeting = "Good afternoon! ";
        else greeting = "Good evening! ";
        
        // Vitality-based personality
        if (vitality <= 30) {
          greeting += `I've been feeling quite weak lately... I really need your help to grow stronger. How are you feeling about ${currentGoal.title}?`;
        } else if (vitality <= 70) {
          greeting += `I'm feeling motivated and ready to help you with ${currentGoal.title}! What's on your mind today?`;
        } else {
          greeting += `I'm feeling absolutely vibrant today! ${currentGoal.title} is going amazingly well. How can we keep this momentum going?`;
        }

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
        setMessages([initialMessage]);
        
        // Small vitality boost for starting conversation
        updateAvatarVitality(Math.min(100, avatar.vitality + 2));
        updateAvatarMemoryWithActivity('goal_interaction', currentGoal.title);
      }
    };

    initializeChat();
  }, [currentGoal, goalId, getGoalConversation, addConversationMessage, updateAvatarVitality, avatar.vitality, updateAvatarMemoryWithActivity]);

  // Update messages when store changes
  useEffect(() => {
    if (goalId) {
      const storeMessages = getGoalConversation(goalId);
      setMessages(storeMessages);
    }
  }, [goalId, getGoalConversation]);


  const generateGoalResponse = (userMessage: string, emotion?: 'supportive' | 'celebratory' | 'motivational' | 'wise'): string => {
    if (!currentGoal) return "I'm here to help!";
    
    const vitality = avatar.vitality;
    const goalTitle = currentGoal.title;
    
    // Detect emotional keywords
    const isDiscouraged = /discouraged|frustrated|stuck|hard|difficult|giving up/i.test(userMessage);
    const isCelebrating = /completed|finished|did it|success|great|amazing|proud/i.test(userMessage);
    const isMotivation = /motivat|inspire|help|support|encourage|how.*doing/i.test(userMessage);
    
    let response = "";
    
    if (isCelebrating || emotion === 'celebratory') {
      if (vitality >= 80) {
        response = `🌟 YES! I felt that energy boost immediately! Your progress on ${goalTitle} is absolutely incredible. I'm practically glowing with vitality!`;
      } else {
        response = `🎉 Amazing work! I can feel myself getting stronger because of your dedication to ${goalTitle}. Every step you take helps us both grow!`;
      }
    } else if (isDiscouraged || emotion === 'supportive') {
      if (vitality <= 30) {
        response = `I understand how you feel - I've been struggling too. But remember, we're in this together. ${goalTitle} is important to both of us. What small step can we take today?`;
      } else {
        response = `Hey, it's okay to feel this way. ${goalTitle} is challenging, but I believe in you completely. I've seen your strength before, and I know you have it in you.`;
      }
    } else if (isMotivation || emotion === 'motivational') {
      const completionEncouragement = goalHabits.length > 0 
        ? ` Your ${goalHabits.length} supporting habits are the building blocks of this dream.`
        : "";
      
      if (vitality >= 80) {
        response = `We're doing phenomenally! ${goalTitle} is thriving because of your consistency.${completionEncouragement} I'm feeling stronger than ever!`;
      } else {
        response = `${goalTitle} is such a meaningful journey we're on together.${completionEncouragement} Every day you show up, I grow stronger. How can I support you today?`;
      }
    } else {
      // General conversation
      response = getAvatarResponse('general').replace(/companion|avatar/gi, goalTitle);
    }
    
    return response;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentGoal || !goalId) return;

    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      content: inputText.trim(),
      isUser: true,
      timestamp: Date.now(),
      goalId: goalId,
    };

    addConversationMessage(userMessage);
    setInputText('');
    setIsTyping(true);
    
    // Haptic feedback
    Haptics.selectionAsync();

    // Start typing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingAnimation, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Simulate thinking time
    setTimeout(() => {
      const response = generateGoalResponse(userMessage.content);
      const vitalityBoost = Math.floor(Math.random() * 3) + 1; // 1-3 boost
      
      const goalMessage: ConversationMessage = {
        id: `msg-${Date.now()}-goal`,
        content: response,
        isUser: false,
        timestamp: Date.now(),
        goalId: goalId,
        emotion: 'supportive',
        vitalityImpact: vitalityBoost
      };

      addConversationMessage(goalMessage);
      setIsTyping(false);
      typingAnimation.stopAnimation();
      typingAnimation.setValue(0);

      // Apply vitality boost
      updateAvatarVitality(Math.min(100, avatar.vitality + vitalityBoost));
      updateAvatarMemoryWithActivity('goal_interaction', currentGoal.title);
      
      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500 + Math.random() * 1000); // 1.5-2.5 seconds
  };

  const handleQuickPrompt = (prompt: { text: string; emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise' }) => {
    if (!currentGoal || !goalId) return;
    
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      content: prompt.text,
      isUser: true,
      timestamp: Date.now(),
      goalId: goalId,
    };

    addConversationMessage(userMessage);
    setIsTyping(true);
    
    Haptics.selectionAsync();

    setTimeout(() => {
      const response = generateGoalResponse(prompt.text, prompt.emotion);
      const vitalityBoost = 2; // Fixed boost for quick prompts
      
      const goalMessage: ConversationMessage = {
        id: `msg-${Date.now()}-goal`,
        content: response,
        isUser: false,
        timestamp: Date.now(),
        goalId: goalId,
        emotion: prompt.emotion,
        vitalityImpact: vitalityBoost
      };

      addConversationMessage(goalMessage);
      setIsTyping(false);

      updateAvatarVitality(Math.min(100, avatar.vitality + vitalityBoost));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>chat/[goalId]</Text>
          </View>
          
          <View style={styles.goalInfo}>
            <View style={styles.avatarContainer}>
              <AvatarRenderer 
                type={avatar.type} 
                vitality={avatar.vitality} 
                size={40} 
                animated 
              />
            </View>
            <View style={styles.goalDetails}>
              <Text style={styles.goalTitle}>
                {(currentGoal as any).avatar?.name || 'Your Companion'}
              </Text>
              <Text style={styles.goalSubtitle}>
                Helping with {currentGoal.title}
              </Text>
              <Text style={styles.vitalityText}>{avatar.vitality}% vitality</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageContainer, 
                message.isUser ? styles.userMessageContainer : styles.goalMessageContainer
              ]}
            >
              <View style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.goalBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.goalMessageText
                ]}>
                  {message.content}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.goalMessageContainer}>
              <View style={[styles.messageBubble, styles.goalBubble]}>
                <Animated.View style={[styles.typingDots, { opacity: typingAnimation }]}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </Animated.View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Section - Quick Prompts + Input */}
        <View style={styles.bottomSection}>
          {/* Quick Prompts */}
          <ScrollView 
            horizontal 
            style={styles.quickPromptsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {QUICK_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPrompt}
                onPress={() => handleQuickPrompt(prompt)}
              >
                <Text style={styles.quickPromptText}>{prompt.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.text.muted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!inputText.trim() || isTyping) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    backgroundColor: theme.colors.background.secondary,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  goalDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
    lineHeight: 20,
  },
  goalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    lineHeight: 16,
  },
  vitalityText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    lineHeight: 14,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 0,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  goalMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
  },
  goalBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.line,
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
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 6,
    paddingBottom: 6,
    alignItems: 'flex-end',
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
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.text.muted,
    opacity: 0.5,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
});