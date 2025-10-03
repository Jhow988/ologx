# Políticas de Row Level Security (RLS) - Supabase

Este documento contém as políticas de segurança que você deve configurar no Supabase para garantir que os usuários só vejam dados da sua empresa.

## ⚠️ IMPORTANTE

Execute estes comandos SQL no **SQL Editor** do painel do Supabase.

## 1. Habilitar RLS em todas as tabelas

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
```

## 2. Policies para PROFILES

```sql
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Usuários podem ver outros usuários da mesma empresa
CREATE POLICY "Users can view company profiles"
ON profiles FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 3. Policies para COMPANIES

```sql
-- Usuários podem ver sua própria empresa
CREATE POLICY "Users can view own company"
ON companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Super admins podem ver todas as empresas
CREATE POLICY "Super admins can view all companies"
ON companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Super admins podem atualizar empresas
CREATE POLICY "Super admins can update companies"
ON companies FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

## 4. Policies para CLIENTS

```sql
-- Usuários podem ver clientes da sua empresa
CREATE POLICY "Users can view company clients"
ON clients FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem criar clientes na sua empresa
CREATE POLICY "Users can insert company clients"
ON clients FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar clientes da sua empresa
CREATE POLICY "Users can update company clients"
ON clients FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar clientes da sua empresa
CREATE POLICY "Users can delete company clients"
ON clients FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 5. Policies para VEHICLES

```sql
-- Usuários podem ver veículos da sua empresa
CREATE POLICY "Users can view company vehicles"
ON vehicles FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem criar veículos na sua empresa
CREATE POLICY "Users can insert company vehicles"
ON vehicles FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar veículos da sua empresa
CREATE POLICY "Users can update company vehicles"
ON vehicles FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar veículos da sua empresa
CREATE POLICY "Users can delete company vehicles"
ON vehicles FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 6. Policies para TRIPS

```sql
-- Usuários podem ver viagens da sua empresa
CREATE POLICY "Users can view company trips"
ON trips FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem criar viagens na sua empresa
CREATE POLICY "Users can insert company trips"
ON trips FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar viagens da sua empresa
CREATE POLICY "Users can update company trips"
ON trips FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar viagens da sua empresa
CREATE POLICY "Users can delete company trips"
ON trips FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 7. Policies para MAINTENANCES

```sql
-- Usuários podem ver manutenções da sua empresa
CREATE POLICY "Users can view company maintenances"
ON maintenances FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem criar manutenções na sua empresa
CREATE POLICY "Users can insert company maintenances"
ON maintenances FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar manutenções da sua empresa
CREATE POLICY "Users can update company maintenances"
ON maintenances FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar manutenções da sua empresa
CREATE POLICY "Users can delete company maintenances"
ON maintenances FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 8. Policies para FINANCIAL_CATEGORIES

```sql
-- Usuários podem ver categorias da sua empresa
CREATE POLICY "Users can view company categories"
ON financial_categories FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem criar categorias na sua empresa
CREATE POLICY "Users can insert company categories"
ON financial_categories FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar categorias da sua empresa
CREATE POLICY "Users can delete company categories"
ON financial_categories FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 9. Policies para FINANCIAL_SUBCATEGORIES

```sql
-- Usuários podem ver subcategorias da sua empresa
CREATE POLICY "Users can view company subcategories"
ON financial_subcategories FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem criar subcategorias na sua empresa
CREATE POLICY "Users can insert company subcategories"
ON financial_subcategories FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar subcategorias da sua empresa
CREATE POLICY "Users can delete company subcategories"
ON financial_subcategories FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 10. Policies para FINANCIAL_RECORDS

```sql
-- Usuários podem ver registros financeiros da sua empresa
CREATE POLICY "Users can view company financial records"
ON financial_records FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem criar registros financeiros na sua empresa
CREATE POLICY "Users can insert company financial records"
ON financial_records FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar registros financeiros da sua empresa
CREATE POLICY "Users can update company financial records"
ON financial_records FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- Usuários podem deletar registros financeiros da sua empresa
CREATE POLICY "Users can delete company financial records"
ON financial_records FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 🔒 Como Aplicar

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole e execute cada bloco de comandos acima
4. Verifique se não há erros

## 🧪 Como Testar

Depois de aplicar as políticas:

1. Faça login com um usuário
2. Tente buscar dados - deve ver apenas dados da sua empresa
3. Tente criar dados - deve funcionar apenas para sua empresa
4. Tente acessar dados de outra empresa - deve retornar vazio

## ⚡ Função Helper (Opcional)

Você pode criar uma função helper para simplificar as policies:

```sql
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;
```

Depois disso, você pode simplificar as policies usando:

```sql
USING (company_id = get_my_company_id())
```

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
