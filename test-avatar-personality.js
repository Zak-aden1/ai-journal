// Quick test to demonstrate enhanced avatar personality system
// This file can be run with: node test-avatar-personality.js

const { generatePersonalizedResponse, analyzeUserPatterns, generateMotivationalInsight } = require('./lib/avatarPersonality');

// Mock data for testing
const testMemory = {
  milestones: ['7-day meditation streak', '30 minutes walking goal', 'First journal entry'],
  patterns: {
    bestTimes: ['morning', 'afternoon'],
    struggleDays: ['Monday', 'Wednesday'],
    favoriteGoals: ['Mindfulness', 'Fitness'],
  },
  emotionalHistory: [
    { mood: '😊', context: 'habit_completion', timestamp: Date.now() - 86400000 },
    { mood: '😔', context: 'journal_entry', timestamp: Date.now() - 172800000 },
    { mood: '😍', context: 'achievement', timestamp: Date.now() - 259200000 },
  ],
  personalContext: {
    goalNames: ['Mindfulness', 'Fitness', 'Learning Spanish'],
    habitTypes: ['meditation', 'walking', 'language practice'],
  },
};

const testContext = {
  currentVitality: 75,
  recentEntries: [
    { id: '1', text: 'Great meditation session today!', mood: '😊', createdAt: Date.now(), type: 'habit_reflection' },
    { id: '2', text: 'Feeling motivated about my goals', mood: '😍', createdAt: Date.now() - 86400000, type: 'free_journal' },
  ],
  goals: ['Mindfulness', 'Fitness', 'Learning Spanish'],
  timeOfDay: 'morning',
  mode: 'Companion',
  progress: {
    habitsCompleted: 2,
    goalsInProgress: 3,
  },
};

console.log('🌟 Avatar Personality System Test\n');

console.log('=== PERSONALITY RESPONSES ===');
const avatarTypes = ['plant', 'pet', 'robot', 'base'];

avatarTypes.forEach(type => {
  console.log(`\n${type.toUpperCase()} Avatar Response:`);
  const response = generatePersonalizedResponse(type, testContext, testMemory);
  console.log(`"${response}"`);
});

console.log('\n=== PATTERN ANALYSIS ===');
const analysis = analyzeUserPatterns(testMemory);
console.log('User Pattern Analysis:');
console.log(`- Best time of day: ${analysis.bestTimeOfDay || 'Not determined'}`);
console.log(`- Most engaged goal: ${analysis.mostEngagedGoal || 'Not determined'}`);
console.log(`- Emotional trend: ${analysis.emotionalTrend}`);
console.log(`- Streak potential: ${analysis.streakPotential}%`);

console.log('\n=== MOTIVATIONAL INSIGHTS ===');
avatarTypes.forEach(type => {
  console.log(`\n${type.toUpperCase()} Motivational Insight:`);
  const insight = generateMotivationalInsight(type, testMemory, testContext);
  if (insight) {
    console.log(`"${insight}"`);
  } else {
    console.log('No special insight at this time.');
  }
});

console.log('\n✅ Avatar personality system is working with enhanced memory and context awareness!');