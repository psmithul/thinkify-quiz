import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { withSecurity, SecurityUtils } from '@/lib/security'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function handler(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' }, 
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Add category column to quizzes table
    const { error: categoryError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS category TEXT;'
    })

    if (categoryError) {
      console.error('Error adding category column:', categoryError)
    }

    // Add time_limit_minutes column
    const { error: timeLimitError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;'
    })

    if (timeLimitError) {
      console.error('Error adding time_limit_minutes column:', timeLimitError)
    }

    // Add tier_thresholds column
    const { error: tierError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS tier_thresholds JSONB;'
    })

    if (tierError) {
      console.error('Error adding tier_thresholds column:', tierError)
    }

    // Update existing quizzes with default category
    const { error: updateError } = await supabase
      .from('quizzes')
      .update({ category: 'General' })
      .is('category', null)

    if (updateError) {
      console.error('Error updating default categories:', updateError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error }, 
      { status: 500 }
    )
  }
}

// Apply security middleware with rate limiting
export const POST = withSecurity(handler, {
  rateLimit: { maxRequests: 5, windowMs: 300000 } // 5 requests per 5 minutes
}); 