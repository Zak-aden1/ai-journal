import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { upsertGoal, upsertHabit, insertEntry, listGoals, listHabitsByGoal, listEntries, saveGoalMeta, getGoalMeta, initializeDatabase, listHabitsWithIdsByGoal, listStandaloneHabits, listAllHabitsWithGoals, updateHabitGoalAssignment, deleteGoal as dbDeleteGoal, deleteHabit as dbDeleteHabit, markHabitComplete, unmarkHabitComplete, isHabitCompletedOnDate, calculateHabitStreak } from '@/lib/db';
import { nextActionFrom } from '@/services/ai/suggestions';
import { AvatarType, AvatarMemory } from '@/components/avatars/types';
import { generatePersonalizedResponse, updateAvatarMemory, getAvatarPersonality, smartMemoryUpdate, generateMotivationalInsight, analyzeUserPatterns } from '@/lib/avatarPersonality';

export type Mode = 'Companion' | 'Coach';
export type Mood = '😊' | '😐' | '😔' | '😤' | '😍';
export type ThemeMode = 'light' | 'dark';

export type EntryType = 'habit_reflection' | 'free_journal';
export type Entry = { 
  id: string; 
  text: string; 
  mood?: Mood; 
  createdAt: number; 
  type: EntryType;
  voiceRecordingUri?: string;
  habitId?: string; // For habit reflections
};
export type Suggestion = { action: string; goal: string; reason: string };
export type HabitWithId = { id: string; title: string; goalId?: string | null };
export type HabitStreak = { current: number; longest: number };

export type ConversationMessage = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
  goalId: string;
  emotion?: 'supportive' | 'celebratory' | 'motivational' | 'wise';
  vitalityImpact?: number;
};

type Privacy = { localOnly: boolean; voice: boolean };

type GoalMeta = {
  why_text?: string;
  why_audio_uri?: string;
  obstacles?: string[];
};

