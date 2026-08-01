import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type Resposta = {
  id: number
  pulso_id: number
  user_id: string
  texto: string
  created_at: string
  apelido?: string
  avatar_url?: string | null
  verificado?: boolean
}

export function useRespostas(pulsoId: number | null, carregarAoAbrir: boolean) {
  const { session } = useAuth()
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // A contagem é sempre buscada (é só um número, barato) — a lista
  // completa (com apelido/avatar de cada um) só é buscada quando a pessoa
  // de fato expande, pra não gastar banda sem necessidade.
  const carregarContagem = useCallback(async () => {
    if (pulsoId === null) return
    const { count } = await supabase.from('respostas').select('*', { count: 'exact', head: true }).eq('pulso_id', pulsoId)
    setTotal(count || 0)
  }, [pulsoId])

  useEffect(() => { carregarContagem() }, [carregarContagem])

  const carregar = useCallback(async () => {
    if (pulsoId === null) return
    setCarregando(true)

    const { data: linhas } = await supabase
      .from('respostas')
      .select('*')
      .eq('pulso_id', pulsoId)
      .order('created_at', { ascending: true })

    if (linhas && linhas.length > 0) {
      const idsUnicos = [...new Set(linhas.map((r) => r.user_id))]
      const { data: perfis } = await supabase.from('profiles').select('id, apelido, avatar_url, verificado').in('id', idsUnicos)
      const mapaPerfis = Object.fromEntries((perfis || []).map((p) => [p.id, p]))

      setRespostas(linhas.map((r) => ({ ...r, apelido: mapaPerfis[r.user_id]?.apelido, avatar_url: mapaPerfis[r.user_id]?.avatar_url, verificado: mapaPerfis[r.user_id]?.verificado })))
    } else {
      setRespostas([])
    }
    setTotal(linhas?.length || 0)

    setCarregando(false)
  }, [pulsoId])

  useEffect(() => {
    if (carregarAoAbrir) carregar()
  }, [carregarAoAbrir, carregar])

  const enviarResposta = async (texto: string) => {
    if (!session?.user || pulsoId === null || !texto.trim()) return { error: new Error('Não foi possível enviar.') }
    setEnviando(true)
    const { error } = await supabase.from('respostas').insert([{ pulso_id: pulsoId, user_id: session.user.id, texto: texto.trim() }])
    setEnviando(false)
    if (!error) await carregar()
    return { error }
  }

  const apagarResposta = async (id: number) => {
    const { error } = await supabase.from('respostas').delete().eq('id', id)
    if (!error) await carregar()
    return { error }
  }

  return { respostas, total, carregando, enviando, enviarResposta, apagarResposta, recarregar: carregar }
}