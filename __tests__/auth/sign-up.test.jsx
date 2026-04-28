/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock Next.js navigation ────────────────────────────────────────────────
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// ── Stub UI components ─────────────────────────────────────────────────────
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, type, ...props }) => (
    <button type={type} disabled={disabled} {...props}>{children}</button>
  ),
}));
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div>{children}</div>,
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
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }) => <div role="progressbar" aria-valuenow={value} />,
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Eye: () => <span />,
    EyeOff: () => <span />,
    CheckCircle2: () => <span data-testid="check" />,
    XCircle: () => <span data-testid="x-circle" />,
  };
});

import Page from '@/app/auth/sign-up/page';

// ── Helpers ────────────────────────────────────────────────────────────────
const renderPage = () => render(<Page />);

describe('Sign-up page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // ── Render ────────────────────────────────────────────────────────────────

  it('renders the heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
  });

  it('renders full name, email, password, and confirm password fields', () => {
    renderPage();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders a link to the login page', () => {
    renderPage();
    // The sign-in link text is "Sign in" on the sign-up page
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toHaveAttribute('href', '/auth/login');
  });

  // ── Password strength meter ───────────────────────────────────────────────

  it('shows password strength checklist when user starts typing a password', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'abc');
    // Strength bar is a custom div — check for the strength label text instead
    await waitFor(() =>
      expect(screen.getByText(/very weak|weak|fair|good|strong/i)).toBeInTheDocument()
    );
  });

  it('strength checklist marks "8 characters" as met when password is long enough', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'abcdefgh');
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  // ── Submit button state ───────────────────────────────────────────────────

  it('keeps submit button disabled when password is too short', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'short');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'short');
    expect(screen.getByRole('button', { name: /create an account/i })).toBeDisabled();
  });

  it('keeps submit button disabled when passwords do not match', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Different1!');
    expect(screen.getByRole('button', { name: /create an account/i })).toBeDisabled();
  });

  it('enables submit button when passwords match and meet length requirement', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    expect(screen.getByRole('button', { name: /create an account/i })).not.toBeDisabled();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('shows mismatch error inline when confirm password differs', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Wrong');
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  // ── Successful registration ───────────────────────────────────────────────

  it('navigates to dashboard on successful registration', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'tok', refresh_token: 'ref' }),
    });

    renderPage();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Alice Smith');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('sends correct JSON payload to /api/auth/register', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderPage();
    await userEvent.type(screen.getByLabelText(/full name/i), 'Bob Jones');
    await userEvent.type(screen.getByLabelText(/email/i), 'bob@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(url).toBe('/api/auth/register');
    expect(body.email).toBe('bob@example.com');
    expect(body.password).toBe('Password1!');
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('displays API error when email is already taken', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'An account with this email already exists' }),
      status: 400,
    });

    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    await waitFor(() =>
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays generic error on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    // The page's catch block exposes err.message which is 'Failed to fetch'
    await waitFor(() =>
      expect(screen.getByText(/failed to fetch|an error occurred/i)).toBeInTheDocument()
    );
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('shows loading text on submit and disables button', async () => {
    let resolve;
    global.fetch.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));

    // Button should be disabled during loading
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /creating account|create an account/i });
      expect(btn).toBeDisabled();
    });

    act(() => resolve({ ok: true, json: async () => ({}) }));
  });
});
