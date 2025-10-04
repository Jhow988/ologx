-- Atualizar status de todos os motoristas para 'active'
UPDATE profiles
SET status = 'active'
WHERE role = 'driver';

-- Verificar motoristas após update
SELECT id, full_name, role, status, company_id, email
FROM profiles
WHERE role = 'driver';

-- Ver todos os usuários para debug
SELECT id, full_name, role, status, company_id
FROM profiles
ORDER BY role, full_name;
