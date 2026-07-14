import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type Notificacao = {
  id: number
  destinatario_id: string | null
  tipo: 'pedido_amizade' | 'post_amigo' | 'convite_role' | 'resumo_semanal' | 'evento' | 'atualizacao' | 'admin'
  titulo: string
  mensagem: string | null
  lat: number | null
  lng: number | null
  referencia_id: number | null
  criado_por: string | null
  created_at: string
}

export function useNotificacoes() {
  const { session, usuarioLogado } = useAuth()
  const meuId = session?.user.id

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [idsLidos, setIdsLidos] = useState<Set<number>>(new Set())
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!meuId) { setNotificacoes([]); setIdsLidos(new Set()); setCarregando(false); return }
    setCarregando(true)

    const { data: notifs } = await supabase
      .from('notificacoes')
      .select('*')
      .or(`destinatario_id.eq.${meuId},destinatario_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: lidas } = await supabase
      .from('notificacoes_lidas')
      .select('notificacao_id')
      .eq('user_id', meuId)

    setNotificacoes(notifs || [])
    setIdsLidos(new Set((lidas || []).map((l) => l.notificacao_id)))
    setCarregando(false)
  }, [meuId])

  useEffect(() => { carregar() }, [carregar])

  const naoLidas = useMemo(
    () => notificacoes.filter((n) => !idsLidos.has(n.id)),
    [notificacoes, idsLidos]
  )

  const marcarComoLida = async (notificacaoId: number) => {
    if (!meuId) return
    await supabase.from('notificacoes_lidas').upsert(
      { notificacao_id: notificacaoId, user_id: meuId },
      { onConflict: 'notificacao_id,user_id' }
    )
    setIdsLidos((s) => new Set(s).add(notificacaoId))
  }

  const marcarTodasComoLidas = async () => {
    if (!meuId || naoLidas.length === 0) return
    const linhas = naoLidas.map((n) => ({ notificacao_id: n.id, user_id: meuId }))
    await supabase.from('notificacoes_lidas').upsert(linhas, { onConflict: 'notificacao_id,user_id' })
    setIdsLidos((s) => {
      const novo = new Set(s)
      naoLidas.forEach((n) => novo.add(n.id))
      return novo
    })
  }

  return {
    notificacoes,
    naoLidas,
    totalNaoLidas: naoLidas.length,
    carregando,
    marcarComoLida,
    marcarTodasComoLidas,
    recarregar: carregar
  }
}