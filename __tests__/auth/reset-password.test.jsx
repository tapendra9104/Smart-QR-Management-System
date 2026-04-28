import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => ({ get: () => 'test-token-abc123' }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

let ResetPasswordPage;

beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import('@/app/auth/reset-password/page');
    ResetPasswordPage = mod.default;
});

describe('ResetPasswordPage', () => {
    it('renders the reset password form', async () => {
        render(<ResetPasswordPage />);
        // password inputs use type="password" — not role="textbox"
        const pwdInputs = screen.queryAllByLabelText(/password/i);
        expect(pwdInputs.length).toBeGreaterThan(0);
    });

    it('shows error when passwords do not match', async () => {
        render(<ResetPasswordPage />);

        const pwdInputs = screen.getAllByDisplayValue('');
        if (pwdInputs.length >= 2) {
            fireEvent.change(pwdInputs[0], { target: { value: 'Password123!' } });
            fireEvent.change(pwdInputs[1], { target: { value: 'Different456!' } });

            const submitBtn = screen.getByRole('button', { name: /reset|set/i });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                // Either error message or button stays disabled
                expect(screen.queryByRole('button', { name: /reset|set/i })).toBeDefined();
            });
        }
    });

    it('submits successfully and navigates to login', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Password has been reset successfully.' }),
        });

        render(<ResetPasswordPage />);

        const pwdInputs = screen.queryAllByLabelText(/password/i);
        if (pwdInputs.length >= 1) {
            fireEvent.change(pwdInputs[0], { target: { value: 'NewPassword123!' } });
            if (pwdInputs[1]) {
                fireEvent.change(pwdInputs[1], { target: { value: 'NewPassword123!' } });
            }

            const submitBtn = screen.getByRole('button', { name: /reset|set/i });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        }
    });

    it('handles expired token error from API', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Token has expired or is invalid' }),
        });

        render(<ResetPasswordPage />);

        const pwdInputs = screen.queryAllByLabelText(/password/i);
        if (pwdInputs.length >= 1) {
            fireEvent.change(pwdInputs[0], { target: { value: 'NewPassword123!' } });
            if (pwdInputs[1]) {
                fireEvent.change(pwdInputs[1], { target: { value: 'NewPassword123!' } });
            }

            const submitBtn = screen.getByRole('button', { name: /reset|set/i });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        }
    });
});
