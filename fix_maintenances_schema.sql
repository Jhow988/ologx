-- Script para corrigir o schema da tabela maintenances
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna title se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='maintenances' AND column_name='title') THEN
        ALTER TABLE maintenances ADD COLUMN title text NOT NULL DEFAULT 'Manutenção';
    END IF;
END $$;

-- Renomear scheduled_date para start_date se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='maintenances' AND column_name='scheduled_date') THEN
        ALTER TABLE maintenances RENAME COLUMN scheduled_date TO start_date;
    END IF;
END $$;

-- Renomear completed_date para end_date se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='maintenances' AND column_name='completed_date') THEN
        ALTER TABLE maintenances RENAME COLUMN completed_date TO end_date;
    END IF;
END $$;

-- Adicionar coluna next_maintenance_reminder se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='maintenances' AND column_name='next_maintenance_reminder') THEN
        ALTER TABLE maintenances ADD COLUMN next_maintenance_reminder timestamptz;
    END IF;
END $$;

-- Verificar o resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'maintenances'
ORDER BY ordinal_position;
