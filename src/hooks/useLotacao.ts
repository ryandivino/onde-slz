import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export type StatusLotacao = 'CHEIO' | 'MODERADO' | 'TRANQUILO'

type Checkin = { pulso_id: number; user_id: string; status: StatusLotacao; created_at: string }

export type ResumoLotacao = {
  status: StatusLotacao
  totalVotos: number
  atualizadoEm: string
}

const JANELA_MINUTOS = 90

export function useLotacao() {
  const { session } = useAuth()
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const limite = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('lotacao_checkins')
      .select('*')
      .gte('created_at', limite)
    setCheckins(data || [])
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 60000) // atualiza a cada minuto (janela é relativa ao tempo)
    return () => clearInterval(intervalo)
  }, [carregar])

  const resumoPorLocal = (pulsoId: number): ResumoLotacao | null => {
    const votos = checkins.filter((c) => c.pulso_id === pulsoId)
    if (votos.length === 0) return null

    const contagem: Record<StatusLotacao, number> = { CHEIO: 0, MODERADO: 0, TRANQUILO: 0 }
    let maisRecente = votos[0].created_at
    votos.forEach((v) => {
      contagem[v.status]++
      if (new Date(v.created_at) > new Date(maisRecente)) maisRecente = v.created_at
    })

    const statusMaisComum = (Object.keys(contagem) as StatusLotacao[]).reduce((a, b) =>
      contagem[a] >= contagem[b] ? a : b
    )

    return { status: statusMaisComum, totalVotos: votos.length, atualizadoEm: maisRecente }
  }

  const meuVotoPorLocal = (pulsoId: number): StatusLotacao | null => {
    if (!session?.user) return null
    const meu = checkins.find((c) => c.pulso_id === pulsoId && c.user_id === session.user.id)
    return meu?.status ?? null
  }

  const votar = async (pulsoId: number, status: StatusLotacao) => {
    if (!session?.user) return { error: new Error('Não autenticado.') }
    const { error } = await supabase.from('lotacao_checkins').upsert(
      { pulso_id: pulsoId, user_id: session.user.id, status, created_at: new Date().toISOString() },
      { onConflict: 'pulso_id,user_id' }
    )
    if (!error) await carregar()
    return { error }
  }

  return { checkins, resumoPorLocal, meuVotoPorLocal, votar, carregando, recarregar: carregar }
}