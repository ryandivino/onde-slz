import { createClient } from '@supabase/supabase-js'

// Resgata as variáveis do ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// DIAGNÓSTICO EM TEMPO DE EXECUÇÃO: Evita a tela branca e avisa exatamente o que falta
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERRO CRÍTICO NO .ENV:\n" +
    "O Vite não conseguiu ler as chaves do banco de dados.\n" +
    "Verifique se o arquivo .env está na raiz correta do projeto e reinicie o terminal."
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-para-evitar-crash.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)