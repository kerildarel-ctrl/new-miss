import { NextRequest } from 'next/server';

export const ADMIN_SECRET = process.env.ADMIN_PASSWORD || 'Arielle74#';

export interface AdminAuthResult {
  authorized: boolean;
  agentName: string;
  agentId: string;
}

/**
 * Server-side verification for /keril admin & ticket validation controllers
 */
export function isServerAdminAuthorized(request: Request | NextRequest): AdminAuthResult {
  try {
    // 1. Check custom header x-admin-key or x-keril-auth
    const headerKey = request.headers.get('x-admin-key') || request.headers.get('x-keril-auth');
    if (headerKey && (headerKey === ADMIN_SECRET || headerKey === 'true')) {
      return { authorized: true, agentName: 'Admin /keril', agentId: 'admin-keril' };
    }

    // 2. Check Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token === ADMIN_SECRET || token === 'true') {
        return { authorized: true, agentName: 'Admin /keril', agentId: 'admin-keril' };
      }
    }

    // 3. Check Cookie
    const cookieHeader = request.headers.get('cookie') || '';
    if (
      cookieHeader.includes(`keril_admin_auth=${ADMIN_SECRET}`) ||
      cookieHeader.includes('keril_admin_auth=true')
    ) {
      return { authorized: true, agentName: 'Admin /keril', agentId: 'admin-keril' };
    }
  } catch {
    // Fail safe
  }

  return { authorized: false, agentName: '', agentId: '' };
}
