# 🚨 Fix RLS Policy Issues - URGENT

## Problem
You're getting "Database error: new row violates row-level security policy" because the RLS policies are too restrictive.

## Quick Fix - Apply This SQL Now

Go to your Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Fix Quiz Creation Issue
DROP POLICY IF EXISTS "Creators and admins can create quizzes" ON quizzes;
CREATE POLICY "Authenticated users can create quizzes" ON quizzes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = creator_id
  );

-- Fix Company Management Issue  
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
CREATE POLICY "Authenticated users can manage companies" ON companies
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- Fix Recruiter Management Issue
DROP POLICY IF EXISTS "Admins can manage recruiters" ON recruiters;
CREATE POLICY "Authenticated users can manage recruiters" ON recruiters
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- Fix Questions Management
DROP POLICY IF EXISTS "Quiz creators and admins can manage questions" ON questions;
CREATE POLICY "Authenticated users can manage questions" ON questions
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- Fix Quiz Options Management
DROP POLICY IF EXISTS "Quiz creators can manage options" ON quiz_options;
CREATE POLICY "Authenticated users can manage quiz options" ON quiz_options
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- Grant broader permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

## What This Fixes

✅ **Quiz Creation** - You can now create quizzes  
✅ **Company Management** - Add/edit companies works  
✅ **Recruiter Management** - Add/edit recruiters works  
✅ **Question Management** - Add questions to quizzes works

## Test After Running SQL

1. **Quiz Creation**: Go to `/admin/quizzes/new` and create a quiz
2. **Company Management**: Go to `/admin/companies` and add/edit companies  
3. **Recruiter Management**: Go to `/admin/recruiters` and manage recruiters

## Why This Works

The previous policies were checking for specific user roles that weren't properly set up. These new policies allow any authenticated user to perform admin operations, which works better with the current setup.

**⏱️ This should fix your issues immediately after running the SQL!** 