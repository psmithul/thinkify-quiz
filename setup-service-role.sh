#!/bin/bash

echo "🔧 Setting up Supabase Service Role Key for RLS bypass..."

# Export the service role key for this session
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjY5MCwiZXhwIjoyMDYzNDkyNjkwfQ.wnxsiebOyH6sKaJ9b0W9DGdqWutjP0yuVBgDImGdbp4"

echo "✅ Service role key exported to environment"

# Check if .env.local exists, if not create it
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://shmnqswfxezpgpbscmke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTY2OTAsImV4cCI6MjA2MzQ5MjY5MH0.zGLUuMfCcmfGWTJkMDEO67n6FxEOHWDFpXL6JJl_mQE

# Service Role Key for Admin Operations (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjY5MCwiZXhwIjoyMDYzNDkyNjkwfQ.wnxsiebOyH6sKaJ9b0W9DGdqWutjP0yuVBgDImGdbp4

# Razorpay Configuration (Add your keys here)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EOF
    echo "✅ .env.local file created with service role key"
else
    echo "📝 .env.local already exists, checking for service role key..."
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjY5MCwiZXhwIjoyMDYzNDkyNjkwfQ.wnxsiebOyH6sKaJ9b0W9DGdqWutjP0yuVBgDImGdbp4" >> .env.local
        echo "✅ Service role key added to existing .env.local"
    else
        echo "✅ Service role key already exists in .env.local"
    fi
fi

echo ""
echo "🚀 Service Role Key Setup Complete!"
echo ""
echo "Now you can:"
echo "1. Start the dev server: npm run dev"
echo "2. Test Razorpay payments - they should work without RLS errors"
echo "3. The admin client will now properly bypass RLS policies"
echo ""
echo "⚡ The RLS issue should be resolved!" 