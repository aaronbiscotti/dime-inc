-- =====================================================
-- CAMPAIGN TABLES MIGRATION
-- Created: 2024-10-15
-- Description: Creates campaigns and campaign_ambassadors tables
-- =====================================================

-- 1. Create campaign status enum
CREATE TYPE campaign_status AS ENUM (
  'draft',
  'active',
  'completed',
  'cancelled'
);

-- 2. Create campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Who created this campaign
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  
  -- Budget (use min=max for fixed budget)
  budget_min DECIMAL(10, 2) NOT NULL,
  budget_max DECIMAL(10, 2) NOT NULL,
  
  -- Timeline
  deadline TIMESTAMP WITH TIME ZONE,
  
  -- Requirements
  requirements TEXT,
  
  -- Status and metadata
  status campaign_status NOT NULL DEFAULT 'draft',
  max_ambassadors INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create campaign_ambassadors junction table
CREATE TABLE campaign_ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES ambassador_profiles(id) ON DELETE CASCADE,
  
  -- When they were selected
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Their agreed compensation for this campaign
  agreed_budget DECIMAL(10, 2),
  
  -- Status of their work
  status campaign_ambassador_status DEFAULT 'proposal_received',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure an ambassador can't be added to the same campaign twice
  UNIQUE(campaign_id, ambassador_id)
);

-- 4. Create indexes for performance
CREATE INDEX idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_ambassadors_campaign ON campaign_ambassadors(campaign_id);
CREATE INDEX idx_campaign_ambassadors_ambassador ON campaign_ambassadors(ambassador_id);

-- 5. Enable RLS on campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own campaigns
CREATE POLICY "Clients can manage their own campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM client_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM client_profiles WHERE user_id = auth.uid()
    )
  );

-- Ambassadors can view active campaigns
CREATE POLICY "Ambassadors can view active campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- 6. Enable RLS on campaign_ambassadors
ALTER TABLE campaign_ambassadors ENABLE ROW LEVEL SECURITY;

-- Clients can see ambassadors on their campaigns
CREATE POLICY "Clients can view their campaign ambassadors"
  ON campaign_ambassadors
  FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN client_profiles cp ON c.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Ambassadors can see campaigns they're assigned to
CREATE POLICY "Ambassadors can view their campaign assignments"
  ON campaign_ambassadors
  FOR SELECT
  TO authenticated
  USING (
    ambassador_id IN (
      SELECT id FROM ambassador_profiles WHERE user_id = auth.uid()
    )
  );

-- Only clients can add/remove ambassadors from their campaigns
CREATE POLICY "Clients can manage their campaign ambassadors"
  ON campaign_ambassadors
  FOR ALL
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN client_profiles cp ON c.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN client_profiles cp ON c.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- =================================================
-- END OF MIGRATION
-- =====================================================
