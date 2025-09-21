import * as SQLite from 'expo-sqlite';
import type { Mood, Entry, EntryType } from '@/stores/app';

type GoalRow = { id: string; title: string };

export interface HabitSchedule {
  daysOfWeek: string[]; // ['mon', 'tue', 'wed'] etc
  timeType: 'morning' | 'afternoon' | 'evening' | 'specific' | 'anytime' | 'lunch';
  specificTime?: string; // '07:30' format
  isDaily: boolean; // shortcut for all 7 days
}

export interface EnhancedHabitData {
  description?: string;
  category?: string; // HabitCategory
  duration?: number; // minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  timeRange?: { start: string; end: string };
}

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
    CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY NOT NULL, createdAt INTEGER NOT NULL, mood TEXT, text TEXT NOT NULL, type TEXT DEFAULT 'free_journal', voiceRecordingUri TEXT, habitId TEXT);
    CREATE TABLE IF NOT EXISTS goal_meta (goalId TEXT PRIMARY KEY NOT NULL, why_text TEXT, why_audio_uri TEXT, obstacles_json TEXT);
    CREATE TABLE IF NOT EXISTS habit_completions (id TEXT PRIMARY KEY NOT NULL, habitId TEXT NOT NULL, completedAt INTEGER NOT NULL, dateKey TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_usage (id TEXT PRIMARY KEY NOT NULL, userId TEXT NOT NULL, date TEXT NOT NULL, usageCount INTEGER DEFAULT 1, createdAt INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habitId, dateKey);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(userId, date);
  `);
  
  // Migration: Make goalId nullable in existing habits table
  await migrateHabitsTable(database);
  
  // Migration: Add type column to existing entries table if missing
  await migrateEntriesTable(database);
  
  // Migration: Add scheduling columns to habits table
  await migrateHabitsSchedulingInternal(database);
  
  // Migration: Add enhanced habit features
  await migrateHabitsEnhancedFeatures(database);
  
  // Migration: Convert ciphertext to plain text
  await migrateToPlainText(database);

  // Migration: Remove legacy ciphertext schema (recreate table without NOT NULL ciphertext)
  await migrateRemoveLegacyCiphertext(database);
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

async function migrateHabitsSchedulingInternal(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if habits table has the new scheduling columns
    const tableInfo = await database.getAllAsync("PRAGMA table_info(habits)");
    const daysOfWeekColumn = tableInfo.find((col: any) => col.name === 'daysOfWeek');
    const timeTypeColumn = tableInfo.find((col: any) => col.name === 'timeType');
    const specificTimeColumn = tableInfo.find((col: any) => col.name === 'specificTime');
    const isDailyColumn = tableInfo.find((col: any) => col.name === 'isDaily');
    
    // Add missing scheduling columns
    if (!daysOfWeekColumn) {
      console.log('Adding daysOfWeek column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN daysOfWeek TEXT DEFAULT '[]';
      `);
    }
    
    if (!timeTypeColumn) {
      console.log('Adding timeType column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN timeType TEXT DEFAULT 'anytime';
      `);
    }
    
    if (!specificTimeColumn) {
      console.log('Adding specificTime column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN specificTime TEXT;
      `);
    }
    
    if (!isDailyColumn) {
      console.log('Adding isDaily column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN isDaily INTEGER DEFAULT 1;
      `);
    }
    
    console.log('Habits scheduling migration completed successfully');
    
  } catch (error) {
    console.error('Error during habits scheduling migration:', error);
    // Don't throw - continue with app initialization
  }
}

async function migrateHabitsEnhancedFeatures(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if habits table has the new enhanced feature columns
    const tableInfo = await database.getAllAsync("PRAGMA table_info(habits)");
    const descriptionColumn = tableInfo.find((col: any) => col.name === 'description');
    const categoryColumn = tableInfo.find((col: any) => col.name === 'category');
    const durationColumn = tableInfo.find((col: any) => col.name === 'duration');
    const difficultyColumn = tableInfo.find((col: any) => col.name === 'difficulty');
    const timeRangeColumn = tableInfo.find((col: any) => col.name === 'timeRange');
    
    // Add missing enhanced feature columns
    if (!descriptionColumn) {
      console.log('Adding description column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN description TEXT;
      `);
    }
    
    if (!categoryColumn) {
      console.log('Adding category column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN category TEXT;
      `);
    }
    
    if (!durationColumn) {
      console.log('Adding duration column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN duration INTEGER DEFAULT 15;
      `);
    }
    
    if (!difficultyColumn) {
      console.log('Adding difficulty column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN difficulty TEXT DEFAULT 'medium';
      `);
    }
    
    if (!timeRangeColumn) {
      console.log('Adding timeRange column to habits table...');
      await database.execAsync(`
        ALTER TABLE habits ADD COLUMN timeRange TEXT;
      `);
    }
    
    console.log('Habits enhanced features migration completed successfully');
    
  } catch (error) {
    console.error('Error during habits enhanced features migration:', error);
    // Don't throw - continue with app initialization
  }
}

async function migrateToPlainText(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Check if entries table has ciphertext column
    const tableInfo = await database.getAllAsync("PRAGMA table_info(entries)");
    const ciphertextColumn = tableInfo.find((col: any) => col.name === 'ciphertext');
    const textColumn = tableInfo.find((col: any) => col.name === 'text');
    
    if (ciphertextColumn && !textColumn) {
      console.log('Migrating entries table from ciphertext to plain text schema...');
      
      await database.execAsync(`
        BEGIN TRANSACTION;
        
        -- Create new entries table with plain text schema
        CREATE TABLE entries_new (
          id TEXT PRIMARY KEY NOT NULL, 
          createdAt INTEGER NOT NULL, 
          mood TEXT, 
          text TEXT NOT NULL, 
          type TEXT DEFAULT 'free_journal', 
          voiceRecordingUri TEXT, 
          habitId TEXT
        );
        
        -- Copy existing data from old table to new table
        -- Use placeholder text for encrypted entries since we can't decrypt them
        INSERT INTO entries_new (id, createdAt, mood, text, type, voiceRecordingUri, habitId)
        SELECT 
          id, 
          createdAt, 
          mood, 
          '[Migrated entry - original was encrypted]' as text,
          COALESCE(type, 'free_journal') as type,
          voiceRecordingUri, 
          habitId 
        FROM entries;
        
        -- Drop the old table
        DROP TABLE entries;
        
        -- Rename new table to replace old one
        ALTER TABLE entries_new RENAME TO entries;
        
        COMMIT;
      `);
      
      console.log('Successfully migrated entries table to plain text schema');
      
    } else if (!textColumn) {
      // If neither column exists, add text column
      console.log('Adding text column to entries table...');
      await database.execAsync(`
        ALTER TABLE entries ADD COLUMN text TEXT NOT NULL DEFAULT '';
      `);
    }
    
  } catch (error) {
    console.error('Error during plain text migration:', error);
    // Rollback transaction if it was started
    try {
      await database.execAsync('ROLLBACK;');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    // Don't throw - continue with app initialization
  }
}

// Some older schemas still have a NOT NULL ciphertext column on entries.
// Since we now store journal content in the `text` column, new inserts fail
// with "NOT NULL constraint failed: entries.ciphertext" on those databases.
// This migration recreates the table without the legacy ciphertext column and
// preserves all existing data.
async function migrateRemoveLegacyCiphertext(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const tableInfo = await database.getAllAsync("PRAGMA table_info(entries)");
    const ciphertextCol = tableInfo.find((col: any) => col.name === 'ciphertext');
    // Only migrate if ciphertext column is present (regardless of NOT NULL flag)
    if (!ciphertextCol) return;

    console.log('[DB] Recreating entries table to drop legacy ciphertext column...');

    await database.execAsync(`
      BEGIN TRANSACTION;

      CREATE TABLE entries_new (
        id TEXT PRIMARY KEY NOT NULL,
        createdAt INTEGER NOT NULL,
        mood TEXT,
        text TEXT NOT NULL,
        type TEXT DEFAULT 'free_journal',
        voiceRecordingUri TEXT,
        habitId TEXT
      );

      INSERT INTO entries_new (id, createdAt, mood, text, type, voiceRecordingUri, habitId)
      SELECT 
        id,
        createdAt,
        mood,
        COALESCE(text, CASE WHEN ciphertext IS NOT NULL THEN '[Migrated entry]' ELSE '' END) AS text,
        COALESCE(type, 'free_journal') AS type,
        voiceRecordingUri,
        habitId
      FROM entries;

      DROP TABLE entries;
      ALTER TABLE entries_new RENAME TO entries;

      COMMIT;
    `);

    console.log('[DB] Entries table successfully recreated without ciphertext');
  } catch (error) {
    console.error('[DB] Error while recreating entries table to drop ciphertext:', error);
    // Don't throw — continue app initialization to avoid blocking the app.
  }
}

// Exported wrapper for the migration function
export async function migrateHabitsScheduling(): Promise<void> {
  const database = await getDbAsync();
  return migrateHabitsSchedulingInternal(database);
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

export async function upsertHabit(
  goalId: string | null, 
  title: string, 
  schedule?: HabitSchedule,
  enhancedData?: EnhancedHabitData
): Promise<string> {
  const database = await getDbAsync();
  const id = generateId();
  
  // Use default schedule if none provided (daily, anytime)
  const defaultSchedule: HabitSchedule = {
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    timeType: 'anytime',
    isDaily: true
  };
  
  const habitSchedule = schedule || defaultSchedule;
  
  // Enhanced data with defaults
  const description = enhancedData?.description || null;
  const category = enhancedData?.category || null;
  const duration = enhancedData?.duration || 15;
  const difficulty = enhancedData?.difficulty || 'medium';
  const timeRange = enhancedData?.timeRange ? JSON.stringify(enhancedData.timeRange) : null;
  
  await runAsync(database, 
    `INSERT INTO habits (
      id, goalId, title, daysOfWeek, timeType, specificTime, isDaily,
      description, category, duration, difficulty, timeRange
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [
      id, 
      goalId, 
      title, 
      JSON.stringify(habitSchedule.daysOfWeek),
      habitSchedule.timeType,
      habitSchedule.specificTime || null,
      habitSchedule.isDaily ? 1 : 0,
      description,
      category,
      duration,
      difficulty,
      timeRange
    ]
  );
  return id;
}

export async function insertEntry({ id, text, mood, createdAt, type, voiceRecordingUri, habitId }: Entry): Promise<void> {
  const database = await getDbAsync();
  await runAsync(database, 'INSERT INTO entries (id, createdAt, mood, text, type, voiceRecordingUri, habitId) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    id, 
    createdAt, 
    mood ?? null, 
    text, 
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

export interface HabitWithSchedule {
  id: string;
  title: string;
  goalId: string | null;
  daysOfWeek: string[];
  timeType: 'morning' | 'afternoon' | 'evening' | 'specific' | 'anytime' | 'lunch';
  specificTime?: string;
  isDaily: boolean;
  // Enhanced features
  description?: string;
  category?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeRange?: { start: string; end: string };
}

export async function listHabitsWithScheduleByGoal(goalId: string): Promise<HabitWithSchedule[]> {
  try {
    const database = await getDbAsync();
    const rows = await getAllAsync<any>(database, 
      `SELECT id, title, goalId, daysOfWeek, timeType, specificTime, isDaily,
              description, category, duration, difficulty, timeRange 
       FROM habits WHERE goalId = ? ORDER BY rowid ASC`, 
      [goalId]
    );
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      goalId: row.goalId,
      daysOfWeek: row.daysOfWeek ? JSON.parse(row.daysOfWeek) : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: row.timeType || 'anytime',
      specificTime: row.specificTime,
      isDaily: Boolean(row.isDaily),
      description: row.description,
      category: row.category,
      duration: row.duration || 15,
      difficulty: row.difficulty || 'medium',
      timeRange: row.timeRange ? JSON.parse(row.timeRange) : undefined
    }));
  } catch (error) {
    console.error('Error loading habits with schedule for goal:', error);
    return [];
  }
}

