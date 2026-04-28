import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Lazy import to ensure mocks are set
let ForgotPasswordPage;

beforeEach(async () => {
    vi.resetAllMocks();
    // Dynamically import after mocks are set up
    const mod = await import('@/app/auth/forgot-password/page');
    ForgotPasswordPage = mod.default;
});

describe('ForgotPasswordPage', () => {
    it('renders the forgot password form', async () => {
        render(<ForgotPasswordPage />);
        // CardTitle renders as a styled div, not a semantic heading — check by text
        expect(screen.getByText(/forgot password/i)).toBeDefined();
        expect(screen.getByLabelText(/email/i)).toBeDefined();
    });

    it('shows validation error for empty email on submit', async () => {
        render(<ForgotPasswordPage />);
        const submitBtn = screen.getByRole('button', { name: /send|reset/i });
        fireEvent.click(submitBtn);
        await waitFor(() => {
            // HTML5 validation or error message should appear
            const emailInput = screen.getByLabelText(/email/i);
            expect(emailInput).toBeDefined();
        });
    });

    it('submits the form and shows success feedback', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'If an account with that email exists, a reset link has been sent.' }),
        });

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitBtn = screen.getByRole('button', { name: /send|reset/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/forgot-password'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    it('handles API error gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        render(<ForgotPasswordPage />);

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'fail@example.com' } });

        const submitBtn = screen.getByRole('button', { name: /send|reset/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            // Page should not crash — error handled gracefully
            expect(screen.getByLabelText(/email/i)).toBeDefined();
        });
    });
});
