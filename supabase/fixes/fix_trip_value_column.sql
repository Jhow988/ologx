-- Verificar se trip_value existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name IN ('trip_value', 'value', 'estimated_value');

-- Se trip_value não existir, criar
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_value NUMERIC(10, 2) DEFAULT 0;

-- Ou se preferir renomear uma coluna existente
-- ALTER TABLE trips RENAME COLUMN estimated_value TO trip_value;

-- Verificar novamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name LIKE '%value%';
