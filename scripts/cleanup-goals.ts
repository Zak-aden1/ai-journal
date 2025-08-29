import { listGoals } from '@/lib/db';
import { useAppStore } from '@/stores/app';

// Known dummy goal patterns from demoData.ts
const DUMMY_GOAL_PATTERNS = [
  /^demo-/i,  // IDs starting with 'demo-'
  'Run a 5K Marathon',
  'Daily Mindfulness', 
  'Learn Spanish',
  'Creative Writing'
];

// Function to check if a goal is a dummy/demo goal
function isDummyGoal(goalId: string, goalTitle: string): boolean {
  return DUMMY_GOAL_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(goalId);
    }
    return goalTitle === pattern;
  });
}

// Main cleanup function
export async function cleanupRealGoals(): Promise<void> {
  try {
    console.log('🧹 Starting goal cleanup...');
    
    // Get all goals from database
    const allGoals = await listGoals();
    console.log(`📊 Found ${allGoals.length} total goals`);
    
    // Identify real vs dummy goals
    const realGoals = allGoals.filter(goal => 
      !isDummyGoal(goal.id, goal.title)
    );
    
    const dummyGoals = allGoals.filter(goal => 
      isDummyGoal(goal.id, goal.title)
    );
    
    console.log(`🎯 Real goals to delete: ${realGoals.length}`);
    console.log(`🎭 Dummy goals to keep: ${dummyGoals.length}`);
    
    if (realGoals.length === 0) {
      console.log('✅ No real goals found to delete!');
      return;
    }
    
    // Log what we're about to delete
    console.log('\n🗑️  Goals to be deleted:');
    realGoals.forEach(goal => {
      console.log(`  - "${goal.title}" (${goal.id})`);
    });
    
    console.log('\n🔒 Goals to keep (dummy):');
    dummyGoals.forEach(goal => {
      console.log(`  - "${goal.title}" (${goal.id})`);
    });
    
    // Get the store instance and delete real goals
    const { deleteGoal } = useAppStore.getState();
    
    for (const goal of realGoals) {
      console.log(`🗑️  Deleting: "${goal.title}"`);
      await deleteGoal(goal.id);
    }
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log(`🎉 Deleted ${realGoals.length} real goals, kept ${dummyGoals.length} dummy goals`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// If running this script directly
if (require.main === module) {
  cleanupRealGoals()
    .then(() => {
      console.log('👍 Goal cleanup finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}