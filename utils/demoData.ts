export const getDummyPrimaryGoal = () => ({
  id: 'demo-fitness',
  title: 'Run a 5K Marathon'
});

export const getDummyHabits = () => [
  {
    id: 'habit-1',
    name: 'Morning Run',
    description: '30 minutes of outdoor running',
    time: '07:00',
    completed: false,
    streak: 12,
    difficulty: 'hard' as const,
    emoji: '🏃‍♀️',
  },
  {
    id: 'habit-2', 
    name: 'Stretching',
    description: '10 minutes of post-workout stretching',
    time: '19:00',
    completed: true,
    streak: 8,
    difficulty: 'easy' as const,
    emoji: '🧘‍♀️',
  },
  {
    id: 'habit-3',
    name: 'Hydration Check',
    description: 'Drink 2 liters of water throughout the day',
    time: '12:00',
    completed: false,
    streak: 5,
    difficulty: 'medium' as const,
    emoji: '💧',
  }
];

export const getDummySecondaryGoals = () => [
  {
    id: 'demo-mindfulness',
    title: 'Daily Mindfulness',
    habitCount: 2,
    completedToday: 1,
  },
  {
    id: 'demo-learning',
    title: 'Learn Spanish',
    habitCount: 3,
    completedToday: 0,
  },
  {
    id: 'demo-creativity',
    title: 'Creative Writing',
    habitCount: 1,
    completedToday: 1,
  }
];