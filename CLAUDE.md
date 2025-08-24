# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` / `expo start` - Start development server with Metro bundler
- `npm run android` - Run on Android emulator  
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run on web
- `npm run lint` - Run ESLint with expo config
- `npm run reset-project` - Move starter code to app-example and create blank app directory

## Architecture Overview

This is a React Native Expo app built with:
- **Expo Router** (file-based routing) with typed routes enabled
- **Zustand** for state management with Immer middleware
- **SQLite** (expo-sqlite) for local data persistence with encryption
- **Expo Secure Store** for sensitive data storage

### App Structure

#### Routing (`app/` directory)
- Uses Expo Router with file-based routing
- Main navigation via tab layout in `app/(tabs)/`
- Tabs: Home (`index.tsx`), Journal, Goals, Settings  
- Modals: `modals/goal-detail.tsx`, `modals/weekly-review.tsx`
- Onboarding flow: `onboarding/index.tsx` with steps in `onboarding/steps/`
- Root layout (`app/_layout.tsx`) handles:
  - Font loading (SpaceMono)
  - Store hydration and loading states
  - Theme provider setup
  - Gesture handler root view

#### State Management (`stores/`)
- **App Store** (`stores/app.ts`): Main application state
  - Goals, habits, journal entries
  - Theme mode, privacy settings, AI mode (Companion/Coach)
  - Next action suggestions
  - Database hydration on startup
- **Onboarding Store** (`stores/onboarding.ts`): Multi-step onboarding flow
  - Goal setup, deep why, obstacles, habits, privacy preferences
  - Step validation and completion tracking

#### Database Layer (`lib/db.ts`)
- SQLite database with encrypted journal entries
- Tables: goals, habits, entries (encrypted), goal_meta
- Uses WAL mode for better performance
- All text entries are encrypted using `lib/crypto.ts`

#### AI Services (`services/ai/`)
- Simple suggestion system (`suggestions.ts`) that analyzes journal entries
- Suggests next actions based on entry content and user goals

### Key Architectural Principles

Per `ARCHITECTURE-RULES.md`, this codebase follows:

- **Routing**: Expo Router with route groups, dynamic routes (`[id].tsx`)  
- **State**: One Zustand store per domain with typed state/actions
- **Persistence**: Expo Secure Store for sensitive data, local SQLite for app data
- **Theming**: React Navigation ThemeProvider with dark/light mode support
- **Path Aliases**: All imports use `@/` prefix (configured in `tsconfig.json`)

### Component Organization

- `components/` - Reusable UI components (ThemedView, Toggle, VoiceRecorder, etc.)
- `components/onboarding/` - Onboarding-specific components
- `components/ui/` - Platform-specific UI components (IconSymbol, TabBarBackground)
- `hooks/` - Custom hooks (useTheme, useColorScheme)
- `lib/` - Core utilities (database, crypto, theme)
- `constants/` - Design tokens and colors

### Privacy & Security

- Journal entries are encrypted at rest using AES encryption (`lib/crypto.ts`)
- Privacy settings control local-only mode and voice recording permissions
- No external API calls - everything runs locally on device

### Development Notes

- Uses React 19 and React Native 0.79.5
- TypeScript with strict configuration
- ESLint with Expo config
- No test framework currently configured
- Font loading handled in root layout with splash screen management