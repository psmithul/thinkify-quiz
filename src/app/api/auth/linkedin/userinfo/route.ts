import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }
    
    // Use the correct environment variable names that match what's in the login page
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    
    // Use the redirect URI that was passed from the client
    // This MUST match exactly what was used in the initial OAuth request
    const actualRedirectUri = redirectUri || 'http://localhost:3001/auth/linkedin/callback';
    
    if (!clientId || !clientSecret) {
      console.error('LinkedIn OAuth env vars missing:', { 
        clientId: !!clientId, 
        clientSecret: !!clientSecret,
        clientIdValue: clientId?.substring(0, 5) + '...',
        envKeys: Object.keys(process.env).filter(key => key.includes('LINKEDIN'))
      });
      return NextResponse.json(
        { error: 'LinkedIn OAuth not configured properly. Check environment variables.' },
        { status: 500 }
      );
    }
    
    console.log('Attempting LinkedIn token exchange with:', {
      clientId: clientId.substring(0, 10) + '...',
      redirectUri: actualRedirectUri,
      codeLength: code.length,
      fullCode: code.substring(0, 10) + '...' // Show first 10 chars for debugging
    });
    
    // Step 1: Exchange authorization code for access token using OpenID Connect
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: actualRedirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    
    console.log('Token request URL: https://www.linkedin.com/oauth/v2/accessToken');
    console.log('Token request body params:', {
      grant_type: 'authorization_code',
      redirect_uri: actualRedirectUri,
      client_id: clientId.substring(0, 10) + '...',
      code: code.substring(0, 10) + '...',
      client_secret: '[HIDDEN]'
    });
    
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenParams,
    });
    
    const tokenResponseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
    
    if (!tokenResponse.ok) {
      console.error('LinkedIn token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        response: tokenResponseText
      });
      
      // Try to parse error details
      let errorDetails = tokenResponseText;
      try {
        const errorData = JSON.parse(tokenResponseText);
        errorDetails = errorData.error_description || errorData.error || tokenResponseText;
      } catch (e) {
        // Use raw response if not JSON
      }
      
      return NextResponse.json(
        { error: 'Failed to exchange code for token', details: errorDetails },
        { status: 400 }
      );
    }
    
    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
      console.log('Token data received:', {
        access_token: tokenData.access_token ? '[PRESENT]' : '[MISSING]',
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        id_token: tokenData.id_token ? '[PRESENT]' : '[MISSING]'
      });
    } catch (e) {
      console.error('Failed to parse token response:', tokenResponseText);
      return NextResponse.json(
        { error: 'Invalid token response format' },
        { status: 500 }
      );
    }
    
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error('No access token in response:', tokenData);
      return NextResponse.json(
        { error: 'No access token received' },
        { status: 400 }
      );
    }
    
    console.log('Successfully got access token, fetching profile...');
    
    // Step 2: Get user profile information using the userinfo endpoint (OpenID Connect)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    const profileResponseText = await profileResponse.text();
    console.log('Profile response status:', profileResponse.status);
    console.log('Profile response headers:', Object.fromEntries(profileResponse.headers.entries()));
    
    if (!profileResponse.ok) {
      console.error('LinkedIn userinfo endpoint failed:', {
        status: profileResponse.status,
        statusText: profileResponse.statusText,
        response: profileResponseText
      });
      
      // Try to parse error details
      let errorDetails = profileResponseText;
      try {
        const errorData = JSON.parse(profileResponseText);
        errorDetails = errorData.message || errorData.error || profileResponseText;
      } catch (e) {
        // Use raw response if not JSON
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch LinkedIn profile', details: errorDetails },
        { status: 400 }
      );
    }
    
    let profile;
    try {
      profile = JSON.parse(profileResponseText);
      console.log('Profile data received:', {
        sub: profile.sub,
        email: profile.email || '[MISSING]',
        name: profile.name || '[MISSING]',
        given_name: profile.given_name || '[MISSING]',
        family_name: profile.family_name || '[MISSING]',
        picture: profile.picture ? '[PRESENT]' : '[MISSING]',
        email_verified: profile.email_verified
      });
    } catch (e) {
      console.error('Failed to parse profile response:', profileResponseText);
      return NextResponse.json(
        { error: 'Invalid profile response format' },
        { status: 500 }
      );
    }
    
    // Validate required fields according to OpenID Connect specification
    if (!profile.sub) {
      console.error('No sub (user ID) in profile:', profile);
      return NextResponse.json(
        { error: 'Invalid LinkedIn profile: missing user ID' },
        { status: 400 }
      );
    }
    
    if (!profile.email) {
      console.error('No email in profile:', profile);
      return NextResponse.json(
        { error: 'No email found in LinkedIn profile. Make sure email scope is requested.' },
        { status: 400 }
      );
    }
    
    console.log('Successfully fetched LinkedIn profile via OpenID Connect');
    
    // Return the user data in the expected format
    return NextResponse.json({
      id: profile.sub,
      email: profile.email,
      fullName: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
      firstName: profile.given_name,
      lastName: profile.family_name,
      profileImage: profile.picture,
      linkedinUrl: `https://www.linkedin.com/in/${profile.sub}`,
      // Additional fields for compatibility
      name: profile.name,
      given_name: profile.given_name,
      family_name: profile.family_name,
      picture: profile.picture
    });
    
  } catch (error) {
    console.error('LinkedIn userinfo API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 