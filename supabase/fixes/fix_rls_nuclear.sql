-- ============================================
-- FIX RLS NUCLEAR - REMOVE TUDO E RECRIA
-- ============================================

-- 1. DESABILITAR RLS EM TODAS AS TABELAS DO SCHEMA PUBLIC
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'RLS desabilitado em: %', r.tablename;
    END LOOP;
END $$;

-- 2. REMOVER TODAS AS POLÍTICAS RLS DO SCHEMA PUBLIC
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Política removida: %.%.%', r.schemaname, r.tablename, r.policyname;
    END LOOP;
END $$;

-- 3. REMOVER TODAS AS FUNÇÕES CUSTOMIZADAS
DROP FUNCTION IF EXISTS public.get_user_company_id() CASCADE;
DROP FUNCTION IF EXISTS auth.jwt_company_id() CASCADE;

-- 4. REABILITAR RLS E CRIAR POLÍTICAS PERMISSIVAS
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
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

            -- Criar política ULTRA permissiva
            EXECUTE format('
                CREATE POLICY "%s_allow_all"
                ON public.%I
                FOR ALL
                TO public
                USING (true)
                WITH CHECK (true)
            ', table_name, table_name);

            RAISE NOTICE 'RLS configurado para: %', table_name;
        END IF;
    END LOOP;
END $$;

-- 5. GARANTIR que autenticados podem fazer queries
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
