import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withSecurity, SecurityUtils } from '@/lib/security';

async function handler(request: NextRequest, { params }: { params: { quiz_id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { quiz_id } = params;

  try {
    // Validate UUID format
    if (!SecurityUtils.isValidUUID(quiz_id)) {
      return NextResponse.json(
        { error: 'Invalid quiz ID format' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role || 'user';

    if (request.method === 'GET') {
      // Get quiz details
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quiz_id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      // Check permissions - only creator or admin can view quiz management details
      if (quiz.creator_id !== session.user.id && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 403 }
        );
      }

      return NextResponse.json({ quiz });
    }

    if (request.method === 'PUT') {
      // Update quiz
      const body = await request.json();
      const sanitizedBody = SecurityUtils.sanitizeInput(body);

      // Validate quiz data
      const validation = SecurityUtils.validateQuizData(sanitizedBody);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', errors: validation.errors },
          { status: 400 }
        );
      }

      // Check quiz ownership
      const { data: quiz, error: fetchError } = await supabase
        .from('quizzes')
        .select('creator_id')
        .eq('id', quiz_id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      if (quiz.creator_id !== session.user.id && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to update this quiz' },
          { status: 403 }
        );
      }

      // Update quiz
      const { data: updatedQuiz, error: updateError } = await supabase
        .from('quizzes')
        .update(sanitizedBody)
        .eq('id', quiz_id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update quiz' },
          { status: 500 }
        );
      }

      return NextResponse.json({ quiz: updatedQuiz });
    }

    if (request.method === 'DELETE') {
      // Delete quiz (only creator or admin)
      const { data: quiz, error: fetchError } = await supabase
        .from('quizzes')
        .select('creator_id')
        .eq('id', quiz_id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      if (quiz.creator_id !== session.user.id && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to delete this quiz' },
          { status: 403 }
        );
      }

      // Delete quiz (cascading deletes will handle related records)
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz_id);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete quiz' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Quiz deleted successfully' });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );

  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply security middleware
export const GET = withSecurity(handler, {
  rateLimit: { maxRequests: 60, windowMs: 60000 }
});

export const PUT = withSecurity(handler, {
  rateLimit: { maxRequests: 10, windowMs: 60000 }
});

export const DELETE = withSecurity(handler, {
  rateLimit: { maxRequests: 5, windowMs: 300000 }
}); 