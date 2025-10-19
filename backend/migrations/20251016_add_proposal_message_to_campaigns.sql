-- Add proposal_message column to campaigns table
-- This column stores a message that ambassadors can see when viewing campaign details

ALTER TABLE campaigns
ADD COLUMN proposal_message TEXT;

-- Add comment to the column for documentation
COMMENT ON COLUMN campaigns.proposal_message IS 'Message shown to ambassadors when they view campaign details and consider applying';

-- Optional: Add an index if we plan to search by this field (uncomment if needed)
-- CREATE INDEX idx_campaigns_proposal_message ON campaigns USING gin(to_tsvector('english', proposal_message));
