-- Adicionar campo hidden à tabela trips para permitir ocultar serviços dos relatórios
ALTER TABLE trips ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- Adicionar campos de email enviado (se não existirem)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Adicionar comentários
COMMENT ON COLUMN trips.hidden IS 'Indica se o serviço está oculto dos relatórios';
COMMENT ON COLUMN trips.email_sent IS 'Indica se o email com anexos foi enviado';
COMMENT ON COLUMN trips.email_sent_at IS 'Data e hora do envio do email';
