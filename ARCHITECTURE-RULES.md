
### Routing (Expo Router)
- Group screens by concern using route groups: `app/(tabs)`, `app/(sign-in)`.
- Keep `app/_layout.tsx` responsible for:
  - Preventing auto-hide of splash (`expo-splash-screen`) and hiding it after fonts/assets load.
  - Wrapping with `GestureHandlerRootView` and `ThemeProvider`.
  - Initializing global stores and rendering a loader while `isLoading` is true.
- Keep tab bar configuration in `app/(tabs)/_layout.tsx`:
  - One file per tab screen (`index.tsx`, `history.tsx`, etc.).
  - Set `headerTitle`, icons, and options per tab in the layout file.
- Use dynamic routes for entity details, e.g. `app/recipe/[id].tsx`, `app/cookbook/[id].tsx`.
- Add `+not-found.tsx` for unknown routes.

### State (Zustand)
- One store per domain in `store/` (e.g., `UserStore.ts`, `RecipeStore.ts`).
- Shape:
  - State: domain data, `isLoading` where relevant.
  - Actions: CRUD + initialization/hydration.
- Persist:
  - Sensitive: `expo-secure-store` (e.g., tokens).
  - Non-sensitive: `@react-native-async-storage/async-storage`.
- Initialize stores at app root:
  - Call `initializeStore()` in `app/_layout.tsx`.
  - Show a centered loader while `isLoading` is true.
- Do not gate navigation inside screens. If gating, do it in layouts via store state (e.g., onboarding, auth).

### API Layer
- Place typed API clients in `api/` (one file per domain).
- Use a configured `axios` instance per service; do not inline headers or base URLs inside screens.
- No secrets in code. Read keys/URLs from `config/constants.ts` or env.
- API functions return typed results; map DTOs to app types in the API layer.

### Types
- Define domain models in `types/`. Keep optional fields explicit.
- Never import from UI into `types/`. Keep it dependency-free.
- Favor normalized relationships (e.g., `Recipe` has `ingredients`, `instructions`, optional `sections`).

### Theming & Design Tokens
- Define tokens in `theme.ts` (colors, later typography/spacing).
- Import tokens via path alias (e.g., `@/theme`) from components/screens.
- Use `@react-navigation/native` `ThemeProvider` at the root; keep `DefaultTheme` unless you add a dark theme.

### Config
- Keep runtime config in `config/constants.ts`:
  - Switch base URLs by `__DEV__`.
  - Keep client IDs and similar identifiers here.
- Do not place secrets in the repo. Prefer `app.config.ts` with env or secure storage on device when needed.

### Components
- `components/` are reusable and presentation-focused.
- Keep side-effects and navigation outside components; pass data and callbacks via props.
- Complex flows that are tied to specific routes should live in `app/` (not `components/`).

### Assets & Fonts
- Place fonts in `assets/fonts/`; load them in `app/_layout.tsx` via `useFonts`.
- Keep splash screen visible until fonts loaded; hide via `SplashScreen.hideAsync()`.

### Path Aliases & TS
- Configure `tsconfig.json`:
  - `"paths": { "@/*": ["./*"] }`
- Import internal modules via alias: `@/store/UserStore`, `@/config/constants`, etc.

### DX & Scripts
- `package.json`:
  - `"main": "expo-router/entry"`
  - `"start": "expo start"`, platform scripts, lint, tests.
- Keep Jest preset minimal (e.g., `jest-expo`); add tests as needed.

### Do / Don’t
- Do:
  - Initialize and gate app state in layouts.
  - Centralize API config and types.
  - Keep stores cohesive per domain with clear actions.
  - Use aliases for imports.
- Don’t:
  - Hardcode secrets or base URLs inside screens/components.
  - Mix navigation logic inside presentational components.
  - Create deep relative imports (`../../..`); always use `@/`.

### Minimal Root Layout Pattern
```tsx
// app/_layout.tsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUserStore } from '@/store/UserStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({ SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf') });
  const { initializeStore, isLoading } = useUserStore();

  useEffect(() => { initializeStore(); }, []);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (isLoading || !loaded) {
    return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator size="large" />
    </View>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="signin" options={{ headerShown: false }} />
          <Stack.Screen name="(sign-in)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

### Quick Checklist (copy into PR template)
- [ ] `app/_layout.tsx` initializes stores, controls splash, provides theme.
- [ ] Tabs and routes follow `(tabs)` and groups; dynamic screens in `[id].tsx`.
- [ ] Stores in `store/` with `initializeStore()`, typed state/actions, proper persistence.
- [ ] API clients in `api/` with axios instances; no secrets checked in.
- [ ] Domain types in `types/`; components are presentation-only.
- [ ] `theme.ts` used via `@/theme`, not ad-hoc colors.
- [ ] `tsconfig.json` alias `@/*` configured; imports use alias.
- [ ] `config/constants.ts` manages runtime values; `package.json` uses `expo-router/entry`.