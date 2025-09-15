type Mood = '😊' | '😐' | '😔' | '😤' | '😍';

/**
 * Generates a concise, contextual title for journal entries
 * Combines mood and text analysis for meaningful summaries
 */
export function generateSummaryTitle(text: string, mood?: Mood): string {
  // Handle empty or voice-only entries
  if (!text || text.trim() === '' || text === 'Voice note recorded') {
    return generateMoodOnlyTitle(mood);
  }

  const cleanText = text.toLowerCase().trim();
  
  // Try to extract an engaging first sentence or key phrase
  const firstSentence = extractFirstMeaningfulSentence(text);
  if (firstSentence) {
    return firstSentence;
  }
  
  // Fallback to theme-based title
  const themeKeywords = {
    work: ['work', 'job', 'meeting', 'deadline', 'boss', 'colleague', 'office'],
    relationships: ['friend', 'family', 'partner', 'relationship', 'love', 'date'],
    health: ['tired', 'energy', 'sleep', 'exercise', 'workout', 'sick'],
    stress: ['stress', 'anxious', 'overwhelmed', 'worry', 'pressure'],
    gratitude: ['grateful', 'thankful', 'blessed', 'appreciate', 'lucky'],
    personal: ['think', 'feel', 'realize', 'understand', 'learn', 'grow']
  };

  const detectedTheme = Object.entries(themeKeywords).find(([_, keywords]) =>
    keywords.some(keyword => cleanText.includes(keyword))
  )?.[0];

  const moodPrefix = getMoodPrefix(mood);
  
  if (detectedTheme) {
    return `${moodPrefix}${getThemeDescription(detectedTheme, mood)}`;
  }
  
  // Final fallback
  return `${moodPrefix}personal thoughts and reflections`;
}

function generateMoodOnlyTitle(mood?: Mood): string {
  const moodTitles = {
    '😊': 'A moment of happiness and joy',
    '😐': 'Quiet reflection and neutral thoughts', 
    '😔': 'Processing sadness and difficult feelings',
    '😤': 'Working through frustration and challenges',
    '😍': 'Feeling grateful and appreciative'
  };
  
  return mood ? moodTitles[mood] : 'A personal moment captured';
}

function getMoodPrefix(mood?: Mood): string {
  const prefixes = {
    '😊': 'Feeling happy about ',
    '😐': 'Reflecting on ',
    '😔': 'Processing sadness around ',
    '😤': 'Feeling frustrated about ',
    '😍': 'Feeling grateful for '
  };
  
  return mood ? prefixes[mood] : 'Thinking about ';
}

function getThemeDescription(theme: string, mood?: Mood): string {
  const descriptions = {
    work: 'work and career challenges',
    relationships: 'connections and relationships', 
    health: 'health and wellness',
    stress: 'stress and life pressures',
    gratitude: 'things to be thankful for',
    personal: 'personal growth and insights'
  };
  
  return descriptions[theme as keyof typeof descriptions] || theme;
}

function extractFirstMeaningfulSentence(text: string): string | null {
  // Split by sentence endings but keep the structure
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    const cleaned = sentence.trim();
    
    // Skip very short phrases
    if (cleaned.length < 15) continue;
    
    // Skip sentences that are too long (would be truncated anyway)
    if (cleaned.length > 60) {
      // Try to find a good breaking point
      const words = cleaned.split(' ');
      if (words.length > 8) {
        const truncated = words.slice(0, 8).join(' ');
        return capitalizeFirst(truncated) + '...';
      }
    }
    
    // Perfect length sentence
    if (cleaned.length >= 15 && cleaned.length <= 60) {
      return capitalizeFirst(cleaned.replace(/[.!?]+$/, ''));
    }
  }
  
  // If no good sentence found, try to extract key phrases
  const keyPhrases = extractKeyPhrases(text);
  if (keyPhrases) {
    return keyPhrases;
  }
  
  return null;
}

function extractKeyPhrases(text: string): string | null {
  // Look for emotional expressions or key statements
  const emotionalPatterns = [
    /I feel (\w+)/i,
    /I'm (really|so|very) (\w+)/i,
    /Today (was|is) (\w+)/i,
    /I (love|hate|enjoy|struggle with) (.+?)(?:[.!?]|$)/i,
    /I (realized|learned|discovered) (.+?)(?:[.!?]|$)/i
  ];
  
  for (const pattern of emotionalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const phrase = match[0].trim();
      if (phrase.length <= 50) {
        return capitalizeFirst(phrase);
      }
    }
  }
  
  return null;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}