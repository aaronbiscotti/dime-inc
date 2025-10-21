/**
 * Unit tests for protected route functionality.
 * Tests authentication guards and redirection logic.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileGuard } from '../ProfileGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('next/navigation');

describe('ProfileGuard (Protected Routes)', () => {
  const mockPush = jest.fn();
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
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
  });

  describe('Authentication Redirect', () => {
    it('should redirect to login if not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        ambassadorProfile: null,
        clientProfile: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProfileGuard>
          <div>Protected Content</div>
        </ProfileGuard>
      );

      expect(mockPush).toHaveBeenCalledWith('/login/client');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading state while authentication is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        profile: null,
        ambassadorProfile: null,
        clientProfile: null,
        loading: true,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProfileGuard>
          <div>Protected Content</div>
        </ProfileGuard>
      );

      // Should not redirect while loading
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: 'user-123', 
          email: 'test@example.com',
        } as Record<string, unknown>,
        profile: { role: 'client' } as Record<string, unknown>,
        clientProfile: { id: 'client-123' } as Record<string, unknown>,
        ambassadorProfile: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProfileGuard>
          <div>Protected Content</div>
        </ProfileGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Role-based Access', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: 'user-123', 
          email: 'client@example.com',
        } as Record<string, unknown>,
        profile: { role: 'client' } as Record<string, unknown>,
        clientProfile: { id: 'client-123' } as Record<string, unknown>,
        ambassadorProfile: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProfileGuard>
          <div>Client Protected Content</div>
        </ProfileGuard>
      );

      expect(screen.getByText('Client Protected Content')).toBeInTheDocument();
    });

    it('should deny access when user has incomplete profile', () => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: 'user-123', 
          email: 'ambassador@example.com',
        } as Record<string, unknown>,
        profile: { role: 'ambassador' } as Record<string, unknown>,
        ambassadorProfile: null, // Incomplete profile
        clientProfile: null,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <ProfileGuard>
          <div>Ambassador Protected Content</div>
        </ProfileGuard>
      );

      expect(screen.queryByText('Ambassador Protected Content')).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith('/login/brand-ambassador');
    });
  });
});

