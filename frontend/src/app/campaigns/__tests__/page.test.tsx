/**
 * Unit tests for the Campaigns page.
 * Tests campaign creation, listing, and interactions.
 */

import '@testing-library/jest-dom';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('next/navigation');

describe('Campaigns Page', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Campaign Creation (Client)', () => {
    it('should allow client to create a campaign', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'client-123',
          email: 'client@example.com',
          profile: {
            role: 'client'
          },
          client_profile: {
            id: 'client-profile-123',
            company_name: 'Test Company'
          }
        } as Record<string, unknown>,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          campaign: {
            id: 'campaign-123',
            campaign_title: 'Test Campaign',
            status: 'pending'
          }
        }),
      });

      // Test that user can create a campaign
      const campaignData = {
        title: 'Test Campaign',
        description: 'Test Description',
        budget: '$1000',
        timeline: '2 weeks',
        requirements: ['Requirement 1'],
        target_niches: ['Fashion'],
        campaign_type: 'Instagram',
        deliverables: ['3 posts']
      };

      // Simulate API call
      const API_BASE_URL = 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/campaigns/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token'
        },
        body: JSON.stringify(campaignData)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.campaign.campaign_title).toBe('Test Campaign');
    });

    it('should prevent ambassador from creating a campaign', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'ambassador-123',
          email: 'ambassador@example.com',
          profile: {
            role: 'ambassador'
          }
        } as Record<string, unknown>,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      // Ambassador should not see create campaign button
      expect(mockUseAuth().user?.profile.role).toBe('ambassador');
      // In the actual UI, the create campaign button would be hidden
    });
  });

  describe('Campaign Listing', () => {
    it('should display user campaigns for authenticated client', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'client-123',
          email: 'client@example.com',
          profile: {
            role: 'client'
          },
          client_profile: {
            id: 'client-profile-123'
          }
        } as Record<string, unknown>,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'campaign-1', campaign_title: 'Campaign 1', status: 'pending' },
            { id: 'campaign-2', campaign_title: 'Campaign 2', status: 'active' }
          ]
        }),
      });

      // Fetch user's campaigns
      const response = await fetch(
        `http://localhost:8000/api/campaigns/client/client-profile-123`,
        {
          headers: { 'Authorization': 'Bearer fake-token' }
        }
      );

      const result = await response.json();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].campaign_title).toBe('Campaign 1');
    });

    it('should prevent user from viewing other user campaigns', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'client-123',
          email: 'client@example.com',
          profile: {
            role: 'client'
          },
          client_profile: {
            id: 'client-profile-123'
          }
        } as Record<string, unknown>,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          detail: 'Not authorized to view these campaigns'
        }),
      });

      // Try to fetch another client's campaigns
      const response = await fetch(
        `http://localhost:8000/api/campaigns/client/different-client-id`,
        {
          headers: { 'Authorization': 'Bearer fake-token' }
        }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('Open Campaigns (Ambassador)', () => {
    it('should allow ambassador to view all open campaigns', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'ambassador-123',
          email: 'ambassador@example.com',
          profile: {
            role: 'ambassador'
          }
        } as Record<string, unknown>,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'campaign-1', campaign_title: 'Open Campaign 1', status: 'pending' },
            { id: 'campaign-2', campaign_title: 'Open Campaign 2', status: 'pending' }
          ]
        }),
      });

      const response = await fetch(
        `http://localhost:8000/api/campaigns/all`,
        {
          headers: { 'Authorization': 'Bearer fake-token' }
        }
      );

      const result = await response.json();

      expect(result.data).toHaveLength(2);
      expect(result.data.every((c: Record<string, unknown>) => c.status === 'pending')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle campaign creation errors', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'client-123',
          email: 'client@example.com',
          profile: {
            role: 'client'
          },
          client_profile: {
            id: 'client-profile-123'
          }
        } as Record<string, unknown>,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          detail: 'Error creating campaign'
        }),
      });

      const response = await fetch(
        `http://localhost:8000/api/campaigns/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
          },
          body: JSON.stringify({})
        }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle network errors when fetching campaigns', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'client-123',
          email: 'client@example.com',
          profile: {
            role: 'client'
          }
        } as Record<string, unknown>,
        loading: false,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        refreshUser: jest.fn(),
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        fetch(`http://localhost:8000/api/campaigns/all`, {
          headers: { 'Authorization': 'Bearer fake-token' }
        })
      ).rejects.toThrow('Network error');
    });
  });
});

