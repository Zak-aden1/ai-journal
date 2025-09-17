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
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
    return targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const canNavigateNext = () => {
    return currentMonthOffset < 0; // Can only go forward if we're in the past
  };

  const generateMonthGrid = () => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
    
    // Start from the beginning of the week containing the 1st
    const firstDay = new Date(targetDate);
    firstDay.setDate(1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go to Sunday
    
    // Generate 42 days (6 weeks)
    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Find completion data for this date
      const completionData = completions.find(c => c.date === dateStr);
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === targetDate.getMonth(),
        completed: completionData?.completed || false,
        planned: completionData?.planned || false,
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }
    
    return days;
  };

  const monthDays = generateMonthGrid();
  
  // Group by week for better layout (6 weeks of 7 days each)
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(monthDays.slice(i * 7, (i + 1) * 7));
  }
  
  const getDayStyle = (day: any) => {
    const baseStyle = [styles.dayContainer];
    
    // Fade out days from other months
    if (!day.isCurrentMonth) {
      baseStyle.push(styles.otherMonthDay);
      return baseStyle;
    }
    
    if (day.completed) {
      baseStyle.push({ backgroundColor: theme.colors.primary });
    } else {
      // Planned but missed vs off day
      if (day.planned) {
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
    
    if (day.isToday) {
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
          style={[styles.navButton, !canNavigateNext() && styles.navButtonDisabled]}
          onPress={() => canNavigateNext() && setCurrentMonthOffset(currentMonthOffset + 1)}
          disabled={!canNavigateNext()}
        >
          <Text style={[
            styles.navText, 
            { color: canNavigateNext() ? theme.colors.text.primary : theme.colors.text.muted }
          ]}>›</Text>
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
                style={getDayStyle(day)}
                onPress={() => day.isCurrentMonth && onDatePress?.(day.date)}
                disabled={!day.isCurrentMonth}
              >
                <Text 
                  style={[
                    styles.dayText, 
                    { 
                      color: !day.isCurrentMonth 
                        ? theme.colors.text.muted + '50'
                        : day.completed 
                          ? '#fff' 
                          : theme.colors.text.primary,
                      fontWeight: day.isToday ? 'bold' : 'normal'
                    }
                  ]}
                >
                  {day.day}
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
  navButtonDisabled: {
    opacity: 0.5,
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
  otherMonthDay: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});
