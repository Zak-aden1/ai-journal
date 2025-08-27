import { useMemo } from 'react';

interface UseContextualGreetingProps {
  primaryGoalHabits: any[];
  completedTodayCount: number;
  recommendedHabit: any;
}

export const useContextualGreeting = ({
  primaryGoalHabits,
  completedTodayCount,
  recommendedHabit,
}: UseContextualGreetingProps) => {
  return useMemo(() => {
    const hour = new Date().getHours();
    const totalHabits = primaryGoalHabits.length;
    const progress = totalHabits > 0 ? completedTodayCount / totalHabits : 0;
    const nextHabit = recommendedHabit;
    
    if (hour < 12) {
      if (progress === 0 && nextHabit) {
        return `Good morning! Ready for ${nextHabit.name}? 🌅`;
      } else if (progress > 0 && nextHabit) {
        return `Great start! Next: ${nextHabit.name} 💪`;
      } else if (progress === 1) {
        return `Morning champion! All habits completed! 🎆`;
      } else {
        return `Good morning! Ready to build great habits? 🌱`;
      }
    } else if (hour < 17) {
      if (nextHabit) {
        return `Afternoon ${nextHabit.name} time? 🚀`;
      } else if (progress === 1) {
        return `Afternoon excellence! All habits done! 🔥`;
      } else {
        return `Afternoon energy boost time! 🚀`;
      }
    } else {
      if (progress === 1) {
        return `Perfect day! All habits completed! 🌟`;
      } else if (nextHabit) {
        return `Evening ${nextHabit.name} session? 🌙`;
      } else {
        return `Winding down peacefully 🌙✨`;
      }
    }
  }, [primaryGoalHabits.length, completedTodayCount, recommendedHabit]);
};