import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface HabitCheckboxProps {
  title: string;
  completed: boolean;
  onToggle: () => void;
  currentStreak?: number;
  disabled?: boolean;
}

export function HabitCheckbox({ 
  title, 
  completed, 
  onToggle, 
  currentStreak = 0,
  disabled = false 
}: HabitCheckboxProps) {
  const { theme } = useTheme();
  
  const checkboxStyle = [
    styles.checkbox,
    {
      backgroundColor: completed ? theme.colors.primary : 'transparent',
      borderColor: completed ? theme.colors.primary : theme.colors.line,
    }
  ];
  
  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: theme.colors.card || theme.colors.background.secondary },
        disabled && { opacity: 0.6 }
      ]}
      onPress={onToggle}
      disabled={disabled}
    >
      <View style={styles.content}>
        <View style={checkboxStyle}>
          {completed && (
            <IconSymbol 
              name="checkmark" 
              size={16} 
              color="#fff" 
            />
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          
          {currentStreak > 0 && (
            <Text style={[styles.streak, { color: theme.colors.text.secondary }]}>
              {currentStreak} day streak 🔥
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 4,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  streak: {
    fontSize: 12,
    marginTop: 2,
  },
});