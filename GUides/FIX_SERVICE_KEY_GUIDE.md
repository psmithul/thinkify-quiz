# Fix SUPABASE_SERVICE_ROLE_KEY Issue

## 🚨 Current Issue
You're getting "Missing SUPABASE_SERVICE_ROLE_KEY environment variable" because the service key needs to be obtained from your actual Supabase project dashboard.

## 📋 Step-by-Step Fix

### 1. Get Your Service Role Key from Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com/project/shmnqswfxezpgpbscmke
2. Click on **"Settings"** in the left sidebar
3. Click on **"API"** in the settings menu
4. Look for the **"Project API keys"** section
5. Find the **"service_role"** key (this will be a long JWT token starting with `eyJ...`)
6. **Copy this key** - this is your actual service role key

### 2. Add the Key to Your Environment File

Open your `.env.local` file and add this line (replace `YOUR_ACTUAL_SERVICE_ROLE_KEY` with the key from step 1):

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY
```

### 3. Restart Your Development Server

```bash
# Kill existing server
pkill -f "node.*next"

# Start server again
npm run dev -- --port 3002
```

### 4. Test the Fix

Visit: http://localhost:3002/api/test-admin

You should see a success response with your user data.

## 🔍 What Each Key Is For

- **`anon` key**: Public key for client-side operations (already in your .env.local)
- **`service_role` key**: Private key for server-side admin operations (what we need)

## ⚠️ Security Note

The `service_role` key bypasses all Row Level Security (RLS) policies and should:
- **NEVER** be exposed to the client-side
- **ONLY** be used on the server-side
- **NOT** be committed to version control

## 🧪 Verify It's Working

After adding the correct key and restarting the server:

1. Test the admin client: `curl http://localhost:3002/api/test-admin`
2. Try creating a quiz: Visit `/admin/quizzes/new`
3. Try managing companies: Visit `/admin/companies`
4. Try managing recruiters: Visit `/admin/recruiters`

## 📝 Example .env.local File

```bash
NEXT_PUBLIC_SUPABASE_URL=https://shmnqswfxezpgpbscmke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Get this from Supabase dashboard
```

## 🚀 What This Fixes

Once you have the correct service role key:
- ✅ Quiz creation will work
- ✅ Quiz submission will work  
- ✅ Company management will work
- ✅ Recruiter management will work
- ✅ All admin operations will work

## 🆘 If You Still Have Issues

1. Double-check you copied the **service_role** key (not the anon key)
2. Make sure there are no extra spaces or characters
3. Restart the development server after making changes
4. Check the browser console for any errors
5. Check that you're logged in as an admin user

The service role key is the missing piece that will make all admin functionality work! 