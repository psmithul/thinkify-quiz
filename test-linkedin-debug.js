#!/usr/bin/env node

// Debug script to test LinkedIn OAuth flow
import fetch from 'node-fetch';

async function testLinkedInOAuth() {
  console.log('🔍 Testing LinkedIn OAuth Configuration...\n');
  
  // Environment variables from .env.local
  const clientId = '865iwdnmx2n4fy';
  const clientSecret = 'WPL_AP1.Zbs0nWg0clHhyAzC.t0scVw==';
  const redirectUri = 'http://localhost:3001/auth/linkedin/callback';
  
  console.log('📋 Configuration:');
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 10)}...`);
  console.log(`   Redirect URI: ${redirectUri}\n`);
  
  // Step 1: Show the authorization URL
  const scope = 'openid profile email';
  const state = Math.random().toString(36).substring(2, 15);
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;
  
  console.log('🔗 Authorization URL:');
  console.log(authUrl);
  console.log('\n📝 Manual Test Steps:');
  console.log('1. Open the above URL in your browser');
  console.log('2. Complete LinkedIn authorization');
  console.log('3. Copy the "code" parameter from the callback URL');
  console.log('4. Test token exchange with that code\n');
  
  // If a code is provided as argument, test token exchange
  const code = process.argv[2];
  if (code) {
    console.log(`🔄 Testing token exchange with code: ${code.substring(0, 10)}...`);
    await testTokenExchange(code, redirectUri, clientId, clientSecret);
  } else {
    console.log('💡 To test token exchange, run: node test-linkedin-debug.js YOUR_AUTH_CODE');
  }
}

async function testTokenExchange(code, redirectUri, clientId, clientSecret) {
  try {
    console.log('\n🔄 Step 1: Exchanging code for access token...');
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    
    console.log('📤 Token request details:');
    console.log(`   URL: https://www.linkedin.com/oauth/v2/accessToken`);
    console.log(`   Method: POST`);
    console.log(`   Content-Type: application/x-www-form-urlencoded`);
    console.log(`   Body parameters:`);
    console.log(`     grant_type: authorization_code`);
    console.log(`     code: ${code.substring(0, 10)}...`);
    console.log(`     redirect_uri: ${redirectUri}`);
    console.log(`     client_id: ${clientId}`);
    console.log(`     client_secret: [HIDDEN]`);
    
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams,
    });
    
    const tokenResponseText = await tokenResponse.text();
    
    console.log(`\n📥 Token response:`);
    console.log(`   Status: ${tokenResponse.status} ${tokenResponse.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(tokenResponse.headers.entries()));
    
    if (!tokenResponse.ok) {
      console.log(`❌ Token exchange failed!`);
      console.log(`   Response body: ${tokenResponseText}`);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(tokenResponseText);
        console.log(`   Parsed error:`, errorData);
      } catch (e) {
        console.log(`   Raw error response: ${tokenResponseText}`);
      }
      return;
    }
    
    const tokenData = JSON.parse(tokenResponseText);
    console.log(`✅ Token exchange successful!`);
    console.log(`   Access token: ${tokenData.access_token ? '[PRESENT]' : '[MISSING]'}`);
    console.log(`   Token type: ${tokenData.token_type}`);
    console.log(`   Expires in: ${tokenData.expires_in} seconds`);
    console.log(`   Scope: ${tokenData.scope}`);
    
    if (tokenData.access_token) {
      console.log('\n🔄 Step 2: Fetching user profile...');
      await testUserProfile(tokenData.access_token);
    }
    
  } catch (error) {
    console.error('❌ Token exchange error:', error);
  }
}

async function testUserProfile(accessToken) {
  try {
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    const profileResponseText = await profileResponse.text();
    
    console.log(`📥 Profile response:`);
    console.log(`   Status: ${profileResponse.status} ${profileResponse.statusText}`);
    
    if (!profileResponse.ok) {
      console.log(`❌ Profile fetch failed!`);
      console.log(`   Response: ${profileResponseText}`);
      return;
    }
    
    const profile = JSON.parse(profileResponseText);
    console.log(`✅ Profile fetch successful!`);
    console.log(`   User ID (sub): ${profile.sub}`);
    console.log(`   Email: ${profile.email || '[MISSING]'}`);
    console.log(`   Name: ${profile.name || '[MISSING]'}`);
    console.log(`   Given name: ${profile.given_name || '[MISSING]'}`);
    console.log(`   Family name: ${profile.family_name || '[MISSING]'}`);
    console.log(`   Picture: ${profile.picture ? '[PRESENT]' : '[MISSING]'}`);
    console.log(`   Email verified: ${profile.email_verified}`);
    
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
  }
}

// Run the test
testLinkedInOAuth().catch(console.error); 