import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from './app';
import { HabitSchedule } from '@/lib/db';

type Mode = 'Companion' | 'Coach';
type Mood = '😊'|'😐'|'😔'|'😤'|'😍';

interface HabitTemplate {
  action: string;
  timing: string;
  goal: string;
}

// Secure storage adapter for onboarding persistence
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.warn('Failed to get onboarding data from secure storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn('Failed to save onboarding data to secure storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.warn('Failed to remove onboarding data from secure storage:', error);
    }
  },
};

interface OnboardingData {
  // Step 1
  mode: Mode | null;
  
  // Step 2 - Avatar Selection
  selectedAvatarType: 'plant' | 'pet' | 'robot' | 'base' | null;
  
  // Step 3 - Avatar Personalization
  avatarName: string;
  
  // Step 4 - Goal Category
  goalCategory: 'health' | 'learning' | 'career' | 'personal' | null;
  
  // Step 5 - Goal Details
  goalTitle: string;
  goalDetails: string;
  targetDate: string;
  
  // Step 6 - Deep Why
  deepWhy: string;
  whyVoicePath: string | null;
  
  // Step 7 - Habits (Legacy - kept for backward compatibility)
  selectedObstacles: string[];
  customObstacles: string[];
  selectedHabits: string[];
  customHabits: string[];
  habitSchedules: Record<string, HabitSchedule>;

  // New Habit Template (Step 4) - Legacy
  habitTemplate: HabitTemplate | null;
  habitFullText: string;

  // Simple Habit (Step 4) - New approach
  simpleHabit: string;
  
  // Step 8 - Tutorial Completion
  tutorialCompleted: boolean;
  firstHabitCompleted: boolean;
  
  // Step 9 - Privacy & First Entry
  privacy: {
    localOnly: boolean;
    voiceRecording: boolean;
  };
  firstMood: Mood | null;
  firstEntry: string;
}

interface OnboardingStore {
  // Intro flow
  introStep: number;
  introComplete: boolean;
  
  // Main onboarding
  currentStep: number;
  data: OnboardingData;
  isComplete: boolean;
  
  // Intro Actions
  nextIntroStep: () => void;
  completeIntroFlow: () => void;
  setIntroSelections: (avatar: 'plant' | 'pet' | 'robot' | 'base', mode: Mode, goalCategory: 'health' | 'learning' | 'career' | 'personal') => void;
  
