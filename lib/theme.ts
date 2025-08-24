export const tokens = {
  colors: {
    // Core brand colors
    ink: '#0F172A',
    mint: '#22C55E',
    cloud: '#F8FAFC',
    card: '#FFFFFF',
    line: '#E5E7EB',
    
    // Extended color palette
    primary: '#22C55E',
    secondary: '#3B82F6',
    accent: '#8B5CF6',
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    info: '#0EA5E9',
    
    // Dark theme colors
    dark: {
      bg: '#0F1419',
      bgSecondary: '#1E293B',
      bgTertiary: '#334155',
      text: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      border: '#374151',
    },
    
    // Category colors
    category: {
      health: '#EF4444',
      learning: '#3B82F6',
      career: '#8B5CF6',
      personal: '#F59E0B',
    },
    
    // Semantic colors
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      muted: '#94A3B8',
      inverse: '#FFFFFF',
    },
    
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Interactive states
    interactive: {
      primary: '#22C55E',
      primaryHover: '#16A34A',
      primaryPressed: '#15803D',
      secondary: '#E2E8F0',
      secondaryHover: '#CBD5E1',
      secondaryPressed: '#94A3B8',
      disabled: '#F1F5F9',
      disabledText: '#CBD5E1',
    },
    
    // Status colors
    status: {
      success: '#10B981',
      successBg: '#D1FAE5',
      warning: '#F59E0B',
      warningBg: '#FEF3C7',
      error: '#EF4444',
      errorBg: '#FEE2E2',
      info: '#0EA5E9',
      infoBg: '#E0F2FE',
    },
  },
  
  radius: 14,
  spacing: { 
    xs: 4, 
    sm: 8, 
    md: 12, 
    lg: 16, 
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  },
  
  type: {
    body: { fontSize: 16, lineHeight: 24 },
    section: { fontSize: 20, lineHeight: 28 },
    hero: { fontSize: 24, lineHeight: 32 },
    display: { fontSize: 32, lineHeight: 40 },
    caption: { fontSize: 12, lineHeight: 16 },
    small: { fontSize: 14, lineHeight: 20 },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// Theme variants
export const lightTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    background: tokens.colors.background,
    text: tokens.colors.text,
  },
};

export const darkTheme = {
  ...tokens,
  colors: {
    ...tokens.colors,
    background: {
      primary: tokens.colors.dark.bg,
      secondary: tokens.colors.dark.bgSecondary,
      tertiary: tokens.colors.dark.bgTertiary,
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    text: {
      primary: tokens.colors.dark.text,
      secondary: tokens.colors.dark.textSecondary,
      muted: tokens.colors.dark.textMuted,
      inverse: tokens.colors.text.primary,
    },
    card: tokens.colors.dark.bgSecondary,
    line: tokens.colors.dark.border,
  },
};