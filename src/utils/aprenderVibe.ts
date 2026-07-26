import { supabase } from '../supabase'
import type { Categoria } from './interpretarVibe'

const PALAVRAS_IGNORADAS = new Set([
  'para', 'com', 'que', 'uma', 'um', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na',
  'nos', 'nas', 'e', 'ou', 'mas', 'se', 'ja', 'já', 'hoje', 'agora', 'aqui', 'ali',
  'isso', 'esse', 'essa', 'este', 'esta', 'muito', 'bem', 'mais', 'mesmo', 'ser', 'tem',
  'vou', 'foi', 'era', 'sao', 'são', 'meu', 'minha', 'seu', 'sua', 'como', 'quando',
  'pra', 'por', 'sem', 'até', 'ate'
])

export async function aprenderComPost(categoria: string, texto: string) {
  const palavras = texto
    .toLowerCase()
    .replace(/[^a-zà-ú\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length >= 3 && p.length <= 25 && !PALAVRAS_IGNORADAS.has(p))

  const palavrasUnicas = [...new Set(palavras)]

  for (const palavra of palavrasUnicas) {
    supabase.rpc('aprender_palavra', { categoria_in: categoria, palavra_in: palavra }).then(() => {})
  }
}

export async function interpretarComIA(texto: string): Promise<Categoria | null> {
  try {
    const { data, error } = await supabase.functions.invoke('interpretar-vibe-ia', { body: { texto } })
    if (error || !data?.categoria) return null

    const categoria = data.categoria as Categoria
    if (categoria !== 'OUTROS') aprenderComPost(categoria, texto)

    return categoria
  } catch {
    return null
  }
}