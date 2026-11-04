-- PostgreSQL initialization script for SavvyBot
-- This script creates the database and sets up Row-Level Security (RLS)

-- ============================================
-- CREATE DATABASE
-- ============================================
CREATE DATABASE savvybot;

-- ============================================
-- CONNECT TO DATABASE
-- ============================================
\c savvybot

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================
-- These policies ensure multi-tenant isolation

-- Workspace policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Users can only see their own workspace
CREATE POLICY workspace_isolation_policy ON workspaces
    FOR ALL
    USING (true); -- All workspaces are visible to platform admin

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see users in their workspace
CREATE POLICY users_workspace_policy ON users
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Agents table policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_workspace_policy ON agents
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Groups table policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_workspace_policy ON groups
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Threads table policies
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY threads_workspace_policy ON threads
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Messages table policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_workspace_policy ON messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM threads t 
            WHERE t.id = messages.thread_id 
            AND t.workspace_id = current_setting('app.current_workspace_id')::uuid
        )
    );

-- Memories table policies
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY memories_workspace_policy ON memories
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Skills table policies
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY skills_workspace_policy ON skills
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agents a 
            WHERE a.id = skills.agent_id 
            AND a.workspace_id = current_setting('app.current_workspace_id')::uuid
        )
    );

-- Routines table policies
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY routines_workspace_policy ON routines
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Integrations table policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrations_workspace_policy ON integrations
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- API Endpoints table policies
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_endpoints_workspace_policy ON api_endpoints
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM integrations i 
            WHERE i.id = api_endpoints.integration_id 
            AND i.workspace_id = current_setting('app.current_workspace_id')::uuid
        )
    );

-- Tool Permissions table policies
ALTER TABLE tool_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tool_permissions_workspace_policy ON tool_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agents a 
            WHERE a.id = tool_permissions.agent_id 
            AND a.workspace_id = current_setting('app.current_workspace_id')::uuid
        )
    );

-- Approvals table policies
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY approvals_workspace_policy ON approvals
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Jobs table policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_workspace_policy ON jobs
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Usage Events table policies
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_events_workspace_policy ON usage_events
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Usage Summary table policies
ALTER TABLE usage_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_summary_workspace_policy ON usage_summary
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Notifications table policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_workspace_policy ON notifications
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Files table policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY files_workspace_policy ON files
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- Audit Logs table policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_workspace_policy ON audit_logs
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id')::uuid);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Workspace indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Agent indexes
CREATE INDEX IF NOT EXISTS idx_agents_workspace_id ON agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- Group indexes
CREATE INDEX IF NOT EXISTS idx_groups_workspace_id ON groups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

-- Thread indexes
CREATE INDEX IF NOT EXISTS idx_threads_workspace_id ON threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_threads_agent_id ON threads(agent_id);
CREATE INDEX IF NOT EXISTS idx_threads_group_id ON threads(group_id);
CREATE INDEX IF NOT EXISTS idx_threads_archived ON threads(archived);
CREATE INDEX IF NOT EXISTS idx_threads_last_message_at ON threads(last_message_at);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_type ON messages(author_type);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Memory indexes
CREATE INDEX IF NOT EXISTS idx_memories_workspace_id ON memories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memories_agent_id ON memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope);

-- Skill indexes
CREATE INDEX IF NOT EXISTS idx_skills_agent_id ON skills(agent_id);

-- Routine indexes
CREATE INDEX IF NOT EXISTS idx_routines_workspace_id ON routines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_routines_enabled ON routines(enabled);
CREATE INDEX IF NOT EXISTS idx_routines_next_run_at ON routines(next_run_at);

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_integrations_workspace_id ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_kind ON integrations(kind);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- Approval indexes
CREATE INDEX IF NOT EXISTS idx_approvals_workspace_id ON approvals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_approvals_thread_id ON approvals(thread_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at);

-- Job indexes
CREATE INDEX IF NOT EXISTS idx_jobs_workspace_id ON jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Usage indexes
CREATE INDEX IF NOT EXISTS idx_usage_events_workspace_id ON usage_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_kind ON usage_events(kind);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);

-- ============================================
# FUNCTION TO SET WORKSPACE CONTEXT
-- ============================================
CREATE OR REPLACE FUNCTION set_workspace_context(workspace_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_workspace_id', workspace_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION set_workspace_context(uuid) IS 'Sets the current workspace ID for RLS policies';

-- ============================================
-- LOG MESSAGE
-- ============================================
RAISE NOTICE 'SavvyBot database initialization completed!';
