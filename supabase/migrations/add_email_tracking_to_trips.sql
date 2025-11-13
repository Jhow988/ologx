-- ================================================
-- ADICIONAR CAMPOS DE RASTREAMENTO DE EMAIL
-- Adiciona campos para rastrear envio de emails aos clientes
-- ================================================

-- Adicionar campos à tabela trips
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Comentários explicativos
COMMENT ON COLUMN trips.email_sent IS 'Indica se os anexos foram enviados por email ao cliente';
COMMENT ON COLUMN trips.email_sent_at IS 'Data e hora do envio do email';

-- Criar índice para facilitar consultas
CREATE INDEX IF NOT EXISTS idx_trips_email_sent ON trips(email_sent);
