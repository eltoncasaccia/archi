-- =============================================================================
-- Archi — Database Setup
-- Run this in Supabase Dashboard → SQL Editor
-- Or use the Supabase MCP in Claude Code
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE session_status AS ENUM (
  'awaiting_start',         -- code validated, interview not started
  'interview_in_progress',  -- client is talking with the agent
  'awaiting_approval',      -- agent presented discovery, waiting for client approval
  'pipeline_pending',       -- client approved, pipeline not started yet
  'pipeline_running',       -- pipeline running in background
  'discovery_generated',    -- step 1 complete
  'pricing_generated',      -- step 2 complete
  'phases_generated',       -- step 3 complete
  'proposal_generated',     -- step 4 complete
  'pending_review',         -- pipeline complete, waiting for admin
  'pipeline_error',         -- failure in some step
  'approved',               -- admin approved the send
  'sent'                    -- proposal sent to client
);

CREATE TYPE proposal_status AS ENUM (
  'pending_review',   -- waiting for admin review
  'approved',         -- admin approved
  'sent',             -- email sent to client
  'rejected'          -- admin rejected (do not send)
);

CREATE TYPE notification_type AS ENUM (
  'pipeline_completed',   -- proposal ready for review
  'pipeline_error',       -- pipeline failure
  'proposal_sent'         -- confirmation of send to client
);

-- -----------------------------------------------------------------------------
-- TABLES
-- Order matters: access_codes before sessions (FK dependency)
-- -----------------------------------------------------------------------------

-- access_codes
CREATE TABLE access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    code TEXT UNIQUE NOT NULL,
    session_id UUID,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sessions
CREATE TABLE sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code          TEXT REFERENCES access_codes(code),
  status               session_status NOT NULL DEFAULT 'awaiting_start',

-- Client data (collected during interview)
client_name TEXT, client_email TEXT,

-- Pipeline blocks (filled progressively)
discovery_approved TEXT,
discovery_summary TEXT,
pricing_summary TEXT,
phases_plan TEXT,
proposal_metadata TEXT,

-- Error tracking
error_step TEXT, error_message TEXT,

-- Client identification (collected during interview)
client_document TEXT, -- CPF or CNPJ

-- Rate limiting (ADR-009)
message_count        INTEGER NOT NULL DEFAULT 0,
  input_tokens         INTEGER NOT NULL DEFAULT 0,

  -- Session lifecycle
  expires_at           TIMESTAMPTZ,          -- absolute 2h expiry, set on creation
  last_activity_at     TIMESTAMPTZ,          -- updated on every client interaction

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- messages
-- Stores the full conversation history between client and agent
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    session_id UUID REFERENCES sessions (id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from access_codes to sessions (deferred — sessions table now exists)
ALTER TABLE access_codes
ADD CONSTRAINT fk_access_codes_session FOREIGN KEY (session_id) REFERENCES sessions (id);

-- proposals
CREATE TABLE proposals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID REFERENCES sessions(id) NOT NULL,

-- Generated files (Supabase Storage URLs)
docx_url TEXT, pdf_url TEXT,

-- Admin-editable fields before generating documents
total_price NUMERIC(12, 2),
total_days INTEGER,
validity_days INTEGER DEFAULT 30,
admin_notes TEXT,

-- Status and delivery
status proposal_status NOT NULL DEFAULT 'pending_review',
sent_at TIMESTAMPTZ,

-- Client data (copied from session to avoid JOIN)
client_name    TEXT,
  client_email   TEXT,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    session_id UUID REFERENCES sessions (id),
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- TRIGGER: updated_at
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_sessions_status ON sessions (status);

CREATE INDEX idx_sessions_access_code ON sessions (access_code);

CREATE INDEX idx_proposals_session_id ON proposals (session_id);

CREATE INDEX idx_proposals_status ON proposals (status);

CREATE INDEX idx_notifications_read ON notifications (read);

CREATE INDEX idx_notifications_session ON notifications (session_id);

CREATE INDEX idx_messages_session_id ON messages (session_id);

CREATE INDEX idx_messages_created_at ON messages (session_id, created_at);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated) can read all rows
CREATE POLICY admin_select_messages   ON messages   FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_select_sessions   ON sessions   FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_select_proposals  ON proposals  FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_update_proposals  ON proposals  FOR UPDATE TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- STORAGE BUCKET
-- Run this separately if not using Supabase MCP
-- Create bucket named "proposals" in Supabase Dashboard → Storage
-- Set to public or configure RLS as needed
-- -----------------------------------------------------------------------------

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('proposals', 'proposals', true);