-- Adicionar coluna licensing_due_date na tabela vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS licensing_due_date date;

-- Adicionar comentário explicativo
COMMENT ON COLUMN vehicles.licensing_due_date IS 'Data de vencimento do licenciamento do veículo';
