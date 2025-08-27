import { AIConfig } from './chat';

// AI Configuration
// Backend-first architecture - API keys stored on server
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'backend',
  baseUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  
  // Alternative configurations for local development:
  // Direct OpenAI (not recommended for production):
  // provider: 'openai',
  // apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  // model: 'gpt-4o-mini',
  
  // Direct Anthropic (not recommended for production):
  // provider: 'anthropic',
  // apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  // model: 'claude-3-haiku-20240307',
  
  // Local LLM (Ollama):
  // provider: 'local',
  // baseUrl: 'http://localhost:11434',
  // model: 'llama2',
};

// Initialize AI service with default config
export function getAIConfig(): AIConfig {
  // In the future, this could read from user preferences or app settings
  return DEFAULT_AI_CONFIG;
}