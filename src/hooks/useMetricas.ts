import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

// Registra uma "abertura de app" por sessão de navegador (não a cada re-render).
export function useRegistrarAbertura() {
  const { session } = useAuth()

  useEffect(() => {
    const jaRegistrouNessaAba = sessionStorage.getItem('onde_abertura_registrada')
    if (jaRegistrouNessaAba) return

    supabase.from('metricas_uso').insert([{ user_id: session?.user?.id ?? null }]).then(() => {
      sessionStorage.setItem('onde_abertura_registrada', 'true')
    })
  }, [session?.user?.id])
}

export type Estatisticas = {
  totalGeral: number
  ultimos7Dias: number
  hoje: number
  usuariosUnicos7Dias: number
}

export function useEstatisticas() {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)

    const agora = new Date()
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString()
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [{ count: totalGeral }, { count: ultimos7Dias }, { count: hoje }, { data: linhas7Dias }] = await Promise.all([
      supabase.from('metricas_uso').select('*', { count: 'exact', head: true }),
      supabase.from('metricas_uso').select('*', { count: 'exact', head: true }).gte('created_at', seteDiasAtras),
      supabase.from('metricas_uso').select('*', { count: 'exact', head: true }).gte('created_at', inicioHoje),
      supabase.from('metricas_uso').select('user_id').gte('created_at', seteDiasAtras).not('user_id', 'is', null)
    ])

    const usuariosUnicos7Dias = new Set((linhas7Dias || []).map((l) => l.user_id)).size

    setEstatisticas({
      totalGeral: totalGeral ?? 0,
      ultimos7Dias: ultimos7Dias ?? 0,
      hoje: hoje ?? 0,
      usuariosUnicos7Dias
    })
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  return { estatisticas, carregando, recarregar: carregar }
}