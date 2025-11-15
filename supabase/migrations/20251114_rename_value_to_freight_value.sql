-- Renomear coluna value para freight_value na tabela trips
-- Isso alinha o banco de dados com o código TypeScript existente

-- Verificar se a coluna 'value' existe antes de renomear
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trips'
      AND column_name = 'value'
  ) THEN
    ALTER TABLE trips RENAME COLUMN value TO freight_value;
    RAISE NOTICE 'Coluna renomeada de value para freight_value';
  ELSE
    RAISE NOTICE 'Coluna value não existe, verificando se freight_value já existe';
  END IF;

  -- Se freight_value não existir, criar
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trips'
      AND column_name = 'freight_value'
  ) THEN
    ALTER TABLE trips ADD COLUMN freight_value NUMERIC;
    RAISE NOTICE 'Coluna freight_value criada';
  END IF;
END $$;

COMMENT ON COLUMN trips.freight_value IS 'Valor do frete/serviço';
