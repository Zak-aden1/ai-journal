export type TimeType = 'morning' | 'afternoon' | 'evening' | 'specific' | 'anytime' | 'lunch';

export type RankedHabit = {
  id: string;
  title: string;
  completed: boolean;
  streak: number;
  timeType?: TimeType;
  specificTime?: string | null;
  daysOfWeek?: string[]; // ['mon', 'tue']
};

function hourFromSpecific(time?: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isFinite(h)) return h as number;
  return null;
}

function proximityScore(habit: RankedHabit, now = new Date()): number {
  const hour = now.getHours();
  const dow = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
  // Day match bonus
  let score = 0;
  if (!habit.daysOfWeek || habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(dow)) {
    score += 10;
  } else {
    score -= 5;
  }
  // Time window proximity
  switch (habit.timeType) {
    case 'morning':
      // closer to 8–11
      score += 8 - Math.min(Math.abs(hour - 9), 8);
      break;
    case 'afternoon':
      score += 8 - Math.min(Math.abs(hour - 14), 8);
      break;
    case 'evening':
      score += 8 - Math.min(Math.abs(hour - 19), 8);
      break;
    case 'lunch':
      score += 8 - Math.min(Math.abs(hour - 12), 8);
      break;
    case 'specific': {
      const h = hourFromSpecific(habit.specificTime);
      if (h !== null) score += 10 - Math.min(Math.abs(hour - h), 10);
      break;
    }
    case 'anytime':
    default:
      score += 4; // mild bias to make it eligible
  }
  return score;
}

function streakNeedScore(streak: number): number {
  // Prioritize building small streaks; de-prioritize huge streaks (they're stable)
  if (streak <= 1) return 10;
  if (streak <= 3) return 7;
  if (streak <= 7) return 5;
  return 2;
}

export function rankHabits(habits: RankedHabit[], opts?: { excludeIds?: Set<string> }): RankedHabit[] {
  const exclude = opts?.excludeIds ?? new Set<string>();
  const now = new Date();
  return habits
    .filter(h => !h.completed && !exclude.has(h.id))
    .map(h => {
      const base = 0;
      const prox = proximityScore(h, now);
      const need = streakNeedScore(h.streak);
      const score = base + prox + need;
      return { ...h, _score: score } as any;
    })
    .sort((a: any, b: any) => b._score - a._score)
    .map(({ _score, ...rest }: any) => rest);
}

