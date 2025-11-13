# 🚀 Setup Rápido - Resend Email

## Passos Necessários

### 1. Criar conta no Resend
- Acesse [resend.com](https://resend.com) e crie uma conta

### 2. Obter API Key
- Vá em [Dashboard > API Keys](https://resend.com/api-keys)
- Crie uma nova API key
- Copie a chave (começa com `re_`)

### 3. Configurar ambiente
Crie um arquivo `.env` na raiz do projeto (se não existir) e adicione:

```bash
VITE_RESEND_API_KEY=re_sua_chave_aqui
```

### 4. Executar migration do banco
No Supabase SQL Editor, execute:

```sql
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_trips_email_sent ON trips(email_sent);
```

### 5. Reiniciar servidor
```bash
npm run dev
```

## Pronto!

Agora você pode enviar emails para clientes através da página de Serviços.

Para mais detalhes, consulte [README_RESEND_EMAIL.md](README_RESEND_EMAIL.md)