type AppState = {
  // state
  isHydrated: boolean;
  mode: Mode;
  themeMode: ThemeMode;
  privacy: Privacy;
  goals: string[]; // Kept for backward compatibility
  goalsWithIds: Array<{ id: string; title: string }>; // Goals with IDs for UI
  habits: Record<string, string[]>; // goalTitle -> habits
  habitsWithIds: Record<string, HabitWithId[]>; // goalId -> habits with IDs
  standaloneHabits: HabitWithId[]; // habits not tied to any goal
  entries: Entry[];
  nextAction: Suggestion | null;
  primaryGoalId: string | null;
  goalMeta: Record<string, GoalMeta>; // goalId -> meta
  conversations: Record<string, ConversationMessage[]>; // goalId -> messages
  
  // Avatar system
  avatar: {
    type: AvatarType;
    name: string;
    vitality: number;
    memory: AvatarMemory;
  }

  // actions
  hydrate: () => Promise<void>;
  setMode: (mode: Mode) => void;
  setThemeMode: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  togglePrivacy: (key: keyof Privacy) => void;
  addGoal: (title: string) => Promise<string>;
  deleteGoal: (goalId: string) => Promise<void>;
  addHabit: (goalId: string | null, habit: string) => Promise<string>;
  addStandaloneHabit: (habit: string) => Promise<string>;
  updateHabitGoalAssignment: (habitId: string, goalId: string | null) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  submitEntry: (text: string, mood?: Mood, habitId?: string) => Promise<void>;
  submitJournalEntry: (text: string, mood?: Mood, voiceRecordingUri?: string) => Promise<void>;
  setNextAction: (s: Suggestion | null) => void;
  saveWhy: (goalId: string, data: GoalMeta) => Promise<void>;
  toggleHabitCompletion: (habitId: string, date?: Date) => Promise<void>;
  getHabitStreak: (habitId: string) => Promise<HabitStreak>;
  refreshHabitsForGoal: (goalId: string) => Promise<void>;
  refreshStandaloneHabits: () => Promise<void>;
  
  // Avatar actions
  initializeAvatar: (type: AvatarType, name: string) => void;
  updateAvatarVitality: (vitality: number) => void;
  getAvatarResponse: (context?: 'achievement' | 'encouragement' | 'general') => string;
  getMotivationalInsight: () => string | null;
  updateAvatarMemoryWithEntry: (entry: Entry) => void;
  updateAvatarMemoryWithMilestone: (milestone: string) => void;
  updateAvatarMemoryWithActivity: (activityType: 'habit_completion' | 'goal_interaction' | 'journal_entry' | 'achievement', goalName?: string, habitType?: string) => void;
  getAvatarPatternAnalysis: () => ReturnType<typeof analyzeUserPatterns>;
  
  // Primary goal selection
  setPrimaryGoal: (goalId: string) => void;
  getPrimaryGoal: () => { id: string; title: string } | null;
  selectSmartPrimaryGoal: () => Promise<string | null>;
  getTodaysPendingHabits: (goalId: string) => Promise<number>;
  getMostRecentlyActiveGoal: () => Promise<string | null>;
  
  // Conversation actions
  getGoalConversation: (goalId: string) => ConversationMessage[];
  addConversationMessage: (message: ConversationMessage) => void;
  clearGoalConversation: (goalId: string) => void;
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    isHydrated: false,
    mode: 'Companion',
    themeMode: 'dark',
    privacy: { localOnly: true, voice: false },
    goals: [],
    goalsWithIds: [],
    habits: {},
    habitsWithIds: {},
    standaloneHabits: [],
    entries: [],
    nextAction: null,
    primaryGoalId: null,
    goalMeta: {},
    conversations: {},
    avatar: {
      type: 'plant',
      name: 'Sage',
      vitality: 50,
      memory: {
        milestones: [],
        patterns: {
          bestTimes: [],
          struggleDays: [],
          favoriteGoals: [],
        },
        emotionalHistory: [],
        personalContext: {
          goalNames: [],
          habitTypes: [],
        },
      },
    },

    hydrate: async () => {
      try {
        console.log('[hydrate] Starting database initialization...');
        await initializeDatabase();
        console.log('[hydrate] Database initialized successfully');

        console.log('[hydrate] Loading goals...');
        const goals = await listGoals();
        console.log(`[hydrate] Loaded ${goals.length} goals`);

        console.log('[hydrate] Loading entries...');
        const entries = await listEntries();
        console.log(`[hydrate] Loaded ${entries.length} entries`);

        const habitsByTitle: Record<string, string[]> = {};
        const habitsWithIds: Record<string, HabitWithId[]> = {};
        
        console.log('[hydrate] Loading habits for each goal...');
        for (const g of goals) {
          try {
            habitsByTitle[g.title] = await listHabitsByGoal(g.id);
            habitsWithIds[g.id] = await listHabitsWithIdsByGoal(g.id);
            console.log(`[hydrate] Loaded habits for goal: ${g.title}`);
          } catch (error) {
            console.warn(`[hydrate] Failed to load habits for goal ${g.title}:`, error);
            habitsByTitle[g.title] = [];
            habitsWithIds[g.id] = [];
          }
        }
        
        console.log('[hydrate] Loading standalone habits...');
        const standaloneHabits = await listStandaloneHabits();
        console.log(`[hydrate] Loaded ${standaloneHabits.length} standalone habits`);
        
        const primaryGoalId = goals[0]?.id ?? null;
        const goalMeta: Record<string, GoalMeta> = {};
        
        console.log('[hydrate] Loading goal metadata...');
        for (const g of goals) {
          try {
            goalMeta[g.id] = await getGoalMeta(g.id);
          } catch (error) {
            console.warn(`[hydrate] Failed to load metadata for goal ${g.title}:`, error);
            goalMeta[g.id] = {};
          }
        }

        console.log('[hydrate] Setting state with loaded data...');
        set((state) => {
          state.goals = goals.map((g) => g.title);
          state.goalsWithIds = goals.map((g) => ({ id: g.id, title: g.title }));
          state.habits = habitsByTitle;
          state.habitsWithIds = habitsWithIds;
          state.standaloneHabits = standaloneHabits;
          state.entries = entries;
          state.primaryGoalId = primaryGoalId;
          state.goalMeta = goalMeta;
        });
        console.log('[hydrate] Hydration completed successfully');
      } catch (e) {
        console.error('[hydrate] Critical error during hydration:', e);
        // Still set basic empty state to prevent crashes
        set((state) => {
          state.goals = [];
          state.goalsWithIds = [];
          state.habits = {};
          state.habitsWithIds = {};
          state.standaloneHabits = [];
          state.entries = [];
          state.primaryGoalId = null;
          state.goalMeta = {};
        });
      } finally {
        set((s) => void (s.isHydrated = true));
        console.log('[hydrate] Hydration process finished');
      }
    },

    setMode: (mode) => set((s) => void (s.mode = mode)),

    setThemeMode: (theme) => set((s) => void (s.themeMode = theme)),

    toggleTheme: () => set((s) => {
      s.themeMode = s.themeMode === 'dark' ? 'light' : 'dark';
    }),

    togglePrivacy: (key) =>
      set((s) => {
        s.privacy[key] = !s.privacy[key];
      }),

    addGoal: async (title) => {
      const { primaryGoalId } = get();
      const goalId = await upsertGoal(title);
      set((s) => {
        if (!s.goals.includes(title)) s.goals.push(title);
        if (!primaryGoalId) s.primaryGoalId = goalId;
        
        // Track goal interaction in avatar memory
        const hour = new Date().getHours();
        const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 
          hour < 12 ? 'morning' : 
          hour < 17 ? 'afternoon' : 
          hour < 21 ? 'evening' : 'night';

        s.avatar.memory = smartMemoryUpdate(s.avatar.memory, {
          activityType: 'goal_interaction',
          timeOfDay,
          goalName: title,
          vitality: s.avatar.vitality,
        });
      });
      return goalId;
    },

    addHabit: async (goalId, habit) => {
      const habitId = await upsertHabit(goalId, habit);
      
      if (goalId) {
        // Refresh habits for this goal to get the new habit with ID
        await get().refreshHabitsForGoal(goalId);
        
        // Update habits by title for backward compatibility
        const allGoals = await listGoals();
        const goal = allGoals.find((g) => g.id === goalId);
        if (goal) {
          set((s) => {
            if (!s.habits[goal.title]) s.habits[goal.title] = [];
            if (!s.habits[goal.title].includes(habit)) s.habits[goal.title].push(habit);
          });
        }
      } else {
        // Refresh standalone habits
        await get().refreshStandaloneHabits();
      }
      
      return habitId;
    },

    addStandaloneHabit: async (habit) => {
      const habitId = await upsertHabit(null, habit);
      await get().refreshStandaloneHabits();
      return habitId;
    },

    updateHabitGoalAssignment: async (habitId, goalId) => {
      await updateHabitGoalAssignment(habitId, goalId);
      
      // Refresh both goal habits and standalone habits
      if (goalId) {
        await get().refreshHabitsForGoal(goalId);
      }
      await get().refreshStandaloneHabits();
      
      // TODO: Also refresh the old goal if habit was moved from another goal
    },

    deleteGoal: async (goalId) => {
      await dbDeleteGoal(goalId);
      
      // Refresh goals and all related state
      const goals = await listGoals();
      const habitsByTitle: Record<string, string[]> = {};
      const habitsWithIds: Record<string, HabitWithId[]> = {};
      
      for (const g of goals) {
        habitsByTitle[g.title] = await listHabitsByGoal(g.id);
        habitsWithIds[g.id] = await listHabitsWithIdsByGoal(g.id);
      }
      
      set((s) => {
        s.goals = goals.map((g) => g.title);
        s.goalsWithIds = goals.map((g) => ({ id: g.id, title: g.title }));
        s.habits = habitsByTitle;
        s.habitsWithIds = habitsWithIds;
        
        // Clear goal metadata
        delete s.goalMeta[goalId];
        
        // Clear conversations for this goal
        delete s.conversations[goalId];
        
        // Reset primary goal if it was deleted
        if (s.primaryGoalId === goalId) {
          s.primaryGoalId = goals[0]?.id ?? null;
        }
      });
    },

    deleteHabit: async (habitId) => {
      await dbDeleteHabit(habitId);
      
      // Refresh all habit lists
      await get().refreshStandaloneHabits();
      const allGoals = await listGoals();
      for (const goal of allGoals) {
        await get().refreshHabitsForGoal(goal.id);
      }
    },

    submitEntry: async (text, mood, habitId) => {
      const id = generateId();
      const createdAt = Date.now();
      const entry: Entry = { 
        id, 
        text, 
        mood, 
        createdAt, 
        type: 'habit_reflection',
        habitId 
      };
      await insertEntry(entry);

      // Update state and memory
      set((s) => {
        s.entries.unshift(entry);
        
        // Enhanced memory tracking
        const hour = new Date().getHours();
        const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 
          hour < 12 ? 'morning' : 
          hour < 17 ? 'afternoon' : 
          hour < 21 ? 'evening' : 'night';

        s.avatar.memory = smartMemoryUpdate(s.avatar.memory, {
          activityType: 'habit_completion',
          timeOfDay,
          mood,
          vitality: s.avatar.vitality,
        });
      });

      const goals = get().goals;
      const suggestion = nextActionFrom(text, goals);
      set((s) => void (s.nextAction = suggestion));
    },

    submitJournalEntry: async (text, mood, voiceRecordingUri) => {
      const id = generateId();
      const createdAt = Date.now();
      const entry: Entry = { 
        id, 
        text, 
        mood, 
        createdAt, 
        type: 'free_journal',
        voiceRecordingUri 
      };
      await insertEntry(entry);

      // Update state and memory
      set((s) => {
        s.entries.unshift(entry);
        
        // Enhanced memory tracking for journal entries
        const hour = new Date().getHours();
        const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 
          hour < 12 ? 'morning' : 
          hour < 17 ? 'afternoon' : 
          hour < 21 ? 'evening' : 'night';

        s.avatar.memory = smartMemoryUpdate(s.avatar.memory, {
          activityType: 'journal_entry',
          timeOfDay,
          mood,
          vitality: s.avatar.vitality,
        });
      });
    },

    setNextAction: (sugg) => set((s) => void (s.nextAction = sugg)),

    saveWhy: async (goalId, data) => {
      await saveGoalMeta(goalId, data);
      set((s) => {
        s.goalMeta[goalId] = { ...(s.goalMeta[goalId] ?? {}), ...data };
      });
    },

    toggleHabitCompletion: async (habitId, date = new Date()) => {
      const isCompleted = await isHabitCompletedOnDate(habitId, date);
      
      if (isCompleted) {
        await unmarkHabitComplete(habitId, date);
      } else {
        await markHabitComplete(habitId, date);
      }
    },

    getHabitStreak: async (habitId) => {
      return await calculateHabitStreak(habitId);
    },

    refreshHabitsForGoal: async (goalId) => {
      const habitsWithIds = await listHabitsWithIdsByGoal(goalId);
      set((s) => {
        s.habitsWithIds[goalId] = habitsWithIds;
      });
    },

    refreshStandaloneHabits: async () => {
      const standaloneHabits = await listStandaloneHabits();
      set((s) => {
        s.standaloneHabits = standaloneHabits;
      });
    },

    // Avatar actions
    initializeAvatar: (type, name) => set((s) => {
      s.avatar.type = type;
      s.avatar.name = name;
    }),

    updateAvatarVitality: (vitality) => set((s) => {
      s.avatar.vitality = vitality;
    }),

    getAvatarResponse: (context = 'general') => {
      const state = get();
      const hour = new Date().getHours();
      const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 
        hour < 12 ? 'morning' : 
        hour < 17 ? 'afternoon' : 
        hour < 21 ? 'evening' : 'night';
      
      const responseContext = {
        currentVitality: state.avatar.vitality,
        recentEntries: state.entries.slice(0, 5),
        goals: state.goals,
        timeOfDay,
        mode: state.mode,
        progress: {
          habitsCompleted: state.entries.filter(e => 
            e.type === 'habit_reflection' && 
            new Date(e.createdAt).toDateString() === new Date().toDateString()
          ).length,
          goalsInProgress: state.goals.length,
        },
      };

      return generatePersonalizedResponse(
        state.avatar.type,
        responseContext,
        state.avatar.memory
      );
    },

    updateAvatarMemoryWithEntry: (entry) => set((s) => {
      const emotionUpdate = entry.mood ? {
        mood: entry.mood,
        context: entry.type === 'habit_reflection' ? 'habit_completion' : 'journal_entry'
      } : undefined;

      s.avatar.memory = updateAvatarMemory(s.avatar.memory, {
        emotion: emotionUpdate,
      });
    }),

    updateAvatarMemoryWithMilestone: (milestone) => set((s) => {
      s.avatar.memory = updateAvatarMemory(s.avatar.memory, {
        milestone,
      });
    }),

    getMotivationalInsight: () => {
      const state = get();
      const hour = new Date().getHours();
      const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 
        hour < 12 ? 'morning' : 
        hour < 17 ? 'afternoon' : 
        hour < 21 ? 'evening' : 'night';
      
      const responseContext = {
        currentVitality: state.avatar.vitality,
        recentEntries: state.entries.slice(0, 5),
        goals: state.goals,
        timeOfDay,
        mode: state.mode,
        progress: {
          habitsCompleted: state.entries.filter(e => 
            e.type === 'habit_reflection' && 
            new Date(e.createdAt).toDateString() === new Date().toDateString()
          ).length,
          goalsInProgress: state.goals.length,
        },
      };

      return generateMotivationalInsight(
        state.avatar.type,
        state.avatar.memory,
        responseContext
      );
    },

    updateAvatarMemoryWithActivity: (activityType, goalName, habitType) => set((s) => {
      const hour = new Date().getHours();
      const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 
        hour < 12 ? 'morning' : 
        hour < 17 ? 'afternoon' : 
        hour < 21 ? 'evening' : 'night';

      s.avatar.memory = smartMemoryUpdate(s.avatar.memory, {
        activityType,
        timeOfDay,
        goalName,
        habitType,
        vitality: s.avatar.vitality,
      });
    }),

    getAvatarPatternAnalysis: () => {
      const state = get();
      return analyzeUserPatterns(state.avatar.memory);
    },

    // Primary goal selection actions
    setPrimaryGoal: (goalId) => set((s) => {
      s.primaryGoalId = goalId;
    }),

    getPrimaryGoal: () => {
      const { primaryGoalId, goalsWithIds } = get();
      if (!primaryGoalId) return null;
      return goalsWithIds.find(g => g.id === primaryGoalId) || null;
    },

    selectSmartPrimaryGoal: async () => {
      const { goalsWithIds, primaryGoalId } = get();
      
      if (goalsWithIds.length === 0) return null;
      
      // 1. If user has explicitly set a primary goal, use it
      if (primaryGoalId && goalsWithIds.find(g => g.id === primaryGoalId)) {
        return primaryGoalId;
      }
      
      // 2. Goal with most pending habits today
      let bestGoalId = null;
      let maxPendingHabits = 0;
      
      for (const goal of goalsWithIds) {
        const pendingCount = await get().getTodaysPendingHabits(goal.id);
        if (pendingCount > maxPendingHabits) {
          maxPendingHabits = pendingCount;
          bestGoalId = goal.id;
        }
      }
      
      if (bestGoalId && maxPendingHabits > 0) {
        set((s) => { s.primaryGoalId = bestGoalId; });
        return bestGoalId;
      }
      
      // 3. Most recently active goal (based on habit completions)
      const recentGoalId = await get().getMostRecentlyActiveGoal();
      if (recentGoalId) {
        set((s) => { s.primaryGoalId = recentGoalId; });
        return recentGoalId;
      }
      
      // 4. First goal (fallback)
      const firstGoalId = goalsWithIds[0].id;
      set((s) => { s.primaryGoalId = firstGoalId; });
      return firstGoalId;
    },

    getTodaysPendingHabits: async (goalId) => {
      const habits = await listHabitsWithIdsByGoal(goalId);
      const today = new Date();
      let pendingCount = 0;
      
      for (const habit of habits) {
        const isCompleted = await isHabitCompletedOnDate(habit.id, today);
        if (!isCompleted) {
          pendingCount++;
        }
      }
      
      return pendingCount;
    },

    getMostRecentlyActiveGoal: async () => {
      const { goalsWithIds, habitsWithIds } = get();
      const today = new Date();
      let mostRecentGoalId = null;
      let mostRecentTime = 0;
      
      // Look for the most recently completed habit across all goals
      for (const goal of goalsWithIds) {
        const habits = habitsWithIds[goal.id] || [];
        
        for (const habit of habits) {
          // This is a simplified check - in a real implementation, 
          // we'd track completion timestamps in the database
          const isCompleted = await isHabitCompletedOnDate(habit.id, today);
          if (isCompleted) {
            // For now, just return the first completed habit's goal
            // In real implementation, we'd check actual completion timestamps
            return goal.id;
          }
        }
      }
      
      return mostRecentGoalId;
    },

    // Conversation actions
    getGoalConversation: (goalId) => {
      const state = get();
      return state.conversations[goalId] || [];
    },

    addConversationMessage: (message) => set((s) => {
      if (!s.conversations[message.goalId]) {
        s.conversations[message.goalId] = [];
      }
      s.conversations[message.goalId].push(message);
      
      // Limit conversation history to last 50 messages per goal
      if (s.conversations[message.goalId].length > 50) {
        s.conversations[message.goalId] = s.conversations[message.goalId].slice(-50);
      }
    }),

    clearGoalConversation: (goalId) => set((s) => {
      delete s.conversations[goalId];
    }),
  }))
);

export function isOnboardedSelector(state: AppState): boolean {
  return Boolean(state.primaryGoalId);
}


