import { supabase } from '@/lib/supabase';

// Since the bids table requires ambassador_id, we'll store campaigns
// as a special bid with a null ambassador_id workaround
// In a real implementation, you'd want a separate campaigns table

export interface CampaignData {
  id?: string;
  client_id: string;
  title: string;
  description: string;
  budget: string;
  timeline: string;
  requirements: string[];
  targetNiches: string[];
  campaignType: string;
  deliverables: string[];
}

export const campaignService = {
  async createCampaign(campaignData: CampaignData) {
    try {
      // For now, we'll store campaign data as JSON in the requirements field
      // and use a placeholder ambassador_id. In production, you'd want a proper campaigns table.

      const campaignMetadata = {
        targetNiches: campaignData.targetNiches,
        campaignType: campaignData.campaignType,
        deliverables: campaignData.deliverables,
        requirements: campaignData.requirements
      };

      // Create a unique placeholder ID for campaigns without ambassadors
      const CAMPAIGN_PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

      const { data: campaign, error } = await supabase
        .from('bids')
        .insert({
          client_id: campaignData.client_id,
          ambassador_id: CAMPAIGN_PLACEHOLDER_ID, // Placeholder for open campaigns
          campaign_title: campaignData.title,
          campaign_description: campaignData.description,
          budget: parseFloat(campaignData.budget.replace(/[^0-9.-]/g, '')) || null,
          timeline: campaignData.timeline,
          requirements: JSON.stringify(campaignMetadata), // Store additional data as JSON
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        return { error };
      }

      return { data: campaign, error: null };
    } catch (error) {
      console.error('Unexpected error creating campaign:', error);
      return { error };
    }
  },

  async getCampaignsForClient(clientId: string) {
    try {
      const CAMPAIGN_PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('client_id', clientId)
        .eq('ambassador_id', CAMPAIGN_PLACEHOLDER_ID) // Only get open campaigns
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching campaigns:', error);
      return { data: [], error };
    }
  }
};