#!/usr/bin/env node

// Debug script to test LinkedIn OAuth configuration
require('dotenv').config({ path: '.env.local' });

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
console.log(`   ${authUrl.substring(0, 150)}...`); 