  // Main Actions
  setStep: (step: number) => void;
  setMode: (mode: Mode) => void;
  setAvatarType: (type: 'plant' | 'pet' | 'robot' | 'base') => void;
  setAvatarName: (name: string) => void;
  setGoalCategory: (category: 'health' | 'learning' | 'career' | 'personal') => void;
  setGoalDetails: (title: string, details: string, targetDate: string) => void;
  setWhyVoiceNote: (path: string) => void;
  setDeepWhy: (why: string) => void;
  addObstacle: (obstacle: string) => void;
  removeObstacle: (obstacle: string) => void;
  addHabit: (habit: string) => void;
  removeHabit: (habit: string) => void;
  setHabitSchedule: (habit: string, schedule: HabitSchedule) => void;
  removeHabitSchedule: (habit: string) => void;
  setHabitTemplate: (template: HabitTemplate, fullText: string) => void;
  setSimpleHabit: (habit: string) => void;
  setTutorialCompleted: () => void;
  setFirstHabitCompleted: () => void;
  setPrivacy: (key: keyof OnboardingData['privacy'], value: boolean) => void;
  setFirstCheckIn: (mood: Mood, entry: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  forceResetOnboarding: () => Promise<void>;

  // Recovery
  hasRecoveryData: () => Promise<boolean>;
  clearRecoveryData: () => Promise<void>;
  getRecoveryProgress: () => { step: number; completedSteps: string[] };

  // Validation
  canProceedFromStep: (step: number) => boolean;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    immer((set, get) => ({
    // Intro flow
    introStep: 1,
    introComplete: false,
    
    // Main onboarding
    currentStep: 1,
    isComplete: false,
    data: {
      mode: null,
      selectedAvatarType: null,
      avatarName: '',
      goalCategory: null,
      goalTitle: '',
      goalDetails: '',
      targetDate: '',
      deepWhy: '',
      whyVoicePath: null,
      selectedObstacles: [],
      customObstacles: [],
      selectedHabits: [],
      customHabits: [],
      habitSchedules: {},
      habitTemplate: null,
      habitFullText: '',
      simpleHabit: '',
      tutorialCompleted: false,
      firstHabitCompleted: false,
      privacy: { localOnly: true, voiceRecording: false },
      firstMood: null,
      firstEntry: ''
    },
    
    // Intro Actions
    nextIntroStep: () => set((state) => {
      console.log('nextIntroStep called, current step:', state.introStep);
      if (state.introStep < 4) {
        state.introStep += 1;
        console.log('Updated intro step to:', state.introStep);
      }
    }),
    
    completeIntroFlow: () => set((state) => {
      state.introComplete = true;
    }),

    setIntroSelections: (avatar, mode, goalCategory) => set((state) => {
      state.data.selectedAvatarType = avatar;
      state.data.mode = mode;
      state.data.goalCategory = goalCategory;
      
      // Initialize avatar in app store when both type and name are set
      if (avatar) {
        // Set a default name based on avatar type
        const defaultNames = {
          plant: 'Sage',
          pet: 'Runner', 
          robot: 'Linguabot',
          base: 'Buddy'
        };
        state.data.avatarName = defaultNames[avatar];
        
        const { initializeAvatar } = useAppStore.getState();
        initializeAvatar(avatar, defaultNames[avatar]);
      }
    }),
    
    // Main Actions
    setStep: (step) => set((state) => { state.currentStep = step }),
    
    setMode: (mode) => set((state) => { state.data.mode = mode }),
    
    setAvatarType: (type) => set((state) => { state.data.selectedAvatarType = type }),
    
    setAvatarName: (name) => set((state) => { 
      state.data.avatarName = name;
      
      // Initialize avatar in app store when both type and name are set
      if (state.data.selectedAvatarType && name) {
        const { initializeAvatar } = useAppStore.getState();
        initializeAvatar(state.data.selectedAvatarType, name);
      }
    }),
    
    setGoalCategory: (category) => set((state) => { state.data.goalCategory = category }),
    
    setGoalDetails: (title, details, targetDate) => set((state) => {
      state.data.goalTitle = title;
      state.data.goalDetails = details;
      state.data.targetDate = targetDate;
    }),
    
    setWhyVoiceNote: (path) => set((state) => {
      state.data.whyVoicePath = path;
    }),
    
    setDeepWhy: (why) => set((state) => { state.data.deepWhy = why }),
    
    addObstacle: (obstacle) => set((state) => {
      if (!state.data.selectedObstacles.includes(obstacle)) {
        state.data.selectedObstacles.push(obstacle);
      }
    }),
    
    removeObstacle: (obstacle) => set((state) => {
      state.data.selectedObstacles = state.data.selectedObstacles.filter(o => o !== obstacle);
    }),
    
    addHabit: (habit) => set((state) => {
      if (!state.data.selectedHabits.includes(habit)) {
        state.data.selectedHabits.push(habit);
      }
    }),
    
    removeHabit: (habit) => set((state) => {
      state.data.selectedHabits = state.data.selectedHabits.filter(h => h !== habit);
      // Also remove the schedule for this habit
      delete state.data.habitSchedules[habit];
    }),
    
    setHabitSchedule: (habit, schedule) => set((state) => {
      state.data.habitSchedules[habit] = schedule;
    }),
    
    removeHabitSchedule: (habit) => set((state) => {
      delete state.data.habitSchedules[habit];
    }),

    setHabitTemplate: (template, fullText) => set((state) => {
      state.data.habitTemplate = template;
      state.data.habitFullText = fullText;
    }),

    setSimpleHabit: (habit) => set((state) => {
      state.data.simpleHabit = habit;
    }),
    
    setTutorialCompleted: () => set((state) => { 
      state.data.tutorialCompleted = true;
    }),
    
    setFirstHabitCompleted: () => set((state) => { 
      state.data.firstHabitCompleted = true;
    }),
    
    setPrivacy: (key, value) => set((state) => {
      state.data.privacy[key] = value;
    }),
    
    setFirstCheckIn: (mood, entry) => set((state) => {
      state.data.firstMood = mood;
      state.data.firstEntry = entry;
    }),
    
    completeOnboarding: () => set((state) => {
      state.isComplete = true;
      // Clear recovery data when onboarding is complete
      get().clearRecoveryData();
    }),

    resetOnboarding: () => set((state) => {
      // Reset intro flow
      state.introStep = 1;
      state.introComplete = false;

      // Reset main onboarding
      state.currentStep = 1;
      state.isComplete = false;
      state.data = {
        mode: null,
        selectedAvatarType: null,
        avatarName: '',
        goalCategory: null,
        goalTitle: '',
        goalDetails: '',
        targetDate: '',
        deepWhy: '',
        whyVoicePath: null,
        selectedObstacles: [],
        customObstacles: [],
        selectedHabits: [],
        customHabits: [],
        habitSchedules: {},
        habitTemplate: null,
        habitFullText: '',
        simpleHabit: '',
        tutorialCompleted: false,
        firstHabitCompleted: false,
        privacy: { localOnly: true, voiceRecording: false },
        firstMood: null,
        firstEntry: ''
      };
    }),

    // Development helper - force reset onboarding (clears persistent storage too)
    forceResetOnboarding: async () => {
      try {
        // Clear persistent storage
        await secureStorage.removeItem('onboarding-store');
        await secureStorage.removeItem('onboarding-recovery');

        // Reset state
        set((state) => {
          state.introStep = 1;
          state.introComplete = false;
          state.currentStep = 1;
          state.isComplete = false;
          state.data = {
            mode: null,
            selectedAvatarType: null,
            avatarName: '',
            goalCategory: null,
            goalTitle: '',
            goalDetails: '',
            targetDate: '',
            deepWhy: '',
            whyVoicePath: null,
            selectedObstacles: [],
            customObstacles: [],
            selectedHabits: [],
            customHabits: [],
            habitSchedules: {},
            habitTemplate: null,
            habitFullText: '',
            simpleHabit: '',
            tutorialCompleted: false,
            firstHabitCompleted: false,
            privacy: { localOnly: true, voiceRecording: false },
            firstMood: null,
            firstEntry: ''
          };
        });

        console.log('Onboarding completely reset - app should redirect to onboarding flow');
      } catch (error) {
        console.error('Failed to force reset onboarding:', error);
      }
    },

    // Recovery functions
    hasRecoveryData: async () => {
      try {
        const savedData = await secureStorage.getItem('onboarding-recovery');
        return savedData !== null;
      } catch {
        return false;
      }
    },

    clearRecoveryData: async () => {
      try {
        await secureStorage.removeItem('onboarding-recovery');
      } catch (error) {
        console.warn('Failed to clear recovery data:', error);
      }
    },

    getRecoveryProgress: () => {
      const state = get();
      const completedSteps: string[] = [];

      if (state.data.avatarName) completedSteps.push('Avatar personalized');
      if (state.data.goalTitle) completedSteps.push('Goal defined');
      if (state.data.deepWhy) completedSteps.push('Why explored');
      if (state.data.habitTemplate) completedSteps.push('Habit created');
      if (state.data.firstEntry) completedSteps.push('First check-in complete');

      return {
        step: state.currentStep,
        completedSteps
      };
    },
    
    canProceedFromStep: (step) => {
      const { data } = get();
      // 7-step flow: 1=Avatar Name, 2=Goal Details, 3=Your Why, 4=Habit Selection, 5=First Check-in, 6=Tutorial, 7=Privacy
      switch (step) {
        case 1: return data.avatarName.trim().length >= 2; // Avatar personalization
        case 2: return data.goalTitle.trim().length >= 3; // Goal details
        case 3: return data.deepWhy.trim().length >= 10; // Your why
        case 4: return data.habitTemplate !== null; // Habit creation - must create a habit
        case 5: return data.firstMood !== null && data.firstEntry.trim().length >= 10; // First check-in
        case 6: return data.tutorialCompleted && data.firstHabitCompleted; // Tutorial
        case 7: return true; // Privacy - final step
        default: return true;
      }
    }
  })),
  {
    name: 'onboarding-store',
    storage: createJSONStorage(() => secureStorage),
    partialize: (state) => ({
      // Only persist essential data, not UI state
      introStep: state.introStep,
      introComplete: state.introComplete,
      currentStep: state.currentStep,
      data: state.data,
      // Don't persist isComplete to allow recovery
    }),
    version: 2,
    migrate: (persistedState: any, version: number) => {
      // Migrate from version 1 to 2: Add simpleHabit field
      if (version < 2) {
        if (persistedState?.data && persistedState.data.simpleHabit === undefined) {
          persistedState.data.simpleHabit = '';
        }
      }
      return persistedState;
    },
  }
));
