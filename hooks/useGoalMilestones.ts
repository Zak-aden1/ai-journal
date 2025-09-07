import { useEffect, useMemo, useState } from 'react';
import { getHabitCompletions } from '@/lib/db';

export type CompanionMilestone = {
  key: string;
  title: string;
  condition: string;
  unlocked: boolean;
  unlockedAt?: number;
  narrative: string; // short story text
};

function uniqDaysWithAnyCompletion(daysByHabit: Array<Array<{ date: string; completed: boolean }>>): number {
  const dayMap: Record<string, boolean> = {};
  for (const days of daysByHabit) {
    for (const d of days) {
      if (d.completed) dayMap[d.date] = true;
    }
  }
  return Object.keys(dayMap).length;
}

type Inputs = {
  goalId: string | undefined;
  habitsWithIds: Record<string, Array<{ id: string; title: string }>>;
  getHabitStreak: (habitId: string) => Promise<{ current: number; longest: number }>;
  avatarMemory: { milestones?: string[] } | undefined;
  updateAvatarMemoryWithMilestone: (key: string) => void;
};

export function useGoalMilestones({ goalId, habitsWithIds, getHabitStreak, avatarMemory, updateAvatarMemoryWithMilestone }: Inputs) {

  const [milestones, setMilestones] = useState<CompanionMilestone[]>([]);
  const [loading, setLoading] = useState(false);

  const goalHabits = useMemo(() => (goalId ? (habitsWithIds[goalId] || []) : []), [habitsWithIds, goalId]);

  useEffect(() => {
    let cancelled = false;
    if (!goalId) return () => { cancelled = true; };

    const compute = async () => {
      setLoading(true);
      try {
        const habitIds = goalHabits.map(h => h.id);
        // Streaks
        const streaks = await Promise.all(habitIds.map(async (id) => {
          try { return await getHabitStreak(id); } catch { return { current: 0, longest: 0 }; }
        }));
        const maxCurrentStreak = Math.max(0, ...streaks.map(s => s.current || 0));
        const maxLongestStreak = Math.max(0, ...streaks.map(s => s.longest || 0));
        // Completions for last 14/30 days
        const last14 = await Promise.all(habitIds.map(async (id) => await getHabitCompletions(id, 14)));
        const last30 = await Promise.all(habitIds.map(async (id) => await getHabitCompletions(id, 30)));
        const total14 = last14.flat().filter(d => d.completed).length;
        const total30 = last30.flat().filter(d => d.completed).length;
        const uniqueDays14 = uniqDaysWithAnyCompletion(last14);

        // Weekly consistency proxy (last 7 days: any completion per day)
        const last7 = await Promise.all(habitIds.map(async (id) => await getHabitCompletions(id, 7)));
        const days7 = new Map<string, boolean>();
        last7.forEach(list => list.forEach(d => { if (d.completed) days7.set(d.date, true); }));
        const consistency7 = (days7.size / 7) * 100;

        const unlockedTags = avatarMemory?.milestones || [];
        const hasTag = (key: string) => unlockedTags.includes(key);

        const tag = (k: string) => `goal:${goalId}:${k}`;

        const ms: CompanionMilestone[] = [
          {
            key: 'seedling',
            title: 'Seedling',
            condition: 'Reach a 3-day streak on any habit',
            unlocked: maxCurrentStreak >= 3 || hasTag(tag('seedling')),
            narrative: "I felt our first roots take hold when you showed up three days in a row. Small steps, real momentum. 🌱",
          },
          {
            key: 'first_roots',
            title: 'First Roots',
            condition: '7-day streak or 60% weekly consistency',
            unlocked: maxCurrentStreak >= 7 || consistency7 >= 60 || hasTag(tag('first_roots')),
            narrative: "A full week! I’m steadier now because of your rhythm. You’re proving you can keep promises to yourself. 🌿",
          },
          {
            key: 'growth_spurt',
            title: 'Growth Spurt',
            condition: '10+ completions in last 14 days',
            unlocked: total14 >= 10 || hasTag(tag('growth_spurt')),
            narrative: "So many solid reps lately. It’s not luck—it’s practice. I can feel our energy rise together. ⚡",
          },
          {
            key: 'branching_out',
            title: 'Branching Out',
            condition: 'Active on 10 days in last 14',
            unlocked: uniqueDays14 >= 10 || hasTag(tag('branching_out')),
            narrative: "You’ve been present on most days—some big, some small. That’s how branches form. 🌳",
          },
          {
            key: 'bloom',
            title: 'Bloom',
            condition: '14-day streak or 30+ completions (last 30)',
            unlocked: maxCurrentStreak >= 14 || total30 >= 30 || hasTag(tag('bloom')),
            narrative: "This is a bloom moment. Your consistency is changing both of us. Let’s savor it, then keep going. 🌸",
          },
        ];

        if (!cancelled) setMilestones(ms);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    compute();
    return () => { cancelled = true; };
  }, [goalId, goalHabits, (avatarMemory?.milestones?.length || 0), getHabitStreak]);

  const markUnlocked = (key: string) => {
    if (!goalId) return;
    updateAvatarMemoryWithMilestone(`goal:${goalId}:${key}`);
  };

  return { milestones, loading, markUnlocked };
}
