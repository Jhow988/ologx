/*
  # [Operação Estrutural]
  Cria tabela para rastrear alertas lidos por usuários.

  ## Query Description: [Cria a tabela read_alerts para armazenar quais alertas cada usuário já leu/marcou como lido.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Tabela criada: `public.read_alerts`
  - Colunas: user_id, alert_id, read_at

  ## Security Implications:
  - RLS Status: Habilitado
  - Policy Changes: Sim, políticas para acesso restrito por usuário
  - Auth Requirements: Sim

  ## Performance Impact:
  - Indexes: Sim, índice composto em (user_id, alert_id)
  - Triggers: Nenhum
  - Estimated Impact: Baixo impacto na performance.
*/

-- Criar tabela de alertas lidos
CREATE TABLE IF NOT EXISTS public.read_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id text NOT NULL,
  read_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_user_alert UNIQUE (user_id, alert_id)
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_read_alerts_user_id ON public.read_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_read_alerts_alert_id ON public.read_alerts(alert_id);

-- Habilitar RLS
ALTER TABLE public.read_alerts ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios alertas lidos
CREATE POLICY "Users can view their own read alerts" ON public.read_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem marcar seus próprios alertas como lidos
CREATE POLICY "Users can mark their own alerts as read" ON public.read_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios registros de alertas lidos
CREATE POLICY "Users can delete their own read alerts" ON public.read_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentário na tabela
COMMENT ON TABLE public.read_alerts IS 'Armazena quais alertas cada usuário já leu/visualizou.';
