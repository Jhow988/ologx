# ⚡ Quick Start - Rodar OLogX AGORA

Siga estes passos para ter o projeto rodando em **5-10 minutos**.

---

## 🎯 Passo 1: Verificar Supabase

Você já tem o projeto Supabase criado com as credenciais no `.env`.

Vamos aplicar as **políticas de segurança RLS**:

1. Abra o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo `docs/RLS_POLICIES.md`
5. **Copie TODO o conteúdo** (todos os comandos SQL)
6. **Cole no SQL Editor** e clique em **Run**
7. ✅ Confirme que executou sem erros

---

## 🎯 Passo 2: Criar Usuário de Teste

No **SQL Editor** do Supabase, execute:

```sql
-- 1. Criar empresa de teste
INSERT INTO companies (name)
VALUES ('Transportadora Teste')
RETURNING id;
```

**Copie o UUID retornado!** (será algo como: `550e8400-e29b-41d4-a716-446655440000`)

Agora crie o usuário:

1. No Supabase, vá em **Authentication** > **Users**
2. Clique em **"Add user"** > **"Create new user"**
3. Preencha:
   - Email: `admin@teste.com`
   - Password: `teste123456`
   - ✅ Marque **"Auto Confirm User"**
4. Clique em **Create**
5. **Copie o User UID** que aparece

Agora vincule ao profile no **SQL Editor**:

```sql
-- Substitua os UUIDs pelos valores que você copiou!
INSERT INTO profiles (id, company_id, full_name, role, is_super_admin)
VALUES (
  'UUID-DO-USUARIO-AUTH', 7b15bc5b-76f8-487c-9b18-89cafb53e9f6
  'UUID-DA-EMPRESA', c852f012-4844-481f-adfa-2f422ca28912
  'Admin Teste',
  'admin',
  true
);
```

✅ Usuário criado!

---

## 🎯 Passo 3: Rodar Localmente

Abra o terminal nesta pasta e execute:

```bash
# Instalar dependências (apenas na primeira vez)
npm install

# Rodar em desenvolvimento
npm run dev
```

Aguarde abrir em: `http://localhost:5173`

---

## 🎯 Passo 4: Testar Login

1. Acesse `http://localhost:5173`
2. Faça login com:
   - **Email**: `admin@teste.com`
   - **Senha**: `teste123456`
3. Você deve ser redirecionado para o dashboard!

---

## 🎯 Passo 5: Testar Funcionalidades

### Criar um Cliente

1. No menu lateral, vá em **"Cadastros"** > **"Clientes"**
2. Clique em **"Novo Cliente"**
3. Preencha:
   - Nome: `Cliente Exemplo LTDA`
   - Email: `contato@exemplo.com`
   - Telefone: `(11) 91234-5678`
   - CPF/CNPJ: `12.345.678/0001-90`
   - Cidade: `São Paulo`
   - Estado: `SP`
4. Clique em **"Salvar"**
5. ✅ Deve aparecer um toast de sucesso e o cliente na lista!

### Criar um Veículo

1. Vá em **"Cadastros"** > **"Frota"**
2. Clique em **"Novo Veículo"**
3. Preencha:
   - Placa: `ABC-1234`
   - Marca: `Scania`
   - Modelo: `R450`
   - Ano: `2023`
   - Status: `Ativo`
4. Clique em **"Salvar"**
5. ✅ Veículo criado!

### Criar uma Viagem

1. Vá em **"Viagens"**
2. Clique em **"Novo Serviço"**
3. Preencha os dados da viagem
4. ✅ Viagem criada!

---

## 🎉 Funcionou?

Se tudo funcionou, você está pronto para:

1. **Desenvolvimento**: Continue desenvolvendo localmente
2. **Deploy**: Siga o guia [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## 🐛 Problemas?

### ❌ Erro ao fazer login

**Causa**: Profile não criado ou `company_id` inválido

**Solução**: Verifique se executou o SQL do Passo 2 corretamente

### ❌ "Row Level Security" error

**Causa**: RLS policies não aplicadas

**Solução**: Execute novamente os comandos do arquivo `docs/RLS_POLICIES.md`

### ❌ Página em branco após login

**Causa**: AuthContext não conseguiu carregar o profile

**Solução**: Abra o Console do navegador (F12) e veja o erro. Provavelmente é RLS.

### ❌ Dados não aparecem

**Causa**: `company_id` do usuário diferente dos dados

**Solução**: Certifique-se que o `company_id` no profile é o mesmo da empresa criada

---

## 📚 Próximos Passos

✅ **Ambiente local rodando?** Ótimo!

Agora você pode:

1. **Continuar desenvolvendo** localmente
2. **Fazer deploy** seguindo [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
3. **Estudar os hooks** em [src/hooks/README.md](src/hooks/README.md)

---

## 🔗 Links Úteis

- **Supabase Dashboard**: https://app.supabase.com
- **Documentação dos Hooks**: [src/hooks/README.md](src/hooks/README.md)
- **Guia de Deploy**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **Checklist de Deploy**: [scripts/deploy-checklist.md](scripts/deploy-checklist.md)

---

**Divirta-se! 🚀**
