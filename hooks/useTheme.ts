import { useAppStore } from '@/stores/app';
import { lightTheme, darkTheme } from '@/lib/theme';

export function useTheme() {
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  
  return {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light',
  };
}
