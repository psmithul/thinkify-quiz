#!/usr/bin/env node

// Debug script to test LinkedIn OAuth configuration
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

console.log('🔍 LinkedIn OAuth Configuration Debug');
console.log('=====================================');
console.log('');

console.log('✅ Environment Variables:');
console.log(`   Client ID: ${clientId ? clientId.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`   Client Secret: ${clientSecret ? 'SET (' + clientSecret.length + ' chars)' : 'NOT SET'}`);
console.log('');

if (!clientId || !clientSecret) {
  console.log('❌ Missing LinkedIn credentials in .env.local');
  console.log('');
  console.log('💡 To fix this, update your .env.local file with:');
  console.log('   NEXT_PUBLIC_LINKEDIN_CLIENT_ID=865iwdnmx2n4fy');
  console.log('   LINKEDIN_CLIENT_SECRET=WPL_AP1.Zbs0nWg0clHhyAzC.t0scVw==');
  console.log('');
  process.exit(1);
}

console.log('✅ OAuth URLs:');
const redirectUri = 'http://localhost:3001/auth/linkedin/callback';
const scope = 'openid profile email';
const state = 'test_state_123';

const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=${encodeURIComponent(scope)}&` +
  `state=${state}`;

console.log(`   Authorization URL: ${authUrl}`);
console.log(`   Redirect URI: ${redirectUri}`);
console.log(`   Scopes: ${scope}`);
console.log('');

// Test token endpoint configuration
console.log('🧪 Testing Token Endpoint Configuration:');
console.log('   Token URL: https://www.linkedin.com/oauth/v2/accessToken');
console.log('   Method: POST');
console.log('   Content-Type: application/x-www-form-urlencoded');
console.log('');

console.log('📋 Required LinkedIn App Configuration:');
console.log('   1. Product: "Sign in with LinkedIn using OpenID Connect"');
console.log('   2. Redirect URLs: http://localhost:3001/auth/linkedin/callback');
console.log('   3. Scopes: openid, profile, email');
console.log('');

console.log('🔗 Test this OAuth flow:');
console.log('   1. Visit: http://localhost:3001/auth/login');
console.log('   2. Click "Continue with LinkedIn"');
console.log('   3. Check browser console for errors');
console.log('   4. Check Network tab for failed requests');
console.log('');

console.log('🚀 OAuth flow should redirect to:');
console.log(`   ${authUrl}`);
console.log('');

// Check if .env.local file exists and show its LinkedIn content
try {
  const envContent = readFileSync('.env.local', 'utf8');
  const linkedinLines = envContent.split('\n').filter(line => 
    line.includes('LINKEDIN') && !line.startsWith('#')
  );
  
  console.log('📄 Current .env.local LinkedIn configuration:');
  linkedinLines.forEach(line => {
    if (line.includes('SECRET')) {
      const [key] = line.split('=');
      console.log(`   ${key}=***HIDDEN***`);
    } else {
      console.log(`   ${line}`);
    }
  });
} catch (error) {
  console.log('⚠️  Could not read .env.local file');
}

console.log('');
console.log('🎯 Next Steps:');
console.log('   1. Make sure your LinkedIn app has "OpenID Connect" product enabled');
console.log('   2. Verify redirect URL matches exactly: http://localhost:3001/auth/linkedin/callback');
console.log('   3. Test the OAuth flow in browser');
console.log('   4. Check browser console and network tab for specific errors'); 