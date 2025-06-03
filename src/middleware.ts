import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to set cookies from supabase
function withSupabaseCookies(res: NextResponse, response: NextResponse) {
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) response.headers.set('set-cookie', setCookie);
  return response;
}

export async function middleware(req: NextRequest) {
  // Skip middleware for static assets and API routes
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create a response object
  const res = NextResponse.next();
  
  // Create Supabase client
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Create base response that preserves cookies
    const baseResponse = withSupabaseCookies(res, res);
    
    // Get session
    const { data } = await supabase.auth.getSession();
    const hasSession = !!data.session;

    // Define paths
    const path = req.nextUrl.pathname;
    
    // IMPORTANT: Only handle the most basic redirects to prevent loops
    
    // If already logged in and trying to access login page, redirect to dashboard 
    if (hasSession && path === '/auth/signin') {
      console.log('Redirecting from signin to dashboard (session exists)');
      return withSupabaseCookies(res, NextResponse.redirect(new URL('/dashboard', req.url)));
    }
   
    // Don't do any other redirects to avoid potential loops
    // Let client components handle their own auth
    return baseResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};