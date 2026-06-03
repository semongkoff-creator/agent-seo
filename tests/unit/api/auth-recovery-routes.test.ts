import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  sendForgotPasswordEmail: vi.fn(),
  resetPassword: vi.fn()
}));

const validationMock = vi.hoisted(() => ({
  parseJsonBody: vi.fn()
}));

vi.mock('@/lib/services/auth', () => authMock);
vi.mock('@/app/api/_lib/validation', () => validationMock);

import * as forgotRoute from '@/app/api/auth/forgot-password/route';
import * as resetRoute from '@/app/api/auth/reset-password/route';

beforeEach(() => {
  authMock.sendForgotPasswordEmail.mockReset();
  authMock.resetPassword.mockReset();
  validationMock.parseJsonBody.mockReset();
});

describe('auth recovery routes', () => {
  it('sends a forgot password email', async () => {
    validationMock.parseJsonBody.mockResolvedValue({ email: 'demo@example.com' });
    authMock.sendForgotPasswordEmail.mockResolvedValue({ ok: true });

    const response = await forgotRoute.POST(new Request('http://localhost/api/auth/forgot-password', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(authMock.sendForgotPasswordEmail).toHaveBeenCalledWith({ email: 'demo@example.com' });
    expect(body.ok).toBe(true);
  });

  it('resets password', async () => {
    validationMock.parseJsonBody.mockResolvedValue({
      token: 'reset-token',
      password: 'Password123'
    });
    authMock.resetPassword.mockResolvedValue({ ok: true });

    const response = await resetRoute.POST(new Request('http://localhost/api/auth/reset-password', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(authMock.resetPassword).toHaveBeenCalledWith({
      token: 'reset-token',
      password: 'Password123'
    });
    expect(body.ok).toBe(true);
  });
});
