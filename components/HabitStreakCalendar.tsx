import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface HabitStreakCalendarProps {
  completions: { date: string; completed: boolean; planned?: boolean }[];
  onDatePress?: (date: string) => void;
  title?: string;
}

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function HabitStreakCalendar({ completions, onDatePress, title }: HabitStreakCalendarProps) {
  const { theme } = useTheme();
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate().toString();
  };
  
  const getCurrentMonthYear = () => {
    if (completions.length === 0) return '';
    const date = new Date(completions[completions.length - 1].date);
    date.setMonth(date.getMonth() + currentMonthOffset);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Group by week for better layout
  const weeks: { date: string; completed: boolean; planned?: boolean }[][] = [];
  let currentWeek: { date: string; completed: boolean; planned?: boolean }[] = [];
  
  completions.forEach((completion, index) => {
    currentWeek.push(completion);
    if (currentWeek.length === 7 || index === completions.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  const getDayStyle = (completed: boolean, planned: boolean | undefined, isToday: boolean) => {
    const baseStyle = [styles.dayContainer];
    
    if (completed) {
      baseStyle.push({ backgroundColor: theme.colors.primary });
    } else {
      // Planned but missed vs off day
      if (planned) {
        baseStyle.push({ 
          backgroundColor: theme.colors.background.secondary,
          borderWidth: 2,
          borderColor: theme.colors.warning || '#F59E0B'
        });
      } else {
        baseStyle.push({ 
          backgroundColor: theme.colors.card || theme.colors.background.secondary,
          borderWidth: 1,
          borderColor: theme.colors.line 
        });
      }
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
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setCurrentMonthOffset(currentMonthOffset - 1)}
        >
          <Text style={[styles.navText, { color: theme.colors.text.primary }]}>‹</Text>
        </TouchableOpacity>
        
        <Text style={[styles.monthYear, { color: theme.colors.text.primary }]}>
          {getCurrentMonthYear()}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setCurrentMonthOffset(currentMonthOffset + 1)}
        >
          <Text style={[styles.navText, { color: theme.colors.text.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <Text key={day} style={[styles.dayLabel, { color: theme.colors.text.secondary }]}>
            {day}
          </Text>
        ))}
      </View>
      
      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day) => (
              <Pressable
                key={day.date}
                style={getDayStyle(day.completed, !!day.planned, isToday(day.date))}
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
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 20,
    fontWeight: '300',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    width: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  calendar: {
    gap: 8,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
