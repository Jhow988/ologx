-- Adicionar coluna attachments na tabela trips
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentário na coluna
COMMENT ON COLUMN trips.attachments IS 'Array de objetos JSON com informações dos arquivos anexados';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trips'
  AND column_name = 'attachments';
