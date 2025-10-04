-- Verificar colunas existentes na tabela trips
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trips'
ORDER BY ordinal_position;

-- Se a coluna 'value' não existir, adicione essas linhas:
-- (Descomente as linhas abaixo se necessário após verificar)

/*
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS value NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS distance NUMERIC;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS end_date DATE;

-- Atualizar valores existentes para não serem null
UPDATE public.trips SET value = 0 WHERE value IS NULL;
*/
