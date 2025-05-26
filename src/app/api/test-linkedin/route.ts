import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirect_uri } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }
    
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    // Use the redirect_uri from the request, or default to test redirect
    const redirectUri = redirect_uri || 'http://localhost:3001/test-linkedin';
    
    console.log('🔍 LinkedIn OAuth Debug Test');
    console.log('============================');
    console.log('Environment check:');
    console.log(`   Client ID: ${clientId ? 'SET (' + clientId.length + ' chars)' : 'NOT SET'}`);
    console.log(`   Client Secret: ${clientSecret ? 'SET (' + clientSecret.length + ' chars)' : 'NOT SET'}`);
    console.log(`   Redirect URI: ${redirectUri}`);
    console.log(`   Code received: ${code.substring(0, 20)}...`);
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'LinkedIn OAuth not configured properly. Missing credentials.' },
        { status: 500 }
      );
    }
    
    // Step 1: Test token exchange
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    
    console.log('Token request parameters:');
    console.log(`   grant_type: authorization_code`);
    console.log(`   redirect_uri: ${redirectUri}`);
    console.log(`   client_id: ${clientId}`);
    console.log(`   code: ${code.substring(0, 20)}...`);
    console.log(`   client_secret: [HIDDEN]`);
    
    console.log('Making token request to LinkedIn...');
    
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Thinkify-Quiz-App/1.0'
      },
      body: tokenParams,
    });
    
    const tokenResponseText = await tokenResponse.text();
    
    console.log('Token response received:');
    console.log(`   Status: ${tokenResponse.status}`);
    console.log(`   Status Text: ${tokenResponse.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(tokenResponse.headers.entries()));
    console.log(`   Body: ${tokenResponseText}`);
    
    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed');
      
      // Try to parse error details
      let errorData;
      try {
        errorData = JSON.parse(tokenResponseText);
      } catch (e) {
        errorData = { raw_response: tokenResponseText };
      }
      
      return NextResponse.json({
        error: 'Token exchange failed',
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        linkedin_error: errorData,
        debug: {
          client_id: clientId,
          redirect_uri: redirectUri,
          code_preview: code.substring(0, 20) + '...',
          note: 'Make sure the redirect_uri used to get this code matches exactly'
        }
      }, { status: 400 });
    }
    
    // Parse token response
    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
    } catch (e) {
      console.error('❌ Failed to parse token response');
      return NextResponse.json({
        error: 'Invalid token response format',
        raw_response: tokenResponseText
      }, { status: 500 });
    }
    
    console.log('✅ Token exchange successful');
    console.log('Token data:', {
      access_token: tokenData.access_token ? '[PRESENT]' : '[MISSING]',
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });
    
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return NextResponse.json({
        error: 'No access token in response',
        token_data: tokenData
      }, { status: 400 });
    }
    
    // Step 2: Test userinfo endpoint
    console.log('Testing userinfo endpoint...');
    
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Thinkify-Quiz-App/1.0'
      },
    });
    
    const profileResponseText = await profileResponse.text();
    
    console.log('Profile response received:');
    console.log(`   Status: ${profileResponse.status}`);
    console.log(`   Status Text: ${profileResponse.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(profileResponse.headers.entries()));
    console.log(`   Body: ${profileResponseText}`);
    
    if (!profileResponse.ok) {
      console.error('❌ Profile fetch failed');
      
      let errorData;
      try {
        errorData = JSON.parse(profileResponseText);
      } catch (e) {
        errorData = { raw_response: profileResponseText };
      }
      
      return NextResponse.json({
        error: 'Profile fetch failed',
        status: profileResponse.status,
        statusText: profileResponse.statusText,
        linkedin_error: errorData,
        token_was_valid: true
      }, { status: 400 });
    }
    
    // Parse profile response
    let profile;
    try {
      profile = JSON.parse(profileResponseText);
    } catch (e) {
      console.error('❌ Failed to parse profile response');
      return NextResponse.json({
        error: 'Invalid profile response format',
        raw_response: profileResponseText
      }, { status: 500 });
    }
    
    console.log('✅ Profile fetch successful');
    console.log('Profile data:', {
      sub: profile.sub,
      email: profile.email || '[MISSING]',
      name: profile.name || '[MISSING]',
      picture: profile.picture ? '[PRESENT]' : '[MISSING]'
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'LinkedIn OAuth test completed successfully',
      user_data: {
        id: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture
      },
      debug: {
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope
      }
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'LinkedIn OAuth Test Endpoint',
    usage: 'POST with { "code": "authorization_code_from_linkedin" }',
    redirect_uri: 'http://localhost:3001/auth/linkedin/callback',
    scopes: 'openid profile email'
  });
} 