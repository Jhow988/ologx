-- Mostrar TODAS as colunas da tabela trips
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trips'
ORDER BY ordinal_position;
