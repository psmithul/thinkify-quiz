# Quiz Retake Request System

This system allows users to request additional attempts at quizzes and enables creators/admins to approve or deny these requests.

## Database Setup

Run the SQL script to create the retake_requests table:

```sql
-- Execute the contents of sql/create-retake-requests-table.sql in your database
```

Or copy and run the SQL from `sql/create-retake-requests-table.sql` in your Supabase SQL editor.

## Features

### For Users:
- When a user has already attempted a quiz, they see an option to request a retake
- Users can provide a reason for why they need another attempt
- Users can view the status of their requests (pending, approved, denied)
- If approved, users can take the quiz again

### For Creators/Admins:
- Access retake requests via the creator dashboard → "Retake Requests" button
- View all retake requests for their quizzes
- Approve or deny requests with custom response messages
- Set the number of additional attempts to grant (1, 2, 3, or 5)

## How It Works

1. **First Attempt**: Users can take a quiz normally
2. **Subsequent Access**: If user tries to access a quiz they've already attempted:
   - They see a message explaining they've already attempted it
   - Option to request a retake appears
3. **Request Process**: 
   - User fills out a reason for the retake request
   - Request is sent to the quiz creator
4. **Creator Review**:
   - Creator sees all pending requests in their dashboard
   - Can approve with custom message and number of additional attempts
   - Can deny with explanation
5. **User Notification**: User sees the status and can attempt quiz again if approved

## Security Features Maintained

- All existing security measures remain in place (fullscreen, tab switching detection, etc.)
- One-attempt policy is still enforced unless explicitly approved by creator
- Immediate attempt recording prevents manipulation
- Request system provides audit trail of all retake permissions

## Database Tables

### retake_requests
- Stores all retake requests with status tracking
- Links users, quizzes, and creators
- Includes approval workflow and response messages
- RLS policies ensure proper access control

## Usage Examples

### User requesting retake:
```javascript
import { createRetakeRequest } from '@/lib/retake-requests';

const result = await createRetakeRequest(
  userId,
  quizId, 
  creatorId,
  "I experienced technical issues during my first attempt"
);
```

### Creator approving request:
```javascript
import { respondToRetakeRequest } from '@/lib/retake-requests';

const result = await respondToRetakeRequest(
  requestId,
  'approved',
  'Approved due to technical difficulties. Please be careful with tab switching.',
  creatorId,
  1 // number of additional attempts
);
```

## Files Modified/Created

- `sql/create-retake-requests-table.sql` - Database schema
- `src/lib/retake-requests.ts` - Utility functions
- `src/app/creator/retake-requests/page.tsx` - Creator management interface
- `src/app/user/quiz/[quiz_id]/client.tsx` - Updated quiz interface
- `src/app/creator/dashboard/page.tsx` - Added retake requests button

This system provides flexibility while maintaining the security and integrity of the quiz platform. 