export async function listAllHabitsWithSchedule(): Promise<HabitWithSchedule[]> {
  try {
    const database = await getDbAsync();
    const rows = await getAllAsync<any>(database, 
      `SELECT id, title, goalId, daysOfWeek, timeType, specificTime, isDaily,
              description, category, duration, difficulty, timeRange 
       FROM habits ORDER BY rowid ASC`
    );
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      goalId: row.goalId,
      daysOfWeek: row.daysOfWeek ? JSON.parse(row.daysOfWeek) : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      timeType: row.timeType || 'anytime',
      specificTime: row.specificTime,
      isDaily: Boolean(row.isDaily),
      description: row.description,
      category: row.category,
      duration: row.duration || 15,
      difficulty: row.difficulty || 'medium',
      timeRange: row.timeRange ? JSON.parse(row.timeRange) : undefined
    }));
  } catch (error) {
    console.error('Error loading all habits with schedule:', error);
    return [];
  }
}

// Utility function to get today's day string
export function getTodayDayString(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

// Filter habits for today's schedule
export function filterHabitsForToday(habits: HabitWithSchedule[]): HabitWithSchedule[] {
  const today = getTodayDayString();
  
  return habits.filter(habit => {
    if (habit.isDaily) return true;
    return habit.daysOfWeek.includes(today);
  });
}

// Sort habits by time of day
export function sortHabitsByTime(habits: HabitWithSchedule[]): HabitWithSchedule[] {
  const timeOrder = { morning: 1, afternoon: 2, evening: 3, specific: 4, anytime: 5 };
  
  return habits.sort((a, b) => {
    // First sort by time type
    const aOrder = timeOrder[a.timeType];
    const bOrder = timeOrder[b.timeType];
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // If both have specific times, sort by time
    if (a.timeType === 'specific' && b.timeType === 'specific' && a.specificTime && b.specificTime) {
      return a.specificTime.localeCompare(b.specificTime);
    }
    
    // Otherwise maintain original order
    return 0;
  });
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

export async function deleteEntry(entryId: string): Promise<void> {
  const database = await getDbAsync();
  await runAsync(database, 'DELETE FROM entries WHERE id = ?', [entryId]);
}

export async function listEntries(): Promise<Entry[]> {
  try {
    const database = await getDbAsync();
    const rows = await getAllAsync<{ 
      id: string; 
      createdAt: number; 
      mood?: Mood; 
      text: string; 
      type?: EntryType; 
      voiceRecordingUri?: string; 
      habitId?: string; 
    }>(database, 'SELECT id, createdAt, mood, text, type, voiceRecordingUri, habitId FROM entries ORDER BY createdAt DESC');
    
    return rows.map((r) => ({
      id: r.id, 
      text: r.text, 
      mood: r.mood, 
      createdAt: r.createdAt,
      type: r.type ?? 'free_journal',
      voiceRecordingUri: r.voiceRecordingUri,
      habitId: r.habitId
    }));
  } catch (error) {
    console.error('Error loading entries:', error);
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

// Extended habit interface for scheduling
export interface HabitWithSchedule {
  id: string;
  title: string;
  goalId: string | null;
  daysOfWeek: string[];
  timeType: 'morning' | 'afternoon' | 'evening' | 'specific' | 'anytime';
  specificTime?: string;
  isDaily: boolean;
  schedule?: HabitSchedule;
}

// List habits with scheduling info for a specific goal
export async function listScheduledHabitsForGoal(goalId: string): Promise<HabitWithSchedule[]> {
  const database = await getDbAsync();
  const rows = await getAllAsync<{
    id: string; 
    title: string; 
    goalId: string | null; 
    daysOfWeek: string; 
    timeType: string; 
    specificTime: string | null;
    isDaily: number;
    description: string | null;
    category: string | null;
    duration: number | null;
    difficulty: string | null;
    timeRange: string | null;
  }>(database, `SELECT id, title, goalId, daysOfWeek, timeType, specificTime, isDaily,
                       description, category, duration, difficulty, timeRange 
                FROM habits WHERE goalId = ?`, [goalId]);
  
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    goalId: row.goalId,
    daysOfWeek: JSON.parse(row.daysOfWeek || '[]'),
    timeType: row.timeType as any,
    specificTime: row.specificTime || undefined,
    isDaily: Boolean(row.isDaily),
    description: row.description || undefined,
    category: row.category || undefined,
    duration: row.duration || 15,
    difficulty: (row.difficulty as any) || 'medium',
    timeRange: row.timeRange ? JSON.parse(row.timeRange) : undefined
  }));
}

// List standalone habits with scheduling info
export async function listScheduledStandaloneHabits(): Promise<HabitWithSchedule[]> {
  const database = await getDbAsync();
  const rows = await getAllAsync<{
    id: string;
    title: string;
    goalId: string | null;
    daysOfWeek: string;
    timeType: string;
    specificTime: string | null;
    isDaily: number;
    description: string | null;
    category: string | null;
    duration: number | null;
    difficulty: string | null;
    timeRange: string | null;
  }>(database, `SELECT id, title, goalId, daysOfWeek, timeType, specificTime, isDaily,
                       description, category, duration, difficulty, timeRange
                FROM habits WHERE goalId IS NULL`);

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    goalId: row.goalId,
    daysOfWeek: JSON.parse(row.daysOfWeek || '[]'),
    timeType: row.timeType as any,
    specificTime: row.specificTime || undefined,
    isDaily: Boolean(row.isDaily),
    description: row.description || undefined,
    category: row.category || undefined,
    duration: row.duration || 15,
    difficulty: (row.difficulty as any) || 'medium',
    timeRange: row.timeRange ? JSON.parse(row.timeRange) : undefined
  }));
}

