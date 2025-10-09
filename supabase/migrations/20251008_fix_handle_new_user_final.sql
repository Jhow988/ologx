-- Correção FINAL da função handle_new_user
-- Esta função agora não faz nada, deixando o código criar profiles manualmente

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Não fazer nada - o código agora cria profiles manualmente
  -- Isso evita conflitos e permite controle total sobre company_id e role
  RETURN new;
END;
$$;

-- IMPORTANTE: Execute este SQL no painel do Supabase para corrigir o problema
-- de "Database error creating new user"
