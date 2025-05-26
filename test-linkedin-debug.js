#!/usr/bin/env node

// Debug script to test LinkedIn OAuth flow
import fetch from 'node-fetch';

const CLIENT_ID = '865iwdnmx2n4fy';
const CLIENT_SECRET = 'WPL_AP1.Zbs0nWg0clHhyAzC.t0scVw==';

// Support both local and production URLs
const LOCAL_REDIRECT_URI = 'http://localhost:3001/auth/linkedin/callback';
const PRODUCTION_REDIRECT_URI = 'https://thinkify-quiz.vercel.app/auth/linkedin/callback';

// Choose which environment to test
const ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'local';
const REDIRECT_URI = ENVIRONMENT === 'production' ? PRODUCTION_REDIRECT_URI : LOCAL_REDIRECT_URI;
const BASE_URL = ENVIRONMENT === 'production' ? 'https://thinkify-quiz.vercel.app' : 'http://localhost:3001';

console.log(`\n🔍 LinkedIn OAuth Debug Script - ${ENVIRONMENT.toUpperCase()} Environment`);
console.log('='.repeat(60));

// Step 1: Generate LinkedIn Authorization URL
function generateLinkedInAuthUrl() {
  const scope = 'openid profile email';
  const state = Math.random().toString(36).substring(2, 15);
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;
  
  console.log('\n📋 Configuration:');
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Scope: ${scope}`);
  console.log(`State: ${state}`);
  
  console.log('\n🔗 LinkedIn Authorization URL:');
  console.log(authUrl);
  
  console.log('\n📝 Instructions:');
  console.log('1. Copy the URL above and paste it in your browser');
  console.log('2. Complete the LinkedIn OAuth flow');
  console.log('3. Copy the "code" parameter from the callback URL');
  console.log('4. Run: node test-linkedin-debug.js <authorization_code>');
  console.log(`5. Make sure your LinkedIn app has ${REDIRECT_URI} in its redirect URIs`);
  
  return authUrl;
}

// Step 2: Test Token Exchange
async function testTokenExchange(authCode) {
  console.log('\n🔄 Testing Token Exchange...');
  console.log(`Code: ${authCode.substring(0, 20)}...`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  
  try {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    console.log(`Token Response Status: ${tokenResponse.status}`);
    const tokenData = await tokenResponse.text();
    console.log(`Token Response: ${tokenData}`);

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed');
      try {
        const errorData = JSON.parse(tokenData);
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Raw error:', tokenData);
      }
      return null;
    }

    const tokens = JSON.parse(tokenData);
    console.log('✅ Token exchange successful');
    console.log(`Access Token: ${tokens.access_token?.substring(0, 20)}...`);
    
    return tokens.access_token;
  } catch (error) {
    console.error('❌ Token exchange error:', error.message);
    return null;
  }
}

// Step 3: Test User Info Endpoint
async function testUserInfo(accessToken) {
  console.log('\n👤 Testing User Info...');
  
  try {
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log(`User Info Response Status: ${userResponse.status}`);
    const userData = await userResponse.text();
    console.log(`User Info Response: ${userData}`);

    if (!userResponse.ok) {
      console.error('❌ User info fetch failed');
      return null;
    }

    const user = JSON.parse(userData);
    console.log('✅ User info fetch successful');
    console.log('User data:', {
      id: user.sub,
      email: user.email,
      name: user.name,
      given_name: user.given_name,
      family_name: user.family_name,
      picture: user.picture
    });
    
    return user;
  } catch (error) {
    console.error('❌ User info error:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  const authCode = process.argv[2];
  
  if (!authCode) {
    generateLinkedInAuthUrl();
    return;
  }
  
  console.log(`\n🚀 Testing LinkedIn OAuth with code: ${authCode.substring(0, 20)}...`);
  
  const accessToken = await testTokenExchange(authCode);
  if (accessToken) {
    await testUserInfo(accessToken);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Debug session complete');
}

main().catch(console.error); 