const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addCnhColumn() {
  console.log('🔧 Adicionando coluna cnh_due_date à tabela profiles...\n');

  try {
    // Verificar se a coluna já existe
    const { data: columns, error: checkError } = await supabase
      .from('profiles')
      .select('cnh_due_date')
      .limit(1);

    if (!checkError) {
      console.log('✅ A coluna cnh_due_date já existe na tabela profiles');
      return;
    }

    // Se erro foi "column does not exist", então precisamos adicionar
    if (checkError.message.includes('cnh_due_date')) {
      console.log('📝 Coluna não existe, executando ALTER TABLE...\n');

      // Executar SQL diretamente usando RPC ou através do dashboard
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnh_due_date DATE;'
      });

      if (alterError) {
        console.error('❌ Erro ao adicionar coluna:', alterError);
        console.log('\n⚠️  Execute manualmente no SQL Editor do Supabase Dashboard:');
        console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnh_due_date DATE;');
        process.exit(1);
      }

      console.log('✅ Coluna cnh_due_date adicionada com sucesso!\n');
    } else {
      console.error('❌ Erro inesperado ao verificar coluna:', checkError);
      console.log('\n⚠️  Execute manualmente no SQL Editor do Supabase Dashboard:');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnh_due_date DATE;');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('\n⚠️  Execute manualmente no SQL Editor do Supabase Dashboard:');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnh_due_date DATE;');
    process.exit(1);
  }
}

addCnhColumn();
