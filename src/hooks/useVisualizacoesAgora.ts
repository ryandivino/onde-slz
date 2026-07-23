import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type Visualizacao = {
  userId: string
  apelido: string
  avatarUrl: string | null
  curtiu: boolean
}

export function useVisualizacoesAgora() {
  const { session } = useAuth()
  const [carregando, setCarregando] = useState(false)

  const registrarVisualizacao = async (pulsoId: number, autorId: string | null) => {
    if (!session?.user || autorId === session.user.id) return
    await supabase
      .from('visualizacoes_agora')
      .upsert([{ pulso_id: pulsoId, user_id: session.user.id }], { onConflict: 'pulso_id,user_id', ignoreDuplicates: true })
  }

  const buscarVisualizacoes = async (pulsoId: number): Promise<Visualizacao[]> => {
    setCarregando(true)

    const [{ data: vistos }, { data: curtidas }] = await Promise.all([
      supabase.from('visualizacoes_agora').select('user_id, created_at').eq('pulso_id', pulsoId).order('created_at', { ascending: false }),
      supabase.from('curtidas').select('user_id').eq('pulso_id', pulsoId)
    ])

    const idsCurtiram = new Set((curtidas || []).map((c) => c.user_id))
    const idsUnicos = [...new Set((vistos || []).map((v) => v.user_id))]

    let perfis: { id: string; apelido: string; avatar_url: string | null }[] = []
    if (idsUnicos.length > 0) {
      const { data } = await supabase.from('profiles').select('id, apelido, avatar_url').in('id', idsUnicos)
      perfis = data || []
    }
    const mapaPerfis = Object.fromEntries(perfis.map((p) => [p.id, p]))

    setCarregando(false)

    return (vistos || []).map((v) => ({
      userId: v.user_id,
      apelido: mapaPerfis[v.user_id]?.apelido || 'usuário',
      avatarUrl: mapaPerfis[v.user_id]?.avatar_url || null,
      curtiu: idsCurtiram.has(v.user_id)
    }))
  }

  return { carregando, registrarVisualizacao, buscarVisualizacoes }
}