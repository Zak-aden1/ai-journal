export type SuggestionOut = { action: string; goal: string; reason: string };

function pickFirstGoal(goals: string[]): string {
  return goals.length > 0 ? goals[0] : 'your energy';
}

function truncate(text: string, len = 64): string {
  return text.length > len ? `${text.slice(0, len)}…` : text;
}

export function nextActionFrom(text: string, goals: string[]): SuggestionOut {
  const lower = `${text} ${goals.join(' ')}`.toLowerCase();
  let action = '2-min box breathing';
  if (/(read)/.test(lower)) action = 'Read 5 pages';
  else if (/(workout|gym)/.test(lower)) action = '10 bodyweight squats';
  else if (/(tired|sleep|wind)/.test(lower)) action = '10m no-screens wind-down';

  const goal = pickFirstGoal(goals);
  const reason = `Based on: "${truncate(text)}" and your goal: ${goal}`;
  return { action, goal, reason };
}


