-- Create retake_requests table for managing quiz retake permissions
-- This allows users to request additional attempts and creators/admins to approve them

CREATE TABLE IF NOT EXISTS retake_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Quiz creator
  
  -- Request details
  reason TEXT NOT NULL, -- User's reason for requesting retake
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Admin/Creator response
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  response_message TEXT, -- Admin's response message
  responded_by UUID REFERENCES users(id), -- Who approved/denied
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  additional_attempts_granted INTEGER DEFAULT 1, -- How many extra attempts to grant
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, quiz_id, status) -- One pending request per user per quiz
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_retake_requests_user_quiz ON retake_requests(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_retake_requests_creator ON retake_requests(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_retake_requests_status ON retake_requests(status);
CREATE INDEX IF NOT EXISTS idx_retake_requests_quiz ON retake_requests(quiz_id, status);

-- Add RLS policies
ALTER TABLE retake_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own retake requests" ON retake_requests
  FOR SELECT USING (user_id = auth.uid());

-- Users can create retake requests for themselves
CREATE POLICY "Users can create retake requests" ON retake_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Creators can view requests for their quizzes
CREATE POLICY "Creators can view retake requests for their quizzes" ON retake_requests
  FOR SELECT USING (
    creator_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM quizzes q 
      WHERE q.id = retake_requests.quiz_id 
      AND q.creator_id = auth.uid()
    )
  );

-- Creators can update requests for their quizzes  
CREATE POLICY "Creators can respond to retake requests" ON retake_requests
  FOR UPDATE USING (
    creator_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM quizzes q 
      WHERE q.id = retake_requests.quiz_id 
      AND q.creator_id = auth.uid()
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_retake_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_retake_requests_updated_at
  BEFORE UPDATE ON retake_requests
  FOR EACH ROW EXECUTE FUNCTION update_retake_requests_updated_at(); 