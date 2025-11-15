-- Renomear coluna value para freight_value na tabela trips
-- Isso alinha o banco de dados com o código TypeScript existente

ALTER TABLE trips RENAME COLUMN value TO freight_value;

COMMENT ON COLUMN trips.freight_value IS 'Valor do frete/serviço';
