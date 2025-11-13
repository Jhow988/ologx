-- Migration: Create activity_logs table
-- Description: Tabela para rastreamento de todas as atividades dos usuários no sistema
-- Author: Claude Code
-- Date: 2025-01-13

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'view')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vehicle', 'client', 'trip', 'user', 'financial', 'maintenance', 'company', 'profile')),
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- Create composite index for common query patterns
CREATE INDEX idx_activity_logs_company_user_date ON activity_logs(company_id, user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view activity logs from their own company
CREATE POLICY activity_logs_select_policy ON activity_logs
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Only allow inserts for authenticated users in their company
CREATE POLICY activity_logs_insert_policy ON activity_logs
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- No update or delete policies - activity logs should be immutable for audit purposes

-- Create a function to automatically log activities
CREATE OR REPLACE FUNCTION log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
  v_user_name TEXT;
  v_company_id UUID;
BEGIN
  -- Get user info from profiles
  SELECT full_name, company_id INTO v_user_name, v_company_id
  FROM profiles
  WHERE id = auth.uid();

  -- Insert activity log
  INSERT INTO activity_logs (
    company_id,
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_company_id,
    auth.uid(),
    COALESCE(v_user_name, 'Unknown User'),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to table
COMMENT ON TABLE activity_logs IS 'Armazena todas as atividades realizadas pelos usuários no sistema para auditoria e rastreamento';

-- Add comments to columns
COMMENT ON COLUMN activity_logs.company_id IS 'ID da empresa à qual a atividade pertence';
COMMENT ON COLUMN activity_logs.user_id IS 'ID do usuário que realizou a atividade';
COMMENT ON COLUMN activity_logs.user_name IS 'Nome do usuário no momento da ação';
COMMENT ON COLUMN activity_logs.action IS 'Tipo de ação: create, update, delete, login, logout, view';
COMMENT ON COLUMN activity_logs.entity_type IS 'Tipo de entidade afetada';
COMMENT ON COLUMN activity_logs.entity_id IS 'ID da entidade afetada (se aplicável)';
COMMENT ON COLUMN activity_logs.details IS 'Detalhes adicionais da ação em formato JSON';
COMMENT ON COLUMN activity_logs.ip_address IS 'Endereço IP do usuário (para uso futuro)';
COMMENT ON COLUMN activity_logs.user_agent IS 'User agent do navegador (para uso futuro)';
COMMENT ON COLUMN activity_logs.created_at IS 'Data e hora da atividade';
