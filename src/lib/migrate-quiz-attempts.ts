// Migration to ensure strict quiz attempt tracking
import { supabase } from './supabaseClient';

export async function migrateQuizAttempts() {
  console.log('Starting quiz attempts migration...');
  
  try {
    // 1. Add is_started column if it doesn't exist
    console.log('Adding is_started column...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'is_started'
          ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN is_started BOOLEAN DEFAULT FALSE;
            UPDATE quiz_attempts SET is_started = TRUE WHERE started_at IS NOT NULL;
          END IF;
        END $$;
      `
    });
    
    if (addColumnError) {
      console.warn('Column addition failed (may already exist):', addColumnError.message);
    }
    
    // 2. Clean up duplicate attempts (keep the latest one for each user/quiz)
    console.log('Cleaning up duplicate attempts...');
    const { error: cleanupError } = await supabase.rpc('exec_sql', {
      sql: `
        WITH duplicate_attempts AS (
          SELECT 
            quiz_id,
            user_id,
            MAX(created_at) as latest_attempt
          FROM quiz_attempts 
          GROUP BY quiz_id, user_id 
          HAVING COUNT(*) > 1
        ),
        attempts_to_delete AS (
          SELECT qa.id
          FROM quiz_attempts qa
          INNER JOIN duplicate_attempts da ON qa.quiz_id = da.quiz_id AND qa.user_id = da.user_id
          WHERE qa.created_at < da.latest_attempt
        )
        DELETE FROM quiz_attempts WHERE id IN (SELECT id FROM attempts_to_delete);
      `
    });
    
    if (cleanupError) {
      console.warn('Cleanup failed:', cleanupError.message);
    }
    
    // 3. Create unique constraint if it doesn't exist
    console.log('Ensuring unique constraint exists...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          -- Drop existing constraint if it exists with different names
          BEGIN
            ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_user_id_key;
          EXCEPTION
            WHEN undefined_object THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_unique_user_quiz;
          EXCEPTION
            WHEN undefined_object THEN NULL;
          END;
          
          -- Create the constraint
          ALTER TABLE quiz_attempts 
          ADD CONSTRAINT quiz_attempts_quiz_id_user_id_key 
          UNIQUE (quiz_id, user_id);
        END $$;
      `
    });
    
    if (constraintError) {
      console.warn('Constraint creation failed (may already exist):', constraintError.message);
    }
    
    // 4. Create helpful indexes
    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(is_completed);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_started ON quiz_attempts(is_started);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_completed ON quiz_attempts(user_id, is_completed);
      `
    });
    
    if (indexError) {
      console.warn('Index creation failed:', indexError.message);
    }
    
    // 5. Verify the migration
    console.log('Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('quiz_attempts')
      .select('id, quiz_id, user_id, is_started, is_completed')
      .limit(1);
      
    if (verifyError) {
      console.error('Verification failed:', verifyError.message);
    } else {
      console.log('Migration completed successfully!');
      console.log('Sample record:', verifyData?.[0]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}

// Function to check if user has attempted a quiz (any attempt)
export async function hasUserAttemptedQuiz(userId: string, quizId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .limit(1);
      
    if (error) {
      console.error('Error checking quiz attempt:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasUserAttemptedQuiz:', error);
    return false;
  }
} 