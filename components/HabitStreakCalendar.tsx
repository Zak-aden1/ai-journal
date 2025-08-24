import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface HabitStreakCalendarProps {
  completions: { date: string; completed: boolean }[];
  onDatePress?: (date: string) => void;
  title?: string;
}

export function HabitStreakCalendar({ completions, onDatePress, title }: HabitStreakCalendarProps) {
  const { theme } = useTheme();
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate().toString();
  };
  
  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };
  
  // Group by week for better layout
  const weeks: { date: string; completed: boolean }[][] = [];
  let currentWeek: { date: string; completed: boolean }[] = [];
  
  completions.forEach((completion, index) => {
    currentWeek.push(completion);
    if (currentWeek.length === 7 || index === completions.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  const getDayStyle = (completed: boolean, isToday: boolean) => {
    const baseStyle = [styles.dayContainer];
    
    if (completed) {
      baseStyle.push({ backgroundColor: theme.colors.primary });
    } else {
      baseStyle.push({ 
        backgroundColor: theme.colors.card || theme.colors.background.secondary,
        borderWidth: 1,
        borderColor: theme.colors.line 
      });
    }
    
    if (isToday) {
      baseStyle.push({ 
        borderWidth: 2,
        borderColor: theme.colors.primary 
      });
    }
    
    return baseStyle;
  };
  
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };
  
  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>{title}</Text>
      )}
      
      {/* Month label */}
      {completions.length > 0 && (
        <Text style={[styles.monthLabel, { color: theme.colors.text.secondary }]}>
          {formatMonth(completions[completions.length - 1].date)}
        </Text>
      )}
      
      {/* Calendar grid */}
      <View style={styles.calendar}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day) => (
              <Pressable
                key={day.date}
                style={getDayStyle(day.completed, isToday(day.date))}
                onPress={() => onDatePress?.(day.date)}
              >
                <Text 
                  style={[
                    styles.dayText, 
                    { 
                      color: day.completed ? '#fff' : theme.colors.text.primary,
                      fontWeight: isToday(day.date) ? 'bold' : 'normal'
                    }
                  ]}
                >
                  {formatDate(day.date)}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  calendar: {
    gap: 4,
  },
  week: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  dayContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
});