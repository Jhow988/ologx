/*
# [Schema Inicial para Multi-Tenancy e Autenticação]
Este script de migração estabelece as tabelas e políticas de segurança fundamentais para uma aplicação multiempresa. Ele cria tabelas para `companies` (empresas) e `profiles` (perfis de usuário), e implementa a Segurança em Nível de Linha (RLS) para garantir que os usuários só possam acessar os dados pertencentes à sua própria empresa. Inclui também um gatilho para criar automaticamente uma nova empresa e um perfil de usuário quando um novo usuário se cadastra.

## Descrição da Query: [Este script estabelece a estrutura central do banco de dados. Ele foi projetado para ser executado em um projeto novo e não visa modificar dados de usuários existentes. Ele cria novas tabelas (`companies`, `profiles`), habilita a Segurança em Nível de Linha e configura um gatilho automatizado para a criação de perfis de usuário. Esta é uma mudança estrutural crítica.]

## Metadados:
- Categoria do Schema: "Estrutural"
- Nível de Impacto: "Alto"
- Requer Backup: false
- Reversível: false

## Detalhes da Estrutura:
- Tabelas Criadas: `public.companies`, `public.profiles`
- Gatilhos Criados: `on_auth_user_created` na tabela `auth.users`
- Funções Criadas: `public.handle_new_user`
- Políticas de RLS: Habilitadas em `companies` e `profiles` com regras de multiempresa.

## Implicações de Segurança:
- Status de RLS: Habilitado
- Mudanças de Política: Sim, novas políticas são criadas para impor o isolamento de dados entre os inquilinos.
- Requisitos de Autenticação: Este schema se integra diretamente com o sistema de Autenticação do Supabase.

## Impacto no Desempenho:
- Índices: Chaves primárias e estrangeiras são indexadas.
- Gatilhos: Um gatilho é adicionado à tabela `auth.users`, que será executado em cada novo cadastro de usuário.
- Impacto Estimado: Baixo impacto no desempenho de leitura/escrita para operações existentes. O cadastro terá uma pequena sobrecarga devido ao gatilho.
*/

-- 1. Tabela de Empresas
-- Armazena informações sobre cada empresa inquilina.
CREATE TABLE public.companies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT companies_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.companies IS 'Armazena informações para cada empresa inquilina.';

-- 2. Tabela de Perfis
-- Estende auth.users com dados específicos da aplicação.
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    full_name text NULL,
    role text NOT NULL DEFAULT 'admin'::text,
    is_super_admin boolean NOT NULL DEFAULT false,
    updated_at timestamp with time zone NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles IS 'Armazena dados de usuário específicos da aplicação, vinculados a auth.users.';


-- 3. Habilita RLS para as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para Empresas
CREATE POLICY "Super Admins podem ver todas as empresas" ON public.companies FOR SELECT USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Usuários podem ver sua própria empresa" ON public.companies FOR SELECT USING (
  id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- 5. Políticas de RLS para Perfis
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (
  auth.uid() = id
);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (
  auth.uid() = id
);
CREATE POLICY "Admins podem ver perfis em sua empresa" ON public.profiles FOR SELECT USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'manager')
);
CREATE POLICY "Super Admins podem gerenciar todos os perfis" ON public.profiles FOR ALL USING (
  (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid())
);


-- 6. Função para criar uma empresa e perfil no cadastro de um novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Cria uma nova empresa para o novo usuário
  INSERT INTO public.companies (name)
  VALUES (COALESCE(new.raw_user_meta_data->>'company_name', 'Minha Empresa'))
  RETURNING id INTO new_company_id;

  -- Cria um perfil para o novo usuário, vinculando-o à nova empresa
  INSERT INTO public.profiles (id, company_id, full_name, role, is_super_admin)
  VALUES (
    new.id,
    new_company_id,
    new.raw_user_meta_data->>'full_name',
    'admin', -- O primeiro usuário de uma empresa é um administrador
    false
  );
  RETURN new;
END;
$$;

-- 7. Gatilho para chamar a função na criação de um novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
