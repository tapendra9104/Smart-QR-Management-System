/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock Next.js navigation ────────────────────────────────────────────────
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// ── Mock next/link ──────────────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// ── Stub all Radix / shadcn components ────────────────────────────────────
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, type, ...props }) => (
    <button type={type} disabled={disabled} {...props}>{children}</button>
  ),
}));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children }) => <h1>{children}</h1>,
  CardDescription: ({ children }) => <p>{children}</p>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: ({ id, type, value, onChange, ...props }) => (
    <input id={id} type={type} value={value} onChange={onChange} {...props} />
  ),
}));
vi.mock('@/components/ui/label', () => ({
  Label: ({ htmlFor, children }) => <label htmlFor={htmlFor}>{children}</label>,
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Eye: () => <span data-testid="icon-eye" />,
    EyeOff: () => <span data-testid="icon-eye-off" />,
    AlertCircle: () => <span data-testid="icon-alert" />,
  };
});

import Page from '@/app/auth/login/page';

// ── Helpers ────────────────────────────────────────────────────────────────
const renderPage = () => render(<Page />);

const fillAndSubmit = async (email = 'user@example.com', password = 'Password1!') => {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/^password$/i), password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // ── Render ────────────────────────────────────────────────────────────────

  it('renders the heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('renders the sign-in button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders a link to the sign-up page', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toHaveAttribute('href', '/auth/sign-up');
  });

  it('renders a forgot password link', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /forgot password/i });
    expect(link).toHaveAttribute('href', '/auth/forgot-password');
  });

  // ── Password toggle ───────────────────────────────────────────────────────

  it('toggles password visibility', async () => {
    renderPage();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ── Successful login ──────────────────────────────────────────────────────

  it('navigates to dashboard on successful login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'tok', refresh_token: 'ref' }),
    });

    renderPage();
    await fillAndSubmit();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('sends correct JSON payload to /api/auth/login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderPage();
    await fillAndSubmit('alice@example.com', 'SecretPass1!');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: 'alice@example.com', password: 'SecretPass1!' }),
      })
    );
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('displays error message on failed login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid email or password' }),
      status: 401,
    });

    renderPage();
    await fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays error for locked account', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Account is temporarily locked. Try again in 14 minutes.' }),
      status: 401,
    });

    renderPage();
    await fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText(/locked/i)).toBeInTheDocument()
    );
  });

  it('displays a generic error on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    renderPage();
    await fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    );
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('disables the submit button while loading', async () => {
    let resolveRequest;
    global.fetch.mockReturnValueOnce(
      new Promise((resolve) => { resolveRequest = resolve; })
    );

    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    // Resolve to clean up
    act(() => resolveRequest({ ok: true, json: async () => ({}) }));
  });

  it('clears previous error on new submission attempt', async () => {
    // First attempt: fail
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Wrong password' }),
      status: 401,
    });

    renderPage();
    const emailInput    = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => screen.getByText(/wrong password/i));

    // Second attempt: succeed — clear inputs first to avoid value doubling
    await userEvent.clear(emailInput);
    await userEvent.clear(passwordInput);
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.queryByText(/wrong password/i)).not.toBeInTheDocument());
  });
});
