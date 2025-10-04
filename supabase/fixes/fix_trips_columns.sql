-- Adicionar colunas que faltam na tabela trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cte TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS nf TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS requester TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS freight_type TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS insurance_info TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS description TEXT;

-- Verificar todas as colunas após adicionar
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trips'
ORDER BY ordinal_position;
