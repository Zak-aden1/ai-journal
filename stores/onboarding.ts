import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useAppStore } from './app';
import { HabitSchedule } from '@/lib/db';

type Mode = 'Companion' | 'Coach';
type Mood = '😊'|'😐'|'😔'|'😤'|'😍';

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
  voiceNotePath: string | null;
  
  // Step 6 - Deep Why
  deepWhy: string;
  whyVoicePath: string | null;
  
  // Step 7 - Habits
  selectedObstacles: string[];
  customObstacles: string[];
  selectedHabits: string[];
  customHabits: string[];
  habitSchedules: Record<string, HabitSchedule>;
  
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
  setVoiceNote: (path: string, type: 'goal' | 'why') => void;
  setDeepWhy: (why: string) => void;
  addObstacle: (obstacle: string) => void;
  removeObstacle: (obstacle: string) => void;
  addHabit: (habit: string) => void;
  removeHabit: (habit: string) => void;
  setHabitSchedule: (habit: string, schedule: HabitSchedule) => void;
  removeHabitSchedule: (habit: string) => void;
  setTutorialCompleted: () => void;
  setFirstHabitCompleted: () => void;
  setPrivacy: (key: keyof OnboardingData['privacy'], value: boolean) => void;
  setFirstCheckIn: (mood: Mood, entry: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  
  // Validation
  canProceedFromStep: (step: number) => boolean;
}

export const useOnboardingStore = create<OnboardingStore>()(
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
      voiceNotePath: null,
      deepWhy: '',
      whyVoicePath: null,
      selectedObstacles: [],
      customObstacles: [],
      selectedHabits: [],
      customHabits: [],
      habitSchedules: {},
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
    
    setVoiceNote: (path, type) => set((state) => {
      if (type === 'goal') state.data.voiceNotePath = path;
      else state.data.whyVoicePath = path;
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
    
    completeOnboarding: () => set((state) => { state.isComplete = true }),
    
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
        voiceNotePath: null,
        deepWhy: '',
        whyVoicePath: null,
        selectedObstacles: [],
        customObstacles: [],
        selectedHabits: [],
        customHabits: [],
        habitSchedules: {},
        tutorialCompleted: false,
        firstHabitCompleted: false,
        privacy: { localOnly: true, voiceRecording: false },
        firstMood: null,
        firstEntry: ''
      };
    }),
    
    canProceedFromStep: (step) => {
      const { data } = get();
      // New 6-step flow: 1=Avatar Name, 2=Goal Details, 3=Habit Selection, 4=Your Why, 5=Tutorial, 6=Privacy
      switch (step) {
        case 1: return data.avatarName.trim().length >= 2; // Avatar personalization
        case 2: return data.goalTitle.trim().length >= 3; // Goal details
        case 3: return true; // Habit selection - optional, can always proceed
        case 4: return data.deepWhy.trim().length >= 10; // Your why
        case 5: return data.tutorialCompleted && data.firstHabitCompleted; // Tutorial
        case 6: return data.firstMood !== null && data.firstEntry.trim().length > 0; // Privacy/First entry
        default: return true;
      }
    }
  }))
);
