-- =================================================
-- CRITICAL DATABASE INDEXES MIGRATION
-- =================================================
-- This migration adds essential indexes for query performance
-- Without these indexes, the application will be unusable with any real data load

-- =================================================
-- FOREIGN KEY INDEXES (CRITICAL)
-- =================================================

-- Ambassador profiles - user_id is used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_user_id 
ON ambassador_profiles(user_id);

-- Client profiles - user_id is used in WHERE clauses  
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id 
ON client_profiles(user_id);

-- Campaigns - client_id is used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id 
ON campaigns(client_id);

-- Campaign ambassadors - both foreign keys are used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_campaign_ambassadors_campaign_id 
ON campaign_ambassadors(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_ambassadors_ambassador_id 
ON campaign_ambassadors(ambassador_id);

CREATE INDEX IF NOT EXISTS idx_campaign_ambassadors_chat_room_id 
ON campaign_ambassadors(chat_room_id);

-- Chat participants - both foreign keys are used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_room_id 
ON chat_participants(chat_room_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id 
ON chat_participants(user_id);

-- Messages - chat_room_id and sender_id are used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id 
ON messages(chat_room_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON messages(sender_id);

-- Portfolios - ambassador_id and client_id are used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_portfolios_ambassador_id 
ON portfolios(ambassador_id);

CREATE INDEX IF NOT EXISTS idx_portfolios_client_id 
ON portfolios(client_id);

-- Instagram connections - ambassador_id is used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_instagram_connections_ambassador_id 
ON instagram_connections(ambassador_id);

-- Contracts - both foreign keys are used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_contracts_campaign_ambassador_id 
ON contracts(campaign_ambassador_id);

CREATE INDEX IF NOT EXISTS idx_contracts_client_id 
ON contracts(client_id);

-- =================================================
-- QUERY PERFORMANCE INDEXES
-- =================================================

-- Chat rooms - created_by is used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by 
ON chat_rooms(created_by);

-- Messages - created_at is used for ordering and filtering
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at);

-- Campaigns - status is used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_campaigns_status 
ON campaigns(status);

-- Campaign ambassadors - status is used in WHERE clauses
CREATE INDEX IF NOT EXISTS idx_campaign_ambassadors_status 
ON campaign_ambassadors(status);

-- =================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =================================================

-- For finding messages in a chat room ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_created_at 
ON messages(chat_room_id, created_at);

-- For finding campaign ambassadors by campaign and status
CREATE INDEX IF NOT EXISTS idx_campaign_ambassadors_campaign_status 
ON campaign_ambassadors(campaign_id, status);

-- For finding campaigns by client and status
CREATE INDEX IF NOT EXISTS idx_campaigns_client_status 
ON campaigns(client_id, status);

-- =================================================
-- END OF MIGRATION
-- =================================================
