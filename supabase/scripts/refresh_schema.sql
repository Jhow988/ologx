-- Forçar atualização do schema do Supabase
-- Execute este SQL e aguarde alguns segundos

-- Opção 1: Recriar a coluna (se não houver dados importantes)
ALTER TABLE trips DROP COLUMN IF EXISTS trip_value CASCADE;
ALTER TABLE trips ADD COLUMN trip_value NUMERIC(10, 2) DEFAULT 0;

-- Opção 2: Notificar o Supabase (trigger dummy)
CREATE OR REPLACE FUNCTION notify_schema_change()
RETURNS void AS $$
BEGIN
  PERFORM pg_notify('schema_change', 'trips');
END;
$$ LANGUAGE plpgsql;

SELECT notify_schema_change();

-- Verificar se a coluna está visível
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trips' AND column_name = 'trip_value';
