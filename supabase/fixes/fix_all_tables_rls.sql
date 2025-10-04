-- ============================================
-- ADICIONAR RLS PERMISSIVO PARA TODAS AS TABELAS
-- ============================================

-- Lista de todas as tabelas que precisam de políticas permissivas
DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'profiles',
        'vehicles',
        'clients',
        'trips',
        'companies',
        'maintenances',
        'financial_categories',
        'financial_records',
        'custom_roles'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Verificar se a tabela existe
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
            -- Habilitar RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

            -- Remover política antiga se existir
            EXECUTE format('DROP POLICY IF EXISTS "%s_temp_all" ON %I', table_name, table_name);

            -- Criar política permissiva
            EXECUTE format('
                CREATE POLICY "%s_temp_all"
                ON %I
                FOR ALL
                TO authenticated
                USING (true)
                WITH CHECK (true)
            ', table_name, table_name);

            RAISE NOTICE 'Política criada para tabela: %', table_name;
        ELSE
            RAISE NOTICE 'Tabela não existe: %', table_name;
        END IF;
    END LOOP;
END $$;
