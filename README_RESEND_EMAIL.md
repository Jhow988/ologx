# 📧 Integração com Resend - Envio de Anexos de Viagem

## 📋 O que foi implementado

### Sistema de Envio de Emails para Clientes
- ✅ Integração completa com [Resend](https://resend.com)
- ✅ Envio de anexos de viagem por email para clientes
- ✅ Template HTML profissional e responsivo
- ✅ Rastreamento de emails enviados (`email_sent`, `email_sent_at`)
- ✅ Status visual na interface (badge "Enviado")
- ✅ Validação de pré-requisitos (anexos, email do cliente)

## 🚀 Setup Rápido

### 1. Criar conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Verifique seu email

### 2. Obter API Key

1. Acesse o [Dashboard do Resend](https://resend.com/api-keys)
2. Clique em "Create API Key"
3. Dê um nome (ex: "OLogX Development")
4. Copie a chave gerada (começa com `re_`)

### 3. Configurar variável de ambiente

Adicione a chave no seu arquivo `.env`:

```bash
VITE_RESEND_API_KEY=re_sua_chave_aqui
```

### 4. (Opcional) Verificar domínio customizado

**Domínio padrão**: `onboarding@resend.dev` (somente para testes)

Para produção, você deve verificar seu próprio domínio:

1. No dashboard do Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `ologx.com.br`)
4. Adicione os registros DNS fornecidos pelo Resend
5. Aguarde a verificação (pode levar até 72h)

Após verificado, atualize o `from` em [src/services/emailService.ts:121](src/services/emailService.ts#L121):

```typescript
from: 'OLogX <noreply@seu-dominio.com.br>',
```

### 5. Executar migration do banco

Execute a migration para adicionar os campos de rastreamento:

```sql
-- No Supabase SQL Editor
-- Arquivo: supabase/migrations/add_email_tracking_to_trips.sql

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN trips.email_sent IS 'Indica se os anexos foram enviados por email ao cliente';
COMMENT ON COLUMN trips.email_sent_at IS 'Data e hora do envio do email';

CREATE INDEX IF NOT EXISTS idx_trips_email_sent ON trips(email_sent);
```

## 💡 Como Funciona

### Fluxo de envio

```
1. Usuário abre modal de detalhes da viagem
   ↓
2. Clica no botão "Enviar para Cliente"
   ↓
3. Sistema valida:
   - ✅ Viagem possui anexos?
   - ✅ Cliente possui email cadastrado?
   ↓
4. Envia email via Resend com:
   - Detalhes da viagem
   - Lista de anexos com links de download
   - Informações da empresa
   ↓
5. Atualiza banco de dados:
   - email_sent = true
   - email_sent_at = timestamp atual
   ↓
6. Exibe badge "Enviado [data]" no modal
```

### Conteúdo do Email

O email enviado inclui:

- **Saudação personalizada** com nome do cliente
- **Detalhes da viagem**:
  - Origem e destino
  - Data de início e término
  - CT-e e NF (se disponíveis)
- **Tabela de anexos**:
  - Nome do arquivo
  - Tamanho
  - Botão de download
- **Observações** (se houver)
- **Rodapé** com informações da empresa

### Exemplo Visual

![Email enviado](https://via.placeholder.com/600x400/3b82f6/ffffff?text=Email+Template)

## 📂 Arquivos Criados/Modificados

### Novos Arquivos

1. **[src/services/emailService.ts](src/services/emailService.ts)**
   - Serviço de envio de emails com Resend
   - Template HTML responsivo
   - Função `sendTripAttachments()`

2. **[supabase/migrations/add_email_tracking_to_trips.sql](supabase/migrations/add_email_tracking_to_trips.sql)**
   - Migration para campos de rastreamento
   - Índice para performance

### Arquivos Modificados

1. **[src/pages/Viagens.tsx](src/pages/Viagens.tsx)**
   - Importação do serviço de email
   - Estado `sendingEmail`
   - Função `handleSendEmail()` integrada com Resend
   - Estado `companyName` para buscar nome da empresa
   - Botão "Enviar para Cliente"
   - Badge "Enviado" com data

2. **[src/types/index.ts](src/types/index.ts)**
   - Campos `email_sent?: boolean`
   - Campo `email_sent_at?: string`

3. **[.env.example](.env.example)**
   - Variável `VITE_RESEND_API_KEY`

## 🎯 Como Usar

### Na Interface

1. Acesse a página **Serviços** (`/services`)
2. Clique no ícone de **olho** para ver detalhes de uma viagem
3. Se a viagem tiver anexos, você verá o botão **"Enviar para Cliente"**
4. Clique para enviar
5. Aguarde confirmação
6. O badge **"Enviado [data]"** aparecerá

### Validações

O sistema valida automaticamente:

- ❌ **Sem anexos**: "Não há anexos para enviar"
- ❌ **Sem email**: "Cliente não possui email cadastrado"
- ✅ **Sucesso**: "Email enviado com sucesso para cliente@email.com"
- ❌ **Erro**: "Erro ao enviar email. Tente novamente."

### Reenvio

- Emails podem ser reenviados quantas vezes necessário
- O botão muda para "Enviar para Cliente" novamente
- A data do último envio é sempre atualizada

## 🧪 Testando

### Teste Local (sem API key)

Se você não configurar a API key, o sistema vai retornar erro ao tentar enviar:

```
Erro ao enviar email. Tente novamente.
```

### Teste com Resend (domínio padrão)

1. Configure a API key no `.env`
2. Reinicie o servidor (`npm run dev`)
3. Tente enviar um email
4. Email será enviado de `onboarding@resend.dev`

⚠️ **Atenção**: O domínio padrão tem limitações:
- Apenas para testes
- Pode cair em spam
- Limite de 100 emails/dia

### Teste com Domínio Verificado

1. Verifique seu domínio no Resend
2. Atualize o `from` no código
3. Emails serão enviados do seu domínio
4. Maior taxa de entrega

## 🔍 Troubleshooting

### Problema: Email não enviado

**Possíveis causas**:
1. API key não configurada
2. API key inválida
3. Limite de envio excedido (domínio padrão)

**Solução**:
1. Verifique o arquivo `.env`
2. Verifique os logs do console do navegador
3. Verifique o [Dashboard do Resend](https://resend.com/emails)

### Problema: Email cai em spam

**Solução**:
1. Verifique seu próprio domínio no Resend
2. Configure SPF, DKIM e DMARC
3. Use um domínio profissional

### Problema: Links de download não funcionam

**Possíveis causas**:
1. URLs dos anexos expiraram
2. Permissões do Supabase Storage incorretas

**Solução**:
1. Verifique as políticas RLS do bucket `trip-attachments`
2. Gere URLs com maior tempo de expiração
3. Configure o bucket como público (se apropriado)

### Problema: "Cliente não possui email cadastrado"

**Solução**:
1. Vá em **Cadastros > Clientes**
2. Edite o cliente
3. Adicione um email válido
4. Salve

## 📊 Monitoramento

### Via Interface

- Badge "Enviado" aparece após envio bem-sucedido
- Data do envio é exibida
- Status pode ser verificado na lista de viagens

### Via Resend Dashboard

1. Acesse [resend.com/emails](https://resend.com/emails)
2. Veja todos os emails enviados
3. Status de entrega
4. Taxa de abertura (se configurado)

### Via Banco de Dados

```sql
-- Ver viagens com emails enviados
SELECT
  id,
  origin,
  destination,
  email_sent,
  email_sent_at
FROM trips
WHERE email_sent = true
ORDER BY email_sent_at DESC;
```

## 💰 Limites do Resend

### Plano Gratuito
- ✅ 100 emails/dia
- ✅ 1 domínio verificado
- ✅ API access
- ❌ Webhooks limitados

### Plano Pro ($20/mês)
- ✅ 50.000 emails/mês
- ✅ Domínios ilimitados
- ✅ Webhooks completos
- ✅ Analytics avançado

[Ver preços completos](https://resend.com/pricing)

## 🔐 Segurança

### Boas Práticas

1. **NUNCA** comite o arquivo `.env` no Git
2. Use variáveis de ambiente no servidor de produção
3. Rotacione a API key periodicamente
4. Use domínio verificado em produção
5. Configure políticas de acesso no Supabase Storage

### Configuração de Produção

```bash
# No servidor (Vercel, Netlify, etc)
VITE_RESEND_API_KEY=re_sua_chave_de_producao
```

## 📚 Links Úteis

- [Documentação do Resend](https://resend.com/docs)
- [SDK do Resend (Node.js)](https://resend.com/docs/send-with-nodejs)
- [Verificar Domínio](https://resend.com/docs/dashboard/domains/introduction)
- [Email Templates](https://resend.com/docs/dashboard/templates/introduction)
- [API Reference](https://resend.com/docs/api-reference/introduction)

## 🎨 Personalização

### Customizar Template

Edite [src/services/emailService.ts](src/services/emailService.ts):

```typescript
// Linha 50: Alterar cores, fonte, layout
const htmlContent = `
<!DOCTYPE html>
<html>
<!-- Seu HTML aqui -->
</html>
`;
```

### Adicionar Logo da Empresa

```typescript
<div style="text-align: center; margin-bottom: 20px;">
  <img src="https://sua-url.com/logo.png" alt="Logo" style="width: 150px;">
</div>
```

### Mudar Assunto do Email

```typescript
// Linha 123
subject: `[OLogX] Anexos de Viagem - ${trip.origin} → ${trip.destination}`,
```

## ✨ Próximas Melhorias

- [ ] Anexar arquivos diretamente no email (não apenas links)
- [ ] Configurar webhooks para rastrear abertura
- [ ] Email de confirmação de recebimento
- [ ] Envio em lote para múltiplos clientes
- [ ] Template personalizado por empresa
- [ ] Suporte a múltiplos idiomas

---

**Última atualização**: 2025-11-12

**Desenvolvido para**: Ologx Transportes

**Integração**: Resend Email API
