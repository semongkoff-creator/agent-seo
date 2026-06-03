import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  refreshSession: vi.fn(),
  logoutUser: vi.fn(),
  sendForgotPasswordEmail: vi.fn(),
  resetPassword: vi.fn()
}));

const validationMock = vi.hoisted(() => ({
  parseJsonBody: vi.fn()
}));

const sessionMock = vi.hoisted(() => ({
  requireUser: vi.fn()
}));

vi.mock('@/lib/services/auth', () => authMock);
vi.mock('@/app/api/_lib/validation', () => validationMock);
vi.mock('@/lib/auth/session', () => sessionMock);

import * as loginRoute from '@/app/api/auth/login/route';
import * as registerRoute from '@/app/api/auth/register/route';
import * as refreshRoute from '@/app/api/auth/refresh/route';
import * as logoutRoute from '@/app/api/auth/logout/route';

beforeEach(() => {
  authMock.loginUser.mockReset();
  authMock.registerUser.mockReset();
  authMock.refreshSession.mockReset();
  authMock.logoutUser.mockReset();
  authMock.sendForgotPasswordEmail.mockReset();
  authMock.resetPassword.mockReset();
  validationMock.parseJsonBody.mockReset();
  sessionMock.requireUser.mockReset();
});

describe('auth routes', () => {
  it('sets cookies on login', async () => {
    validationMock.parseJsonBody.mockResolvedValue({ email: 'demo@example.com', password: 'Password123' });
    authMock.loginUser.mockResolvedValue({
      userId: 'user-1',
      email: 'demo@example.com',
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      }
    });

    const response = await loginRoute.POST(new Request('http://localhost/api/auth/login', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(response.headers.get('set-cookie')).toContain('seo-agent-access-token=');
    expect(response.headers.get('set-cookie')).toContain('seo-agent-refresh-token=');
  });

  it('sets cookies on register', async () => {
    validationMock.parseJsonBody.mockResolvedValue({
      email: 'demo@example.com',
      password: 'Password123',
      fullName: 'Demo User'
    });
    authMock.registerUser.mockResolvedValue({
      userId: 'user-1',
      email: 'demo@example.com',
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      }
    });

    const response = await registerRoute.POST(new Request('http://localhost/api/auth/register', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(response.headers.get('set-cookie')).toContain('seo-agent-access-token=');
  });

  it('refreshes session cookies', async () => {
    validationMock.parseJsonBody.mockResolvedValue({ refreshToken: 'refresh-token' });
    authMock.refreshSession.mockResolvedValue({
      userId: 'user-1',
      email: 'demo@example.com',
      session: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      }
    });

    const response = await refreshRoute.POST(new Request('http://localhost/api/auth/refresh', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(response.headers.get('set-cookie')).toContain('seo-agent-access-token=');
    expect(response.headers.get('set-cookie')).toContain('new-refresh-token');
  });

  it('clears cookies on logout', async () => {
    sessionMock.requireUser.mockResolvedValue({ id: 'user-1' });
    authMock.logoutUser.mockResolvedValue({ ok: true });

    const response = await logoutRoute.POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(response.headers.get('set-cookie')).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });
});
