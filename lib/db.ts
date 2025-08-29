import * as SQLite from 'expo-sqlite';
import { encrypt } from '@/lib/crypto';
import type { Mood, Entry, EntryType } from '@/stores/app';

type GoalRow = { id: string; title: string };

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    // SDK 53+ async API
    dbPromise = SQLite.openDatabaseAsync('ai_journal.db');
  }
  return dbPromise;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDbAsync();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS goals (id TEXT PRIMARY KEY NOT NULL, title TEXT UNIQUE NOT NULL);
    CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY NOT NULL, goalId TEXT, title TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY NOT NULL, createdAt INTEGER NOT NULL, mood TEXT, ciphertext TEXT NOT NULL, type TEXT DEFAULT 'free_journal', voiceRecordingUri TEXT, habitId TEXT);
    CREATE TABLE IF NOT EXISTS goal_meta (goalId TEXT PRIMARY KEY NOT NULL, why_text TEXT, why_audio_uri TEXT, obstacles_json TEXT);
    CREATE TABLE IF NOT EXISTS habit_completions (id TEXT PRIMARY KEY NOT NULL, habitId TEXT NOT NULL, completedAt INTEGER NOT NULL, dateKey TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habitId, dateKey);
  `);
  
  // Migration: Make goalId nullable in existing habits table
  await migrateHabitsTable(database);
  
  // Migration: Add type column to existing entries table if missing
  await migrateEntriesTable(database);
}

async function migrateHabitsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if habits table has the old schema (goalId NOT NULL)
    const tableInfo = await database.getAllAsync("PRAGMA table_info(habits)");
    const goalIdColumn = tableInfo.find((col: any) => col.name === 'goalId');
    
    if (goalIdColumn && (goalIdColumn as any).notnull === 1) {
      console.log('Migrating habits table to allow null goalId...');
      
      // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
      await database.execAsync(`
        BEGIN TRANSACTION;
        
        -- Create new table with nullable goalId
        CREATE TABLE habits_new (
          id TEXT PRIMARY KEY NOT NULL, 
          goalId TEXT, 
          title TEXT NOT NULL
        );
        
        -- Copy existing data
        INSERT INTO habits_new (id, goalId, title)
        SELECT id, goalId, title FROM habits;
        
        -- Drop old table and rename new one
        DROP TABLE habits;
        ALTER TABLE habits_new RENAME TO habits;
        
        COMMIT;
      `);
      
      console.log('Habits table migration completed successfully');
    }
  } catch (error) {
    console.error('Error during habits table migration:', error);
    // Don't throw - continue with app initialization
  }
}

async function migrateEntriesTable(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if entries table has the type column
    const tableInfo = await database.getAllAsync("PRAGMA table_info(entries)");
    const typeColumn = tableInfo.find((col: any) => col.name === 'type');
    
    if (!typeColumn) {
      console.log('Migrating entries table to add type column...');
      
      // Add the missing type column with default value
      await database.execAsync(`
        ALTER TABLE entries ADD COLUMN type TEXT DEFAULT 'free_journal';
      `);
      
      console.log('Entries table migration completed successfully');
    }
    
    // Also check for missing voiceRecordingUri and habitId columns
    const voiceColumn = tableInfo.find((col: any) => col.name === 'voiceRecordingUri');
    const habitIdColumn = tableInfo.find((col: any) => col.name === 'habitId');
    
    if (!voiceColumn) {
      console.log('Adding voiceRecordingUri column to entries table...');
      await database.execAsync(`
        ALTER TABLE entries ADD COLUMN voiceRecordingUri TEXT;
      `);
    }
    
    if (!habitIdColumn) {
      console.log('Adding habitId column to entries table...');
      await database.execAsync(`
        ALTER TABLE entries ADD COLUMN habitId TEXT;
      `);
    }
    
  } catch (error) {
    console.error('Error during entries table migration:', error);
    // Don't throw - continue with app initialization
  }
}

async function runAsync(database: SQLite.SQLiteDatabase, sql: string, params: any[] = []): Promise<void> {
  await database.runAsync(sql, params);
}

async function getAllAsync<T = any>(database: SQLite.SQLiteDatabase, sql: string, params: any[] = []): Promise<T[]> {
  return database.getAllAsync<T>(sql, params);
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function upsertGoal(title: string): Promise<string> {
  const database = await getDbAsync();
  const existing = await getAllAsync<GoalRow>(database, 'SELECT id, title FROM goals WHERE title = ? LIMIT 1', [title]);
  if (existing.length > 0) return existing[0].id;
  const id = generateId();
  await runAsync(database, 'INSERT INTO goals (id, title) VALUES (?, ?)', [id, title]);
  return id;
}

export async function upsertHabit(goalId: string | null, title: string): Promise<string> {
  const database = await getDbAsync();
  const id = generateId();
  await runAsync(database, 'INSERT INTO habits (id, goalId, title) VALUES (?, ?, ?)', [id, goalId, title]);
  return id;
}

export async function insertEntry({ id, text, mood, createdAt, type, voiceRecordingUri, habitId }: Entry): Promise<void> {
  const database = await getDbAsync();
  const ciphertext = await encrypt(text);
  await runAsync(database, 'INSERT INTO entries (id, createdAt, mood, ciphertext, type, voiceRecordingUri, habitId) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    id, 
    createdAt, 
    mood ?? null, 
    ciphertext, 
    type ?? 'free_journal', 
    voiceRecordingUri ?? null, 
    habitId ?? null
  ]);
}

export async function listGoals(): Promise<Array<{ id: string; title: string }>> {
  try {
    const database = await getDbAsync();
    return getAllAsync(database, 'SELECT id, title FROM goals ORDER BY rowid ASC');
  } catch (error) {
    console.error('Error loading goals:', error);
    return [];
  }
}

export async function listHabitsByGoal(goalId: string): Promise<string[]> {
  const database = await getDbAsync();
  const rows = await getAllAsync<{ title: string }>(database, 'SELECT title FROM habits WHERE goalId = ? ORDER BY rowid ASC', [goalId]);
  return rows.map((r) => r.title);
}

export async function listHabitsWithIdsByGoal(goalId: string): Promise<Array<{ id: string; title: string }>> {
  try {
    const database = await getDbAsync();
    return getAllAsync(database, 'SELECT id, title FROM habits WHERE goalId = ? ORDER BY rowid ASC', [goalId]);
  } catch (error) {
    console.error('Error loading habits for goal:', error);
    return [];
  }
}

export async function listStandaloneHabits(): Promise<Array<{ id: string; title: string }>> {
  try {
    const database = await getDbAsync();
    return getAllAsync(database, 'SELECT id, title FROM habits WHERE goalId IS NULL ORDER BY rowid ASC');
  } catch (error) {
    console.error('Error loading standalone habits:', error);
    return [];
  }
}

export async function listAllHabitsWithGoals(): Promise<Array<{ id: string; title: string; goalId: string | null; goalTitle?: string }>> {
  const database = await getDbAsync();
  return getAllAsync(database, `
    SELECT h.id, h.title, h.goalId, g.title as goalTitle 
    FROM habits h 
    LEFT JOIN goals g ON h.goalId = g.id 
    ORDER BY h.rowid ASC
  `);
}

export async function updateHabitGoalAssignment(habitId: string, goalId: string | null): Promise<void> {
  const database = await getDbAsync();
  await runAsync(database, 'UPDATE habits SET goalId = ? WHERE id = ?', [goalId, habitId]);
}

export async function deleteGoal(goalId: string): Promise<void> {
  const database = await getDbAsync();
  
  // Get all habits for this goal first
  const habits = await getAllAsync<{ id: string }>(database, 'SELECT id FROM habits WHERE goalId = ?', [goalId]);
  
  // Delete all habit completions for habits linked to this goal
  for (const habit of habits) {
    await runAsync(database, 'DELETE FROM habit_completions WHERE habitId = ?', [habit.id]);
  }
  
  // Delete all habits linked to this goal
  await runAsync(database, 'DELETE FROM habits WHERE goalId = ?', [goalId]);
  
  // Delete goal metadata
  await runAsync(database, 'DELETE FROM goal_meta WHERE goalId = ?', [goalId]);
  
  // Delete the goal itself
  await runAsync(database, 'DELETE FROM goals WHERE id = ?', [goalId]);
}

export async function deleteHabit(habitId: string): Promise<void> {
  const database = await getDbAsync();
  // Also delete all completions for this habit
  await runAsync(database, 'DELETE FROM habit_completions WHERE habitId = ?', [habitId]);
  await runAsync(database, 'DELETE FROM habits WHERE id = ?', [habitId]);
}

export async function listEntries(): Promise<Entry[]> {
  try {
    const database = await getDbAsync();
    const rows = await getAllAsync<{ 
      id: string; 
      createdAt: number; 
      mood?: Mood; 
      ciphertext: string; 
      type?: EntryType; 
      voiceRecordingUri?: string; 
      habitId?: string; 
    }>(database, 'SELECT id, createdAt, mood, ciphertext, type, voiceRecordingUri, habitId FROM entries ORDER BY createdAt DESC');
    
    // Note: We intentionally return only metadata here; plaintext decryption happens where needed.
    return rows.map((r) => ({ 
      id: r.id, 
      text: '[encrypted]', 
      mood: r.mood, 
      createdAt: r.createdAt,
      type: r.type ?? 'free_journal',
      voiceRecordingUri: r.voiceRecordingUri,
      habitId: r.habitId
    }));
  } catch (error) {
    console.error('Error loading entries:', error);
    // Return empty array instead of crashing
    return [];
  }
}

export async function saveGoalMeta(goalId: string, { why_text, why_audio_uri, obstacles }: { why_text?: string; why_audio_uri?: string; obstacles?: string[] }): Promise<void> {
  const database = await getDbAsync();
  const obstacles_json = obstacles ? JSON.stringify(obstacles) : null;
  await runAsync(database, 'INSERT OR REPLACE INTO goal_meta (goalId, why_text, why_audio_uri, obstacles_json) VALUES (?, ?, ?, ?)', [goalId, why_text ?? null, why_audio_uri ?? null, obstacles_json]);
}

export async function getGoalMeta(goalId: string): Promise<{ why_text?: string; why_audio_uri?: string; obstacles?: string[] }> {
  const database = await getDbAsync();
  const rows = await getAllAsync<{ goalId: string; why_text: string | null; why_audio_uri: string | null; obstacles_json: string | null }>(database, 'SELECT goalId, why_text, why_audio_uri, obstacles_json FROM goal_meta WHERE goalId = ? LIMIT 1', [goalId]);
  if (rows.length === 0) return {};
  return {
    why_text: rows[0].why_text ?? undefined,
    why_audio_uri: rows[0].why_audio_uri ?? undefined,
    obstacles: rows[0].obstacles_json ? JSON.parse(rows[0].obstacles_json) : undefined,
  };
}

// Habit completion tracking
function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export async function markHabitComplete(habitId: string, date: Date = new Date()): Promise<void> {
  const database = await getDbAsync();
  const dateKey = getDateKey(date);
  const id = generateId();
  const completedAt = date.getTime();
  
  // Insert or ignore if already completed today
  await runAsync(database, 'INSERT OR IGNORE INTO habit_completions (id, habitId, completedAt, dateKey) VALUES (?, ?, ?, ?)', [id, habitId, completedAt, dateKey]);
}

export async function unmarkHabitComplete(habitId: string, date: Date = new Date()): Promise<void> {
  const database = await getDbAsync();
  const dateKey = getDateKey(date);
  await runAsync(database, 'DELETE FROM habit_completions WHERE habitId = ? AND dateKey = ?', [habitId, dateKey]);
}

export async function isHabitCompletedOnDate(habitId: string, date: Date = new Date()): Promise<boolean> {
  const database = await getDbAsync();
  const dateKey = getDateKey(date);
  const rows = await getAllAsync(database, 'SELECT 1 FROM habit_completions WHERE habitId = ? AND dateKey = ? LIMIT 1', [habitId, dateKey]);
  return rows.length > 0;
}

export async function getHabitCompletions(habitId: string, dayCount: number = 30): Promise<Array<{ date: string; completed: boolean }>> {
  const database = await getDbAsync();
  const completions = await getAllAsync<{ dateKey: string }>(database, 'SELECT dateKey FROM habit_completions WHERE habitId = ? ORDER BY dateKey DESC LIMIT ?', [habitId, dayCount]);
  
  // Generate last N days
  const results: Array<{ date: string; completed: boolean }> = [];
  const today = new Date();
  for (let i = 0; i < dayCount; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = getDateKey(date);
    const completed = completions.some(c => c.dateKey === dateKey);
    results.push({ date: dateKey, completed });
  }
  
  return results.reverse(); // Oldest first
}

export async function calculateHabitStreak(habitId: string): Promise<{ current: number; longest: number }> {
  const database = await getDbAsync();
  const completions = await getAllAsync<{ dateKey: string }>(database, 'SELECT dateKey FROM habit_completions WHERE habitId = ? ORDER BY dateKey DESC', [habitId]);
  
  if (completions.length === 0) return { current: 0, longest: 0 };
  
  const today = getDateKey(new Date());
  const yesterday = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  
  // Calculate current streak
  let currentStreak = 0;
  const sortedDates = completions.map(c => c.dateKey).sort().reverse();
  
  // Check if today or yesterday was completed (current streak continues)
  if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
    let checkDate = new Date();
    if (!sortedDates.includes(today)) {
      checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday
    }
    
    while (sortedDates.includes(getDateKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  
  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;
  
  for (const dateKey of sortedDates.reverse()) {
    const currentDate = new Date(dateKey);
    
    if (prevDate === null || 
        (currentDate.getTime() - prevDate.getTime()) === 24 * 60 * 60 * 1000) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
    
    prevDate = currentDate;
  }
  
  return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
}


