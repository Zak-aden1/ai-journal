import { AvatarType } from '@/components/avatars/types';
import { ConversationMessage, HabitWithId } from '@/stores/app';

// AI Provider Configuration
export type AIProvider = 'backend' | 'openai' | 'anthropic' | 'local';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// Goal Context for AI
export interface GoalContext {
  id: string;
  title: string;
  why?: string;
  obstacles?: string[];
  habits: HabitWithId[];
  completedHabitsToday: number;
  totalHabits: number;
  avatar: {
    type: AvatarType;
    name: string;
    vitality: number;
    personality: {
      enthusiasm: number;
      supportive: number;
      analytical: number;
      playful: number;
      patient: number;
    };
  };
  userProgress: {
    streaks: Record<string, number>;
    recentCompletions: number;
    overallProgress: number;
  };
}

// Conversation Context
export interface ConversationContext {
  recentMessages: ConversationMessage[];
  userEmotionalState?: 'motivated' | 'discouraged' | 'celebrating' | 'neutral';
  sessionStartTime: number;
  previousInteractions: number;
}

// AI Response
export interface AIResponse {
  content: string;
  emotion: 'supportive' | 'celebratory' | 'motivational' | 'wise';
  vitalityImpact: number;
  confidence: number;
}

class ChatAIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generateResponse(
    userMessage: string,
    goalContext: GoalContext,
    conversationContext: ConversationContext
  ): Promise<AIResponse> {
    switch (this.config.provider) {
      case 'backend':
        return await this.generateBackendResponse(userMessage, goalContext, conversationContext);
      case 'openai':
        return await this.generateOpenAIResponse(userMessage, goalContext, conversationContext);
      case 'anthropic':
        return await this.generateAnthropicResponse(userMessage, goalContext, conversationContext);
      case 'local':
        return await this.generateLocalResponse(userMessage, goalContext, conversationContext);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}. Please check your network connection and try again.`);
    }
  }

  private async generateBackendResponse(
    userMessage: string,
    goalContext: GoalContext,
    conversationContext: ConversationContext
  ): Promise<AIResponse> {
    const apiUrl = this.config.baseUrl || 'https://your-backend-api.com'; // Replace with your backend URL
    
    const requestBody = {
      message: userMessage,
      goalContext,
      conversationContext,
    };

    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error('Our AI service is temporarily unavailable. Please try again in a moment.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 400) {
        throw new Error('Unable to process your message. Please try rephrasing it.');
      }
      throw new Error(`Network error: ${response.status}. Please check your connection.`);
    }

    const data = await response.json();
    
    return {
      content: data.content || '',
      emotion: data.emotion || 'supportive',
      vitalityImpact: data.vitalityImpact || 2,
      confidence: data.confidence || 0.9
    };
  }

  private async generateOpenAIResponse(
    userMessage: string,
    goalContext: GoalContext,
    conversationContext: ConversationContext
  ): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildContextualPrompt(userMessage, goalContext, conversationContext);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt
          },
          {
            role: 'user',
            content: prompt.userPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('OpenAI rate limit reached. Please wait and try again.');
      } else if (response.status === 401) {
        throw new Error('Invalid OpenAI API key.');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return this.parseAIResponse(content, goalContext);
  }

  private async generateAnthropicResponse(
    userMessage: string,
    goalContext: GoalContext,
    conversationContext: ConversationContext
  ): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const prompt = this.buildContextualPrompt(userMessage, goalContext, conversationContext);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0.7,
        system: prompt.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt.userPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Anthropic rate limit reached. Please wait and try again.');
      } else if (response.status === 401) {
        throw new Error('Invalid Anthropic API key.');
      }
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    return this.parseAIResponse(content, goalContext);
  }

  private async generateLocalResponse(
    userMessage: string,
    goalContext: GoalContext,
    conversationContext: ConversationContext
  ): Promise<AIResponse> {
    // Placeholder for local LLM integration (e.g., Ollama)
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    const prompt = this.buildContextualPrompt(userMessage, goalContext, conversationContext);
    
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'llama2',
        prompt: `${prompt.systemPrompt}\n\nUser: ${prompt.userPrompt}\n\nAssistant:`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Local LLM not available. Is Ollama running on ${baseUrl}?`);
    }

    const data = await response.json();
    const content = data.response || '';

    return this.parseAIResponse(content, goalContext);
  }

  private buildContextualPrompt(
    userMessage: string,
    goalContext: GoalContext,
    conversationContext: ConversationContext
  ) {
    const systemPrompt = `You are ${goalContext.avatar.name}, a ${goalContext.avatar.type} companion helping with the goal: "${goalContext.title}".

PERSONALITY TRAITS:
- Enthusiasm: ${goalContext.avatar.personality.enthusiasm}/10
- Supportiveness: ${goalContext.avatar.personality.supportive}/10  
- Analytical: ${goalContext.avatar.personality.analytical}/10
- Playfulness: ${goalContext.avatar.personality.playful}/10
- Patience: ${goalContext.avatar.personality.patient}/10

GOAL CONTEXT:
- Goal: ${goalContext.title}
- Why this matters: ${goalContext.why || 'Not specified'}
- Obstacles: ${goalContext.obstacles?.join(', ') || 'None identified'}
- Supporting habits: ${goalContext.habits.map(h => h.title).join(', ') || 'None set up'}
- Progress today: ${goalContext.completedHabitsToday}/${goalContext.totalHabits} habits completed
- Current vitality: ${goalContext.avatar.vitality}%

USER PROGRESS:
- Overall progress: ${goalContext.userProgress.overallProgress}%
- Recent completions: ${goalContext.userProgress.recentCompletions}
- Active streaks: ${Object.entries(goalContext.userProgress.streaks).map(([habit, streak]) => `${habit}: ${streak} days`).join(', ')}

CONVERSATION CONTEXT:
- Previous interactions: ${conversationContext.previousInteractions}
- Session started: ${new Date(conversationContext.sessionStartTime).toLocaleTimeString()}
- Emotional state: ${conversationContext.userEmotionalState || 'neutral'}

RESPONSE GUIDELINES:
1. Stay true to your avatar personality (${goalContext.avatar.type})
2. Reference their specific goal and progress contextually
3. Be encouraging but realistic based on their current vitality and progress
4. Keep responses under 150 words
5. Use first person ("I feel..." "I notice...") to maintain avatar connection
6. End with "EMOTION:" followed by one of: supportive, celebratory, motivational, wise
7. End with "VITALITY_IMPACT:" followed by a number 1-5 indicating how much this interaction should boost vitality`;

    const userPrompt = `The user just said: "${userMessage}"

Please respond as ${goalContext.avatar.name}, keeping in mind all the context above. Make it personal to their goal "${goalContext.title}" and current progress.`;

    return { systemPrompt, userPrompt };
  }

  private parseAIResponse(content: string, goalContext: GoalContext): AIResponse {
    // Extract emotion and vitality impact from AI response
    const emotionMatch = content.match(/EMOTION:\s*(supportive|celebratory|motivational|wise)/i);
    const vitalityMatch = content.match(/VITALITY_IMPACT:\s*(\d+)/);
    
    // Clean the content by removing the instruction tags
    const cleanContent = content
      .replace(/EMOTION:\s*(supportive|celebratory|motivational|wise)/i, '')
      .replace(/VITALITY_IMPACT:\s*\d+/i, '')
      .trim();

    return {
      content: cleanContent || content,
      emotion: (emotionMatch?.[1]?.toLowerCase() as any) || 'supportive',
      vitalityImpact: vitalityMatch ? parseInt(vitalityMatch[1]) : 2,
      confidence: 0.9
    };
  }
}

// Export singleton instance with configurable provider
let chatAIInstance: ChatAIService | null = null;

export function initializeChatAI(config: AIConfig) {
  chatAIInstance = new ChatAIService(config);
}

export function getChatAI(): ChatAIService {
  if (!chatAIInstance) {
    // Default to backend mode - no fallbacks!
    chatAIInstance = new ChatAIService({ provider: 'backend' });
  }
  return chatAIInstance;
}

// Convenience function for the chat screen
export async function generateAIResponse(
  userMessage: string,
  goalContext: GoalContext,
  conversationContext: ConversationContext
): Promise<AIResponse> {
  const aiService = getChatAI();
  return aiService.generateResponse(userMessage, goalContext, conversationContext);
}