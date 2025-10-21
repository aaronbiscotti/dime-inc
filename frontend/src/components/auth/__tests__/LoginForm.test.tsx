/**
 * Unit tests for the LoginForm component.
 * Tests user interactions, form validation, authentication flow, and error handling.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('next/navigation');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    return <img alt={props.alt as string || ''} {...props} />;
  },
}));

// Mock useToast
const mockShowToast = jest.fn();
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('LoginForm', () => {
  const mockSignIn = jest.fn();
  const mockPush = jest.fn();
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      user: null,
      loading: false,
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    });

    // Mock fetch for password reset
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the login form correctly', () => {
      render(<LoginForm />);

      // Use getAllByText since "Sign In" appears in both title and button
      const signInElements = screen.getAllByText('Sign In');
      expect(signInElements.length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render with expected role title for client', () => {
      render(<LoginForm expectedRole="client" />);

      expect(screen.getByText('Client Sign In')).toBeInTheDocument();
      expect(screen.getByText(/Access your client profile/i)).toBeInTheDocument();
    });

    it('should render with expected role title for ambassador', () => {
      render(<LoginForm expectedRole="ambassador" />);

      expect(screen.getByText('Ambassador Sign In')).toBeInTheDocument();
      expect(screen.getByText(/Access your ambassador profile/i)).toBeInTheDocument();
    });

    it('should render switch to signup button when onSwitchToSignup is provided', () => {
      const mockSwitchToSignup = jest.fn();
      render(<LoginForm onSwitchToSignup={mockSwitchToSignup} />);

      expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign up here/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow user to type in email and password fields', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });

    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Click the eye icon to show password
      const toggleButton = passwordInput.parentElement?.querySelector('button');
      expect(toggleButton).toBeInTheDocument();
      
      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput.type).toBe('text');

        await user.click(toggleButton);
        expect(passwordInput.type).toBe('password');
      }
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const checkbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Leave email empty, add password
      await user.type(passwordInput, 'password123');
      
      // Submit the form using fireEvent to bypass HTML5 validation
      const form = emailInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });
      
      // signIn should not have been called
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');

      // Submit the form using fireEvent to bypass HTML5 validation
      const form = emailInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
      
      // signIn should not have been called
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      
      await user.type(emailInput, 'test@example.com');
      // Leave password empty

      // Submit the form using fireEvent to bypass HTML5 validation
      const form = emailInput.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
      
      // signIn should not have been called
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Flow', () => {
    it('should call signIn with correct credentials on form submit', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          undefined
        );
      });
    });

    it('should call signIn with expected role when provided', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });

      render(<LoginForm expectedRole="client" />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'client@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'client@example.com',
          'password123',
          'client'
        );
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during authentication', async () => {
      const user = userEvent.setup();
      let resolveSignIn: (value: unknown) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValue(signInPromise as Promise<{ error: string | null }>);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();

      // Resolve the promise
      resolveSignIn!({ error: null });

      await waitFor(() => {
        expect(screen.getByText(/sign in$/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error on failed login with wrong credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Incorrect email or password/i)).toBeInTheDocument();
      });
    });

    it('should show toast on role mismatch error', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({
        error: {
          code: 'ROLE_MISMATCH',
          message: 'This is the client login page. You have a brand ambassador account.',
        },
      });

      render(<LoginForm expectedRole="client" />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'ambassador@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.stringContaining('brand ambassador account'),
          'error',
          7000
        );
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue(new Error('fetch failed'));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to our servers/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email when forgot password is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Password reset email sent successfully' }),
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const forgotPasswordButton = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/reset-password'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('test@example.com'),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Password reset email sent/i)).toBeInTheDocument();
      });
    });

    it('should show error if email is empty when forgot password is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const forgotPasswordButton = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter your email address first/i)).toBeInTheDocument();
      });
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect to dashboard if user is already authenticated', () => {
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        user: { id: 'user-123', email: 'test@example.com' } as Record<string, unknown>,
        loading: false,
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<LoginForm />);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});

