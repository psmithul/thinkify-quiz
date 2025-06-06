# Triplebyte Quiz Setup Guide

This guide will help you set up the Triplebyte Programming Assessment quiz on your Thinkify Quiz platform.

## 🚀 Quick Setup

### Prerequisites
1. **Node.js** (version 18 or higher)
2. **Supabase Account** (for database)
3. **Vercel Account** (for deployment - optional)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# LinkedIn OAuth (Optional)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

### Step 3: Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and keys

2. **Run Database Setup**:
   ```bash
   npm run dev
   ```
   Then navigate to: `http://localhost:3000/admin/setup-database`

   Or manually run the SQL setup:
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Run the contents of `docs/database/complete_setup.sql`

### Step 4: Create the Triplebyte Quiz

1. **Run the Triplebyte Quiz Setup**:
   - In your Supabase SQL Editor, run:
   ```sql
   -- First, create a test user if you don't have one
   INSERT INTO users (id, email, name, role, created_at, updated_at)
   VALUES (
       gen_random_uuid(),
       'admin@example.com',
       'Quiz Admin',
       'creator',
       NOW(),
       NOW()
   );
   ```

2. **Run the Triplebyte Quiz Script**:
   - Execute the contents of `triplebyte_quiz_setup.sql` in Supabase SQL Editor

### Step 5: Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your quiz platform with the new Triplebyte quiz!

## 🎯 Triplebyte Quiz Features

The created quiz includes:

- **15 Programming Questions** covering:
  - JavaScript fundamentals (closures, hoisting, async/await)
  - Algorithm analysis and time complexity
  - Data structures (arrays, objects, sets)
  - Modern JavaScript features (arrow functions, destructuring)
  - Database concepts (SQL JOINs)

- **45-minute Time Limit** (typical for technical assessments)
- **Multiple Choice Format** (4 options per question)
- **Instant Feedback** with explanations
- **Professional Styling** matching Triplebyte's assessment format
- **🆕 Fullscreen Mode** - Quiz automatically enters fullscreen for security
- **🆕 Code Formatting** - Proper syntax highlighting for code blocks
- **🆕 Exit Protection** - Quiz auto-submits if fullscreen is exited

## 📊 Quiz Content Overview

### JavaScript Concepts (Questions 1-10)
- Closures and scope
- Event loop and asynchronous behavior
- Array methods and functional programming
- Object property access
- Variable hoisting
- Arrow functions and `this` binding
- Shallow vs deep copying
- Prototype inheritance
- Type coercion

### Computer Science Fundamentals (Questions 11-15)
- Algorithm time complexity analysis
- Data structure selection (LRU cache implementation)
- Recursion patterns
- Binary search complexity
- SQL join operations

## 🔧 Customization Options

### Adding Your Own Questions from the Triplebyte Screenshots

If you want to add specific questions from your Triplebyte screenshot folder:

1. **Manual Addition via Admin Interface**:
   - Login as an admin/creator
   - Navigate to `/creator/quiz/[quiz_id]/edit`
   - Add questions manually using the interface

2. **Bulk Import via SQL**:
   - Modify the `triplebyte_quiz_setup.sql` file
   - Add questions in the same format as the existing ones

### Updating Quiz Settings

You can modify the quiz by updating these SQL values:

```sql
-- Change time limit (in minutes)
UPDATE quizzes SET time_limit_minutes = 60 WHERE title = 'Triplebyte Programming Assessment';

-- Change difficulty or category
UPDATE quizzes SET category = 'Advanced Programming' WHERE title = 'Triplebyte Programming Assessment';

-- Add tier thresholds for company filtering
UPDATE quizzes SET tier_thresholds = '{"tier1": 60, "tier2": 70, "tier3": 80, "tier4": 85, "tier5": 90}' 
WHERE title = 'Triplebyte Programming Assessment';
```

## 🎨 Processing Your Screenshot Images

Since you have screenshots from actual Triplebyte questions, here's how to add them:

### Option 1: Manual Transcription
1. Open each image from your `Triplebyte SS` folder
2. Transcribe the question text and options
3. Add them to the quiz using the admin interface

### Option 2: Update the SQL Script
1. Replace questions in `triplebyte_quiz_setup.sql` with your actual questions
2. Maintain the same format for questions and options
3. Re-run the SQL script

### Option 3: Create Additional Quiz
1. Create a second quiz called "Triplebyte Real Questions"
2. Use the same SQL pattern but with your transcribed questions

## 🚀 Deployment

### Deploy to Vercel

1. **Connect to Vercel**:
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set Environment Variables**:
   - Copy all variables from `.env.local` to Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain

3. **Update Database**:
   - Ensure your production Supabase is set up
   - Run the same SQL scripts in production

## 📱 Taking the Quiz

Once set up, users can:

1. **Browse Available Quizzes**: Visit `/browse`
2. **Take the Triplebyte Quiz**: Click on "Triplebyte Programming Assessment"
3. **View Results**: See immediate feedback and scoring
4. **Track Progress**: Return to see quiz history

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check your Supabase keys in `.env.local`
   - Ensure RLS policies are correctly set

2. **Quiz Not Showing**:
   - Verify the quiz is published (`is_published = true`)
   - Check if you have a creator user account

3. **Questions Not Loading**:
   - Check if foreign key relationships are intact
   - Verify quiz_questions and quiz_options were created correctly

### Support

If you need help:
1. Check the main `README.md` for general setup issues
2. Review the troubleshooting docs in the `docs/` folder
3. Check Supabase logs for database errors

## 🎉 Success!

You should now have a fully functional Triplebyte-style programming assessment quiz ready for candidates to take! 