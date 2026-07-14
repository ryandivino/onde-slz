import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type DenunciaResumo = {
  pulso_id: number
  texto: string
  apelido: string | null
  nome_local: string | null
  categoria: string
  is_fixed: boolean
  user_id: string | null
  post_created_at: string
  total_denuncias: number
}

export const MOTIVOS_DENUNCIA = ['SPAM', 'CONTEÚDO INAPROPRIADO', 'INFORMAÇÃO FALSA', 'OUTRO']

export function useDenuncias() {
  const { session } = useAuth()
  const [resumo, setResumo] = useState<DenunciaResumo[]>([])
  const [carregando, setCarregando] = useState(false)

  const carregarResumo = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase.from('denuncias_resumo').select('*')
    setResumo(data || [])
    setCarregando(false)
  }, [])

  useEffect(() => { carregarResumo() }, [carregarResumo])

  const denunciar = async (pulsoId: number, motivo: string) => {
    if (!session?.user) return { error: new Error('Você precisa estar logado para denunciar.') }

    const { error } = await supabase.from('denuncias').insert([
      { pulso_id: pulsoId, denunciante_id: session.user.id, motivo }
    ])

    if (error) {
      if (error.code === '23505') return { error: new Error('Você já denunciou esse post.') }
      return { error }
    }
    return { error: null }
  }

  return { resumo, carregando, denunciar, recarregarResumo: carregarResumo }
}