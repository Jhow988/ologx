-- Verificar todas as tabelas e suas políticas RLS
SELECT
    tablename,
    CASE
        WHEN rowsecurity THEN 'HABILITADO'
        ELSE 'DESABILITADO'
    END as rls_status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas existentes
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Contar registros nas tabelas principais
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'trips', COUNT(*) FROM trips;

-- Ver dados de motoristas
SELECT id, full_name, role, company_id
FROM profiles
WHERE role = 'driver';

-- Ver dados de veículos
SELECT id, plate, model, company_id, status
FROM vehicles;