// AI Usage tracking functions
function getCurrentDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

export async function checkAIUsageRemaining(userId: string): Promise<number> {
  const database = await getDbAsync();
  const dailyLimit = 10;
  const dateKey = getCurrentDateKey();

  try {
    const rows = await getAllAsync<{ usageCount: number }>(
      database,
      'SELECT usageCount FROM ai_usage WHERE userId = ? AND date = ? LIMIT 1',
      [userId, dateKey]
    );

    if (rows.length === 0) {
      return dailyLimit; // No usage yet today
    }

    return Math.max(0, dailyLimit - rows[0].usageCount);
  } catch (error) {
    console.error('Error checking AI usage:', error);
    return dailyLimit; // Graceful fallback
  }
}

export async function incrementAIUsage(userId: string): Promise<void> {
  const database = await getDbAsync();
  const dateKey = getCurrentDateKey();
  const id = generateId();
  const createdAt = Date.now();

  try {
    await runAsync(database, `
      INSERT INTO ai_usage (id, userId, date, usageCount, createdAt)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(userId, date) DO UPDATE SET
        usageCount = usageCount + 1
    `, [id, userId, dateKey, createdAt]);
  } catch (error) {
    console.error('Error incrementing AI usage:', error);
    // Don't throw - graceful degradation
  }
}

export async function getAIUsageStats(userId: string, days: number = 7): Promise<Array<{ date: string; count: number }>> {
  const database = await getDbAsync();

  try {
    const rows = await getAllAsync<{ date: string; usageCount: number }>(
      database,
      `SELECT date, usageCount FROM ai_usage
       WHERE userId = ?
       ORDER BY date DESC
       LIMIT ?`,
      [userId, days]
    );

    return rows.map(row => ({
      date: row.date,
      count: row.usageCount
    }));
  } catch (error) {
    console.error('Error getting AI usage stats:', error);
    return [];
  }
}

