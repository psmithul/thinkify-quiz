// Utility functions for managing quiz retake requests
import { supabase } from './supabaseClient';

export type RetakeRequest = {
  id: string;
  user_id: string;
  quiz_id: string;
  creator_id: string;
  reason: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'denied';
  response_message?: string;
  responded_by?: string;
  responded_at?: string;
  additional_attempts_granted: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    full_name?: string;
    email: string;
  };
  quiz?: {
    title: string;
  };
};

// Check if user has any approved retake requests for a quiz
export async function hasApprovedRetakeRequest(userId: string, quizId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('retake_requests')
      .select('id, additional_attempts_granted')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('status', 'approved')
      .limit(1);
      
    if (error) {
      console.error('Error checking retake requests:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasApprovedRetakeRequest:', error);
    return false;
  }
}

// Check if user has a pending retake request for a quiz
export async function hasPendingRetakeRequest(userId: string, quizId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('retake_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('status', 'pending')
      .limit(1);
      
    if (error) {
      console.error('Error checking pending requests:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasPendingRetakeRequest:', error);
    return false;
  }
}

// Create a new retake request
export async function createRetakeRequest(
  userId: string, 
  quizId: string, 
  creatorId: string, 
  reason: string
): Promise<{ success: boolean; error?: string; data?: RetakeRequest }> {
  try {
    // Check if there's already a pending request
    const hasPending = await hasPendingRetakeRequest(userId, quizId);
    if (hasPending) {
      return { success: false, error: 'You already have a pending retake request for this quiz.' };
    }
    
    const { data, error } = await supabase
      .from('retake_requests')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        creator_id: creatorId,
        reason: reason.trim(),
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating retake request:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in createRetakeRequest:', error);
    return { success: false, error: 'Failed to create retake request.' };
  }
}

// Get retake requests for a creator (pending requests for their quizzes)
export async function getCreatorRetakeRequests(creatorId: string): Promise<RetakeRequest[]> {
  try {
    const { data, error } = await supabase
      .from('retake_requests')
      .select(`
        *,
        users!user_id (
          full_name,
          email
        ),
        quizzes!quiz_id (
          title
        )
      `)
      .eq('creator_id', creatorId)
      .order('requested_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching creator retake requests:', error);
      return [];
    }
    
    return data.map(request => ({
      ...request,
      user: (request as any).users,
      quiz: (request as any).quizzes
    })) || [];
  } catch (error) {
    console.error('Error in getCreatorRetakeRequests:', error);
    return [];
  }
}

// Get user's retake requests
export async function getUserRetakeRequests(userId: string): Promise<RetakeRequest[]> {
  try {
    const { data, error } = await supabase
      .from('retake_requests')
      .select(`
        *,
        quizzes!quiz_id (
          title
        )
      `)
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching user retake requests:', error);
      return [];
    }
    
    return data.map(request => ({
      ...request,
      quiz: (request as any).quizzes
    })) || [];
  } catch (error) {
    console.error('Error in getUserRetakeRequests:', error);
    return [];
  }
}

// Respond to a retake request (approve/deny)
export async function respondToRetakeRequest(
  requestId: string,
  status: 'approved' | 'denied',
  responseMessage: string,
  respondedBy: string,
  additionalAttempts: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('retake_requests')
      .update({
        status,
        response_message: responseMessage.trim(),
        responded_by: respondedBy,
        responded_at: new Date().toISOString(),
        additional_attempts_granted: status === 'approved' ? additionalAttempts : 0
      })
      .eq('id', requestId);
      
    if (error) {
      console.error('Error responding to retake request:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in respondToRetakeRequest:', error);
    return { success: false, error: 'Failed to respond to retake request.' };
  }
}

// Check if user can attempt quiz (considering retake approvals)
export async function canUserAttemptQuiz(userId: string, quizId: string): Promise<{
  canAttempt: boolean;
  reason: string;
  hasRequest?: boolean;
  requestStatus?: string;
}> {
  try {
    // Check if user has any quiz attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('id, is_completed')
      .eq('user_id', userId)
      .eq('quiz_id', quizId);
      
    if (attemptsError) {
      console.error('Error checking attempts:', attemptsError);
      return { canAttempt: false, reason: 'Error checking attempt history.' };
    }
    
    // If no attempts, user can attempt
    if (!attempts || attempts.length === 0) {
      return { canAttempt: true, reason: 'First attempt allowed.' };
    }
    
    // User has attempted before - check for approved retake requests
    const hasApproved = await hasApprovedRetakeRequest(userId, quizId);
    if (hasApproved) {
      return { canAttempt: true, reason: 'Retake request approved.' };
    }
    
    // Check if there's a pending request
    const hasPending = await hasPendingRetakeRequest(userId, quizId);
    if (hasPending) {
      return { 
        canAttempt: false, 
        reason: 'Retake request pending approval.',
        hasRequest: true,
        requestStatus: 'pending'
      };
    }
    
    // Check if there's a denied request
    const { data: deniedRequests } = await supabase
      .from('retake_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('status', 'denied')
      .limit(1);
      
    if (deniedRequests && deniedRequests.length > 0) {
      return { 
        canAttempt: false, 
        reason: 'Previous retake request was denied.',
        hasRequest: true,
        requestStatus: 'denied'
      };
    }
    
    // User has attempted but no approved retake - can request
    return { 
      canAttempt: false, 
      reason: 'Quiz already attempted. You can request a retake.',
      hasRequest: false
    };
    
  } catch (error) {
    console.error('Error in canUserAttemptQuiz:', error);
    return { canAttempt: false, reason: 'Error checking quiz access.' };
  }
} 