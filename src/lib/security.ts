import { NextRequest } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class SecurityUtils {
  // Input validation and sanitization
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potential XSS attacks
      return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeKey(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }

  static sanitizeKey(key: string): string {
    // Only allow alphanumeric characters and underscores in keys
    return key.replace(/[^a-zA-Z0-9_]/g, '');
  }

  // SQL Injection prevention for dynamic queries
  static validateDatabaseInput(input: string): boolean {
    const dangerousPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(--|\/\*|\*\/|;)/,
      /(\bor\b.*=.*=)/i,
      /(\band\b.*=.*=)/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  }

  // Rate limiting
  static checkRateLimit(
    identifier: string, 
    maxRequests: number = 100, 
    windowMs: number = 60000 // 1 minute
  ): { allowed: boolean; resetTime: number } {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, resetTime: now + windowMs };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, resetTime: current.resetTime };
    }

    current.count++;
    return { allowed: true, resetTime: current.resetTime };
  }

  // Get client IP for rate limiting
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || real || 'unknown';
    return ip;
  }

  // Validate UUID format
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Content Security Policy headers
  static getSecurityHeaders() {
    return {
      'Content-Security-Policy': 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https: blob:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-XSS-Protection': '1; mode=block'
    };
  }

  // Validate quiz data
  static validateQuizData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }

    if (data.description && data.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }

    if (data.category && (typeof data.category !== 'string' || data.category.trim().length < 2)) {
      errors.push('Category must be at least 2 characters long');
    }

    if (data.time_limit_minutes && (
      typeof data.time_limit_minutes !== 'number' || 
      data.time_limit_minutes < 1 || 
      data.time_limit_minutes > 300
    )) {
      errors.push('Time limit must be between 1 and 300 minutes');
    }

    return { valid: errors.length === 0, errors };
  }

  // Validate user permissions
  static validateUserPermissions(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = {
      'user': 1,
      'creator': 2,
      'admin': 3
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 999;

    return userLevel >= requiredLevel;
  }

  // Clean up old rate limit entries
  static cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Middleware for API routes
export function withSecurity(handler: Function, options: {
  rateLimit?: { maxRequests: number; windowMs: number };
  requireAuth?: boolean;
  requireRole?: string;
} = {}) {
  return async (request: NextRequest, context: any) => {
    try {
      // Apply security headers
      const headers = SecurityUtils.getSecurityHeaders();
      
      // Rate limiting
      if (options.rateLimit) {
        const clientIP = SecurityUtils.getClientIP(request);
        const rateLimitResult = SecurityUtils.checkRateLimit(
          clientIP,
          options.rateLimit.maxRequests,
          options.rateLimit.windowMs
        );

        if (!rateLimitResult.allowed) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded' }),
            { 
              status: 429, 
              headers: {
                ...headers,
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
              }
            }
          );
        }
      }

      // Input sanitization for POST/PUT requests
      if (request.method === 'POST' || request.method === 'PUT') {
        try {
          const body = await request.json();
          const sanitizedBody = SecurityUtils.sanitizeInput(body);
          // Replace request body with sanitized version
          (request as any).sanitizedBody = sanitizedBody;
        } catch (error) {
          // Not JSON or empty body, continue
        }
      }

      // Call the actual handler
      const response = await handler(request, context);
      
      // Add security headers to response
      if (response && typeof response.headers?.set === 'function') {
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;

    } catch (error) {
      console.error('Security middleware error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: SecurityUtils.getSecurityHeaders() }
      );
    }
  };
} 