import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withSecurity, SecurityUtils } from '@/lib/security';

async function handler(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role || 'user';

    if (request.method === 'GET') {
      // Anyone can view companies
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .order('tier', { ascending: false })
        .order('name');

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch companies' },
          { status: 500 }
        );
      }

      return NextResponse.json({ companies });
    }

    if (request.method === 'POST') {
      // Only admin can create companies
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const sanitizedBody = SecurityUtils.sanitizeInput(body);

      // Validate required fields
      const { name, tier, industry, location } = sanitizedBody;
      if (!name || !tier || !industry || !location) {
        return NextResponse.json(
          { error: 'Name, tier, industry, and location are required' },
          { status: 400 }
        );
      }

      // Validate tier
      if (typeof tier !== 'number' || tier < 1 || tier > 5) {
        return NextResponse.json(
          { error: 'Tier must be a number between 1 and 5' },
          { status: 400 }
        );
      }

      // Create company
      const { data: company, error: createError } = await supabase
        .from('companies')
        .insert(sanitizedBody)
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create company' },
          { status: 500 }
        );
      }

      return NextResponse.json({ company }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );

  } catch (error) {
    console.error('Companies API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply security middleware
export const GET = withSecurity(handler, {
  rateLimit: { maxRequests: 100, windowMs: 60000 }
});

export const POST = withSecurity(handler, {
  rateLimit: { maxRequests: 10, windowMs: 60000 }
}); 