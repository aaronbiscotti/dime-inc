/**
 * Unit tests for the SignupForm component.
 * Tests user registration flow, form validation, and error handling.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SignupForm } from '../SignupForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('@/contexts/AuthContext');

describe('SignupForm', () => {
  const mockSignUp = jest.fn();
  const mockOnSwitchToLogin = jest.fn();
  const mockOnSignupSuccess = jest.fn();
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      user: null,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  describe('Component Rendering', () => {
    it('should render the signup form correctly', () => {
      render(<SignupForm />);

      // Use getAllByText since "Sign Up" appears in both title and button
      const signUpElements = screen.getAllByText('Sign Up');
      expect(signUpElements.length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should show role indicator when initialRole is provided', () => {
      render(<SignupForm initialRole="client" />);

      expect(screen.getByText(/Creating account as:/i)).toBeInTheDocument();
      expect(screen.getByText('Client')).toBeInTheDocument();
    });

    it('should show ambassador role when initialRole is ambassador', () => {
      render(<SignupForm initialRole="ambassador" />);

      expect(screen.getByText(/Creating account as:/i)).toBeInTheDocument();
      expect(screen.getByText('Brand Ambassador')).toBeInTheDocument();
    });

    it('should render switch to login button when onSwitchToLogin is provided', () => {
      render(<SignupForm onSwitchToLogin={mockOnSwitchToLogin} />);

      expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should allow user to type in all form fields', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      expect(emailInput.value).toBe('newuser@example.com');
      expect(passwordInput.value).toBe('password123');
      expect(confirmPasswordInput.value).toBe('password123');
    });

    it('should call onSwitchToLogin when switch button is clicked', async () => {
      const user = userEvent.setup();
      render(<SignupForm onSwitchToLogin={mockOnSwitchToLogin} />);

      const switchButton = screen.getByText(/Already have an account/i);
      await user.click(switchButton);

      expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '12345');
      await user.type(confirmPasswordInput, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe('Signup Flow', () => {
    it('should call signUp with correct data on successful validation', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });

      render(<SignupForm initialRole="client" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123',
          'client'
        );
      });
    });

    it('should call onSignupSuccess callback on successful signup', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({ error: null });

      render(
        <SignupForm
          initialRole="ambassador"
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'newambassador@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSignupSuccess).toHaveBeenCalledWith('ambassador');
      });
    });

    it('should show loading state during signup', async () => {
      const user = userEvent.setup();
      let resolveSignUp: (value: unknown) => void;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      mockSignUp.mockReturnValue(signUpPromise as Promise<{ error: string | null }>);

      render(<SignupForm initialRole="client" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/signing up/i)).toBeInTheDocument();

      // Resolve the promise
      resolveSignUp!({ error: null });

      await waitFor(() => {
        expect(screen.getByText(/sign up$/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error on failed signup with duplicate email', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({
        error: { message: 'User already registered' },
      });

      render(<SignupForm initialRole="client" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/User already registered/i)).toBeInTheDocument();
      });

      expect(mockOnSignupSuccess).not.toHaveBeenCalled();
    });

    it('should show error on invalid email format', async () => {
      const user = userEvent.setup();
      mockSignUp.mockResolvedValue({
        error: { message: 'Invalid email format' },
      });

      render(<SignupForm initialRole="client" />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      // Use a valid email format to bypass HTML5 validation, but mock backend error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      let resolveSignUp: (value: unknown) => void;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      mockSignUp.mockReturnValue(signUpPromise as Promise<{ error: string | null }>);

      render(<SignupForm initialRole="client" />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign up/i }) as HTMLButtonElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      // All form elements should be disabled during submission
      expect(emailInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
      expect(confirmPasswordInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);

      // Resolve the promise
      resolveSignUp!({ error: null });

      await waitFor(() => {
        expect(submitButton.disabled).toBe(false);
      });
    });
  });
});

